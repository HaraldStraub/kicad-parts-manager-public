from hashlib import sha256
from kicad_parts_manager.simulation_evidence import refresh_simulation_files
from kicad_parts_manager.model_library import ModelLibrary


def test_missing_and_changed_files_invalidate_evidence(tmp_path):
    path=tmp_path/'model.lib';path.write_bytes(b'.model D D')
    model=dict(file=str(path),sha256=sha256(path.read_bytes()).hexdigest(),passed=['switching'],check={'ok':True})
    original=dict(model);row=dict(models=[model])
    refresh_simulation_files([row]);assert row['models'][0]['file_status']=='found'
    path.write_bytes(b'.model DIFFERENT D')
    row=dict(models=[model]);refresh_simulation_files([row])
    assert row['models'][0]['file_status']=='changed' and row['models'][0]['passed']==[]
    assert row['models'][0]['check']['stale'] and not row['models'][0]['check']['ok']
    assert model==original
    path.unlink();row=dict(models=[model]);refresh_simulation_files([row])
    assert row['models'][0]['file_status']=='missing'


def test_legacy_native_model_path_is_checked_live(tmp_path):
    path=tmp_path/'diode.lib';path.write_text('.model D D')
    row=dict(models=[],source_file=str(tmp_path/'diode.kicad_sym'),simulation_fields={'Sim.Library':'diode.lib'},simulation_file_found=False)
    refresh_simulation_files([row]);assert row['simulation_file_status']=='found' and row['simulation_file_found']
    path.unlink();refresh_simulation_files([row]);assert row['simulation_file_status']=='missing'


def test_prepared_model_hash_differs_from_original_and_detects_edit(tmp_path):
    library=ModelLibrary(tmp_path/'models');library.upload('bundle.lib','.model SAFE D\n.model OTHER D')
    id_=library.search('SAFE')['candidates'][0]['id'];library.assign('Diode:SAFE',id_,['2','1'])
    model=library.assigned('Diode:SAFE');row=dict(models=[model]);refresh_simulation_files([row])
    assert row['models'][0]['file_status']=='found'
    from pathlib import Path
    Path(model['file']).write_text('.model EDITED D')
    row=dict(models=[model]);refresh_simulation_files([row]);assert row['models'][0]['file_status']=='changed'


def test_edited_original_model_invalidates_prepared_model(tmp_path):
    library=ModelLibrary(tmp_path/'models');library.upload('diode.lib','.model SAFE D')
    id_=library.search('SAFE')['candidates'][0]['id'];library.assign('Diode:SAFE',id_,['2','1'])
    from pathlib import Path
    Path(library.get(id_)['file']).write_text('.model EDITED D')
    row=dict(models=[library.assigned('Diode:SAFE')]);refresh_simulation_files([row]);assert row['models'][0]['file_status']=='changed'


def test_symbol_revision_invalidates_local_test_without_changing_model_file(tmp_path):
    model_file=tmp_path/'diode.lib';model_file.write_bytes(b'.model SAFE D')
    symbol_file=tmp_path/'diode.kicad_sym';symbol_file.write_bytes(b'symbol revision one')
    model=dict(id='LOCAL-SAFE',file=str(model_file),sha256=sha256(model_file.read_bytes()).hexdigest(),symbol_source_file=str(symbol_file),symbol_source_sha256=sha256(symbol_file.read_bytes()).hexdigest(),passed=['operating_point'],check={'ok':True,'diode_function':{'ok':True}})
    row=dict(models=[model]);refresh_simulation_files([row]);assert row['models'][0]['check']['ok'] and row['models'][0]['symbol_status']=='found'
    symbol_file.write_bytes(b'symbol revision two: changed geometry, same pin numbers')
    row=dict(models=[model]);refresh_simulation_files([row]);updated=row['models'][0]
    assert updated['file_status']=='found' and updated['symbol_status']=='changed'
    assert updated['check']['stale'] and not updated['check']['ok'] and updated['passed']==[]
    assert 'Symbolbibliothek' in updated['check']['stale_reason'] and model['check']['ok']
    symbol_file.unlink();row=dict(models=[model]);refresh_simulation_files([row]);assert row['models'][0]['symbol_status']=='missing'
    legacy=dict(model);legacy.pop('symbol_source_sha256');row=dict(models=[legacy]);refresh_simulation_files([row]);assert row['models'][0]['symbol_status']=='unknown' and row['models'][0]['check']['stale']


def test_same_library_hash_does_not_preserve_evidence_after_symbol_remapping(tmp_path):
    model_file=tmp_path/'diode.lib';model_file.write_bytes(b'.model SAFE D')
    symbol_file=tmp_path/'symbols.kicad_sym';symbol_file.write_bytes(b'two symbols with equal pin names')
    model=dict(id='LOCAL-SAFE',file=str(model_file),sha256=sha256(model_file.read_bytes()).hexdigest(),symbol_source_file=str(symbol_file),symbol_source_sha256=sha256(symbol_file.read_bytes()).hexdigest(),symbol_source_reference='Diode:First',check={'ok':True})
    row=dict(symbol='Diode:First',models=[model]);refresh_simulation_files([row]);assert row['models'][0]['check']['ok']
    row=dict(symbol='Diode:Second',models=[model]);refresh_simulation_files([row]);assert row['models'][0]['file_status']=='found' and row['models'][0]['symbol_status']=='changed' and row['models'][0]['check']['stale']
