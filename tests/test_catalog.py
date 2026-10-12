from pathlib import Path
import threading
import json
import gzip
from functools import partial
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
import pytest
from sqlalchemy.orm import Session
from kicad_parts_manager.database.models import Base, Component, SimulationModel, ValidationRun, ValidationResult
from kicad_parts_manager.database.session import engine
from kicad_parts_manager.importers.seed import seed
from kicad_parts_manager.catalog import catalog
from kicad_parts_manager.browser import Handler, InventoryCache, LocalServer


@pytest.fixture
def session(tmp_path):
    database = engine('sqlite:///' + str(tmp_path / 'catalog.sqlite'))
    Base.metadata.create_all(database)
    with Session(database) as session:
        seed(session, Path(__file__).parents[1])
        yield session


def test_references_are_not_manufacturer_parts(session):
    rows = catalog(session)['components']
    assert len(rows) == 8
    assert sum(c['kind'] == 'reference' for c in rows) == 5
    assert sum(c['kind'] == 'generic' for c in rows) == 3
    assert not any(c['kind'] == 'manufacturer' for c in rows)
    mosfet = next(c for c in rows if c['name'] == 'REF-NMOS')
    assert mosfet['values']['rds_on_vgs'] is None
    assert mosfet['models'][0]['passed'] == []
    part = session.get(Component, mosfet['id'])
    part.description = 'Manufacturer part with source'
    session.flush()
    assert next(c for c in catalog(session)['components'] if c['id'] == part.id)['kind'] == 'manufacturer'


def test_shared_preview_geometry_is_not_duplicated_in_inventory_metadata(session):
    inventory={'components':[], 'previews':{'footprints':{'path':{'shapes':[]}}}, 'warnings':[],
               'source_stamps':{'file':123}, 'cache_context':{'key':'scan'}, 'cache_version':1}
    result=catalog(session,inventory)
    assert 'previews' not in result
    assert 'previews' not in result['inventory']
    assert not {'source_stamps','cache_context','cache_version'} & result['inventory'].keys()
    assert result['inventory']['warnings'] == []


def test_evidence_uses_latest_successful_run_and_matching_hash(session):
    model = session.get(SimulationModel, 'SIM-000004')
    def add_run(result='PASS', digest=None):
        run = ValidationRun(simulation_model_id=model.id, ngspice_version='test', platform='test',
                            test_suite_version='test', result=result, log_file='test',
                            model_sha256=digest or model.sha256)
        session.add(run)
        session.flush()
        session.add(ValidationResult(validation_run_id=run.id, test_name='switching', status='PASS', log='test'))
        session.flush()
    def passed():
        return next(c for c in catalog(session)['components'] if c['id'] == model.component_id)['models'][0]['passed']
    add_run()
    assert passed() == ['switching']
    add_run('FAIL')
    assert passed() == []
    add_run(digest='outdated')
    assert passed() == []


