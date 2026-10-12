import pytest
from kicad_parts_manager.connector_description import extract_description

@pytest.mark.parametrize('text,expected',[
 ('Connector, 20 pins, 1.27mm pitch',{'pins_description':20,'pitch_description':1.27}),
 ('Generic connector, double row, 02x10',{'pins_description':20}),
 ('12-pin connector, pitch: 2.54 mm, housing 5mm',{'pins_description':12,'pitch_description':2.54}),
 ('2.00 mm SMT Dual Pin Header, H=3.80 mm',{}),
 ('Connector 2.54mm pitch; mounting pitch: 5.0mm',{}),
 ('RJ connector, 4P2C (4 positions 2 connected)',{}),
 ('8 pins + shield',{}),
 ('Connector, 6 pins, two ports',{}),
 ('Connector array, 10x40, 1.27mm pitch',{'pitch_description':1.27}),
 ('8 pins or 10 contacts',{}),
])
def test_explicit_connector_quantities(text,expected):
 assert extract_description(dict(category='connectors/headers',description=text))[0]==expected

def test_unrelated_category():
 assert extract_description(dict(category='integrated/processors/mcu',description='20 pins 1.27mm pitch'))[0]=={}
