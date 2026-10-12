"""Preview or persist missing diode values from KiCad descriptions, unverified."""
import argparse
from datetime import date
import hashlib
import json
from pathlib import Path

from kicad_parts_manager.diode_description import extract_diode_description
from kicad_parts_manager.manual_data import ManualData, component_key
from enrich_parameters import ReadOnlyManual, load_rows


def enrich(rows, manual, apply=False, extractor=extract_diode_description, prefixes=('semiconductor/diode/',)):
    report = dict(applied=apply, examined=0, imported_parameters=0, components=[])
    for row in rows:
        if not row.get('symbol') or not row.get('category', '').startswith(prefixes):
            continue
        report['examined'] += 1
        override = manual.get(component_key(row))
        current = manual.apply(row, override)
        values, reasons = extractor(row)
        keys = [key for key in values if key not in current.get('values', {}) and key not in override.get('values', {})]
        item = dict(component_key=component_key(row),symbol=row['symbol'], category=row['category'], keys=keys,
                    values={key: values[key] for key in keys}, review=reasons,
                    state='eligible' if keys else 'unchanged')
        if apply and keys:
            description = row.get('description', '')
            entries = {key: dict(value=values[key], source='KiCad description: '+row['symbol'],
                conditions=description, kind='unspecified', source_details=dict(
                    publisher='KiCad library description', mpn=row.get('name', ''),
                    document='KiCad symbol description',
                    sha256=hashlib.sha256(description.encode('utf8')).hexdigest(),
                    accessed_on=date.today().isoformat())) for key in keys}
            manual.save(row, dict(revision=override['revision'], values=entries))
            item['state'] = 'imported'
            report['imported_parameters'] += len(keys)
        report['components'].append(item)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', type=Path, help='Previously captured catalog rows (JSON list)')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--manual', type=Path, default=Path('db/manual-data.sqlite'))
    args = parser.parse_args()
    rows = json.loads(args.snapshot.read_text(encoding='utf8')) if args.snapshot else load_rows('db/library-catalog.json', 'db/kicad-parts-manager.sqlite')
    manual = ManualData(args.manual) if args.apply else ReadOnlyManual(args.manual)
    report = enrich(rows, manual, args.apply)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    print(json.dumps(dict(examined=report['examined'], symbols=sum(bool(r['keys']) for r in report['components']),
                         parameters=sum(len(r['keys']) for r in report['components']), applied=args.apply)))


if __name__ == '__main__':
    main()
