"""Refresh model-file evidence without changing imported inventory rows."""
from hashlib import sha256
import os
import json
from pathlib import Path
from kicad_parts_manager.kicad.inventory import resolve


def refresh_simulation_files(rows,inventory=None):
    inventory=inventory or {};variables=dict(os.environ)
    if inventory.get('config'):
        common=Path(inventory['config'])/'kicad_common.json'
        try:variables.update(json.loads(common.read_text(encoding='utf-8')).get('environment',{}).get('vars',{}))
        except (OSError,ValueError):pass
        if inventory.get('share'):
            major=Path(inventory['config']).name.split('.')[0]
            for suffix,folder in [('SYMBOL_DIR','symbols'),('FOOTPRINT_DIR','footprints'),('3DMODEL_DIR','3dmodels')]:
                variables.setdefault(f'KICAD{major}_{suffix}',str(Path(inventory['share'])/folder))
    if inventory.get('project'):variables['KIPRJMOD']=inventory['project']
    # The resolved path is retained in new scans. Legacy catalogs can resolve
    # environment variables and relative paths against the symbol library.
    cache={}
    def inspect(path,expected=None,normalized=False):
        key=(str(path),expected,normalized)
        if key not in cache:
            try:
                if not path.is_file():state='missing'
                elif expected:
                    raw=path.read_bytes()
                    if normalized:raw=raw.replace(b'\r\n',b'\n')
                    state='found' if sha256(raw).hexdigest()==expected else 'changed'
                else:state='found'
            except OSError:state='unknown'
            cache[key]=state
        return cache[key]
    for row in rows:
        row['models']=[dict(m) for m in row.get('models',[])]
        for model in row['models']:
            filename=model.get('file')
            state=inspect(Path(filename),model.get('file_sha256') or model.get('sha256'),model.get('file_hash_normalized',False)) if filename else 'unknown'
            if model.get('source_file') and state=='found':
                source=inspect(Path(model['source_file']),model.get('sha256'))
                if source!='found':state=source
            model['file_status']=state
            if model.get('check') and model.get('id','').startswith('LOCAL-'):
                symbol_file=model.get('symbol_source_file');symbol_hash=model.get('symbol_source_sha256')
                symbol_state=inspect(Path(symbol_file),symbol_hash) if symbol_file and symbol_hash else 'unknown'
                if model.get('symbol_source_reference') and row.get('symbol') and model['symbol_source_reference']!=row['symbol']:symbol_state='changed'
                model['symbol_status']=symbol_state
                if symbol_state!='found':
                    model['passed']=[];model['compatibility']='UNKNOWN'
                    model['check']=dict(model['check'],ok=False,stale=True,stale_reason='Symbolreferenz oder Symbolbibliothek geändert, nicht gefunden oder im früheren Test nicht mit Prüfsumme erfasst. Symbol und Pinzuordnung erneut prüfen.')
            if state!='found':
                model['passed']=[]
                model['compatibility']='UNKNOWN'
                if model.get('check'):model['check']=dict(model['check'],ok=False,stale=True)
        fields=row.get('simulation_fields',{})
        if fields.get('Sim.Library'):
            path=row.get('simulation_file_path')
            if not path:
                path=resolve(fields['Sim.Library'],variables,Path(row.get('source_file') or '.').parent)
            state=inspect(Path(path))
            row['simulation_file_status']=state
            row['simulation_file_found']=state=='found'
    return {key[0] for key in cache}
