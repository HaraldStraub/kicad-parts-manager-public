import json
from pathlib import Path
import pytest
from kicad_parts_manager.kicad.inventory import parse, properties, scan, resolve, tables, category


@pytest.mark.parametrize('library,description,expected',[
    ('dk_Oscillators','Oscillator','timing_parts/oscillators'),
    ('dk_Memory','Mixed memory types','integrated/memory'),
    ('dk_PMIC-Full-Half-Bridge-Drivers','Bridge driver','integrated/drivers'),
    ('dk_Transistors-JFETs','JFET','semiconductor/transistor/fet/jfet'),
    ('Device','Capacitor, variable','passive/capacitor/adjustable_capacitor'),
    ('Device','Resistor network','passive/resistor/resistor_network'),
    ('GPU','Graphics processor','integrated/processors'),
    ('PCM_Generic','Unknown mixed symbol','unassigned/PCM_Generic'),
])
def test_remaining_category_headings_use_specific_or_conservative_profiles(library,description,expected):
    assert category(library,'Part',description)==expected


@pytest.mark.parametrize('library,description,expected', [
    ('Diode_Bridge','Schottky rectifier bridge','bridge'),
    ('Diode','TVS transient voltage suppressor','tvs'),
    ('Diode','Zener diode','zener'),
    ('Diode','Schottky rectifier','schottky'),
    ('Diode','Rectifier diode','rectifier'),
    ('Diode','100V 0.3A Small Signal Fast Switching Diode, DO-35','switching'),
    ('Diode','Unknown diode','other'),
])
def test_diode_subcategories(library, description, expected):
    assert category(library, 'Part', description) == 'semiconductor/diode/' + expected


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def test_source_only_scan_ignores_personal_environment_libraries(tmp_path,monkeypatch):
    source=tmp_path/'source';private=tmp_path/'private'
    write(source/'Own.kicad_sym','(kicad_symbol_lib (symbol "Own" (property "Reference" "U")))')
    write(private/'Secret.kicad_sym','(kicad_symbol_lib (symbol "Secret" (property "Reference" "U")))')
    monkeypatch.setenv('KICAD_PERSONAL_LIB',str(private))
    result=scan(source,source,extra_roots=[source],source_only=True)
    assert [r['name'] for r in result['components']]==['Own']


def test_parser_escaping_and_bad_input():
    assert parse(r'(root (property "Name" "a\"b\\c"))')[1][2] == 'a"b\\c'
    for value in ('(root', '(root))', 'hello', '(a)(b)'):
        with pytest.raises(ValueError):
            parse(value)


def test_taxonomy_uses_explicit_device_type_without_parsing_ratings():
    assert category('Transistor_FET','2N7002','0.115A, 60V, N-Channel MOSFET') == 'semiconductor/transistor/fet/mosfet/n_channel'
    assert category('Transistor_FET','Test','P-channel JFET') == 'semiconductor/transistor/fet/jfet/p_channel'
    assert category('Transistor_BJT','Test','NPN PNP array') == 'semiconductor/transistor/bjt/arrays/complementary'
    assert category('Transistor_FET','Unknown','Transistor') == 'semiconductor/transistor/fet/other'


def test_inheritance_empty_override_and_cycle():
    symbols = {'base':parse('(symbol "base" (property "Footprint" "Package:X"))'),
               'child':parse('(symbol "child" (extends "base") (property "Footprint" ""))'),
               'cycle':parse('(symbol "cycle" (extends "cycle"))')}
    get = properties(symbols)
    assert get('base')['Footprint'] == 'Package:X'
    assert get('child')['Footprint'] == ''
    with pytest.raises(ValueError):
        get('cycle')


def test_inventory_nested_tables_inheritance_models_and_unregistered(tmp_path):
    config, share, home = tmp_path/'config/10.0', tmp_path/'share', tmp_path/'home'
    write(config/'sym-lib-table', f'(sym_lib_table (lib (name "Standard") (type "Table") (uri "{(share/"table").as_posix()}")))')
    write(share/'table', '(sym_lib_table (lib (name "Transistor_FET") (type "KiCad") (uri "${KICAD10_SYMBOL_DIR}/FET.kicad_sym")))')
    write(config/'fp-lib-table', '(fp_lib_table (lib (name "Package") (type "KiCad") (uri "${KICAD10_FOOTPRINT_DIR}/Package.pretty")))')
    write(share/'symbols/FET.kicad_sym', '(kicad_symbol_lib (symbol "Base" (property "Footprint" "Package:SOT") (property "Datasheet" "https://example.org/data")) (symbol "Derived" (extends "Base") (property "Description" "N-channel test")))')
    write(share/'symbols/Unregistered.kicad_sym', '(kicad_symbol_lib (symbol "Extra" (property "Footprint" "Package:Missing")))')
    write(share/'footprints/Package.pretty/SOT.kicad_mod', '(footprint "SOT" (model "${KICAD10_3DMODEL_DIR}/SOT.step") (model "${KICAD10_3DMODEL_DIR}/Missing.wrl"))')
    write(share/'3dmodels/SOT.step', 'fixture')
    result = scan(config, share, user_home=home)
    assert result['counts']['symbols'] == 3
    assert result['counts']['footprints'] == 1
    derived = next(r for r in result['components'] if r['name'] == 'Derived')
    assert derived['symbol'] == 'Transistor_FET:Derived'
    assert derived['footprint'] == 'Package:SOT'
    assert derived['footprint_info']['found']
    assert [m['found'] for m in derived['footprint_info']['models']] == [True, False]
    assert derived['registered']
    extra = next(r for r in result['components'] if r['name'] == 'Extra')
    assert not extra['registered']
    assert not extra['footprint_info']['found']
    again = scan(config, share, user_home=home)
    assert [r['id'] for r in result['components']] == [r['id'] for r in again['components']]