def test_http_catalog_and_static_allowlist(session):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, database=session.bind))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}'
    try:
        with urlopen(base + '/api/catalog') as response:
            original=json.load(response)
            assert len(original['components']) == 8
            assert response.headers['Cache-Control'] == 'no-store'
        with urlopen(base+'/api/catalog?compact=1') as response:
            packed=json.load(response)
            for row in packed['components']:
                for field,values in packed['shared'].items():
                    if field+'_shared' in row:row[field]=values[row.pop(field+'_shared')]
            assert packed['components']==original['components']
            assert 'shared' not in original # keep existing API consumers compatible
        with urlopen(Request(base+'/api/catalog',headers={'Accept-Encoding':'br, gzip'})) as response:
            compressed=response.read()
            assert response.headers['Content-Encoding']=='gzip'
            assert response.headers['Vary']=='Accept-Encoding'
            assert int(response.headers['Content-Length'])==len(compressed)
            assert json.loads(gzip.decompress(compressed))==original
        with urlopen(Request(base+'/api/catalog',headers={'Accept-Encoding':'gzip;q=0'})) as response:
            assert response.headers.get('Content-Encoding') is None
            assert json.load(response)==original
        with urlopen(base+'/api/statistics') as response:
            stats=json.load(response)
            assert stats['total']==8
            assert sum(r['total'] for r in stats['categories'])==8
            assert all(0<=r[key]<=r['total'] for r in stats['categories'] for key in ('symbol','footprint','model3d','simulation','values'))
            assert 'components' not in stats
        for route in ('/', '/catalog', '/home.js', '/context-help.js', '/i18n.js', '/search-profiles.js', '/ui-texts.js', '/home.css', '/design-tokens.css', '/home-background.png', '/app.js', '/catalog-utils.js', '/style.css', '/api/info', '/simulation-coverage.js', '/diode-panel.js', '/about-dialog.js'):
            with urlopen(base + route) as response:
                assert response.status == 200
                if route=='/':assert b'id="home-page"' in response.read()
                if route=='/catalog':assert b'id="rows"' in response.read()
                if route=='/home-background.png':
                    assert response.headers['Content-Type']=='image/png'
                    assert response.read().startswith(b'\x89PNG\r\n\x1a\n')
                assert response.headers['Cache-Control']=='no-store'
        with urlopen(base+'/catalog?workspace=simulation&q=SAFE') as response:
            assert b'id="rows"' in response.read()
        with pytest.raises(HTTPError) as error:
            urlopen(base + '/../db/kicad-parts-manager.sqlite')
        assert error.value.code == 404
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def test_cached_http_catalog_refreshes_model_file_and_local_edits(session,tmp_path):
    from hashlib import sha256
    from kicad_parts_manager.catalog_transport import CatalogResponseCache
    from kicad_parts_manager.manual_data import ManualData
    model_file=tmp_path/'diode.lib';model_file.write_bytes(b'.model SAFE D')
    model=session.get(SimulationModel,'SIM-000004')
    model.model_file=str(model_file);model.sha256=sha256(model_file.read_bytes()).hexdigest();session.commit()
    manual=ManualData(tmp_path/'manual.sqlite')
    cache=CatalogResponseCache([session.bind.url.database,manual.path,Path(str(manual.path)+'-wal')])
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,database=session.bind,manual=manual,catalog_cache=cache))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    def read():
        with urlopen(f'http://127.0.0.1:{server.server_port}/api/catalog?compact=1') as response:return json.load(response)
    def part(data):return next(row for row in data['components'] if any(m['id']=='SIM-000004' for m in row['models']))
    try:
        first=read();read();assert read()==first
        assert part(first)['models'][0]['file_status']=='found'
        model_file.write_bytes(b'.model EDIT D')
        assert part(read())['models'][0]['file_status']=='changed'
        model_file.unlink();assert part(read())['models'][0]['file_status']=='missing'
        model_file.write_bytes(b'.model SAFE D');assert part(read())['models'][0]['file_status']=='found'
        row=part(read())
        manual.save(row,{'revision':0,'datasheet':'https://example.com/new.pdf'})
        assert part(read())['datasheet']=='https://example.com/new.pdf'
    finally:
        server.shutdown();server.server_close()


def test_index_cache_picks_up_atomic_rescan(tmp_path):
    path = tmp_path / 'inventory.json'
    cache = InventoryCache(path)
    assert cache() is None
    path.write_text('{"components":[]}', encoding='utf-8')
    first = cache()
    assert first == {'components':[]}
    assert cache() is first
    replacement = tmp_path / 'new.json'
    replacement.write_text('{"components":[1]}', encoding='utf-8')
    # Atomic replacements may preserve timestamps on Windows. File identity/size
    # must still invalidate the inventory cache.
    import os
    stamp=path.stat().st_mtime_ns
    os.utime(replacement,ns=(stamp,stamp))
    replacement.replace(path)
    assert cache() == {'components':[1]}


