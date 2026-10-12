import base64
import io
import json
from pathlib import Path
from zipfile import ZipFile,ZipInfo
import pytest
from kicad_parts_manager.component_import import ComponentImport,unpack,set_properties,rewrite_3d
from kicad_parts_manager.library_import import read_store,merge_inventory
from kicad_parts_manager.kicad.inventory import parse,children,properties

SYMBOL='''(kicad_symbol_lib (version 20241209) (generator "test")
 (symbol "1N4148W" (property "Reference" "D") (property "Value" "1N4148W")
 (property "Footprint" "Original:P35_SOD-123F") (property "Description" "Switching diode")
 (symbol "1N4148W_1_1"
 (pin passive line (at 0 0 0) (length 2.54) (name "K") (number "1"))
 (pin passive line (at 5 0 180) (length 2.54) (name "A") (number "2")))))'''
FOOTPRINT='''(footprint "P35_SOD-123F " (version 20241229) (generator "test")
 (pad "1" smd rect (at 0 0) (size 1 1) (layers "F.Cu"))
 (pad "2" smd rect (at 3 0) (size 1 1) (layers "F.Cu"))
 (model "F:/foreign/private.stp" (offset (xyz -1.9 -0.3 -0.1)) (scale (xyz 1 1 1)) (rotate (xyz 0 0 0))))'''
SIM='.subckt 1N4148W A K params: Ifav=0.15\nD A K internal\n.model internal D(Is=1n)\n.ends'

def upload(name,content):return dict(name=name,content=base64.b64encode(content if isinstance(content,bytes) else content.encode()).decode())
def bundle(symbol=SYMBOL,footprint=FOOTPRINT,sim=SIM):
    z=io.BytesIO()
    with ZipFile(z,'w') as f:
        f.writestr('1N4148W.kicad_sym',symbol)
        if footprint:f.writestr('P35_SOD-123F.kicad_mod',footprint)
    result=[upload('1N4148W.zip',z.getvalue())]
    if sim:result.append(upload('model.txt',sim))
    result.extend([upload('1N4148W.STEP','ISO-10303-21; HEADER; ENDSEC;'),upload('diode.pdf',b'%PDF-1.4\n')])
    return result

@pytest.fixture
def service(tmp_path):return ComponentImport(tmp_path/'db/imports.json',default_root=tmp_path/'Documents/user-library')
def existing(service):return merge_inventory(None,read_store(service.index))['components']
def prepare(service,files=None,rows=None):return service.prepare(dict(files=files or bundle(),manufacturer='Diotec'),rows or [])

def test_preview_is_read_only_and_maps_sample_pins(service):
    result=prepare(service);assert not service.index.exists()
    assert len(result['items'])==1
    assert result['items'][0]['footprint_preview']['shapes']
    assert result['items'][0]['pins'][0]==[dict(model_pin=1,model_pin_name='A',symbol_pin='2'),dict(model_pin=2,model_pin_name='K',symbol_pin='1')]
    assert 'orientation_unverified' in result['notes']
    root=service.session_path(result['session']);raw=root/'Originale/P35_SOD-123F.kicad_mod'
    assert raw.read_text()==FOOTPRINT
    modified=next((root/'Dateien').rglob('*.kicad_mod')).read_text()
    assert 'F:/foreign' not in modified and '../1N4148W.STEP' in modified and '-1.9' in modified

def test_save_register_undo_and_originals(service,tmp_path):
    proposal=prepare(service);config=tmp_path/'kicad';config.mkdir()
    result=service.save(dict(session=proposal['session'],choices={}),[],config)
    assert result['receipt']['added']==1 and result['registration']=='registered'
    row=existing(service)[0];assert row['library']==row['symbol'].split(':')[0]
    assert row['models'] and row['datasheet_path']
    props=properties({s[1]:s for s in children(parse(Path(row['source_file']).read_text()),'symbol')})(row['name'])
    assert props['Sim.Pins']=='2=A 1=K' and props['Sim.Type']=='' and props['Footprint']==row['footprint']
    assert Path(props['Datasheet']).exists() and Path(props['Sim.Library']).exists()
    assert row['symbol'].split(':')[0] in (config/'sym-lib-table').read_text()
    before=list(service.session_path(proposal['session']).rglob('*'))
    service.undo(result['receipt']['run_id']);assert existing(service)==[]
    assert all(p.exists() for p in before)

