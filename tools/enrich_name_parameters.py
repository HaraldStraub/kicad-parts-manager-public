"""Preview/apply missing explicit name ratings into local metadata, preserving existing values."""
import argparse,json,math
from pathlib import Path
from kicad_parts_manager.browser import InventoryCache
from kicad_parts_manager.manual_data import ManualData,fields_for,component_key
from kicad_parts_manager.name_parameters import name_parameters

def enrich(root,apply=False,inventory_rows=None):
    root=Path(root);manual=ManualData(root/'db/manual-data.sqlite')
    rows=manual.apply_catalog(inventory_rows if inventory_rows is not None else InventoryCache(root/'db/library-catalog.json')()['components'])
    report={'applied':apply,'parts':0,'parameters':0,'checked':0,'without_safe_name_values':{},'conflicts':[],'changes':[]}
    for row in rows:
        if row.get('kind')!='library':continue
        report['checked']+=1
        values,reference=name_parameters(row)
        if not values:
            category=row.get('category','unassigned');report['without_safe_name_values'][category]=report['without_safe_name_values'].get(category,0)+1
            continue
        allowed={f['key'] for f in fields_for(row)};changes={}
        override=manual.get(component_key(row))
        for key,value in values.items():
            if key not in allowed:continue
            existing=row.get('values',{}).get(key)
            if existing is not None:
                if not math.isclose(existing,value,rel_tol=1e-9,abs_tol=1e-18):report['conflicts'].append({'id':row['id'],'key':key,'existing':existing,'name_value':value,'reference':reference})
                continue
            if key in override.get('values',{}):continue
            changes[key]={'value':value,'source':'Library designation: '+reference,'conditions':'Explicit library designation; electrical accuracy and measurement conditions unverified','source_details':{'document':'Library designation','mpn':row.get('name','')},'kind':'unspecified'}
        if changes:
            report['parts']+=1;report['parameters']+=len(changes);report['changes'].append({'id':row['id'],'reference':reference,'values':{k:v['value'] for k,v in changes.items()}})
            if apply:manual.save(row,{'revision':override['revision'],'values':changes})
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--apply',action='store_true');parser.add_argument('--report',type=Path,required=True);args=parser.parse_args()
    report=enrich(Path(__file__).resolve().parents[1],args.apply);args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(dict(applied=report['applied'],parts=report['parts'],parameters=report['parameters'],conflicts=len(report['conflicts'])),ensure_ascii=False))
