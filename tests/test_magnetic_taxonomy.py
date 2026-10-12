import pytest
from kicad_parts_manager.kicad.taxonomy import magnetic_category
from kicad_parts_manager.kicad.inventory import category
from kicad_parts_manager.manual_data import fields_for

@pytest.mark.parametrize('library,description,old,leaf',[
    ('Inductor_Wurth_WE-MAPI','','passive/inductor/Old','inductor/power_inductor'),
    ('Inductor_Wurth_WE-KI','','','inductor/rf_inductor'),
    ('Inductor_Wurth_WE-DD','','','inductor/coupled_inductor'),
    ('Inductor_Wurth_WE-CNSW','','','suppression/common_mode_choke'),
    ('Ferrite_Wurth_WE-CBF','','passive/ferrite','suppression/ferrite'),
    ('Transformer_Wurth_WE-CST','','','transformer/current_transformer'),
    ('Transformer','Mains transformer','','transformer/mains_transformer'),
    ('Transformer','Signal transformer','','transformer/signal_transformer'),
    ('Inductor','Differential mode choke','','suppression/differential_choke'),
    ('Device','Clamp ferrite','passive/ferrite','suppression/cable_ferrite'),
    ('Inductor_Wurth_UNKNOWN','','','inductor/other'),
    ('Transformer_Wurth_UNKNOWN','','','transformer/other'),
])
def test_functional_categories(library,description,old,leaf):
    expected='passive/magnetics/'+leaf
    assert magnetic_category(library,'Part',description,old)==expected
    assert category(library,'Part',description)==expected

def test_generic_simulation_and_incidental_mentions_stay_separate():
    assert category('Device','L','Inductor')=='simulation/generic/inductor'
    assert magnetic_category('Device','L','Inductor','simulation/generic/inductor') is None
    assert magnetic_category('Amplifier','Part','Amplifier with ferrite bead compensation') is None
    assert magnetic_category('Module','Part','Buck module with common mode choke filter') is None
    assert category('Regulator_Switching','Part','Buck converter with ferrite bead')=='integrated/power_ic/switch_regulator'

@pytest.mark.parametrize('old,new',[
    ('passive/transformer','passive/magnetics/transformer/current_transformer'),
    ('passive/common_mode_choke','passive/magnetics/suppression/common_mode_choke'),
    ('passive/ferrite','passive/magnetics/suppression/cable_ferrite'),
    ('passive/inductor','passive/magnetics/inductor/power_inductor'),
])
def test_category_migration_preserves_parameter_definitions(old,new):
    assert fields_for({'category':old})==fields_for({'category':new})
