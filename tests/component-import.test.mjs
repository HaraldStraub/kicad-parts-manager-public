import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const file=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const texts=uri(await file('ui-texts.js'));
const i18n=uri((await file('i18n.js')).replace('./ui-texts.js',texts));
const profileUri=uri(await file('parameter-profiles.js'));
const catalogUri=uri((await file('catalog-utils.js')).replace('./parameter-profiles.js',profileUri));
const contextUri=uri((await file('context-help.js')).replace('./i18n.js',i18n));
const diodeUri=uri((await file('diode-panel.js')).replace('./i18n.js',i18n));
const wizardUri=uri((await file('model-wizard.js')).replace('./i18n.js',i18n).replace('./context-help.js',contextUri).replace('./diode-panel.js',diodeUri));
const code=(await file('import.js')).replace('./model-wizard.js',wizardUri).replace('./catalog-utils.js',catalogUri).replace('./i18n.js',i18n).replace('./parameter-profiles.js',profileUri);
const {initImport}=await import(uri(code));
const html=await file('import.html');
const proposal={session:'a'.repeat(32),folder:'C:/Documents/user-library',notes:['orientation_unverified'],assets:[],items:[{id:'USR-one',name:'1N4148W',kind:'library',category:'semiconductor/diode/switching',state:'conflict',reason:'Existing values differ: vf',existing:true,changes:[{key:'vf',before:1,after:.8},{key:'power',before:null,after:2}],assets:[{key:'library_files',available:true,present:true},{key:'simulation',available:true,present:true}],pins:[[{model_pin_name:'A',symbol_pin:'2'}]],preview:{shapes:[{type:'line',a:[0,0],b:[4,0]}],flip_y:true}}]};
const tick=()=>new Promise(r=>setTimeout(r,0));

