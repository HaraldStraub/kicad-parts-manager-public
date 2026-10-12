import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const file=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const translations='data:text/javascript;base64,'+Buffer.from(await file('ui-texts.js')).toString('base64');
const i18n='data:text/javascript;base64,'+Buffer.from((await file('i18n.js')).replace('./ui-texts.js',translations)).toString('base64');
const code=(await file('home.js')).replace('./i18n.js',i18n),html=await file('home.html');
const {initLanding,countLabel,paintOverview,initFeedback}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const data={application_version:'0.1.0',inventory:{counts:{symbols:40071,footprints:21676},scanned_at:'2026-10-05T08:00:00Z'},models:{indexed:52666,assigned:3},local_data:{manufacturer_parameters:1440},kicad:{version:'10.0.6'},ngspice:{version:'47'}};
function environment(t){const dom=new JSDOM(html.replace('lang="en"','lang="de"'),{url:'http://localhost/'});t.after(()=>dom.window.close());return dom;}

test('feedback previews only selected versions, copies safely and keeps unpublished GitHub disabled',async t=>{
 const dom=environment(t),d=dom.window.document;d.documentElement.dataset.feedbackPublished='false';
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 const feedback=initFeedback(d,()=>({...data,private_path:'C:/secret',token:'private-token'}));
 feedback.open();d.getElementById('feedback-description').value='Problem <script>example</script>';d.getElementById('feedback-description').dispatchEvent(new dom.window.Event('input'));
 const report=d.getElementById('feedback-report');assert.match(report.value,/0.1.0/);assert.match(report.value,/10.0.6/);assert.doesNotMatch(report.value,/private-token|C:\/secret/);
 assert.equal(d.getElementById('feedback-github').disabled,true);
 d.getElementById('feedback-copy').click();await new Promise(r=>setTimeout(r,0));
 assert.match(d.getElementById('feedback-status').textContent,/Strg\+C/);assert.equal(report.selectionEnd,report.value.length);
 let copied;Object.defineProperty(dom.window.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});
 d.getElementById('feedback-copy').click();await new Promise(r=>setTimeout(r,0));assert.equal(copied,report.value);assert.match(d.getElementById('feedback-status').textContent,/kopiert/);
});

