from functools import partial
from threading import Thread
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import pytest
from kicad_parts_manager.browser import Handler,LocalServer
from kicad_parts_manager.startup import Startup

@pytest.mark.parametrize('loading',[False,True])
def test_foreign_host_and_origin_reads_denied_before_data_access(loading):
 def forbidden_inventory():raise AssertionError('Inventory must not be accessed')
 handler=Startup({'application':'test'}) if loading else partial(Handler,database=None,inventory=forbidden_inventory)
 server=LocalServer(('127.0.0.1',0),handler)
 thread=Thread(target=server.serve_forever,daemon=True);thread.start()
 base=f'http://127.0.0.1:{server.server_port}'
 try:
  for route in ['/api/info','/api/catalog','/api/import/settings','/']:
   for headers in [{'Host':f'evil.example:{server.server_port}'},{'Origin':'https://evil.example'}]:
    with pytest.raises(HTTPError) as error:urlopen(Request(base+route,headers=headers),timeout=5)
    assert error.value.code==403
  with urlopen(base+'/api/startup',timeout=5) as response:assert response.status==200
 finally:server.shutdown();server.server_close();thread.join(timeout=5)
