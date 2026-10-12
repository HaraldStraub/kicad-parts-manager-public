"""Local KiCad library inventory. Reads originals; writes a separate rebuildable index."""
from .transistor_taxonomy import transistor_category
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import re
from .taxonomy import functional_category, simulation_category, passive_category, magnetic_category
from .selection_taxonomy import selection_category

TOKEN = re.compile(r'\(|\)|"(?:\\.|[^"\\])*"|[^\s()]+')
VARIABLE = re.compile(r'\$\{([^}]+)\}')


def parse(text):
    stack, roots = [], []
    for match in TOKEN.finditer(text):
        token = match.group()
        if token == '(':
            node = []
            (stack[-1] if stack else roots).append(node)
            stack.append(node)
        elif token == ')':
            if not stack:
                raise ValueError('Unbalanced closing parenthesis')
            stack.pop()
        else:
            if not stack:
                raise ValueError('Token outside S-expression')
            if token.startswith('"'):
                token = token[1:-1]
                if '\\' in token:token = re.sub(r'\\(["\\nrt])', lambda m: {'n':'\n','r':'\r','t':'\t'}.get(m[1], m[1]), token)
            stack[-1].append(token)
    if stack or len(roots) != 1:
        raise ValueError('Incomplete S-expression')
    return roots[0]


def children(node, key):
    return [n for n in node if isinstance(n, list) and n and n[0] == key]


def field(node, key, default=''):
    nodes = children(node, key)
    return nodes[0][1] if nodes and len(nodes[0]) > 1 else default


def resolve(value, variables, base):
    for _ in range(10):
        expanded = VARIABLE.sub(lambda m: variables.get(m[1], m[0]), value)
        if expanded == value:
            break
        value = expanded
    path = Path(value).expanduser()
    return path if path.is_absolute() else base / path


def tables(path, variables, warnings, seen=None, *, dependencies_only=False):
    seen = seen if seen is not None else set()
    path = path.resolve()
    if path in seen:
        return {}
    seen.add(path)
    if not path.is_file():
        warnings.append(f'Bibliothekstabelle fehlt: {path}')
        return {}
    result = {}
    try:
        tree = parse(path.read_text(encoding='utf-8-sig'))
        for lib in children(tree, 'lib'):
            name, kind = field(lib, 'name'), field(lib, 'type')
            if children(lib, 'disabled'):
                continue
            if dependencies_only and kind != 'Table':
                continue
            uri = resolve(field(lib, 'uri'), variables, path.parent)
            if kind == 'Table':
                result.update(tables(uri, variables, warnings, seen, dependencies_only=dependencies_only))
            elif kind == 'KiCad':
                result[name] = uri
            else:
                warnings.append(f'{name}: Bibliothekstyp {kind} wird nicht als Datei eingelesen')
    except (OSError, ValueError) as error:
        warnings.append(f'{path}: {error}')
    return result


def properties(symbols):
    """Resolve derived symbols, with explicit empty child properties overriding parents."""
    cache = {}
    def get(name, visiting=None):
        if name in cache:
            return cache[name]
        visiting = set() if visiting is None else visiting
        if name in visiting or name not in symbols:
            raise ValueError(f'Invalid symbol inheritance: {name}')
        visiting.add(name)
        symbol = symbols[name]
        parent = field(symbol, 'extends')
        result = dict(get(parent, visiting)) if parent else {}
        result.update({p[1]: p[2] for p in children(symbol, 'property') if len(p) >= 3})
        visiting.remove(name)
        cache[name] = result
        return result
    return get


def diode_category(library, name, description):
    words = (library + ' ' + name + ' ' + description).lower()
    base = 'semiconductor/diode/'
    if 'bridge' in words or 'brück' in words:
        return base + 'bridge'
    if re.search(r'\btvs\b|transient.*suppress|transil', words):
        return base + 'tvs'
    if 'zener' in words:
        return base + 'zener'
    if 'schottky' in words:
        return base + 'schottky'
    if 'rectifier' in words or 'rectifying' in words:
        return base + 'rectifier'
    if re.search(r'fast.*switch|switching diode|small signal', words):
        return base + 'switching'
    if 'varicap' in words or 'varactor' in words:
        return base + 'varactor'
    if 'laser' in words:
        return base + 'laser'
    if 'photo' in words:
        return base + 'photodiode'
    return base + 'other'


