import pytest
from kicad_parts_manager.kicad.taxonomy import passive_category
from kicad_parts_manager.kicad.inventory import category

@pytest.mark.parametrize('library,description,path',[
    ('Capacitor_Wurth_WCAP-AI3H','','capacitor/aluminium_electrolytic'),
    ('Capacitor_Wurth_WCAP-CSGP','','capacitor/ceramic'),
    ('Capacitor_Wurth_WCAP-HSAH','','capacitor/aluminium_polymer/hybrid'),
    ('Capacitor_Wurth_WCAP-PHGP','','capacitor/aluminium_polymer'),
    ('Capacitor_Wurth_WCAP-FTX2','','capacitor/film'),
    ('Capacitor_Wurth_WCAP-SISC','','capacitor/supercapacitor'),
    ('Capacitor_Wurth_WCAP-UNKNOWN','','capacitor/other'),
    ('Resistor_Wurth_WRIS-KSKE','','resistor/shunt'),
    ('Resistor_Wurth_WRIS-RSKS','','resistor/standard_resistor'),
    ('Resistors SMD','Thick Film Chip Resistor','resistor/standard_resistor'),
    ('Resistor','Precision current sensing resistor','resistor/shunt'),
    ('Device','Resistor network','resistor/resistor_network'),
    ('Device','Potentiometer, trimmer','resistor/adjustable/trimmer'),
    ('Device','Capacitor, variable','capacitor/adjustable_capacitor'),
    ('Capacitors','Tantalum polymer capacitor','capacitor/tantalum'),
    ('Capacitors','Polarized capacitor','capacitor/other'),
])
def test_explicit_passive_categories(library,description,path):
    assert category(library,'Part',description)=='passive/'+path

def test_existing_categories_migrate_without_guessing_from_package_or_tolerance():
    assert passive_category('CERN/Capacitors SMD','Part','', 'passive/capacitor/Capacitors SMD')=='passive/capacitor/other'
    assert passive_category('Resistors','Part','1% 2W chip resistor')=='passive/resistor/standard_resistor'
    assert passive_category('Device','R','Resistor','simulation/generic/resistor') is None
    assert category('Device','R','Resistor')=='simulation/generic/resistor'
    assert passive_category('Amplifier','Part','Amplifier with resistor feedback and capacitor load') is None