test('approved feedback link uses the selected template and URL-encodes user content',t=>{
 const dom=environment(t),d=dom.window.document;d.documentElement.dataset.feedbackPublished='true';let opened;
 dom.window.open=(url,target,features)=>{opened={url:new URL(url),features};};
 initFeedback(d,()=>data);d.getElementById('feedback-kind').value='idea';d.getElementById('feedback-description').value='A & B ? #';d.getElementById('feedback-description').dispatchEvent(new dom.window.Event('input'));
 d.getElementById('feedback-github').click();assert.equal(opened.url.origin,'https://github.com');assert.match(opened.url.pathname,/kicad-parts-manager-public\/issues\/new/);
 assert.equal(opened.url.searchParams.get('template'),'feature_request.md');assert.match(opened.url.searchParams.get('body'),/A & B \? #/);assert.match(opened.features,/noopener/);
});

test('usage notes stay collapsed until explicitly opened, in both languages',async t=>{
  for(const lang of ['de','en'])for(const requested of [false,true]){
    const dom=new JSDOM(html,{url:'http://localhost/'+(requested?'?help=usage':'')});t.after(()=>dom.window.close());
    dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
    const d=dom.window.document;
    await initLanding(d,{fetchData:async()=>({ok:true,json:async()=>data}),storage:{getItem:key=>key==='kicad-parts-manager-language'?lang:null,setItem(){}}}).ready;
    assert.equal(d.getElementById('data-usage').open,requested);
    assert.equal(d.getElementById('program-description').open,requested);
    const paragraphs=[...d.querySelectorAll('#data-usage p')];assert.equal(paragraphs.length,4);
    assert.ok(paragraphs.every(p=>p.textContent.length>80));
    assert.equal(d.querySelector('#data-usage summary').textContent,lang==='de'?'Hinweise zur Datenverwendung':'Data usage notes');
    assert.equal(d.querySelector('#data-usage input'),null);
  }
});

test('landing renders actual inventories without counting model definitions as parts',t=>{
  const dom=environment(t),d=dom.window.document;paintOverview(d,data);
  assert.equal(d.getElementById('stat-symbols').textContent,'40.071');assert.equal(d.getElementById('stat-footprints').textContent,'21.676');assert.equal(d.getElementById('stat-models').textContent,'52.666');assert.equal(d.getElementById('stat-facts').textContent,'1.440');
  assert.match(d.getElementById('home-versions').textContent,/KiCad 10\.0\.6.*ngspice 47/);
  assert.match(d.getElementById('stat-models').parentElement.textContent,/Diese Modelle können Bauteilen zugeordnet werden/);assert.equal(d.getElementById('stat-models').parentElement.tagName,'ARTICLE');
  assert.ok(d.getElementById('home-versions').closest('#program-description details'));assert.equal(d.querySelector('.site-footer'),null);
  paintOverview(d,{inventory:{counts:{}},models:{indexed:0}});assert.equal(d.getElementById('stat-symbols').textContent,'—');assert.equal(d.getElementById('stat-models').textContent,'0');assert.equal(d.getElementById('home-versions').textContent,'');
  for(const value of [undefined,null,-1,1.1,'1000',Infinity])assert.equal(countLabel(value),'—');
});

test('landing navigation and GET search lead to the existing catalog with supported filters',t=>{
  const dom=environment(t),d=dom.window.document;
  for(const link of d.querySelectorAll('a[href]:not(.donate-button)')){const url=new URL(link.href);if(link.closest('#first-run')&&url.origin==='https://www.kicad.org'){assert.equal(url.pathname,'/download/');assert.match(link.rel,/noopener/);continue;}assert.equal(url.origin,'http://localhost');assert.ok(['/','/catalog','/import'].includes(url.pathname));}
  const form=d.querySelector('form[role=search]');assert.equal(form.method,'get');assert.equal(new URL(form.action).pathname,'/catalog');
  d.getElementById('home-query').value='TL431 & Texas';const parameters=new URLSearchParams(new dom.window.FormData(form));assert.equal(parameters.get('q'),'TL431 & Texas');
  assert.ok(d.querySelector('a[href="/catalog?workspace=simulation"]'));assert.equal(d.querySelector('a[href="/catalog?workspace=pcb"]'),null);assert.ok(d.querySelector('a[href="/catalog?workspace=footprints"]'));assert.ok(d.querySelector('a[href="/catalog?kind=library"]'));
  assert.ok(d.querySelector('label[for=home-query]'));assert.ok(d.querySelector('.skip-link'));assert.equal(d.querySelectorAll('h1').length,1);
});

test('failed statistics remain unknown, retry works and blocked localStorage does not prevent access',async t=>{
  const dom=environment(t),d=dom.window.document;let fail=true,calls=0;
  const controller=initLanding(d,{fetchData:async url=>{assert.equal(url,'/api/about');calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>data};},storage:{getItem(key){return key==='kicad-parts-manager-language'?'de':null;},setItem(){throw Error('blocked');}}});
  await controller.ready;assert.equal(d.getElementById('stat-symbols').textContent,'—');assert.match(d.getElementById('home-status').textContent,/konnte nicht gelesen/);assert.equal(d.getElementById('home-refresh').disabled,false);assert.equal(d.getElementById('home-stats').getAttribute('aria-busy'),'false');
  d.getElementById('home-theme').click();assert.ok(d.body.classList.contains('light'));assert.equal(d.getElementById('home-theme').textContent,'Dunkles Design');
  fail=false;await controller.reload();assert.equal(calls,2);assert.equal(d.getElementById('stat-symbols').textContent,'40.071');assert.equal(d.getElementById('home-stats').classList.contains('stale'),false);
  fail=true;await controller.reload();assert.equal(d.getElementById('stat-symbols').textContent,'40.071');assert.ok(d.getElementById('home-stats').classList.contains('stale'));assert.match(d.getElementById('home-status').textContent,/zuletzt gelesenen/);
});

test('repeated refresh does not duplicate in-flight requests and saved theme is applied',async t=>{
  const dom=environment(t),d=dom.window.document;let release,calls=0;
  const controller=initLanding(d,{fetchData:()=>{calls++;return new Promise(resolve=>release=resolve);},storage:{getItem:()=> 'light',setItem(){}}});
  assert.ok(d.body.classList.contains('light'));assert.equal(d.getElementById('home-refresh').disabled,true);await controller.reload();assert.equal(calls,1);
  release({ok:true,json:async()=>data});await controller.ready;assert.equal(d.getElementById('home-refresh').disabled,false);
});

