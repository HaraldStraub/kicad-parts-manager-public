import json
from functools import partial
from threading import Thread
from urllib.request import urlopen

from kicad_parts_manager.browser import Handler, LocalServer
from kicad_parts_manager.startup import Startup


def test_loading_page_and_handover_without_catalog_access():
    startup = Startup({'application':'test'})
    server = LocalServer(('127.0.0.1', 0), startup)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f'http://127.0.0.1:{server.server_port}'
    try:
        with urlopen(url+'/import') as response:
            assert b'startup.js' in response.read()
            assert "script-src 'self'" in response.headers['Content-Security-Policy']
        with urlopen(url+'/api/startup') as response:
            assert json.load(response)['ready'] is False
        with urlopen(url+'/api/info') as response:
            assert json.load(response)=={'application':'test'}
        startup.finish(partial(Handler, database=None))
        with urlopen(url+'/api/startup') as response:
            assert json.load(response)['ready'] is True
        # A startup tab may request its script after the server became ready.
        with urlopen(url+'/startup.js') as response:
            assert b'location.reload()' in response.read()
        with urlopen(url+'/') as response:
            assert b'home.js' in response.read()
    finally:
        server.shutdown(); server.server_close(); thread.join()


def test_failed_start_remains_visible():
    startup = Startup({})
    startup.fail()
    assert startup.status()['failed'] is True
    assert startup.status()['ready'] is False
