"""Register imported CERN sources, without changing original libraries or databases."""
import argparse
import json
import os
from pathlib import Path
from kicad_parts_manager.kicad.inventory import parse,children,field
from kicad_parts_manager.library_import import source_manifest

ROOT=Path(__file__).resolve().parents[1]

def append_entries(content, entries):
    existing={field(lib,'name'):lib for lib in children(parse(content),'lib')}
    additions=[]
    for name,kind,uri in entries:
        if name in existing:
            lib=existing[name]
            if field(lib,'type')!=kind or field(lib,'uri')!=uri:
                raise ValueError('Existing library name collision: '+name)
            continue
        q=lambda value:json.dumps(value,ensure_ascii=False)
        additions.append(' (lib (name '+q(name)+') (type '+q(kind)+') (uri '+q(uri)+') (options "") (descr "CERN imported source"))\n')
    end=content.rfind(')');result=content[:end]+''.join(additions)+content[end:]
    parse(result);return result

def setup(source, config, output, apply=False):
    source=Path(source).resolve();config=Path(config);output=Path(output).resolve()
    manifest=source_manifest(source)
    original=json.loads((source/'CERN_Windows.kicad_dbl').read_text(encoding='utf8'))
    definitions=original['libraries']
    for definition in definitions:
        # KiCad searches names/descriptions/keywords, not all visible custom fields.
        # CERN keys can abbreviate the MPN (RC0100 rather than RC0100FR-07100RL).
        definition['properties']=dict(definition.get('properties',{}),keywords='Manufacturer Part Number')
    if not definitions:raise ValueError('No CERN database tables found')
    database=source/'CERN.sqlite'
    derived=dict(original,name='CERN imported components',description='Complete locally imported CERN collection',libraries=definitions)
    derived['source']=dict(type='odbc',dsn='',username='',password='',timeout_seconds=5,connection_string='Driver={SQLite3 ODBC Driver};Database='+database.as_posix()+';ReadOnly=1;')
    dbl=output/'CERN.kicad_dbl'
    symbols=[(p.stem,'KiCad',p.as_posix()) for p in sorted((source/'SchLib').glob('*.kicad_sym'))]+[('CERN','Database',dbl.as_posix())]
    footprints=[(p.stem,'KiCad',p.as_posix()) for p in sorted((source/'PcbLib').glob('*.pretty')) if p.is_dir()]
    # Release candidate: additional attributed native sources, project-local only.
    open_sources=source.parent/'open-libraries'
    if open_sources.is_dir():
        for native in sorted(open_sources.glob('*/native')):
            symbols.extend((p.stem,'KiCad',p.as_posix()) for p in sorted((native/'symbols').glob('*.kicad_sym')))
            footprints.extend((p.stem,'KiCad',p.as_posix()) for p in sorted((native/'footprints').glob('*.pretty')))
    if len(symbols)==1 or not footprints:raise ValueError('CERN symbol or footprint collection missing')
    for _,kind,uri in symbols+footprints:
        if kind!='Database' and not Path(uri).exists():raise ValueError('Asset missing: '+uri)
    changes=[]
    for filename,entries in [('sym-lib-table',symbols),('fp-lib-table',footprints)]:
        path=config/filename
        before=path.read_text(encoding='utf-8-sig') if path.exists() else '('+filename.replace('-','_')+' (version 7))\n'
        changes.append((path,before,append_entries(before,entries)))
    if apply:
        output.mkdir(parents=True,exist_ok=True)
        config.mkdir(parents=True,exist_ok=True)
        dbl.write_text(json.dumps(derived,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        for path,before,after in changes:
            if before==after:continue
            if path.exists() and path.read_text(encoding='utf-8-sig')!=before:raise ValueError('Library table changed during setup')
            temporary=path.with_name(path.name+'.cern.tmp');temporary.write_text(after,encoding='utf8');os.replace(temporary,path)
    return dict(source_revision=manifest['revision'],database=str(database),definition=str(dbl),tables=len(definitions),symbol_libraries=len(symbols)-1,footprint_libraries=len(footprints),changed=[str(p) for p,a,b in changes if a!=b],applied=apply)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=Path,default=ROOT/'data/library-sources/cern-pilot')
    p.add_argument('--config',type=Path,default=Path(os.environ['APPDATA'])/'kicad/10.0')
    p.add_argument('--output',type=Path,default=ROOT/'kicad/cern-local')
    p.add_argument('--apply',action='store_true')
    a=p.parse_args();print(json.dumps(setup(a.source,a.config,a.output,a.apply),ensure_ascii=False))
