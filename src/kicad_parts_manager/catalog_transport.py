"""Compact wire format and local response reuse; persistent data is untouched."""
import gzip
import hashlib
import json
import os
from pathlib import Path
from threading import Lock

if os.name == 'nt':
    import ctypes
    import msvcrt
    from ctypes import wintypes
    _file_info = ctypes.WinDLL('kernel32', use_last_error=True).GetFileInformationByHandleEx
    _file_info.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    _file_info.restype = wintypes.BOOL


def change_time(path, info):
    if os.name != 'nt':
        return info.st_ctime_ns
    # Python's Windows ctime is creation time. FILE_BASIC_INFO.ChangeTime
    # also observes edits that restore mtime: https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_basic_info
    try:
        with open(path, 'rb') as file:
            buffer = ctypes.create_string_buffer(40)
            if _file_info(msvcrt.get_osfhandle(file.fileno()), 0, buffer, len(buffer)):
                return int.from_bytes(buffer.raw[24:32], 'little')
    except OSError:
        pass
    return object()  # Unavailable evidence metadata must never enable reuse.


def compact_catalog(data):
    """Intern repeated metadata, retaining an exact reconstruction on the client."""
    shared = {}; indexes = {}; rows = []
    for original in data['components']:
        row = dict(original)
        for field in ('footprint_info', 'source_file', 'footprint_preview_key'):
            if field not in row:
                continue
            value = row.pop(field)
            # Footprint details can differ even with the same footprint name.
            key = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
            lookup = indexes.setdefault(field, {})
            if key not in lookup:
                lookup[key] = len(shared.setdefault(field, []))
                shared[field].append(value)
            row[field + '_shared'] = lookup[key]
        rows.append(row)
    return dict(data, components=rows, shared=shared)


def stamp(path):
    try:
        info = Path(path).stat()
        # File-system timestamp updates can coalesce within one clock tick.
        # Protect small evidence files and SQLite/WAL data with their content,
        # while the large library inventory keeps metadata-based invalidation.
        digest = None
        if info.st_size <= 1024 * 1024 or str(path).endswith(('.sqlite', '-wal')):
            with open(path, 'rb') as source:
                digest = hashlib.file_digest(source, 'sha256').digest()
        return info.st_mtime_ns, change_time(path, info), info.st_size, info.st_ino, digest
    except OSError:
        return None


class CatalogResponseCache:
    """Reuse encoded responses only while databases and evidence files agree."""
    def __init__(self, paths):
        self.paths = set(map(str, paths)); self.signature = None; self.responses = None
        self.lock = Lock()

    def state(self):
        return tuple(sorted(os.environ.items())), tuple((p, stamp(p)) for p in sorted(self.paths))

    def get(self, build):
        with self.lock:
            before = self.state()
            if self.responses is not None and before == self.signature:
                return self.responses
            data, evidence_paths = build()
            raw = json.dumps(compact_catalog(data), ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode('utf-8')
            from kicad_parts_manager.statistics import category_statistics
            stats = json.dumps(category_statistics(data['components']), ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode('utf-8')
            response = raw, gzip.compress(raw, compresslevel=1), stats
            old_paths = self.paths.copy()
            self.paths.update(map(str, evidence_paths))
            after = self.state()
            # A newly discovered dependency or a concurrent edit requires one
            # more build before reuse. Never retain a mixed revision as fresh.
            if old_paths == self.paths and before == after:
                self.signature = after; self.responses = response
            else:
                self.signature = None; self.responses = None
            return response
