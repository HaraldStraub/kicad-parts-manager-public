import json
import threading
from functools import partial
from http.server import ThreadingHTTPServer
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import pytest
from kicad_parts_manager.model_library import ModelLibrary,definitions,symbol_pins
from kicad_parts_manager.browser import Handler
from sqlalchemy import create_engine


def test_definitions_do_not_index_internal_models():
    text='.model 1N914 D (IS=1e-9)\n.subckt BUF IN OUT\n.model internal NPN\n.ends\n.model BC547 NPN (BF=200)'
    result=list(definitions(text))
    assert [r['name'] for r in result]==['1N914','BUF','BC547']
    assert result[1]['pins']==['IN','OUT']


def test_bundle_resolves_dependencies_and_preserves_files(tmp_path):
    lib=ModelLibrary(tmp_path)
    assert lib.upload_bundle([{'name':'root.lib','content':'* copyright retained\n.include "parts/diode.lib"\n.subckt TEST A K\nD1 A K MYD\n.ends'},
        {'name':'parts/diode.lib','content':'.model MYD D (IS=1e-9)'}],'Manufacturer')==2
    c=lib.search('TEST')['candidates'][0]
    text=lib.safe_text(lib.get(c['id']))
    assert '.model MYD' in text and '.subckt TEST' in text and 'copyright retained' in text


@pytest.mark.parametrize('path',['../bad.lib','/bad.lib','x/../../bad.lib','C:/bad.lib'])
def test_bundle_rejects_path_escape(tmp_path,path):
    with pytest.raises(ValueError):ModelLibrary(tmp_path).upload_bundle([dict(name=path,content='.model D D')],'Test')


@pytest.mark.parametrize('directive',['.control\nshell dir\n.endc','.include "../secret.lib"','.osdi evil.dll'])
def test_untrusted_models_cannot_execute_commands_or_read_external_files(tmp_path,directive):
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model SAFE D (IS=1e-9)\n'+directive)
    with pytest.raises(ValueError):lib.safe_text(lib.get(lib.search('SAFE')['candidates'][0]['id']))


def test_selected_model_excludes_unrelated_circuits_and_model_definitions(tmp_path):
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model RIGHT D (IS=1e-9)\nVexample bad 0 NONSENSE\n.model WRONG D (IS=3)')
    c=lib.search('RIGHT')['candidates'][0];text=lib.safe_text(lib.get(c['id']))
    assert 'RIGHT' in text and 'Vexample' not in text and 'WRONG' not in text


def test_assignment_is_persistent_and_does_not_claim_behavior_test(tmp_path):
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model MYPART D (IS=1e-9)')
    c=lib.search('MYPART')['candidates'][0]
    model=lib.assign('Diode:1N914',c['id'],['2','1'],dict(ok=True,passed=['switching']))
    assert model['status']=='UNVERIFIED' and model['passed']==[] and model['check'] is None
    assert model['pin_map'][0]['symbol_pin']=='2'
    assert ModelLibrary(tmp_path).assigned('Diode:1N914')==model
    assert '.model MYPART' in __import__('pathlib').Path(model['file']).read_text()


def test_changed_files_reject_old_model_hash(tmp_path):
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model SAFE D (IS=1e-9)')
    c=lib.get(lib.search('SAFE')['candidates'][0]['id'])
    __import__('pathlib').Path(c['file']).write_text('.model CHANGED D')
    with pytest.raises(ValueError,match='verändert'):lib.safe_text(c)


def test_ignored_parameters_do_not_count_as_compatible(tmp_path,monkeypatch):
    from types import SimpleNamespace
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model SAFE D (IS=1e-9)')
    c=lib.search('SAFE')['candidates'][0]
    monkeypatch.setattr('kicad_parts_manager.model_library.find_ngspice',lambda:'simulator')
    monkeypatch.setattr('kicad_parts_manager.model_library.subprocess.run',lambda *a,**k:SimpleNamespace(returncode=0,stdout='No. of Data Rows : 1',stderr='unrecognized parameter (rl) - ignored'))
    assert lib.test(c['id'],[.65,0])['ok'] is False


def test_symbol_pins_resolve_inherited_symbols(tmp_path):
    path=tmp_path/'symbols.kicad_sym'
    path.write_text('(kicad_symbol_lib (symbol "Base" (symbol "Base_1_1" (pin input line (name "A") (number "2")))) (symbol "Part" (extends "Base")))')
    assert symbol_pins(dict(source_file=str(path),symbol='Test:Part'))==[dict(number='2',name='A',electrical='input')]


def test_write_endpoint_rejects_foreign_origin(tmp_path):
    lib=ModelLibrary(tmp_path/'models');engine=create_engine('sqlite://')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,database=engine,models=lib))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base=f'http://127.0.0.1:{server.server_port}'
    body=json.dumps(dict(files=[dict(name='test.lib',content='.model SAFE D (IS=1e-9)')])).encode()
    try:
        bad=Request(base+'/api/models/import',body,headers={'Content-Type':'application/json','Origin':'https://other.example'})
        with pytest.raises(HTTPError) as error:urlopen(bad)
        assert error.value.code==403 and lib.search('SAFE')['total']==0
        good=Request(base+'/api/models/import',body,headers={'Content-Type':'application/json','Origin':base})
        assert json.load(urlopen(good))['imported']==1
    finally:server.shutdown();server.server_close();thread.join();engine.dispose()


