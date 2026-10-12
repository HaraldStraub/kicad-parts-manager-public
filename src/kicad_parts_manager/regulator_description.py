"""Source-labelled reference/regulator facts; ambiguous input/output stays open."""
import re
from kicad_parts_manager.manual_data import fields_for
PREFIXES=('integrated/analog/voltage_reference','integrated/power_ic/linear_regulator','integrated/power_ic/switch_regulator','modules/dcdc')
N=r'([-+]?\d+(?:[.,]\d+)?)'
BOUND=r'(?<![\w./+-])'
SEP=r'\s*(?:\.\.|[-–~]|to)\s*'
SCALE={'':1,'m':1e-3,'u':1e-6,'µ':1e-6,'μ':1e-6,'k':1e3,'K':1e3,'M':1e6}

def extract_description(row):
    category=row.get('category','');original=row.get('description','')
    if not category.startswith(PREFIXES):return {},[]
    # Normalize the unambiguous attached labels 20VIN / 0.6..21.6Vout.
    text=re.sub(r'(?<=\d)V(in|out)\b',lambda m:'V V'+m[1].lower(),original,flags=re.I)
    allowed={f['key'] for f in fields_for(row)};values={};reasons=[];disputed=set();input_spans=[]
    def add(key,value):
        if key not in allowed or key in disputed:return
        if key in values and values[key]!=value:
            values.pop(key);disputed.add(key);reasons.append('Conflicting description values: '+key)
        else:values[key]=value
    def labelled(key,label,unit):
        q=N+r'\s*([muµμkKM]?)'+unit+r'(?![\w/])'
        label='(?:'+label+')'
        for pattern in [BOUND+label+r'\s*[:=]?\s*'+q,BOUND+q+r'\s*'+label+r'(?!\w)']:
            for m in re.finditer(pattern,text,re.I):
                prefix=m[2]
                if prefix in SCALE:add(key,float(m[1].replace(',','.'))*SCALE[prefix])
    def voltage_ranges(label,lo_key,hi_key):
        q=N+r'\s*V?'+SEP+N+r'\s*V\b'
        label='(?:'+label+')'
        found=False
        for pattern in [BOUND+label+r'\s*[:=]?\s*'+q,BOUND+q+r'\s*'+label+r'(?!\w)']:
            for m in re.finditer(pattern,text,re.I):
                lo,hi=[float(v.replace(',','.')) for v in m.groups()]
                if lo>hi:lo,hi=hi,lo
                add(lo_key,lo);add(hi_key,hi);found=True
                if lo_key in ('input_voltage_min','dc_input_voltage_min','supply_min_description'):input_spans.append(m.span())
        return found
    # Misclassified multifunction ICs must not acquire regulator ratings.
    if re.search(r'\bDAC\b|gate driver|current shunt monitor|mixed.signal matrix|relay driver',text,re.I):
        return {},['Description is not a standalone reference/regulator']
    reference=category.endswith('/voltage_reference')
    module=category=='modules/dcdc'
    linear=category.endswith('/linear_regulator')
    input_lo,input_hi=('supply_min_description','supply_max_description') if reference else ('dc_input_voltage_min','dc_input_voltage_max') if module else ('input_voltage_min','input_voltage_max')
    voltage_ranges(r'Vin|input(?:\s+(?:supply\s+)?voltage)?|operating supply voltage',input_lo,input_hi)
    if reference:
        if not re.search(r'\breference\b',text,re.I):return {},['No explicit voltage-reference description']
        labelled('reference_voltage',r'Vref|reference voltage|voltage reference|(?:fixed\s+)?output voltage','V')
        # One voltage in a reference summary is its nominal reference voltage;
        # input ranges, dropout and multiple voltages make this ambiguous.
        remaining=text
        for start,end in sorted(input_spans,reverse=True):remaining=remaining[:start]+' '*(end-start)+remaining[end:]
        volts=re.findall(BOUND+N+r'\s*V\b',remaining,re.I)
        if len(volts)==1 and not re.search(r'Vin|input|supply|dropout|adjustable|maximum|minimum',remaining,re.I):
            add('reference_voltage',float(volts[0].replace(',','.')))
        percents=re.findall(BOUND+r'±?'+N+r'\s*%',text)
        if len(percents)==1 and re.search(r'toleran|accuracy|precision|reference',text,re.I):
            add('initial_tolerance',abs(float(percents[0].replace(',','.'))))
        if re.search(r'\bshunt\b',text,re.I):add('reference_type','Shunt')
        elif re.search(r'\bseries\b',text,re.I):add('reference_type','Series')
        labelled('output_current',r'output current|Iout','A')
    else:
        multiple_outputs=bool(re.search(r'\bdual\b|\bquad\b|\btriple\b|\btwo\b|multi.output|split.rail|positive and negative|\bor\b|±\s*\d+(?:[.,]\d+)?\s*V\b',text,re.I))
        output_range=voltage_ranges(r'Vout|(?:adjustable\s+)?output(?:\s+voltage)?','output_voltage_min','output_voltage_max')
        if not output_range:
            labelled('output_voltage',r'Vout|(?:fixed\s+(?:positive\s+|negative\s+)?)?output(?:\s+voltage)?(?!\s*(?:drop|loss|ripple))','V')
            # Fixed 3.3V / 3.3V fixed output; never a voltage simply near "LDO".
            for pattern in [BOUND+r'fixed\s+'+N+r'\s*V\b',BOUND+N+r'\s*V\s+fixed(?:\s+positive|\s+negative)?\s+output\b']:
                for m in re.finditer(pattern,text,re.I):add('output_voltage',float(m[1].replace(',','.')))
        adjustable=bool(re.search(r'\badjustable\b',text,re.I))
        if adjustable:add('output_mode','Einstellbar')
        elif re.search(r'\bfixed\b',text,re.I):add('output_mode','Fest')
        if adjustable and 'output_voltage' in values:
            values.pop('output_voltage');reasons.append('Adjustable/fixed output ambiguity')
        upper_output=re.search(r'\bup to\s*'+N+r'\s*V\s+(?:output|Vout)\b',text,re.I)
        if upper_output:
            values.pop('output_voltage',None)
            add('output_voltage_max',float(upper_output[1].replace(',','.')))
        labelled('output_current',r'(?:max(?:imum)?\s+)?output current(?:\s+up to)?|Iout|output','A')
        if linear and not re.search(r'quiescent|\bIQ\b|input current|gate|\bat\b|@|peak|pulse',text,re.I):
            currents=re.findall(BOUND+N+r'\s*([muµμ]?)A\b',text,re.I)
            if len(currents)==1:add('output_current',abs(float(currents[0][0].replace(',','.')))*SCALE[currents[0][1]])
        labelled('switch_current_limit',r'switch current(?:\s+limit)?|current limit of switch','A')
        labelled('output_power',r'output power|output','W')
        if module and re.search(r'\bconverter\b',text,re.I):
            watts=re.findall(BOUND+N+r'\s*W\b',text)
            if len(watts)==1 and not re.search(r'loss|dissipat|input power',text,re.I):add('output_power',float(watts[0].replace(',','.')))
        if multiple_outputs:
            for key in ('output_voltage','output_voltage_min','output_voltage_max','output_current','output_mode'):values.pop(key,None)
            reasons.append('Multiple/alternative outputs need separate channel data')
        elif output_range and re.search(r'\bfixed\b',text,re.I) and not adjustable:
            values.pop('output_voltage_min',None);values.pop('output_voltage_max',None)
            reasons.append('Fixed-output family range is not an adjustable output range')
    return values,reasons
