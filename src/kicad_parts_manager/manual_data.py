"""Persistent local metadata overrides, separate from imported KiCad libraries."""
import copy
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sqlite3
from kicad_parts_manager.api_errors import ApiError
from urllib.parse import urlsplit

# factor converts the stored catalog value into the displayed unit.
# Shared with the browser: JSON payload in a JavaScript export.
_PROFILE_TEXT = (Path(__file__).parent/'web/parameter-profiles.js').read_text(encoding='utf-8')
FIELDS = json.loads(_PROFILE_TEXT.removeprefix('export default ').strip().removesuffix(';'))


def fields_for(component):
    parts=component.get('category','').split('/')
    for n in range(len(parts),0,-1):
        key='/'.join(parts[:n])
        if key in FIELDS:break
    else:
        key=next((f for f in ['ferrite','emc_filter','rf_filter','filter','tvs','zener','mosfet','bjt','fet','diode','resistor','capacitor','inductor','connectors','integrated'] if f in parts),'general')
    definitions=FIELDS[key]+FIELDS.get('__common',[])
    return [dict(key=f[0],label=f[1],unit=f[2],factor=f[3],**(f[4] if len(f)>4 else {})) for f in definitions]


def component_key(component):
    if component.get('local_data_key'):return component['local_data_key']
    if component.get('import_key'):return 'import:'+component['import_key']
    if component['id'].startswith('CMP-'):return component['id']
    if component.get('kind')=='footprint':return 'footprint:'+component['footprint']
    return 'symbol:'+component['symbol']


def short_text(value,limit,label):
    if not isinstance(value,str) or len(value)>limit:raise ValueError(label+' ist zu lang oder ungültig.')
    return value.strip()


