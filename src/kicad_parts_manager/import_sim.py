"""Conservative suggestions from explicit SPICE terminal comments, never pin numbers."""
import re
from .library_import import digest

ALIASES = {
    '+': 'IN+', 'VIN+': 'IN+', 'IN+': 'IN+', 'NONINVERTING': 'IN+',
    '-': 'IN-', 'VIN-': 'IN-', 'IN-': 'IN-', 'INVERTING': 'IN-',
    'V+': 'V+', 'VCC': 'V+', 'VDD': 'V+',
    'V-': 'V-', 'VEE': 'V-', 'VSS': 'V-',
    'OUT': 'OUT', 'VO': 'OUT', 'OUTPUT': 'OUT', 'REF': 'REF',
    'A': 'A', 'ANODE': 'A', 'K': 'K', 'CATHODE': 'K',
    'G': 'G', 'GATE': 'G', 'D': 'D', 'DRAIN': 'D', 'S': 'S', 'SOURCE': 'S',
    'B':'B','BASE':'B','BULK':'B','BODY':'B','C':'C','COLLECTOR':'C','E':'E','EMITTER':'E',
    'RG': 'RG', 'RG1': 'RG', 'RG2': 'RG',
}

def role(value):
    return ALIASES.get(str(value).strip().upper())

def documented_roles(text, model):
    lines = text.splitlines()
    for number, line in enumerate(lines):
        match = re.match(r'\s*\*\s*PIN CONFIG FOR\s+' + re.escape(model['name']) + r'\s+(.+)', line, re.I)
        if not match or match[1].split() != model['pins']:
            continue
        roles = []
        started = False
        for comment in lines[max(0, number-30):number]:
            if 'CONNECTIONS:' in comment.upper():
                started = True
                comment = re.split('CONNECTIONS:', comment, flags=re.I)[1]
            elif not started:
                continue
            label = comment.lstrip(' *').replace('|', '').strip()
            if label and role(label):
                roles.append(label)
        if len(roles) == len(model['pins']):
            return roles
    return model['pins']

def candidates(models, contents, working, symbol_pins):
    known = {m['name'].casefold() for m in models}
    called = set()
    for name in {m["file_name"] for m in models}:
        raw=contents[name]
        text = raw.decode('utf-8-sig', errors='replace')
        for line in text.splitlines():
            if re.match(r'\s*X\S*\s+', line, re.I):
                called.update(word.casefold() for word in line.split()[1:] if word.casefold() in known)
    roots = [m for m in models if m['name'].casefold() not in called]
    result = []
    for model in roots:
        text = contents[model['file_name']].decode('utf-8-sig', errors='replace')
        labels = documented_roles(text, model)
        pins = []
        for token, label in zip(model['pins'], labels):
            function = role(label)
            matches = [p['number'] for p in symbol_pins if function and role(p['name']) == function]
            pins.append(dict(token=token, role=label, suggested=matches[0] if len(matches)==1 else ''))
        result.append(dict(id=digest([model['file_name'],model['name'],model['pins']])[:24],
                           name=model['name'],type=model['type'],spice_kind=model['spice_kind'],
                           pins=pins,file=str(working/model['file_name'].split('/')[-1]),
                           file_name=model['file_name'],
                           simulator='TINA' if re.search(r'^\s*\*\s*Simulator:\s*TINA\b',text,re.M|re.I) else '',
                           dependencies=bool(re.search(r'^\s*\.(?:include|inc|lib)\s',text,re.M|re.I))))
    return result

def selected_model(row, assignment, token):
    if not isinstance(assignment,dict):raise ValueError('Invalid model assignment')
    choices = row.get('sim_candidates', [])
    candidate = next((c for c in choices if c['id'] == assignment.get('model_id')), None)
    if not candidate or candidate['dependencies']:
        raise ValueError('Model unavailable or requires external dependencies')
    numbers = assignment.get('pins')
    available = {p['number']:p for p in row.get('symbol_pins', [])}
    if not isinstance(numbers,list) or len(numbers)!=len(candidate['pins']) or any(not isinstance(p,str) for p in numbers) or not set(numbers).issubset(available):
        raise ValueError('Assign each model terminal to a distinct existing symbol pin')
    if len(set(numbers))!=len(numbers) and not (candidate['type']=='M' and len(numbers)==4 and len(set(numbers[:3]))==3 and numbers[3]==numbers[2]):raise ValueError('Assign distinct symbol pins; MOSFET bulk may use source')
    for terminal, number in zip(candidate['pins'],numbers):
        expected,actual = role(terminal['role']),role(available[number]['name'])
        if expected and actual and expected != actual and not (candidate['type']=='M' and expected=='B' and actual=='S'):
            raise ValueError('Model terminal role conflicts with symbol pin')
    from pathlib import Path
    import hashlib
    path=Path(candidate['file'])
    mapping=[dict(model_pin=n+1,model_pin_name=p['token'],model_pin_role=p['role'],symbol_pin=number) for n,(p,number) in enumerate(zip(candidate['pins'],numbers))]
    return dict(id='BUNDLE-'+digest([token,candidate['id']])[:20],name=candidate['name'],status='UNVERIFIED',
                model_class='UNKNOWN',simulator=candidate['simulator'] or 'UNKNOWN',compatibility='UNKNOWN',
                file=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),passed=[],pin_map=mapping,
                user_confirmed_mapping=True),candidate
