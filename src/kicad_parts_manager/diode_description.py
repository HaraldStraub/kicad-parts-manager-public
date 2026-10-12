"""Conservative, source-labelled diode description extraction; no datasheet proof."""
import re

from kicad_parts_manager.manual_data import fields_for

NUMBER = r'(\d+(?:[.,]\d+)?)'
PREFIX = {'': 1, 'm': 1e-3, 'u': 1e-6, 'µ': 1e-6, 'μ': 1e-6, 'n': 1e-9, 'p': 1e-12, 'k': 1e3}


def extract_diode_description(row):
    category = row.get('category', '')
    if not category.startswith('semiconductor/diode/'):
        return {}, ['Keine Diodenkategorie']
    text = row.get('description', '')
    allowed = {f['key'] for f in fields_for(row)}
    values, reasons, disputed = {}, [], set()

    def add(key, value):
        if key not in allowed or key in disputed:
            return
        if key in values and values[key] != value:
            values.pop(key)
            disputed.add(key)
            reasons.append('Widersprüchliche Angaben: '+key)
        else:
            values[key] = value

    def labelled(key, label, unit):
        label = '(?:'+label+')'
        quantity = NUMBER+r'\s*([munpµμk]?)'+unit
        patterns = [r'(?<![\w.])'+label+r'\s*[:=]?\s*'+quantity+r'(?![\w/])',
                    r'(?<![\w./-])'+quantity+r'\s+'+label+r'(?!\w)']
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                if match[2] in PREFIX:
                    add(key, float(match[1].replace(',', '.'))*PREFIX[match[2]])

    for key, label, unit in [
        ('vrrm', r'VRRM', 'V'), ('vr_max', r'VR(?:\s*max)?', 'V'),
        ('vr_rms', r'Vrms|VR\(RMS\)', 'V'),
        ('surge_current', r'IFSM', 'A'), ('if_avg', r'IF\s*\(\s*AV\s*\)|IFAV|IDAV', 'A'),
        ('if_cont', r'IF\s*\(\s*DC\s*\)', 'A'), ('vf_typ', r'VF', 'V'),
        ('trr', r'trr|reverse recovery time', 's'),
        ('power_dissipation', r'Ptot|PD', 'W'),
        ('junction_capacitance', r'Cj|junction capacitance', 'F'),
        ('stand_off_description', r'VRWM|VRM|stand[- ]?off', 'V'),
        ('breakdown_description', r'VBR|breakdown', 'V'),
        ('clamp_description', r'VC|VCL|clamping', 'V'),
    ]:
        labelled(key, label, unit)

    subtype = category.rsplit('/', 1)[-1]
    # Bare leading V/A pairs conventionally describe blocking/current ratings of
    # ordinary rectifying/switching diodes. They remain unspecified/unverified,
    # without invented temperature, pulse duration, or maximum/typical status.
    ordinary = subtype in ('rectifier', 'schottky', 'switching', 'standard', 'other')
    excluded = re.search(r'trigger|DIAC|ESD|TVS|zener|varicap|capacitance diode|laser|photo|current.regulat|current.limit', text, re.I)
    pair = re.match(r'^\s*'+NUMBER+r'\s*V\s*[,;]?\s*'+NUMBER+r'\s*([mµu]?)A\b', text)
    if ordinary and not excluded and pair:
        # Labels after the current (e.g. IFSM) always override the bare-pair rule.
        tail = text[pair.end():]
        explicit_tail = re.match(r'\s*(?:IFSM|IF\s*\(|IR|peak|surge|pulse)', tail, re.I)
        if not explicit_tail:
            add('vrrm' if subtype in ('rectifier', 'schottky') else 'vr_max', float(pair[1].replace(',', '.')))
            add('if_avg' if subtype in ('rectifier', 'schottky') else 'if_cont', float(pair[2].replace(',', '.'))*PREFIX[pair[3]])
    if subtype == 'bridge':
        labelled('if_avg', r'If', 'A')
    if subtype == 'zener':
        match = re.match(r'^\s*'+NUMBER+r'\s*V\b', text)
        if match:
            value = float(match[1].replace(',', '.'))
            # Known KiCad BZV55 description typo: detect contradictory encoded
            # voltage for this specific naming convention rather than guessing.
            encoded = re.fullmatch(r'BZV55[BC](\d+)(?:V(\d+))?', row.get('name', ''), re.I)
            expected = float(encoded[1]+('.'+encoded[2] if encoded[2] else '')) if encoded else value
            if value != expected:
                reasons.append('Zenerspannung widerspricht der BZV55-Typnummer')
            else:
                add('zener_voltage', value)
        percentages = re.findall(NUMBER+r'\s*%', text)
        if len(percentages) == 1:
            add('initial_tolerance', float(percentages[0].replace(',', '.')))
    power = re.findall(r'(?<![\w./-])'+NUMBER+r'\s*(m?)W\b', text)
    if len(power) == 1:
        key = 'power_description' if subtype == 'tvs' else 'power_dissipation'
        add(key, float(power[0][0].replace(',', '.'))*PREFIX[power[0][1]])
    if subtype == 'tvs':
        if re.search(r'\bbidirectional\b', text, re.I): add('directionality', 'Bidirektional')
        elif re.search(r'\bunidirectional\b', text, re.I): add('directionality', 'Unidirektional')
    if subtype == 'laser':
        labelled('wavelength', r'wavelength', 'm')
        wavelength = re.findall(NUMBER+r'\s*nm\b', text)
        if len(wavelength) == 1: add('wavelength', float(wavelength[0].replace(',', '.'))*1e-9)
        # Peak/pulsed optical power must not silently become CW optical power.
        if len(power) == 1 and not re.search(r'peak|pulsed', text, re.I):
            add('optical_power', float(power[0][0].replace(',', '.'))*PREFIX[power[0][1]])
        values.pop('power_dissipation', None)
    return values, reasons
