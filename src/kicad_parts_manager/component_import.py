"""Deterministic, local bundle preview. Original uploads are never edited.

All catalog mutations go through the shared import transaction. Each preview
owns an immutable, versioned asset directory; undo never deletes user files.
"""
import base64
import copy
import hashlib
import io
import json
import os
import math
from time import perf_counter
from pathlib import Path, PurePosixPath
import re
from threading import Lock
import uuid
from zipfile import ZipFile, BadZipFile
from urllib.parse import quote

from .kicad.inventory import TOKEN, parse, children, field, properties, category,diode_category
from .kicad.transistor_taxonomy import transistor_category
from .kicad.geometry import symbol_geometry
from .kicad.previews import geometry,footprint_geometry
from .library_import import digest, parameters, preview, read_store, apply_preview, undo_import, resolve_preview, merge_inventory, ASSET_FIELDS as ASSETS, asset_present
from .model_library import definitions, _symbol_pins
from .import_sim import candidates as sim_candidates, selected_model
from .manual_data import component_key, fields_for, FIELDS

MAX_BYTES=40_000_000

def atomic_json(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_name(path.name+'.'+uuid.uuid4().hex+'.tmp')
    try:
        with temporary.open('x',encoding='utf8') as f:
            json.dump(value,f,ensure_ascii=False,allow_nan=False);f.flush();os.fsync(f.fileno())
        temporary.replace(path)
    finally:temporary.unlink(missing_ok=True)

def documents_folder():
    if os.name=='nt':
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,r'Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders') as key:
            return Path(os.path.expandvars(winreg.QueryValueEx(key,'Personal')[0])).resolve()
    return Path.home()/'Documents'

def safe_name(name):
    if not isinstance(name,str) or not name or '\\' in name:raise ValueError('Invalid upload path')
    path=PurePosixPath(name)
    if path.is_absolute() or any(p in ('','..','.') or ':' in p or any(c in p for c in '<>"|?*') or p.endswith((' ','.')) for p in name.split('/')):
        raise ValueError('Unsafe upload path')
    if any(re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)',p,re.I) for p in path.parts):raise ValueError('Reserved upload filename')
    return path

def unpack(files,warnings=None):
    """Bounded ZIP extraction, no links, traversal, executables or nested ZIPs."""
    if not isinstance(files,list) or not 0<len(files)<=100:raise ValueError('Choose 1–100 files')
    result={};total=0;uploaded=0;seen=set()
    def add(name,raw):
        nonlocal total
        path=safe_name(name);key=str(path).casefold()
        if key in seen:
            previous=next(n for n in result if n.casefold()==key)
            if result[previous]==raw:
                if warnings is not None:warnings.append(dict(key='duplicate_identical',name=str(path)))
                return
            if warnings is not None and path.suffix.lower() in ('.step','.stp','.wrl','.pdf'):
                warnings.append(dict(key='duplicate_ignored',name=str(path)))
                return
            raise ValueError('Duplicate upload filename: '+str(path))
        seen.add(key);total+=len(raw)
        if len(result)>=500 or total>MAX_BYTES:raise ValueError('Expanded import exceeds 40 MB / 500 files')
        if path.suffix.lower() in ('.exe','.cmd','.bat','.ps1','.dll','.msi','.zip'):raise ValueError('Unsupported executable or nested archive: '+str(path))
        result[str(path)]=raw
    for item in files:
        name=str(safe_name(item['name']));raw=base64.b64decode(item['content'],validate=True);uploaded+=len(raw)
        if uploaded>MAX_BYTES:raise ValueError('Upload exceeds 40 MB')
        if name.lower().endswith('.zip'):
            try:
                with ZipFile(io.BytesIO(raw)) as archive:
                    if len(archive.infolist())>500:raise ValueError('Too many ZIP entries')
                    for member in archive.infolist():
                        safe_name(member.filename.rstrip('/'))
                        mode=(member.external_attr>>16)&0o170000
                        if mode not in (0,0o100000,0o040000):raise ValueError('ZIP links are not supported')
                        if member.is_dir():continue
                        if member.file_size>MAX_BYTES-total:raise ValueError('Expanded ZIP exceeds 40 MB')
                        add(member.filename,archive.read(member))
            except BadZipFile as error:raise ValueError('Invalid ZIP') from error
            # Retain the exact downloaded archive in addition to its originals.
            add('Archives/'+PurePosixPath(name).name+'.original',raw)
        else:add(name,raw)
    return result

def blocks(text,key,depth=1):
    """Return original top-level source spans; preserve all unknown KiCad syntax."""
    stack=[];result=[]
    for token in TOKEN.finditer(text):
        if token.group()=='(':stack.append(token.start())
        elif token.group()==')':
            start=stack.pop()
            if len(stack)==depth:
                chunk=text[start:token.end()]
                if re.match(r'\('+re.escape(key)+r'\s',chunk):result.append((start,token.end(),chunk))
    return result

