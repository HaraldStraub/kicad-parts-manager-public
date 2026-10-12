"""Check current KiCad library tables without scanning library contents."""
import json
import os
from pathlib import Path
from .inventory import tables


def current_tables(data, dependencies=None):
    if not data or not data.get('config') or not data.get('share'):
        return None
    config, share = Path(data['config']), Path(data['share'])
    if not (config / 'sym-lib-table').is_file():
        return None
    major = config.name.split('.')[0]
    variables = dict(os.environ)
    common = config / 'kicad_common.json'
    if common.is_file():
        variables.update(json.loads(common.read_text(encoding='utf-8')).get('environment', {}).get('vars', {}))
    for suffix, folder in [('SYMBOL_DIR', 'symbols'), ('FOOTPRINT_DIR', 'footprints'), ('3DMODEL_DIR', '3dmodels')]:
        variables.setdefault(f'KICAD{major}_{suffix}', str(share / folder))
    home = Path(data.get('user_home') or Path.home())
    variables.setdefault(f'KICAD{major}_3RD_PARTY', str(home / 'Documents/KiCad' / config.name / '3rdparty'))
    if data.get('project'):
        variables['KIPRJMOD'] = data['project']
    result = []
    def read_table(path, warnings):
        seen = set()
        result = tables(path, variables, warnings, seen, dependencies_only=dependencies is not None)
        if dependencies is not None:
            dependencies.update(seen)
        return result
    for filename in ('sym-lib-table', 'fp-lib-table'):
        warnings = []
        libs = read_table(config / filename, warnings)
        if data.get('project'):
            libs.update(read_table(Path(data['project']) / filename, warnings))
        result.append(libs)
    return result


def refresh_registration(data):
    result = current_tables(data)
    if result is None:
        return
    symbols, footprints = result
    resolved = {}
    def same(left, right):
        for path in (left, right):
            key = str(path)
            if key not in resolved:
                resolved[key] = Path(path).resolve()
        return resolved[str(left)] == resolved[str(right)]
    for row in data.get('components', []):
        # Database-backed imports have their own source/registration workflow.
        if row.get('import_key') and not row.get('import_key','').startswith('USR-'):
            continue
        source = row.get('source_file')
        if source and row.get('symbol'):
            alias = row['symbol'].split(':', 1)[0]
            row['registered'] = alias in symbols and same(symbols[alias], source)
        if source and row.get('kind') == 'footprint':
            alias = row.get('footprint', '').split(':', 1)[0]
            row['registered'] = alias in footprints and same(footprints[alias], Path(source).parent)
        info = row.get('footprint_info')
        if info and info.get('path'):
            alias = row.get('footprint', '').split(':', 1)[0]
            info['registered'] = alias in footprints and same(footprints[alias], Path(info['path']).parent)
