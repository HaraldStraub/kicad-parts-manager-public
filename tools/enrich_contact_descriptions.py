"""Preview/apply missing contact/fuse facts, retaining original description."""
import argparse,json,hashlib,math
from pathlib import Path
from kicad_parts_manager.browser import InventoryCache
from kicad_parts_manager.contact_description import extract_description
from kicad_parts_manager.manual_data import ManualData,component_key

def enrich(root,apply=False,rows=None,all_descriptions=False):
    root=Path(root); manual=ManualData(root/'db/manual-data.sqlite')
    rows=manual.apply_catalog(rows if rows is not None else InventoryCache(root/'db/library-catalog.json')()['components'])
    extractors=[extract_description]
    if all_descriptions:
        from kicad_parts_manager.diode_description import extract_diode_description
        from kicad_parts_manager.transistor_opto_description import extract_description as transistor
        from kicad_parts_manager.regulator_description import extract_description as regulator
        from kicad_parts_manager.passive_description import extract_description as passive
        from kicad_parts_manager.common_description import extract_description as common
        from kicad_parts_manager.connector_description import extract_description as connector
        extractors.extend([extract_diode_description,transistor,regulator,passive,common,connector])
    report=dict(applied=apply,checked=0,parts=0,parameters=0,conflicts=[],review=[],changes=[],categories={})
    for row in rows:
        if row.get('kind')!='library' or not all_descriptions and not row.get('category','').startswith(('relays','switches','protection/fuse')):continue
        report['checked']+=1; facts={};reasons=[]; disputed=set()
        count=report['categories'].setdefault(row['category'],dict(checked=0,parts=0,parameters=0));count['checked']+=1
        for extractor in extractors:
            if extractor.__name__=='extract_diode_description' and not row['category'].startswith('semiconductor/diode/'):continue
            proposed,why=extractor(row);reasons.extend(why)
            for key,value in proposed.items():
                if key in disputed:continue
                if key in facts and facts[key]!=value:
                    facts.pop(key);disputed.add(key);reasons.append('Conflicting extraction: '+key)
                else:facts[key]=value
        if reasons:report['review'].append(dict(id=row['id'],name=row['name'],reasons=reasons))
        if not facts:continue
        override=manual.get(component_key(row));changes={}
        for key,value in facts.items():
            existing=row.get('values',{}).get(key)
            if existing is not None:
                equal=math.isclose(existing,value,rel_tol=1e-9,abs_tol=1e-18) if isinstance(existing,(int,float)) and isinstance(value,(int,float)) else existing==value
                if not equal:report['conflicts'].append(dict(id=row['id'],key=key,existing=existing,proposed=value))
                continue
            if key in override.get('values',{}):continue
            description=row.get('description','')
            changes[key]=dict(value=value,source='KiCad description: '+row.get('symbol',''),conditions='Unverified library description: '+description,kind='unspecified',source_details=dict(document='KiCad library description',mpn=row['name']))
        if changes:
            report['parts']+=1;report['parameters']+=len(changes)
            count['parts']+=1;count['parameters']+=len(changes)
            report['changes'].append(dict(id=row['id'],name=row['name'],category=row['category'],description=row.get('description',''),description_sha256=hashlib.sha256(row.get('description','').encode()).hexdigest(),values={k:v['value'] for k,v in changes.items()}))
            if apply:manual.save(row,dict(revision=override['revision'],values=changes))
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--all-descriptions',action='store_true');p.add_argument('--report',type=Path,required=True);args=p.parse_args()
    report=enrich(Path(__file__).resolve().parents[1],args.apply,all_descriptions=args.all_descriptions)
    args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:v for k,v in report.items() if k not in ('changes','conflicts','review','categories')}|{'conflicts':len(report['conflicts']),'review':len(report['review'])}))
