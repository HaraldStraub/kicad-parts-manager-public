"""Preview/apply source-matched pilot facts without changing KiCad libraries.

Only exact MPN, manufacturer document and package matches are eligible here.
Other candidates require the interactive manufacturer's variant review.
"""
import argparse
import json
from pathlib import Path
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from kicad_parts_manager.browser import InventoryCache
from kicad_parts_manager.catalog import catalog
from kicad_parts_manager.manufacturer_parameters import ManufacturerParameters, document_identity, package_matches
from kicad_parts_manager.manual_data import ManualData, component_key


class ReadOnlyManual(ManualData):
    def __init__(self,path):self.path=Path(path)

    def connect(self):
        return sqlite3.connect(self.path.resolve().as_uri()+'?mode=ro',uri=True)

    def apply_catalog(self,rows):
        return super().apply_catalog(rows) if self.path.is_file() else rows

    def get(self,key):
        if not self.path.is_file():return dict(revision=0,values={})
        with sqlite3.connect(self.path.resolve().as_uri()+'?mode=ro',uri=True) as db:
            row=db.execute('SELECT revision,data FROM overrides WHERE component=?',(key,)).fetchone()
        return dict(revision=row[0],**json.loads(row[1])) if row else dict(revision=0,values={})


def load_rows(inventory_path,database_path):
    inventory=InventoryCache(Path(inventory_path))()
    database_path=Path(database_path)
    if database_path.name=="kicad-parts-manager.sqlite" and not database_path.exists():
        from kicad_parts_manager.compatibility import main_database
        database_path=main_database(database_path.resolve().parent.parent)
    if not database_path.is_file():return (inventory or {}).get('components',[])
    database=create_engine('sqlite:///file:'+database_path.resolve().as_posix()+'?mode=ro&uri=true')
    try:
        with Session(database) as session:return catalog(session,inventory)['components']
    finally:database.dispose()


def enrich(rows,manual,library,apply=False,parts=None):
    report=dict(applied=apply,package_version=library.data['version'],components=[],imported_parameters=0)
    wanted={p.strip().casefold() for p in parts or []}
    seen=set()
    for row in rows:
        if wanted and row.get('name','').casefold() not in wanted:continue
        for record in library.matches(row):
            identity=(component_key(row),record['id'])
            if identity in seen:continue
            seen.add(identity);preview=library.preview(row,manual,record['id'])
            item=dict(component_id=row['id'],symbol=row['symbol'],mpn=record['mpn'],publisher=record['publisher'],source=record['source']['url'])
            current=manual.apply(row,manual.get(component_key(row)))
            if document_identity(current.get('datasheet'))!=document_identity(record['source']['url']):
                item.update(state='review_required',reason='Hersteller-Datenblatt stimmt nicht überein.')
            elif current.get('manufacturer') and current['manufacturer'].casefold()!=record['publisher'].casefold():
                item.update(state='review_required',reason='Hersteller weicht ab.')
            elif not package_matches(current.get('footprint'),record):
                item.update(state='review_required',reason='Gehäusezuordnung prüfen.')
            else:
                keys=[f['key'] for f in preview['fields'] if f['state']=='new']
                item.update(state='eligible' if keys else 'unchanged',keys=keys,protected=[f['key'] for f in preview['fields'] if f['state']=='protected'])
                if apply and keys:
                    result=library.apply(row,manual,dict(candidate_id=record['id'],revision=preview['revision'],preview_token=preview['token'],
                        keys=keys,confirm_identity=True,use_datasheet=not current.get('datasheet') and not preview['datasheet_protected'],
                        use_manufacturer=not preview['current_manufacturer'] and not preview['manufacturer_protected']))
                    item.update(state='imported',revision=result['override']['revision']);report['imported_parameters']+=result['imported']
            report['components'].append(item)
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory',type=Path,default=Path('db/library-catalog.json'))
    parser.add_argument('--manual',type=Path,default=Path('db/manual-data.sqlite'))
    parser.add_argument('--database',type=Path,default=Path('db/kicad-parts-manager.sqlite'),help='Herstellerbauteile zusätzlich schreibgeschützt einlesen')
    parser.add_argument('--apply',action='store_true',help='Neue Werte für sichere Quellen-/Gehäusetreffer lokal speichern')
    parser.add_argument('--parts',nargs='*',help='Exakte MPNs eingrenzen')
    parser.add_argument('--output',type=Path,help='Prüfbericht als JSON speichern')
    args=parser.parse_args()
    library=ManufacturerParameters();rows=load_rows(args.inventory,args.database)
    manual=ManualData(args.manual) if args.apply else ReadOnlyManual(args.manual)
    report=enrich(rows,manual,library,args.apply,args.parts)
    if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    counts={state:sum(r['state']==state for r in report['components']) for state in ('eligible','imported','review_required','unchanged')}
    print(json.dumps(dict(counts=counts,imported_parameters=report['imported_parameters']),ensure_ascii=True))


if __name__=='__main__':main()
