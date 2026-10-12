"""Disposable, data-only startup cache. Source indexes remain authoritative."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zlib

VERSION = 1


def file_digest(path):
    path = Path(path)
    try:
        with path.open('rb') as stream:
            return hashlib.file_digest(stream, 'sha256').hexdigest()
    except FileNotFoundError:
        return None


def registration_paths(data):
    if not data or not data.get('config'):
        return []
    paths = [Path(data['config']) / name for name in
             ('sym-lib-table', 'fp-lib-table', 'kicad_common.json')]
    if data.get('project'):
        paths += [Path(data['project']) / name for name in ('sym-lib-table', 'fp-lib-table')]
    # KiCad tables can include other tables; those edits also affect registration.
    from .kicad.registration import current_tables
    dependencies = set(paths)
    current_tables(data, dependencies)
    return sorted(dependencies, key=str)


class PreparedInventoryCache:
    def __init__(self, inventory, imports):
        self.sources = [Path(inventory).resolve(), Path(imports).resolve()]
        self.path = self.sources[0].parent / '.cache' / (self.sources[0].name + '.prepared.gz')

    def signature(self, registrations=()):
        package = Path(__file__).parent
        # Include implementation changes, not a manually maintained release
        # number. Any changed processing rule invalidates the derived result.
        rules = ['browser.py', 'inventory_disk_cache.py', 'library_import.py',
                 'kicad/inventory.py', 'kicad/registration.py', 'kicad/taxonomy.py',
                 'kicad/transistor_taxonomy.py', 'kicad/selection_taxonomy.py']
        environment = json.dumps(dict(os.environ), sort_keys=True).encode()
        return dict(version=VERSION,
                    sources=[[str(p), file_digest(p)] for p in self.sources],
                    rules=[[p, file_digest(package / p)] for p in rules],
                    registrations=[[str(p), file_digest(p)] for p in registrations],
                    environment=hashlib.sha256(environment).hexdigest())

    def load(self):
        try:
            # JSON only, never executable serialization. Gzip's CRC detects
            # damaged payloads, including corruption that remains valid JSON.
            # Avoid inflating a known stale cache before validating its content.
            cache_time = self.path.stat().st_mtime_ns
            package = Path(__file__).parent
            watched = self.sources + [package / name for name in
                ('browser.py', 'inventory_disk_cache.py', 'library_import.py',
                 'kicad/inventory.py', 'kicad/registration.py', 'kicad/taxonomy.py',
                 'kicad/transistor_taxonomy.py', 'kicad/selection_taxonomy.py')]
            if any(path.exists() and path.stat().st_mtime_ns > cache_time for path in watched):
                return None
            with gzip.open(self.path, 'rt', encoding='utf8') as stream:
                saved = json.load(stream)
            data = saved['data']
            if not isinstance(data, dict) or not isinstance(data.get('components'), list):
                return None
            if saved['signature'] != self.signature(registration_paths(data)):
                return None
            return data
        except (OSError, EOFError, ValueError, KeyError, TypeError, AttributeError, zlib.error):
            return None

    def save(self, data, before):
        temporary = None
        try:
            # Do not bless an index changed during preparation as up to date.
            after = self.signature(registration_paths(data))
            if before != after:
                return False
            body = json.dumps(dict(signature=after, data=data), ensure_ascii=False,
                              allow_nan=False, separators=(',', ':')).encode('utf8')
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=self.path.parent, suffix='.tmp', delete=False) as stream:
                temporary = Path(stream.name)
                with gzip.GzipFile(fileobj=stream, mode='wb', compresslevel=1) as compressed:
                    compressed.write(body)
            temporary.replace(self.path)
            return True
        except (OSError, ValueError, TypeError):
            # A read-only/full cache directory must not prevent normal startup.
            return False
        finally:
            if temporary:
                try:
                    temporary.unlink(missing_ok=True)
                except OSError:
                    pass
