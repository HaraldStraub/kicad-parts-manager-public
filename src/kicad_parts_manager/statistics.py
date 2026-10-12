"""Compact, read-only availability counts. No electrical validation claims."""
import math
import re
from collections import defaultdict


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def simulation_present(row):
    if any(m.get('file_status') == 'found' and m.get('status') not in
           ('REJECTED', 'INCOMPATIBLE', 'DEPRECATED') for m in row.get('models', [])):
        return True
    fields = row.get('simulation_fields', {})
    device, kind = fields.get('Sim.Device'), fields.get('Sim.Type', '')
    params = fields.get('Sim.Params', '').strip()
    if fields.get('Sim.Library'):
        return row.get('simulation_file_status') == 'found'
    if device in ('IBIS', 'SUBCKT'):
        return False
    if row.get('intrinsic'):
        if row.get('kind') == 'generic':
            if any(numeric(row.get('values', {}).get(k)) and row['values'][k] >= 0
                   for k in ('resistance', 'capacitance', 'inductance')):
                return True
        elif device in ('R', 'C', 'L') and re.match(
                r'^(?:[rcl]\s*=\s*)?[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:meg|[tgkmunpf])?(?:\s|$)', params, re.I):
            return True
    if device in ('D', 'NPN', 'PNP', 'NJFET', 'PJFET', 'NMOS', 'PMOS'):
        return True
    if device in ('V', 'I'):
        return kind == 'DC' or bool(params and kind in ('EXP', 'PULSE', 'SIN', 'PWL', 'WHITENOISE', 'RANDUNIFORM'))
    if device in ('SW', 'TLINE'):
        return bool(params)
    if device == 'SPICE':
        return bool(re.search(r'\btype="[BEGIV]"', params) and
                    re.search(r'\bmodel="[^"]+"', params) and not re.search(r'\blib="[^"]+"', params))
    return False


def category_statistics(rows):
    groups = defaultdict(lambda: dict(total=0, symbol=0, footprint=0, model3d=0, simulation=0, values=0))
    for row in rows:
        if row.get('kind') == 'footprint':
            continue  # A footprint is not a second component.
        path = row.get('category') or 'unassigned'
        if row.get('kind') == 'generic' and row.get('intrinsic'):
            path = 'simulation/generic/' + path.split('/')[-1]
        group = groups[path]
        group['total'] += 1
        group['symbol'] += bool(row.get('symbol') and row.get('symbol_found') is True)
        info = row.get('footprint_info') or {}
        group['footprint'] += bool(row.get('footprint') and info.get('found'))
        group['model3d'] += any(m.get('found') for m in info.get('models', []))
        group['simulation'] += simulation_present(row)
        group['values'] += any(numeric(v) for v in row.get('values', {}).values())
    return dict(categories=[dict(path=path, **values) for path, values in sorted(groups.items())],
                total=sum(g['total'] for g in groups.values()))
