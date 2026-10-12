import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const {texts}=await import(uri(await read('ui-texts.js')));
const {kindLabel,originLabel,evidenceSummary}=await import(uri((await read('i18n.js')).replace('./ui-texts.js',uri(await read('ui-texts.js')))));
test('DE/EN evidence separates source, kind and missing measurement conditions without asserting verification',()=>{
 const previous=globalThis.document;
 try{for(const lang of ['de','en']){
 globalThis.document={documentElement:{lang}};
 const metadata={source_type:'manufacturer',kind:'maximum',source:'Original PDF p.3',conditions_data:{gate_voltage:10}};
 const before=JSON.stringify(metadata),definition=['rds_on','RDS(on)','mΩ',1000,{conditions:[{key:'gate_voltage',label:'VGS',unit:'V'},{key:'test_temperature',label:'Temperature',unit:'°C'}]}];
 const summary=evidenceSummary(metadata,definition);
 assert.ok(summary.includes(originLabel('manufacturer')));assert.ok(summary.includes(kindLabel('maximum')));assert.ok(summary.includes('Original PDF p.3'));assert.match(summary,/10 V/);assert.match(summary,lang==='de'?/fehlen:/i:/missing structured conditions:/i);
 assert.doesNotMatch(summary,/garantiert|guaranteed|verified|freigegeben/i);assert.equal(JSON.stringify(metadata),before);
 const empty=evidenceSummary({},definition);assert.ok(empty.includes(texts[lang]['origin.unknown']));assert.ok(empty.includes(texts[lang]['quality.noSource']));
 assert.equal(kindLabel('future_kind'),texts[lang]['kind.unspecified']);
 }}finally{globalThis.document=previous;}
});
test('manufacturer/editor/filter value kinds share canonical captions in both languages',()=>{
 for(const lang of ['de','en'])for(const [caption,kind] of [['3ab09b5eae10','minimum'],['3c8ac3037255','maximum'],['75c23bb80b44','absolute_maximum']])assert.equal(texts[lang]['caption.'+caption],texts[lang]['kind.'+kind]);
});
