from kicad_parts_manager.name_rules import manufacturer_name_parameters
from kicad_parts_manager.manual_data import fields_for


def test_sensor_rule_retains_variant_and_conditions():
    row=dict(library='Sensor_Magnetic',name='DRV5055A2xDBZxQ1')
    facts=manufacturer_name_parameters(row)
    assert facts['measurement_min']['value']==-.042
    assert facts['measurement_max']['value']==.042
    assert facts['operating_temp_min']['value']==-40
    assert set(facts).issubset({f['key'] for f in fields_for(dict(category='sensors/magnetic'))})
    assert 'VCC = 5 V' in facts['measurement_max']['conditions']
    assert 'supply_min_description' not in facts
    assert manufacturer_name_parameters(dict(row,name='DRV5055A2xDBZx')) is None
    assert manufacturer_name_parameters(dict(row,name='DRV5055A9xDBZxQ1')) is None
    assert manufacturer_name_parameters(dict(row,library='Unrelated')) is None


def test_manufacturer_rule_apply_preserves_existing_values_and_is_repeatable(tmp_path):
    import importlib.util
    from pathlib import Path
    from kicad_parts_manager.manual_data import ManualData,component_key
    spec=importlib.util.spec_from_file_location('name_rule_tool',Path(__file__).resolve().parents[1]/'tools/enrich_manufacturer_name_rules.py')
    tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)
    (tmp_path/'db').mkdir()
    row=dict(id='SYM-TEST',kind='library',library='Sensor_Magnetic',symbol='Sensor_Magnetic:DRV5055A2xDBZxQ1',name='DRV5055A2xDBZxQ1',category='sensors/magnetic',values={'measurement_max':.044})
    result=tool.enrich(tmp_path,True,[row])
    assert result['parameters']==3 and len(result['conflicts'])==1
    assert tool.enrich(tmp_path,True,[row])['parameters']==0
    manual=ManualData(tmp_path/'db/manual-data.sqlite')
    values=manual.get(component_key(row))['values']
    assert 'measurement_max' not in values
    assert 'VCC = 5 V' in values['measurement_min']['conditions']