def test_repeat_does_not_rewrite_catalog(service):
    first=prepare(service);service.save(dict(session=first['session'],choices={}),[])
    before=service.index.read_bytes();rows=existing(service)
    second=prepare(service,rows=rows)
    result=service.save(dict(session=second['session'],choices={}),rows)
    assert result['receipt']['unchanged'] and service.index.read_bytes()==before

def test_explicit_file_replace_preserves_unselected_sim(service):
    p=prepare(service);service.save(dict(session=p['session'],choices={}),[])
    old=existing(service);old_model=old[0]['models'][0]['file'];identifier=old[0]['id']
    p=prepare(service,files=bundle(symbol=SYMBOL.replace('Switching diode','Updated switching diode'),sim=None),rows=old)
    service.save(dict(session=p['session'],choices={identifier:dict(mode='replace',keys=[],fields=[],assets=['library_files'])}),old)
    row=existing(service)[0];assert row['models'][0]['file']==old_model
    props=properties({s[1]:s for s in children(parse(Path(row['source_file']).read_text()),'symbol')})(row['name'])
    assert props['Sim.Library']==Path(old_model).as_posix() and props['Sim.Pins']=='2=A 1=K'
    assert row['description']=='Switching diode'

def test_symbol_only_and_standalone_footprint(service):
    p=prepare(service,files=[upload('diode.kicad_sym',SYMBOL)])
    assert 'footprint_missing' in p['notes']
    service.save(dict(session=p['session'],choices={},categories={p['items'][0]['id']:'unassigned/user'}),[])
    assert existing(service)[0]['category']=='unassigned/user'
    p=prepare(service,files=[upload('P35.kicad_mod',FOOTPRINT)],rows=existing(service))
    assert p['items'][0]['kind']=='footprint'

def test_ambiguous_sim_is_retained_not_assigned(service):
    p=prepare(service,files=bundle(sim=SIM.replace('A K params:','1 2 params:')))
    assert 'sim_unassigned' in p['notes'] and not p['items'][0]['pins']
    assert (service.session_path(p['session'])/'Originale/model.txt').exists()

def test_cancel_and_stale_asset_never_commit(service):
    p=prepare(service);service.cancel(p['session'])
    with pytest.raises(ValueError,match='active'):service.save(dict(session=p['session']),[])
    assert not service.index.exists()
    p=prepare(service);next((service.session_path(p['session'])/'Dateien').rglob('*.kicad_sym')).write_text('changed')
    with pytest.raises(ValueError,match='changed'):service.save(dict(session=p['session']),[])
    assert not service.index.exists()

def test_folder_setting_before_import_only(service,tmp_path):
    root=tmp_path/'other'
    assert service.change_folder(str(root))['folder']==str(root.resolve())
    prepare(service)
    with pytest.raises(ValueError,match='migration'):service.change_folder(str(tmp_path/'third'))

@pytest.mark.parametrize('name',['../x.kicad_sym','C:/x','foo\\bar','x:stream','CON.txt','foo/../x','/x','x.'])
def test_upload_paths_rejected(name):
    with pytest.raises(ValueError):unpack([upload(name,'data')])

def test_zip_symlink_rejected():
    z=io.BytesIO()
    with ZipFile(z,'w') as f:
        info=ZipInfo('linked');info.external_attr=(0o120777<<16);f.writestr(info,'outside')
    with pytest.raises(ValueError,match='links'):unpack([upload('evil.zip',z.getvalue())])