def test_project_overrides_and_table_cycle(tmp_path):
    global_table, nested = tmp_path/'global', tmp_path/'nested'
    write(global_table, f'(sym_lib_table (lib (name "Loop") (type "Table") (uri "{nested.as_posix()}")) (lib (name "X") (type "KiCad") (uri "${{ROOT}}/one.kicad_sym")))')
    write(nested, f'(sym_lib_table (lib (name "Loop") (type "Table") (uri "{global_table.as_posix()}")))')
    warnings = []
    assert tables(global_table, {'ROOT':str(tmp_path)}, warnings) == {'X':tmp_path/'one.kicad_sym'}
    config, share, home, project = tmp_path/'config/10.0', tmp_path/'share', tmp_path/'home', tmp_path/'project'
    write(config/'sym-lib-table', '(sym_lib_table (lib (name "X") (type "KiCad") (uri "missing")))')
    write(config/'fp-lib-table', '(fp_lib_table)')
    write(project/'sym-lib-table', '(sym_lib_table (lib (name "X") (type "KiCad") (uri "${KIPRJMOD}/X.kicad_sym")))')
    write(project/'X.kicad_sym', '(kicad_symbol_lib (symbol "Local"))')
    result = scan(config, share, project=project, user_home=home)
    assert result['counts']['symbols'] == 1
    assert result['components'][0]['symbol'] == 'X:Local'
    assert result['components'][0]['registered']

@pytest.mark.parametrize('library,name,description,expected', [
 ('Amplifier_Buffer','LH0002H','Wide-Band, High Current, Unity Gain Buffer Amplifier','integrated/amplifier/buffer'),
 ('dk_PMIC-Voltage-Regulators-Linear','X','Linear regulator','integrated/power_ic/linear_regulator'),
 ('Reference_Voltage','X','Voltage reference','integrated/analog/voltage_reference'),
 ('Converter_DCDC_Isolated','X','DC/DC regulator module','modules/dcdc'),
 ('dk_USB-DVI-HDMI-Connectors','X','USB connector','connectors/usb'),
 ('Connector','X','HDMI connector','connectors/audio_video'),
 ('Connector','X','Unknown connector','connectors/unassigned'),
 ('MCU_ST','X','Microcontroller','integrated/processors/mcu'),
 ('Sensor_Temperature','X','Temperature sensor','sensors/temperature'),
 ('Mystery','X','Unknown','unassigned/Mystery'),
])
def test_functional_taxonomy(library,name,description,expected):
    assert category(library,name,description)==expected


@pytest.mark.parametrize('library,name,expected', [
    ('Simulation_SPICE','ESOURCE','simulation/sources'),
    ('Simulation_SPICE','IBIS_DRIVER','simulation/generic/function_blocks'),
    ('Simulation_SPICE','VOLTMETER_DIFF','simulation/measurement'),
    ('Device','R','simulation/generic/resistor'),
    ('Transistor_FET','Q_NMOS_GSD','simulation/generic/fet'),
    ('Transistor_FET','2N7002','semiconductor/transistor/fet/mosfet/n_channel'),
    ('power','GND','schematic/power_ports'),
])
def test_workspace_categories(library,name,expected):
    assert category(library,name,'N-channel MOSFET' if name == '2N7002' else '') == expected


def test_optocoupler_output_profiles_and_digital_isolator_boundary():
    from kicad_parts_manager.kicad.taxonomy import functional_category
    assert functional_category('Optocoupler','X','Phototransistor output optocoupler')=='opto/optocoupler/transistor'
    assert functional_category('Optocoupler','X','Triac output optocoupler')=='opto/optocoupler/triac'
    assert functional_category('Isolator','X','Digital isolator, optocoupler replacement')=='integrated/interfaces/isolation'

@pytest.mark.parametrize('description,expected',[
 ('IC OPAMP GP 2 CIRCUIT 8DIP','integrated/amplifier/opamp'),
 ('IC OPAMP JFET 4 CIRCUIT 14DIP','integrated/amplifier/opamp'),
 ('IC INSTRUMENTATION AMP','integrated/amplifier/instrumentation'),
 ('IC BUFFER AMP','integrated/amplifier/buffer'),
 ('Unknown','integrated/amplifier'),
])
def test_distributor_amplifier_heading_does_not_override_component_function(description,expected):
    from kicad_parts_manager.kicad.taxonomy import functional_category
    assert functional_category('dk_Linear-Amplifiers-Instrumentation-OP-Amps-Buffer-Amps','X',description)==expected
