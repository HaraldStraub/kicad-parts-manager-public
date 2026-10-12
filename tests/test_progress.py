import json
import threading
from functools import partial
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError

import pytest
from sqlalchemy import create_engine

from kicad_parts_manager.browser import Handler,InventoryCache,LocalServer,ScanCancelled
from kicad_parts_manager.model_library import ModelLibrary
from kicad_parts_manager.kicad.inventory import scan


def inventory_fixture(tmp_path):
    config=tmp_path/'config'/'10.0';config.mkdir(parents=True)
    share=tmp_path/'share';symbols=share/'symbols';symbols.mkdir(parents=True)
    source=symbols/'Diode.kicad_sym'
    source.write_text('(kicad_symbol_lib (symbol "D" (symbol "D_0_1" (rectangle (start 0 0) (end 1 1)))))',encoding='utf8')
    path=tmp_path/'inventory.json'
    path.write_text(json.dumps(scan(config,share,user_home=tmp_path/'home')),encoding='utf8')
    return InventoryCache(path),source


def test_rescan_progress_and_previews_are_published_atomically(tmp_path):
    cache,source=inventory_fixture(tmp_path)
    before=cache();assert before['counts']['symbols']==1
    source.write_text(source.read_text().replace('"D"','"D2"',1),encoding='utf8')
    updates=[]
    def record(update):
        updates.append(update)
        assert cache()['components'][0]['name']=='D'
    result=cache.rescan(record)
    assert result['counts']['symbols']==1
    assert cache()['components'][0]['name']=='D2'
    assert cache()['components'][0]['symbol_preview']['shapes']
    assert updates[0]['phase']=='discover'
    assert updates[-1]['phase']=='saveIndex'
    counts=[u for u in updates if u['phase']=='symbols']
    assert counts[-1]['completed']==counts[-1]['total']==1
    assert not list(tmp_path.glob('*.tmp'))


def test_scan_failure_keeps_existing_index_and_unlocks(tmp_path,monkeypatch):
    cache,_=inventory_fixture(tmp_path);before=cache.path.read_bytes()
    def fail(*args,**kwargs):raise OSError('Scan failed')
    monkeypatch.setattr('kicad_parts_manager.browser.scan',fail)
    with pytest.raises(OSError,match='Scan failed'):cache.rescan(lambda update:None)
    assert cache.path.read_bytes()==before
    assert cache.scan_lock.acquire(blocking=False);cache.scan_lock.release()


@pytest.mark.parametrize('phase',['discover','saveIndex'])
def test_cancel_scan_keeps_original_index_and_removes_temporary_files(tmp_path,phase):
    cache,_=inventory_fixture(tmp_path);before=cache.path.read_bytes()
    assert not cache.cancel_scan()
    def update(event):
        if event['phase']==phase:assert cache.cancel_scan()
    with pytest.raises(ScanCancelled):cache.rescan(update)
    assert cache.path.read_bytes()==before
    assert not list(tmp_path.glob('*.tmp'))
    assert not cache.scan_lock.locked()
    assert cache.rescan(lambda event:None)['counts']['symbols']==1


def test_incremental_scan_reuses_unmodified_files_but_refreshes_models_and_changed_files(tmp_path,monkeypatch):
    cache,source=inventory_fixture(tmp_path)
    previous=cache();config,share=Path(previous['config']),Path(previous['share']);home=tmp_path/'home'
    source.write_text('(kicad_symbol_lib (symbol "D" (property "Footprint" "Test:FP") (symbol "D_0_1" (rectangle (start 0 0) (end 1 1)))))',encoding='utf8')
    footprint=share/'footprints'/'Test.pretty'/'FP.kicad_mod';footprint.parent.mkdir(parents=True)
    model=share/'3dmodels'/'Test.step';model.parent.mkdir()
    footprint.write_text('(footprint "FP" (pad "1" smd rect (at 0 0) (size 1 1)) (model "${KICAD10_3DMODEL_DIR}/Test.step"))',encoding='utf8')
    initial=scan(config,share,user_home=home,include_previews=True)
    reads=[]
    from kicad_parts_manager.kicad import inventory
    original=inventory.parse
    def record(text):reads.append(text);return original(text)
    monkeypatch.setattr(inventory,'parse',record)
    model.write_text('new 3D file',encoding='utf8')
    warm=scan(config,share,user_home=home,include_previews=True,previous=initial)
    assert reads==[]
    assert warm['components'][0]['footprint_info']['models'][0]['found']
    assert warm['components'][0]['symbol_preview']==initial['components'][0]['symbol_preview']
    assert [row['id'] for row in warm['components']]==[row['id'] for row in initial['components']]
    source.write_text(source.read_text().replace('"D"','"Changed"',1),encoding='utf8')
    changed=scan(config,share,user_home=home,include_previews=True,previous=warm)
    assert len(reads)==1 and changed['components'][0]['name']=='Changed'
    footprint.unlink();reads.clear()
    removed=scan(config,share,user_home=home,include_previews=True,previous=changed)
    assert reads==[] and not removed['components'][0]['footprint_info']['found']


