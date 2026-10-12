import json,threading
from functools import partial
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import pytest
from kicad_parts_manager.api_errors import ApiError,error_payload
from kicad_parts_manager.browser import Handler,LocalServer,ScanCancelled
from kicad_parts_manager.manual_data import ManualData

def test_stable_codes_do_not_depend_on_diagnostic_language():
    for text in ['Ungültige Eingabe','Invalid input','<script>untrusted</script>']:
        assert error_payload(ValueError(text))==dict(code='invalid_request',error=text,details=text)
    assert error_payload(OSError('locked'))['code']=='file_error'
    assert error_payload(ApiError('stale_data','original'))['code']=='stale_data'
    assert error_payload(ScanCancelled('cancelled'))['code']=='scan_cancelled'

def test_http_revision_conflict_preserves_saved_values(tmp_path):
    row=dict(id='SYM-R',symbol='Test:R',category='semiconductor/diode/switching',values={})
    manual=ManualData(tmp_path/'manual.sqlite')
    server=LocalServer(('127.0.0.1',0),partial(Handler,database=None,inventory={'components':[row]},manual=manual))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base=f'http://127.0.0.1:{server.server_port}'
    def request(origin=base):
        return Request(base+'/api/manual-data',data=json.dumps(dict(component_id='SYM-R',revision=0,values=dict(vr_max=dict(value=100,source='Original')))).encode(),headers={'Content-Type':'application/json','Origin':origin})
    try:
        with urlopen(request()) as response:assert json.load(response)['revision']==1
        before=manual.get('symbol:Test:R')
        with pytest.raises(HTTPError) as conflict:urlopen(request())
        payload=json.load(conflict.value)
        assert payload['code']=='stale_data' and payload['details']==payload['error']
        assert manual.get('symbol:Test:R')==before
        with pytest.raises(HTTPError) as forbidden:urlopen(request('https://example.com'))
        assert json.load(forbidden.value)['code']=='forbidden'
    finally:server.shutdown();server.server_close();thread.join()
