import pytest
from kicad_parts_manager.common_description import extract_description

@pytest.mark.parametrize('category,text,expected',[
    ('timing_parts/crystals','Crystal 25MHz',{'frequency':25e6}),
    ('timing_parts/oscillators','2.7-5.5V 100MHz fixed oscillator',{'frequency':100e6}),
    ('timing_parts/oscillators','1.8432MHz ~ 125MHz oscillator',{}),
    ('timing_parts/oscillators','Clock 500kHz-100MHz',{}),
    ('timing_parts/oscillators','Clock 1-350MHz',{}),
    ('timing_parts/oscillators','Clock 20MHz / 40MHz',{}),
    ('timing_parts/oscillators','60, 80, 100, 120 & 122.76 MHz OCXO',{}),
    ('timing_parts/oscillators','25MHz operating temperature: -40 to +85°C',{'frequency':25e6,'operating_temp_min':-40,'operating_temp_max':85}),
    ('protection/fuse/thermal_fuse','Trip temperature 139°C; Storage -40 to 85°C',{}),
    ('sensors','Operating temperature: -40 to 125°C',{'operating_temp_min':-40,'operating_temp_max':125}),
    ('sensors','Operating temperature: 125 to -40°C',{}),
])
def test_labelled_limits(category,text,expected):
    assert extract_description(dict(category=category,description=text))[0]==expected
