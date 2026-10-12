"""Build a LOCAL, separated preview from allowlisted code and synthetic examples.

No upload, git mutation, database export, scan or manufacturer download is performed.
Private database files are never opened by this builder.
"""
from contextlib import closing
from datetime import datetime, timezone
import argparse
import gc
import hashlib
import json
from pathlib import Path
import shutil
import sqlite3
import struct
import subprocess
import sys
import os
import re
import tempfile
import zlib
from zipfile import ZipFile, ZIP_DEFLATED

from sqlalchemy.orm import Session
from kicad_parts_manager.database.session import engine
from kicad_parts_manager.importers.seed import seed
from kicad_parts_manager.manual_data import ManualData
from kicad_parts_manager.model_library import ModelLibrary

ROOT = Path(__file__).resolve().parents[1]
PREFIX = 'KiCad-Parts-Manager'
TOP = ['LICENSE', 'pyproject.toml', 'alembic.ini', 'requirements-runtime.txt']
MODEL_FILES = ['diode/reference.lib', 'diode/schottky.lib', 'diode/zener.lib', 'mosfet/reference.lib', 'bjt/reference.lib']
BLOCKED = ['docs/data/', 'test_results/', 'data/library-sources/', 'backups/', 'wheels/', 'transfer.json']


def allowed_path(name):
    path = Path(name)
    if path.is_absolute() or '..' in path.parts or '__pycache__' in path.parts:
        return False
    exact = set(TOP + ['README.md', 'THIRD_PARTY_NOTICES.md', 'DISCLAIMER.md', 'Deinstallieren.cmd', 'tools/uninstall.ps1', 'docs/WINDOWS_ACCEPTANCE.md', 'docs/FEEDBACK.md',
        'Start-KiCad-Parts-Manager.cmd', 'Start-KiCad-Parts-Manager.sh', 'Desktop-Verknuepfung-erstellen.cmd', 'tools/desktop_shortcut.ps1', 'docs/INSTALLATION.md', 'licenses/CC0-1.0.txt', 'publication-manifest.json',
        'db/kicad-parts-manager.sqlite', 'db/manual-data.sqlite', 'models/vendor/index.sqlite',
        'src/kicad_parts_manager/data/manufacturer-parameters.json',
        'src/kicad_parts_manager/web/home-background.png', 'kicad/kicad-parts-manager.kicad_dbl',
        'tools/public_setup.py', 'tools/build_public_preview.py', 'tests/test_public_preview.py'])
    exact.update('models/'+n for n in MODEL_FILES)
    exact.update('docs/public/'+n for n in ['README.md','THIRD_PARTY_NOTICES.md','DISCLAIMER.md','CC0-1.0.txt'])
    exact.update('.github/ISSUE_TEMPLATE/'+n for n in ['bug_report.md','feature_request.md','config.yml'])
    return name in exact or (name.startswith('src/kicad_parts_manager/') and path.suffix in {'.py','.js','.css','.html'}) or (name.startswith('db/migrations/') and path.suffix in {'.py','.sql'})


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def copy_checked(source, destination):
    if source.is_symlink() or not source.is_file():
        raise ValueError('Missing or linked source: ' + str(source))
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)


def simple_background():
    # Newly authored plain color; do not redistribute the unreviewed design image.
    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>2I5B', 1, 1, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b'\0\x20\x29\x30')) + chunk(b'IEND', b'')