async function app(){
 const dom=new JSDOM(html,{url:'http://127.0.0.1:4186/import'});globalThis.document=dom.window.document;
 const calls=[];
 const mock=async(url,options={})=>{calls.push({url,data:options.body?JSON.parse(options.body):null});let value;
  if(url==='/api/import/settings')value={folder:proposal.folder,locked:false,categories:['passive/resistor','semiconductor/diode/switching']};
  else if(url==='/api/import/preview')value=structuredClone(proposal);
  else if(url==='/api/import/sim'){const data=JSON.parse(options.body);value=data.action==='pins'?{pins:proposal.items[0].symbol_pins||[]}:data.action==='assign'?{assignment:{model_id:'sim-main',pins:data.pins},name:'main'}:{total:1,candidates:proposal.items[0].sim_candidates?.length?[{id:'DRAFT-sim-main',name:'main',type:'X',spice_kind:'SUBCKT',pins:['A','K'],terminal_info:[{suggested:'1'},{suggested:'2'}],source:'Import',collection:'Import'}]:[]};}
  else if(url==='/api/import/save')value={receipt:{run_id:'run',added:0,unchanged:false},registration:'registered',reference:['KPM_123:1N4148W']};
  else value={};return {ok:true,json:async()=>value};};
 const storage=new Map();const ctl=initImport(dom.window.document,{fetchData:mock,storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
 await tick();ctl.addFiles([{name:'diode.zip',size:3,lastModified:1,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}]);
 await dom.window.document.getElementById('preview-open').onclick();
 return {dom,calls,ctl};
}
test('default supplement protects existing values and files, and selects missing data',async()=>{
 const {dom}=await app();const doc=dom.window.document;
 assert.equal(doc.documentElement.lang,'en');assert.equal(doc.querySelector('.import-item select').value,proposal.items[0].category);
 assert.equal(doc.querySelector('[data-key=vf]').disabled,true);assert.equal(doc.querySelector('[data-key=power]').checked,true);
 assert.equal(doc.querySelector('[data-asset=library_files]').disabled,true);
 assert.equal(doc.getElementById('import-save').hidden,false);assert.equal(doc.getElementById('upload-section').hidden,false);
 assert.ok(doc.getElementById('import-notes').textContent.includes('not verified'));
});
test('replace sends only explicitly checked data and files',async()=>{
 const {dom,calls}=await app();const doc=dom.window.document;
 const mode=[...doc.querySelectorAll('.import-item select')].find(s=>s.querySelector('[value=replace]'));mode.value='replace';mode.onchange();
 assert.equal(doc.querySelector('[data-key=vf]').checked,false);assert.equal(doc.querySelector('[data-asset=library_files]').checked,false);
 doc.querySelector('[data-key=vf]').checked=true;doc.querySelector('[data-key=power]').checked=false;
 doc.querySelector('[data-asset=library_files]').checked=true;
 await doc.getElementById('import-save').onclick();
 assert.deepEqual(calls.find(c=>c.url==='/api/import/save').data.choices['USR-one'],{mode:'replace',keys:['vf'],fields:[],assets:['library_files']});
 assert.equal(doc.getElementById('complete-section').hidden,false);assert.ok(doc.getElementById('import-registration').textContent.includes('Restart'));
});
test('cancel preview never calls save',async()=>{
 const {dom,calls}=await app();await dom.window.document.getElementById('import-cancel').onclick();
 assert.ok(calls.some(c=>c.url==='/api/import/cancel'));assert.ok(!calls.some(c=>c.url==='/api/import/save'));
 assert.equal(dom.window.document.getElementById('upload-section').hidden,false);
});
test('landing page links to a real import page',async()=>{
 const dom=new JSDOM(await file('home.html'));assert.ok(dom.window.document.querySelector('.workspace-card h2 a[href="/import"]'));
});

test('wrong dropped files can be removed individually and the selection cleared',async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/import'});globalThis.document=dom.window.document;
 const ctl=initImport(dom.window.document,{storage:{getItem:()=>null},fetchData:async()=>({ok:true,json:async()=>({folder:'test',locked:false})})});
 ctl.addFiles([{name:'wrong.zip',size:3},{name:'right.zip',size:4}]);
 const doc=dom.window.document;assert.equal(doc.querySelectorAll('#chosen-files li').length,2);
 doc.querySelector('#chosen-files button').click();assert.equal(doc.querySelectorAll('#chosen-files li').length,1);
 assert.ok(doc.getElementById('file-count').textContent.includes('not saved'));
 doc.getElementById('files-clear').click();assert.equal(doc.getElementById('file-selection').hidden,true);
 assert.equal(doc.getElementById('preview-open').disabled,true);
});

test('back to files keeps selection and inline category creation is sent only on save',async()=>{
 const {dom,calls}=await app();const doc=dom.window.document;
 const parent=doc.querySelector('[aria-label="Parent category"]');parent.value='passive/resistor';
 doc.querySelector('[aria-label="New category name"]').value='Precision';
 [...doc.querySelectorAll('button')].find(b=>b.textContent==='Create and select').click();
 assert.equal(doc.querySelector('.category-results').value,'passive/resistor/Precision');
 assert.equal(calls.filter(c=>c.url==='/api/import/save').length,0);
 await doc.getElementById('import-save').onclick();
 assert.deepEqual(calls.find(c=>c.url==='/api/import/save').data.new_categories,['passive/resistor/Precision']);
});
test('back to file selection retains dropped files',async()=>{
 const {dom}=await app();const doc=dom.window.document;
 await doc.getElementById('import-cancel').onclick();
 assert.equal(doc.querySelectorAll('#chosen-files li').length,1);
 assert.equal(doc.getElementById('preview-open').disabled,false);
 assert.equal(doc.getElementById('review-section').hidden,true);
});

test('parameter entries are sent with the selected component in catalog units',async()=>{
 const {dom,calls}=await app();const doc=dom.window.document;
 const field=[...doc.querySelectorAll('.import-parameters input')].find(i=>i.getAttribute('aria-label').includes('(V)'));
 assert.ok(field);field.value='0.72';await doc.getElementById('import-save').onclick();
 const saved=calls.find(c=>c.url==='/api/import/save');assert.ok(saved);
 assert.ok(Object.values(saved.data.parameter_values['USR-one']).includes(.72));
});

test('language change preserves parameter edits and chosen category',async()=>{
 const {dom}=await app();const doc=dom.window.document;
 const input=[...doc.querySelectorAll('.import-parameters input')].find(i=>i.type==='number');const label=input.getAttribute('aria-label');input.value='42';
 const language=doc.getElementById('language-select');language.value='de';language.dispatchEvent(new dom.window.Event('change'));
 assert.ok([...doc.querySelectorAll('.import-parameters input')].some(i=>i.value==='42'));
 assert.equal(doc.querySelector('.category-results').value,'semiconductor/diode/switching');
});

test('manufacturer is optional in preview and changing it blocks saving until recheck',async()=>{
 const {dom,calls}=await app();const doc=dom.window.document;
 assert.equal(doc.querySelector('#upload-section .manufacturer-label'),null);
 const maker=doc.querySelector('.item-details .manufacturer-label input');assert.ok(maker);
 maker.value='onsemi';maker.dispatchEvent(new dom.window.Event('input'));
 assert.equal(doc.getElementById('import-save').disabled,true);
 await doc.getElementById('import-save').onclick();
 assert.equal(calls.filter(c=>c.url==='/api/import/save').length,0);
 assert.ok([...doc.querySelectorAll('button')].some(b=>b.textContent==='Update match'&&!b.hidden));
});

test('three side-by-side stages separate files, preview and parameter editing',async()=>{
 const {dom}=await app();const doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.import-workspace > .step-column').length,3);
 assert.ok(doc.querySelector('.files-column #upload-section'));
 assert.ok(doc.querySelector('.preview-column #import-items'));
 assert.ok(doc.querySelector('.parameters-column .import-parameters'));
 assert.ok(doc.querySelector('.parameters-column #import-save'));
 assert.equal(doc.querySelector('.category-label > details').open,false);
 assert.equal(doc.getElementById('import-save').hidden,false);
});
test('labelled previews enlarge inline and single-part selection stays implicit',async()=>{
 const {dom}=await app();const doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.preview-card').length,2);
 assert.equal(doc.querySelector('.single-component input').hidden,true);
 const zoom=doc.querySelector('.preview-card button');zoom.click();
 assert.ok(doc.querySelector('.preview-card.expanded'));zoom.click();assert.equal(doc.querySelector('.preview-card.expanded'),null);
 assert.ok(doc.querySelector('.category-label .action-details'));
});
test('new components show automatic file statuses while keeping simulation selectable',async()=>{
 const old=structuredClone(proposal.items[0]);
 try{proposal.items[0].existing=false;proposal.items[0].state='new';
 const {dom,calls}=await app();const doc=dom.window.document;
 assert.equal(doc.querySelector('[data-asset=library_files]').hidden,true);
 assert.ok(doc.querySelector('.asset-status').textContent.includes('included'));
 assert.equal(doc.querySelector('[data-asset=simulation]').hidden,false);
 doc.querySelector('[data-asset=simulation]').checked=false;
 await doc.getElementById('import-save').onclick();
 assert.deepEqual(calls.find(c=>c.url==='/api/import/save').data.choices['USR-one'].assets,['library_files']);
 }finally{proposal.items[0]=old;}
});


test('shared SIM wizard assigns only to the import draft and keeps parameter inputs',async()=>{
 const original=structuredClone(proposal.items[0]);
 try {
  Object.assign(proposal.items[0],{existing:false,state:'new',changes:[],pins:[],assets:[{key:'simulation',available:true,pending:true,present:false}],symbol_pins:[{number:'1',name:'A'},{number:'2',name:'K'}],sim_candidates:[{id:'sim-main',name:'main'}]});
  const {dom,calls}=await app(),doc=dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  const sim=doc.querySelector('.sim-import');assert.ok(sim.textContent.includes('save without SIM'));
  const open=sim.querySelector('button');open.click();await tick();
  assert.ok(doc.querySelector('dialog.model-wizard'));
  // An already-open page may lack the new stylesheet: opening the dialog loads it.
  assert.equal(doc.querySelector('link[data-model-wizard-style]').getAttribute('href'),'/model-wizard.css?v=50');
  assert.equal(doc.querySelector('dialog.model-wizard style'),null); // CSP forbids inline styles.
  assert.ok(calls.some(c=>c.url==='/api/import/sim'&&c.data.action==='pins'));
  assert.ok(!calls.some(c=>c.url==='/api/models/assign'));
  const parameter=doc.querySelector('.import-parameters input');parameter.value='2';
  doc.querySelector('dialog.model-wizard .dialog-close').click();
  assert.equal(doc.querySelector('dialog.model-wizard'),null);
  assert.equal(parameter.value,'2');
  open.click();await tick();await tick();
  const use=[...doc.querySelectorAll('dialog.model-wizard button')].find(b=>b.textContent==='Use & close window');assert.ok(use);
  const mapping=doc.querySelectorAll('dialog.model-wizard table select');
  mapping[1].value='1';use.click();await tick();
  assert.ok(doc.querySelector('dialog.model-wizard'));
  assert.ok(doc.querySelector('.test-summary').textContent.includes('selected more than once'));
  assert.ok(!calls.some(c=>c.url==='/api/import/sim'&&c.data.action==='assign'));
  mapping[1].value='2';use.click();await tick();
  assert.equal(doc.querySelector('dialog.model-wizard'),null);assert.equal(parameter.value,'2');
  assert.ok(!calls.some(c=>c.url==='/api/import/save'));
  const language=doc.getElementById('language-select');language.value='de';language.dispatchEvent(new dom.window.Event('change'));
  await doc.getElementById('import-save').onclick();
  assert.deepEqual(calls.find(c=>c.url==='/api/import/save').data.sim_assignments['USR-one'],{model_id:'sim-main',pins:['1','2']});
 } finally {proposal.items[0]=original;}
});
