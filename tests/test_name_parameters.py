from kicad_parts_manager.name_parameters import name_parameters
import pytest

def test_explicit_cern_resistor_name():
    values,_=name_parameters({'category':'passive/resistor/precision','kicad_reference':'CERN:Resistors SMD/R0402_2K_0.1%_0.063W_25PPM'})
    assert values=={'resistance':2000,'tolerance_description':.1,'power_description':.063,'temperature_coefficient':25}

def test_conflicts_and_part_numbers_not_decoded():
    assert name_parameters({'category':'passive/resistor','name':'ABC104'})[0]=={}
    assert 'resistance' not in name_parameters({'category':'passive/resistor','name':'R0402_2K_3K'})[0]
    assert name_parameters({'category':'simulation/generic/resistor','name':'R0402_2K'})[0]=={}
    assert name_parameters({'category':'passive/capacitor','name':'104'})[0]=={}

def test_capacitor_and_inductor_explicit_units():
    assert name_parameters({'category':'passive/capacitor','name':'C0402_100N_5%'})[0]==pytest.approx({'capacitance':1e-7,'tolerance_description':5})
    assert name_parameters({'category':'passive/magnetics/inductor/power_inductor','name':'L_10uH_10%'})[0]==pytest.approx({'inductance':1e-5,'tolerance_description':10})
    assert name_parameters({'category':'passive/capacitor','name':'CC0805_100NF_50V_10%'})[0]==pytest.approx({'capacitance':1e-7,'voltage_description':50,'tolerance_description':10})

def test_apply_preserves_existing_ratings_and_repeating_adds_nothing(tmp_path,monkeypatch):
    import importlib.util
    from pathlib import Path
    from kicad_parts_manager.manual_data import ManualData,component_key
    spec=importlib.util.spec_from_file_location('name_enrichment',Path(__file__).resolve().parents[1]/'tools/enrich_name_parameters.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    (tmp_path/'db').mkdir()
    row={'id':'SYM-TEST','kind':'library','symbol':'Lib:R','category':'passive/resistor','name':'R0402_2K_0.1%_0.063W_25PPM','values':{'resistance':1000,'power_description':.0625}}
    monkeypatch.setattr(module,'InventoryCache',lambda _:lambda:{'components':[row]})
    result=module.enrich(tmp_path,True)
    assert result['parameters']==2 and len(result['conflicts'])==2
    manual=ManualData(tmp_path/'db/manual-data.sqlite');updated=manual.apply(row,manual.get(component_key(row)))
    assert updated['values']['resistance']==1000 and updated['values']['power_description']==.0625
    assert updated['values']['tolerance_description']==.1
    assert module.enrich(tmp_path,True)['parameters']==0
