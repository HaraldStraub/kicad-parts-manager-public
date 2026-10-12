from kicad_parts_manager.statistics import category_statistics, simulation_present


def test_counts_are_per_symbol_and_only_found_assets_count():
    rows = [
        dict(kind='library', category='semiconductor/diode', symbol='Diode:one', symbol_found=True,
             footprint='Package:one', footprint_info=dict(found=True, models=[{'found':False},{'found':True}]),
             values={'voltage':0}, simulation_fields={'Sim.Device':'D'}),
        dict(kind='library', category='semiconductor/diode', symbol='Diode:two', symbol_found=False,
             footprint='Package:missing', footprint_info=dict(found=False, models=[{'found':False}]),
             values={'rating':None,'flag':True,'bad':float('nan')}, description='100V 1A',
             simulation_fields={'Sim.Device':'D','Sim.Library':'missing.lib'}, simulation_file_status='missing'),
        dict(kind='footprint', category='footprints', footprint='Package:one'),
        dict(kind='generic', category='passive/resistor', intrinsic=True, values={'resistance':100}),
    ]
    result=category_statistics(rows)
    assert result['total']==3
    diode=next(r for r in result['categories'] if r['path']=='semiconductor/diode')
    assert diode==dict(path='semiconductor/diode',total=2,symbol=1,footprint=1,model3d=1,simulation=1,values=1)
    generic=next(r for r in result['categories'] if r['path']=='simulation/generic/resistor')
    assert generic['simulation']==1
    assert 'description' not in str(result)
    assert category_statistics([])==dict(categories=[],total=0)


def test_sim_counts_native_definitions_without_treating_pin_fields_or_missing_files_as_models():
    assert simulation_present(dict(simulation_fields={'Sim.Device':'V','Sim.Type':'DC'}))
    assert simulation_present(dict(simulation_fields={'Sim.Device':'V','Sim.Type':'PULSE','Sim.Params':'v1=0 v2=5'}))
    assert not simulation_present(dict(simulation_fields={'Sim.Device':'V','Sim.Type':'PULSE'}))
    assert not simulation_present(dict(simulation_fields={'Sim.Pins':'1=A 2=K'}))
    assert not simulation_present(dict(intrinsic=True,simulation_fields={'Sim.Device':'R','Sim.Params':'r=unknown'}))
    assert simulation_present(dict(intrinsic=True,simulation_fields={'Sim.Device':'R','Sim.Params':'r=1k'}))
    assert not simulation_present(dict(models=[{'file_status':'changed','status':'VERIFIED'}]))
    assert not simulation_present(dict(models=[{'file_status':'found','status':'REJECTED'}]))
    assert simulation_present(dict(models=[{'file_status':'found','status':'UNVERIFIED'}]))
    assert simulation_present(dict(simulation_fields={'Sim.Library':'found.lib'},simulation_file_status='found'))
