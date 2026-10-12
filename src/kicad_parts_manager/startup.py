"""Serve a small status page while the local application initializes."""
import json
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from threading import Lock
from time import monotonic
from urllib.parse import urlsplit

WEB = Path(__file__).with_name('web')


class Startup:
    def __init__(self, info):
        self.info = info
        self.lock = Lock()
        self.factory = None
        self.phase = 'catalog'
        self.started = monotonic()
        self.failed = False

    def finish(self, factory):
        with self.lock:
            self.factory = factory

    def fail(self):
        with self.lock:
            self.failed = True

    def status(self):
        with self.lock:
            return dict(ready=self.factory is not None, failed=self.failed,
                        phase=self.phase, elapsed=round(monotonic()-self.started))

    def __call__(self, request, address, server):
        # Keep status/assets available across the handover, including tabs that
        # are still loading their scripts when initialization completes.
        with self.lock:
            factory = self.factory
        if factory:
            factory(request, address, server)
        else:
            StartupHandler(request, address, server, startup=self)


class StartupHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, startup, **kwargs):
        self.startup = startup
        super().__init__(*args, **kwargs)

    def do_GET(self):
        host = f'127.0.0.1:{self.server.server_port}'
        if self.headers.get('Host') != host or self.headers.get('Origin') not in (None, 'http://'+host):
            return self.respond(b'{"code":"forbidden"}', 'application/json', 403)
        route = urlsplit(self.path).path
        if route == '/api/info':
            return self.respond(json.dumps(self.startup.info).encode(), 'application/json')
        if route == '/api/startup':
            return self.respond(json.dumps(self.startup.status()).encode(), 'application/json')
        assets = {'/startup.js':'text/javascript', '/startup.css':'text/css',
                  '/i18n.js':'text/javascript', '/ui-texts.js':'text/javascript',
                  '/design-tokens.css':'text/css'}
        if route in assets:
            return self.respond((WEB/route[1:]).read_bytes(), assets[route])
        if route.startswith('/api/'):
            return self.respond(b'{"code":"unavailable"}', 'application/json', 503)
        return self.respond((WEB/'startup.html').read_bytes(), 'text/html')

    def respond(self, body, mime, status=200):
        self.send_response(status)
        self.send_header('Content-Type', mime+'; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)
