"""Loopback-only catalog window with explicit local model assignments."""
import argparse
import json
import gzip
import os
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser
import tempfile
from urllib.request import urlopen
from urllib.error import URLError
from urllib.parse import unquote, urlsplit, parse_qs
from threading import Lock,Event,Thread
from .startup import Startup, StartupHandler
from .first_run import discover as discover_kicad, validate as validate_setup
from .inventory_disk_cache import PreparedInventoryCache, registration_paths, file_digest
from .kicad.previews import footprint_geometry
from .import_matching import ImportCandidateIndex, CandidateRows
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from kicad_parts_manager.compatibility import main_database
from kicad_parts_manager.catalog import catalog
from kicad_parts_manager.statistics import category_statistics
from kicad_parts_manager.kicad.transistor_taxonomy import transistor_category
from kicad_parts_manager.kicad.taxonomy import functional_category, passive_category, magnetic_category
from kicad_parts_manager.kicad.selection_taxonomy import selection_category
from kicad_parts_manager.database.models import EdaMapping
from kicad_parts_manager.model_library import ModelLibrary, symbol_snapshot
from kicad_parts_manager.manual_data import ManualData, component_key, fields_for, FIELDS
from kicad_parts_manager.manufacturer_parameters import ManufacturerParameters
from kicad_parts_manager.about import about_data
from kicad_parts_manager.api_errors import ApiError,error_payload
from kicad_parts_manager.simulation_evidence import refresh_simulation_files
from kicad_parts_manager.kicad.inventory import scan
from kicad_parts_manager.kicad.registration import refresh_registration
from kicad_parts_manager.catalog_transport import compact_catalog, CatalogResponseCache
from kicad_parts_manager.library_import import read_store, merge_inventory
from kicad_parts_manager.category_overrides import change_categories,targets as category_targets
from kicad_parts_manager.component_import import ComponentImport

WEB = Path(__file__).with_name("web")
CATALOG_API_VERSION = 53


class ScanCancelled(RuntimeError):
    code='scan_cancelled'


class LocalServer(ThreadingHTTPServer):
    # Windows SO_REUSEADDR can allow a second listener to answer the same URL.
    allow_reuse_address = False