def test_duplicate_basename_and_zip_traversal_rejected():
    with pytest.raises(ValueError,match='Duplicate'):unpack([upload('A.txt','a'),upload('a.txt','b')])
    z=io.BytesIO()
    with ZipFile(z,'w') as f:f.writestr('../unsafe','x')
    with pytest.raises(ValueError):unpack([upload('evil.zip',z.getvalue())])

def test_import_http_routes_share_origin_protection_and_pdf_access(service,tmp_path):
    import threading
    from functools import partial
    from urllib.request import Request,urlopen
    from urllib.error import HTTPError
    from sqlalchemy import create_engine
    from kicad_parts_manager.database.models import Base
    from kicad_parts_manager.browser import Handler,LocalServer
    db=create_engine('sqlite:///'+str(tmp_path/'main.sqlite'));Base.metadata.create_all(db)
    server=LocalServer(('127.0.0.1',0),partial(Handler,database=db,inventory=dict(components=[]),importer=service))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    origin=f'http://127.0.0.1:{server.server_port}'
    def post(route,value,source=origin):
        req=Request(origin+route,data=json.dumps(value).encode(),headers={'Content-Type':'application/json','Origin':source})
        with urlopen(req,timeout=10) as response:return json.load(response)
    try:
        with urlopen(origin+'/import',timeout=10) as response:assert b'id="drop-zone"' in response.read()
        with urlopen(origin+'/model-wizard.css',timeout=10) as response:assert 'text/css' in response.headers['Content-Type'] and b'.wizard-layout' in response.read()
        with pytest.raises(HTTPError) as denied:post('/api/import/preview',dict(files=bundle()),'https://example.com')
        assert denied.value.code==403 and not service.index.exists()
        result=post('/api/import/preview',dict(files=bundle(),manufacturer='Diotec'))
        draft=dict(session=result['session'],component_id=result['items'][0]['id'])
        pins=post('/api/import/sim',dict(draft,action='pins'));assert len(pins['pins'])==2
        candidates=post('/api/import/sim',dict(draft,action='search',query='1N4148W'))['candidates'];assert candidates
        assigned=post('/api/import/sim',dict(draft,action='assign',model_id=candidates[0]['id'],pins=['2','1']));assert assigned['assignment']['pins']==['2','1'] and not service.index.exists()
        url='/api/import/file?session='+result['session']+'&name=diode.pdf'
        with urlopen(origin+url,timeout=10) as response:assert response.headers['Content-Type']=='application/pdf' and response.read().startswith(b'%PDF-')
        saved=post('/api/import/save',dict(session=result['session'],choices={}))
        assert saved['receipt']['added']==1
        with urlopen(origin+'/api/catalog',timeout=10) as response:assert json.load(response)['components'][0]['name']=='1N4148W'
        with urlopen(origin+'/api/preview/'+result['items'][0]['id'],timeout=10) as response:assert json.load(response)['symbol']['shapes']
        post('/api/import/undo',dict(run_id=saved['receipt']['run_id']));assert existing(service)==[]
    finally:server.shutdown();server.server_close();thread.join();db.dispose()

def test_transfer_relocates_working_files_but_keeps_originals(tmp_path):
    import runpy
    portable=runpy.run_path(str(Path(__file__).resolve().parents[1]/'tools/portable_setup.py'))
    old_root=tmp_path/'old';old_user=old_root/'Documents/library';target=tmp_path/'target';folder=target/'user-library'
    original=folder/'Imports/token/Originale/part.kicad_sym';original.parent.mkdir(parents=True)
    text='(kicad_symbol_lib (symbol "D" (property "Sim.Library" '+json.dumps((old_user/'Imports/token/Dateien/m.lib').as_posix())+') (property "Datasheet" '+json.dumps((old_user/'Imports/token/Dateien/d.pdf').as_posix())+')))' 
    original.write_text(text);working=folder/'Imports/token/Final/D.kicad_sym';working.parent.mkdir();working.write_text(text)
    (target/'db').mkdir();(target/'db/user-import-settings.json').write_text('{}')
    pending=folder/'Imports/token/preview.json';pending.write_text(json.dumps(dict(status='preview',source=str(old_user))))
    mappings=[(str(old_root),str(target))]
    portable['relocate_user_library'](target,dict(user_library_original=str(old_user)),mappings)
    assert original.read_text()==text
    assert str(old_user).replace('\\','/') not in working.read_text()
    assert (folder/'Imports/token/Dateien/m.lib').as_posix() in working.read_text()
    assert json.loads(pending.read_text())['status']=='transferred'
    assert json.loads((target/'db/user-import-settings.json').read_text())['folder']==str(folder)
    assert portable['relocate'](str(old_user/'file'),mappings)==str(folder/'file')

