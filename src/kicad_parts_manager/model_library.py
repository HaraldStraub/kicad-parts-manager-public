"""Local model index and explicit symbol assignments, independent of vendor libraries."""
import hashlib
import json
import re
import sqlite3
import subprocess
from pathlib import Path
from urllib.parse import quote
from kicad_parts_manager.validation.runner import find_ngspice
from kicad_parts_manager.kicad.inventory import parse, children, field

TOKEN = r'[A-Za-z0-9_.$:+-]+'
KINDS = {'D': ('D', ['A','K']), 'NPN': ('Q',['C','B','E']), 'PNP': ('Q',['C','B','E']),
         'NMOS': ('M',['D','G','S','B']), 'PMOS': ('M',['D','G','S','B']),
         'NJF': ('J',['D','G','S']), 'PJF': ('J',['D','G','S'])}


def definitions(text):
    """Index top-level models; internal transistor models are not part candidates."""
    lines = []
    for line in text.splitlines():
        if line.lstrip().startswith('+') and lines:
            lines[-1] += ' ' + line.lstrip()[1:]
        elif line.strip() and not line.lstrip().startswith('*'):
            lines.append(line.strip())
    depth = 0
    for line in lines:
        match = re.match(r'\.(model|subckt)\s+('+TOKEN+r')\s+(.+)', line, re.I)
        if match and depth == 0:
            directive, name, rest = match.groups()
            if directive.lower() == 'subckt':
                pins = re.split(r'\s+(?:params:|\w+=)', rest, maxsplit=1, flags=re.I)[0].split()
                if pins and all(re.fullmatch(TOKEN,p) for p in pins):
                    yield dict(name=name, type='X', spice_kind='SUBCKT', pins=pins)
            else:
                kind = re.split(r'[\s(]', rest)[0].upper()
                if kind in KINDS:
                    type_, pins = KINDS[kind]
                    yield dict(name=name,type=type_,spice_kind=kind,pins=pins)
        if re.match(r'\.subckt\b', line,re.I): depth += 1
        if re.match(r'\.ends\b', line,re.I): depth = max(0,depth-1)


def symbol_pin_role(pin, aliases):
    """Prefer explicit names; semantic pin identifiers only fill unnamed pins."""
    name=str(pin.get('name','')).strip().upper()
    if name and name!='~':return aliases.get(name)
    return aliases.get(str(pin.get('number','')).strip().upper())


def check_pin_mapping(model, numbers, symbol):
    """Compare explicit terminal names only; never infer unnamed pin roles."""
    if len(numbers)!=len(model['pins']) or any(not re.fullmatch(TOKEN,str(n)) for n in numbers):
        raise ValueError('Bitte alle Modellanschlüsse einem Symbolpin zuordnen.')
    if len(set(numbers))!=len(numbers) and model['type']!='M':
        raise ValueError('Doppelte Symbol-Pinnummer. Pinzuordnung prüfen.')
    if model['type']=='M' and (len(set(numbers[:3]))!=3 or numbers[3] in numbers[:2]):
        raise ValueError('Drain, Gate und Source müssen verschieden sein; Bulk darf an Source liegen.')
    available={p['number']:p for p in symbol}
    if not set(numbers).issubset(available):raise ValueError('Pinzuordnung passt nicht zum ausgewählten Symbol.')
    families={'D':{'A':['A','ANODE'],'K':['K','CATHODE','KATHODE']},
              'Q':{'C':['C','COLLECTOR'],'B':['B','BASE'],'E':['E','EMITTER']},
              'M':{'D':['D','DRAIN'],'G':['G','GATE'],'S':['S','SOURCE'],'B':['B','BULK','BODY']},
              'J':{'D':['D','DRAIN'],'G':['G','GATE'],'S':['S','SOURCE']}}
    aliases={alias:role for role,names in families.get(model['type'],{}).items() for alias in names}
    conflicts=[];unknown=[]
    for role,number in zip(model['pins'],numbers):
        name=available[number].get('name','')
        actual=symbol_pin_role(available[number],aliases)
        if role not in aliases or not actual:unknown.append(str(number));continue
        if actual!=role and not (model['type']=='M' and role=='B' and actual=='S'):
            conflicts.append(f'SIM-Anschluss {role} ist Symbolpin {number} ({name}) zugeordnet. Bitte einen passenden {role}-Anschluss wählen.')
    status='conflict' if conflicts else 'unknown' if unknown else 'checked'
    message=' '.join(conflicts) if conflicts else ('Anschlussfunktionen nicht vollständig erkennbar. Pinbelegung anhand des Symbols oder Datenblatts manuell prüfen.' if unknown else 'Anschlussnamen passen zur Zuordnung. Das bestätigt noch keine elektrische Funktion.')
    return dict(status=status,message=message)