def category(library, name, description):
    simulation = simulation_category(library, name, description)
    if simulation:
        return simulation
    transistor = transistor_category(library, name, description)
    if transistor:
        return transistor
    selection = selection_category(library, name, description)
    if selection:
        return selection
    passive = passive_category(library, name, description)
    if passive:
        return passive
    magnetic = magnetic_category(library, name, description)
    if magnetic:
        return magnetic
    lower = description.lower()
    if library.startswith('Transistor_FET') or 'Transistors-FETs' in library:
        base = 'semiconductor/transistor/fet'
        if 'mosfet' in lower:
            base += '/mosfet'
        elif 'jfet' in lower:
            base += '/jfet'
        else:
            return base + '/other'
        if re.search(r'\bn[- ]channel\b', lower):
            base += '/n_channel'
        elif re.search(r'\bp[- ]channel\b', lower):
            base += '/p_channel'
        return base
    if library.startswith('Transistor_BJT'):
        base = 'semiconductor/transistor/bjt'
        return base + '/npn' if re.search(r'\bnpn\b',lower) and not re.search(r'\bpnp\b',lower) else base + '/pnp' if re.search(r'\bpnp\b',lower) and not re.search(r'\bnpn\b',lower) else base + '/other'
    if library.startswith('Transistor_IGBT'):
        return 'semiconductor/transistor/igbt'
    if library.startswith('Transistor'):
        return 'semiconductor/transistor/other'
    if library.startswith('Diode') or 'Diodes' in library:
        return diode_category(library, name, description)
    if library.startswith('Capacitor'):
        return 'passive/capacitor/' + library
    if library.startswith('Inductor') and re.search(r'common.mode',description,re.I):
        return 'passive/common_mode_choke'
    if library.startswith('Inductor'):
        return 'passive/inductor/' + library
    if library.startswith('Resistor'):
        return 'passive/resistor/' + library
    functional = functional_category(library, name, description)
    if functional:
        return functional
    if library == 'Device':
        if name in ('R', 'R_Small', 'R_US', 'R_Small_US'):
            return 'passive/resistor'
        if name in ('C', 'C_Small', 'C_Polarized', 'C_Polarized_Small'):
            return 'passive/capacitor'
        if name in ('L', 'L_Small'):
            return 'passive/inductor'
        if name.startswith('D'):
            return diode_category(library, name, description)
    return 'unassigned/' + library


