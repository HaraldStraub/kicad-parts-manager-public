import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const source=async file=>readFile(new URL('../src/kicad_parts_manager/web/'+file,import.meta.url),'utf8');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const modules={};
for(const name of ['ui-texts.js','i18n.js','search-profiles.js','context-help.js','parameter-profiles.js','diode-panel.js','model-wizard.js','catalog-utils.js','data-coverage.js','simulation-coverage.js','manual-editor.js','manufacturer-parameters.js','about-dialog.js','category-dialog.js','app.js']){
  let code=await source(name);
  for(const [dependency,url] of Object.entries(modules))code=code.replaceAll('./'+dependency,url);
  modules[name]=uri(code);
}
const html=await source('index.html');

test('category batch selection saves, undoes and restores automatic classification',async t=>{
 const dom=new JSDOM(html,{url:'http://localhost/catalog'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 Object.assign(globalThis,{document:dom.window.document,localStorage:dom.window.localStorage,location:dom.window.location,requestAnimationFrame:fn=>setImmediate(fn)});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const rows=[component('one','A'),component('two','B')],posted=[];
 globalThis.fetch=async(url,options)=>{
  if(url==='/api/categories'&&!options)return {ok:true,json:async()=>({categories:[diode,'switches/pushbutton']})};
  if(url==='/api/categories'){
   const {items}=JSON.parse(options.body);posted.push(items);
   return {ok:true,json:async()=>({changes:items.map(item=>{
    const row=rows.find(r=>r.id===item.component_id),previous_category=row.category_override??null;
    Object.assign(row,{automatic_category:diode,category_override:item.category,category:item.category??diode,category_revision:item.revision+1});
    return {...row,component_id:row.id,previous_category};
   })})};
  }
  return {ok:true,json:async()=>({components:structuredClone(rows)})};
 };
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#category-batch');
 const d=dom.window.document,settle=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
 const selectRows=()=>{for(const check of d.querySelectorAll('.category-select')){check.checked=true;check.dispatchEvent(new dom.window.Event('change',{bubbles:true}));}};
 selectRows();assert.equal(d.getElementById('category-count').textContent,'2 selected');d.getElementById('category-change').click();await settle();
 let dialog=d.querySelector('.category-dialog'),target=dialog.querySelector('select');target.value='switches/pushbutton';target.dispatchEvent(new dom.window.Event('change'));dialog.querySelector('.dialog-actions').lastChild.click();await settle();
 assert.equal(posted[0].length,2);assert.ok(rows.every(r=>r.category==='switches/pushbutton'));assert.equal(d.getElementById('category-undo').hidden,false);
 d.getElementById('category-undo').click();await settle();assert.ok(rows.every(r=>r.category===diode&&r.category_override===null));
 selectRows();d.getElementById('category-change').click();await settle();dialog=d.querySelector('.category-dialog');dialog.querySelector('.dialog-actions').firstChild.click();await settle();
 assert.ok(posted.at(-1).every(item=>item.category===null));assert.equal(d.querySelector('.category-dialog'),null);
});

test('short search opens the N-MOSFET tree, applies SI filters and supports reassignment without changing data',async t=>{
 const path='semiconductor/transistor/fet/mosfet/n_channel';
 const rows=[{...component('mos1','MOS60',{vds_max:60,id_cont:5,gate_voltage_abs:20}),category:path},
 {...component('mos2','MOS100',{vds_max:100,id_cont:10,gate_voltage_abs:10}),category:path},
 {...component('mos3','MOS30',{vds_max:30,id_cont:2}),category:path}];
 const original=JSON.stringify(rows),dom=new JSDOM(html,{url:'http://localhost/catalog?q=NFET%2060V'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.location=dom.window.location;globalThis.requestAnimationFrame=fn=>setImmediate(fn);
 globalThis.fetch=async()=>({ok:true,json:async()=>({components:JSON.parse(original)})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#short-search');const d=dom.window.document,event=(node,type)=>node.dispatchEvent(new dom.window.Event(type,{bubbles:true})),names=()=>[...d.querySelectorAll('#rows tr')].map(r=>r.firstChild.textContent);
 const enter=()=>d.getElementById('search').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 assert.deepEqual(names(),['MOS60','MOS100']);assert.match(d.getElementById('breadcrumb').textContent,/N.channel/i);
 assert.ok([...d.querySelectorAll('#tree [data-category="'+path+'"]')][0].classList.contains('active'));
 for(const details of d.querySelector('[data-category="'+path+'"]').parentElement.parentElement.closest('details').querySelectorAll('details'))assert.equal(details.open,true);
 assert.equal(d.querySelector('#short-search select').value,'vds_max');
 const assignment=d.querySelector('#short-search select');assignment.value='gate_voltage_abs';event(assignment,'change');
 assert.deepEqual(names(),[]);assert.ok([...d.querySelectorAll('#columns input[type="number"]')].some(x=>x.value==='60'));
 const search=d.getElementById('search');search.value='NFET 60V 20V';event(search,'input');enter();
 assert.equal(d.querySelectorAll('#short-search select').length,2);assert.ok([...d.querySelectorAll('#short-search select')].every(s=>s.value===''));
 let selections=d.querySelectorAll('#short-search select');selections[0].value='vds_max';event(selections[0],'change');
 selections=d.querySelectorAll('#short-search select');selections[1].value='gate_voltage_abs';event(selections[1],'change');assert.deepEqual(names(),['MOS60']);
 search.value='NFET VDS=100V';event(search,'input');enter();assert.deepEqual(names(),['MOS100']);
 const language=d.getElementById('language-select');language.value='de';event(language,'change');assert.equal(search.value,'NFET VDS=100V');assert.deepEqual(names(),['MOS100']);assert.equal(d.querySelector('#short-search select').value,'vds_max');
 d.getElementById('reload').click();for(let i=0;i<20&&d.getElementById('reload').disabled;i++)await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(names(),['MOS100']);assert.ok([...d.querySelectorAll('#columns input[type="number"]')].some(x=>x.value==='100'));
 assert.equal(d.querySelector('#short-search select').value,'vds_max');assert.equal(JSON.stringify(rows),original);
 d.getElementById('reset').click();assert.equal(d.getElementById('short-search').hidden,true);assert.equal(search.value,'');assert.equal(names().length,3);
});

test('simulation workspace starts with existing models and incomplete entries are explicitly selectable',async t=>{
 const dom=new JSDOM(html,{url:'http://localhost/catalog?workspace=simulation'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 dom.window.localStorage.setItem('kicad-parts-manager-language','de');globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.location=dom.window.location;globalThis.requestAnimationFrame=fn=>setImmediate(fn);
 const native={...component('native','1N914WT'),simulation_fields:{'Sim.Device':'D','Sim.Pins':'1=K 2=A'}};
 const prepared={...component('prepared','LED'),simulation_fields:{'Sim.Pins':'1=K 2=A'}};
 const graphic={...component('graphic','Logo'),category:'schematic_aids/graphics',simulation_fields:{'Sim.Enable':'0'}};
 globalThis.fetch=async()=>({ok:true,json:async()=>({components:[native,prepared,graphic]})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#simulation-default');const d=dom.window.document,names=()=>[...d.querySelectorAll('#rows tr')].map(row=>row.firstChild.textContent);
 assert.equal(d.getElementById('model-availability').value,'present');assert.deepEqual(names(),['1N914WT']);
 const availability=d.getElementById('model-availability');availability.value='';availability.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.deepEqual(names(),['1N914WT','LED']);
 availability.value='incomplete';availability.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.deepEqual(names(),['LED']);
});
const diode='semiconductor/diode/zener';
function component(id,name,values={},manual_data){return {id,name,values,manual_data,kind:'library',category:diode,symbol:'Diode:'+name,library:'Diode',description:'Zener diode',parameters:[],models:[],datasheet:'https://example.com/'+name+'.pdf',footprint:'Diode_SMD:D_MiniMELF'};}

test('landing query starts the catalog with search, kind and workspace',async t=>{
  const dom=new JSDOM(html,{url:'http://localhost/catalog?q=BZV55C5V1&kind=library&workspace=schematic'}),previous={};
  for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
  dom.window.localStorage.setItem('kicad-parts-manager-language','de');globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.location=dom.window.location;globalThis.requestAnimationFrame=fn=>setImmediate(fn);
  globalThis.fetch=async()=>({ok:true,json:async()=>({components:[component('one','BZV55C3V3'),component('two','BZV55C5V1')]})});
  t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
  await import(modules['app.js']+'#landing-query');
  const d=dom.window.document;assert.equal(d.getElementById('search').value,'BZV55C5V1');assert.equal(d.getElementById('kind').value,'library');assert.equal(d.getElementById('workspace-view').value,'');assert.deepEqual([...d.querySelectorAll('#rows tr')].map(row=>row.firstChild.textContent),['BZV55C5V1']);
  assert.equal(d.querySelector('.brand-link').getAttribute('href'),'/');
});

test('large catalog preparation yields with actual progress and a failed reload restores interaction',async t=>{
  const dom=new JSDOM(html,{url:'http://localhost/'}),previous={},frames=[];
  for(const key of ['document','localStorage','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
  dom.window.localStorage.setItem('kicad-parts-manager-language','de');globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;
  globalThis.requestAnimationFrame=fn=>setImmediate(()=>{const track=dom.window.document.querySelector('body>.work-progress [role="progressbar"]');frames.push({percent:track?.getAttribute('aria-valuenow'),blocked:dom.window.document.querySelector('main').inert,message:track?.getAttribute('aria-label')});fn();});
  let fail=false;
  globalThis.fetch=async()=>{if(fail)throw Error('Verbindung unterbrochen');return {ok:true,json:async()=>({components:Array.from({length:1201},(_,i)=>component('large-'+i,'Part'+i))})};};
  t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
  await import(modules['app.js']+'#large-progress');
  const measured=frames.filter(frame=>frame.percent!==null&&frame.percent!==undefined);
  assert.ok(measured.length>1);assert.ok(measured.some(frame=>Number(frame.percent)>0&&Number(frame.percent)<100));assert.equal(measured.at(-1).percent,'100');
  assert.ok(measured.every(frame=>frame.blocked));assert.match(measured.at(-1).message,/1\.201 von 1\.201/);
  const d=dom.window.document;assert.equal(d.querySelector('body>.work-progress').hidden,true);assert.equal(d.querySelector('main').inert,false);assert.equal(d.getElementById('reload').disabled,false);
  for(const [id,value] of [['tree-mode','library'],['tree-mode','category'],['workspace-view','simulation']]){
    const control=d.getElementById(id);control.value=value;control.dispatchEvent(new dom.window.Event('change'));
    assert.equal(d.querySelector('body>.work-progress').hidden,false);assert.equal(d.querySelector('main').inert,true);
    const start=frames.length;
    for(let i=0;i<10&&!d.querySelector('body>.work-progress').hidden;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.ok(frames.slice(start).some(f=>f.message==='Ansicht wird aufgebaut …'&&f.blocked));
    assert.equal(d.querySelector('main').inert,false);assert.equal(d.querySelector('body>.work-progress').hidden,true);
  }
  fail=true;d.getElementById('reload').click();
  for(let i=0;i<20&&d.getElementById('reload').disabled;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.match(d.getElementById('status').textContent,/Verbindung unterbrochen/);assert.equal(d.querySelector('body>.work-progress').hidden,true);assert.equal(d.querySelector('main').inert,false);assert.equal(d.getElementById('reload').disabled,false);
});
test('whole catalog DOM: category defaults, provenance/kind filters, sort and reset work together',async t=>{
  const rows=[component('one','BZV55C3V3',{zener_voltage:3.3,zener_test_current:.005,power_dissipation:.4},{revision:1,values:{zener_voltage:{value:3.3,kind:'nominal',source:'Manufacturer PDF',source_details:{candidate_id:'nexperia-bzv55c3v3'}}}}),
    component('two','BZV55C5V1',{zener_voltage:5.1,zener_test_current:.005,power_dissipation:.4}),component('missing','BZV55C9V1'),
    {...component('reference','TL431AIDBZR',{reference_voltage:2.495,initial_tolerance:1,reference_voltage_max:2.52}),category:'integrated/analog/voltage_reference',library:'Reference_Voltage'},
    {...component('timer','NE555P',{supply_min_description:4.5,supply_max_description:16,quiescent_current:.006}),category:'integrated/timing/timer',library:'Timer'}];
  const dom=new JSDOM(html,{url:'http://localhost/'}),previous={};
  for(const key of ['document','localStorage','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
  dom.window.localStorage.setItem('kicad-parts-manager-language','de');globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.requestAnimationFrame=fn=>setImmediate(fn);
  globalThis.fetch=async url=>{assert.equal(url,'/api/catalog?compact=1');return {ok:true,json:async()=>({components:structuredClone(rows)})};};
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
  await import(modules['app.js']);
  const d=dom.window.document,event=(node,type)=>node.dispatchEvent(new dom.window.Event(type,{bubbles:true}));
  assert.doesNotMatch(d.getElementById('status').textContent,/fehlgeschlagen/);
  d.querySelector('[data-category="'+diode+'"]').click();
  const names=()=>[...d.querySelectorAll('#rows tr')].map(row=>row.firstChild.textContent);
  assert.deepEqual(names(),['BZV55C3V3','BZV55C5V1','BZV55C9V1']);
  const value=d.querySelector('#rows .value-cell');value.focus();
  const info=d.getElementById('value-information');assert.equal(info.hidden,false);
  assert.match(info.textContent,/Herstellerdatenblatt[\s\S]*Manufacturer PDF[\s\S]*Nennwert/);
  assert.equal(value.title,'');assert.doesNotMatch(value.textContent,/\*/);
  assert.equal(d.querySelectorAll('#rows .help-button,#rows .field-help-button').length,0);
  assert.match(d.getElementById('columns').textContent,/VZ/);assert.match(d.getElementById('columns').textContent,/IZ/);
  assert.equal(d.querySelectorAll('#columns details').length,0);
  assert.equal(d.querySelector('[aria-label="Herkunft für Filter zener_voltage"]'),null);
  assert.match(info.textContent,/Bedeutung/);
  d.getElementById('reset').click();assert.equal(names().length,3);
  const heading=[...d.querySelectorAll('#columns button')].find(b=>b.textContent.startsWith('VZ'));
  heading.click();assert.deepEqual(names(),['BZV55C3V3','BZV55C5V1','BZV55C9V1']);
  [...d.querySelectorAll('#columns button')].find(b=>b.textContent.startsWith('VZ')).click();assert.deepEqual(names(),['BZV55C5V1','BZV55C3V3','BZV55C9V1']);
  d.getElementById('choose-parameters').click();
  const dialog=d.querySelector('dialog'),option=[...dialog.querySelectorAll('label')].find(l=>l.textContent.includes('VZ min'));
  assert.ok(option);option.querySelector('input').checked=true;
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Auswahl übernehmen').click();
  assert.ok(JSON.parse(localStorage.getItem('kicad-parts-manager.columns.'+diode)).includes('zener_voltage_min'));
  assert.ok(d.querySelector('[aria-label="Vergleich für VZ min."]')||d.querySelector('#columns input[type=number]'));assert.equal(d.querySelectorAll('#columns details').length,0);
  d.getElementById('sim-coverage').click();
  const simDialog=d.querySelector('dialog[aria-label="SIM-Abdeckung"]');assert.ok(simDialog);
  assert.equal(simDialog.querySelectorAll('tbody tr').length,1);
  assert.deepEqual([...simDialog.querySelectorAll('tbody td')].slice(1).map(n=>n.textContent),['3','0','0','0','0','0','3']);
  simDialog.querySelector('tbody button').click();assert.equal(d.querySelector('dialog'),null);assert.equal(names().length,3);
  d.querySelector('[data-category="integrated/analog/voltage_reference"]').click();
  assert.equal(d.querySelector('[aria-label="Vergleich für Referenzspannung"]').value,'equal');
  assert.equal(d.querySelector('[aria-label="Vergleich für Anfangstoleranz"]').value,'max');
  d.querySelector('[data-category="integrated/timing/timer"]').click();
  assert.equal(d.querySelector('[aria-label="Vergleich für Ruhestrom"]').value,'max');
  const current=d.querySelector('[aria-label="Ruhestrom höchstens in µA"]');current.value='5000';event(current,'input');assert.deepEqual(names(),[]);
  current.value='6000';event(current,'input');assert.deepEqual(names(),['NE555P']);
  d.querySelector('#rows tr').click();
  const reference=d.getElementById('reference').value,categoryText=d.getElementById('breadcrumb').textContent;
  const language=d.getElementById('language-select');language.value='en';event(language,'change');
  assert.equal(d.documentElement.lang,'en');assert.equal(localStorage.getItem('kicad-parts-manager-language'),'en');
  assert.equal(d.getElementById('reset').textContent,'Reset filters');assert.equal(current.value,'6000');
  assert.deepEqual(names(),['NE555P']);assert.equal(d.getElementById('reference').value,reference);
  assert.equal(d.getElementById('breadcrumb').textContent,'Integrated circuits / Timing and clocks / Timer');assert.equal(d.getElementById('language-notice').hidden,true);
  language.value='de';event(language,'change');assert.deepEqual(names(),['NE555P']);assert.equal(current.value,'6000');
  const categoryDefaults=localStorage.getItem('kicad-parts-manager.columns.integrated/timing/timer');
  d.getElementById('search-profiles').click();
  let searches=d.querySelector('dialog.search-profiles');searches.querySelector('input[aria-label="Name der Suche"]').value='Timer 6 mA';
  [...searches.querySelectorAll('button')].find(b=>b.textContent==='Aktuelle Suche speichern').click();
  const stored=JSON.parse(localStorage.getItem('kicad-parts-manager.search-profiles.v1'));
  assert.equal(stored.items[0].state.limits.quiescent_current.value,0.006);
  assert.equal(stored.items[0].state.limits.quiescent_current.direction,'max');
  [...searches.querySelectorAll('button')].find(b=>b.classList.contains('dialog-close')).click();
  d.querySelector('[data-category="'+diode+'"]').click();assert.equal(names().length,3);
  d.getElementById('search-profiles').click();searches=d.querySelector('dialog.search-profiles');
  [...searches.querySelectorAll('button')].find(b=>b.textContent==='Öffnen').click();
  assert.equal(d.querySelector('dialog.search-profiles'),null);assert.deepEqual(names(),['NE555P']);
  assert.equal(d.querySelector('[aria-label="Ruhestrom höchstens in µA"]').value,'6000');
  assert.equal(d.querySelector('[aria-label="Vergleich für Ruhestrom"]').value,'max');
  assert.equal(localStorage.getItem('kicad-parts-manager.columns.integrated/timing/timer'),categoryDefaults);
  // Future or stale profiles must leave the current search completely intact.
  const stale=JSON.parse(localStorage.getItem('kicad-parts-manager.search-profiles.v1'));stale.items[0].state.signatures.quiescent_current.factor=1;
  localStorage.setItem('kicad-parts-manager.search-profiles.v1',JSON.stringify(stale));
  d.getElementById('search-profiles').click();searches=d.querySelector('dialog.search-profiles');
  [...searches.querySelectorAll('button')].find(b=>b.textContent==='Öffnen').click();
  assert.match(searches.querySelector('[role="status"]').textContent,/nicht mehr kompatibel/);
  assert.deepEqual(names(),['NE555P']);assert.equal(d.querySelector('[aria-label="Ruhestrom höchstens in µA"]').value,'6000');
  [...searches.querySelectorAll('button')].find(b=>b.classList.contains('dialog-close')).click();
  d.querySelector('[data-category="'+diode+'"]').click();d.getElementById('choose-parameters').click();
  const parameters=d.querySelector('dialog'),qualification=[...parameters.querySelectorAll('label')].find(n=>n.textContent.includes('Qualifikationen'));
  qualification.querySelector('input').checked=true;[...parameters.querySelectorAll('button')].find(b=>b.textContent==='Auswahl übernehmen').click();
  const comparison=d.querySelector('[aria-label="Vergleich für VZ – Nennspannung"]');assert.ok(comparison,[...d.querySelectorAll('#columns select')].map(x=>x.getAttribute('aria-label')).join(';'));comparison.value='range';event(comparison,'change');
  const lower=d.querySelector('[aria-label="VZ – Nennspannung gleich in V"]');lower.value='3.1';event(lower,'input');
  const upper=d.querySelector('[aria-label="VZ – Nennspannung bis in V"]');upper.value='5.1';event(upper,'input');
  const qualificationInput=d.querySelector('[aria-label="Qualifikationen filtern"]');for(const o of qualificationInput.options)o.selected=['AEC-Q100','AEC-Q101'].includes(o.value);event(qualificationInput,'change');
  const before=names();d.getElementById('search-profiles').click();searches=d.querySelector('dialog.search-profiles');searches.querySelector('input[aria-label="Name der Suche"]').value='Dioden Bedingungen';
  [...searches.querySelectorAll('button')].find(b=>b.textContent==='Aktuelle Suche speichern').click();[...searches.querySelectorAll('button')].find(b=>b.classList.contains('dialog-close')).click();
  const legacy=JSON.parse(localStorage.getItem('kicad-parts-manager.search-profiles.v1'));
  const legacyLimit=legacy.items.find(item=>item.name==='Dioden Bedingungen').state.limits.zener_voltage;
  Object.assign(legacyLimit,{kind:'maximum',sourceType:'manufacturer',conditions:{test_current:0.005}});
  localStorage.setItem('kicad-parts-manager.search-profiles.v1',JSON.stringify(legacy));
  d.getElementById('reset').click();d.getElementById('search-profiles').click();searches=d.querySelector('dialog.search-profiles');
  [...searches.querySelectorAll('.search-profile-row')].find(row=>row.querySelector('input').value==='Dioden Bedingungen').querySelector('button').click();
  assert.deepEqual(names(),before);assert.equal(d.querySelector('[aria-label="Vergleich für VZ – Nennspannung"]').value,'range');
  assert.equal(d.querySelector('[aria-label="VZ – Nennspannung bis in V"]').value,'5.1');assert.equal(d.querySelectorAll('#columns details').length,0);
  assert.match(d.getElementById('status').textContent,/Zurückgestellte Filter/);
  assert.equal(JSON.parse(localStorage.getItem('kicad-parts-manager.search-profiles.v1')).items.find(item=>item.name==='Dioden Bedingungen').state.limits.zener_voltage.sourceType,'manufacturer');
  assert.deepEqual([...d.querySelector('[aria-label="Qualifikationen filtern"]').selectedOptions].map(o=>o.value),['AEC-Q100','AEC-Q101']);



});

test('passive tree distinguishes resistor networks from network connectors and retains resistor columns',async t=>{
 const rows=[{...component('r','RN',{resistance:100,tolerance_description:1,power_description:.25}),category:'passive/resistor/resistor_network'}, {...component('j','RJ45',{}),category:'connectors/network'}];
 const dom=new JSDOM(html,{url:'http://localhost/catalog'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.location=dom.window.location;globalThis.requestAnimationFrame=fn=>setImmediate(fn);
 globalThis.localStorage.setItem('kicad-parts-manager.language','de');
 globalThis.fetch=async()=>({ok:true,json:async()=>({components:rows})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#passive-network');
 const d=dom.window.document, resistor=d.querySelector('[data-category="passive/resistor/resistor_network"]'),connector=d.querySelector('[data-category="connectors/network"]');
 assert.match(resistor.textContent,/Widerstandsnetzwerke|Resistor networks/);assert.doesNotMatch(connector.textContent,/Widerstandsnetzwerke|Resistor networks/);
 resistor.click();const columns=d.getElementById('columns').textContent;
 assert.match(columns,/Widerstand|Resistance/);assert.match(columns,/Toleranz|Tolerance/);assert.match(columns,/Leistungs|Power/);
});

test('category navigation clears text search and a new search leaves the old category and parameter filters',async t=>{
 const rows=[{...component('r','RES100',{resistance:100}),category:'passive/resistor/standard_resistor'}, {...component('c','CAP1',{}),category:'passive/capacitor/ceramic'}];
 const dom=new JSDOM(html,{url:'http://localhost/catalog?q=CAP1'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.location=dom.window.location;globalThis.requestAnimationFrame=fn=>setImmediate(fn);
 globalThis.fetch=async()=>({ok:true,json:async()=>({components:rows})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#navigation-search');
 const d=dom.window.document,search=d.getElementById('search'),names=()=>[...d.querySelectorAll('#rows tr')].map(r=>r.firstChild.textContent);
 assert.deepEqual(names(),['CAP1']);d.querySelector('[data-category="passive/resistor/standard_resistor"]').click();
 assert.equal(search.value,'');assert.deepEqual(names(),['RES100']);
 const limit=d.querySelector('#columns input[type=text]');limit.value='999';limit.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.deepEqual(names(),[]);
 search.value='CAP1';search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.deepEqual(names(),['CAP1']);assert.equal(d.querySelectorAll('[data-category].active').length,0);
 d.querySelector('[data-category="passive/resistor/standard_resistor"]').click();assert.equal(search.value,'');assert.deepEqual(names(),['RES100']);
});

test('resistor table displays units, sorts SI values and accepts engineering filter notation',async t=>{
 const rows=[{...component('r1','R390',{resistance:390000}),category:'passive/resistor/standard_resistor'}, {...component('r2','RLOW',{resistance:.0047}),category:'passive/resistor/standard_resistor'}, {...component('r3','R5K',{resistance:5100}),category:'passive/resistor/standard_resistor'}, {...component('r4','UNKNOWN',{}),category:'passive/resistor/standard_resistor'}];
 const dom=new JSDOM(html,{url:'http://localhost/catalog'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.location=dom.window.location;globalThis.requestAnimationFrame=fn=>setImmediate(fn);globalThis.fetch=async()=>({ok:true,json:async()=>({components:rows})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#engineering-table');const d=dom.window.document,names=()=>[...d.querySelectorAll('#rows tr')].map(r=>r.firstChild.textContent);
 d.querySelector('[data-category="passive/resistor/standard_resistor"]').click();assert.match(d.getElementById('rows').textContent,/390 kΩ/);assert.match(d.getElementById('rows').textContent,/mΩ/);
 const heading=[...d.querySelectorAll('#columns button')].find(b=>/Widerstand|Resistance/.test(b.textContent));heading.click();assert.deepEqual(names(),['RLOW','R5K','R390','UNKNOWN']);heading.click();assert.deepEqual(names(),['R390','R5K','RLOW','UNKNOWN']);
 const input=d.querySelector('#columns input[type=text]');input.value='390kR';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.deepEqual(names(),['R390']);input.value='10V';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(input.getAttribute('aria-invalid'),'true');assert.deepEqual(names(),[]);
});


test('text search requires every term in any order across fields and preserves MPN punctuation',async t=>{
 const rows=[{...component('one','ABC-123'),description:'Low noise amplifier',manufacturer:'Acme'},
 {...component('two','ABC-124'),description:'Low noise amplifier',manufacturer:'Other'},
 {...component('three','ABC-125'),description:'Power amplifier',manufacturer:'Acme'}];
 const dom=new JSDOM(html,{url:'http://localhost/catalog?q=Acme%20noise'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 Object.assign(globalThis,{document:dom.window.document,localStorage:dom.window.localStorage,location:dom.window.location,requestAnimationFrame:fn=>setImmediate(fn),fetch:async()=>({ok:true,json:async()=>({components:structuredClone(rows)})})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#word-order');
 const d=dom.window.document,search=d.getElementById('search'),names=()=>[...d.querySelectorAll('#rows tr')].map(r=>r.firstChild.textContent);
 assert.deepEqual(names(),['ABC-123']);
 for(const [query,expected] of [['noise ACME',['ABC-123']],['  ACME \t noise  ',['ABC-123']],['amplifier noise',['ABC-123','ABC-124']],['noise missing',[]],['ABC-123',['ABC-123']],['Acme ABC-123',['ABC-123']],['   ',['ABC-123','ABC-124','ABC-125']]]){
  search.value=query;search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.deepEqual(names(),expected,query);
 }
});


test('compact toolbar has two workspaces, visible removable extra filters and isolated simulation restrictions',async t=>{
 const native={...component('native','DIODE'),simulation_fields:{'Sim.Device':'D','Sim.Pins':'1=K 2=A'}};
 const rows=[native,component('plain','PLAIN'),{id:'fp',name:'FootprintOnly',kind:'footprint',category:'footprints/Test',library:'Test',footprint:'Test:FootprintOnly',values:{},models:[],parameters:[],description:'test',functions:[]}];
 const dom=new JSDOM(html,{url:'http://localhost/catalog'}),previous={};
 for(const key of ['document','localStorage','location','requestAnimationFrame','fetch'])previous[key]=globalThis[key];
 Object.assign(globalThis,{document:dom.window.document,localStorage:dom.window.localStorage,location:dom.window.location,requestAnimationFrame:fn=>setImmediate(fn),fetch:async()=>({ok:true,json:async()=>({components:structuredClone(rows)})})});
 t.after(()=>{dom.window.close();for(const [key,value] of Object.entries(previous))globalThis[key]=value;});
 await import(modules['app.js']+'#compact-toolbar');const d=dom.window.document;
 const names=()=>[...d.querySelectorAll('#rows tr')].map(r=>r.firstChild.textContent),event=(id,type='input')=>d.getElementById(id).dispatchEvent(new dom.window.Event(type,{bubbles:true}));
 const settle=async()=>{for(let i=0;i<14;i++)await new Promise(resolve=>setImmediate(resolve));};
 assert.equal(d.getElementById('workspace-view').options.length,2);assert.equal(d.getElementById('more-filters').open,false);
 assert.ok([...d.querySelectorAll('[data-simulation-filter]')].every(n=>n.hidden));
 d.getElementById('kind').value='footprint';event('kind');assert.deepEqual(names(),['FootprintOnly']);
 assert.match(d.getElementById('active-extra-filters').textContent,/Footprints/);
 d.querySelector('#active-extra-filters button').click();assert.deepEqual(names(),['DIODE','PLAIN']);
 d.getElementById('workspace-view').value='simulation';event('workspace-view','change');await settle();
 assert.deepEqual(names(),['DIODE']);assert.ok([...d.querySelectorAll('[data-simulation-filter]')].every(n=>!n.hidden));
 d.getElementById('evidence').value='untested';event('evidence');assert.match(d.getElementById('active-extra-filters').textContent,/Unverified/);
 d.getElementById('availability-detail').value='fields';event('availability-detail');assert.equal(d.getElementById('model-availability').value,'');assert.deepEqual(names(),[]);
 d.getElementById('workspace-view').value='';event('workspace-view','change');await settle();
 assert.deepEqual(names(),['DIODE','PLAIN']);for(const id of ['purpose','evidence','model-type','availability-detail','model-availability'])assert.equal(d.getElementById(id).value,'');
 assert.equal(d.getElementById('active-extra-filters').hidden,true);
 d.getElementById('kind').value='footprint';event('kind');d.getElementById('reset').click();assert.deepEqual(names(),['DIODE','PLAIN']);
});
