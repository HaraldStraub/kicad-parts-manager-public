"""Explicit passive description quantities with conservative ambiguity handling."""
import re
from .manual_data import fields_for


def extract_description(row):
    category=row.get('category',''); text=row.get('description','')
    family=next((s for s in ('resistor','capacitor','inductor') if '/'+s in category),None)
    if not family or category.startswith('simulation/'):return {},[]
    if re.search(r'[/@]|\bat\b|\b(?:surge|pulse|peak|impedance|ferrite|transformer|variable)\b',text,re.I):
        return {},['Conditional or non-single passive quantity']
    allowed={f['key'] for f in fields_for(row)}; values={};reasons=[]
    scale={'':1,'p':1e-12,'n':1e-9,'u':1e-6,'µ':1e-6,'μ':1e-6,'m':1e-3,'k':1e3,'M':1e6}
    def take(key,unit,label=''):
        prefix=r'(?<![\w./+-])'+(r'(?:'+label+r')\s*[:=]?\s*' if label else '')
        matches=re.findall(prefix+r'(\d+(?:[.,]\d+)?)\s*([pnuµμmkMK]?)\s*'+unit+r'(?![\w/])',text)
        # Distributor uppercase MH may mean mH; never treat it as megahenry.
        if unit=='H' and any(p=='M' for _,p in matches):
            reasons.append('Ambiguous uppercase MH retained in description')
            return
        numbers={float(n.replace(',','.'))*scale['k' if p=='K' else p] for n,p in matches}
        if len(numbers)==1 and key in allowed:values[key]=next(iter(numbers))
        elif len(numbers)>1:reasons.append('Multiple description values: '+key)
    if family=='resistor':
        take('resistance',r'(?:Ω|[Oo]hm|OHM)');take('power_description','W')
    elif family=='capacitor':
        take('capacitance','F');take('voltage_description','V')
    else:
        take('inductance','H');take('dcr_description',r'(?:Ω|[Oo]hm)',r'DCR|DC resistance')
        take('saturation_current','A',r'Isat|saturation current')
        take('current_description','A',r'Irms|rated current')
    take('tolerance_description','%')
    return values,reasons
