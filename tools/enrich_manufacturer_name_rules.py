"""Apply reviewed exact manufacturer-selection-group facts to missing fields only."""
import argparse,json,math
from pathlib import Path
from kicad_parts_manager.browser import InventoryCache
from kicad_parts_manager.manual_data import ManualData,component_key,fields_for
from kicad_parts_manager.name_rules import manufacturer_name_parameters


def enrich(root,apply=False,inventory_rows=None):
    root=Path(root);manual=ManualData(root/'db/manual-data.sqlite')
    rows=manual.apply_catalog(inventory_rows if inventory_rows is not None else InventoryCache(root/'db/library-catalog.json')()['components'])
    report=dict(applied=apply,checked=0,parts=0,parameters=0,conflicts=[],changes=[])
    for row in rows:
        if row.get('kind')!='library':continue
        report['checked']+=1
        facts=manufacturer_name_parameters(row)
        if facts is None:continue
        allowed={f['key'] for f in fields_for(row)};override=manual.get(component_key(row));changes={}
        for key,entry in facts.items():
            if key not in allowed:continue
            existing=row.get('values',{}).get(key)
            if existing is not None:
                if not isinstance(existing,(int,float)) or not math.isclose(existing,entry['value'],rel_tol=1e-9,abs_tol=1e-18):report['conflicts'].append(dict(id=row['id'],key=key,existing=existing,rule_value=entry['value']))
                continue
            if key not in override.get('values',{}):changes[key]=entry
        if not changes:continue
        report['parts']+=1;report['parameters']+=len(changes);report['changes'].append(dict(id=row['id'],name=row['name'],values=changes))
        if apply:manual.save(row,dict(revision=override['revision'],values=changes))
    return report


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--report',type=Path,required=True);a=p.parse_args()
    result=enrich(Path(__file__).resolve().parents[1],a.apply);a.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('changes','conflicts')}))
