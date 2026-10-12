import pytest
from kicad_parts_manager.passive_description import extract_description

@pytest.mark.parametrize('category,text,expected',[
    ('passive/capacitor','100nF 50V 10%',{'capacitance':1e-7,'voltage_description':50,'tolerance_description':10}),
    ('passive/resistor','Resistor 10mOhm 2W 1%',{'resistance':.01,'power_description':2,'tolerance_description':1}),
    ('passive/resistor/adjustable/trimmer','TRIMMER 10K OHM 0.1W J LEAD TOP',{'resistance':10000,'power_description':.1}),
    ('passive/inductor/common_mode_choke','Common mode choke, 22A, 380VAC, 1mH, 2.1 mOhm',{'inductance':.001}),
    ('passive/inductor/power_inductor','10uH Isat 2A Irms 1A DCR 30mOhm',{'inductance':1e-5,'saturation_current':2,'current_description':1,'dcr_description':.03}),
    ('passive/capacitor','Cx 0.10uF Cy 2.2nF',{}),
    ('passive/inductor/transformer','Transformer 10uH',{}),
    ('passive/inductor','Ferrite impedance 100Ohm at 100MHz',{}),
    ('passive/inductor','FIXED IND 10MH 85MA 23.8 OHM TH',{}),
    ('sensors','100nF 50V',{}),
])
def test_safe_passive_facts(category,text,expected):
    values,_=extract_description(dict(category=category,description=text))
    assert values==pytest.approx(expected)