def scan(config, share, project=None, extra_roots=(), user_home=None, progress=None, progress_data=None, previous=None, include_previews=False, check_cancel=None, source_only=False):
    warnings = []
    check_cancel=check_cancel or (lambda:None)
    check_cancel()
    if include_previews:
        from .geometry import symbol_geometry
        from .previews import geometry
    if progress_data:progress_data(dict(phase='discover'))
    user_home = user_home or Path.home()
    variables = {} if source_only else dict(os.environ)
    common = config / 'kicad_common.json'
    if common.is_file():
        variables.update(json.loads(common.read_text(encoding='utf-8')).get('environment', {}).get('vars', {}))
    version = config.name
    major = version.split('.')[0]
    defaults = {f'KICAD{major}_SYMBOL_DIR': share/'symbols',
                f'KICAD{major}_FOOTPRINT_DIR': share/'footprints',
                f'KICAD{major}_3DMODEL_DIR': share/'3dmodels',
                f'KICAD{major}_3RD_PARTY': user_home/'Documents/KiCad'/version/'3rdparty'}
    for key, value in defaults.items():
        variables.setdefault(key, str(value))
    if project:
        variables['KIPRJMOD'] = str(project.resolve())
    symbol_libs = tables(config/'sym-lib-table', variables, warnings)
    footprint_libs = tables(config/'fp-lib-table', variables, warnings)
    if project:
        for filename, libs in [('sym-lib-table',symbol_libs),('fp-lib-table',footprint_libs)]:
            if (project/filename).is_file():
                libs.update(tables(project/filename, variables, warnings))
    registered_symbols = {p.resolve(): name for name,p in symbol_libs.items()}
    registered_footprints = {p.resolve(): name for name,p in footprint_libs.items()}
    symbol_files = dict(registered_symbols)
    footprint_dirs = dict(registered_footprints)
    roots = [share/'symbols', share/'footprints', Path(variables[f'KICAD{major}_3RD_PARTY']),
             user_home/'Documents/KiCad'/version/'symbols', user_home/'Documents/KiCad'/version/'footprints',
             *extra_roots]
    roots += [Path(v) for k,v in variables.items() if k.startswith('KICAD_') and k.endswith(('_LIBS','_LIB'))]
    if source_only:
        roots = [share/'symbols', share/'footprints', *extra_roots]
    visited_roots = []
    for root in roots:
        check_cancel()
        if not root.is_dir() or any(root.resolve().is_relative_to(p) for p in visited_roots):
            continue
        visited_roots.append(root.resolve())
        for path in root.rglob('*.kicad_sym'):
            check_cancel()
            symbol_files.setdefault(path.resolve(), path.stem)
        for path in root.rglob('*.pretty'):
            check_cancel()
            footprint_dirs.setdefault(path.resolve(), path.stem)
    context=sha256(json.dumps(variables,sort_keys=True).encode()).hexdigest()
    reusable=previous if previous and previous.get('cache_version')==1 and previous.get('cache_context')==context else {}
    stamps=reusable.get('source_stamps',{});source_stamps={};cached_symbols={};cached_footprints={}
    for row in reusable.get('components',[]):
        if row.get('kind')=='footprint':cached_footprints[row['source_file']]=row
        elif row.get('kind')=='library':cached_symbols.setdefault(row['source_file'],[]).append(row)
    def signature(path):
        stat=path.stat();stamp=[stat.st_mtime_ns,stat.st_size];source_stamps[str(path)]=stamp;return stamp
    model_exists={}
    def model_info(reference,base):
        resolved=resolve(reference,variables,base);key=str(resolved)
        if key not in model_exists:model_exists[key]=resolved.is_file()
        return dict(reference=reference,path=key,found=model_exists[key])
    footprints={};footprint_lookup = {}
    footprint_rows = []
    total_libraries=len(footprint_dirs)+len(symbol_files)
    if progress:
        progress(f'{len(symbol_files)} Symboldateien, {len(footprint_dirs)} Footprintbibliotheken gefunden.')
    for number, (folder, nickname) in enumerate(footprint_dirs.items(),1):
        if progress_data:progress_data(dict(phase='footprints',completed=number-1,total=total_libraries))
        if progress and (number == 1 or number % 25 == 0):
            progress(f'Footprints prüfen: Bibliothek {number}/{len(footprint_dirs)}')
        if not folder.is_dir():
            warnings.append(f'Footprintbibliothek fehlt: {folder}')
            continue
        for path in folder.glob('*.kicad_mod'):
            check_cancel()
            reference = f'{nickname}:{path.stem}'
            try:
                stamp=signature(path);cached=cached_footprints.get(str(path));tree=None
                reuse=cached and stamps.get(str(path))==stamp and cached['library']==nickname
                old_preview=(reusable.get('previews',{}).get('footprints',{}).get(str(path)))
                if not reuse or (include_previews and old_preview is None):tree=parse(path.read_text(encoding='utf-8-sig'))
                refs=[model['reference'] for model in cached['footprint_info']['models']] if reuse else [model[1] for model in children(tree,'model')]
                models=[model_info(ref,path.parent) for ref in refs]
                info=dict(reference=reference,found=True,path=str(path),models=models,registered=folder in registered_footprints)
                if reference not in footprint_lookup or info['registered']:footprint_lookup[reference]=info
                row=dict(id='FP-'+sha256(str(path).encode()).hexdigest()[:20],
                    name=path.stem, category='footprints/'+nickname, library=nickname, kind='footprint',
                    description=cached['description'] if reuse else field(tree,'descr'), manufacturer='', values={}, parameters=[], models=[], intrinsic=False,
                    symbol='', footprint=reference, footprint_info=info, symbol_found=False,
                    registered=info['registered'], source_file=str(path), datasheet='', kicad_reference=reference)
                if include_previews:
                    footprints[str(path)]=old_preview if reuse and old_preview is not None else geometry([node for node in tree if isinstance(node,list)],True)
                    row['footprint_preview_key']=str(path)
                footprint_rows.append(row)
            except (OSError, ValueError) as error:warnings.append(f'{path}: {error}')
    rows = []
    if progress_data:progress_data(dict(phase='footprints',completed=len(footprint_dirs),total=total_libraries))
    for number, (path, nickname) in enumerate(symbol_files.items(),1):
        if progress_data:progress_data(dict(phase='symbols',completed=len(footprint_dirs)+number-1,total=total_libraries))
        if progress and (number == 1 or number % 50 == 0):
            progress(f'Symbole prüfen: Datei {number}/{len(symbol_files)}')
        if not path.is_file():
            warnings.append(f'Symbolbibliothek fehlt: {path}')
            continue
        try:
            check_cancel();stamp=signature(path);cached=cached_symbols.get(str(path))
            if cached and stamps.get(str(path))==stamp and all(row['library']==nickname and (not include_previews or 'symbol_preview' in row) for row in cached):
                for old in cached:
                    check_cancel();row=dict(old);footprint=row.get('footprint');sim_file=(row.get('simulation_fields') or {}).get('Sim.Library')
                    row['footprint_info']=footprint_lookup.get(footprint,dict(reference=footprint,found=False,models=[]))
                    row['registered']=path in registered_symbols
                    row['category']=category(nickname,row['name'],row.get('description',''))
                    row['simulation_file_path']=str(resolve(sim_file,variables,path.parent)) if sim_file else None
                    row['simulation_file_found']=model_info(sim_file,path.parent)['found'] if sim_file else None
                    if include_previews and row['footprint_info'].get('path') in footprints:row['footprint_preview_key']=row['footprint_info']['path']
                    else:row.pop('footprint_preview_key',None)
                    rows.append(row)
                continue
            tree = parse(path.read_text(encoding='utf-8-sig'))
            symbols = {s[1]:s for s in children(tree,'symbol')}
            get_properties = properties(symbols)
            for name in symbols:
                check_cancel()
                try:
                    props = get_properties(name)
                except ValueError as error:
                    warnings.append(f'{path}: {error}')
                    continue
                reference = f'{nickname}:{name}'
                footprint = props.get('Footprint','')
                sim_props = {k:v for k,v in props.items() if k.startswith('Sim.') and v}
                sim_file = sim_props.get('Sim.Library','')
                intrinsic = sim_props.get('Sim.Device') in ('R','C','L') and not sim_file
                rows.append(dict(id='SYM-'+sha256((str(path)+'\0'+name).encode()).hexdigest()[:20],
                    name=name, category=category(nickname,name,props.get('Description','')), library=nickname,
                    kind='library', description=props.get('Description',''), manufacturer=props.get('Manufacturer',''), values={}, parameters=[],
                    models=[], intrinsic=intrinsic, symbol=reference, footprint=footprint or None,
                    footprint_info=footprint_lookup.get(footprint,dict(reference=footprint,found=False,models=[])),
                    symbol_found=True, registered=path in registered_symbols, source_file=str(path),
                    datasheet=props.get('Datasheet',''), simulation_fields=sim_props,
                    simulation_file_found=resolve(sim_file,variables,path.parent).is_file() if sim_file else None,
                    simulation_file_path=str(resolve(sim_file,variables,path.parent)) if sim_file else None,
                    kicad_reference=reference))
                if include_previews:
                    rows[-1]['symbol_preview']=symbol_geometry(tree,name,symbols=symbols)
                    info=rows[-1]['footprint_info']
                    if info.get('path') in footprints:rows[-1]['footprint_preview_key']=info['path']
        except (OSError, ValueError) as error:
            warnings.append(f'{path}: {error}')
    check_cancel()
    all_rows = rows + footprint_rows
    if progress_data:progress_data(dict(phase='symbols',completed=total_libraries,total=total_libraries))
    return dict(schema_version=1, scanned_at=datetime.now(timezone.utc).isoformat(),
                config=str(config), share=str(share), project=str(project) if project else None,user_home=str(user_home),
                extra_roots=[str(root) for root in extra_roots],
                cache_version=1,cache_context=context,source_stamps=source_stamps,
                **({'previews':{'footprints':footprints}} if include_previews else {}),
                components=all_rows, categories=sorted({r['category'] for r in all_rows}),
                counts=dict(symbols=len(rows),footprints=len(footprint_rows),symbol_libraries=len(symbol_files),
                            footprint_libraries=len(footprint_dirs)), warnings=warnings)


