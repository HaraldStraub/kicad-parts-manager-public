import sys
from pathlib import Path
import pytest
from kicad_parts_manager.diode_description import extract_diode_description
from kicad_parts_manager.manual_data import ManualData
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from enrich_diode_descriptions import enrich


def part(description, category='switching', name='1N914'):
    return dict(id='SYM-D', kind='library', name=name, symbol='Diode:'+name,
                category='semiconductor/diode/'+category, description=description, values={})


def test_bare_ratings_and_explicit_units():
    assert extract_diode_description(part('100V 0.3A Small Signal Fast Switching Diode, DO-35'))[0] == dict(vr_max=100, if_cont=.3)
    values, _ = extract_diode_description(part('Fast Rectifier, VRRM 50V, IF(AV) 1.0A, trr 200ns', 'rectifier'))
    assert values == pytest.approx(dict(vrrm=50, if_avg=1, trr=200e-9))


def test_rms_and_surge_are_separate():
    values, _ = extract_diode_description(part('Bridge Rectifiers, 700V Vrms, 0.8A If', 'bridge'))
    assert values == dict(vr_rms=700, if_avg=.8)
    values, _ = extract_diode_description(part('75V Vrm 0.5A Ifsm standard switching diode'))
    assert values == dict(surge_current=.5)
    assert not extract_diode_description(part('600V, 2x 30A, Dual Fast Recovery Diode', 'other'))[0]


def test_ambiguous_and_conflicting_values_remain_open():
    assert 'stand_off_description' not in extract_diode_description(part('10V, 2000W TVS unidirectional diode', 'tvs'))[0]
    assert 'vr_max' not in extract_diode_description(part('32V 2A Bidirectional trigger diode (DIAC)', 'other'))[0]
    assert 'vrrm' not in extract_diode_description(part('VRRM=50V, VRRM=100V', 'rectifier'))[0]
    values, reasons = extract_diode_description(part('2.4V, 500mW, 2%, Zener diode', 'zener', 'BZV55B27'))
    assert values == dict(power_dissipation=.5, initial_tolerance=2)
    assert reasons
    assert extract_diode_description(part('2.4V, 500mW, 2%, Zener diode', 'zener', 'BZV55B2V4'))[0]['zener_voltage'] == 2.4


def test_laser_peak_is_not_continuous_power():
    values, _ = extract_diode_description(part('Pulsed Laser Diode, 905nm, 25W Peak Power', 'laser'))
    assert values == pytest.approx(dict(wavelength=905e-9))
    assert extract_diode_description(part('Schottky diode, pin 1 A, pin 2 K, SOT-23', 'schottky'))[0] == {}
    assert 'power_dissipation' not in extract_diode_description(part('100V, 1A Schottky diode, SOD-123W', 'schottky'))[0]
    assert extract_diode_description(part('IFAV = 2A, IFSM = 50/55A, VRRM = 200V', 'rectifier'))[0] == dict(if_avg=2, vrrm=200)


def test_persistence_protects_curated_values_and_repeat_is_empty(tmp_path):
    row = part('100V 0.3A Small Signal Fast Switching Diode, DO-35')
    store = ManualData(tmp_path/'manual.sqlite')
    store.save(row, dict(revision=0, values=dict(vr_max=dict(value=75, source='Datasheet'))))
    before = store.get('symbol:Diode:1N914')['values']['vr_max']
    result = enrich([row], store, True)
    assert result['imported_parameters'] == 1
    saved = store.get('symbol:Diode:1N914')
    assert saved['values']['vr_max'] == before
    assert saved['values']['if_cont']['status'] == 'UNVERIFIED'
    assert saved['values']['if_cont']['source_details']['document'] == 'KiCad symbol description'
    assert saved['values']['if_cont']['conditions'] == row['description']
    assert enrich([row], store, True)['imported_parameters'] == 0
