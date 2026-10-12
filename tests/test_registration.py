from pathlib import Path
import importlib.util
from kicad_parts_manager.kicad.registration import refresh_registration

spec=importlib.util.spec_from_file_location('register_catalog_libraries',Path(__file__).resolve().parents[1]/'tools/register_catalog_libraries.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


def test_register_and_refresh_preserve_collisions_and_are_idempotent(tmp_path):
    config=tmp_path/'10.0';config.mkdir()
    (config/'sym-lib-table').write_text('(sym_lib_table (lib (name "Other") (type "KiCad") (uri "old.kicad_sym")))')
    (config/'fp-lib-table').write_text('(fp_lib_table)')
    source=tmp_path/'new.kicad_sym';source.write_text('(kicad_symbol_lib)')
    data=dict(config=str(config),share=str(tmp_path),components=[dict(symbol='New:R',source_file=str(source),registered=False),dict(symbol='Other:R',source_file=str(source),registered=False)])
    preview=module.register(data);assert preview['symbols']==1;assert preview['conflicts']==['Other']
    assert 'New' not in (config/'sym-lib-table').read_text()
    module.register(data,True,tmp_path/'backup')
    refresh_registration(data)
    assert data['components'][0]['registered'] is True
    assert data['components'][1]['registered'] is False
    assert module.register(data)['symbols']==0
    assert list((tmp_path/'backup').rglob('sym-lib-table'))