@pytest.mark.parametrize('kind,roles,numbers,names,status',[
    ('D',['A','K'],['2','1'],['K','A'],'checked'),
    ('D',['A','K'],['1','2'],['K','A'],'conflict'),
    ('D',['A','K'],['1','2'],['~','~'],'unknown'),
    ('X',['1','2'],['1','2'],['A','K'],'unknown'),
    ('Q',['C','B','E'],['1','2','3'],['C','B','E'],'checked'),
    ('Q',['C','B','E'],['2','1','3'],['C','B','E'],'conflict'),
    ('M',['D','G','S','B'],['1','2','3','3'],['D','G','S'],'checked'),
])
def test_explicit_pin_mapping(kind,roles,numbers,names,status):
    from kicad_parts_manager.model_library import check_pin_mapping
    symbol=[dict(number=str(i+1),name=name) for i,name in enumerate(names)]
    assert check_pin_mapping(dict(type=kind,pins=roles),numbers,symbol)['status']==status


def test_mapping_conflict_skips_simulator_and_blocks_assignment(tmp_path,monkeypatch):
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model SAFE D (IS=1e-9)')
    id_=lib.search('SAFE')['candidates'][0]['id']
    info=[dict(number='1',name='K'),dict(number='2',name='A')]
    monkeypatch.setattr('kicad_parts_manager.model_library.find_ngspice',lambda:pytest.fail('Should not run'))
    result=lib.test(id_,[.65,0],'Diode:SAFE',['1','2'],info)
    assert not result['ok'] and result['mapping']['status']=='conflict'
    with pytest.raises(ValueError,match='SIM-Anschluss'):
        lib.assign('Diode:SAFE',id_,['1','2'],symbol_info=info)


def test_saved_check_is_bound_to_mapping_component_and_settings(tmp_path,monkeypatch):
    from types import SimpleNamespace
    lib=ModelLibrary(tmp_path);lib.upload('test.lib','.model SAFE D (IS=1e-9)')
    id_=lib.search('SAFE')['candidates'][0]['id']
    info=[dict(number='1',name='~'),dict(number='2',name='~')]
    monkeypatch.setattr('kicad_parts_manager.model_library.find_ngspice',lambda:'simulator')
    monkeypatch.setattr('kicad_parts_manager.model_library.subprocess.run',lambda *a,**k:SimpleNamespace(returncode=0,stdout='No. of Data Rows : 1',stderr=''))
    lib.test(id_,[.65,0],'Diode:SAFE',['1','2'],info)
    assert lib.assign('Diode:SAFE',id_,['1','2'],symbol_info=info,biases=[.65,0])['check']['mapping']['status']=='unknown'
    assert lib.assign('Diode:OTHER',id_,['1','2'],symbol_info=info,biases=[.65,0])['check'] is None
    assert lib.assign('Diode:SAFE',id_,['2','1'],symbol_info=info,biases=[.65,0])['check'] is None
    assert lib.assign('Diode:SAFE',id_,['1','2'],symbol_info=info,biases=[1,0])['check'] is None


def test_calculability_check_does_not_survive_a_symbol_library_revision(tmp_path,monkeypatch):
    from types import SimpleNamespace
    from kicad_parts_manager.model_library import symbol_source
    library=ModelLibrary(tmp_path/'models');library.upload('test.lib','.model SAFE D (IS=1e-9)')
    id_=library.search('SAFE')['candidates'][0]['id'];info=[dict(number='1',name='~'),dict(number='2',name='~')]
    path=tmp_path/'symbol.kicad_sym';path.write_text('first revision');row=dict(source_file=str(path),symbol='Diode:SAFE')
    original=symbol_source(row)
    monkeypatch.setattr('kicad_parts_manager.model_library.find_ngspice',lambda:'simulator')
    monkeypatch.setattr('kicad_parts_manager.model_library.subprocess.run',lambda *a,**k:SimpleNamespace(returncode=0,stdout='No. of Data Rows : 1',stderr=''))
    library.test(id_,[.65,0],'Diode:SAFE',['1','2'],info,original)
    assert library.assign('Diode:SAFE',id_,['1','2'],symbol_info=info,biases=[.65,0],symbol_source=original)['check']['ok']
    assert library.assign('Diode:SAFE',id_,['1','2'],symbol_info=info,biases=[.65,0],symbol_source=dict(original,symbol='Diode:OTHER'))['check'] is None
    path.write_text('second revision, same pin numbers')
    assert library.assign('Diode:SAFE',id_,['1','2'],symbol_info=info,biases=[.65,0],symbol_source=symbol_source(row))['check'] is None
    assert symbol_source(dict(source_file=str(tmp_path/'missing'))) is None
