import pytest
from kicad_parts_manager.manual_data import ManualData,component_key
from kicad_parts_manager.category_overrides import change_categories,targets
from kicad_parts_manager.api_errors import ApiError


def row(name):
    return dict(id='SYM-'+name,name=name,kind='library',symbol='Test:'+name,category='switches/other',values={'contact_current':2},models=[{'id':'keep'}],footprint='Keep:Footprint')


def test_batch_survives_import_and_undo_keeps_electrical_data(tmp_path):
    manual=ManualData(tmp_path/'manual.sqlite');rows={r['id']:r for r in (row('A'),row('B'))}
    changed=change_categories(manual,[dict(component_id=k,revision=0,category='switches/pushbutton') for k in rows],rows,set(targets(list(rows.values()))))['changes']
    after=manual.apply_catalog(list(rows.values()))
    assert all(r['category']=='switches/pushbutton' and r['automatic_category']=='switches/other' for r in after)
    assert all(r['values']=={'contact_current':2} and r['models']==[{'id':'keep'}] and r['footprint']=='Keep:Footprint' for r in after)
    # A fresh automatic import changes; manual choice still wins.
    fresh=[dict(r,category='switches/slide_switch') for r in rows.values()]
    assert all(r['category']=='switches/pushbutton' for r in manual.apply_catalog(fresh))
    change_categories(manual,[dict(component_id=c['component_id'],revision=c['category_revision'],category=c['previous_category']) for c in changed],rows,set(targets(list(rows.values()))))
    assert all(r['category']=='switches/slide_switch' and r['category_override'] is None for r in manual.apply_catalog(fresh))


def test_stale_batch_is_atomic(tmp_path):
    manual=ManualData(tmp_path/'manual.sqlite');rows={r['id']:r for r in (row('A'),row('B'))};allowed=set(targets(list(rows.values())))
    change_categories(manual,[dict(component_id='SYM-B',revision=0,category='switches/pushbutton')],rows,allowed)
    with pytest.raises(ApiError):change_categories(manual,[dict(component_id=k,revision=0,category='switches/reed_switch') for k in rows],rows,allowed)
    actual=manual.apply_catalog(list(rows.values()))
    assert actual[0]['category']=='switches/other' and actual[1]['category']=='switches/pushbutton'


def test_unknown_target_and_footprint_rejected(tmp_path):
    manual=ManualData(tmp_path/'manual.sqlite');r=row('A');rows={r['id']:r}
    with pytest.raises(ValueError):change_categories(manual,[dict(component_id=r['id'],revision=0,category='invented/category')],rows,set(targets([r])))
    with pytest.raises(ValueError):change_categories(manual,[dict(component_id=r['id'],revision=0,category=None)],{r['id']:dict(r,kind='footprint')},set(targets([r])))

@pytest.mark.parametrize('item',[dict(component_id=[],revision=0),dict(component_id='SYM-A',revision=0,category=[]),dict(component_id='SYM-A',revision=True,category=None)])
def test_malformed_selection_is_rejected(tmp_path,item):
    manual=ManualData(tmp_path/'manual.sqlite');r=row('A')
    with pytest.raises(ValueError):change_categories(manual,[item],{r['id']:r},set(targets([r])))
