"""Register existing indexed native libraries; preserve entries and report collisions."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
from kicad_parts_manager.kicad.inventory import parse, children, field
from kicad_parts_manager.kicad.registration import current_tables


def register(data, apply=False, backup=Path('backups/kicad-config')):
    config = Path(data['config'])
    current = current_tables(data)
    if current is None:
        raise ValueError('KiCad library tables are unavailable')
    candidates = [{}, {}]
    conflicts = []
    for row in data.get('components', []):
        if row.get('import_key') or not row.get('source_file'):
            continue
        source = Path(row['source_file']).resolve()
        index = 1 if row.get('kind') == 'footprint' else 0
        reference = row.get('footprint' if index else 'symbol', '')
        target = source.parent if index else source
        if not reference or not source.is_file() or (index == 0 and source.suffix != '.kicad_sym'):
            continue
        alias = reference.split(':', 1)[0]
        if alias in candidates[index] and candidates[index][alias] != target:
            conflicts.append(alias);continue
        candidates[index][alias] = target
    changes = []
    counts = []
    for index, filename in enumerate(('sym-lib-table', 'fp-lib-table')):
        path = config / filename
        before = path.read_text(encoding='utf-8-sig')
        existing = {field(lib, 'name') for lib in children(parse(before), 'lib')}
        additions = []
        for alias, target in sorted(candidates[index].items()):
            if alias in conflicts:
                continue
            if alias in current[index]:
                if current[index][alias].resolve() != target:
                    conflicts.append(alias)
                continue
            if alias in existing:
                conflicts.append(alias);continue
            q = lambda value: json.dumps(value, ensure_ascii=False)
            additions.append(' (lib (name ' + q(alias) + ') (type "KiCad") (uri ' + q(target.as_posix()) + ') (options "") (descr "KiCad Parts Manager indexed library"))\n')
        end = before.rfind(')')
        after = before[:end] + ''.join(additions) + before[end:]
        parse(after)
        changes.append((path, before, after));counts.append(len(additions))
    if apply:
        backup = Path(backup) / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        backup.mkdir(parents=True)
        for path, before, after in changes:
            if before == after:
                continue
            if path.read_text(encoding='utf-8-sig') != before:
                raise ValueError('Library table changed concurrently: ' + str(path))
            (backup / path.name).write_text(before, encoding='utf-8')
            temporary = path.with_name(path.name + '.parts-manager.tmp')
            temporary.write_text(after, encoding='utf-8');os.replace(temporary, path)
    return dict(applied=apply, symbols=counts[0], footprints=counts[1], conflicts=sorted(set(conflicts)))


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--catalog', type=Path, default=Path('db/library-catalog.json'))
    p.add_argument('--apply', action='store_true')
    a = p.parse_args()
    print(json.dumps(register(json.loads(a.catalog.read_text(encoding='utf-8')), a.apply)))
