from test_component_import import prepare,existing,service

def test_reimport_preserves_existing_category_without_override_flag(service):
 proposal=prepare(service);service.save(dict(session=proposal['session'],choices={}),[])
 rows=existing(service);rows[0]['category']='semiconductor/diode/zener'
 assert not rows[0].get('category_override')
 repeated=prepare(service,rows=rows)
 assert repeated['items'][0]['existing']
 assert repeated['items'][0]['category']=='semiconductor/diode/zener'

