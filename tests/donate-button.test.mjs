import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('donation headers open an internal support dialog without exposing an email',async()=>{
 for(const name of ['home.html','index.html']){
  const html=await readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
  const dom=new JSDOM(html),link=dom.window.document.querySelector('header .donate-button');
  assert.ok(link);assert.equal(link.getAttribute('href'),'#support');
  assert.equal(link.hasAttribute('aria-disabled'),false);
  assert.equal(link.target,'');
  assert.equal(link.hasAttribute('target'),false);
  assert.doesNotMatch(link.outerHTML,/@|%40|business=/i);
  assert.equal(link.dataset.i18nLabel,'donate.button');
  assert.ok(link.querySelector('svg[aria-hidden="true"]'));
  assert.equal(link.textContent.trim(),'');
  dom.window.close();
 }
});