def set_properties(text,symbol,values):
    for start,end,chunk in reversed(blocks(text,'symbol')):
        if parse(chunk)[1]!=symbol:continue
        for name,value in values.items():
            pattern=r'(\(property\s+'+re.escape(json.dumps(name))+r'\s+)"(?:\\.|[^"\\])*"'
            quoted=json.dumps(str(value),ensure_ascii=False)
            if re.search(pattern,chunk):chunk=re.sub(pattern,lambda m:m[1]+quoted,chunk,count=1)
            else:chunk=chunk[:-1]+'\n(property '+json.dumps(name)+' '+quoted+' (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))\n)'
        text=text[:start]+chunk+text[end:]
    parse(text)
    return text

def rewrite_3d(text,path):
    # A single chosen 3D file replaces foreign model paths in the working copy.
    # Preserve the active model's transform; orientation remains unverified.
    models=blocks(text,'model');active=[b for b in models if field(parse(b[2]),'hide')!='yes']
    chosen=active[0] if len(active)==1 else None
    if len(active)>1:raise ValueError('Multiple active 3D models require a separate assignment')
    for start,end,chunk in reversed(models):
        if chosen and start==chosen[0]:
            chunk=re.sub(r'^(\(model\s+)"(?:\\.|[^"\\])*"',lambda m:m[1]+json.dumps(path,ensure_ascii=False),chunk)
        else:chunk=''
        text=text[:start]+chunk+text[end:]
    if not chosen:text=text.rstrip()[:-1]+'\n(model '+json.dumps(path)+' (offset (xyz 0 0 0)) (scale (xyz 1 1 1)) (rotate (xyz 0 0 0)))\n)'
    parse(text);return text

