import json
from pathlib import Path
import pytest
from kicad_parts_manager.first_run import discover,validate
from kicad_parts_manager.browser import InventoryCache,ScanCancelled
from kicad_parts_manager.api_errors import ApiError


def library(tmp_path):
    share=tmp_path/'share';(share/'symbols').mkdir(parents=True)
    (share/'symbols'/'Test.kicad_sym').write_text('(kicad_symbol_lib (symbol "First" (symbol "First_0_1" (rectangle (start 0 0) (end 1 1)))))')
    return {'share':str(share),'config':str(tmp_path/'profile')}


def test_discovery_sorts_versions_and_reports_missing_tables(tmp_path):
    env={'ProgramFiles':str(tmp_path/'programs'),'LOCALAPPDATA':str(tmp_path/'local'),'APPDATA':str(tmp_path/'settings')}
    for version in ('9.0','10.0'):(tmp_path/'programs'/'KiCad'/version/'share/kicad/symbols').mkdir(parents=True)
    result=discover(env,tmp_path/'home')
    assert [item['version'] for item in result]==['10.0','9.0']
    assert not result[0]['tables_ready']
    assert not (tmp_path/'settings').exists()
    assert discover({'ProgramFiles':str(tmp_path/'missing'),'LOCALAPPDATA':str(tmp_path/'missing')},tmp_path/'missing')==[]


def test_first_scan_publishes_new_index_and_preserves_sources(tmp_path):
    settings=library(tmp_path);source=Path(settings['share'])/'symbols/Test.kicad_sym';before=source.read_bytes()
    cache=InventoryCache(tmp_path/'inventory.json');updates=[]
    result=cache.rescan(updates.append,setup=settings)
    assert result['counts']['symbols']==1
    assert result['tables_ready'] is False
    assert cache()['components'][0]['name']=='First'
    assert source.read_bytes()==before
    assert not Path(settings['config']).exists()
    assert updates[-1]['phase']=='saveIndex'
    saved=cache.path.read_bytes()
    with pytest.raises(ApiError,match='already exists'):cache.rescan(lambda _:None,setup=settings)
    assert cache.path.read_bytes()==saved


def test_cancel_first_scan_leaves_no_incomplete_index(tmp_path):
    settings=library(tmp_path);cache=InventoryCache(tmp_path/'inventory.json')
    def cancel(update):cache.cancel_scan()
    with pytest.raises(ScanCancelled):cache.rescan(cancel,setup=settings)
    assert not cache.path.exists()
    assert not list(tmp_path.glob('*.tmp'))
    assert not cache.scan_lock.locked()


def test_invalid_or_empty_library_can_be_corrected(tmp_path):
    with pytest.raises(ApiError):validate({'share':'relative','config':'relative'})
    settings=library(tmp_path)
    (Path(settings['share'])/'symbols/Test.kicad_sym').write_text('(kicad_symbol_lib)')
    cache=InventoryCache(tmp_path/'inventory.json')
    with pytest.raises(ApiError,match='No readable'):cache.rescan(lambda _:None,setup=settings)
    assert not cache.path.exists()


def test_concurrent_index_is_never_overwritten(tmp_path):
    settings=library(tmp_path);cache=InventoryCache(tmp_path/'inventory.json')
    def concurrent(update):
        if update['phase']=='saveIndex':cache.path.write_text('existing catalog')
    with pytest.raises(ApiError,match='during setup'):cache.rescan(concurrent,setup=settings)
    assert cache.path.read_text()=='existing catalog'


def test_setup_api_requires_local_origin_and_stops_prompt_after_success(tmp_path,monkeypatch):
    from functools import partial
    from threading import Thread
    from urllib.request import Request,urlopen
    from urllib.error import HTTPError
    from kicad_parts_manager.browser import Handler,LocalServer
    settings=library(tmp_path);cache=InventoryCache(tmp_path/'inventory.json')
    monkeypatch.setattr('kicad_parts_manager.browser.discover_kicad',lambda:[dict(settings,version='10.0')])
    server=LocalServer(('127.0.0.1',0),partial(Handler,database=None,inventory=cache))
    worker=Thread(target=server.serve_forever,daemon=True);worker.start()
    base=f'http://127.0.0.1:{server.server_port}'
    try:
        with urlopen(base+'/api/setup') as response:assert json.load(response)['required']
        body=json.dumps(settings).encode()
        with pytest.raises(HTTPError) as error:
            urlopen(Request(base+'/api/setup/scan',data=body,headers={'Content-Type':'application/json'}))
        assert error.value.code==403
        with urlopen(Request(base+'/api/setup/scan',data=body,headers={'Content-Type':'application/json','Origin':base})) as response:
            messages=[json.loads(line) for line in response]
        assert messages[-1]['result']['counts']['symbols']==1
        with urlopen(base+'/api/setup') as response:assert not json.load(response)['required']
    finally:
        server.shutdown();server.server_close();worker.join()