class ModelLibrary:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True,exist_ok=True)
        with self.connect() as db:
            db.executescript('''CREATE TABLE IF NOT EXISTS models
                (id TEXT PRIMARY KEY,name TEXT,type TEXT,spice_kind TEXT,pins TEXT,
                 file TEXT,sha256 TEXT,source TEXT,collection TEXT);
                CREATE TABLE IF NOT EXISTS assignments
                (symbol TEXT PRIMARY KEY,model_id TEXT,pins TEXT,report TEXT);''')

    def connect(self):
        db=sqlite3.connect(self.root/'index.sqlite',timeout=30);db.row_factory=sqlite3.Row;return db

    def import_file(self,path,source,collection):
        path=Path(path).resolve()
        if not path.is_relative_to(self.root): raise ValueError('Modell liegt außerhalb der lokalen Sammlung.')
        raw=path.read_bytes()
        if len(raw)>10_000_000: raise ValueError('Modelldatei zu groß.')
        text=raw.decode('utf-8',errors='replace');digest=hashlib.sha256(raw).hexdigest()
        entries=list(definitions(text))
        with self.connect() as db:
            for entry in entries:
                id_=hashlib.sha256((str(path)+digest+entry['name']).encode()).hexdigest()[:24]
                db.execute('INSERT OR IGNORE INTO models VALUES (?,?,?,?,?,?,?,?,?)',
                    (id_,entry['name'],entry['type'],entry['spice_kind'],json.dumps(entry['pins']),str(path),digest,source,collection))
        return len(entries)

    def import_tree(self,directory,source,collection):
        count=0
        for path in sorted(Path(directory).rglob('*')):
            if path.is_file() and path.suffix.lower() in ('.lib','.mod','.cir','.sp','.spice','.txt') and 'incompatible' not in path.parts:
                count+=self.import_file(path,source,collection)
        return count

    def get(self,id_):
        with self.connect() as db: row=db.execute('SELECT * FROM models WHERE id=?',(id_,)).fetchone()
        if not row: raise ValueError('Modell nicht gefunden.')
        result=dict(row);result['pins']=json.loads(result['pins']);return result

    def search(self,query):
        query=query.strip()[:100]
        with self.connect() as db:
            total=db.execute('SELECT count(*) FROM models').fetchone()[0]
            rows=db.execute('SELECT * FROM models WHERE name LIKE ? ESCAPE "!" ORDER BY lower(name)=lower(?) DESC,name,collection LIMIT 80',
                ('%'+query.replace('!','!!').replace('%','!%').replace('_','!_')+'%',query)).fetchall()
        candidates=[]
        for row in rows:
            c=dict(row);c['pins']=json.loads(c['pins']);c['filename']=Path(c['file']).name;c['exact']=c['name'].lower()==query.lower();c.pop('file');candidates.append(c)
        return dict(total=total,candidates=candidates,
                    vendor_url='https://www.diodes.com/design/tools/spice-models')

    def upload_bundle(self,files,source,progress=None):
        if not files or len(files)>2000:raise ValueError('Bitte 1 bis 2000 Modelldateien auswählen.')
        validated=[]
        for item in files:
            name=item['name'].replace('\\','/')
            if not re.fullmatch(r'[\w ./+-]+',name) or any(p in ('','..','.') for p in name.split('/')) or name.startswith('/'):
                raise ValueError('Ungültiger relativer Modellpfad.')
            validated.append((name,item['content']))
        digest=hashlib.sha256(json.dumps(validated).encode()).hexdigest()
        directory=self.root/'uploads'/digest;directory.mkdir(parents=True,exist_ok=True)
        paths=[]
        for number,(name,content) in enumerate(validated,1):
            path=directory/name
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8');paths.append(path)
            if progress:progress(dict(phase='modelFiles',completed=number,total=len(validated)*2))
        imported=0
        for number,path in enumerate(paths,1):
            imported+=self.import_file(path,source,'Eigene Dateien')
            if progress:progress(dict(phase='modelIndex',completed=len(paths)+number,total=len(paths)*2))
        return imported

    def upload(self,name,content,source='Eigene Datei'):
        if len(content)>10_000_000: raise ValueError('Datei zu groß.')
        digest=hashlib.sha256(content.encode()).hexdigest()
        folder=self.root/'uploads'/digest;folder.mkdir(parents=True,exist_ok=True)
        name=Path(name.replace('\\','/')).name
        if not name or not re.fullmatch(r'[\w .+-]+',name): raise ValueError('Ungültiger Dateiname.')
        path=folder/name;path.write_text(content,encoding='utf-8')
        return self.import_file(path,source,'Eigene Dateien')

    def safe_text(self,model):
        """Resolve dependencies locally and prohibit executable simulator commands."""
        visited=set()
        def read(path):
            path=path.resolve()
            if not path.is_relative_to(self.root) or not path.is_file(): raise ValueError('Abhängige Modelldatei fehlt im lokalen Bestand.')
            if path in visited:return ''
            visited.add(path)
            if len(visited)>40: raise ValueError('Zu viele Abhängigkeiten.')
            raw=path.read_bytes()
            if len(raw)>10_000_000: raise ValueError('Datei zu groß.')
            output=[]
            for line in raw.decode('utf-8',errors='replace').splitlines():
                clean=line.strip()
                if not clean or clean.startswith('*'):output.append(line);continue
                include=re.match(r'\.inc(?:lude)?\s+["\']?([^"\']+?)["\']?\s*$',clean,re.I)
                if include:
                    output.append(read(path.parent/include[1]));continue
                if clean.startswith('.'):
                    command=clean.split()[0].lower()
                    if command=='.end':continue
                    if command not in ('.model','.subckt','.ends','.param','.func','.global'):
                        raise ValueError('Automatischer Test unterstützt diese Direktive nicht: '+command)
                # Simulator output/file commands occur only in prohibited control sections.
                output.append(line)
            return '\n'.join(output)
        path=Path(model['file'])
        if hashlib.sha256(path.read_bytes()).hexdigest()!=model['sha256']:raise ValueError('Modelldatei wurde verändert. Bitte neu importieren.')
        text=read(path)
        # Libraries can contain unrelated example circuits and thousands of models.
        # Export the chosen definition and its transitive model dependencies only.
        blocks={};global_lines=[];lines=text.splitlines();i=0
        while i<len(lines):
            line=lines[i]
            match=re.match(r'\s*\.(model|subckt)\s+('+TOKEN+r')\b',line,re.I)
            if match:
                directive,name=match.groups();block=[line];i+=1
                if directive.lower()=='subckt':
                    depth=1
                    while i<len(lines) and depth:
                        value=lines[i];block.append(value);i+=1
                        if re.match(r'\s*\.subckt\b',value,re.I):depth+=1
                        if re.match(r'\s*\.ends\b',value,re.I):depth-=1
                    if depth:raise ValueError('Unvollständige .SUBCKT-Definition.')
                else:
                    while i<len(lines) and (not lines[i].strip() or lines[i].lstrip().startswith(('+','*'))):
                        block.append(lines[i]);i+=1
                blocks.setdefault(name.lower(),'\n'.join(block));continue
            if re.match(r'\s*\.(param|func|global)\b',line,re.I):global_lines.append(line)
            i+=1
        selected=[];seen=set()
        def add(name):
            if name in seen:return
            if len(seen)>500:raise ValueError('Zu viele Modellabhängigkeiten.')
            seen.add(name)
            block=blocks[name];selected.append(block)
            active='\n'.join(line for line in block.splitlines() if not line.lstrip().startswith('*'))
            for token in re.findall(TOKEN,active.lower()):
                if token in blocks and token not in seen:add(token)
        if model['name'].lower() not in blocks:raise ValueError('Modelldefinition fehlt.')
        add(model['name'].lower())
        comments=[line for line in lines if line.lstrip().startswith('*')]
        return '\n'.join(comments+global_lines+selected)

    def test(self,id_,biases,symbol=None,pins=None,symbol_info=None,symbol_source=None):
        m=self.get(id_)
        mapping=check_pin_mapping(m,pins,symbol_info) if symbol_info is not None else dict(status='unknown',message='Pinzuordnung wurde nicht geprüft.')
        binding=dict(symbol=symbol,pins=pins,symbol_info=symbol_info)
        if symbol_source is not None:binding['symbol_source']=symbol_source
        directory=self.root/'checks'/id_;directory.mkdir(parents=True,exist_ok=True)
        if mapping['status']=='conflict':
            report=dict(ok=False,mapping=mapping,binding=binding,sha256=m['sha256'],log='',note='Berechnung wegen widersprüchlicher Pinzuordnung nicht gestartet.')
            (directory/'report.json').write_text(json.dumps(report,ensure_ascii=False),encoding='utf-8')
            return report
        text=self.safe_text(m)
        if len(biases)!=len(m['pins']):raise ValueError('Prüfspannungen für alle Modellanschlüsse angeben.')
        import math
        values=[]
        for v in biases:
            if v is None:values.append(None)
            else:
                number=float(v)
                if not math.isfinite(number) or abs(number)>1000:raise ValueError('Ungültige Prüfspannung.')
                values.append(number)
        binary=find_ngspice()
        if not binary:raise ValueError('ngspice wurde nicht gefunden.')
        nodes=['p'+str(i+1) for i in range(len(values))]
        circuit=[]
        for i,(node,v) in enumerate(zip(nodes,values)):
            circuit.append(f'Rload{i} {node} 0 1Meg' if v is None else f'Vbias{i} {node} 0 {v:g}')
        circuit.append(m['type']+'dut '+' '.join(nodes)+' '+m['name']+(' W=10u L=1u' if m['type']=='M' else ''))
        deck='kicad-parts-manager compatibility check\n'+text+'\n'+'\n'.join(circuit)+'\n.temp 25\n.control\nop\nprint '+ ' '.join('v('+n+')' for n in nodes)+'\ntran 1n 100n\nprint '+ ' '.join('v('+n+')[100]' for n in nodes)+'\nquit\n.endc\n.end\n'
        directory=self.root/'checks'/id_;directory.mkdir(parents=True,exist_ok=True)
        path=directory/'test.cir';path.write_text(deck,encoding='utf-8')
        try:
            run=subprocess.run([binary,'-b',str(path)],capture_output=True,text=True,timeout=20,cwd=directory)
            log=run.stdout+'\n'+run.stderr
            success=run.returncode==0 and 'No. of Data Rows' in log and not re.search(r'error|fatal|failed|singular matrix|timestep too small|unrecognized parameter|unknown parameter|ignored',log,re.I)
            report=dict(ok=success,level='Kompatibilität und Konvergenz',passed=[],biases=values,
                temperature=25,sha256=m['sha256'],log=log[-12000:],
                note='Konstante Prüfspannungen, 25 °C. Kein Nachweis von Datenblattwerten oder Schaltverhalten.')
        except subprocess.TimeoutExpired:
            report=dict(ok=False,passed=[],log='Zeitlimit 20 Sekunden überschritten.',sha256=m['sha256'])
        report.update(mapping=mapping,binding=binding)
        (directory/'report.json').write_text(json.dumps(report,ensure_ascii=False),encoding='utf-8')
        return report

    def test_diode(self,id_,symbol,pins,symbol_info,roles,confirmed,symbol_source=None):
        from kicad_parts_manager.diode_check import validate_roles,run_check
        model=self.get(id_)
        if confirmed is not True:raise ValueError('Anode und Kathode anhand des Symbols oder Datenblatts bestätigen.')
        roles=validate_roles(model,symbol_info,roles)
        mapping=check_pin_mapping(model,pins,symbol_info)
        if mapping['status']=='conflict':raise ValueError(mapping['message'])
        report=run_check(model,self.safe_text(model),pins,roles,self.root/'checks'/id_)
        report.update(sha256=model['sha256'],binding=dict(symbol=symbol,pins=pins,symbol_info=symbol_info,roles=roles),mapping=mapping)
        if symbol_source is not None:report['binding']['symbol_source']=symbol_source
        (self.root/'checks'/id_/'diode-report.json').write_text(json.dumps(report,ensure_ascii=False,allow_nan=False),encoding='utf8')
        return report

    def assign(self,symbol,id_,pins,report=None,symbol_info=None,biases=None,diode_roles=None,symbol_source=None):
        model=self.get(id_)
        if diode_roles is not None:
            from kicad_parts_manager.diode_check import validate_roles,SUITE
            diode_roles=validate_roles(model,symbol_info,diode_roles)
            if pins!=[diode_roles['A'],diode_roles['K']]:raise ValueError('SIM-Pinzuordnung passt nicht zur bestätigten Symbol-Anode/Kathode. Bitte Zuordnung korrigieren.')
        if symbol_info is not None:
            mapping=check_pin_mapping(model,pins,symbol_info)
            if mapping['status']=='conflict':raise ValueError(mapping['message'])
        if len(pins)!=len(model['pins']) or any(not re.fullmatch(TOKEN,str(p)) for p in pins):raise ValueError('Alle Modellanschlüsse benötigen eine Symbol-Pinnummer.')
        if len(set(pins))!=len(pins) and model['type']!='M':raise ValueError('Doppelte Symbol-Pinnummer. Pinzuordnung prüfen.')
        if model['type']=='M' and (len(set(pins[:3]))!=3 or pins[3] in pins[:2]):raise ValueError('Drain, Gate und Source müssen verschieden sein; Bulk darf an Source liegen.')
        directory=self.root/'prepared'/id_;directory.mkdir(parents=True,exist_ok=True)
        prepared=self.safe_text(model)
        (directory/'model.lib').write_text(prepared,encoding='utf-8')
        (directory/'model.sha256').write_text(hashlib.sha256(prepared.encode('utf-8')).hexdigest(),encoding='utf-8')
        # Tests are read from the local result, never accepted from the browser.
        path=self.root/'checks'/id_/'report.json'
        result=json.loads(path.read_text(encoding='utf-8')) if path.exists() else None
        binding=dict(symbol=symbol,pins=pins,symbol_info=symbol_info)
        if symbol_source is not None:binding['symbol_source']=symbol_source
        if result and (result.get('sha256')!=model['sha256'] or result.get('binding')!=binding or (biases is not None and result.get('biases')!=biases)):result=None
        if diode_roles is not None:
            diode_path=self.root/'checks'/id_/'diode-report.json'
            diode=json.loads(diode_path.read_text(encoding='utf8')) if diode_path.exists() else None
            if diode and diode.get('suite')==SUITE and diode.get('sha256')==model['sha256'] and diode.get('binding')==dict(binding,roles=diode_roles):
                result=result or dict(ok=diode['calculated'],passed=[],binding=binding,mapping=diode['mapping'],sha256=model['sha256'],note='Berechenbarkeit aus dem Dioden-Grundtest bei ±1 V über 1 kΩ; freie Prüfspannungen wurden damit nicht geprüft.')
                result['diode_function']=diode
        with self.connect() as db:
            db.execute('INSERT OR REPLACE INTO assignments VALUES (?,?,?,?)',(symbol,id_,json.dumps(pins),json.dumps(result)))
        return self.assigned(symbol)

    def assigned(self,symbol):
        with self.connect() as db: row=db.execute('SELECT * FROM assignments WHERE symbol=?',(symbol,)).fetchone()
        if not row:return None
        m=self.get(row['model_id']);report=json.loads(row['report'])
        if report and report.get('diode_function'):
            from kicad_parts_manager.diode_check import SUITE
            diode=report['diode_function']
            if diode.get('suite')!=SUITE or diode.get('sha256')!=m['sha256']:
                diode.update(ok=False,stale=True)
        hash_path=self.root/'prepared'/m['id']/'model.sha256'
        try:
            prepared_hash=hash_path.read_text(encoding='utf-8').strip() if hash_path.exists() else hashlib.sha256(self.safe_text(m).encode('utf-8')).hexdigest()
        except (ValueError,OSError):prepared_hash='invalid'
        return dict(id='LOCAL-'+m['id'],name=m['name'],status='UNVERIFIED',model_class='UNKNOWN',simulator='ngspice',
            manufacturer_model=False,file=str(self.root/'prepared'/m['id']/'model.lib'),file_sha256=prepared_hash,file_hash_normalized=True,source_file=m['file'],passed=[],compatibility='NGSPICE_NATIVE' if report and report.get('ok') else 'UNKNOWN',
            source_url=m['source'] if m['source'].startswith('https://') else '',collection=m['collection'],sha256=m['sha256'],
            pin_map=[dict(model_pin=i+1,model_pin_name=p,symbol_pin=s) for i,(p,s) in enumerate(zip(m['pins'],json.loads(row['pins'])))],
            symbol_source_file=(report or {}).get('binding',{}).get('symbol_source',{}).get('file'),
            symbol_source_reference=(report or {}).get('binding',{}).get('symbol_source',{}).get('symbol'),
            symbol_source_sha256=(report or {}).get('binding',{}).get('symbol_source',{}).get('sha256'),check=report)


