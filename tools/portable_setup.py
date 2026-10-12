"""First-run setup for a private Windows transfer, without administrator access."""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import venv
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]

def relocate(value, mappings):
    if isinstance(value, str):
        normalized=value.replace('\\','/')
        for old,new in mappings:
            prefix=old.replace('\\','/').rstrip('/')
            if normalized.casefold()==prefix.casefold() or normalized.casefold().startswith(prefix.casefold()+'/'):
                return str(Path(new)/normalized[len(prefix):].lstrip('/'))
        if value.startswith(('{','[')):
            try:
                parsed=json.loads(value);changed=relocate(parsed,mappings)
                return json.dumps(changed,ensure_ascii=False) if changed!=parsed else value
            except ValueError:pass
        return value
    if isinstance(value,list):return [relocate(v,mappings) for v in value]
    if isinstance(value,dict):return {relocate(k,mappings):relocate(v,mappings) for k,v in value.items()}
    return value

def relocate_database(path,mappings):
    with sqlite3.connect(path) as db:
        tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        for table in tables:
            quoted='"'+table.replace('"','""')+'"'
            columns=[r[1] for r in db.execute('PRAGMA table_info('+quoted+')')]
            for row in db.execute('SELECT rowid,* FROM '+quoted).fetchall():
                updates=[(col,relocate(v,mappings)) for col,v in zip(columns,row[1:]) if isinstance(v,str) and relocate(v,mappings)!=v]
                if updates:
                    assignments=','.join('"'+col.replace('"','""')+'"=?' for col,_ in updates)
                    db.execute('UPDATE '+quoted+' SET '+assignments+' WHERE rowid=?',[v for _,v in updates]+[row[0]])
        if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise RuntimeError('Database integrity failed: '+str(path))

def relocate_user_library(root,metadata,mappings):
    """Relocate working references; exact downloaded originals remain intact."""
    original=metadata.get('user_library_original');folder=root/'user-library'
    if not original or not folder.is_dir():return
    mappings.append((original,str(folder)));mappings.sort(key=lambda m:len(m[0]),reverse=True)
    settings=root/'db/user-import-settings.json'
    if settings.exists():settings.write_text(json.dumps(dict(folder=str(folder),used=True)),encoding='utf8')
    for path in folder.rglob('*.kicad_sym'):
        if 'Originale' in path.relative_to(folder).parts:continue
        text=path.read_text(encoding='utf-8-sig')
        pattern=r'(\(property\s+"(?:Sim.Library|Datasheet)"\s+)("(?:\\.|[^"\\])*")'
        text=re.sub(pattern,lambda m:m[1]+json.dumps(relocate(json.loads(m[2]),mappings).replace('\\','/'),ensure_ascii=False),text)
        path.write_text(text,encoding='utf8')
    for path in folder.rglob('preview.json'):
        # Old previews cannot be applied against another computer's baseline.
        data=relocate(json.loads(path.read_text(encoding='utf8')),mappings)
        if data.get('status')=='preview':data['status']='transferred'
        path.write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')

def main():
    os.chdir(ROOT)
    if sys.version_info<(3,11):raise RuntimeError('Python 3.11 or newer is required.')
    python=ROOT/'.venv/Scripts/python.exe'
    if not python.exists():
        print('1/3 Creating local Python environment...',flush=True);venv.create(ROOT/'.venv',with_pip=True)
    if not (ROOT/'.portable-ready').exists():
        for item in json.loads((ROOT/'package-manifest.json').read_text(encoding='utf-8')):
            path=ROOT/item['path']
            if not path.resolve().is_relative_to(ROOT) or hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:
                raise RuntimeError('Transfer file damaged or modified: '+item['path'])
        print('2/3 Installing application dependencies...',flush=True)
        command=[str(python),'-m','pip','install']
        wheels=ROOT/'wheels'
        if wheels.exists():
            result=subprocess.run(command+['--no-index','--find-links',str(wheels),'-r','requirements-runtime.txt'])
            if result.returncode:
                print('Bundled dependencies do not match this Python version. Downloading matching versions...',flush=True)
                subprocess.run(command+['-r','requirements-runtime.txt'],check=True)
        else:subprocess.run(command+['-r','requirements-runtime.txt'],check=True)
        subprocess.run([str(python),'-m','pip','install','--no-deps','--no-build-isolation','-e','.'],check=True)
        print('3/3 Connecting transferred data to this computer...',flush=True)
        metadata=json.loads((ROOT/'transfer.json').read_text(encoding='utf-8'))
        mappings=[(metadata['original_root'],str(ROOT))]
        kicad=Path(os.environ.get('ProgramFiles','C:/Program Files'))/'KiCad'
        shares=list(kicad.glob('*/share/kicad'))
        if metadata.get('kicad_share') and shares:
            same=next((p for p in shares if p.parent.parent.name==Path(metadata['kicad_share']).parent.parent.name),None)
            share=same or max(shares,key=lambda p:p.stat().st_mtime)
            mappings.append((metadata['kicad_share'],str(share)))
        relocate_user_library(ROOT,metadata,mappings)
        for name in ['db/kicad-parts-manager.sqlite','db/manual-data.sqlite','models/vendor/index.sqlite']:
            path=ROOT/name
            if path.exists():relocate_database(path,mappings)
        for name in ['db/library-catalog.json','db/imported-libraries.json']:
            catalog=ROOT/name
            if catalog.exists():catalog.write_text(json.dumps(relocate(json.loads(catalog.read_text(encoding='utf-8')),mappings),ensure_ascii=False),encoding='utf-8')
        # Namespaced user libraries can be added on the destination without
        # changing existing KiCad aliases. Source originals remain untouched.
        imported=ROOT/'db/imported-libraries.json'
        if metadata.get('user_library_original') and imported.exists() and shares:
            major=share.parent.parent.name.split('.')[0]
            config=Path(os.environ.get('APPDATA',''))/'kicad'/(major+'.0')
            if config.is_dir():
                code="from kicad_parts_manager.component_import import ComponentImport; from kicad_parts_manager.library_import import read_store; from pathlib import Path; import sys; s=ComponentImport(sys.argv[1]); rows=[r for r in read_store(s.index)['components'] if r['id'].startswith('USR-')]; root=Path(s.settings()['folder']); s.register({'items':[{'state':'new','row':r} for r in rows]},sys.argv[2],root)"
                result=subprocess.run([str(python),'-c',code,str(imported),str(config)])
                if result.returncode:print('User libraries retained; add their files in KiCad Preferences if registration failed.',flush=True)
        (ROOT/'.portable-ready').write_text(str(ROOT),encoding='utf-8')
    elif (ROOT/'.portable-ready').read_text(encoding='utf-8')!=str(ROOT):
        raise RuntimeError('Folder moved after setup. Extract a fresh transfer package at the final location.')
    if '--setup-only' not in sys.argv:subprocess.run([str(python),'-m','kicad_parts_manager.browser'],check=True)

if __name__=='__main__':
    try:main()
    except Exception as error:print('\nSetup failed:',error);sys.exit(1)
