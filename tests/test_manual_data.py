import json
import threading
from functools import partial
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import pytest
from kicad_parts_manager.browser import Handler
from kicad_parts_manager.manual_data import ManualData, component_key, fields_for
from kicad_parts_manager.database.models import Base
from kicad_parts_manager.database.session import engine
from kicad_parts_manager.importers.seed import seed
from pathlib import Path


@pytest.fixture
def part():
    return dict(id='SYM-D',kind='library',symbol='Diode:1N914',footprint='DO-35',category='semiconductor/diode/switching',values={'voltage_description':100},datasheet='https://example.org/original.pdf',models=[])


def update(**kwargs):
    return dict(revision=0,values={'current_description':dict(value=.3,source='Manufacturer datasheet, page 2',conditions='25 °C, maximum')},**kwargs)


def test_local_data_survives_reopen_and_rescan_without_mutating_source(tmp_path,part):
    store=ManualData(tmp_path/'manual.sqlite');saved=store.save(part,update(datasheet='https://example.org/new.pdf'))
    assert saved['values']['current_description']['status']=='UNVERIFIED'
    assert saved['values']['current_description']['unit']=='A'
    reopened=ManualData(store.path)
    replacement=dict(part,id='SYM-NEW',values={'voltage_description':120})
    result=reopened.apply_catalog([replacement])[0]
    assert result['values']=={'voltage_description':120,'current_description':.3}
    assert result['datasheet']=='https://example.org/new.pdf'
    assert 'current_description' not in part['values']
    assert 'current_description' not in replacement['values']
    assert part['datasheet'].endswith('original.pdf')
    assert len(reopened.history(component_key(part)))==1


def test_restore_original_keeps_history_and_curated_isolation(tmp_path,part):
    store=ManualData(tmp_path/'manual.sqlite');store.save(part,update(datasheet=''))
    curated=dict(part,id='CMP-00000001')
    assert 'manual_data' not in store.apply_catalog([curated])[0]
    assert store.apply_catalog([part])[0]['datasheet']==''
    store.save(part,dict(revision=1,values={'current_description':None},datasheet=None))
    result=store.apply_catalog([part])[0]
    assert result['datasheet']==part['datasheet'] and result['values']==part['values']
    assert len(store.history(component_key(part)))==2
    assert store.history(component_key(part))[1]['data']['values']['current_description']['value']==.3


@pytest.mark.parametrize('value',[True,float('nan'),float('inf'),-.3,'0.3'])
def test_invalid_electrical_values_are_rejected(tmp_path,part,value):
    store=ManualData(tmp_path/'manual.sqlite');payload=update();payload['values']['current_description']['value']=value
    with pytest.raises(ValueError):store.save(part,payload)
    assert store.get(component_key(part))['revision']==0


@pytest.mark.parametrize('url',['javascript:alert(1)','file:///C:/test.pdf','https://user:secret@example.org/a','https://'])
def test_invalid_datasheet_links_are_rejected(tmp_path,part,url):
    with pytest.raises(ValueError):ManualData(tmp_path/'manual.sqlite').save(part,update(datasheet=url))


def test_conflicting_revision_unknown_parameters_and_missing_source(tmp_path,part):
    store=ManualData(tmp_path/'manual.sqlite');store.save(part,update())
    with pytest.raises(ValueError,match='zwischenzeitlich'):store.save(part,update())
    with pytest.raises(ValueError,match='Unbekannter'):store.save(part,dict(revision=1,values={'fake':{'value':2}}))
    with pytest.raises(ValueError,match='Quelle'):store.save(part,dict(revision=1,values={'current_description':dict(value=.4,source='',conditions='')}))
    assert store.get(component_key(part))['revision']==1
    assert store.save(part,dict(revision=1,values=update()['values']))['revision']==1


