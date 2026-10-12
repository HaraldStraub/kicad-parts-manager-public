from kicad_parts_manager.compatibility import main_database, migrate_environment


def test_existing_database_path_is_retained_and_new_name_has_precedence(tmp_path):
    folder=tmp_path/'db';folder.mkdir()
    old=folder/'componentdb.sqlite';old.write_bytes(b'existing user data')
    assert main_database(tmp_path)==old
    new=folder/'kicad-parts-manager.sqlite';new.write_bytes(b'new installation')
    assert main_database(tmp_path)==new
    assert old.read_bytes()==b'existing user data'


def test_existing_environment_is_supported_without_replacing_new_settings(monkeypatch):
    import os
    monkeypatch.setattr(os,'environ',os.environ.copy())
    monkeypatch.setenv('COMPONENTDB_NGSPICE','legacy')
    monkeypatch.delenv('KICAD_PARTS_MANAGER_NGSPICE',raising=False)
    migrate_environment()
    assert os.environ['KICAD_PARTS_MANAGER_NGSPICE']=='legacy'
    monkeypatch.setenv('KICAD_PARTS_MANAGER_NGSPICE','new')
    migrate_environment()
    assert os.environ['KICAD_PARTS_MANAGER_NGSPICE']=='new'