def test_native_replacement_keeps_legacy_local_data_identity(service):
    from kicad_parts_manager.manual_data import component_key
    p=prepare(service);root,data=service.load(p['session']);native=dict(data['plan']['items'][0]['row'])
    native.update(id='SYM-native',import_key=None,local_data_key=None)
    legacy_key=component_key(native)
    p=prepare(service,rows=[native]);identifier=p['items'][0]['id']
    service.save(dict(session=p['session'],choices={identifier:dict(mode='replace',keys=[],fields=[],assets=['library_files'])}),[native])
    replaced=merge_inventory(dict(components=[native]),read_store(service.index))['components'][0]
    assert replaced['symbol']!=native['symbol']
    assert component_key(replaced)==legacy_key
    assert replaced['import_key']=='SYM-native'
    assert replaced['models']==native['models']


def test_identical_step_inside_zip_and_separately_is_used_once():
    z=io.BytesIO()
    with ZipFile(z,'w') as archive:archive.writestr('part.step',b'ISO-10303-21;')
    result=unpack([upload('part.zip',z.getvalue()),upload('PART.STEP',b'ISO-10303-21;')])
    assert len([name for name in result if name.lower().endswith('.step')])==1


def test_different_optional_duplicate_is_warning_not_fatal():
    warnings=[]
    result=unpack([upload('part.step','first'),upload('PART.STEP','second')],warnings)
    assert result['part.step']==b'first'
    assert warnings==[dict(key='duplicate_ignored',name='PART.STEP')]
    with pytest.raises(ValueError,match='Duplicate'):
        unpack([upload('part.kicad_sym','first'),upload('PART.kicad_sym','second')],[])


def test_category_created_with_component_not_preview(service,tmp_path):
    rows=[dict(id='old',category='semiconductor/diode',name='old')]
    proposal=prepare(service,rows=rows);assert not service.index.exists()
    key=proposal['items'][0]['id'];path='semiconductor/Precision diodes'
    config=tmp_path/'config';config.mkdir()
    service.save(dict(session=proposal['session'],choices={},categories={key:path},new_categories=[path]),rows,config)
    assert next(r for r in existing(service) if r['id']==key)['category']==path

@pytest.mark.parametrize('path',['unknown/New','semiconductor/../wrong','semiconductor/<bad>'])
def test_invalid_new_category_leaves_index_untouched(service,path):
    proposal=prepare(service);key=proposal['items'][0]['id']
    with pytest.raises(ValueError):service.save(dict(session=proposal['session'],choices={},categories={key:path},new_categories=[path]),[dict(id='old',category='semiconductor/diode')])
    assert not service.index.exists()

def test_power_driver_module_description_proposes_igbt_category(service):
    proposal=prepare(service,[upload('module.kicad_sym',SYMBOL.replace('Switching diode','Power Driver Module IGBT 3 Phase 600 V 20 A'))])
    assert proposal['items'][0]['category']=='semiconductor/power_modules/igbt'


def test_user_parameters_saved_atomically_with_new_component(service,tmp_path):
    proposal=prepare(service);key=proposal['items'][0]['id'];config=tmp_path/'config';config.mkdir()
    service.save(dict(session=proposal['session'],choices={},parameter_values={key:{'vf_typ':0.72}}),[],config)
    row=existing(service)[0]
    assert row['values']['vf_typ']==0.72
    assert next(p for p in row['parameters'] if p['name']=='vf_typ')['source_details']['origin']=='manual_import'