def prepare(stage, root=ROOT):
    """Populate a new directory. Existing targets are refused, including private roots."""
    stage = Path(stage).resolve()
    if stage.exists():
        raise ValueError('Preview target must be a new directory.')
    if stage == root.resolve() or root.resolve().is_relative_to(stage):
        raise ValueError('Preview target overlaps source root.')
    if stage.is_relative_to(root.resolve()) and not stage.is_relative_to((root / 'dist/public').resolve()):
        raise ValueError('Preview inside workspace must be under dist/public.')
    stage.mkdir(parents=True)
    for name in TOP:
        copy_checked(root / name, stage / name)
    metadata = stage / 'pyproject.toml'
    metadata.write_text(re.sub(r'(?ms)^\[project.urls\]\r?\n.*?(?=^\[|\Z)', '', metadata.read_text(encoding='utf8')), encoding='utf8')
    # Only program text; private manufacturer data and all existing raster assets excluded.
    for path in sorted((root / 'src/kicad_parts_manager').rglob('*')):
        rel = path.relative_to(root)
        if path.is_file() and path.suffix in {'.py', '.js', '.css', '.html'} and '__pycache__' not in path.parts:
            copy_checked(path, stage / rel)
    for path in sorted((root / 'db/migrations').rglob('*')):
        if path.is_file() and path.suffix in {'.py', '.sql'} and '__pycache__' not in path.parts:
            copy_checked(path, stage / path.relative_to(root))
    for name in MODEL_FILES:
        source = root / 'models' / name
        if 'Self-authored CC0-1.0' not in source.read_text(encoding='utf8'):
            raise ValueError('Uncleared example model: ' + name)
        copy_checked(source, stage / 'models' / name)
    for name in ['public_setup.py', 'build_public_preview.py', 'desktop_shortcut.ps1', 'uninstall.ps1']:
        copy_checked(root / 'tools' / name, stage / 'tools' / name)
    for name in ['Start-KiCad-Parts-Manager.sh','Desktop-Verknuepfung-erstellen.cmd','Deinstallieren.cmd','docs/INSTALLATION.md','docs/WINDOWS_ACCEPTANCE.md','docs/FEEDBACK.md']:
        copy_checked(root / name, stage / name)
    for name in ['bug_report.md','feature_request.md','config.yml']:
        copy_checked(root / '.github/ISSUE_TEMPLATE' / name, stage / '.github/ISSUE_TEMPLATE' / name)
    copy_checked(root / 'docs/public/CC0-1.0.txt', stage / 'licenses/CC0-1.0.txt')
    copy_checked(root / 'docs/public/README.md', stage / 'README.md')
    copy_checked(root / 'docs/public/THIRD_PARTY_NOTICES.md', stage / 'THIRD_PARTY_NOTICES.md')
    copy_checked(root / 'docs/public/DISCLAIMER.md', stage / 'DISCLAIMER.md')
    # Preserve the preparation sources so this source-containing package can rebuild itself.
    for name in ['README.md','THIRD_PARTY_NOTICES.md','DISCLAIMER.md','CC0-1.0.txt']:
        copy_checked(root / 'docs/public' / name, stage / 'docs/public' / name)
    copy_checked(root / 'tests/test_public_preview.py', stage / 'tests/test_public_preview.py')
    mapping = json.loads((root / 'kicad/kicad-parts-manager.kicad_dbl').read_text(encoding='utf8'))
    mapping['source']['dsn'] = 'kicad-parts-manager-preview'
    (stage / 'kicad').mkdir()
    (stage / 'kicad/kicad-parts-manager.kicad_dbl').write_text(json.dumps(mapping, indent=2), encoding='utf8')
    data = stage / 'src/kicad_parts_manager/data'
    data.mkdir()
    (data / 'manufacturer-parameters.json').write_text(json.dumps(dict(schema_version=1, version='public-example-1', reviewed_on='2026-10-09', description='Synthetic preview; no manufacturer facts included.', components=[])), encoding='utf8')
    (stage / 'src/kicad_parts_manager/web/home-background.png').write_bytes(simple_background())
    (stage / 'Start-KiCad-Parts-Manager.cmd').write_text('@echo off\r\ncd /d "%~dp0"\r\nwhere py >nul 2>nul\r\nif not errorlevel 1 (\r\n  py -3 tools\\public_setup.py\r\n) else (\r\n  python tools\\public_setup.py\r\n)\r\nif errorlevel 1 pause\r\n', encoding='ascii')
    path = stage / 'db/kicad-parts-manager.sqlite'
    # Run migrations in a child so Windows cannot retain pooled SQLite handles.
    env = dict(os.environ, PYTHONPATH=str(stage / 'src'))
    subprocess.run([sys.executable, '-m', 'kicad_parts_manager.cli', '--db', str(path), 'init'],
                   cwd=stage, env=env, check=True, capture_output=True)
    db_engine = engine('sqlite:///' + path.as_posix())
    try:
        with Session(db_engine) as session:
            seed(session, stage)
    finally:
        db_engine.dispose()
    # Remove build-machine paths; setup relocates only these fresh synthetic entries.
    with closing(sqlite3.connect(path)) as db:
        for ident, value in db.execute('SELECT id,model_file FROM simulation_models').fetchall():
            db.execute('UPDATE simulation_models SET model_file=? WHERE id=?', (Path(value).relative_to(stage).as_posix(), ident))
        db.commit()
    ManualData(stage / 'db/manual-data.sqlite')
    ModelLibrary(stage / 'models/vendor')
    gc.collect()
    policy = dict(schema_version=1, publication_status='LOCAL_PREVIEW_NOT_RELEASED', ready_to_publish=False,
                  sources=[dict(id='P01', license='GPL-3.0-only', scope='original program text'),
                           dict(id='D01', license='CC0-1.0', scope='eight synthetic examples and five illustrative models'),
                           dict(id='P01-background', license='CC0-1.0', scope='new plain-color background only')],
                  excluded=['private databases and catalog', 'manufacturer facts', 'vendor model collections', 'CERN/KiCad library copies', 'source exports, spreadsheets and internal reports', 'original landing image'],
                  external_requirements=['Python 3.11+', 'PyPI dependencies installed on first start', 'KiCad for symbol placement'],
                  limitations=['No real manufacturer selection data', 'No bundled KiCad symbols or footprints; references require installed libraries', 'Not yet a public release; fresh Windows installation acceptance pending'])
    (stage / 'publication-manifest.json').write_text(json.dumps(policy, indent=2), encoding='utf8')
    # Alembic may generate bytecode in the isolated staging tree; omit it from the package.
    rows = [dict(path=p.relative_to(stage).as_posix(), sha256=sha(p), source_id='D01' if p.suffix in {'.sqlite','.lib'} else 'P01-background' if p.name=='home-background.png' else 'P01')
            for p in sorted(stage.rglob('*')) if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc']
    (stage / 'package-manifest.json').write_text(json.dumps(dict(schema_version=1, publication_status='LOCAL_PREVIEW_NOT_RELEASED', files=rows), indent=2), encoding='utf8')
    verify(stage)
    return stage


def verify(stage):
    stage = Path(stage)
    manifest = json.loads((stage / 'package-manifest.json').read_text(encoding='utf8'))
    rows = manifest['files']
    names = [r['path'] for r in rows]
    if len(names) != len(set(names)):
        raise ValueError('Duplicate manifest path.')
    actual = {p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'}
    if actual != set(names) | {'package-manifest.json'}:
        raise ValueError('Unknown file in public preview.')
    for row in rows:
        path = (stage / row['path']).resolve()
        if not path.is_relative_to(stage.resolve()) or not allowed_path(row['path']) or (stage / row['path']).is_symlink() or row.get('source_id') not in {'P01','D01','P01-background'} or any(row['path'].startswith(p) for p in BLOCKED) or sha(path) != row['sha256']:
            raise ValueError('Unapproved or modified file: ' + row['path'])
    if json.loads((stage / 'src/kicad_parts_manager/data/manufacturer-parameters.json').read_text())['components']:
        raise ValueError('Manufacturer data included.')
    with closing(sqlite3.connect((stage / 'db/kicad-parts-manager.sqlite').resolve().as_uri() + '?mode=ro', uri=True)) as db:
        if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)] or db.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Example database integrity failed.')
        if db.execute('SELECT count(*) FROM components').fetchone()[0] != 8:
            raise ValueError('Unexpected example components.')
        if db.execute("SELECT count(*) FROM components WHERE description NOT LIKE 'Illustrative reference%'").fetchone()[0]:
            raise ValueError('Non-example component included.')
        if db.execute('SELECT count(*) FROM simulation_models').fetchone()[0] != 5:
            raise ValueError('Unexpected models.')
        for (value,) in db.execute('SELECT model_file FROM simulation_models'):
            if value not in {'models/' + name for name in MODEL_FILES}:
                raise ValueError('Private or unknown model path.')
    for relative, tables in [('db/manual-data.sqlite', ['overrides','history','category_overrides','category_history']), ('models/vendor/index.sqlite', ['models','assignments'])]:
        with closing(sqlite3.connect((stage / relative).resolve().as_uri() + '?mode=ro', uri=True)) as db:
            available = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            for name in tables:
                if name in available and db.execute('SELECT count(*) FROM '+name).fetchone()[0]:
                    raise ValueError('Private manual/vendor rows included.')
    return dict(files=len(rows), examples=8, models=5, publication_status='LOCAL_PREVIEW_NOT_RELEASED')


