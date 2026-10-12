import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const source=async file=>readFile(new URL('../src/kicad_parts_manager/web/'+file,import.meta.url),'utf8');
const translations=uri(await source('ui-texts.js'));
const i18n=uri((await source('i18n.js')).replace('./ui-texts.js',translations));
const diodeModule=uri((await source('diode-panel.js')).replace('./i18n.js',i18n));
const {diodePanel,diodeSymbolRoles}=await import(diodeModule);
const contextHelp=uri((await source('context-help.js')).replace('./i18n.js',i18n));
const progress=uri((await source('model-wizard.js')).replace('./context-help.js',contextHelp).replace('./diode-panel.js',diodeModule).replace('./i18n.js',i18n));
const {modelWizard,createProgress,requestWithProgress,reportProgress}=await import(progress);
const profiles=uri(await source('parameter-profiles.js'));
const utils=uri((await source('catalog-utils.js')).replace('./parameter-profiles.js',profiles));
const coverage=uri((await source('data-coverage.js')).replace('./catalog-utils.js',utils).replace('./i18n.js',i18n));
const {manufacturerDialog,manufacturerLibraryDialog,manufacturerMatch}=await import(uri((await source('manufacturer-parameters.js')).replace('./model-wizard.js',progress).replace('./i18n.js',i18n)));
const {manualEditor}=await import(uri((await source('manual-editor.js')).replace('./catalog-utils.js',utils).replace('./context-help.js',contextHelp).replace('./model-wizard.js',progress).replace('./data-coverage.js',coverage).replace('./i18n.js',i18n)));
const {aboutDialog}=await import(uri((await source('about-dialog.js')).replace('./model-wizard.js',progress).replace('./i18n.js',i18n)));
function environment(t,respond){
  const dom=new JSDOM('<!doctype html><html lang="de"><body></body></html>',{url:'http://localhost/'});
  const oldDocument=globalThis.document,oldFetch=globalThis.fetch;
  globalThis.document=dom.window.document;const calls=[];
  globalThis.fetch=async(url,options={})=>{const body=options.body?JSON.parse(options.body):null;calls.push({url,body});const result=await respond(url,body);return {ok:result.ok!==false,json:async()=>result.data??result};};
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  t.after(()=>{dom.window.close();globalThis.document=oldDocument;globalThis.fetch=oldFetch;});
  return {document:dom.window.document,event:(node,type)=>node.dispatchEvent(new dom.window.Event(type,{bubbles:true,cancelable:true})),calls};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const component={id:'SYM-1',name:'1N914',kind:'library',symbol:'Diode:1N914',category:'semiconductor/diode/switching',datasheet:'https://vendor.example/data.pdf',values:{},description:'100V 0.3A Small Signal Fast Switching Diode'};

test('SIM calculation and pin-name checks are distinct; original diagnostics remain in the technical report',async t=>{
 let mapping='checked';
 const model={id:'quality-model',name:'D_TEST',type:'D',spice_kind:'D',pins:['A','K'],collection:'Test',filename:'test.lib',source:'Original'};
 const env=environment(t,url=>url.includes('/pins?')?{pins:[{number:'1',name:'A'},{number:'2',name:'K'}]}:url.startsWith('/api/models?q=')?{total:1,candidates:[model],vendor_url:'https://example.com'}:{ok:true,data:{ok:mapping!=='conflict',mapping:{status:mapping,message:'Original diagnostic wording'},note:'Original test conditions',log:'Simulator log'}});
 env.document.documentElement.lang='en';const previous=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>fn();t.after(()=>globalThis.requestAnimationFrame=previous);
 modelWizard(component,()=>assert.fail('must not assign'),()=>env.document.createElement('div'));await tick();await tick();env.document.querySelector('.model-candidates button').click();
 const check=[...env.document.querySelectorAll('button')].find(b=>b.textContent==='Check calculability');
 for(const status of ['checked','unknown','conflict']){mapping=status;check.click();await tick();await tick();
 const summary=env.document.querySelector('.test-summary:not([hidden])').textContent;
 assert.match(summary,/Electrical accuracy and switching behavior: unverified/);
 assert.match(summary,status==='checked'?/Pin names match/:status==='unknown'?/not unambiguous/:/conflict/);
 assert.doesNotMatch(summary,/Original diagnostic wording/);assert.match([...env.document.querySelectorAll('.model-report')].at(-1).textContent,/Original diagnostic wording.*\nOriginal test conditions.*\nSimulator log/);
 }
 assert.equal(env.calls.some(c=>c.url.endsWith('/assign')),false);
});

test('English editor and existing SIM model preserve technical identifiers and original data',async t=>{
 const env=environment(t,()=>({override:{revision:0,values:{}},fields:[],history:[],component,total:0,candidates:[]}));
 env.document.documentElement.lang='en';
 await manualEditor(component,()=>{});
 assert.match(env.document.querySelector('dialog').textContent,/Edit component data/);
 assert.ok(env.document.querySelector('input[type="url"]').value===component.datasheet);
 assert.equal(env.document.querySelector('.dialog-close').getAttribute('aria-label'),'Close');
 env.document.querySelector('.dialog-close').click();
 modelWizard({...component,simulation_fields:{'Sim.Device':'D','Sim.Pins':'1=K 2=A'},models:[]},()=>assert.fail('must not assign'),()=>env.document.createElement('div'),[{intrinsic:true,availability:'present'}]);
 await tick();await tick();
 const existing=env.document.querySelector('.existing-sim').textContent;
 assert.match(existing,/generic/);assert.match(existing,/1=K 2=A/);
 assert.equal(env.calls.some(c=>c.body),false);
});

test('unified editor stages description values and prevents discarding edits during manufacturer review',async t=>{
 const f={key:'voltage_description',label:'Spannungsangabe',unit:'V',factor:1,type:'number'};
 const data={override:{revision:0,values:{}},fields:[f],history:[],component};
 const env=environment(t,()=>data);let saved,reviewed=0;
 await manualEditor(component,c=>saved=c,[],{onManufacturer:()=>reviewed++});
 assert.equal(env.document.querySelectorAll('input[type="url"]').length,1);
 assert.equal(env.document.querySelectorAll('.help-button').length,0);
 const vendor=[...env.document.querySelectorAll('button')].find(b=>b.textContent==='Herstellerdaten prüfen / übernehmen');
 assert.equal(vendor.disabled,false);
 env.document.querySelector('.inline-proposal').click();
 assert.equal(vendor.disabled,true);vendor.click();assert.equal(reviewed,0);
 assert.equal(env.calls.some(c=>c.body),false);
 assert.equal(env.document.querySelector('.editor-evidence').open,true);
 env.event(env.document.querySelector('form'),'submit');await tick();await tick();
 const payload=env.calls.find(c=>c.body).body;
 assert.equal(payload.values.voltage_description.value,100);
 assert.match(payload.values.voltage_description.source,/KiCad-Beschreibung/);
 assert.match(payload.values.voltage_description.conditions,/100V/);
 assert.equal(saved.id,component.id);
 await manualEditor(component,()=>{},[],{onManufacturer:()=>reviewed++});
 [...env.document.querySelectorAll('button')].find(b=>b.textContent==='Herstellerdaten prüfen / übernehmen').click();
 assert.equal(reviewed,1);assert.equal(env.document.querySelector('dialog'),null);
});

test('existing native and assigned models remain visible when additional model search finds nothing',async t=>{
 const env=environment(t,url=>url.startsWith('/api/models/pins')?{pins:[]}:{total:52666,candidates:[]});
 const fields={'Sim.Device':'D','Sim.Pins':'1=K 2=A'};
 modelWizard({...component,name:'1N914WT',simulation_fields:fields,models:[]},()=>assert.fail('must not reassign'),()=>env.document.createElement('div'),[{intrinsic:true,availability:'present'}]);
 await tick();await tick();const native=env.document.querySelector('.existing-sim');assert.match(native.textContent,/Standardmodell D.*generisch/);assert.match(native.textContent,/kein bestätigtes Herstellermodell/);assert.match(native.textContent,/1=K 2=A/);assert.match(native.textContent,/KiCad-Standardwerte/);assert.equal(env.calls.some(c=>c.url.startsWith('/api/models?q=')),false);assert.equal(env.document.querySelector('.sim-selection').hidden,true);env.document.querySelector('.sim-change').click();await tick();await tick();assert.match(env.document.querySelector('.model-candidates').textContent,/vorhandene Modell bleibt erhalten/);
 env.document.querySelector('.dialog-close').click();
 modelWizard({...component,simulation_fields:{},models:[{name:'REAL_DIODE',file:'C:/models/model.lib',file_status:'found',pin_map:[{model_pin_name:'A',symbol_pin:'2'},{model_pin_name:'K',symbol_pin:'1'}]}]},()=>assert.fail('must not reassign'),()=>env.document.createElement('div'));
 assert.match(env.document.querySelector('.existing-sim').textContent,/REAL_DIODE.*C:\/models\/model.lib.*gefunden.*A → 2, K → 1/);
 assert.equal(env.calls.some(c=>c.url==='/api/models/assign'),false);
});

test('SIM wizard has a labelled top-right close button that works during loading',t=>{
 const env=environment(t,()=>new Promise(()=>{}));modelWizard(component,()=>{},()=>env.document.createElement('div'));
 const dialog=env.document.querySelector('dialog'),close=dialog.querySelector(':scope > .actions .dialog-close');
 assert.equal(close.textContent,'×');assert.equal(close.getAttribute('aria-label'),'Schließen');assert.equal(close.disabled,false);close.click();assert.equal(env.document.querySelector('dialog'),null);
});

test('a delayed catalog preview cannot overwrite the current pin-bound symbol snapshot',async t=>{
  let releaseOld;const delayed=new Promise(resolve=>releaseOld=resolve),rendered=[];
  const latest={shapes:[{type:'line',a:[0,0],b:[2,0]}],snapshot:'current'},old={shapes:[{type:'line',a:[0,0],b:[1,0]}],snapshot:'cached'};
  const env=environment(t,url=>url.startsWith('/api/preview/')?delayed:url.startsWith('/api/models/pins')?{pins:[{number:'1',name:'K'},{number:'2',name:'A'}],symbol_sha256:'current-hash',symbol_preview:latest}:{total:0,candidates:[],vendor_url:'https://vendor.example'});
  modelWizard(component,()=>{},geometry=>{rendered.push(geometry);return env.document.createElement('div');});
  await tick();await tick();assert.deepEqual(rendered.at(-1),latest);assert.equal([...env.document.querySelectorAll('button')].find(button=>button.textContent==='Vergrößern').disabled,false);
  releaseOld({symbol:old});await tick();await tick();assert.deepEqual(rendered.at(-1),latest);assert.equal(rendered.some(geometry=>geometry?.snapshot==='cached'),false);
});

test('missing current drawing clears a cached preview and keeps enlargement disabled after loading',async t=>{
  const rendered=[],cached={shapes:[{type:'line',a:[0,0],b:[1,0]}]};
  const env=environment(t,url=>url.startsWith('/api/models/pins')?{pins:[{number:'1',name:'K'},{number:'2',name:'A'}],symbol_sha256:'current-hash',symbol_preview:null}:{total:0,candidates:[],vendor_url:'https://vendor.example'});
  modelWizard({...component,symbol_preview:cached},()=>{},geometry=>{rendered.push(geometry);return env.document.createElement('div');});
  await tick();await tick();assert.equal(rendered.at(-1),null);assert.equal([...env.document.querySelectorAll('button')].find(button=>button.textContent==='Vergrößern').disabled,true);assert.equal(env.document.querySelector('dialog').getAttribute('aria-busy'),'false');
});

test('progress reports measured preparation, resets for unknown durations and ignores finished updates',t=>{
  const env=environment(t,()=>({})),container=env.document.body,work=createProgress(container);
  const finish=work.start('Daten anfordern'),track=container.querySelector('[role="progressbar"]');
  assert.equal(track.hasAttribute('aria-valuenow'),false);assert.equal(container.getAttribute('aria-busy'),'true');
  finish.update('500 von 1.000',50);assert.equal(track.getAttribute('aria-valuenow'),'50');assert.equal(track.firstChild.style.width,'50%');assert.ok(track.classList.contains('determinate'));
  finish.update('Tabelle aufbauen');assert.equal(track.hasAttribute('aria-valuenow'),false);assert.equal(track.firstChild.style.width,'');assert.equal(track.classList.contains('determinate'),false);
  finish();finish();finish.update('Veraltete Aktion',80);assert.equal(container.getAttribute('aria-busy'),'false');assert.equal(track.parentElement.hidden,true);assert.equal(track.hasAttribute('aria-valuenow'),false);
  const next=work.start('Nächste Aktion');assert.equal(track.parentElement.hidden,false);assert.equal(track.hasAttribute('aria-valuenow'),false);next();
});

test('diode panel confirms symbol roles independently of model mapping and invalidates edits',async t=>{
  const env=environment(t,()=>({data:{ok:false,calculated:true,forward_current:-1e-9,reverse_current:-.0004,forward_pass:false,reverse_pass:false,note:'limited',log:'log'}}));
  const previousFrame=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>fn();t.after(()=>globalThis.requestAnimationFrame=previousFrame);
  let finished=0,changed=0,mapping=['1','2'];
  const model={id:'LOCALD',type:'D'},pins=[{number:'1',name:'~'},{number:'2',name:'~'}];
  const panel=diodePanel(model,pins,component,()=>mapping,()=>()=>finished++,()=>changed++);env.document.body.append(panel.node);
  const [anode,cathode]=panel.node.querySelectorAll('select'),confirm=panel.node.querySelector('input'),button=panel.node.querySelector('button');
  assert.equal(button.disabled,true);assert.equal(panel.roles(),null);
  anode.value='2';env.event(anode,'change');cathode.value='1';env.event(cathode,'change');
  assert.equal(button.disabled,true);confirm.checked=true;env.event(confirm,'change');assert.equal(button.disabled,false);
  button.click();await tick();assert.equal(finished,1);assert.deepEqual(env.calls[0].body.roles,{A:'2',K:'1'});assert.deepEqual(env.calls[0].body.pins,['1','2']);
  assert.match(panel.node.textContent,/nicht bestanden/);assert.match(panel.node.textContent,/Genauigkeit und Schaltverhalten bleiben ungeprüft/);
  mapping=['2','1'];panel.invalidate();assert.match(panel.node.textContent,/erneut prüfen/);
  cathode.value='2';env.event(cathode,'change');assert.equal(confirm.checked,false);assert.equal(button.disabled,true);assert.equal(panel.roles(),null);assert.ok(changed>=4);
  assert.equal(diodePanel({...model,type:'X'},pins,component,()=>mapping,()=>()=>{},()=>{}),null);
});

test('diode wizard saves confirmed symbol roles and mapped pins after the limited check',async t=>{
  const model={id:'LOCALD',name:'1N914',type:'D',spice_kind:'D',pins:['A','K'],collection:'Test',filename:'diode.lib',source:'Test'};
  let assigned;
  const env=environment(t,(url)=>{
    if(url.includes('/pins?'))return {pins:[{number:'1',name:'~'},{number:'2',name:'~'}],symbol_sha256:'symbol-revision-hash',symbol_reference:'Diode:Current',symbol_preview:{shapes:[{type:'text',label:'current drawing'}]}};
    if(url.startsWith('/api/models?q='))return {total:1,candidates:[model],vendor_url:'https://vendor.example/'};
    if(url.endsWith('test-diode'))return {ok:true,calculated:true,forward_current:.0004,reverse_current:-1e-9,forward_pass:true,reverse_pass:true,note:'limited',log:'log'};
    if(url.endsWith('/assign'))return {id:'assigned',status:'UNVERIFIED',passed:[]};
    return {};
  });
  const previousFrame=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>fn();t.after(()=>globalThis.requestAnimationFrame=previousFrame);
  const drawn=[];modelWizard({...component,symbol_preview:{shapes:[]}},m=>assigned=m,geometry=>{drawn.push(geometry);return env.document.createElement('div');});
  await tick();await tick();env.document.querySelector('.model-candidates button').click();
  assert.equal(drawn.at(-1).shapes[0].label,'current drawing');
  const dialog=env.document.querySelector('dialog');
  const selects=[...dialog.querySelectorAll('select')];assert.equal(selects.length,2);
  for(const [i,value] of ['2','1'].entries()){selects[i].value=value;env.event(selects[i],'change');}
  const confirm=dialog.querySelector('[aria-label="Symbol-Anode und Kathode geprüft"]');confirm.checked=true;env.event(confirm,'change');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Diodenrichtung prüfen').click();await tick();
  assert.match(dialog.textContent,/Diodenrichtung plausibel/);assert.equal(dialog.getAttribute('aria-busy'),'false');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Zuordnung speichern').click();await tick();
  const saved=env.calls.find(c=>c.url.endsWith('/assign')).body;assert.deepEqual(saved.diode_roles,{A:'2',K:'1'});assert.deepEqual(saved.pins,['2','1']);
  assert.equal(saved.symbol_sha256,'symbol-revision-hash');assert.equal(env.calls.find(c=>c.url.endsWith('test-diode')).body.symbol_sha256,'symbol-revision-hash');
  assert.equal(saved.symbol_reference,'Diode:Current');assert.equal(env.calls.find(c=>c.url.endsWith('test-diode')).body.symbol_reference,'Diode:Current');
  assert.equal(assigned.status,'UNVERIFIED');assert.deepEqual(assigned.passed,[]);assert.equal(env.document.querySelector('dialog'),null);
});
function preview(){return {revision:3,token:'review-token',current_manufacturer:'',current_datasheet:component.datasheet,warnings:['Variante prüfen'],candidate:{id:'vendor-1n914',mpn:'1N914',publisher:'Vendor',package:'DO-35',source:{url:'https://vendor.example/data.pdf',document:'123',revision:'Rev 2',accessed_on:'2026-10-05',review_method:'Reviewed PDF'}},fields:[
  {key:'vrrm',definition:{label:'VRRM',factor:1,unit:'V'},state:'new',after:{value:100,kind:'absolute_maximum',page:'1',conditions:'TA=25'}},
  {key:'if_cont',definition:{label:'IF',factor:1,unit:'A'},state:'protected',before:.3,after:{value:.2,kind:'absolute_maximum',page:'1',conditions:'TA=25'}},
  {key:'vr_max',definition:{label:'VR',factor:1,unit:'V'},state:'different',before:50,after:{value:75,kind:'absolute_maximum',page:'1',conditions:'TA=25'}}]};}
test('manufacturer dialog requires identity review, protects local values and sends explicit catalog conflicts',async t=>{
  let saved;const p=preview(),env=environment(t,(_url,body)=>body?{component,imported:2}:{candidates:[p]});
  await manufacturerDialog(component,c=>saved=c);
  const dialog=env.document.querySelector('dialog'),button=[...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Ausgewählte'));
  assert.equal(button.disabled,true);assert.match(dialog.textContent,/Lokale Ergänzung geschützt/);
  const checks=[...dialog.querySelectorAll('tbody input')];assert.equal(checks[1].disabled,true);assert.equal(checks[2].checked,false);
  checks[2].checked=true;env.event(checks[2],'change');
  const confirm=dialog.querySelector('[aria-label="Hersteller, genaue MPN und Gehäuse geprüft"]');confirm.checked=true;env.event(confirm,'change');
  assert.equal(button.disabled,false);button.click();await tick();
  assert.deepEqual(env.calls[1].body.keys,['vrrm','vr_max']);assert.deepEqual(env.calls[1].body.replace_catalog_keys,['vr_max']);
  assert.equal(env.calls[1].body.preview_token,'review-token');assert.equal(env.calls[1].body.use_manufacturer,true);
  assert.equal(saved,component);assert.equal(env.document.querySelector('dialog'),null);
});
test('manufacturer save error restores controls, clears busy state and retains selections',async t=>{
  const env=environment(t,(_url,body)=>body?{ok:false,data:{error:'Vorschau veraltet'}}:{candidates:[preview()]});
  await manufacturerDialog(component,()=>assert.fail('Must not save'));
  const dialog=env.document.querySelector('dialog'),confirm=dialog.querySelector('[aria-label="Hersteller, genaue MPN und Gehäuse geprüft"]');
  confirm.checked=true;env.event(confirm,'change');const button=[...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Ausgewählte'));
  button.click();assert.equal(dialog.getAttribute('aria-busy'),'true');await tick();
  assert.match(dialog.textContent,/Vorschau veraltet/);assert.equal(button.disabled,false);assert.equal(confirm.checked,true);assert.equal(dialog.getAttribute('aria-busy'),'false');
});

test('same catalog number can gain provenance only after selecting its unchecked option',async t=>{
  const p=preview();p.fields=[{...p.fields[0],state:'same',before:100}];
  const env=environment(t,(_url,body)=>body?{component}:{candidates:[p]});
  await manufacturerDialog(component,()=>{});
  const dialog=env.document.querySelector('dialog'),check=dialog.querySelector('tbody input');
  assert.equal(check.checked,false);assert.equal(check.disabled,false);assert.match(dialog.textContent,/Gleicher Wert/);
  check.checked=true;env.event(check,'change');const confirm=dialog.querySelector('[aria-label="Hersteller, genaue MPN und Gehäuse geprüft"]');confirm.checked=true;env.event(confirm,'change');
  [...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Ausgewählte')).click();await tick();
  assert.deepEqual(env.calls[1].body.replace_catalog_keys,['vrrm']);
});
test('manufacturer source links reject active schemes and library matching excludes MPN suffixes',async t=>{
  const p=preview();p.current_datasheet='javascript:alert(1)';
  const env=environment(t,url=>url.includes('?')?{candidates:[p]}:{version:'1',components:[{...p.candidate,category:component.category,parameter_count:3}]});
  await manufacturerDialog(component,()=>{});assert.ok([...env.document.querySelectorAll('a')].every(a=>a.href.startsWith('https:')));
  env.document.querySelector('dialog').close();await manufacturerLibraryDialog([component,{...component,id:'other',name:'1N914B'}],()=>{},'Test');
  assert.equal([...env.document.querySelectorAll('button')].filter(b=>b.textContent.startsWith('Vorschau:')).length,1);
  const fet={...component,name:'AO3400A',category:'semiconductor/transistor/fet/mosfet/p_channel'},record={mpn:'AO3400A',category:'semiconductor/transistor/fet/mosfet',polarity:'N'};
  assert.equal(manufacturerMatch(fet,record),false);assert.equal(manufacturerMatch({...fet,category:record.category+'/n_channel'},record),true);
});
const field={key:'vrrm',label:'VRRM',unit:'V',factor:1,type:'number',conditions:[{key:'temperature_basis',label:'Temperaturbezug',type:'text',unit:'',options:['TA','TJ']}]};
test('manual editor preserves existing manufacturer metadata on noop and saves temperature reference as text',async t=>{
  const data={override:{revision:2,values:{vrrm:{value:100,source:'Manufacturer PDF',kind:'absolute_maximum',conditions_data:{temperature_basis:'TJ'},updated_at:'2026-10-05T06:00:00Z',source_details:{candidate_id:'vendor-1n914'}}}},fields:[field],history:[],component};
  let saved;const env=environment(t,(_url,body)=>body?{ok:true}:data);
  await manualEditor({...component,values:{vrrm:100}},c=>saved=c);
  const form=env.document.querySelector('form');env.event(form,'submit');await tick();assert.equal(env.calls.length,1);assert.match(form.parentNode.textContent,/Keine Änderungen/);
  const basis=form.querySelector('[aria-label^="Temperaturbezug für VRRM"]');basis.value='TA';env.event(form,'submit');await tick();
  assert.equal(env.calls[1].body.values.vrrm.conditions_data.temperature_basis,'TA');assert.equal(env.calls[1].body.values.vrrm.value,100);assert.equal(env.calls[1].body.values.vrrm.source_details,undefined);assert.equal(saved,component);
});
test('guided proposals do not overwrite a field whose source or condition was edited',async t=>{
  const f={key:'voltage_description',label:'Spannungsangabe',unit:'V',factor:1,type:'number'};
  const env=environment(t,()=>({override:{revision:0,values:{}},fields:[f],history:[]}));
  await manualEditor(component,()=>{},[],{guided:true});
  const origin=env.document.querySelector('[aria-label="Quelle Spannungsangabe"]');origin.value='My source';
  const use=[...env.document.querySelectorAll('button')].find(b=>b.classList.contains('inline-proposal'));
  use.click();assert.equal(env.document.querySelector('[aria-label="Wert Spannungsangabe"]').value,'');assert.match(env.document.querySelector('dialog').textContent,/Eingabe bleibt erhalten/);
});

test('information dialog shows actual data counts and clears progress on errors',async t=>{
  const previous=globalThis.location;globalThis.location={origin:'http://127.0.0.1:4186'};t.after(()=>{globalThis.location=previous;});
  let failed=false,scanFailed=false,refreshed=0;const env=environment(t,url=>url==='/api/inventory/scan'?(scanFailed?{ok:false,data:{error:'Scan failed'}}:{counts:{symbols:5,footprints:2},warnings:0,scanned_at:'2026-10-06T10:00:00Z'}):failed?{ok:false,data:{error:'Datenstand nicht lesbar'}}:{application_version:'0.1.0',python_version:'3.13',catalog_api_version:13,kicad:{version:'10.0.6',path:'kicad-cli'},ngspice:{available:false},manufacturer_pack:{version:'pack',records:120,parameters:1552},inventory:{counts:{symbols:40071,footprints:20000}},local_data:{components:103,parameters:1374,manufacturer_parameters:1374},models:{indexed:52666,assigned:1},paths:{manual:'db/manual-data.sqlite'},inventory_scan_available:true});
  await aboutDialog(()=>{refreshed++;});let dialog=env.document.querySelector('dialog');assert.match(dialog.textContent,/10.0.6/);assert.match(dialog.textContent,/103 Bauteile/);assert.match(dialog.textContent,/außerhalb der Git-Sicherung/);assert.equal(dialog.getAttribute('aria-busy'),'false');
  const scan=[...dialog.querySelectorAll('button')].find(node=>node.textContent==='Bibliotheken neu einlesen');assert.ok(scan);
  scan.click();assert.equal(scan.disabled,true);await tick();await tick();
  assert.equal(refreshed,1);assert.equal(scan.disabled,false);assert.match(dialog.textContent,/5 Symbole, 2 Footprints/);
  scanFailed=true;scan.click();await tick();await tick();assert.match(dialog.textContent,/Scan failed/);
  assert.equal(scan.disabled,false);assert.equal(dialog.querySelector('.dialog-close').disabled,false);assert.equal(dialog.getAttribute('aria-busy'),'false');assert.equal(refreshed,1);
  dialog.close();failed=true;await aboutDialog();dialog=env.document.querySelector('dialog');assert.match(dialog.textContent,/Datenstand nicht lesbar/);assert.equal(dialog.getAttribute('aria-busy'),'false');
});


test('streaming progress handles split UTF-8 messages and rejects errors or missing final results',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);
 const encoder=new TextEncoder();
 const install=events=>{const bytes=encoder.encode(events);globalThis.fetch=async()=>new Response(new ReadableStream({start(controller){for(let offset=0;offset<bytes.length;offset+=3)controller.enqueue(bytes.slice(offset,offset+3));controller.close();}}),{headers:{'content-type':'application/x-ndjson'}});};
 install(JSON.stringify({progress:{phase:'symbols',completed:1,total:2,note:'Prüfen'}})+'\n'+JSON.stringify({result:{count:2}})+'\n');
 const updates=[];assert.deepEqual(await requestWithProgress('/api/test',{},u=>updates.push(u)),{count:2});
 assert.equal(updates[0].note,'Prüfen');assert.equal(updates[0].completed,1);
 install(JSON.stringify({error:'Import failed',code:'invalid_request'})+'\n');await assert.rejects(requestWithProgress('/api/test',{},()=>{}),error=>error.code==='invalid_request'&&error.details==='Import failed'&&error.message!==error.details);
 install(JSON.stringify({progress:{phase:'discover'}})+'\n');await assert.rejects(requestWithProgress('/api/test',{},()=>{}),/interrupted|unterbrochen/i);
});

test('measured phase feedback uses actual counts and returns to animation for discovery',t=>{
 const env=environment(t,()=>({}));env.document.documentElement.lang='en';const container=env.document.createElement('div');env.document.body.append(container);
 const finish=createProgress(container).start('Start');reportProgress(finish,{phase:'symbols',completed:3,total:4});
 const bar=container.querySelector('[role=progressbar]');assert.equal(bar.getAttribute('aria-valuenow'),'75');assert.match(container.textContent,/3 \/ 4/);
 reportProgress(finish,{phase:'discover'});assert.equal(bar.hasAttribute('aria-valuenow'),false);finish();assert.equal(container.getAttribute('aria-busy'),'false');
});


test('scan cancel button sends cancellation and restores controls without refreshing the catalog',async t=>{
 const oldLocation=globalThis.location;globalThis.location={origin:'http://localhost'};t.after(()=>globalThis.location=oldLocation);
 let finishScan,refreshed=0;
 const info={application_version:'test',kicad:{},ngspice:{},manufacturer_pack:{version:'test',records:0,parameters:0},inventory:{counts:{symbols:1,footprints:1}},local_data:{components:0,parameters:0,manufacturer_parameters:0},models:{indexed:0,assigned:0},paths:{},inventory_scan_available:true};
 const env=environment(t,url=>{
  if(url==='/api/inventory/scan')return new Promise(resolve=>finishScan=resolve);
  if(url==='/api/inventory/cancel'){finishScan({ok:false,data:{error:'Cancelled',code:'scan_cancelled'}});return {cancel_requested:true};}
  return info;
 });
 await aboutDialog(()=>refreshed++);const dialog=env.document.querySelector('dialog');
 const scan=[...dialog.querySelectorAll('button')].find(n=>n.textContent==='Bibliotheken neu einlesen');
 const cancel=[...dialog.querySelectorAll('button')].find(n=>n.textContent==='Abbrechen');
 assert.equal(cancel.hidden,true);scan.click();await tick();assert.equal(cancel.hidden,false);assert.ok(cancel.closest('.work-progress'));cancel.click();
 await tick();await tick();assert.equal(refreshed,0);assert.match(dialog.textContent,/Scan abgebrochen.*bisherige Bestand/);
 assert.equal(cancel.hidden,true);assert.equal(scan.disabled,false);assert.equal(dialog.querySelector('.dialog-close').disabled,false);
 assert.equal(dialog.getAttribute('aria-busy'),'false');assert.ok(env.calls.some(c=>c.url==='/api/inventory/cancel'));
});


test('existing model opens without search or writes; import is optional and close preserves assignment',async t=>{
 const env=environment(t,url=>url.includes('/pins?')?{pins:[{number:'1',name:'K'},{number:'2',name:'A'}]}:{total:0,candidates:[],vendor_url:'https://example.com'});
 modelWizard({...component,models:[{name:'KEPT_MODEL',file:'model.lib',pin_map:[]}]},()=>assert.fail('no assignment'),()=>env.document.createElement('div'));
 await tick();await tick();assert.equal(env.calls.some(c=>c.url.includes('?q=')),false);
 assert.equal(env.document.querySelector('.sim-import').open,false);
 env.document.querySelector('.sim-change').click();await tick();await tick();
 assert.equal(env.calls.filter(c=>c.url.includes('?q=')).length,1);
 assert.match(env.document.querySelector('.existing-sim').textContent,/KEPT_MODEL/);
 env.document.querySelector('.dialog-close').click();assert.equal(env.calls.some(c=>c.body),false);
});

test('single diode mapping requires symbol confirmation and resets it on edits; failed save keeps dialog',async t=>{
 const model={id:'D1',name:'D_TEST',type:'D',spice_kind:'D',pins:['A','K'],source:'test'};
 const env=environment(t,url=>url.includes('/pins?')?{pins:[{number:'1',name:'~'},{number:'2',name:'~'}]}:url.includes('?q=')?{total:1,candidates:[model]}:{ok:false,data:{error:'save failed'}});
 modelWizard(component,()=>assert.fail('failed save'),()=>env.document.createElement('div'));await tick();await tick();
 env.document.querySelector('.model-candidates button').click();const dialog=env.document.querySelector('dialog');
 const [a,k]=dialog.querySelectorAll('select');assert.equal(dialog.querySelectorAll('select').length,2);
 a.value='2';env.event(a,'change');k.value='1';env.event(k,'change');
 const save=[...dialog.querySelectorAll('button')].find(b=>b.textContent==='Zuordnung speichern');save.click();await tick();
 assert.equal(env.calls.some(c=>c.url.endsWith('/assign')),false);
 const confirmation=dialog.querySelector('input[type="checkbox"]');confirmation.checked=true;env.event(confirmation,'change');
 a.value='1';env.event(a,'change');assert.equal(confirmation.checked,false);
 a.value='2';env.event(a,'change');confirmation.checked=true;env.event(confirmation,'change');
 save.click();await tick();assert.equal(dialog.open,true);assert.match(dialog.textContent,/save failed/);
 assert.equal(a.value,'2');assert.equal(k.value,'1');assert.equal(save.disabled,false);
});


test('semantic A/K identifiers map and save without a manual confirmation',async t=>{
 const model={id:'D-AK',name:'1N5817',type:'D',spice_kind:'D',pins:['A','K'],source:'test'};let saved;
 const env=environment(t,url=>url.includes('/pins?')?{pins:[{number:'A',name:'~'},{number:'K',name:'~'}]}:url.includes('?q=')?{total:1,candidates:[model]}:{id:'saved'});
 modelWizard(component,m=>saved=m,()=>env.document.createElement('div'));await tick();await tick();env.document.querySelector('.model-candidates button').click();
 const dialog=env.document.querySelector('dialog');assert.match(dialog.textContent,/Anschlüsse erkannt: Anode → A, Kathode → K/);
 assert.equal(dialog.querySelector('.sim-pin-edit').open,false);assert.equal(dialog.querySelector('input[type="checkbox"]').parentElement.hidden,true);
 assert.equal(dialog.querySelector('.pin-hint').hidden,true);
 [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Zuordnung speichern').click();await tick();
 const payload=env.calls.find(c=>c.url.endsWith('/assign')).body;assert.deepEqual(payload.pins,['A','K']);assert.deepEqual(payload.diode_roles,{A:'A',K:'K'});assert.equal(saved.id,'saved');
});

test('role recognition never invents numeric pin functions or overrides explicit names',()=>{
 assert.equal(diodeSymbolRoles([{number:'1',name:'~'},{number:'2',name:'~'}]),null);
 assert.equal(diodeSymbolRoles([{number:'A',name:'OTHER'},{number:'K',name:'~'}]),null);
 assert.equal(diodeSymbolRoles([{number:'1',name:'A'},{number:'2',name:'A'}]),null);
 assert.deepEqual(diodeSymbolRoles([{number:'K',name:'ANODE'},{number:'A',name:'CATHODE'}]),{A:'K',K:'A'});
});


test('custom calculability voltages never leak into the fixed diode direction test',async t=>{
 const model={id:'D-FIXED',name:'D_TEST',type:'D',spice_kind:'D',pins:['A','K'],source:'test'};
 const env=environment(t,url=>url.includes('/pins?')?{pins:[{number:'A',name:'~'},{number:'K',name:'~'}]}:url.includes('?q=')?{total:1,candidates:[model]}:url.endsWith('/test-diode')?{ok:true,calculated:true,forward_current:.00088,reverse_current:.000028,forward_pass:true,reverse_pass:true}:{ok:true,mapping:{status:'checked'}});
 const old=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>fn();t.after(()=>globalThis.requestAnimationFrame=old);
 modelWizard(component,()=>assert.fail('no writes'),()=>env.document.createElement('div'));await tick();await tick();env.document.querySelector('.model-candidates button').click();
 const calculation=env.document.querySelector('.sim-calculation');const voltages=calculation.querySelectorAll('input[type="number"]');assert.equal(voltages.length,2);
 voltages[0].value='2';env.event(voltages[0],'input');voltages[1].value='0';
 [...env.document.querySelectorAll('button')].find(b=>b.textContent==='Diodenrichtung prüfen').click();await tick();
 const fixed=env.calls.find(c=>c.url.endsWith('/test-diode')).body;assert.equal(Object.hasOwn(fixed,'biases'),false);
 const summary=env.document.querySelector('.enrichment-guide .test-summary').textContent;assert.match(summary,/höchstens 1\/10/);assert.match(summary,/nicht gegen eine Datenblattgrenze/);
 const reverseLine=[...env.document.querySelectorAll('.enrichment-guide .test-summary p')].find(p=>p.textContent.startsWith('Sperrrichtung'));assert.doesNotMatch(reverseLine.textContent,/bestanden/);
 [...calculation.querySelectorAll('button')].find(b=>b.textContent==='Berechenbarkeit prüfen').click();await tick();await tick();
 assert.deepEqual(env.calls.find(c=>c.url.endsWith('/test')).body.biases,[2,0]);
});
