import pytest
from kicad_parts_manager.contact_description import extract_description

@pytest.mark.parametrize('category,text,expected',[
    ('protection/fuse/thermal_fuse','TCO 250VAC 139C(282F) RADIAL',{'rated_voltage':250,'voltage_type':'AC'}),
    ('relays','SPST, Closing Contact, 277VAC 35A max, 12V DC coil voltage',{'contact_configuration':'SPST','contact_voltage':277,'contact_current':35,'coil_voltage':12,'voltage_type':'AC'}),
    ('relays','SPST-NO, 7A (250 VAC), 5A (30 VDC)',{'contact_configuration':'SPST-NO'}),
    ('relays','SPDT relay, 10A',{'contact_configuration':'SPDT','contact_current':10}),
    ('relays','switching current 2/5A, voltage 220VDC/250VAC',{}),
    ('relays','DR-24V 5V DC polarized coil',{}),
    ('relays','3V DC, 2 Latching Polarized Coils, Set A1',{}),
    ('relays','RELAY GEN PURPOSE SPDT 10A 12V',{'contact_configuration':'SPDT','contact_current':10}),
    ('relays','Opto-Triac, Vdrm 400V, Ift 10mA',{}),
    ('switches','SPST switch 50mA 12V',{'contact_configuration':'SPST','contact_current':.05,'contact_voltage':12}),
    ('sensors','50mA 12V',{}),
])
def test_explicit_facts(category,text,expected):
    assert extract_description(dict(category=category,description=text))[0]==expected


def test_apply_preserves_local_values_and_repeat_adds_nothing(tmp_path):
    from tools.enrich_contact_descriptions import enrich
    from kicad_parts_manager.manual_data import ManualData,component_key
    row=dict(id='SYM-test',symbol='Test:Relay',name='Relay',kind='library',category='relays',description='SPDT 10A 12V DC coil',values={})
    manual=ManualData(tmp_path/'db/manual-data.sqlite')
    manual.save(row,dict(revision=0,values={'contact_current':dict(value=8,source='User source')}))
    first=enrich(tmp_path,True,[row])
    assert first['parameters']==2 and len(first['conflicts'])==1
    assert manual.get(component_key(row))['values']['contact_current']['value']==8
    assert enrich(tmp_path,True,[row])['parameters']==0