def build(root=ROOT):
    out = root / 'dist/public'
    if not out.resolve().is_relative_to(root.resolve()):
        raise ValueError('Public output must stay within its source workspace.')
    out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    archive = out / ('KiCad-Parts-Manager-LOCAL-PUBLIC-PREVIEW-' + stamp + '.zip')
    with tempfile.TemporaryDirectory(prefix='public-preview-', dir=out) as tmp:
        stage = prepare(Path(tmp) / PREFIX, root)
        manifest = json.loads((stage / 'package-manifest.json').read_text())
        with ZipFile(archive, 'x', ZIP_DEFLATED) as z:
            for name in [r['path'] for r in manifest['files']] + ['package-manifest.json']:
                z.write(stage / name, PREFIX + '/' + name)
        with ZipFile(archive) as z:
            if z.testzip() is not None:
                raise ValueError('Preview ZIP damaged.')
            for row in manifest['files']:
                if hashlib.sha256(z.read(PREFIX+'/'+row['path'])).hexdigest() != row['sha256']:
                    raise ValueError('Preview ZIP hash mismatch.')
    archive.with_name(archive.name+'.sha256').write_text(sha(archive)+'  '+archive.name+'\n', encoding='utf8')
    return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', type=Path)
    args = parser.parse_args()
    print(json.dumps(verify(args.verify)) if args.verify else build())
