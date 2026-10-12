"""Reviewed manufacturer rules for exact library selection groups, not fuzzy MPNs."""
import re


def manufacturer_name_parameters(row):
    # x is a deliberate KiCad selection-group placeholder. Keep it intact.
    if row.get('library') != 'Sensor_Magnetic':
        return None
    m=re.fullmatch(r'DRV5055A([1-4])x(DBZ|LPG)xQ1',row.get('name',''))
    if not m:
        return None
    limit={1:.021,2:.042,3:.085,4:.169}[int(m[1])]
    source='https://www.ti.com/lit/ds/symlink/drv5055-q1.pdf'
    conditions='VCC = 5 V; linear magnetic sensing range. Operating supply ranges are 3–3.63 V OR 4.5–5.5 V, not a continuous 3–5.5 V range. Selection-group placeholders remain unresolved.'
    values={
        'measurement_min':dict(value=-limit,conditions=conditions,kind='minimum'),
        'measurement_max':dict(value=limit,conditions=conditions,kind='maximum'),
        'operating_temp_min':dict(value=-40,conditions='Operating ambient temperature TA; observe thermal limits. All DRV5055-Q1 selection groups.',kind='minimum'),
        'operating_temp_max':dict(value=150,conditions='Operating ambient temperature TA; observe thermal limits. All DRV5055-Q1 selection groups.',kind='maximum'),
    }
    for value in values.values():
        value.update(source=source,source_details=dict(publisher='Texas Instruments',document='SBAS639E',revision='June 2025',page='4 / 6 (sections 5.3 / 5.6)',mpn=row['name'],url=source,accessed_on='2026-10-08'))
    return values
