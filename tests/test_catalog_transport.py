import json
import gzip
import os
from kicad_parts_manager.catalog_transport import compact_catalog, CatalogResponseCache


def test_compact_transport_reconstructs_exact_rows_without_mutating_input():
    rows=[dict(id='one',source_file='same path',footprint_info={'found':True,'models':['3d']},footprint_preview_key='preview'),
          dict(id='two',source_file='same path',footprint_info={'found':False,'models':[]}),dict(id='three')]
    original=json.dumps(rows)
    packed=compact_catalog({'components':rows,'inventory':{'counts':{}}})
    restored=[]
    for row in packed['components']:
        row=dict(row)
        for field,values in packed['shared'].items():
            if field+'_shared' in row:row[field]=values[row.pop(field+'_shared')]
        restored.append(row)
    assert restored==rows and json.dumps(rows)==original
    assert packed['shared']['source_file']==['same path']


def test_response_reuse_detects_database_wal_model_and_missing_file_changes(tmp_path):
    database=tmp_path/'data.sqlite';database.write_text('initial')
    model=tmp_path/'model.lib';model.write_text('model A')
    wal=tmp_path/'data.sqlite-wal';calls=[]
    cache=CatalogResponseCache([database,wal])
    def build():
        calls.append(1)
        return {'components':[{'id':'one','category':'test','source_file':str(model),'models':[],'values':{},'description':database.read_text()}]}, {model}
    first=cache.get(build);cache.get(build);assert len(calls)==2 # discover dependency, then stable snapshot
    assert cache.get(build)==first and len(calls)==2
    old=model.stat();model.write_text('model B');os.utime(model,ns=(old.st_atime_ns,old.st_mtime_ns))
    cache.get(build);assert len(calls)==3 # same size + mtime, ctime changed
    wal.write_text('committed new data');cache.get(build);assert len(calls)==4
    model.unlink();cache.get(build);assert len(calls)==5
    model.write_text('restored');cache.get(build);assert len(calls)==6
    replacement=tmp_path/'replacement';replacement.write_text('updated');replacement.replace(database)
    raw,compressed,stats=cache.get(build);assert len(calls)==7
    assert json.loads(raw)['components'][0]['description']=='updated'
    assert gzip.decompress(compressed)==raw
    assert json.loads(stats)['total']==1


def test_concurrent_edit_during_build_is_not_reused(tmp_path):
    path=tmp_path/'db';path.write_text('old');cache=CatalogResponseCache([path]);calls=[]
    def build():
        value=path.read_text();calls.append(value)
        if value=='old':path.write_text('new')
        return {'components':[dict(id='one',category='test',models=[],values={},description=value)]}, set()
    cache.get(build)
    assert json.loads(cache.get(build)[0])['components'][0]['description']=='new'
    cache.get(build);assert calls==['old','new']