@pytest.mark.parametrize('value',[True,float('inf'),'not a number'])
def test_invalid_user_parameter_does_not_commit(service,value):
    proposal=prepare(service);key=proposal['items'][0]['id']
    with pytest.raises(ValueError):service.save(dict(session=proposal['session'],choices={},parameter_values={key:{'vf_typ':value}}),[])
    assert not service.index.exists()


def test_manufacturer_from_file_and_recheck_changes_identity_without_commit(service,tmp_path):
    symbol=SYMBOL.replace('(property "Reference" "D")','(property "Reference" "D") (property "Manufacturer" "Diotec")')
    first=service.prepare(dict(files=[upload('part.kicad_sym',symbol)]),[])
    assert first['items'][0]['manufacturer']=='Diotec'
    key=first['items'][0]['id']
    result=service.recheck(dict(session=first['session'],manufacturers={key:'Other Maker'}),[])
    assert result['items'][0]['manufacturer']=='Other Maker'
    assert result['items'][0]['id']!=key and result['id_map'][key]==result['items'][0]['id']
    assert not service.index.exists()
    root=service.session_path(first['session']);assert (root/'Originale/part.kicad_sym').read_text()==symbol
    config=tmp_path/'config';config.mkdir()
    service.save(dict(session=first['session'],choices={}),[],config)
    row=existing(service)[0];assert row['manufacturer']=='Other Maker'
    props=properties({s[1]:s for s in children(parse(Path(row['source_file']).read_text()),'symbol')})(row['name'])
    assert props['Manufacturer']=='Other Maker'

def test_unknown_manufacturer_does_not_match_other_manufacturer_by_name(service):
    first=prepare(service);key=first['items'][0]['id']
    unrelated=dict(id='external',name='1N4148W',manufacturer='Different',category='semiconductor/diode/switching',footprint='Original:P35_SOD-123F',values={})
    result=service.recheck(dict(session=first['session'],manufacturers={key:''}),[unrelated])
    assert result['items'][0]['existing'] is False
    assert result['items'][0]['manufacturer']==''


def test_numeric_model_comments_suggest_roles_and_save_confirmed_mapping(service):
    names=['RG','VIN-','VIN+','V-','REF','VO','V+','RG']
    pins=''.join(f'(pin passive line (at 0 0 0) (length 1) (name "{name}") (number "{n}"))' for n,name in enumerate(names,1))
    symbol=f'(kicad_symbol_lib (version 20241209) (symbol "INA128" (property "MF" "Texas Instruments") (symbol "INA128_1_1" {pins})))'
    comments='\n'.join('* '+v for v in ['CONNECTIONS: +','| -','| | V+','| | | V-','| | | | Out','| | | | | REF','| | | | | | RG1','| | | | | | | RG2','PIN CONFIG FOR INA128 1 2 3 4 5 8 9 10'])
    model=comments+'\n* Simulator: TINA\n.SUBCKT INA128 1 2 3 4 5 8 9 10\nX1 1 2 A1_128E\n.ENDS\n.SUBCKT A1_128E A B\nR1 A B 1k\n.ENDS'
    proposal=service.prepare(dict(files=[upload('INA128.kicad_sym',symbol),upload('INA128.LIB',model)]),[])
    item=proposal['items'][0];assert item['manufacturer']=='Texas Instruments'
    assert len(item['sim_candidates'])==1
    candidate=item['sim_candidates'][0]
    assert [p['suggested'] for p in candidate['pins']]==['3','2','7','4','6','5','','']
    assert candidate['simulator']=='TINA'
    assignment=dict(model_id=candidate['id'],pins=['3','2','7','4','6','5','1','8'])
    bad=dict(assignment,pins=['2','3','7','4','6','5','1','8'])
    request=dict(session=proposal['session'],choices={item['id']:dict(mode='supplement',assets=['simulation'])},sim_assignments={item['id']:bad})
    with pytest.raises(ValueError,match='conflicts'):service.save(request,[])
    assert not service.index.exists()
    request['sim_assignments'][item['id']]=assignment
    service.save(request,[])
    row=existing(service)[0];assert row['models'][0]['compatibility']=='UNKNOWN'
    assert row['models'][0]['user_confirmed_mapping']
    assert row['simulation_fields']['Sim.Pins']=='3=1 2=2 7=3 4=4 6=5 5=8 1=9 8=10'