class ComponentImport:
    def __init__(self,index,settings=None,default_root=None):
        self.index=Path(index);self.settings_path=Path(settings or self.index.with_name('user-import-settings.json'))
        self.default_root=Path(default_root) if default_root else None
        self.lock=Lock()
        self._store_stamp=None
        self._store_hash=None

    def store_hash(self):
        # Used only while self.lock is held. Applying an import still reads and
        # verifies the actual store independently before any catalog write.
        stamp=(self.index.stat().st_mtime_ns,self.index.stat().st_size) if self.index.exists() else ('missing',)
        if stamp!=self._store_stamp:
            self._store_hash=digest(read_store(self.index))
            self._store_stamp=stamp
        return self._store_hash

    def settings(self):
        saved=json.loads(self.settings_path.read_text(encoding='utf8')) if self.settings_path.exists() else {}
        root=Path(saved.get('folder') or self.default_root or documents_folder()/'KiCad-Parts-Manager'/'Benutzerbibliothek').resolve()
        return dict(folder=str(root),locked=bool(saved.get('used')))

    def change_folder(self,folder):
        with self.lock:
            old=self.settings()
            path=Path(folder).expanduser()
            if not path.is_absolute() or path.resolve()==Path(path.anchor) or any(c in str(path) for c in '\n\r\0'):raise ValueError('Choose an absolute user folder, not a drive root')
            if old['locked'] and str(path.resolve())!=old['folder']:raise ValueError('The library already contains imports. Moving it requires a separate migration.')
            atomic_json(self.settings_path,dict(folder=str(path.resolve()),used=old['locked']))
            return self.settings()

    def session_path(self,token):
        if not re.fullmatch(r'[a-f0-9]{32}',str(token)):raise ValueError('Invalid import session')
        return Path(self.settings()['folder'])/'Imports'/token

    def prepare(self,request,existing,progress=lambda update:None):
        with self.lock:
            started=perf_counter();progress(dict(phase='importFiles'));warnings=[];contents=unpack(request['files'],warnings);token=uuid.uuid4().hex;root=self.session_path(token)
            # Preview freezes its location too; changing settings must not orphan it.
            root.mkdir(parents=True,exist_ok=False)
            settings=self.settings()
            for name,raw in contents.items():
                path=root/'Originale'/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
            working=root/'Dateien';working.mkdir()
            manifest=dict(source_id='user-files',revision=digest({n:hashlib.sha256(b).hexdigest() for n,b in contents.items()}),license='Source file rights apply; retained originals',url='')
            (root/'source.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf8')
            alias='KPM_'+token[:12];footprints={};symbol_files=[];models=[];pdfs=[];steps=[];notes=[]
            for name,raw in contents.items():
                suffix=PurePosixPath(name).suffix.lower()
                if suffix=='.kicad_sym':symbol_files.append((name,raw.decode('utf-8-sig')))
                elif suffix=='.kicad_mod':
                    text=raw.decode('utf-8-sig');tree=parse(text)
                    if tree[0]!='footprint':raise ValueError('Invalid KiCad footprint')
                    fp_name=str(tree[1]).strip();safe_name(fp_name+'.kicad_mod')
                    if fp_name in footprints:raise ValueError('Ambiguous footprint filename: '+fp_name)
                    text=re.sub(r'^(\(footprint\s+)"(?:\\.|[^"\\])*"',lambda m:m[1]+json.dumps(fp_name),text)
                    footprints[fp_name]=(name,text)
                elif suffix in ('.step','.stp','.wrl'):steps.append(name)
                elif suffix=='.pdf':
                    if not raw.lstrip().startswith(b'%PDF-'):raise ValueError('Invalid PDF')
                    pdfs.append(name)
                elif suffix in ('.txt','.lib','.mod','.cir','.sp','.spice'):
                    text=raw.decode('utf-8-sig',errors='replace')
                    for model in definitions(text):models.append(dict(model,file_name=name))
            if not symbol_files and not footprints:raise ValueError('No KiCad symbol or footprint found. Legacy .lib symbols must be converted in KiCad first.')
            # No automatic PDF parsing, electrical checks, or untrusted include resolution.
            for name in steps+pdfs+sorted({m['file_name'] for m in models}):
                destination=working/PurePosixPath(name).name
                if destination.exists() and destination.read_bytes()!=contents[name]:raise ValueError('Ambiguous asset basename')
                destination.write_bytes(contents[name])
            fp_folder=working/(alias+'.pretty');fp_folder.mkdir();fp_info={}
            for fp_name,(name,text) in footprints.items():
                chosen=request.get('model3d')
                candidate=chosen if chosen in steps else steps[0] if len(steps)==1 and len(footprints)==1 else None
                if candidate:
                    try:text=rewrite_3d(text,'../'+PurePosixPath(candidate).name);notes.append('orientation_unverified')
                    except ValueError:candidate=None;notes.append('3d_unassigned')
                    if not candidate:
                        for start,end,chunk in reversed(blocks(text,'model')):text=text[:start]+text[end:]
                else:
                    # Remove unavailable foreign paths; keep them only in originals.
                    for start,end,chunk in reversed(blocks(text,'model')):text=text[:start]+text[end:]
                    if steps:notes.append('3d_unassigned')
                fp_path=fp_folder/(fp_name+'.kicad_mod');fp_path.write_text(text,encoding='utf8')
                info=dict(reference=alias+':'+fp_name,found=True,path=str(fp_path),registered=False,models=[])
                if candidate:info['models']=[dict(reference='../'+PurePosixPath(candidate).name,path=str(working/PurePosixPath(candidate).name),found=True)]
                fp_info[fp_name]=info
            rows=[]
            for name,text in symbol_files:
                tree=parse(text)
                if tree[0]!='kicad_symbol_lib':raise ValueError('Invalid KiCad symbol library')
                syms={s[1]:s for s in children(tree,'symbol')};props=properties(syms)
                library=alias+'_'+digest(name)[:6];sym_path=working/(library+'.kicad_sym')
                for sym_name,node in syms.items():
                    prop=props(sym_name);original_fp=prop.get('Footprint','');fp_name=original_fp.split(':')[-1].strip();info=copy.deepcopy(fp_info.get(fp_name,dict(reference=original_fp,found=False,models=[])))
                    manufacturer=str(request.get('manufacturer') or prop.get('Manufacturer') or prop.get('MF') or '').strip()
                    description=prop.get('Description','');cat=transistor_category(PurePosixPath(name).stem,sym_name,description) or category(PurePosixPath(name).stem,sym_name,description)
                    if cat.startswith('unassigned/') and 'igbt' in description.lower() and 'module' in description.lower():cat='semiconductor/power_modules/igbt'
                    if cat.startswith('unassigned/'):
                        reference=prop.get('Reference','').upper()
                        # Reference letters propose only broad families; no
                        # rating or diode subtype is inferred from an MPN.
                        if reference=='D':cat=diode_category('Diode',sym_name,description)
                        elif reference in ('R','C','L'):cat={'R':'passive/resistor','C':'passive/capacitor','L':'passive/inductor'}[reference]
                    row=dict(id='USR-'+digest([manufacturer.casefold() or manifest['revision'],PurePosixPath(name).name,sym_name,original_fp])[:24],name=sym_name,manufacturer=manufacturer,library=library,category=cat,kind='library',symbol=library+':'+sym_name,kicad_reference=library+':'+sym_name,source_file=str(sym_path),symbol_found=True,footprint=info['reference'] or None,footprint_info=info,models=[],intrinsic=False,registered=False,values={},parameters=[],description=description,datasheet=prop.get('Datasheet',''),provenance=manifest,import_review=[],import_identity=dict(footprint=original_fp,source_name=PurePosixPath(name).name))
                    row['import_key']=row['id'];row['import_review']=parameters(row)
                    native_sim={k:v for k,v in prop.items() if k.startswith('Sim.') and v}
                    if native_sim and not native_sim.get('Sim.Library'):
                        row['simulation_fields']=native_sim;row['intrinsic']=native_sim.get('Sim.Device') in ('R','C','L')
                    changes={}
                    if info['found']:changes['Footprint']=info['reference'];row['footprint_preview']=geometry(parse(Path(info['path']).read_text(encoding='utf8'))[1:],True)
                    matches=[m for m in models if m['name'].casefold()==(prop.get('Sim.Name') or sym_name).casefold()]
                    pins=_symbol_pins(row,tree);row['symbol_pins']=pins
                    row['sim_candidates']=sim_candidates(models,contents,working,pins) if models else []
                    if len(matches)==1:
                        m=matches[0];named={}
                        aliases={'ANODE':'A','CATHODE':'K','KATHODE':'K','GATE':'G','DRAIN':'D','SOURCE':'S','COLLECTOR':'C','BASE':'B','EMITTER':'E'}
                        for pin in pins:
                            role=aliases.get(pin['name'].upper(),pin['name'].upper());named.setdefault(role,[]).append(pin['number'])
                        roles=[aliases.get(p.upper(),p.upper()) for p in m['pins']]
                        if all(len(named.get(p,[]))==1 for p in roles) and len(set(roles))==len(roles):
                            mapping=[named[p][0] for p in roles];model_path=working/PurePosixPath(m['file_name']).name
                            if re.search(r'^\s*\.(?:include|inc|lib)\b',contents[m['file_name']].decode('utf8',errors='replace'),re.M|re.I):notes.append('sim_dependencies')
                            else:
                                changes.update({'Sim.Device':'SUBCKT' if m['type']=='X' else m['spice_kind'],'Sim.Type':'','Sim.Library':model_path.as_posix(),'Sim.Name':m['name'],'Sim.Pins':' '.join(f'{n}={p}' for p,n in zip(m['pins'],mapping))})
                                row.update(simulation_fields={k:v for k,v in changes.items() if k.startswith('Sim.')},simulation_file_found=True,simulation_file_path=str(model_path))
                                row['models']=[dict(id='BUNDLE-'+digest([token,sym_name])[:20],name=m['name'],status='UNVERIFIED',model_class='UNKNOWN',simulator='ngspice',compatibility='UNKNOWN',file=str(model_path),sha256=hashlib.sha256(model_path.read_bytes()).hexdigest(),passed=[],pin_map=[dict(model_pin=i+1,model_pin_name=p,symbol_pin=n) for i,(p,n) in enumerate(zip(m['pins'],mapping))])]
                        else:notes.append('sim_unassigned')
                    elif models:notes.append('sim_unassigned')
                    if len(pdfs)==1 and len(syms)==1 and len(symbol_files)==1:
                        local=working/PurePosixPath(pdfs[0]).name;row['datasheet_path']=str(local)
                        row['datasheet']='/api/import/file?session='+token+'&name='+quote(PurePosixPath(pdfs[0]).name,safe='')
                        changes['Datasheet']=local.as_posix()
                    elif pdfs:notes.append('pdf_unassigned')
                    if manufacturer:changes['Manufacturer']=manufacturer
                    text=set_properties(text,sym_name,changes);rows.append(row)
                sym_path.write_text(text,encoding='utf8')
                final_tree=parse(text)
                for row in rows:
                    if row['source_file']==str(sym_path):row['symbol_preview']=symbol_geometry(final_tree,row['name'])
            # Footprints imported alone remain useful in their own right.
            if not symbol_files:
                for fp_name,info in fp_info.items():
                    row=dict(id='USR-'+digest(['footprint',request.get('manufacturer') or manifest['revision'],fp_name])[:24],name=fp_name,library=alias,category='footprints/user',kind='footprint',symbol='',source_file=info['path'],footprint=info['reference'],footprint_info=info,footprint_preview=geometry(parse(Path(info['path']).read_text(encoding='utf8'))[1:],True),values={},parameters=[],models=[],manufacturer=request.get('manufacturer',''),description='',datasheet='',provenance=manifest,registered=False)
                    row['import_key']=row['id'];rows.append(row)
            hashes={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
            if any(r.get('symbol_found') and not r['footprint_info']['found'] for r in rows):notes.append('footprint_missing')
            parsed=perf_counter();progress(dict(phase='importMatch',count=len(rows)));existing=existing(rows) if callable(existing) else existing
            matched=perf_counter()
            progress(dict(phase='importFinalize'))
            plan=preview(manifest,rows,existing,{},dict(notes=sorted(set(notes))),require_footprint=False,store_hash=self.store_hash())
            old_by_id={r['id']:r for r in existing};old_hashes={}
            for item in plan['items']:
                old=old_by_id.get(item['target'],{})
                for filename in [old.get('source_file'),old.get('footprint_info',{}).get('path')]+[m.get('file') for m in old.get('models',[])]:
                    if filename and Path(filename).is_file():old_hashes[filename]=hashlib.sha256(Path(filename).read_bytes()).hexdigest()
            data=dict(timings=dict(files_ms=round((parsed-started)*1000),match_ms=round((matched-parsed)*1000),total_ms=round((perf_counter()-started)*1000),candidates=len(existing)),warnings=warnings,plan=plan,hashes=hashes,old_hashes=old_hashes,status='preview',session=token,assets=[dict(name=n,kind=PurePosixPath(n).suffix.lower()) for n in contents if not n.endswith('.original')])
            atomic_json(root/'preview.json',data);atomic_json(self.settings_path,dict(folder=settings['folder'],used=True))
            return self.public(data,existing)

    def recheck(self,request,existing):
        """Re-evaluate manufacturer identity without changing originals or catalog."""
        with self.lock:
            root,data=self.load(request['session']);rows=[];id_map={}
            incoming=request.get('manufacturers',{})
            ids={i['row']['id'] for i in data['plan']['items']}
            if not isinstance(incoming,dict) or set(incoming)-ids:raise ValueError('Unknown manufacturer selection')
            for item in data['plan']['items']:
                row=copy.deepcopy(item['row']);old_id=row['id'];value=incoming.get(old_id,row.get('manufacturer',''))
                if not isinstance(value,str) or len(value)>200 or any(c in value for c in '\r\n\0'):raise ValueError('Invalid manufacturer')
                value=value.strip()
                if value!=row.get('manufacturer',''):
                    identity=row.get('import_identity',{})
                    row['id']='USR-'+digest([value.casefold() or data['plan']['source']['revision'],identity.get('source_name',old_id),row['name'],identity.get('footprint','')])[:24]
                    row['import_key']=row['id'];row['manufacturer']=value
                id_map[old_id]=row['id'];rows.append(row)
            existing=existing(rows) if callable(existing) else existing
            data['plan']=preview(data['plan']['source'],rows,existing,{},data['plan'].get('detail'),require_footprint=False,store_hash=self.store_hash())
            old_by_id={r['id']:r for r in existing};data['old_hashes']={}
            for item in data['plan']['items']:
                old=old_by_id.get(item['target'],{})
                for filename in [old.get('source_file'),old.get('footprint_info',{}).get('path')]+[m.get('file') for m in old.get('models',[])]:
                    if filename and Path(filename).is_file():data['old_hashes'][filename]=hashlib.sha256(Path(filename).read_bytes()).hexdigest()
            atomic_json(root/'preview.json',data)
            return dict(self.public(data,existing),id_map=id_map)

    def public(self,data,existing):
        targets={r['id']:r for r in existing};items=[]
        for item in data['plan']['items']:
            row=item['row'];old=targets.get(item['target']);possible=bool(old and (item['state']!='conflict' or item['reason'].startswith('Existing values differ:')))
            manual=(old or {}).get('manual_data',{})
            changes=[dict(key=k,before=(old or {}).get('values',{}).get(k),after=v,protected=k in manual.get('values',{})) for k,v in row['values'].items()]
            changes.extend(dict(key=k,before=(old or {}).get(k),after=row.get(k),protected=k in manual) for k in ('description','datasheet') if row.get(k) and row.get(k)!=(old or {}).get(k) and not (k=='datasheet' and row.get('datasheet_path')))
            assets=[dict(key=k,available=asset_present(row,k),present=asset_present(old or {},k),protected=k=='datasheet_file' and 'datasheet' in manual) for k in ASSETS]
            for asset in assets:
                if asset['key']=='simulation' and row['kind']!='footprint':asset.update(available=True,pending=not bool(row.get('models')))
                if asset['key']=='simulation':asset['name']=', '.join(m['name'] for m in row['models'])
                if asset['key']=='datasheet_file' and row.get('datasheet_path'):asset.update(name=Path(row['datasheet_path']).name,url=row['datasheet'])
            items.append(dict(id=row['id'],name=row['name'],kind=row['kind'],category=old.get('category',row['category']) if possible else row['category'],category_locked=bool((old or {}).get('category_override')),manufacturer=row.get('manufacturer',''),footprint=row.get('import_identity',{}).get('footprint',row.get('footprint')),state=item['state'],reason=item['reason'],existing=possible,changes=changes,assets=assets,values=dict(row.get('values',{}),**(old or {}).get('values',{})),protected_parameters=list(manual.get('values',{})),sim_candidates=row.get('sim_candidates',[]),symbol_pins=row.get('symbol_pins',[]),pins=[m.get('pin_map',[]) for m in row.get('models',[])],preview=row.get('symbol_preview'),footprint_preview=footprint_geometry(row),model3d=any(m.get('found') for m in row.get('footprint_info',{}).get('models',[])),registered=row.get('registered',False)))
        return dict(timings=data.get('timings',{}),warnings=data.get('warnings',[]),session=data['session'],folder=self.settings()['folder'],items=items,notes=data['plan']['detail']['notes'],assets=data['assets'])

    def load(self,token):
        root=self.session_path(token);data=json.loads((root/'preview.json').read_text(encoding='utf8'))
        if data['status']!='preview':raise ValueError('Import preview is no longer active')
        for name,expected in data['hashes'].items():
            path=root/name
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise ValueError('Import file changed since preview')
        return root,data

    def sim_action(self,request,library):
        """Reuse the model wizard on frozen import files; never assign globally."""
        from .model_library import ModelLibrary
        with self.lock:
            root,data=self.load(request['session'])
            row=next((i['row'] for i in data['plan']['items'] if i['row']['id']==request['component_id']),None)
            if row is None:raise ValueError('Unknown import component')
            action=request['action']
            if action=='pins':return dict(pins=row.get('symbol_pins',[]),symbol_reference=row.get('symbol'),symbol_preview=row.get('symbol_preview'))
            def stage(files):
                staged=[]
                contents=unpack(files)
                if any(Path(n).suffix.lower() not in ('.lib','.mod','.cir','.sp','.spice','.txt','.bjt','.mos','.dio','.jft') for n in contents):raise ValueError('Choose SPICE model files')
                for name,raw in contents.items():
                    path=root/'SIM'/hashlib.sha256(raw).hexdigest()[:16]/Path(name).name
                    path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
                    models=[dict(m,file_name=name) for m in definitions(raw.decode('utf-8-sig',errors='replace'))]
                    for candidate in sim_candidates(models,{name:raw},path.parent,row.get('symbol_pins',[])):
                        candidate['file']=str(path)
                        candidate['id']=digest([candidate['id'],hashlib.sha256(raw).hexdigest()])[:24]
                        staged.append(candidate)
                        if not any(c['id']==candidate['id'] for c in row.setdefault('sim_candidates',[])):row['sim_candidates'].append(candidate)
                    data['hashes'][path.relative_to(root).as_posix()]=hashlib.sha256(raw).hexdigest()
                atomic_json(root/'preview.json',data)
                return staged
            if action=='upload':
                stage([dict(name=f['name'],content=base64.b64encode(f['content'].encode()).decode()) for f in request['files']]);return dict(imported=len(request['files']))
            if action=='search':
                result=library.search(request.get('query','')) if library else dict(total=0,candidates=[])
                bundled=[]
                for c in row.get('sim_candidates',[]):
                    bundled.append(dict(c,id='DRAFT-'+c['id'],pins=[p['token'] for p in c['pins']],terminal_info=c['pins'],filename=Path(c['file']).name,source='Import',collection='Import',exact=True))
                result['candidates']=bundled+result['candidates'];return result
            identifier=request.get('model_id','')
            if identifier.startswith('DRAFT-'):identifier=identifier[6:]
            else:
                if not library:raise ValueError('Model library unavailable')
                model=library.get(identifier);text=library.safe_text(model)
                staged=stage([dict(name=Path(model['file']).name,content=base64.b64encode(text.encode()).decode())])
                identifier=next(c['id'] for c in staged if c['name']==model['name'])
            assignment=dict(model_id=identifier,pins=request.get('pins'))
            model,candidate=selected_model(row,assignment,request['session'])
            if action=='assign':return dict(assignment=assignment,name=candidate['name'])
            if action=='test':
                checks=ModelLibrary(root/'SIM-Pruefung')
                checks.upload(Path(candidate['file']).name,Path(candidate['file']).read_text(encoding='utf-8-sig'),'Import')
                found=next(c for c in checks.search(candidate['name'])['candidates'] if c['name']==candidate['name'])
                return checks.test(found['id'],request.get('biases',[]),symbol=row.get('symbol'),pins=assignment['pins'],symbol_info=row.get('symbol_pins',[]))
            raise ValueError('Unknown SIM import action')

    def cancel(self,token):
        with self.lock:
            root,data=self.load(token);data['status']='cancelled';atomic_json(root/'preview.json',data)
        return dict(cancelled=True)

    def save(self,request,existing,config=None):
        with self.lock:
            root,data=self.load(request['session']);plan=data['plan'];choices=request.get('choices',{});categories=request.get('categories',{})
            existing=existing([i['row'] for i in plan['items']]) if callable(existing) else existing
            allowed=set(getattr(existing,'categories',set()))|set(r['category'] for r in existing)|{key for key in FIELDS if '/' in key}|{'unassigned/user','footprints/user'}
            for path in list(allowed):allowed.update('/'.join(path.split('/')[:n]) for n in range(1,len(path.split('/'))))
            new_categories=request.get('new_categories',[])
            if not isinstance(new_categories,list) or len(new_categories)>20:raise ValueError('Invalid new categories')
            for path in new_categories:
                if not isinstance(path,str) or len(path)>240 or any(not re.fullmatch(r'[\w -]{1,80}',part) or part!=part.strip() for part in path.split('/')):raise ValueError('Invalid category name')
                parent=path.rpartition('/')[0]
                if parent not in allowed:raise ValueError('Choose an existing parent category')
                allowed.add(path)
            for item in plan['items']:
                row=item['row'];chosen=categories.get(row['id'],row['category'])
                if chosen not in allowed and chosen!=row['category']:raise ValueError('Unknown category')
                edits=request.get('parameter_values',{}).get(row['id'],{})
                definitions={f['key']:f for f in fields_for(dict(row,category=chosen))}
                if not isinstance(edits,dict) or set(edits)-set(definitions):raise ValueError('Unknown import parameter')
                for key,value in edits.items():
                    definition=definitions[key]
                    if definition.get('type')=='text':
                        if not isinstance(value,str) or not value.strip() or len(value)>1000:raise ValueError('Invalid parameter text')
                        value=value.strip()
                    elif isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value):raise ValueError('Invalid parameter number')
                    row['values'][key]=value
                    row['parameters']=[p for p in row['parameters'] if p['name']!=key]+[dict(name=key,value=value,unit=definition['unit'],kind='unspecified',status='UNVERIFIED',conditions='User input during import; conditions not verified',source='User input during component import',source_details=dict(origin='manual_import'))]
                row['import_category_override']=chosen!=row['category'] or bool(categories.get(row['id']));row['category']=chosen
                if item['state']=='review' and item['reason']=='Category requires review':item['state']='new'
            for filename,expected in data.get('old_hashes',{}).items():
                if not Path(filename).is_file() or hashlib.sha256(Path(filename).read_bytes()).hexdigest()!=expected:raise ValueError('Existing asset changed since preview')
            assignments=request.get('sim_assignments',{})
            if not isinstance(assignments,dict) or set(assignments)-{i['row']['id'] for i in plan['items']}:raise ValueError('Unknown model assignment')
            for item in plan['items']:
                row=item['row'];assignment=assignments.get(row['id']);choice=choices.get(row['id'],{})
                if 'assets' in choice and 'simulation' not in choice['assets'] and item['target'] not in {r['id'] for r in existing}:
                    row['models']=[]
                    for field in ('simulation_fields','simulation_file_found','simulation_file_path'):row.pop(field,None)
                if assignment and choice.get('mode')!='skip' and 'simulation' in choice.get('assets',[]):
                    model,candidate=selected_model(row,assignment,data['session']);row['models']=[model]
                    row['simulation_fields']={'Sim.Device':'SUBCKT' if candidate['type']=='X' else candidate['spice_kind'],'Sim.Type':'','Sim.Library':Path(model['file']).as_posix(),'Sim.Name':model['name'],'Sim.Pins':' '.join(f"{p['symbol_pin']}={p['model_pin_name']}" for p in model['pin_map'])}
                    row.update(simulation_file_found=True,simulation_file_path=model['file'])
                elif choice.get('mode')!='skip' and 'simulation' in choice.get('assets',[]) and row.get('sim_candidates') and not row.get('models'):raise ValueError('Confirm model terminal assignment before selecting simulation')
            plan=resolve_preview(plan,existing,choices);old_by_id={r['id']:r for r in existing}
            for item in plan['items']:
                old=old_by_id.get(item['target'])
                if old and item['state'] in ('selected','unchanged') and choices.get(item['row']['id'],{}).get('mode')!='skip' and item['row']['category']!=old['category']:
                    if old.get('category_override'):raise ValueError('Manually assigned category must be changed in the category editor')
                    item['state']='selected';item['fields']=list(dict.fromkeys(item.get('fields',[])+['category','import_category_override']))
                if item['state'] not in ('selected','new'):continue
                row=item['row'];old=old_by_id.get(item['target']);fields=item.get('fields',[])
                if row['kind']=='footprint':continue
                if old and not any(f in fields for f in ('source_file','models','datasheet','description')):continue
                # Rebuild a working symbol with the final selection. Never edit
                # installed/vendor/user originals or leave mismatched references.
                incoming_symbol=not old or ('source_file' in fields and (item['mode']=='replace' or not old.get('symbol_found')))
                base=row if incoming_symbol else old
                if not base.get('source_file'):continue
                text=Path(base['source_file']).read_text(encoding='utf-8-sig');sym_name=base['symbol'].split(':')[-1]
                final=dict(copy.deepcopy(old or row))
                if old:final.update({f:copy.deepcopy(row[f]) for f in fields})
                # Imported simulation pin names must match the selected symbol.
                if final.get('models'):
                    pins={p['number']:p['name'].upper() for p in _symbol_pins(dict(symbol=base['symbol']),parse(text))}
                    aliases={'ANODE':'A','CATHODE':'K','KATHODE':'K','GATE':'G','DRAIN':'D','SOURCE':'S','COLLECTOR':'C','BASE':'B','EMITTER':'E'}
                    for model in final['models']:
                        for pin in model.get('pin_map',[]):
                            actual=pins.get(str(pin['symbol_pin']),'');role=str(pin.get('model_pin_name','')).upper()
                            if str(pin['symbol_pin']) not in pins:raise ValueError('Selected symbol is missing a simulation pin')
                            if aliases.get(actual,actual) in ('A','K','D','G','S','B','C','E') and aliases.get(role,role) in ('A','K','D','G','S','B','C','E') and aliases.get(actual,actual)!=aliases.get(role,role):raise ValueError('Selected symbol and simulation pins do not match')
                props={'Manufacturer':final.get('manufacturer',''),'Footprint':final.get('footprint') or '', 'Datasheet':final.get('datasheet_path') or final.get('datasheet',''),'Description':final.get('description','')}
                sim=final.get('simulation_fields',{})
                if not sim and len(final.get('models',[]))==1:
                    model=final['models'][0];path=Path(model.get('file') or '')
                    if path.is_file():
                        declared=[m for m in definitions(path.read_text(encoding='utf-8-sig',errors='replace')) if m['name']==model['name']]
                        if len(declared)==1 and model.get('pin_map'):
                            m=declared[0];sim={'Sim.Device':'SUBCKT' if m['type']=='X' else m['spice_kind'],'Sim.Type':'','Sim.Library':path.as_posix(),'Sim.Name':model['name'],'Sim.Pins':' '.join(f"{p['symbol_pin']}={p['model_pin_name']}" for p in model['pin_map'])}
                # Clear properties from the incoming symbol if SIM was not selected.
                props.update({k:sim.get(k,'') for k in ('Sim.Device','Sim.Type','Sim.Library','Sim.Name','Sim.Pins')})
                text=set_properties(text,sym_name,props)
                library='KPM_'+data['session'][:12]+'_'+digest(row['id'])[:6];dest=root/'Final'/(library+'.kicad_sym');dest.parent.mkdir(exist_ok=True);dest.write_text(text,encoding='utf8')
                row.update(library=library,source_file=str(dest),symbol=library+':'+sym_name,kicad_reference=library+':'+sym_name,symbol_preview=symbol_geometry(parse(text),sym_name),registered=False)
                if old:
                    row.update(local_data_key=component_key(old),import_key=old.get('import_key') or old['id'],models=copy.deepcopy(final.get('models',[])),simulation_fields=sim)
                    item['fields']=list(dict.fromkeys(fields+['library','source_file','symbol','kicad_reference','symbol_preview','registered','local_data_key','import_key','models','simulation_fields']))
            receipt=apply_preview(plan,self.index,existing)
            effective={r['id']:r for r in merge_inventory(dict(components=existing),read_store(self.index))['components']}
            registered_plan=dict(items=[dict(state=i['state'],row=effective[i['target']]) for i in plan['items'] if i['state'] in ('new','selected')])
            data['status']='saved';data['receipt']=receipt;data['plan']=plan;atomic_json(root/'preview.json',data)
            registration='not_registered';registration_detail=''
            if not receipt.get('unchanged') and config:
                try:
                    if self.register(registered_plan,config,root):registration='registered'
                except (OSError,ValueError) as error:registration_detail=str(error)
            return dict(receipt=receipt,folder=str(root),registration=registration,registration_detail=registration_detail,reference=[i['row'].get('kicad_reference') or i['row'].get('symbol') or i['row'].get('footprint') for i in registered_plan['items']])

    def register(self,plan,config,root):
        """Add only namespaced versioned aliases, with concurrent-edit checks.

        A registration failure does not discard a successful catalog import.
        Original tables are retained in the import directory for inspection.
        """
        config=Path(config)
        if not config.is_dir():raise ValueError('KiCad configuration directory unavailable')
        candidates=[{},{}]
        for item in plan['items']:
            if item['state'] not in ('new','selected'):continue
            row=item['row']
            if row.get('symbol'):
                alias=row['symbol'].split(':')[0]
                if alias.startswith('KPM_') and row.get('source_file'):candidates[0][alias]=Path(row['source_file'])
            info=row.get('footprint_info',{})
            if info.get('found'):
                alias=row['footprint'].split(':')[0]
                if alias.startswith('KPM_'):candidates[1][alias]=Path(info['path']).parent
        changes=[];backups=root/'KiCad-Konfiguration';backups.mkdir(exist_ok=True)
        for kind,filename,libs in zip(('sym_lib_table','fp_lib_table'),('sym-lib-table','fp-lib-table'),candidates):
            path=config/filename;before=path.read_bytes() if path.exists() else None
            text=before.decode('utf-8-sig') if before is not None else '('+kind+' (version 7))'
            tree=parse(text);existing={field(lib,'name'):field(lib,'uri') for lib in children(tree,'lib')};additions=[]
            for alias,target in sorted(libs.items()):
                if not re.fullmatch(r'KPM_[a-f0-9_]+',alias):raise ValueError('Unexpected user library alias')
                if alias in existing:
                    if Path(existing[alias]).resolve()!=target.resolve():raise ValueError('Library alias conflict: '+alias)
                    continue
                if not target.resolve().is_relative_to(Path(self.settings()['folder']).resolve()):raise ValueError('User library asset outside configured folder')
                additions.append('(lib (name '+json.dumps(alias)+') (type "KiCad") (uri '+json.dumps(target.as_posix(),ensure_ascii=False)+') (options "") (descr "KiCad Parts Manager user import"))')
            if additions:
                after=text.rstrip()[:-1]+'\n'+'\n'.join(additions)+'\n)';parse(after)
                changes.append((path,before,after.encode('utf8')))
        lock=config/'.kpm-import.lock';fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY);written=[]
        try:
            for path,before,after in changes:
                if (path.read_bytes() if path.exists() else None)!=before:raise ValueError('KiCad library table changed concurrently')
            for path,before,after in changes:
                if before is not None:(backups/path.name).write_bytes(before)
                temporary=path.with_name(path.name+'.kpm-'+uuid.uuid4().hex+'.tmp')
                try:temporary.write_bytes(after);temporary.replace(path)
                finally:temporary.unlink(missing_ok=True)
                written.append((path,before,after))
        except Exception:
            for path,before,after in reversed(written):
                if path.read_bytes()==after:
                    if before is None:path.unlink()
                    else:path.write_bytes(before)
            raise
        finally:os.close(fd);lock.unlink(missing_ok=True)
        return bool(candidates[0] or candidates[1])

    def undo(self,run_id):
        with self.lock:return undo_import(self.index,run_id)
