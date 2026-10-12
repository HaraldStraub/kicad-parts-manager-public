import sys
from pathlib import Path
import pytest
from kicad_parts_manager.regulator_description import extract_description,PREFIXES
from kicad_parts_manager.manual_data import ManualData
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from enrich_diode_descriptions import enrich

def part(text,category='integrated/power_ic/switch_regulator'):
    return dict(id='SYM-R',name='Test',symbol='Test:R',category=category,description=text,values={})

def test_input_output_ranges_and_switch_current_separate():
    values,_=extract_description(part('Boost Converter, 2.5A switch current limit, 2.2-5.5V Output Voltage, 0.5-5.5V Input Voltage'))
    assert values==dict(input_voltage_min=.5,input_voltage_max=5.5,output_voltage_min=2.2,output_voltage_max=5.5,switch_current_limit=2.5)
    values,_=extract_description(part('Vin=4.5..18V, Vout=0.81..15V, Adjustable Regulator, 1.5A'))
    assert values==dict(input_voltage_min=4.5,input_voltage_max=18,output_voltage_min=.81,output_voltage_max=15,output_mode='Einstellbar')
    assert 'output_current' not in values

def test_negative_output_and_input_single_not_guessed_as_maximum():
    values,_=extract_description(part('Negative 100mA -30V Linear Regulator, Fixed Output -5V','integrated/power_ic/linear_regulator'))
    assert values==dict(output_voltage=-5,output_current=.1,output_mode='Fest')
    assert extract_description(part('Vin 60V, Vout Adjustable'))[0]==dict(output_mode='Einstellbar')

def test_reference_tolerance_not_worst_case_of_variant_range():
    cat='integrated/analog/voltage_reference'
    assert extract_description(part('2.5V ±0.2% Precision Micropower Voltage Reference',cat))[0]==dict(reference_voltage=2.5,initial_tolerance=.2)
    values,_=extract_description(part('Precision Voltage Reference, 2.5V, ±0.05% to ±0.5%',cat))
    assert values==dict(reference_voltage=2.5)
    values,_=extract_description(part('Voltage Reference, 2.5V, 3V-20V Vin',cat))
    assert values==dict(supply_min_description=3,supply_max_description=20,reference_voltage=2.5)

def test_modules_power_and_multiple_outputs_do_not_collapse_channels():
    cat='modules/dcdc'
    values,_=extract_description(part('2W DC/DC converter, 4.5-18V input, 3.3V fixed output voltage, 500mA output',cat))
    assert values==dict(dc_input_voltage_min=4.5,dc_input_voltage_max=18,output_voltage=3.3,output_mode='Fest',output_current=.5,output_power=2)
    values,reasons=extract_description(part('Dual SEPIC DC/DC Converter, 2.6 to 20V input, 2.5V to 24V or -2.5V to -24V output, 1A @ 5V output current',cat))
    assert values==dict(dc_input_voltage_min=2.6,dc_input_voltage_max=20)
    assert reasons

def test_voltage_drop_is_not_output_and_multifunction_ic_excluded():
    values,_=extract_description(part('Voltage Converter, 1.5V to 10.0V operating supply voltage, 10mA with a 0.5V output drop'))
    assert values==dict(input_voltage_min=1.5,input_voltage_max=10)
    assert extract_description(part('Quad 8bit DAC, Separate Reference Voltage','integrated/analog/voltage_reference'))[0]=={}
    values,_=extract_description(part('Fixed output voltage 0.8V to 4V DC/DC converter','modules/dcdc'))
    assert values==dict(output_mode='Fest')
    assert extract_description(part('Boost regulator, up to 30V output'))[0]==dict(output_voltage_max=30)
    assert extract_description(part('DC/DC converter, ±12V output','modules/dcdc'))[0]=={}

def test_persistence_and_repeat_protect_existing_metadata(tmp_path):
    row=part('Vin=4.5..18V, Vout=0.81..15V, Adjustable Regulator')
    store=ManualData(tmp_path/'manual.sqlite')
    store.save(row,dict(revision=0,values=dict(input_voltage_max=dict(value=17,source='Manufacturer',kind='maximum'))))
    old=store.get('symbol:Test:R')['values']['input_voltage_max']
    out=enrich([row],store,True,extract_description,PREFIXES)
    assert out['imported_parameters']==4
    saved=store.get('symbol:Test:R')['values']
    assert saved['input_voltage_max']==old
    assert saved['output_voltage_min']['status']=='UNVERIFIED'
    assert saved['output_voltage_min']['source_details']['document']=='KiCad symbol description'
    assert enrich([row],store,True,extract_description,PREFIXES)['imported_parameters']==0
