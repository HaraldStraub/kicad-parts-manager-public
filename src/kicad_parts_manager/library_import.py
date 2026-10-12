"""Pinned, read-only library adapters and atomic, additive local imports."""
import copy
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import tempfile
from urllib.parse import urlsplit

from .kicad.inventory import parse, children, field, tables, category
from .kicad.geometry import symbol_geometry
from .kicad.previews import geometry
from .manual_data import fields_for
from .diode_description import extract_diode_description
from .transistor_opto_description import extract_description as transistor_values
from .regulator_description import extract_description as regulator_values
from .contact_description import extract_description as contact_values
from .passive_description import extract_description as passive_values
from .common_description import extract_description as common_values
from .connector_description import extract_description as connector_values

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,allow_nan=False).encode()).hexdigest()

def read_store(path):
    path=Path(path)
    return json.loads(path.read_text(encoding='utf8')) if path.exists() else dict(schema_version=1,components=[],patches={},runs=[])

def merge_inventory(inventory, store):
    """Rebuildable scan and imported sources stay separate; local edits apply later."""
    result=dict(inventory or {}); rows=list(result.get('components',[]))
    by_id={r['id']:r for r in rows}
    for item in store.get('components',[]):
        if item['id'] not in by_id:rows.append(copy.deepcopy(item));by_id[item['id']]=rows[-1]
    for key,patch in store.get('patches',{}).items():
        if key not in by_id:continue
        original=by_id[key];row=copy.deepcopy(original);rows[rows.index(original)]=row;by_id[key]=row;row.setdefault('values',{})
        for parameter in patch.get('parameters',[]):
            name=parameter['name']
            if name not in row['values']:
                row['values'][name]=parameter['value'];row.setdefault('parameters',[]).append(copy.deepcopy(parameter))
        for parameter in patch.get('replacements',[]):
            name=parameter['name'];row['values'][name]=parameter['value']
            row['parameters']=[p for p in row.get('parameters',[]) if p['name']!=name]+[copy.deepcopy(parameter)]
        row.update(copy.deepcopy(patch.get('fields',{})))
    result['components']=rows;result['categories']=sorted({r['category'] for r in rows})
    result['counts']=dict(result.get('counts',{}),symbols=sum(r.get('kind')!='footprint' for r in rows),footprints=sum(r.get('kind')=='footprint' for r in rows))
    return result

def identity(row):
    """Strict cross-source match; missing manufacturer/package means no auto-merge."""
    values=(row.get('manufacturer','').strip().casefold(),row.get('name','').strip().casefold(),row.get('import_identity',{}).get('footprint') or row.get('footprint') or '')
    return values if all(values) else None

def source_manifest(root):
    root=Path(root).resolve();manifest=json.loads((root/'source.json').read_text(encoding='utf8'))
    if not manifest.get('source_id') or not manifest.get('revision') or not manifest.get('license'):raise ValueError('Incomplete source manifest')
    for name,expected in manifest['files'].items():
        p=(root/name).resolve()
        if not p.is_relative_to(root) or not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:raise ValueError('Source changed: '+name)
    return manifest

def inside(root,path):
    path=Path(path).resolve()
    if not path.is_relative_to(root):raise ValueError('Asset outside source directory')
    return path

def reference_path(reference,lookup):
    library,sep,name=reference.partition(':')
    if not sep or library not in lookup:return None,name
    return lookup[library],name

def safe_url(value):
    parsed=urlsplit(value)
    return value if parsed.scheme in ('https','http') and parsed.hostname and not parsed.username and not parsed.password else ''

