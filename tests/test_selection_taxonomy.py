import pytest
from kicad_parts_manager.kicad.selection_taxonomy import selection_category
from kicad_parts_manager.kicad.inventory import category


@pytest.mark.parametrize('library,name,description,path',[
    ('Device','Polyfuse','Resettable fuse','protection/fuse/resettable_fuse'),
    ('Device','Fuse','Fuse','protection/fuse/other'),
    ('dk_Thermal-Cutoffs','Part','Thermal cutoff','protection/fuse/thermal_fuse'),
    ('Fuse','F','Fast acting cartridge fuse','protection/fuse/melting_fuse'),
    ('Switch','SW_Push','Push button','switches/pushbutton'),
    ('Switch_Wurth_WS-TASV','Part','Tact Switch 6x6 mm','switches/pushbutton'),
    ('Switch_Wurth_WS-TASV','430133050816','','switches/pushbutton'),
    ('Switch_Wurth_WS-DITV','418117270901','','switches/dip_switch'),
    ('Switch_Wurth_WS-ROTV','428547320910','','switches/rotary_switch'),
    ('Switch_Wurth_WS-RSTV','471001264142','','switches/toggle_rocker'),
    ('Switch_Wurth_WS-UNKNOWN','Part','','switches/other'),
    ('Switch','Part','Momentary toggle switch','switches/toggle_rocker'),
    ('Switch','SW_DIP_x04','','switches/dip_switch'),
    ('Switch','SW_Reed','Reed switch','switches/reed_switch'),
    ('Switch','SW_SPST','SPST switch','switches/other'),
    ('Switch','Part','Slide switch','switches/slide_switch'),
    ('Switch','Part','Rotary switch','switches/rotary_switch'),
    ('Switch','Part','Snap action microswitch','switches/limit_switch'),
    ('Switch','Part','Toggle switch','switches/toggle_rocker'),
    ('Relay','Part','Reed relay, SPST','relays/reed_relay'),
    ('Relay','Part','Solid state relay','relays/solid_state_relay'),
    ('Relay','Part','Bistable polarized relay','relays/electromechanical_relays/bistable_relay'),
    ('Relay','Part','Non-latching relay','relays/electromechanical_relays/monostable_relay'),
    ('Relay','Part','12V DC coil','relays/electromechanical_relays/other'),
    ('Relay','Part','SPDT relay','relays/other'),
    ('Device','RotaryEncoder_Switch','Rotary encoder with switch','sensors/rotary_encoder'),
    ('Jumper','Jumper_2_Open','Jumper','connectors/jumpers'),
])
def test_selection_groups(library,name,description,path):
    assert category(library,name,description)==path


def test_ic_and_magnetic_sensor_are_not_mechanical_switches():
    assert selection_category('Analog_Switch','IC','Analog switch') is None
    assert selection_category('Sensor_Magnetic','DRV','Hall switch') is None
    assert selection_category('Driver_Relay','IC','Relay driver') is None
