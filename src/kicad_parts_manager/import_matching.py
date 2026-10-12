"""Reusable name/ID index for a bounded import duplicate comparison."""
import copy
from collections import defaultdict
from threading import Lock

class CandidateRows(list):
    def __init__(self, rows, categories):
        super().__init__(rows)
        self.categories = categories

class ImportCandidateIndex:
    def __init__(self):
        self.lock = Lock()
        self.signature = None
        self.by_name = {}
        self.by_id = {}
        self.categories = set()
        self.builds = 0

    def select(self, incoming, rows, signature):
        with self.lock:
            if signature != self.signature:
                by_name = defaultdict(list)
                self.by_id = {r['id']: r for r in rows}
                for row in self.by_id.values():
                    by_name[str(row.get('name', '')).strip().casefold()].append(row)
                self.by_name = by_name
                self.categories = {r['category'] for r in self.by_id.values()}
                self.signature = signature
                self.builds += 1
            found = {}
            for row in incoming:
                candidates = self.by_name.get(str(row.get('name', '')).strip().casefold(), [])
                direct = self.by_id.get(row['id'])
                for candidate in candidates + ([direct] if direct else []):
                    found[candidate['id']] = candidate
            return CandidateRows([copy.deepcopy(found[key]) for key in sorted(found)], self.categories.copy())