def parameters(row, raw=None):
    values={}; review=[];raw=raw or {}
    allowed={f['key']:f for f in fields_for(row)}
    extractors=[]
    if row['category'].startswith('semiconductor/diode/'):extractors.append(extract_diode_description)
    extractors.extend((transistor_values,regulator_values,contact_values,passive_values,common_values,connector_values))
    for extractor in extractors:
        extracted,reasons=extractor(row);review.extend(reasons)
        for key,value in extracted.items():
            if key in values and values[key]!=value:review.append('Conflicting description: '+key);values.pop(key)
            else:values[key]=value
    # Restrict general Voltage/Power to unambiguous passive categories.
    mappings={}
    if row['category'].startswith('passive/resistor'):mappings={'Value':('resistance','Ω'),'Power':('power_description','W'),'Voltage':('working_voltage','V')}
    elif row['category'].startswith('passive/capacitor'):mappings={'Value':('capacitance','F'),'Voltage':('voltage_description','V')}
    scale={'':1,'p':1e-12,'n':1e-9,'u':1e-6,'µ':1e-6,'m':1e-3,'k':1e3,'M':1e6}
    for column,(key,unit) in mappings.items():
        if key not in allowed:continue
        text=str(raw.get(column) or '').strip()
        match=re.fullmatch(r'(\d+(?:\.\d+)?)\s*([pnuµmkM]?)'+re.escape(unit),text)
        resistor=re.fullmatch(r'(\d*)([RkM])(\d+)',text) if key=='resistance' else None
        trailing=re.fullmatch(r'(\d+(?:\.\d+)?)([RkM])',text) if key=='resistance' else None
        if match:values[key]=float(match[1])*scale[match[2]]
        elif resistor:values[key]=float((resistor[1] or '0')+'.'+resistor[3])*{'R':1,'k':1e3,'M':1e6}[resistor[2]]
        elif trailing:values[key]=float(trailing[1])*{'R':1,'k':1e3,'M':1e6}[trailing[2]]
        elif text:review.append('Unmapped '+column+': '+text)
    row['values']=values
    row['parameters']=[dict(name=k,value=v,unit='F' if k=='capacitance' else allowed[k]['unit'],kind='unspecified',status='UNVERIFIED',conditions='Source library field / description; electrical accuracy not verified',source=row['provenance']['url'],source_details=row['provenance']) for k,v in values.items() if k in allowed]
    return review