def default_share():
    system = Path(os.environ.get('PROGRAMFILES', 'C:/Program Files'))/'KiCad/10.0/share/kicad'
    user = Path(os.environ.get('LOCALAPPDATA',''))/'Programs/KiCad/10.0/share/kicad'
    return system if (system/'symbols').is_dir() else user


def main():
    parser = argparse.ArgumentParser(description='Installierte KiCad-Bibliotheken nur lesend katalogisieren')
    parser.add_argument('--config', type=Path, default=Path(os.environ.get('APPDATA', str(Path.home()/'.config')))/'kicad/10.0')
    parser.add_argument('--share', type=Path, default=default_share())
    parser.add_argument('--project', type=Path)
    parser.add_argument('--root', type=Path, action='append', default=[])
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[3]/'db/library-catalog.json')
    args = parser.parse_args()
    index = scan(args.config, args.share, args.project, args.root, progress=lambda message: print(message,flush=True))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp = args.output.with_suffix('.tmp')
    temp.write_text(json.dumps(index,ensure_ascii=False,allow_nan=False),encoding='utf-8')
    temp.replace(args.output)
    print(json.dumps(index['counts'],ensure_ascii=False))
    print(f"{len(index['warnings'])} Hinweise; Index: {args.output}")


if __name__ == '__main__':
    main()
