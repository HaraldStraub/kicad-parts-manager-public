"""Discover installed libraries without changing KiCad or downloading data."""
import os
from pathlib import Path
import re
from .api_errors import ApiError


def discover(environ=None, home=None):
    env = os.environ if environ is None else environ
    home = Path.home() if home is None else Path(home)
    bases = [Path(env.get('ProgramFiles', 'C:/Program Files'))/'KiCad',
             Path(env.get('LOCALAPPDATA', str(home/'AppData/Local')))/'Programs/KiCad']
    configs = Path(env.get('APPDATA', str(home/'.config')))/'kicad'
    candidates = []
    for base in bases:
        if base.is_dir():
            candidates.extend((p.name, p/'share/kicad') for p in base.iterdir() if p.is_dir())
    # Also recognize an explicitly configured KiCad library location.
    for key, value in env.items():
        match = re.fullmatch(r'KICAD(\d+)_SYMBOL_DIR', key)
        if match:
            candidates.append((match[1]+'.0', Path(value).parent))
    found = {}
    for version, share in candidates:
        if not re.fullmatch(r'\d+(?:\.\d+)*', version) or not (share/'symbols').is_dir():
            continue
        share = share.resolve()
        config = configs/(version.split('.')[0]+'.0')
        found[str(share)] = dict(version=version, share=str(share), config=str(config),
                                tables_ready=all((config/n).is_file() for n in ('sym-lib-table','fp-lib-table')))
    return sorted(found.values(), key=lambda item:tuple(map(int,item['version'].split('.'))), reverse=True)


def validate(request):
    share = Path(str(request.get('share','')))
    config = Path(str(request.get('config','')))
    if not share.is_absolute() or not config.is_absolute() or not (share/'symbols').is_dir():
        raise ApiError('setup_paths', 'Select an absolute KiCad share folder containing symbols and an absolute settings folder.')
    if not any((share/'symbols').glob('*.kicad_sym')):
        raise ApiError('setup_empty', 'No KiCad symbol libraries found in the selected folder.')
    if config.exists() and not config.is_dir():
        raise ApiError('setup_paths', 'KiCad settings path must be a folder.')
    return dict(config=str(config.resolve()),share=str(share.resolve()),extra_roots=[],components=[])