class InventoryCache:
    def __init__(self, path):
        self.path, self.stamp, self.data, self.lock = path, None, None, Lock()
        self.import_path=path.with_name('imported-libraries.json')
        self.disk_cache=PreparedInventoryCache(path,self.import_path)
        self.disk_cache_hit=False
        self.scan_lock=Lock()
        self.scan_cancel=Event()
        self.scan_committed=False
        self.registration_stamp=None
        self.registration_paths=[]

    def cancel_scan(self):
        with self.lock:
            if not self.scan_lock.locked() or self.scan_committed:return False
            self.scan_cancel.set();return True

    def rescan(self,progress,setup=None):
        with self.lock:
            if not self.scan_lock.acquire(blocking=False):
                raise ApiError('scan_busy','Bibliotheken werden bereits eingelesen.')
            self.scan_cancel.clear();self.scan_committed=False
        temporary=None
        def check_cancel():
            if self.scan_cancel.is_set():raise ScanCancelled('Bibliotheksscan abgebrochen. Bisheriger Bestand bleibt erhalten.')
        try:
            if setup is not None and self.path.exists():
                raise ApiError('setup_existing','A library index already exists; use the regular library refresh.')
            previous=validate_setup(setup) if setup is not None else self()
            if not previous or not previous.get('config') or not previous.get('share'):
                raise ApiError('unavailable','Kein vorhandener Bibliotheksscan konfiguriert.')
            config,share=Path(previous['config']),Path(previous['share'])
            if (setup is None and not config.is_dir()) or not share.is_dir():
                raise ApiError('file_error','KiCad-Bibliothekspfade nicht mehr verfügbar.')
            roots=[Path(root) for root in previous.get('extra_roots',[])]
            # Older indexes omitted extra roots; derive them from their library sources.
            if 'extra_roots' not in previous:
                for row in previous.get('components',[]):
                    source=Path(row.get('source_file','')).resolve()
                    if source.is_file() and not source.is_relative_to(share.resolve()):
                        root=source.parent.parent if source.parent.suffix=='.pretty' else source.parent
                        if root not in roots:roots.append(root)
            result=scan(config,share,Path(previous['project']) if previous.get('project') else None,
                        roots,user_home=Path(previous['user_home']) if previous.get('user_home') else None,progress_data=progress,
                        previous=previous,include_previews=True,check_cancel=check_cancel)
            if setup is not None and not result['counts']['symbols']:
                raise ApiError('setup_empty','No readable KiCad symbols found. Check the selected library folder.')
            progress(dict(phase='saveIndex'))
            with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=self.path.parent,
                                             prefix=self.path.name+'.',suffix='.tmp',delete=False) as file:
                temporary=Path(file.name)
                pieces=[];size=0
                for piece in json.JSONEncoder(ensure_ascii=False,allow_nan=False,separators=(',',':')).iterencode(result):
                    pieces.append(piece);size+=len(piece)
                    if size>=65536:
                        check_cancel();file.write(''.join(pieces));pieces=[];size=0
                check_cancel();file.write(''.join(pieces))
            with self.lock:
                check_cancel()
                if setup is not None:
                    # Publish only if still absent, even if another process
                    # created an index while this first scan was running.
                    try:
                        if os.name=='nt':os.rename(temporary,self.path)
                        else:os.link(temporary,self.path)
                    except FileExistsError:raise ApiError('setup_existing','A library index was created during setup.')
                    temporary.unlink(missing_ok=True)
                else:temporary.replace(self.path)
                temporary=None;self.stamp=None
                self.scan_committed=True
            return dict(counts=result['counts'],warnings=len(result['warnings']),scanned_at=result['scanned_at'],
                        warning_details=result['warnings'][:25],
                        tables_ready=all((config/n).is_file() for n in ('sym-lib-table','fp-lib-table')))
        finally:
            if temporary:temporary.unlink(missing_ok=True)
            self.scan_lock.release()

    def __call__(self):
        with self.lock:
            try:
                info=self.path.stat();stamp=(info.st_mtime_ns,info.st_size,info.st_ino)
            except FileNotFoundError:
                stamp=None
            try:
                info=self.import_path.stat();import_stamp=(info.st_mtime_ns,info.st_size,info.st_ino)
            except FileNotFoundError:import_stamp=None
            combined_stamp=(stamp,import_stamp)
            before = None
            cached = False
            if combined_stamp != self.stamp:
                prepared = self.disk_cache.load()
                cached = prepared is not None
                self.disk_cache_hit = cached
                if cached:
                    self.data = prepared
                else:
                    try:
                        before = self.disk_cache.signature()
                    except OSError:
                        pass
                    self.data = json.loads(self.path.read_text(encoding='utf-8')) if stamp else None
                    if self.data:
                        for row in self.data.get('components',[]):
                            if not isinstance(row,dict):continue
                            category=functional_category(row.get('library',''),row.get('name',''),row.get('description',''))
                            if category and (row.get('category','').startswith('unassigned/') or category.startswith(('sensors','opto/optocoupler','audio_parts/','radio_parts/')) or row.get('library','').lower().startswith('dk_linear-amplifiers-instrumentation-op-amps-buffer-amps') or category in ('passive/common_mode_choke','passive/ferrite','passive/filter/emc_filter','passive/filter/rf_filter')):
                                row['category']=category
                    if import_stamp:self.data=merge_inventory(self.data,read_store(self.import_path))
                    if self.data:
                        for row in self.data.get('components',[]):
                            if not isinstance(row,dict) or row.get('kind')=='footprint' or row.get('import_category_override'):continue
                            category=transistor_category(row.get('library',''),row.get('name',''),row.get('description',''),row.get('category','')) or selection_category(row.get('library',''),row.get('name',''),row.get('description',''),row.get('category','')) or magnetic_category(row.get('library',''),row.get('name',''),row.get('description',''),row.get('category','')) or passive_category(row.get('library',''),row.get('name',''),row.get('description',''),row.get('category',''))
                            if category:row['category']=category
                        if 'categories' in self.data:self.data['categories']=sorted({r['category'] for r in self.data.get('components',[]) if isinstance(r,dict) and 'category' in r})
                self.stamp = combined_stamp
                self.registration_stamp=None
                self.registration_paths=registration_paths(self.data)
            paths=self.registration_paths
            if before is not None:
                try:
                    before['registrations']=[[str(p),file_digest(p)] for p in paths]
                except OSError:
                    before=None
            if paths:
                registration_stamp=tuple((str(p),p.stat().st_mtime_ns,p.stat().st_size) if p.exists() else (str(p),None) for p in paths)
                if self.registration_stamp!=registration_stamp:
                    if not cached:refresh_registration(self.data)
                    self.registration_stamp=registration_stamp
                    if not cached:self.registration_paths=registration_paths(self.data)
            if before is not None and self.data is not None:
                self.disk_cache.save(self.data,before)
            return self.data


