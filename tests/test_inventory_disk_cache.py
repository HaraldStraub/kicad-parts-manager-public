import json
import os

import kicad_parts_manager.browser as browser
import kicad_parts_manager.inventory_disk_cache as disk


def source(tmp_path):
    path=tmp_path/'inventory.json'
    path.write_text(json.dumps({'components':[{'id':'test','kind':'symbol',
        'library':'Device','name':'R','description':'Resistor','category':'unassigned/R'}]}),encoding='utf8')
    return path


def test_next_process_uses_prepared_data_without_category_processing(tmp_path,monkeypatch):
    path=source(tmp_path)
    cold=browser.InventoryCache(path); expected=cold()
    assert not cold.disk_cache_hit
    assert cold.disk_cache.path.is_file()
    def unexpected(*args):raise AssertionError('unchanged category reprocessed')
    monkeypatch.setattr(browser,'functional_category',unexpected)
    warm=browser.InventoryCache(path)
    assert warm()==expected
    assert warm.disk_cache_hit


def test_source_content_edit_even_with_restored_timestamp_invalidates(tmp_path):
    path=source(tmp_path);browser.InventoryCache(path)()
    stamp=path.stat()
    path.write_text(path.read_text().replace('Resistor','RESISTOR'),encoding='utf8')
    os.utime(path,ns=(stamp.st_atime_ns,stamp.st_mtime_ns))
    warm=browser.InventoryCache(path)
    assert warm()['components'][0]['description']=='RESISTOR'
    assert not warm.disk_cache_hit


def test_import_change_and_removal_invalidates(tmp_path):
    path=source(tmp_path);cold=browser.InventoryCache(path);cold()
    imports=cold.import_path
    imports.write_text(json.dumps({'components':[{'id':'added','category':'test'}]}))
    warm=browser.InventoryCache(path)
    assert len(warm()['components'])==2
    assert not warm.disk_cache_hit
    imports.unlink()
    assert len(browser.InventoryCache(path)()['components'])==1


def test_registration_table_change_is_not_hidden(tmp_path):
    path=source(tmp_path);config=tmp_path/'config';config.mkdir()
    table=config/'sym-lib-table';table.write_text('(sym_lib_table)')
    data=json.loads(path.read_text());data.update(config=str(config),share=str(tmp_path))
    data['components'][0].update(symbol='Device:R',source_file=str(tmp_path/'Device.kicad_sym'))
    path.write_text(json.dumps(data))
    assert browser.InventoryCache(path)()['components'][0]['registered'] is False
    table.write_text(f'(sym_lib_table (lib (name "Device") (type "KiCad") (uri "{(tmp_path/"Device.kicad_sym").as_posix()}")))')
    warm=browser.InventoryCache(path)
    assert warm()['components'][0]['registered'] is True
    assert not warm.disk_cache_hit


def test_rule_and_environment_changes_invalidate(tmp_path,monkeypatch):
    path=source(tmp_path);browser.InventoryCache(path)()
    monkeypatch.setattr(disk,'VERSION',disk.VERSION+1)
    updated=browser.InventoryCache(path);updated();assert not updated.disk_cache_hit
    monkeypatch.setenv('KICAD_TEST_LIBRARY_ROOT','changed')
    updated=browser.InventoryCache(path);updated();assert not updated.disk_cache_hit


def test_nested_library_table_change_invalidates(tmp_path):
    path=source(tmp_path);config=tmp_path/'config';config.mkdir()
    nested=config/'included-table';nested.write_text('(sym_lib_table)')
    (config/'sym-lib-table').write_text(f'(sym_lib_table (lib (name "nested") (type "Table") (uri "{nested.as_posix()}")))')
    data=json.loads(path.read_text());data.update(config=str(config),share=str(tmp_path))
    path.write_text(json.dumps(data))
    browser.InventoryCache(path)()
    nested.write_text('(sym_lib_table (version 7))')
    updated=browser.InventoryCache(path);updated();assert not updated.disk_cache_hit


def test_corrupt_cache_and_unwritable_cache_fall_back(tmp_path,monkeypatch):
    path=source(tmp_path);cold=browser.InventoryCache(path);expected=cold()
    cold.disk_cache.path.write_bytes(b'broken gzip')
    def denied(*args,**kwargs):raise PermissionError('read-only')
    monkeypatch.setattr(disk.tempfile,'NamedTemporaryFile',denied)
    warm=browser.InventoryCache(path)
    assert warm()==expected
    assert not warm.disk_cache_hit


def test_concurrent_source_change_does_not_persist_mixed_result(tmp_path,monkeypatch):
    path=source(tmp_path);original=browser.functional_category
    def changed(*args):
        path.write_text(path.read_text().replace('Resistor','Changed!'))
        return original(*args)
    monkeypatch.setattr(browser,'functional_category',changed)
    cold=browser.InventoryCache(path);cold()
    assert not cold.disk_cache.path.exists()
