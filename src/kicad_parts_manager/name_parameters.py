"""Only explicit, delimited passive ratings; never decode bare manufacturer numbers."""
import re

def name_parameters(row):
    category=row.get('category','')
    family=next((f for f in ('resistor','capacitor','inductor') if '/'+f in category),None)
    if not family or category.startswith('simulation/'):return {},''
    reference=row.get('kicad_reference') or row.get('name','')
    name=reference.rsplit('/',1)[-1]
    tokens=re.split(r'[_\s;]+',name)
    candidates={}
    def add(key,value):candidates.setdefault(key,set()).add(value)
    prefixes={'p':1e-12,'n':1e-9,'u':1e-6,'µ':1e-6,'m':1e-3,'':1,'k':1e3,'K':1e3,'M':1e6}
    for token in tokens:
        for key,pattern in [('tolerance_description',r'(\d+(?:\.\d+)?)%'),('power_description',r'(\d+(?:\.\d+)?)(m?)W'),('temperature_coefficient',r'(\d+(?:\.\d+)?)PPM')]:
            m=re.fullmatch(pattern,token)
            if m:add(key,float(m[1])*(.001 if key=='power_description' and m[2]=='m' else 1))
        if family=='resistor':
            m=re.fullmatch(r'(\d+(?:\.\d+)?)([RkKM])(?:Ω|R)?',token)
            embedded=re.fullmatch(r'(\d+)([RkKM])(\d+)',token)
            if m:add('resistance',float(m[1])*(1 if m[2]=='R' else prefixes[m[2]]))
            if embedded:add('resistance',float(embedded[1]+'.'+embedded[3])*(1 if embedded[2]=='R' else prefixes[embedded[2]]))
        else:
            unit='F' if family=='capacitor' else 'H';key='capacitance' if family=='capacitor' else 'inductance'
            m=re.fullmatch(r'(\d+(?:\.\d+)?)([pnuµmPNU]?)'+unit,token)
            if m:add(key,float(m[1])*prefixes[m[2].lower()])
            if re.fullmatch(r'(?:CC|C|L)\d{4}',tokens[0]):
                m=re.fullmatch(r'(\d+(?:\.\d+)?)([PNU])',token)
                if m:add(key,float(m[1])*prefixes[m[2].lower()])
            if family=='capacitor':
                m=re.fullmatch(r'(\d+(?:\.\d+)?)V',token)
                if m:add('voltage_description',float(m[1]))
    return {key:next(iter(values)) for key,values in candidates.items() if len(values)==1},reference
