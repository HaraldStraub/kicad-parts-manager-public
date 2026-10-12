import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const file=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const i18n=url((await file('i18n.js')).replace('./ui-texts.js',url(await file('ui-texts.js'))));
const {initFirstRun}=await import(url((await file('first-run.js')).replace('./i18n.js',i18n)));
const html=await file('home.html');
const response=data=>({ok:true,json:async()=>data});
const installation={version:'10.0',share:'C:/KiCad/share/kicad',config:'C:/Settings/10.0',tables_ready:true};
function page(t){const dom=new JSDOM(html,{url:'http://127.0.0.1:4190/'});t.after(()=>dom.window.close());return dom;}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('existing catalog skips first-run controls',async t=>{
  const dom=page(t),d=dom.window.document;
  await initFirstRun(d,{fetchData:async()=>response({required:false})}).ready;
  assert.equal(d.getElementById('first-run').hidden,true);
});

test('detected installation leads from scan to selection without changing pages',async t=>{
  const dom=page(t),d=dom.window.document;let submitted;
  await initFirstRun(d,{fetchData:async()=>response({required:true,installations:[installation]}),runScan:async(body,progress)=>{submitted=body;progress({phase:'symbols',completed:1,total:2});return {counts:{symbols:2,footprints:1},warnings:0,tables_ready:true};}}).ready;
  d.getElementById('setup-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await tick();
  assert.deepEqual(submitted,{share:installation.share,config:installation.config});
  assert.equal(d.getElementById('setup-result').hidden,false);
  assert.equal(d.activeElement.id,'setup-catalog');
  assert.equal(d.getElementById('setup-catalog').getAttribute('href'),'/catalog');
});

test('missing KiCad exposes manual paths; failure permits retry',async t=>{
  const dom=page(t),d=dom.window.document;
  await initFirstRun(d,{fetchData:async()=>response({required:true,installations:[]}),runScan:async()=>{throw Object.assign(Error('diagnostic'),{api:true,code:'setup_empty'});}}).ready;
  assert.equal(d.getElementById('setup-paths').open,true);
  assert.equal(d.getElementById('setup-start').disabled,true);
  for(const [id,value] of [['setup-share',installation.share],['setup-config',installation.config]]){d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new dom.window.Event('input'));}
  d.getElementById('setup-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await tick();
  assert.match(d.getElementById('setup-status').textContent,/No readable KiCad symbols/);
  assert.equal(d.getElementById('setup-start').disabled,false);
  assert.equal(d.getElementById('setup-result').hidden,true);
});
