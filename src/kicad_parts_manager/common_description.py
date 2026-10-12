"""Explicit operating temperature ranges and single timing frequencies."""
import re
from .manual_data import fields_for


def extract_description(row):
    text=row.get('description',''); category=row.get('category','')
    allowed={f['key'] for f in fields_for(row)};facts={}; reasons=[]
    # Require an operating-temperature label; storage, solder and trip
    # temperatures are not operating limits. Preserve distinct ranges.
    temp=re.findall(r'(?i)(?:operating temperature|operating temp\.?|Betriebstemperatur)\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)\s*°?C?\s*(?:to|bis|\.\.|–|-)\s*([+-]?\d+(?:[.,]\d+)?)\s*°C\b',text)
    ranges={(float(a.replace(',','.')),float(b.replace(',','.'))) for a,b in temp}
    if len(ranges)==1:
        lo,hi=next(iter(ranges))
        if lo<=hi:
            facts.update(operating_temp_min=lo,operating_temp_max=hi)
    elif len(ranges)>1:reasons.append('Multiple operating-temperature ranges retained')
    if category.startswith('timing_parts/') and not re.search(r'[/@]|\d+(?:[.,]\d+)?\s*(?:[kMG]?Hz)?\s*(?:-|–|to|\.\.|~)\s*\d+(?:[.,]\d+)?\s*[kMG]?Hz\b|(?:[kMG]?Hz)\s*(?:-|–|to|\.\.|~)|\d\s*(?:,\s+|&|\bor\b)\s*\d',text):
        matches=re.findall(r'(?<![\w./-])(\d+(?:[.,]\d+)?)\s*([kMG]?)Hz\b',text)
        frequencies={float(n.replace(',','.'))*{'':1,'k':1e3,'M':1e6,'G':1e9}[p] for n,p in matches}
        if len(frequencies)==1:facts['frequency']=next(iter(frequencies))
        elif len(frequencies)>1:reasons.append('Multiple frequencies retained')
    return {k:v for k,v in facts.items() if k in allowed},reasons
