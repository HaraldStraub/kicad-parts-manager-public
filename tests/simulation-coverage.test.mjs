import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const source=async file=>readFile(new URL('../src/kicad_parts_manager/web/'+file,import.meta.url),'utf8');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const texts=uri(await source('ui-texts.js'));
const i18n=uri((await source('i18n.js')).replace('./ui-texts.js',texts));
const profiles=uri(await source('parameter-profiles.js'));
const utils=uri((await source('catalog-utils.js')).replace('./parameter-profiles.js',profiles));
const {simulationCoverage,simulationCoverageDialog}=await import(uri((await source('simulation-coverage.js')).replace('./catalog-utils.js',utils).replace('./i18n.js',i18n)));
const row={id:'SYM-1',kind:'library',symbol:'Diode:SAFE',category:'semiconductor/diode/switching',models:[]};
const model={id:'model',status:'UNVERIFIED',file_status:'found',model_class:'UNKNOWN',passed:[],check:{ok:true}};

test('SIM coverage counts components once and keeps availability, type and evidence separate',()=>{
  const group=simulationCoverage([
    row,{...row,models:[model,{...model,id:'second'}]},
    {...row,models:[{...model,manufacturer_model:true,passed:['operating_point','switching']}]},
    {...row,models:[{...model,check:{ok:true,diode_function:{suite:'diode-direction-1.0',ok:true}}}]},
    {...row,models:[{...model,file_status:'missing',passed:['operating_point','switching']}]},
    {...row,models:[{...model,file_status:'changed'},{...model,file_status:'missing'}]},
    {...row,simulation_fields:{'Sim.Device':'D'}},
    {...row,models:[{...model,status:'REJECTED',passed:['operating_point']}]},
    {...row,kind:'footprint'},
    {...row,kind:'generic',intrinsic:true,values:{resistance:1000},simulation_fields:{'Sim.Device':'R','Sim.Params':'r=1000'},models:[]},
  ])[0];
  // Sim.Device=D is KiCad's internal generic default model, not a missing file.
  assert.equal(group.total,9);assert.equal(group.present,5);assert.equal(group.unavailable,4);
  assert.equal(group.calculable,3);assert.equal(group.dc,1);assert.equal(group.switching,1);assert.equal(group.diode,1);
  assert.equal(group.specific,1);assert.equal(group.generic,2);
  assert.deepEqual([group.none,group.missing,group.changed,group.fields,group.unknown],[1,1,1,0,1]);
  assert.equal(group.total,group.present+group.unavailable);
});

test('stale diode and DC checks do not inflate coverage; intrinsic values must be complete',()=>{
  const group=simulationCoverage([{...row,models:[{...model,passed:['operating_point'],check:{ok:true,stale:true,diode_function:{suite:'diode-direction-1.0',ok:true}}}]},
    {...row,intrinsic:true,simulation_fields:{'Sim.Device':'R','Sim.Params':''}}])[0];
  assert.equal(group.present,1);assert.equal(group.dc,0);assert.equal(group.diode,0);
  // A stale calculability result also must not count as current evidence.
  assert.equal(group.calculable,0);assert.equal(group.fields,1);
});

test('SIM coverage dialog exposes counts, limits and a category navigation action',t=>{
  const dom=new JSDOM('<body></body>'),previous=globalThis.document;dom.window.document.documentElement.lang='de';globalThis.document=dom.window.document;
  t.after(()=>{dom.window.close();globalThis.document=previous;});
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.dispatchEvent(new dom.window.Event('close'));};
  let selected;simulationCoverageDialog([row,{...row,models:[model]}],'Auswahl',()=>'<Diode>',path=>selected=path);
  const dialog=document.querySelector('dialog');assert.match(dialog.textContent,/nicht addierbar/);assert.match(dialog.textContent,/keinen Datenblattwert/);
  assert.equal(dialog.querySelector('tbody td').textContent,'<Diode>');assert.equal(dialog.querySelector('tbody img'),null);
  assert.deepEqual([...dialog.querySelectorAll('tbody td')].slice(1).map(n=>n.textContent),['2','1','1','0','0','0','1']);
  dialog.querySelector('tbody button').click();assert.equal(selected,row.category);assert.equal(document.querySelector('dialog'),null);
});
