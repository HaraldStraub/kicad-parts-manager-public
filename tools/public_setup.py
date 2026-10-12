"""Set up a separate local public-preview copy; never imports a private database."""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import venv
import os

ROOT = Path(__file__).resolve().parents[1]


def prepare_paths(root):
    """Only relocate the synthetic models inside this extracted preview."""
    path = root / 'db/kicad-parts-manager.sqlite'
    db = sqlite3.connect(path)
    try:
        for ident, value in db.execute('SELECT id,model_file FROM simulation_models').fetchall():
            candidate = (root / value).resolve()
            if not candidate.is_relative_to(root / 'models') or not candidate.is_file():
                raise RuntimeError('Example model path outside preview: ' + value)
            db.execute('UPDATE simulation_models SET model_file=? WHERE id=?', (str(candidate), ident))
        db.commit()
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Local public preview; no publication/upload.')
    parser.add_argument('--setup-only', action='store_true')
    parser.add_argument('--port', type=int, default=4190)
    args = parser.parse_args()
    if sys.version_info < (3, 11):
        raise RuntimeError('Python 3.11 or newer required.')
    ready = ROOT / '.public-preview-ready'
    python = ROOT / ('.venv/Scripts/python.exe' if os.name == 'nt' else '.venv/bin/python')
    if not ready.exists():
        manifest = json.loads((ROOT / 'package-manifest.json').read_text(encoding='utf8'))
        for row in manifest['files']:
            path = (ROOT / row['path']).resolve()
            if not path.is_relative_to(ROOT) or hashlib.sha256(path.read_bytes()).hexdigest() != row['sha256']:
                raise RuntimeError('Preview file damaged: ' + row['path'])
        venv.create(ROOT / '.venv', with_pip=True)
        # Dependencies are installed locally from PyPI; no account/admin access is needed.
        subprocess.run([str(python), '-m', 'pip', 'install', '-r', 'requirements-runtime.txt'], cwd=ROOT, check=True)
        subprocess.run([str(python), '-m', 'pip', 'install', '--no-deps', '--no-build-isolation', '-e', '.'], cwd=ROOT, check=True)
        prepare_paths(ROOT)
        ready.write_text(str(ROOT), encoding='utf8')
    elif ready.read_text(encoding='utf8') != str(ROOT):
        raise RuntimeError('Preview folder moved after setup; extract a fresh copy.')
    if not args.setup_only:
        subprocess.run([str(python), '-m', 'kicad_parts_manager.browser', '--port', str(args.port)], cwd=ROOT, check=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Preview setup failed:', error)
        sys.exit(1)