def test_candidate_index_reuses_all_same_name_variants_and_copies_rows():
    from kicad_parts_manager.import_matching import ImportCandidateIndex
    index=ImportCandidateIndex()
    rows=[dict(id='a',name='PART',category='a/b',values={'v':1}),dict(id='b',name='part',category='c/d'),dict(id='c',name='OTHER',category='e/f')]
    selected=index.select([dict(id='incoming',name='part')],rows,'v1')
    assert [r['id'] for r in selected]==['a','b'] and selected.categories=={'a/b','c/d','e/f'}
    selected[0]['values']['v']=2
    assert rows[0]['values']['v']==1
    assert len(index.select([dict(id='c',name='unknown')],rows,'v1'))==1 and index.builds==1
    index.select([],rows,'v2');assert index.builds==2


def test_import_store_digest_cache_invalidates_on_change(service):
    from kicad_parts_manager.library_import import digest
    first=service.store_hash()
    assert first==service.store_hash()
    service.index.parent.mkdir(parents=True,exist_ok=True)
    value=dict(schema_version=1,components=[],patches={},runs=[dict(run_id='changed')])
    service.index.write_text(json.dumps(value),encoding='utf-8')
    assert service.store_hash()==digest(value) and service.store_hash()!=first


def test_shared_sim_dialog_stages_local_model_and_only_final_save_assigns(service,tmp_path):
    from kicad_parts_manager.model_library import ModelLibrary
    library=ModelLibrary(tmp_path/'model-library')
    library.upload('diode.lib',SIM,'test')
    proposal=prepare(service,files=bundle(sim=None))
    item=proposal['items'][0];base=dict(session=proposal['session'],component_id=item['id'])
    assert service.sim_action(dict(base,action='pins'),library)['pins'][0]['name']=='K'
    search=service.sim_action(dict(base,action='search',query='1N4148W'),library)
    model=search['candidates'][0]
    result=service.sim_action(dict(base,action='assign',model_id=model['id'],pins=['2','1']),library)
    assert not service.index.exists() and library.assigned(item['id']) is None
    staged=service.sim_action(dict(base,action='search',query=''),library)['candidates'][0]
    assert staged['id'].startswith('DRAFT-')
    service.save(dict(session=proposal['session'],choices={item['id']:dict(mode='supplement',assets=['simulation'])},sim_assignments={item['id']:result['assignment']}),[])
    row=existing(service)[0]
    assert row['models'][0]['pin_map'][0]['symbol_pin']=='2'
    assert Path(row['models'][0]['file']).is_relative_to(service.session_path(proposal['session']))
    assert library.assigned(item['id']) is None


def test_save_without_sim_keeps_original_model_file(service):
    proposal=prepare(service);item=proposal['items'][0]
    service.save(dict(session=proposal['session'],choices={item['id']:dict(mode='supplement',assets=[])}),[])
    row=existing(service)[0]
    assert not row['models'] and not row.get('simulation_fields')
    assert (service.session_path(proposal['session'])/'Originale/model.txt').exists()


def test_inherited_symbol_pins_remain_named():
    from kicad_parts_manager.model_library import _symbol_pins
    tree=parse('(kicad_symbol_lib (symbol "Base" (symbol "Base_1_1" (pin input line (name "VIN+") (number "3")))) (symbol "Child" (extends "Base")))')
    assert _symbol_pins(dict(symbol='Lib:Child'),tree)==[dict(number='3',name='VIN+',electrical='input')]