class Handler(BaseHTTPRequestHandler):
    def __init__(self, *args, database, inventory=None, models=None, manual=None, catalog_cache=None, importer=None, import_candidates=None, **kwargs):
        self.database = database
        self.inventory = inventory
        self.models = models
        self.manual = manual
        self.catalog_cache = catalog_cache
        self.importer=importer
        self.import_candidates=import_candidates
        super().__init__(*args, **kwargs)

    def json_response(self, value, status=200):
        body=json.dumps(value,ensure_ascii=False,allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.end_headers();self.wfile.write(body)

    def part(self, identifier):
        if self.importer:
            row=self.editable_part(identifier)
            if not row.get('symbol'):raise ValueError('Bitte ein Bauteil mit Symbol auswählen.')
            if row.get('source_file'):return row
        inventory=self.inventory() if callable(self.inventory) else self.inventory
        row=next((c for c in (inventory or {}).get('components',[]) if c['id']==identifier),None)
        if row is None and identifier.startswith('CMP-'):
            with Session(self.database) as session:
                mapping=session.get(EdaMapping,identifier)
                if mapping:row=next((c for c in (inventory or {}).get('components',[]) if c.get('symbol')==mapping.kicad_symbol),None)
        if not row or not row.get('symbol'):raise ValueError('Bitte ein Bauteil mit Symbol auswählen.')
        return row

    def stream_action(self,action):
        self.send_response(200)
        self.send_header('Content-Type','application/x-ndjson; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        connected=True
        def emit(value):
            nonlocal connected
            if connected:
                try:
                    self.wfile.write((json.dumps(value,ensure_ascii=False,allow_nan=False)+'\n').encode('utf-8'))
                    self.wfile.flush()
                except (BrokenPipeError,ConnectionResetError,OSError):connected=False
        emit(dict(progress=dict(phase='starting')))
        try:emit(dict(result=action(lambda update:emit(dict(progress=update)))))
        except Exception as error:emit(error_payload(error))

    def model_symbol(self,request,row):
        snapshot=symbol_snapshot(row)
        if request.get('symbol_reference') and request['symbol_reference']!=row.get('symbol'):
            raise ApiError('pin_mapping','Symbolzuordnung seit dem Öffnen geändert. SIM-Assistent schließen, Symbol prüfen und neu öffnen.')
        expected=request.get('symbol_sha256')
        if expected and expected!=(snapshot['source'] or {}).get('sha256'):
            raise ApiError('pin_mapping','Symbolbibliothek seit dem Öffnen geändert. SIM-Assistent schließen, Symbol prüfen und neu öffnen.')
        return snapshot

    def editable_part(self, identifier):
        inventory=self.inventory() if callable(self.inventory) else self.inventory
        row=next((c for c in (inventory or {}).get('components',[]) if c['id']==identifier),None)
        if row is None and identifier.startswith('CMP-'):
            with Session(self.database) as session:
                row=next((c for c in catalog(session)['components'] if c['id']==identifier),None)
        if self.importer:
            rows=merge_inventory(dict(components=[row] if row else []),read_store(self.importer.index))['components']
            row=next((r for r in rows if r['id']==identifier),None)
        if row is None:raise ValueError('Bauteil nicht im Katalog gefunden.')
        return self.manual.apply_catalog([row])[0] if self.manual else row

    def do_POST(self):
        # Same-origin JSON only; a website cannot write to this loopback service.
        host=f'127.0.0.1:{self.server.server_port}'
        if self.headers.get('Host')!=host or self.headers.get('Origin')!='http://'+host or self.headers.get('Content-Type')!='application/json':
            self.json_response(error_payload(ApiError('forbidden','Nur vom lokalen Auswahlfenster erlaubt.')),403);return
        try:
            size=int(self.headers.get('Content-Length','0'))
            limit=56_000_000 if self.path=='/api/import/preview' else 12_000_000
            if not 0<size<=limit:raise ValueError('Ungültige Dateigröße.')
            if self.path.startswith('/api/models') and not self.models:raise ApiError('unavailable','Modellbibliothek nicht aktiviert.')
            request=json.loads(self.rfile.read(size))
            if self.path.startswith('/api/import/'):
                if not self.importer:raise ApiError('unavailable','Import not configured')
                if self.path=='/api/import/settings':result=self.importer.change_folder(request['folder'])
                elif self.path=='/api/import/cancel':result=self.importer.cancel(request['session'])
                elif self.path=='/api/import/undo':result=self.importer.undo(request['run_id'])
                elif self.path=='/api/import/open-folder':
                    folder=Path(self.importer.settings()['folder'])
                    if not folder.is_dir():raise ValueError('Import folder does not exist yet')
                    if os.name=='nt':os.startfile(folder)
                    result=dict(folder=str(folder))
                elif self.path=='/api/import/sim':result=self.importer.sim_action(request,self.models)
                elif self.path in ('/api/import/preview','/api/import/save','/api/import/recheck'):
                    inventory=self.inventory() if callable(self.inventory) else self.inventory
                    index=self.import_candidates
                    def matching_rows(incoming):
                        # Inventory is already merged/cached. Database rows are
                        # cached by the database/WAL stat, not rebuilt per upload.
                        cache=index if index is not None else ImportCandidateIndex()
                        database_path=Path(self.database.url.database.split('?')[0].removeprefix('file:'))
                        db_stamp=tuple((p.stat().st_mtime_ns,p.stat().st_size) if p.exists() else None for p in (database_path,Path(str(database_path)+'-wal')))
                        with cache.lock:
                            if getattr(cache,'db_stamp',None)!=db_stamp or not hasattr(cache,'native_rows'):
                                with Session(self.database) as session:cache.native_rows=catalog(session)['components']
                                cache.db_stamp=db_stamp
                            native_rows=cache.native_rows
                        # InventoryCache includes import patches already; generic
                        # HTTP test inventories still need the small merge.
                        source=inventory if isinstance(self.inventory,InventoryCache) else merge_inventory(inventory,read_store(self.importer.index))
                        base=(source or {}).get('components',[])
                        selected=cache.select(incoming,base+native_rows,(id(source),db_stamp))
                        categories=selected.categories
                        if self.models:
                            for row in selected:
                                key=row.get('import_key') or (row['id'] if row['id'].startswith('CMP-') else row.get('symbol'))
                                assigned=self.models.assigned(key) if key else None
                                if assigned:row['models']=[m for m in row.get('models',[]) if not m['id'].startswith('LOCAL-')]+[assigned]
                        if self.manual:selected=CandidateRows(self.manual.apply_catalog(selected),categories)
                        return selected
                    if self.path.endswith('/preview'):
                        if request.get('progress'):
                            self.stream_action(lambda progress:self.importer.prepare(request,matching_rows,progress));return
                        result=self.importer.prepare(request,matching_rows)
                    elif self.path.endswith('/recheck'):result=self.importer.recheck(request,matching_rows)
                    else:result=self.importer.save(request,matching_rows,(inventory or {}).get('config'))
                else:raise ValueError('Unknown import action')
                self.json_response(result);return
            if self.path=='/api/inventory/cancel':
                if not isinstance(self.inventory,InventoryCache):raise ApiError('unavailable','Bibliotheksscan nicht konfiguriert.')
                self.json_response(dict(cancel_requested=self.inventory.cancel_scan()));return
            if self.path=='/api/inventory/scan':
                if not isinstance(self.inventory,InventoryCache):raise ApiError('unavailable','Bibliotheksscan nicht konfiguriert.')
                self.stream_action(self.inventory.rescan);return
            if self.path=='/api/setup/scan':
                if not isinstance(self.inventory,InventoryCache):raise ApiError('unavailable','Library setup unavailable.')
                self.stream_action(lambda progress:self.inventory.rescan(progress,setup=request));return
            if self.path=='/api/categories':
                if not isinstance(request,dict):raise ValueError('Category request must be an object.')
                if not self.manual:raise ApiError('unavailable','Local category storage unavailable.')
                inventory=self.inventory() if callable(self.inventory) else self.inventory
                rows=(inventory or {}).get('components',[])
                with Session(self.database) as session:rows=rows+catalog(session)['components']
                rows=self.manual.apply_catalog(rows)
                result=change_categories(self.manual,request.get('items'),{r['id']:r for r in rows},set(category_targets(rows)))
            elif self.path=='/api/manual-data':
                if not self.manual:raise ApiError('unavailable','Manuelle Datenpflege nicht aktiviert. Anwendung neu starten.')
                row=self.editable_part(request['component_id'])
                result=self.manual.save(row,request)
            elif self.path=='/api/manufacturer-parameters/apply':
                if not self.manual:raise ApiError('unavailable','Manuelle Datenpflege nicht aktiviert.')
                row=self.editable_part(request['component_id'])
                result=ManufacturerParameters().apply(row,self.manual,request)
            elif self.path=='/api/models/import':
                if request.get('progress'):
                    self.stream_action(lambda progress:dict(imported=self.models.upload_bundle(request['files'],request.get('source','Eigene Datei'),progress=progress)));return
                result={'imported':self.models.upload_bundle(request['files'],request.get('source','Eigene Datei'))}
            elif self.path=='/api/models/test':
                row=self.part(request['component_id'])
                snapshot=self.model_symbol(request,row)
                key=row.get('import_key') or (request['component_id'] if request['component_id'].startswith('CMP-') else row['symbol'])
                result=self.models.test(request['model_id'],request['biases'],key,request['pins'],snapshot['pins'],snapshot['source'])
            elif self.path=='/api/models/test-diode':
                row=self.part(request['component_id'])
                snapshot=self.model_symbol(request,row)
                key=row.get('import_key') or (request['component_id'] if request['component_id'].startswith('CMP-') else row['symbol'])
                result=self.models.test_diode(request['model_id'],key,request['pins'],snapshot['pins'],request.get('roles'),request.get('confirmed'),snapshot['source'])
            elif self.path=='/api/models/assign':
                row=self.part(request['component_id'])
                snapshot=self.model_symbol(request,row)
                allowed={p['number'] for p in snapshot['pins']}
                if not allowed or not set(request['pins']).issubset(allowed):raise ApiError('pin_mapping','Pinzuordnung passt nicht zum ausgewählten Symbol.')
                key=row.get('import_key') or (request['component_id'] if request['component_id'].startswith('CMP-') else row['symbol'])
                result=self.models.assign(key,request['model_id'],request['pins'],None,snapshot['pins'],request.get('biases'),request.get('diode_roles'),snapshot['source'])
                evidence_row=dict(row,models=[result])
                refresh_simulation_files([evidence_row])
                result=evidence_row['models'][0]
            else:raise ValueError('Unbekannte Aktion.')
            self.json_response(result)
        except (ValueError,KeyError,TypeError,OSError) as error:
            self.json_response(error_payload(error),400)

    def do_GET(self):
        # Block foreign host aliases (DNS rebinding) as well as cross-origin reads.
        host=f'127.0.0.1:{self.server.server_port}'
        if self.headers.get('Host')!=host or self.headers.get('Origin') not in (None,'http://'+host):
            self.json_response(error_payload(ApiError('forbidden','Only local application requests are allowed.')),403);return
        if urlsplit(self.path).path == "/api/startup":
            return StartupHandler.respond(self, b'{"ready":true,"failed":false}', "application/json")
        route = self.path.split("?", 1)[0]
        if route=='/api/setup':
            needed=isinstance(self.inventory,InventoryCache) and not self.inventory.path.exists()
            self.json_response(dict(required=needed,installations=discover_kicad() if needed else []));return
        if route in ('/api/import/settings','/api/import/file'):
            try:
                if not self.importer:raise ValueError('Import not configured')
                if route.endswith('/settings'):
                    inventory=self.inventory() if callable(self.inventory) else self.inventory
                    categories=sorted({r['category'] for r in (inventory or {}).get('components',[]) if r.get('kind')!='footprint' and not r['category'].startswith(('unassigned/','footprints/'))}|{key for key in FIELDS if '/' in key})
                    self.json_response(dict(self.importer.settings(),categories=categories));return
                query=parse_qs(urlsplit(self.path).query);name=query.get('name',[''])[0]
                if Path(name).name!=name or Path(name).suffix.lower()!='.pdf':raise ValueError('Only imported PDF files may be opened')
                path=self.importer.session_path(query['session'][0])/'Dateien'/name
                body=path.read_bytes();self.send_response(200);self.send_header('Content-Type','application/pdf');self.send_header('Content-Length',str(len(body)));self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"sandbox; default-src 'none'");self.end_headers();self.wfile.write(body);return
            except (ValueError,KeyError,OSError) as error:self.json_response(error_payload(error),400);return
        if route=='/api/about':
            try:
                inventory=self.inventory() if callable(self.inventory) else self.inventory
                self.json_response(about_data(self.database,inventory,self.manual,self.models)|{'catalog_api_version':CATALOG_API_VERSION,'inventory_scan_available':isinstance(self.inventory,InventoryCache) and bool((inventory or {}).get('config')) and bool((inventory or {}).get('share'))})
            except (ValueError,KeyError,OSError) as error:self.json_response(error_payload(error),400)
            return
        if route=='/api/manufacturer-parameters':
            try:
                library=ManufacturerParameters();query=parse_qs(urlsplit(self.path).query)
                if 'component' in query:
                    if not self.manual:raise ApiError('unavailable','Manuelle Datenpflege nicht aktiviert.')
                    row=self.editable_part(query['component'][0])
                    result=dict(candidates=[library.preview(row,self.manual,r['id']) for r in library.matches(row)])
                else:result=library.summary()
                self.json_response(result)
            except (ValueError,KeyError,OSError) as error:self.json_response(error_payload(error),400)
            return
        if route=='/api/manual-data':
            try:
                if not self.manual:raise ApiError('unavailable','Manuelle Datenpflege nicht aktiviert. Anwendung neu starten.')
                query=parse_qs(urlsplit(self.path).query)
                row=self.editable_part(query['component'][0]);key=component_key(row)
                override=self.manual.get(key)
                result=dict(override=override,component=self.manual.apply(row,override),original_datasheet=row.get('datasheet',''),fields=fields_for(row),history=self.manual.history(key))
                self.json_response(result)
            except (ValueError,KeyError,OSError) as error:self.json_response(error_payload(error),400)
            return
        if route.startswith('/api/models'):

            try:
                if not self.models:raise ApiError('unavailable','Modellbibliothek nicht aktiviert. Auswahlfenster neu starten.')
                query=parse_qs(urlsplit(self.path).query)
                if route=='/api/models':result=self.models.search(query.get('q',[''])[0])
                elif route=='/api/models/pins':
                    snapshot=symbol_snapshot(self.part(query['component'][0]))
                    result={'pins':snapshot['pins'],'symbol_sha256':(snapshot['source'] or {}).get('sha256'),'symbol_reference':(snapshot['source'] or {}).get('symbol'),'symbol_preview':snapshot['preview']}
                else:raise ValueError('Unbekannte Anfrage.')
                self.json_response(result)
            except (ValueError,KeyError,OSError) as error:self.json_response(error_payload(error),400)
            return
        if route == '/api/categories':
            if not self.manual:self.json_response(error_payload(ApiError('unavailable','Local category storage unavailable.')),503);return
            inventory=self.inventory() if callable(self.inventory) else self.inventory
            rows=(inventory or {}).get('components',[])
            with Session(self.database) as session:rows=rows+catalog(session)['components']
            self.json_response(dict(categories=category_targets(self.manual.apply_catalog(rows))));return
        if route == "/api/info":
            body = json.dumps({'application':'kicad_parts_manager', 'catalog_api_version':CATALOG_API_VERSION,
                               'database':str(self.database.url),
                               'inventory':str(self.inventory.path.resolve()) if isinstance(self.inventory,InventoryCache) else None}).encode()
            mime = "application/json; charset=utf-8"
        elif route.startswith('/api/preview/'):
            inventory=self.inventory() if callable(self.inventory) else self.inventory
            identifier=unquote(route[len('/api/preview/'):])
            row=next((c for c in (inventory or {}).get('components',[]) if c['id']==identifier),None)
            if self.importer:
                try:row=self.editable_part(identifier)
                except ValueError:row=None
            if (row is None or not row.get('source_file')) and identifier.startswith('CMP-'):
                with Session(self.database) as session:
                    mapping=session.get(EdaMapping,identifier)
                    if mapping:
                        symbol=next((c for c in (inventory or {}).get('components',[]) if c.get('symbol')==mapping.kicad_symbol),{})
                        footprint=next((c for c in (inventory or {}).get('components',[]) if c.get('footprint')==mapping.kicad_footprint and c.get('kind')=='footprint'),{})
                        row=dict(symbol,footprint_preview=footprint.get('footprint_preview'),footprint_preview_key=footprint.get('footprint_preview_key'))
            if row is None:
                self.send_error(404);return
            # Upgrade old cached drawings on demand; no complete library scan.
            if row.get('symbol') and row.get('source_file') and (row.get('symbol_preview') or {}).get('preview_version',0)<3:
                try:row['symbol_preview']=symbol_snapshot(row)['preview']
                except (OSError, ValueError, IndexError):pass
            body=json.dumps({'symbol':row.get('symbol_preview'), 'footprint':footprint_geometry(row,(inventory or {}).get('previews',{}).get('footprints',{}))},ensure_ascii=False).encode('utf-8')
            mime='application/json; charset=utf-8'
        elif route in ("/api/catalog", "/api/statistics"):
            compact=parse_qs(urlsplit(self.path).query).get('compact')==['1']
            def build_catalog():
              with Session(self.database) as session:
                inventory = self.inventory() if callable(self.inventory) else self.inventory
                data=catalog(session, inventory)
                if self.importer:data=merge_inventory(data,read_store(self.importer.index))
                if self.models:
                    with self.models.connect() as db:
                        assigned={row['symbol']:self.models.assigned(row['symbol']) for row in db.execute('SELECT symbol FROM assignments')}
                    for row in data['components']:
                        key=row.get('import_key') or (row['id'] if row['id'].startswith('CMP-') else row.get('symbol'))
                        if key in assigned:
                            row['models']=[m for m in row['models'] if not m['id'].startswith('LOCAL-')]+[assigned[key]]
                if self.manual:data['components']=self.manual.apply_catalog(data['components'])
                paths=refresh_simulation_files(data['components'],inventory)
                if inventory and inventory.get('config'):
                    paths.add(str(Path(inventory['config'])/'kicad_common.json'))
                if self.models:
                    paths.update(str(self.models.root/'prepared'/m['id'].removeprefix('LOCAL-')/'model.sha256') for row in data['components'] for m in row.get('models',[]) if m['id'].startswith('LOCAL-'))
                return data,paths
            cached_catalog=bool(self.catalog_cache and (compact or route=='/api/statistics'))
            if cached_catalog:
                raw, compressed_catalog, statistics = self.catalog_cache.get(build_catalog)
                body = raw if route == '/api/catalog' else statistics
            else:
                data,_=build_catalog()
                data=category_statistics(data['components']) if route=='/api/statistics' else compact_catalog(data) if compact else data
                body=json.dumps(data,ensure_ascii=False,allow_nan=False,separators=(',', ':')).encode('utf-8')
            mime = "application/json; charset=utf-8"
        elif route in ("/first-run.js", "/first-run.css", "/startup.js", "/startup.css", "/import", "/import.js", "/import.css", "/", "/catalog", "/home.js", "/context-help.js", "/i18n.js", "/search-profiles.js", "/ui-texts.js", "/home.css", "/design-tokens.css", "/home-background.png", "/app.js", "/about-dialog.js", "/diode-panel.js", "/simulation-coverage.js", "/catalog-utils.js", "/data-coverage.js", "/manufacturer-parameters.js", "/parameter-profiles.js", "/model-wizard.js", "/model-wizard.css", "/manual-editor.js", "/category-dialog.js", "/style.css"):
            name = "home.html" if route == "/" else "index.html" if route == "/catalog" else "import.html" if route == "/import" else route[1:]
            body = (WEB / name).read_bytes()
            mime = 'image/png' if name.endswith('.png') else 'text/css' if name.endswith('.css') else 'text/html' if name.endswith('.html') else 'text/javascript'
            if not name.endswith('.png'):mime += '; charset=utf-8'
        else:
            self.send_error(404)
            return
        compressed = False
        if route == '/api/catalog':
            # Cached bytes are reused only after database/evidence stamp checks.
            for encoding in self.headers.get('Accept-Encoding', '').split(','):
                parts = encoding.strip().lower().split(';')
                if parts[0] != 'gzip':
                    continue
                try:
                    quality = next((float(p.strip()[2:]) for p in parts[1:] if p.strip().startswith('q=')), 1)
                except ValueError:
                    quality = 0
                if quality > 0:
                    body = compressed_catalog if cached_catalog else gzip.compress(body, compresslevel=1)
                    compressed = True
                break
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        if route == '/api/catalog':
            self.send_header('Vary', 'Accept-Encoding')
        if compressed:
            self.send_header('Content-Encoding', 'gzip')
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)


