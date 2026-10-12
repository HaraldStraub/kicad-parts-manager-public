import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const file=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const {initLanguage,initSupport}=await import(uri((await file('i18n.js')).replace('./ui-texts.js',uri(await file('ui-texts.js')))));

test('support is optional, opens locally, translates, closes and restores focus',async t=>{
 for(const page of ['home.html','index.html']){
  const dom=new JSDOM(await file(page),{url:'http://localhost/'});t.after(()=>dom.window.close());
  const d=dom.window.document,opener=d.querySelector('.donate-button');
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  dom.window.localStorage.setItem('kicad-parts-manager-language','de');
  initLanguage(d);initSupport(d);initSupport(d);
  assert.equal(opener.getAttribute('href'),'#support');assert.equal(opener.getAttribute('target'),null);
  opener.click();const dialog=d.getElementById('support-dialog');
  assert.equal(dom.window.location.href,'http://localhost/');assert.equal(dialog.open,true);
  assert.match(dialog.textContent,/Keiner muss, jeder kann/);assert.equal(d.querySelectorAll('#support-dialog').length,1);
  const paypal=dialog.querySelector('a');
  assert.equal(paypal.href,'https://paypal.me/HaraldStraub70');assert.equal(paypal.target,'_blank');
  assert.equal(paypal.rel,'noopener noreferrer');
  const select=d.getElementById('language-select');select.value='en';select.dispatchEvent(new dom.window.Event('change'));
  assert.match(dialog.textContent,/No pressure/);
  dialog.querySelector('button').click();assert.equal(dialog.open,false);assert.equal(d.activeElement,opener);
  opener.click();assert.equal(d.querySelectorAll('#support-dialog').length,1);assert.equal(dialog.open,true);
 }
});

test('renaming preserves legacy language, theme and profiles without overwriting newer settings',t=>{
 const dom=new JSDOM('<select id="language-select"><option value="de">de</option><option value="en">en</option></select>',{url:'http://localhost/'});t.after(()=>dom.window.close());
 const storage=dom.window.localStorage;
 storage.setItem('componentdb-language','de');storage.setItem('componentdb-theme','light');
 storage.setItem('componentdb.search-profiles.v1','[{"name":"My filters"}]');
 storage.setItem('componentdb.columns.test','["vr_rms"]');
 storage.setItem('kicad-parts-manager.columns.test','["if_avg"]');
 initLanguage(dom.window.document);
 assert.equal(dom.window.document.documentElement.lang,'de');
 assert.equal(storage.getItem('kicad-parts-manager-theme'),'light');
 assert.equal(storage.getItem('kicad-parts-manager.search-profiles.v1'),'[{"name":"My filters"}]');
 assert.equal(storage.getItem('kicad-parts-manager.columns.test'),'["if_avg"]');
 assert.equal(storage.getItem('componentdb.columns.test'),'["vr_rms"]');
});
