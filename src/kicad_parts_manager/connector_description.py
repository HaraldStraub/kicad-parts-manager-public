"""Explicit connector pitch and contact counts; no dimensions or MPN decoding."""
import re
from .manual_data import fields_for


def extract_description(row):
    if not row.get('category','').startswith('connectors/'):return {},[]
    text=row.get('description','');allowed={f['key'] for f in fields_for(row)}
    facts={};reasons=[]
    # Pitch is stored in mm by the existing profile (factor 1).
    pitches=re.findall(r'(?i)(?<![\w.+-])(\d+(?:[.,]\d+)?)\s*mm\s*(?:pin\s+)?pitch\b',text)
    pitches+=re.findall(r'(?i)\bpitch\s*[:=]\s*(\d+(?:[.,]\d+)?)\s*mm\b',text)
    if re.search(r'(?i)\b(?:mounting|row|hole|housing)\s+pitch\b',text):
        pitches=[];reasons.append('Other connector pitch axis retained in description')
    quantities={'pitch_description':{float(v.replace(',','.')) for v in pitches}}
    # Explicit counts only, excluding multiport, split/combined and auxiliary contacts.
    if not re.search(r'(?i)\b(?:ports?|shield|switch|auxiliary|combo|combination|connected)\b|\+|/',text):
        counts=re.findall(r'(?i)(?<![\w.+-])(\d+)\s*[- ]?\s*(?:pins?|contacts?)\b',text)
        if re.search(r'(?i)\bgeneric connector\b',text):
            counts += [str(int(a)*int(b)) for a,b in re.findall(r'(?<![\w.])(\d+)x(\d+)(?![\w.])',text)]
        quantities['pins_description']={int(v) for v in counts}
    for key,values in quantities.items():
        if key not in allowed:continue
        if len(values)==1:
            value=next(iter(values))
            if value>0:facts[key]=value
        elif len(values)>1:reasons.append('Multiple connector quantities: '+key)
    return facts,reasons
