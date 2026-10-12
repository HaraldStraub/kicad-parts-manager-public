"""Operator workflow: preview first, then apply that exact reviewed proposal."""
import argparse
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from enrich_parameters import load_rows,ReadOnlyManual
from kicad_parts_manager.manual_data import component_key
from kicad_parts_manager.library_import import cern_rows,file_rows,preview,read_store,apply_preview,source_manifest,merge_inventory,undo_import

ROOT=Path(__file__).resolve().parents[1]

def ask_choices(proposal,existing,input_fn=input,output=print):
    """Ask once per matching component; replacement needs an explicit key list."""
    choices={};by_id={r['id']:r for r in existing}
    for item in proposal['items']:
        target=by_id.get(item['target']);row=item['row']
        if not target or item['state'] in ('review','rejected') or (item['state']=='conflict' and not item['reason'].startswith('Existing values differ:')):continue
        if item['state']=='unchanged' and not any(row.get(f) and row.get(f)!=target.get(f) for f in ('description','datasheet')):continue
        output('\n'+row['name'])
        for key,value in row.get('values',{}).items():
            output(f"  {key}: {target.get('values',{}).get(key, '—')} → {value}")
        for field in ('description','datasheet'):
            if row.get(field)!=target.get(field) and row.get(field):output(f"  {field}: {target.get(field, '—')} → {row[field]}")
        mode=input_fn('Supplement [Enter/e], replace [r], cancel [a]: ').strip().lower()
        if mode=='a':raise KeyboardInterrupt()
        if mode not in ('','e','r'):raise ValueError('Invalid import choice; no changes saved')
        choice=dict(mode='replace' if mode=='r' else 'supplement')
        if mode=='r':
            selected=input_fn('Select parameter/field names (comma-separated; empty = nothing): ').strip()
            names=[n.strip() for n in selected.split(',') if n.strip()]
            choice.update(keys=[n for n in names if n not in ('description','datasheet')],fields=[n for n in names if n in ('description','datasheet')])
        else:choice['fields']=[f for f in ('description','datasheet') if not target.get(f) and row.get(f)]
        choices[row['id']]=choice
    return choices

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('--adapter',choices=['cern','kicad'],default='cern');p.add_argument('--table',action='append');p.add_argument('--limit-per-table',type=int);p.add_argument('--preview',type=Path,required=True);p.add_argument('--apply',action='store_true');p.add_argument('--index',type=Path,default=ROOT/'db/imported-libraries.json');p.add_argument('--inventory',type=Path,default=ROOT/'db/library-catalog.json');p.add_argument('--database',type=Path,default=ROOT/'db/kicad-parts-manager.sqlite');p.add_argument('--manual',type=Path,default=ROOT/'db/manual-data.sqlite')
    p.add_argument('--choose',action='store_true',help='Ask supplement/replace/cancel for existing components before applying')
    p.add_argument('--undo',metavar='RUN_ID',help='Undo the last changing import')
    args=p.parse_args()
    if args.undo:
        if args.apply or args.choose:p.error('Undo cannot be combined with apply/choose')
        print(json.dumps(undo_import(args.index,args.undo)));return
    if args.choose and not args.apply:p.error('--choose requires --apply')
    if args.limit_per_table is not None and args.limit_per_table<1:p.error('Limit must be positive')
    if args.index.resolve().is_relative_to(args.source.resolve()):p.error('Import index must be outside the source snapshot')
    def progress(value):print(json.dumps(value),file=sys.stderr,flush=True)
    manual=ReadOnlyManual(args.manual)
    existing=manual.apply_catalog(load_rows(args.inventory,args.database))
    store=read_store(args.index)
    if args.index.resolve()!=args.inventory.with_name('imported-libraries.json').resolve():
        existing=manual.apply_catalog(merge_inventory(dict(components=existing),store)['components'])
    if args.apply:
        proposal=json.loads(args.preview.read_text(encoding='utf8'))
        if source_manifest(args.source)!=proposal['source']:raise ValueError('Source changed since preview')
        choices=ask_choices(proposal,existing) if args.choose else None
        result=apply_preview(proposal,args.index,existing,choices=choices)
        receipt=args.preview.with_suffix('.receipt.json');receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        print(json.dumps({k:result[k] for k in ('run_id','counts','added','parameters_added','created_at')}|dict(receipt=str(receipt))));return
    recipe=dict(adapter=args.adapter,tables=args.table,limit=args.limit_per_table,adapter_version=5)
    manifest=source_manifest(args.source)
    prior=json.loads(args.preview.read_text(encoding='utf8')) if args.preview.exists() else {}
    if prior.get('source')==manifest and prior.get('recipe')==recipe:
        rows=[item['row'] for item in prior['items']];detail=prior['detail'];progress(dict(phase='reuse_unchanged_source',rows=len(rows)))
    else:
        manifest,rows,detail=cern_rows(args.source,args.table,args.limit_per_table,progress=progress) if args.adapter=='cern' else file_rows(args.source)
    proposal=preview(manifest,rows,existing,store,detail)
    proposal['recipe']=recipe
    args.preview.parent.mkdir(parents=True,exist_ok=True);args.preview.write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps(dict(counts=proposal['counts'],detail=detail,preview=str(args.preview)),ensure_ascii=False))

if __name__=='__main__':
    try:main()
    except KeyboardInterrupt:print('Import cancelled; uncommitted proposal discarded.',file=sys.stderr);sys.exit(130)