def test_family_units_and_supply_constraints(tmp_path):
    part=dict(id='SYM-M',kind='library',symbol='MOS:TEST',category='semiconductor/transistor/mosfet/n_channel',values={})
    store=ManualData(tmp_path/'manual.sqlite')
    store.save(part,dict(revision=0,values={'rds_on':dict(value=.005,source='page 3',conditions='VGS=10 V')}))
    assert store.get(component_key(part))['values']['rds_on']['unit']=='Ω'
    assert next(f for f in fields_for(part) if f['key']=='rds_on')['factor']==1000
    ic=dict(part,symbol='IC:TEST',category='integrated/analog/opamp')
    with pytest.raises(ValueError,match='Versorgung min'):
        store.save(ic,dict(revision=0,values={key:dict(value=v,source='page 1',conditions='') for key,v in [('supply_min_description',12),('supply_max_description',5)]}))
    assert store.get(component_key(ic))['revision']==0


def test_manual_api_roundtrip_catalog_overlay_and_origin(tmp_path,part):
    database=engine('sqlite:///'+str(tmp_path/'catalog.sqlite'));Base.metadata.create_all(database)
    from sqlalchemy.orm import Session
    with Session(database) as session:seed(session,Path(__file__).parents[1])
    store=ManualData(tmp_path/'manual.sqlite')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,database=database,inventory={'components':[part]},manual=store))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();base=f'http://127.0.0.1:{server.server_port}'
    def post(payload,origin=base):
        return urlopen(Request(base+'/api/manual-data',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','Origin':origin}))
    try:
        with urlopen(base+'/api/manual-data?component=SYM-D') as response:assert json.load(response)['override']['revision']==0
        with post(dict(component_id='SYM-D',**update())) as response:assert json.load(response)['revision']==1
        for _ in range(2):
            with urlopen(base+'/api/catalog') as response:
                row=next(r for r in json.load(response)['components'] if r['id']=='SYM-D')
                assert row['values']['current_description']==.3 and row['manual_data']['revision']==1
        assert 'current_description' not in part['values']
        with pytest.raises(HTTPError) as error:post(dict(component_id='SYM-D',revision=1,values={}),origin='https://example.org')
        assert error.value.code==403
        with pytest.raises(HTTPError) as error:post(dict(component_id='missing',revision=0,values={}))
        assert error.value.code==400
        with urlopen(base+'/manual-editor.js') as response:assert response.status==200
    finally:server.shutdown();server.server_close();thread.join();database.dispose()


def test_ferrite_frequency_pair(tmp_path):
    part=dict(id='SYM-F',symbol='Device:Ferrite_Bead',category='passive/ferrite',values={})
    store=ManualData(tmp_path/'manual.sqlite')
    entry=lambda value: dict(value=value,source='Datasheet',conditions='25 C')
    with pytest.raises(ValueError,match='Bezugsfrequenz'):
        store.save(part,dict(revision=0,values={'impedance':entry(600)}))
    result=store.save(part,dict(revision=0,values={'impedance':entry(600),'impedance_frequency':entry(100e6)}))
    assert result['values']['impedance_frequency']['unit']=='Hz'
    with pytest.raises(ValueError,match='Bezugsfrequenz'):
        store.save(part,dict(revision=1,values={'impedance_frequency':None}))


def test_filter_requires_measurement_conditions(tmp_path):
    part=dict(id='SYM-E',symbol='Filter:EMI',category='passive/filter/emc_filter',values={})
    store=ManualData(tmp_path/'manual.sqlite')
    values={'insertion_loss':dict(value=20,source='Datasheet'),'loss_frequency':dict(value=100e6,source='Datasheet')}
    with pytest.raises(ValueError,match='Messbedingungen'):
        store.save(part,dict(revision=0,values=values))
    values['insertion_loss']['conditions']='50 ohm source/load, differential mode'
    assert store.save(part,dict(revision=0,values=values))['revision']==1


def test_specialized_category_profiles():
    def fields(category):return {f['key']:f for f in fields_for({'category':category})}
    assert 'dropout_voltage' in fields('integrated/power_ic/linear_regulator')
    assert 'source_peak_current' in fields('integrated/drivers/gate_driver')
    assert 'resolution_bits' in fields('integrated/converters/adc')
    assert 'memory_bits' in fields('integrated/memory/flash')
    assert fields('sensors/temperature')['measurement_min']['unit']=='°C'
    assert fields('sensors/pressure')['measurement_min']['unit']=='Pa'
    assert fields('connectors/rf_coax')['frequency_max']['factor']==1e-9
    assert all(f.get('optional') for f in fields('schematic/power_ports').values())
    assert all(f.get('optional') for f in fields('unassigned/Mystery').values())
    assert 'collector_current' in fields('semiconductor/transistor/igbt')
    assert 'bridge_forward_voltage' in fields('semiconductor/diode/bridge')


def test_category_specific_units_and_negative_values(tmp_path):
    store=ManualData(tmp_path/'manual.sqlite')
    part=dict(id='SYM-T',symbol='Sensor:T',category='sensors/temperature',values={})
    result=store.save(part,dict(revision=0,values={'measurement_min':dict(value=-40,source='Datasheet')}))
    assert result['values']['measurement_min']['unit']=='°C'
    part=dict(id='SYM-A',symbol='Amplifier:Op',category='integrated/amplifier/opamp',values={})
    result=store.save(part,dict(revision=0,values={'output_current':dict(value=.02,source='Datasheet')}))
    assert result['values']['output_current']['unit']=='A'


def test_revision_two_text_temperature_and_range_validation(tmp_path):
    store=ManualData(tmp_path/'data.sqlite')
    part=dict(id='SYM-LED',symbol='Device:LED',category='opto/led',values={})
    entry=lambda value:dict(value=value,source='Manufacturer datasheet for exact variant')
    saved=store.save(part,dict(revision=0,values={'led_color':entry('Rot'),'qualifications':entry('AEC-Q101; Other qualification'),'operating_temp_min':entry(-40),'operating_temp_max':entry(125),'temperature_reference':entry('TA – Umgebung')}))
    assert saved['values']['led_color']['value']=='Rot'
    assert saved['values']['operating_temp_min']['unit']=='°C'
    assert store.apply(part,saved)['values']['qualifications']=='AEC-Q101; Other qualification'
    with pytest.raises(ValueError,match='untere Bereichswert'):
        store.save(part,dict(revision=1,values={'operating_temp_min':entry(150)}))
    with pytest.raises(ValueError):store.save(part,dict(revision=1,values={'led_color':entry(12)}))


def test_structured_conditions_and_quantity_kind(tmp_path):
    store=ManualData(tmp_path/'data.sqlite')
    part=dict(id='SYM-M',symbol='FET:Test',category='semiconductor/transistor/fet/mosfet/n_channel',values={})
    value=dict(value=.04,source='Datasheet',kind='maximum',conditions_data={'gate_voltage':10,'test_current':2,'test_temperature':25})
    saved=store.save(part,dict(revision=0,values={'rds_on':value}))
    assert saved['values']['rds_on']['conditions_data']['gate_voltage']==10
    assert saved['values']['rds_on']['kind']=='maximum'
    with pytest.raises(ValueError,match='Messbedingung'):
        store.save(part,dict(revision=1,values={'rds_on':dict(value,conditions_data={'unknown':1})}))
    with pytest.raises(ValueError,match='Kennwertart'):
        store.save(part,dict(revision=1,values={'rds_on':dict(value,kind='verified')}))


def test_converter_ranges_and_reference_units():
    def fields(category):return {f['key']:f for f in fields_for({'category':category})}
    assert 'ac_input_voltage_min' in fields('modules/acdc')
    assert 'dc_input_voltage_max' in fields('modules/dcdc')
    assert 'output_voltage_max' in fields('integrated/power_ic/switch_regulator')
    assert fields('integrated/analog/voltage_reference')['reference_voltage']['unit']=='V'
    assert fields('integrated/analog/current_reference')['reference_current']['factor']==1000
    assert 'vce_max' in fields('opto/optocoupler/transistor')
    assert 'ctr_min' not in fields('opto/optocoupler/logic')
    assert 'zero_cross' in fields('opto/optocoupler/triac')


def test_all_profile_definitions_are_well_formed():
    from kicad_parts_manager.manual_data import FIELDS
    import math
    for category,definitions in FIELDS.items():
        assert len({f[0] for f in definitions})==len(definitions),category
        for f in definitions:
            assert len(f)>=4 and math.isfinite(f[3]) and f[3]>0
            conditions=f[4].get('conditions',[]) if len(f)>4 else []
            assert len({c['key'] for c in conditions})==len(conditions)