def test_preview_api_only_returns_geometry_for_catalog_ids(session):
    geometry={'shapes':[{'type':'line','a':[0,0],'b':[1,1]}]}
    inventory={'components':[{'id':'SYM-1','symbol_preview':geometry,'footprint_preview_key':'local'}], 'previews':{'footprints':{'local':geometry}}}
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,database=session.bind,inventory=inventory))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base=f'http://127.0.0.1:{server.server_port}'
    try:
        with urlopen(base+'/api/preview/SYM-1') as response:
            assert json.load(response)=={'symbol':geometry,'footprint':geometry}
        with pytest.raises(HTTPError) as error:urlopen(base+'/api/preview/missing')
        assert error.value.code==404
    finally:
        server.shutdown();server.server_close();thread.join()


def test_launcher_reuses_matching_server(session, tmp_path, monkeypatch, capsys):
    import kicad_parts_manager.browser as browser
    inventory = tmp_path / 'index.json'
    server = LocalServer(('127.0.0.1', 0), partial(Handler, database=session.bind, inventory=InventoryCache(inventory)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    monkeypatch.setattr(browser, 'create_engine', lambda url: session.bind)
    monkeypatch.setattr('sys.argv', ['kicad_parts_manager-browser','--db',session.bind.url.database,
                       '--inventory',str(inventory),'--port',str(server.server_port),'--no-open'])
    try:
        browser.main()
        assert 'läuft bereits' in capsys.readouterr().out
    finally:
        server.shutdown()
        server.server_close()
        thread.join()

def test_curated_component_preview_uses_its_native_symbol(session):
    geometry={'shapes':[{'type':'line','a':[0,0],'b':[1,1]}]}
    inventory={'components':[{'id':'SYM-R','symbol':'Device:R','symbol_preview':geometry}]}
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,database=session.bind,inventory=inventory))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        with urlopen(f'http://127.0.0.1:{server.server_port}/api/preview/CMP-00000001') as response:
            assert json.load(response)=={'symbol':geometry,'footprint':None}
    finally:
        server.shutdown();server.server_close();thread.join()


def test_reloading_catalog_does_not_duplicate_local_models(session,tmp_path):
    from kicad_parts_manager.model_library import ModelLibrary
    library=ModelLibrary(tmp_path/'models')
    library.upload('diode.lib','.model LOCALD D (IS=1e-9)')
    model=library.search('LOCALD')['candidates'][0]
    library.assign('Device:D',model['id'],['2','1'])
    row=dict(id='SYM-D',kind='library',symbol='Device:D',category='simulation/generic/diode',models=[])
    inventory={'components':[row]}
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,database=session.bind,inventory=inventory,models=library))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        for _ in range(2):
            with urlopen(f'http://127.0.0.1:{server.server_port}/api/catalog') as response:
                part=next(c for c in json.load(response)['components'] if c['id']=='SYM-D')
                assert len(part['models'])==1
        assert row['models']==[]
    finally:server.shutdown();server.server_close();thread.join()


def test_cached_filter_categories_are_refined(tmp_path):
    import json
    path=tmp_path/'inventory.json'
    path.write_text(json.dumps({'components':[{'library':'Filter','name':'EMI','description':'EMI filter','category':'passive/filter'}]}),encoding='utf-8')
    assert InventoryCache(path)()['components'][0]['category']=='passive/filter/emc_filter'

def test_cached_distributor_opamps_use_their_description_not_the_umbrella_heading(tmp_path):
    from kicad_parts_manager.browser import InventoryCache
    path=tmp_path/'inventory.json'
    path.write_text(json.dumps({'components':[
        {'name':'LM358P','library':'dk_Linear-Amplifiers-Instrumentation-OP-Amps-Buffer-Amps','description':'IC OPAMP GP 2 CIRCUIT 8DIP','category':'integrated/amplifier/instrumentation'},
        {'name':'INA128','library':'dk_Linear-Amplifiers-Instrumentation-OP-Amps-Buffer-Amps','description':'IC INSTRUMENTATION AMP','category':'integrated/amplifier/instrumentation'},
    ]}),encoding='utf-8')
    before=path.read_bytes()
    rows=InventoryCache(path)()['components']
    assert rows[0]['category']=='integrated/amplifier/opamp'
    assert rows[1]['category']=='integrated/amplifier/instrumentation'
    assert path.read_bytes()==before
