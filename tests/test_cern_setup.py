import importlib.util
from pathlib import Path
import pytest
import json

spec=importlib.util.spec_from_file_location('cern_setup',Path(__file__).resolve().parents[1]/'tools/setup_cern_kicad.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

def test_registration_is_additive_and_repeatable():
    original='(sym_lib_table (lib (name "Own") (type "KiCad") (uri "own.kicad_sym")))'
    entries=[('CERN','Database','CERN.kicad_dbl')]
    result=module.append_entries(original,entries)
    assert '(name "Own")' in result
    assert module.append_entries(result,entries)==result
    with pytest.raises(ValueError,match='collision'):
        module.append_entries(result,[('CERN','Database','other.kicad_dbl')])

def test_full_mpn_is_searchable_without_changing_source(tmp_path, monkeypatch):
    source=tmp_path/'source';source.mkdir()
    original={'libraries':[{'table':name,'properties':{'keywords':'Value'}} for name in ('Diodes','Capacitors SMD','Resistors SMD','Operational Amplifiers')]}
    original_path=source/'CERN_Windows.kicad_dbl'
    original_path.write_text(json.dumps(original),encoding='utf8')
    before=original_path.read_bytes()
    for name in ('Capacitors','Diodes','Resistors','Operational Amplifiers'):
        path=source/'SchLib'/(name+'.kicad_sym');path.parent.mkdir(exist_ok=True);path.touch()
    for name in ('Capacitors SMD','Resistors SMD','ICs And Semiconductors SMD','ICs And Semiconductors THD','ICs And Semiconductors BONDING'):
        (source/'PcbLib'/(name+'.pretty')).mkdir(parents=True)
    config=tmp_path/'config';config.mkdir()
    for name in ('sym-lib-table','fp-lib-table'):
        (config/name).write_text('(sym_lib_table)',encoding='utf8')
    monkeypatch.setattr(module,'source_manifest',lambda _: {'revision':'test'})
    output=tmp_path/'derived'
    result=module.setup(source,config,output,apply=True)
    assert result['tables']==4
    assert result['symbol_libraries']==4
    assert 'Operational Amplifiers' in (config/'sym-lib-table').read_text()
    assert module.setup(source,config,output,apply=True)['changed']==[]
    generated=json.loads((output/'CERN.kicad_dbl').read_text(encoding='utf8'))
    assert all(d['properties']['keywords']=='Manufacturer Part Number' for d in generated['libraries'])
    assert original_path.read_bytes()==before

def test_collision_does_not_write_definition(tmp_path, monkeypatch):
    source=tmp_path/'source';source.mkdir()
    (source/'CERN_Windows.kicad_dbl').write_text(json.dumps({'libraries':[{'table':'Other'}]}))
    (source/'SchLib').mkdir();(source/'SchLib/Other.kicad_sym').touch()
    (source/'PcbLib/Other.pretty').mkdir(parents=True)
    config=tmp_path/'config';config.mkdir()
    (config/'sym-lib-table').write_text('(sym_lib_table (lib (name "Other") (type "KiCad") (uri "own")))')
    monkeypatch.setattr(module,'source_manifest',lambda _: {'revision':'test'})
    with pytest.raises(ValueError,match='collision'):
        module.setup(source,config,tmp_path/'output',apply=True)
    assert not (tmp_path/'output').exists()