def test_rescan_keeps_custom_roots_from_legacy_indexes_and_generates_footprint_previews(tmp_path):
    cache,source=inventory_fixture(tmp_path)
    extra=tmp_path/'custom';extra.mkdir()
    custom=extra/'Extra.kicad_sym';custom.write_text('(kicad_symbol_lib (symbol "Extra"))',encoding='utf8')
    previous=cache();config,share=Path(previous['config']),Path(previous['share'])
    index=scan(config,share,extra_roots=[extra],user_home=tmp_path/'home')
    del index['extra_roots'];cache.path.write_text(json.dumps(index),encoding='utf8')
    footprint=share/'footprints'/'Test.pretty'/'FP.kicad_mod';footprint.parent.mkdir(parents=True)
    footprint.write_text('(footprint "FP" (pad "1" smd rect (at 0 0) (size 1 1)))',encoding='utf8')
    cache.rescan(lambda update:None)
    result=cache();assert any(row['name']=='Extra' for row in result['components'])
    assert str(extra) in result['extra_roots']
    row=next(row for row in result['components'] if row['kind']=='footprint')
    assert result['previews']['footprints'][row['footprint_preview_key']]['shapes'][0]['type']=='pad'
    cache.scan_lock.acquire()
    try:
        with pytest.raises(ValueError,match='bereits'):cache.rescan(lambda update:None)
    finally:cache.scan_lock.release()


def test_import_has_monotonic_actual_progress_and_preserves_include_files(tmp_path):
    library=ModelLibrary(tmp_path);updates=[]
    count=library.upload_bundle([dict(name='main.lib',content='.include "parts/d.lib"\n.subckt BUF A K\nD1 A K D1\n.ends'),
                                 dict(name='parts/d.lib',content='.model D1 D')],'Test',progress=updates.append)
    assert count==2
    assert [u['completed'] for u in updates]==[1,2,3,4]
    assert {u['total'] for u in updates}=={4}
    assert '.model D1 D' in library.safe_text(library.get(library.search('BUF')['candidates'][0]['id']))


def test_progress_http_stream_reports_result_errors_and_preserves_origin_guard(tmp_path):
    cache,_=inventory_fixture(tmp_path);models=ModelLibrary(tmp_path/'models')
    database=create_engine('sqlite:///'+str(tmp_path/'empty.sqlite'))
    server=LocalServer(('127.0.0.1',0),partial(Handler,database=database,inventory=cache,models=models))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base=f'http://127.0.0.1:{server.server_port}'
    def post(route,body,origin=base):
        return urlopen(Request(base+route,data=json.dumps(body).encode(),headers={'Content-Type':'application/json','Origin':origin}))
    try:
        with post('/api/models/import',{'progress':True,'files':[dict(name='d.lib',content='.model D1 D')]}) as response:
            assert response.headers['Content-Type'].startswith('application/x-ndjson')
            assert response.headers['Cache-Control']=='no-store'
            events=[json.loads(line) for line in response]
        assert events[-1]=={'result':{'imported':1}}
        assert events[-2]['progress']['completed']==events[-2]['progress']['total']==2
        with post('/api/models/import',{'progress':True,'files':[dict(name='../bad.lib',content='')]}) as response:
            events=[json.loads(line) for line in response]
        assert 'error' in events[-1] and 'result' not in events[-1]
        with post('/api/inventory/scan',{}) as response:
            events=[json.loads(line) for line in response]
        assert events[-1]['result']['counts']['symbols']==1
        with pytest.raises(HTTPError) as error:post('/api/inventory/scan',{},origin='https://example.com')
        assert error.value.code==403
        with post('/api/inventory/cancel',{}) as response:assert json.load(response)=={'cancel_requested':False}
    finally:
        server.shutdown();server.server_close();thread.join();database.dispose()


def test_active_scan_can_be_cancelled_over_http_without_changing_index(tmp_path,monkeypatch):
    cache,_=inventory_fixture(tmp_path);original=cache.path.read_bytes();entered=threading.Event()
    def delayed_scan(*args,check_cancel,**kwargs):
        entered.set();assert cache.scan_cancel.wait(5);check_cancel()
    monkeypatch.setattr('kicad_parts_manager.browser.scan',delayed_scan)
    database=create_engine('sqlite:///'+str(tmp_path/'empty.sqlite'))
    server=LocalServer(('127.0.0.1',0),partial(Handler,database=database,inventory=cache))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base=f'http://127.0.0.1:{server.server_port}'
    def post(route):return urlopen(Request(base+route,data=b'{}',headers={'Content-Type':'application/json','Origin':base}),timeout=8)
    try:
        with post('/api/inventory/scan') as response:
            assert entered.wait(3)
            with post('/api/inventory/cancel') as cancelled:assert json.load(cancelled)['cancel_requested']
            events=[json.loads(line) for line in response]
        assert events[-1]['code']=='scan_cancelled'
        assert cache.path.read_bytes()==original
    finally:server.shutdown();server.server_close();thread.join();database.dispose()