def main():
    parser = argparse.ArgumentParser(description="Lokale KiCad Parts Manager-Bauteilauswahl")
    parser.add_argument("--db", type=Path, default=main_database(Path(__file__).resolve().parents[2]))
    parser.add_argument("--port", type=int, default=4184)
    parser.add_argument("--no-open", action="store_true")
    parser.add_argument("--inventory", type=Path, default=Path(__file__).resolve().parents[2] / "db/library-catalog.json")
    args = parser.parse_args()
    path = args.db.resolve()
    if not path.is_file():
        parser.error(f"Datenbank nicht gefunden: {path}")
    database = create_engine(f"sqlite:///file:{path.as_posix()}?mode=ro&uri=true")
    inventory = InventoryCache(args.inventory)
    models = ModelLibrary(Path(__file__).resolve().parents[2] / 'models/vendor')
    manual = ManualData(Path(__file__).resolve().parents[2] / 'db/manual-data.sqlite')
    startup = Startup({'application':'kicad_parts_manager', 'catalog_api_version':CATALOG_API_VERSION,
                       'database':str(database.url), 'inventory':str(args.inventory.resolve())})
    # Reuse an up-to-date local window, or find a free port next to an older instance.
    server = None
    for port in range(args.port, args.port + 10):
        try:
            server = LocalServer(("127.0.0.1", port), startup)
            break
        except OSError as error:
            if error.errno not in (48, 98, 10048):
                raise
            url = f'http://127.0.0.1:{port}'
            try:
                with urlopen(url + '/api/info', timeout=2) as response:
                    info = json.load(response)
                if info == {'application':'kicad_parts_manager', 'catalog_api_version':CATALOG_API_VERSION,
                            'database':str(database.url), 'inventory':str(args.inventory.resolve())}:
                    print(f'KiCad Parts Manager läuft bereits: {url}', flush=True)
                    if not args.no_open:
                        webbrowser.open(url)
                    database.dispose()
                    return
            except (URLError, ValueError, TimeoutError):
                continue
    if server is None:
        parser.error('Kein freier lokaler Port; vorhandene KiCad Parts Manager-Fenster schließen.')
    url = f"http://127.0.0.1:{server.server_port}"
    print(f"KiCad Parts Manager: {url} — Beenden mit Strg+C", flush=True)
    if not args.no_open:
        webbrowser.open(url)
    def initialize():
        from time import perf_counter
        started = perf_counter()
        try:
            watched=[args.inventory, inventory.import_path, path, manual.path, models.root/'index.sqlite']
            inventory_data=inventory() or {}
            for key in ('config','project'):
                if inventory_data.get(key):watched.extend(Path(inventory_data[key])/name for name in ('sym-lib-table','fp-lib-table','kicad_common.json'))
            watched += [Path(str(p)+'-wal') for p in [path,manual.path,models.root/'index.sqlite']]
            catalog_cache=CatalogResponseCache(watched)
            importer=ComponentImport(inventory.import_path)
            import_candidates=ImportCandidateIndex()
            startup.finish(partial(Handler, database=database, inventory=inventory, models=models, manual=manual,
                                   catalog_cache=catalog_cache, importer=importer, import_candidates=import_candidates))
            print(f'Katalog bereit nach {perf_counter()-started:.2f} s (Cache: {inventory.disk_cache_hit})', flush=True)
        except Exception:
            import traceback
            traceback.print_exc()
            startup.fail()
    Thread(target=initialize, daemon=True, name='catalog-startup').start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        database.dispose()


if __name__ == "__main__":
    main()
