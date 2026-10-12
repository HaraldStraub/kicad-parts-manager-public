import sys
from pathlib import Path
import pytest
from kicad_parts_manager.manual_data import ManualData
from kicad_parts_manager.transistor_opto_description import extract_description,PREFIXES
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from enrich_diode_descriptions import enrich

def part(text,category='semiconductor/transistor/bjt/pnp'):
    return dict(id='SYM-T',name='Test',symbol='Test:Part',category=category,description=text,values={})

def test_signed_pnp_ratings_are_magnitudes_with_polarity():
    assert extract_description(part('-0.2A Ic, -40V Vce, Small Signal PNP Transistor, TO-92'))[0]==dict(polarity='PNP',vce_description=40,ic_description=.2)

def test_bjt_cases_do_not_invent_ft_or_guaranteed_gain():
    values,_=extract_description(part('RF TRANS NPN 30V 500MHZ TO39'))
    assert values==dict(polarity='NPN',vce_description=30)
    values,_=extract_description(part('NPN Darlington transistor, 30Vce, 500mA, SOT-89'))
    assert values==dict(polarity='NPN',vce_description=30,ic_description=.5)
    values,_=extract_description(part('4 Matched PNP Transistors, hfe=75, SOIC-14'))
    assert values==dict(polarity='PNP',gain_description=75)
    assert 'hfe_min' not in values

def test_mixed_polarity_and_conflicts_are_not_guessed():
    values,_=extract_description(part('100mA IC, 65V Vce, Dual NPN/PNP Transistors, SOT-363'))
    assert values==dict(vce_description=65,ic_description=.1)
    values,reasons=extract_description(part('Ic=100mA, Ic=200mA, Vce=65V'))
    assert values==dict(vce_description=65)
    assert reasons
    assert extract_description(part('Unijunction Transistor, TO-18'))[0]=={}
    assert extract_description(part('NPN, Ic=1A at Vce=5V'))[0]==dict(polarity='NPN')

def test_igbt_simple_ratings_and_peak_exclusion():
    cat='semiconductor/transistor/igbt'
    assert extract_description(part('28A, 900V, N-Channel IGBT',cat))[0]==dict(vces_max=900,collector_current=28)
    assert extract_description(part('100A peak, 600V IGBT',cat))[0]=={}

def test_led_package_and_multi_color_are_not_electrical_ratings():
    cat='opto/led'
    values,_=extract_description(part('940nm, 20 deg, Infrared LED, 1206',cat))
    assert values==pytest.approx(dict(led_color='IR',wavelength=940e-9))
    assert extract_description(part('LED RGB with integrated controller, 12 mA, 5mm',cat))[0]==dict(led_color='RGB')
    assert extract_description(part('LED RED CLEAR 1206 SMD',cat))[0]==dict(led_color='Rot')
    assert extract_description(part('LED dual red/green, 4-pin',cat))[0]=={}

def test_opto_input_output_and_rms_isolation_not_conflated():
    cat='opto/optocoupler'
    assert extract_description(part('Gate Drive Optocoupler, Output Current 4.0/4.0A, Propagation Delay 200ns',cat))[0]=={}
    assert extract_description(part('OPTOISO 3.75KV TRANS 4-SOP',cat+'/transistor'))[0]==dict(isolation_voltage=3750)
    assert extract_description(part('DC Optocoupler Thyristor Based, Vdrm 400V, It 150mA, Viso 2500V',cat))[0]==dict(isolation_voltage=2500)
    assert extract_description(part('4.5-60Vin no-optoisolator, 8V NMOS gate drive',cat))[0]=={}
    values,_=extract_description(part('CTR 50-600%, IF=5mA',cat+'/transistor'))
    assert values==dict(ctr_min=50,ctr_max=600)
    assert 'forward_current' not in values  # IF is the CTR measurement current.

def test_import_preserves_curated_fields_and_is_repeatable(tmp_path):
    row=part('28A, 900V, N-Channel IGBT','semiconductor/transistor/igbt')
    store=ManualData(tmp_path/'manual.sqlite')
    store.save(row,dict(revision=0,values=dict(vces_max=dict(value=850,source='Datasheet',kind='maximum'))))
    old=store.get('symbol:Test:Part')['values']['vces_max']
    report=enrich([row],store,True,extract_description,PREFIXES)
    assert report['imported_parameters']==1
    saved=store.get('symbol:Test:Part')['values']
    assert saved['vces_max']==old
    assert saved['collector_current']['status']=='UNVERIFIED'
    assert saved['collector_current']['conditions']==row['description']
    assert enrich([row],store,True,extract_description,PREFIXES)['imported_parameters']==0