test('compact landing keeps optional content collapsed and opens translated program help',async t=>{
 const dom=environment(t),d=dom.window.document,dialog=d.getElementById('program-description');
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new dom.window.Event('close'));};
 const controller=initLanding(d,{fetchData:async()=>({ok:true,json:async()=>data}),storage:{getItem:()=>'de',setItem(){}}});await controller.ready;
 assert.equal(d.querySelectorAll('.workspace-card').length,3);
 for(const details of d.querySelectorAll('.workspace-card details'))assert.equal(details.open,false);
 assert.equal(dialog.open,false);assert.equal(d.querySelector('.program-technical').open,false);
 d.getElementById('home-program-open').click();assert.equal(dialog.open,true);
 const language=d.getElementById('language-select');language.value='en';language.dispatchEvent(new dom.window.Event('change'));
 assert.equal(d.getElementById('program-title').textContent,'Help & KiCad connection');assert.match(d.querySelector('.hero-description').textContent,/Select components/);
 assert.equal(d.querySelector('.primary-link'),null);assert.equal(d.querySelector('.site-header nav a[href="/catalog"]'),null);
 assert.match(d.querySelector('.kicad-help').textContent,/Double-click.*Press A/s);
 assert.match(dialog.textContent,/kicad-parts-manager.*kicad-parts-manager\.sqlite.*kicad-parts-manager\.kicad_dbl/s);
 assert.match(dialog.textContent,/not yet fully available/);
 d.getElementById('home-program-close').click();assert.equal(dialog.open,false);assert.equal(d.activeElement.id,'home-program-open');
 assert.ok(!html.includes('closing-panel'));assert.ok(!html.includes('program-limits'));
});


test('landing progress remains visible until a pending load finishes without duplicate requests',async t=>{
 const dom=environment(t),d=dom.window.document;let resolve,calls=0;
 const request=new Promise(done=>resolve=done);
 const controller=initLanding(d,{fetchData:()=>{calls++;return request;},storage:null});
 assert.equal(d.getElementById('home-progress').hidden,false);
 assert.equal(d.getElementById('home-progress').hasAttribute('aria-valuenow'),false);
 await controller.reload();assert.equal(calls,1);
 resolve({ok:true,json:async()=>data});await controller.ready;
 assert.equal(d.getElementById('home-progress').hidden,true);assert.equal(d.getElementById('home-refresh').disabled,false);
});

test('category inventory loads only on request, sorts, translates and keeps last data after a failed refresh',async t=>{
 const dom=environment(t),d=dom.window.document,dialog=d.getElementById('category-statistics');let calls=[],release,fail=false;
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new dom.window.Event('close'));};
 const stats={total:4,categories:[{path:'semiconductor/diode',total:3,symbol:3,footprint:2,model3d:1,simulation:1,values:1},{path:'passive/resistor',total:1,symbol:1,footprint:1,model3d:0,simulation:1,values:0}]};
 const controller=initLanding(d,{storage:{getItem:()=>'de',setItem(){}},fetchData:async url=>{calls.push(url);if(url==='/api/about')return {ok:true,json:async()=>data};if(fail)throw Error('offline');return new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>stats}));}});await controller.ready;
 assert.deepEqual(calls,['/api/about']);d.getElementById('home-statistics-open').click();assert.equal(dialog.open,true);assert.equal(d.getElementById('statistics-progress').hidden,false);
 d.getElementById('home-statistics-open').click();assert.equal(calls.length,2);release();
 for(let i=0;i<5&&d.getElementById('statistics-refresh').disabled;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(d.getElementById('statistics-progress').hidden,true);assert.equal(d.querySelectorAll('#statistics-body tr').length,2);assert.match(d.getElementById('statistics-status').textContent,/4 Einträge/);
 const head=d.querySelectorAll('#statistics-head button');head[1].click();assert.match(d.querySelector('#statistics-body tr').textContent,/Dioden/);assert.match(d.querySelector('#statistics-body tr').textContent,/2 \(67%\)/);
 const select=d.getElementById('language-select');select.value='en';select.dispatchEvent(new dom.window.Event('change'));assert.equal(d.getElementById('statistics-title').textContent,'Inventory by category');assert.match(d.querySelector('#statistics-body tr').textContent,/Diodes/);
 const search=d.getElementById('statistics-search');search.value='diodes';search.dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelectorAll('#statistics-body tr').length,1);search.value='';search.dispatchEvent(new dom.window.Event('input'));
 fail=true;d.getElementById('statistics-refresh').click();for(let i=0;i<5&&d.getElementById('statistics-refresh').disabled;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.match(d.getElementById('statistics-status').textContent,/last overview/);assert.equal(d.querySelectorAll('#statistics-body tr').length,2);
 d.getElementById('statistics-close').click();assert.equal(dialog.open,false);assert.equal(d.activeElement.id,'home-statistics-open');
 assert.match(d.querySelector('.statistics-note').textContent,/not a completeness check/);
});

 test('published entry pages enable approved GitHub feedback',async()=>{
  for(const name of ['home.html','index.html','import.html']){
   const page=new JSDOM(await file(name));assert.equal(page.window.document.documentElement.dataset.feedbackPublished,'true');page.window.close();
  }
 });
