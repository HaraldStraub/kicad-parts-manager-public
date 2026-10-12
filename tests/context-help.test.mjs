import test from 'node:test';
globalThis.document={documentElement:{lang:'de'}};
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const translations='data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../src/kicad_parts_manager/web/ui-texts.js',import.meta.url),'utf8')).toString('base64');
const i18n='data:text/javascript;base64,'+Buffer.from((await readFile(new URL('../src/kicad_parts_manager/web/i18n.js',import.meta.url),'utf8')).replace('./ui-texts.js',translations)).toString('base64');
const source=(await readFile(new URL('../src/kicad_parts_manager/web/context-help.js',import.meta.url),'utf8')).replace('./i18n.js',i18n);
const {parameterHelp,evidenceHelp,helpButton}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('magnitude filters explain sign handling without changing the stored parameter',()=>{
 const definition=['offset_voltage','Offsetbetrag','mV',1000,{absolute:true}];
 assert.match(parameterHelp(definition).usedFor,/Betrag unabhängig vom Vorzeichen.*unverändert/);
 assert.equal(definition[4].absolute,true);
 assert.ok(!parameterHelp(['offset_voltage','Offset','mV',1000,{}]).usedFor.includes('Betrag unabhängig'));
});
test('evidence distinguishes source and kind from missing conditions and electrical proof',()=>{
 const definition=['rds_on','RDS(on)','mΩ',1000,{conditions:[{key:'gate_voltage',label:'VGS',unit:'V'},{key:'test_temperature',label:'Temperatur',unit:'°C'}]}];
 const result=evidenceHelp({sourceType:'manufacturer',kind:'maximum',source:'Rev 2 p 3',conditions_data:{gate_voltage:4.5}},definition);
 assert.match(result.description,/Hersteller.*Maximum/);assert.match(result.conditions,/VGS: 4.5 V.*fehlen: Temperatur/);assert.match(result.usedFor,/nicht durch seine Herkunft bestätigt/);
 assert.match(evidenceHelp({},definition).source,/Keine genaue Quelle/);assert.match(parameterHelp(definition).usedFor,/VGS/);
 assert.match(parameterHelp(['insertion_loss','Dämpfung','dB']).usedFor,/Quell-/);
});
test('help is safely rendered inside modal, reusable, keyboard closable without selecting the row',()=>{
 const dom=new JSDOM('<dialog open><div id="host"></div></dialog>',{pretendToBeVisual:true});const d=dom.window.document,host=d.getElementById('host');let bubbled=0;host.onclick=()=>bubbled++;
 const button=helpButton(host,{title:'<img src=x>',description:'<script>bad</script>',conditions:'unbekannt'});button.click();
 const panel=d.querySelector('dialog > .context-help');assert.ok(panel);assert.equal(panel.hidden,false);assert.equal(panel.querySelectorAll('img,script').length,0);assert.match(panel.textContent,/<script>/);assert.equal(bubbled,0);
 panel.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(panel.hidden,true);assert.equal(d.activeElement,button);
 button.click();assert.equal(d.querySelectorAll('.context-help').length,1);dom.window.close();
});