def cern_rows(root, selected_tables=None, limit=None, check_cancel=lambda:None, progress=lambda value:None):
    root=Path(root).resolve();manifest=source_manifest(root)
    config=json.loads((root/'CERN_Windows.kicad_dbl').read_text(encoding='utf8'))
    variables={'CERN_LIB_DIR':str(root)};warnings=[]
    symbols=tables(root/'sym-lib-table',variables,warnings);footprints=tables(root/'fp-lib-table',variables,warnings)
    database=root/'CERN.sqlite'; trees={};rows=[];counts={}
    with sqlite3.connect(database.as_uri()+'?mode=ro',uri=True) as db:
        db.execute('PRAGMA query_only=ON');db.row_factory=sqlite3.Row
        if db.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise ValueError('Source database integrity failed')
        available={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        definitions=[d for d in config['libraries'] if not selected_tables or d['table'] in selected_tables]
        if selected_tables and set(selected_tables)-{d['table'] for d in definitions}:raise ValueError('Unknown selected table')
        for definition in definitions:
            table=definition['table'];check_cancel()
            if table not in available:raise ValueError('Missing database table '+table)
            quoted='"'+table.replace('"','""')+'"'
            counts[table]=db.execute('SELECT count(*) FROM '+quoted).fetchone()[0]
            key=definition['key'];order='"'+key.replace('"','""')+'"'
            query='SELECT * FROM '+quoted+' ORDER BY '+order
            if limit is not None:query+=' LIMIT '+str(int(limit))
            for record in db.execute(query):
                check_cancel();raw=dict(record);source_key=str(raw[key]);symbol=str(raw.get(definition['symbols']) or '');fp=str(raw.get(definition['footprints']) or '')
                identifier='IMP-'+digest([manifest['source_id'],table,source_key])[:24]
                row=dict(id=identifier,import_key=identifier,name=str(raw.get('Manufacturer Part Number') or source_key),library='CERN/'+table,category=category(table,str(raw.get('Manufacturer Part Number') or source_key),str(raw.get('Part Description') or '')+' '+symbol),kind='library',manufacturer=str(raw.get('Manufacturer') or ''),description=str(raw.get('Part Description') or ''),symbol=symbol,footprint=fp or None,models=[],intrinsic=False,values={},parameters=[],registered=False,symbol_found=False,source_file='',datasheet=safe_url(str(raw.get('Datasheet') or raw.get('HelpURL') or '')),kicad_reference='CERN:'+definition['name']+'/'+source_key,provenance=dict(source_id=manifest['source_id'],revision=manifest['revision'],license=manifest['license'],url=manifest['url'],table=table,key=source_key,sha256=digest(raw)),source_properties=raw,footprint_info=dict(reference=fp,found=False,models=[]))
                review=parameters(row,raw)
                sp,name=reference_path(symbol,symbols); folder,fp_name=reference_path(fp,footprints)
                if not folder and ':' in fp:
                    library=fp.partition(':')[0]
                    if not any(c in library for c in ('/','\\')) and library not in ('.','..'):
                        candidate=inside(root,root/'PcbLib'/(library+'.pretty'))
                        asset=inside(root,candidate/(fp_name+'.kicad_mod'))
                        relative=asset.relative_to(root).as_posix()
                        if relative in manifest['files'] and asset.is_file():
                            folder=candidate
                            row['footprint_info']['resolved_by']='exact_source_path'
                            review.append('Footprint library absent from source table; exact pinned asset resolved; KiCad registration required')
                if sp and inside(root,sp).is_file():
                    row['source_file']=str(sp)
                    if str(sp) not in trees:trees[str(sp)]=parse(sp.read_text(encoding='utf-8-sig'))
                    tree=trees[str(sp)];names={s[1] for s in children(tree,'symbol')}
                    row['symbol_found']=name in names
                    if row['symbol_found']:row['symbol_preview']=symbol_geometry(tree,name)
                if folder:
                    fp_file=inside(root,folder/(fp_name+'.kicad_mod'))
                    if fp_file.is_file():
                        tree=parse(fp_file.read_text(encoding='utf-8-sig'));row['footprint_info'].update(found=True,path=str(fp_file))
                        row['footprint_preview']=geometry([n for n in tree if isinstance(n,list)],True)
                if not row['symbol_found']:review.append('Missing symbol asset')
                if not row['footprint_info']['found']:review.append('Missing footprint asset')
                if not row['datasheet'] and (raw.get('Datasheet') or raw.get('HelpURL')):review.append('Datasheet is an internal/unresolved path; retained only in source fields')
                row['import_review']=review;rows.append(row)
            progress(dict(phase='read_source',table=table,rows=len(rows)))
    return manifest,rows,dict(source_counts=counts,warnings=warnings)

def file_rows(root, check_cancel=lambda:None):
    """Native KiCad snapshot adapter; uses the existing scanner, never its writer."""
    from .kicad.inventory import scan
    root=Path(root).resolve();manifest=source_manifest(root)
    result=scan(root,root,extra_roots=[root],user_home=root/'_unused',include_previews=True,check_cancel=check_cancel,source_only=True)
    for row in result['components']:
        relative=Path(row['source_file']).resolve().relative_to(root).as_posix()
        row['id']='IMP-'+digest([manifest['source_id'],relative,row['name']])[:24];row['import_key']=row['id'];row['registered']=False
        row['provenance']=dict(source_id=manifest['source_id'],revision=manifest['revision'],license=manifest['license'],url=manifest.get('url',''),key=relative+':'+row['name'])
        row['import_review']=parameters(row)
    return manifest,result['components'],dict(warnings=result['warnings'])

def preview(source,rows,existing,store,detail=None,require_footprint=True,store_hash=None):
    by_id={r['id']:r for r in existing};matches={};parts={}
    for row in existing:
        if identity(row):matches.setdefault(identity(row),[]).append(row)
        if row.get('manufacturer') and row.get('name'):parts.setdefault((row['manufacturer'].strip().casefold(),row['name'].strip().casefold()),[]).append(row)
    items=[];seen=set();candidate_matches=Counter(identity(r) for r in rows if identity(r))
    for row in rows:
        state='new';target=by_id.get(row['id']);reason=''
        if row['id'] in seen:state='conflict';reason='Duplicate source key'
        seen.add(row['id'])
        if state!='conflict' and not target:
            found=matches.get(identity(row),[]) if identity(row) else []
            if len(found)==1 and candidate_matches[identity(row)]==1:target=found[0]
            elif found:state='conflict';reason='Ambiguous cross-source identity'
            elif parts.get((row.get('manufacturer','').strip().casefold(),row.get('name','').strip().casefold())):state='review';reason='Possible duplicate; footprint/variant requires review'
        if state!='conflict' and (not row.get('symbol_found') or (require_footprint and not row.get('footprint_info',{}).get('found'))) and row.get('kind')!='footprint':state='rejected';reason='Required assets missing'
        if state=='new' and row['category'].startswith('unassigned/'):state='review';reason='Category requires review'
        keys=[]
        if target and state=='new':
            keys=[key for key in row['values'] if key not in target.get('values',{})]
            conflicts=[k for k,v in row['values'].items() if k in target.get('values',{}) and target['values'][k]!=v]
            state='conflict' if conflicts else 'supplement' if keys else 'unchanged'
            reason='Existing values differ: '+', '.join(conflicts) if conflicts else ''
        items.append(dict(state=state,target=target['id'] if target else row['id'],keys=keys,row=row,reason=reason))
    return dict(schema_version=1,source=source,items=items,counts=dict(Counter(i['state'] for i in items)),detail=detail or {},baseline=digest(existing),store_digest=store_hash if store_hash is not None else digest(store))

REPLACE_FIELDS=('description','datasheet')
ASSET_FIELDS={
    'library_files':('source_file','symbol','kicad_reference','symbol_preview','symbol_found','footprint','footprint_info','footprint_preview','registered'),
    'simulation':('models','simulation_fields','simulation_file_found','simulation_file_path'),
    'datasheet_file':('datasheet','datasheet_path'),
}

def asset_present(row,key):
    if key=='library_files':return bool(row.get('symbol_found') and row.get('footprint_info',{}).get('found')) if row.get('kind')!='footprint' else bool(row.get('source_file'))
    if key=='simulation':return bool(row.get('models') or row.get('intrinsic') or row.get('simulation_file_found'))
    return bool(row.get('datasheet'))

def resolve_preview(plan,existing,choices=None):
    """Select only changes shown in a fresh preview. Omission means supplement.

    choices maps source IDs to {mode: supplement|replace|skip, keys: [], fields: []}.
    Ambiguous identities and missing required assets cannot be forced through.
    """
    result=copy.deepcopy(plan);choices=choices or {};by_id={r['id']:r for r in existing}
    ids={i['row']['id'] for i in result['items']}
    if set(choices)-ids:raise ValueError('Unknown import selection')
    for item in result['items']:
        choice=choices.get(item['row']['id'],{});mode=choice.get('mode','supplement')
        if mode not in ('supplement','replace','skip'):raise ValueError('Unknown import mode')
        if mode=='skip':item['state']='skipped';continue
        target=by_id.get(item['target']);row=item['row']
        if not target or item['state'] in ('rejected','review') or (item['state']=='conflict' and not item['reason'].startswith('Existing values differ:')):
            if mode=='replace':raise ValueError('Replacement requires an unambiguous existing component')
            continue
        available={p['name'] for p in row.get('parameters',[])} & set(row.get('values',{}))
        keys=choice.get('keys',sorted(available-set(target.get('values',{}))))
        fields=choice.get('fields',[])
        if not isinstance(keys,list) or not isinstance(fields,list) or set(keys)-available or set(fields)-set(REPLACE_FIELDS):raise ValueError('Invalid selected fields')
        if any(f not in row for f in fields):raise ValueError('Replacement field absent from source')
        protected=set(target.get('manual_data',{}).get('values',{}))
        if mode=='replace' and (set(keys)&protected or ('datasheet' in fields and 'datasheet' in target.get('manual_data',{}))):raise ValueError('Manually maintained values must be changed in the data editor')
        if mode=='supplement':
            keys=[k for k in keys if k not in target.get('values',{})]
            fields=[f for f in fields if not target.get(f) and row.get(f)]
        else:
            keys=[k for k in keys if target.get('values',{}).get(k)!=row['values'][k]]
            fields=[f for f in fields if row[f]!=target.get(f)]
        assets=choice.get('assets',[])
        if not isinstance(assets,list) or set(assets)-set(ASSET_FIELDS):raise ValueError('Invalid selected assets')
        for asset in assets:
            if asset=='datasheet_file' and 'datasheet' in target.get('manual_data',{}):raise ValueError('Manually maintained datasheet must be changed in the data editor')
            if asset_present(row,asset) and (mode=='replace' or not asset_present(target,asset)):
                fields.extend(f for f in ASSET_FIELDS[asset] if f in row and row[f]!=target.get(f))
        fields=list(dict.fromkeys(fields))
        item.update(state='selected' if keys or fields else 'unchanged',keys=keys,fields=fields,mode=mode)
    result['counts']=dict(Counter(i['state'] for i in result['items']))
    return result

def apply_preview(plan,path,existing,check_cancel=lambda:None,choices=None):
    """Commit the whole run once. Concurrent/stale proposals must be regenerated."""
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);lock=Path(str(path)+'.lock');temporary=None
    handle=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    try:
        store=read_store(path)
        if plan['baseline']!=digest(existing) or plan['store_digest']!=digest(store):raise ValueError('Stale import preview')
        if choices is not None:plan=resolve_preview(plan,existing,choices)
        before=copy.deepcopy(store)
        by_id={r['id']:r for r in store['components']};added=updated=0
        for item in plan['items']:
            check_cancel()
            row=item['row'];target=item['target']
            if item['state']=='new':
                store['components'].append(copy.deepcopy(row));by_id[target]=store['components'][-1];added+=1
            elif item['state']=='supplement':
                parameters_to_add=[p for p in row['parameters'] if p['name'] in item['keys']]
                if target in by_id:
                    by_id[target]['values'].update({k:row['values'][k] for k in item['keys']});by_id[target]['parameters'].extend(copy.deepcopy(parameters_to_add))
                else:store['patches'].setdefault(target,dict(parameters=[]))['parameters'].extend(copy.deepcopy(parameters_to_add))
                updated+=len(item['keys'])
            elif item['state']=='selected':
                selected=[copy.deepcopy(p) for p in row['parameters'] if p['name'] in item['keys']]
                if target in by_id:
                    current=by_id[target];current.setdefault('values',{}).update({k:row['values'][k] for k in item['keys']})
                    current['parameters']=[p for p in current.get('parameters',[]) if p['name'] not in item['keys']]+selected
                    current.update({f:copy.deepcopy(row[f]) for f in item['fields']})
                else:
                    patch=store['patches'].setdefault(target,dict(parameters=[]))
                    bucket='replacements' if item['mode']=='replace' else 'parameters'
                    patch[bucket]=[p for p in patch.get(bucket,[]) if p['name'] not in item['keys']]+selected
                    patch.setdefault('fields',{}).update({f:copy.deepcopy(row[f]) for f in item['fields']})
                updated+=len(item['keys'])
        receipt=dict(run_id=digest([plan['source'],datetime.now(timezone.utc).isoformat()])[:24],source=plan['source'],counts=plan['counts'],added=added,parameters_added=updated,created_at=datetime.now(timezone.utc).isoformat())
        if not added and not updated and not any(i.get('fields') for i in plan['items'] if i['state']=='selected'):
            return dict(receipt,unchanged=True)
        store['runs'].append(receipt)
        if added or updated or any(i.get('fields') for i in plan['items'] if i['state']=='selected'):
            # One-step undo, without recursively copying earlier snapshots.
            before.pop('undo',None)
            store['undo']=dict(run_id=receipt['run_id'],before=before,after=digest({k:v for k,v in store.items() if k!='undo'}))
        with tempfile.NamedTemporaryFile(mode='w',encoding='utf8',dir=path.parent,delete=False) as file:
            temporary=Path(file.name);json.dump(store,file,ensure_ascii=False,allow_nan=False);file.flush();os.fsync(file.fileno())
        check_cancel();temporary.replace(path);temporary=None
        return receipt
    finally:
        os.close(handle);lock.unlink(missing_ok=True)
        if temporary:temporary.unlink(missing_ok=True)

def undo_import(path,run_id):
    """Undo the last changing import only; reject a changed index."""
    path=Path(path);lock=Path(str(path)+'.lock');temporary=None
    handle=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    try:
        store=read_store(path);undo=store.get('undo',{})
        if undo.get('run_id')!=run_id or undo.get('after')!=digest({k:v for k,v in store.items() if k!='undo'}):raise ValueError('Import undo is stale or unavailable')
        with tempfile.NamedTemporaryFile(mode='w',encoding='utf8',dir=path.parent,delete=False) as file:
            temporary=Path(file.name);json.dump(undo['before'],file,ensure_ascii=False,allow_nan=False);file.flush();os.fsync(file.fileno())
        temporary.replace(path);temporary=None
        return dict(undone=run_id)
    finally:
        os.close(handle);lock.unlink(missing_ok=True)
        if temporary:temporary.unlink(missing_ok=True)
