"""Explicit description facts for transistors and optoelectronics, unverified."""
import re
from kicad_parts_manager.manual_data import fields_for

PREFIXES=('semiconductor/transistor/bjt','semiconductor/transistor/igbt','opto/led','opto/optocoupler')
NUMBER=r'([-+]?\d+(?:[.,]\d+)?)'
SCALE={'':1,'m':1e-3,'u':1e-6,'µ':1e-6,'μ':1e-6,'n':1e-9,'p':1e-12,'k':1e3,'K':1e3,'M':1e6,'G':1e9}


def extract_description(row):
    category=row.get('category','');text=row.get('description','')
    if not category.startswith(PREFIXES):return {},[]
    allowed={f['key'] for f in fields_for(row)}
    values={};reasons=[];disputed=set()
    def add(key,value):
        if key not in allowed or key in disputed:return
        if key in values and values[key]!=value:
            values.pop(key);disputed.add(key);reasons.append('Conflicting description values: '+key)
        else:values[key]=value
    def quantity(key,unit,label=None,absolute=False):
        q=NUMBER+r'\s*([munpµμkKMG]?)'+unit+r'(?![\w/])'
        patterns=[r'(?<![\w./-])'+q]
        if label:
            label='(?:'+label+')'
            patterns=[r'(?<![\w.])'+label+r'\s*[:=]?\s*'+q,
                      r'(?<![\w./-])'+NUMBER+r'\s*([munpµμkKMG]?)'+unit+r'\s*'+label+r'(?!\w)']
        for pattern in patterns:
            for m in re.finditer(pattern,text,re.I):
                prefix=m[2]
                if prefix not in SCALE or unit=='W' and prefix in ('M','G'):continue
                value=float(m[1].replace(',','.'))*SCALE[prefix]
                if absolute:value=abs(value)
                if value<0:continue
                add(key,value)
    bjt=category.startswith('semiconductor/transistor/bjt')
    igbt=category.startswith('semiconductor/transistor/igbt')
    measured=bool(re.search(r'\bat\b|\btest\b|@|\bpuls(?:e|ed)\b|\bpeak\b',text,re.I))
    if bjt:
        polarities=set(re.findall(r'(?<![A-Za-z])(?:NPN|PNP)(?![A-Za-z])',text.upper()))
        if len(polarities)==1:add('polarity',next(iter(polarities)))
        if not measured:
            quantity('vce_description','V',r'VCEO|Vce',absolute=True)
            for m in re.finditer(r'(?<![\w./-])'+NUMBER+r'\s*Vce(?:o)?\b',text,re.I):
                add('vce_description',abs(float(m[1].replace(',','.'))))
            quantity('ic_description','A',r'Ic',absolute=True)
            # Distributor BJT summaries give bare voltage/current for one type;
            # mixed complementary arrays and IC drivers need separate review.
            if len(polarities)==1 and re.search(r'\bTRANS\b',text,re.I) and not re.search(r'\bIC\b',text):
                quantity('vce_description','V',absolute=True)
                quantity('ic_description','A',absolute=True)
            if not re.search(r'\bIb\b|\bbase current\b',text,re.I) and not re.search(r'Unijunction',text,re.I):
                quantity('ic_description','A',absolute=True)
            quantity('power_dissipation','W')
        # A lone RF frequency is NOT necessarily transition frequency.
        quantity('transition_frequency','Hz',r'fT|transition frequency')
        match=re.search(r'\bhfe\s*[:=]\s*'+NUMBER+r'(?!\d|[.,]\d)',text,re.I)
        if match and not re.match(r'\s*[-–/]',text[match.end():]):add('gain_description',float(match[1].replace(',','.')))
    if igbt and not measured:
        quantity('vces_max','V',r'VCES|Vce',absolute=True)
        quantity('collector_current','A',r'Ic',absolute=True)
        if re.search(r'\bIGBT\b',text,re.I):
            quantity('vces_max','V',absolute=True);quantity('collector_current','A',absolute=True)
    if category.startswith('opto/led'):
        if re.search(r'\bRGB\b|\bRVB\b',text,re.I):add('led_color','RGB')
        else:
            colors=[color for color in ['red','green','blue','yellow','orange','amber','white','pink','turquoise','purple','infrared'] if re.search(r'\b'+color+r'\b',text,re.I)]
            if re.search(r'\bIR[- ]LED\b|\bIR LED\b',text,re.I) and 'infrared' not in colors:colors.append('infrared')
            if len(colors)==1:
                canonical={'red':'Rot','green':'Grün','blue':'Blau','yellow':'Gelb','orange':'Orange','white':'Weiß','infrared':'IR'}
                add('led_color',canonical.get(colors[0],colors[0].capitalize()))
            elif len(colors)>1:reasons.append('Multiple LED colors; no single-color assignment')
        quantity('wavelength','m',r'wavelength')
        # Explicit nm is wavelength, not a package dimension in mm.
        for m in re.finditer(r'(?<![\w./-])'+NUMBER+r'\s*nm\b',text,re.I):add('wavelength',float(m[1].replace(',','.'))*1e-9)
        if not measured and not re.search(r'\bVF\b',text,re.I):
            quantity('forward_current','A',r'IF|forward current')
        quantity('vf_typ','V',r'VF|forward voltage')
    if category.startswith('opto/optocoupler') and not re.search(r'no[- ]opto',text,re.I):
        quantity('isolation_voltage','V',r'Viso|isolation voltage')
        if re.search(r'\bOPTOISO\w*\b',text,re.I):quantity('isolation_voltage','V')
        if not measured and not re.search(r'\bCTR\b|\bVF\b',text,re.I):
            quantity('forward_current','A',r'IF|forward current')
        quantity('vf_typ','V',r'VF|forward voltage')
        # Generic gate-driver / thyristor descriptions have no matching output
        # profile yet; do not put their output amperes into LED input current.
        if category.endswith('/transistor'):
            quantity('vce_max','V',r'VCEO|Vce',absolute=True)
            quantity('collector_current','A',r'Ic',absolute=True)
            match=re.search(r'\bCTR\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*%',text,re.I)
            if match:
                lo,hi=[float(x.replace(',','.')) for x in match.groups()]
                if lo<=hi:add('ctr_min',lo);add('ctr_max',hi)
            elif re.search(r'\bCTR\b',text,re.I):reasons.append('CTR without explicit range; minimum/maximum not inferred')
    return values,reasons