def symbol_source(row):
    """Server-owned snapshot; conservatively bind tests to the complete library."""
    if not row.get('source_file'):return None
    path=Path(row['source_file'])
    try:return dict(file=str(path.resolve()),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),symbol=row.get('symbol'))
    except OSError:return None


def symbol_snapshot(row):
    from kicad_parts_manager.kicad.geometry import symbol_geometry
    if not row.get('source_file'):return dict(pins=[],source=None,preview=None)
    path=Path(row['source_file']);raw=path.read_bytes();root=parse(raw.decode('utf-8-sig'))
    return dict(pins=_symbol_pins(row,root),source=dict(file=str(path.resolve()),sha256=hashlib.sha256(raw).hexdigest(),symbol=row.get('symbol')),preview=symbol_geometry(root,row.get('symbol','').split(':')[-1]))


def symbol_pins(row):
    return symbol_snapshot(row)['pins']


def _symbol_pins(row,root):
    symbols={n[1]:n for n in children(root,'symbol')}
    def get(name,seen):
        if name in seen or name not in symbols:return []
        node=symbols[name];parents=children(node,'extends');pins=get(parents[0][1],seen|{name}) if parents else []
        for unit in children(node,'symbol'):
            for p in children(unit,'pin'):pins.append(dict(number=field(p,'number'),name=field(p,'name'),electrical=p[1]))
        return pins
    pins=get(row.get('symbol','').split(':')[-1],set())
    return list({p['number']:p for p in pins}.values())
