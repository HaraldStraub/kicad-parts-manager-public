"""Read existing installations without renaming user data or historical archives."""
from pathlib import Path
import os

LEGACY_DATABASE = "componentdb.sqlite"

def main_database(root):
    root=Path(root)
    current=root/'db/kicad-parts-manager.sqlite'
    legacy=root/'db'/LEGACY_DATABASE
    return legacy if not current.exists() and legacy.exists() else current

def migrate_environment():
    for key,value in list(os.environ.items()):
        if key.startswith('COMPONENTDB_'):
            os.environ.setdefault('KICAD_PARTS_MANAGER_'+key.removeprefix('COMPONENTDB_'),value)