class ManualData:
    def __init__(self,path):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        with self.connect() as db:
            db.executescript("""CREATE TABLE IF NOT EXISTS overrides
                (component TEXT PRIMARY KEY, revision INTEGER NOT NULL, data TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS history
                (component TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL,
                 PRIMARY KEY(component,revision));
                CREATE TABLE IF NOT EXISTS category_overrides
                (component TEXT PRIMARY KEY,revision INTEGER NOT NULL,category TEXT,updated_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS category_history
                (component TEXT NOT NULL,revision INTEGER NOT NULL,previous_category TEXT,category TEXT,updated_at TEXT NOT NULL,
                 PRIMARY KEY(component,revision));""")

    def connect(self):
        return sqlite3.connect(self.path,timeout=30)

    def get(self,key):
        with self.connect() as db:row=db.execute('SELECT revision,data FROM overrides WHERE component=?',(key,)).fetchone()
        return dict(revision=row[0],**json.loads(row[1])) if row else dict(revision=0,values={})

    def history(self,key):
        with self.connect() as db:rows=db.execute('SELECT revision,updated_at,data FROM history WHERE component=? ORDER BY revision DESC',(key,)).fetchall()
        return [dict(revision=r,updated_at=t,data=json.loads(data)) for r,t,data in rows]

    def save(self,component,request):
        key=component_key(component)
        fields={f['key']:f for f in fields_for(component)}
        changes=request.get('values',{})
        if not isinstance(changes,dict) or not set(changes).issubset(fields):raise ValueError('Unbekannter elektrischer Parameter.')
        cleaned={}
        for name,entry in changes.items():
            if entry is None:cleaned[name]=None;continue
            if not isinstance(entry,dict):raise ValueError('Ungültiger Kennwert.')
            value=entry.get('value')
            is_text=fields[name].get('type')=='text'
            if is_text:
                value=short_text(value,1000,'Merkmal')
                if not value:raise ValueError('Merkmal darf nicht leer sein.')
            elif isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value):raise ValueError('Kennwerte müssen endliche Zahlen sein.')
            if not is_text and value<0 and fields[name]['unit'] not in ('°C','dBm','dBV/Pa','dBi') and name not in ('rds_on_vgs','supply_min_description','supply_max_description','vgs_off','measurement_min','measurement_max','gain_db','operating_temp_min','operating_temp_max','input_voltage_min','input_voltage_max','output_voltage','output_voltage_min','output_voltage_max','vgs_off_min','vgs_off_max','reference_voltage','reference_voltage_min','reference_voltage_max','input_range_min','input_range_max','signal_output_min','signal_output_max','signal_voltage_min','signal_voltage_max','offset_voltage'):raise ValueError('Diese Grenzwerte und Beträge dürfen nicht negativ sein.')
            if not is_text and name in ('pins_description','channels','steps','cell_count','resolution_bits','io_count','logic_elements','memory_bits','flash_bytes','ram_bytes','display_rows','display_columns') and (value<1 or value!=int(value)):raise ValueError('Anzahl muss eine positive ganze Zahl sein.')
            source=short_text(entry.get('source',''),2000,'Quelle')
            if not source:raise ValueError('Bitte eine Quelle für jeden geänderten Kennwert angeben.')
            conditions=short_text(entry.get('conditions',''),2000,'Messbedingungen')
            unit=fields[name]['unit']
            canonical={'mΩ':'Ω','µF':'F','mH':'H','µH':'H','nC':'C','ns':'s','MHz':'Hz','GHz':'Hz','kHz':'Hz','mA':'A','µA':'A','nA':'A','mV':'V','µs':'s','ms':'s','nm':'m','pF':'F','mW':'W','mcd':'cd','KiB':'byte','Kibit':'bit','Mbit/s':'bit/s','MS/s':'S/s','V/µs':'V/s','µV':'V','pC':'C','µW':'W','ps':'s','mm':'m'}.get(unit,unit)
            if unit=='mm' and fields[name]['factor']==1:canonical='mm'
            cleaned[name]=dict(value=value,unit=canonical,source=source,conditions=conditions,status='UNVERIFIED')
            if 'source_details' in entry:
                details=entry['source_details']
                allowed={'publisher','mpn','package','document','revision','page','url','sha256','accessed_on','candidate_id'}
                if not isinstance(details,dict) or not set(details).issubset(allowed):raise ValueError('Ungültige Quellenangaben.')
                cleaned[name]['source_details']={k:short_text(v,2000,'Quellenangabe') for k,v in details.items()}
            if 'kind' in entry:
                if entry['kind'] not in ('unspecified','nominal','typical','minimum','maximum','absolute_maximum'):raise ValueError('Unbekannte Kennwertart.')
                cleaned[name]['kind']=entry['kind']
            if 'conditions_data' in entry:
                allowed={f['key']:f for f in fields[name].get('conditions',[])}
                measured=entry['conditions_data']
                if not isinstance(measured,dict) or not set(measured).issubset(allowed):raise ValueError('Unbekannte Messbedingung.')
                checked={}
                for condition,number in measured.items():
                    if allowed[condition].get('type')=='text':
                        text=short_text(number,200,'Messbedingung')
                        if not text or allowed[condition].get('options') and text not in allowed[condition]['options']:raise ValueError('Unbekannter Temperaturbezug.')
                        checked[condition]=text
                        continue
                    if isinstance(number,bool) or not isinstance(number,(int,float)) or not math.isfinite(number):raise ValueError('Messbedingungen müssen endliche Zahlen sein.')
                    if allowed[condition]['unit'] not in ('°C','V','A') and number<0:raise ValueError('Messbedingung darf nicht negativ sein.')
                    checked[condition]=number
                cleaned[name]['conditions_data']=checked

        datasheet=request.get('datasheet')
        if 'datasheet' in request and datasheet is not None:
            datasheet=short_text(datasheet,2000,'Datenblattlink')
            if datasheet:
                parsed=urlsplit(datasheet)
                if parsed.scheme not in ('http','https') or not parsed.hostname or parsed.username or parsed.password:
                    raise ValueError('Bitte einen gültigen HTTP-/HTTPS-Datenblattlink ohne Zugangsdaten eingeben.')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute('SELECT revision,data FROM overrides WHERE component=?',(key,)).fetchone()
            revision=row[0] if row else 0
            if type(request.get('revision')) is not int or request['revision']!=revision:
                raise ApiError('stale_data','Die Daten wurden zwischenzeitlich geändert. Fenster schließen und erneut öffnen.')
            data=json.loads(row[1]) if row else dict(values={})
            before=copy.deepcopy(data)
            for name,entry in cleaned.items():
                if entry is None:data['values'].pop(name,None)
                else:
                    existing=data['values'].get(name,{})
                    if {k:v for k,v in existing.items() if k!='updated_at'}==entry:entry=existing
                    data['values'][name]=entry
            if 'datasheet' in request:
                if datasheet is None:data.pop('datasheet',None)
                else:data['datasheet']=dict(url=datasheet,source=short_text(request.get('datasheet_source','Manuell ergänzt'),2000,'Datenblattquelle'),status='UNVERIFIED')
            if 'manufacturer' in request:
                if request['manufacturer'] is None:data.pop('manufacturer',None)
                else:
                    manufacturer=short_text(request['manufacturer'],200,'Hersteller')
                    source=short_text(request.get('manufacturer_source',''),2000,'Herstellerquelle')
                    if not manufacturer or not source:raise ValueError('Hersteller und Quelle angeben.')
                    data['manufacturer']=dict(value=manufacturer,source=source,status='UNVERIFIED')
            minimum=data['values'].get('supply_min_description',{}).get('value',component.get('values',{}).get('supply_min_description'))
            maximum=data['values'].get('supply_max_description',{}).get('value',component.get('values',{}).get('supply_max_description'))
            if minimum is not None and maximum is not None and minimum>maximum:raise ValueError('Versorgung min. darf nicht größer als Versorgung max. sein.')
            merged=dict(component.get('values',{}))
            merged.update({k:v['value'] for k,v in data['values'].items()})
            for value_key,frequency_key in [('impedance','impedance_frequency'),('insertion_loss','loss_frequency')]:
                if value_key in fields and merged.get(value_key) is not None:
                    if not merged.get(frequency_key) or merged[frequency_key]<=0:
                        raise ValueError('Bitte eine positive Bezugsfrequenz zum Kennwert angeben.')
                    if value_key=='insertion_loss' and not data['values'].get(value_key,{}).get('conditions') and not {'source_impedance','load_impedance'}.issubset(data['values'].get(value_key,{}).get('conditions_data',{})):
                        raise ValueError('Einfügedämpfung benötigt Messbedingungen mit Quell-/Lastimpedanz und Messschaltung.')
            for lower,upper in [('supply_min_description','supply_max_description'),('reference_voltage_min','reference_voltage_max'),('shunt_current_min','shunt_current_max'),('zener_voltage_min','zener_voltage_max'),('hfe_min','hfe_max'),('gate_threshold_min','gate_threshold_max'),('measurement_min','measurement_max'),('frequency_min','frequency_max'),('supply_a_min','supply_a_max'),('supply_b_min','supply_b_max'),('operating_temp_min','operating_temp_max'),('input_voltage_min','input_voltage_max'),('output_voltage_min','output_voltage_max'),('ac_input_voltage_min','ac_input_voltage_max'),('dc_input_voltage_min','dc_input_voltage_max'),('output_supply_min','output_supply_max'),('ctr_min','ctr_max'),('idss_min','idss_max'),('vgs_off_min','vgs_off_max'),('compliance_voltage_min','compliance_voltage_max'),('motor_voltage_min','motor_voltage_max')]:
                if lower in fields and merged.get(lower) is not None and merged.get(upper) is not None and merged[lower]>merged[upper]:
                    raise ValueError('Der untere Bereichswert darf nicht größer als der obere sein.')
            if data==before:return dict(revision=revision,**data)
            now=datetime.now(timezone.utc).isoformat()
            for name in cleaned:
                if name in data['values']:data['values'][name]['updated_at']=now
            if 'datasheet' in request and datasheet is not None:data['datasheet']['updated_at']=now
            if 'manufacturer' in request and request['manufacturer'] is not None:data['manufacturer']['updated_at']=now
            data['updated_at']=now
            payload=json.dumps(data,ensure_ascii=False,allow_nan=False)
            db.execute('INSERT OR REPLACE INTO overrides VALUES (?,?,?)',(key,revision+1,payload))
            db.execute('INSERT INTO history VALUES (?,?,?,?)',(key,revision+1,now,payload))
        return dict(revision=revision+1,**data)

    @staticmethod
    def apply(component,override):
        result=dict(component)
        result['values']=dict(component.get('values',{}))
        for key,entry in override.get('values',{}).items():result['values'][key]=entry['value']
        if 'datasheet' in override:result['datasheet']=override['datasheet']['url']
        if 'manufacturer' in override:result['manufacturer']=override['manufacturer']['value']
        result['manual_data']=override
        return result

    def apply_catalog(self,rows):
        with self.connect() as db:
            overrides={k:dict(revision=r,**json.loads(d)) for k,r,d in db.execute('SELECT component,revision,data FROM overrides')}
            categories={k:(r,c) for k,r,c in db.execute('SELECT component,revision,category FROM category_overrides')}
        result=[]
        for row in rows:
            key=component_key(row)
            item=self.apply(row,overrides[key]) if key in overrides else row
            if key in categories:
                revision,category=categories[key];item=dict(item)
                item['automatic_category']=row.get('automatic_category',row['category'])
                item.update(category_revision=revision,category_override=category)
                if category is not None:item['category']=category
            result.append(item)
        return result
