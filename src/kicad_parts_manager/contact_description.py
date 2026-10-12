"""Conservative, explicitly stated contact and fuse facts; never decode MPNs."""
import re
from .manual_data import fields_for

Q = r'(?<![\w./-])(\d+(?:[.,]\d+)?)\s*(m?)([AV])\s*(AC|DC)?(?![\w/])'


def extract_description(row):
    category=row.get('category',''); description=row.get('description','')
    if not category.startswith(('relays','switches','protection/fuse')):
        return {}, []
    allowed={f['key'] for f in fields_for(row)}
    values={}; reasons=[]
    def add(key,value):
        if key in allowed:values[key]=value
    configs=set(re.findall(r'\b(?:SPST|SPDT|DPST|DPDT|[3-8]PST|[3-8]PDT)(?:[- ](?:NO|NC))?\b',description,re.I))
    configs={x.upper().replace(' ','-') for x in configs}
    if len(configs)==1:add('contact_configuration',next(iter(configs)))
    # Only labelled coil voltages; "DR-24V: 5V DC" is not a safe inference.
    coil=re.findall(r'(?<![\w./-])(\d+(?:[.,]\d+)?)\s*V\s*(?:DC\s*)?coil\b',description,re.I)
    if len(set(coil))==1:add('coil_voltage',float(coil[0].replace(',','.')))
    text=re.sub(r'(?<![\w./-])\d+(?:[.,]\d+)?\s*V\s*(?:DC\s*)?coil\b[^,;]*','',description,flags=re.I)
    # Mixed, conditional, switching/withstand/isolation and pulse ratings need
    # richer fields or review. Do not pick the largest number as a rating.
    if re.search(r'[/@]|\bat\b|\b(?:coils?|isolation|dielectric|withstand|surge|pulse|peak|switching|input|output|ift|itm)\b|opto[- ]triac',text,re.I):
        reasons.append('Conditional or ambiguous electrical ratings retained in description')
        return values,reasons
    quantities=list(re.finditer(Q,text))
    for unit,key in [('A','rated_current' if category.startswith('protection/fuse') else 'contact_current'),('V','rated_voltage' if category.startswith('protection/fuse') else 'contact_voltage')]:
        if unit=='V' and category.startswith('relays') and not coil and not re.search(r'contact.*voltage|voltage.*contact|solid.?state|photo.?relay',description,re.I):
            reasons.append('Unlabelled relay voltage may be coil voltage')
            continue
        matches=[m for m in quantities if m[3].upper()==unit]
        numbers={float(m[1].replace(',','.'))*(.001 if m[2] else 1) for m in matches}
        if len(numbers)==1:add(key,next(iter(numbers)))
        elif len(numbers)>1:reasons.append('Multiple '+unit+' ratings retained in description')
    types={m[4].upper() for m in quantities if m[3].upper()=='V' and m[4]}
    if len(types)==1 and ('contact_voltage' in values or 'rated_voltage' in values):add('voltage_type',next(iter(types)))
    # Thermal trip temperature is not operating temperature: leave it untouched.
    return values,reasons
