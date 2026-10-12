import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const texts=uri(await read('ui-texts.js')),i18n=uri((await read('i18n.js')).replace('./ui-texts.js',texts));
const {parseShortSearch,shortSearchLimit,matchesShortPackage}=await import(uri((await read('search-profiles.js')).replace('./i18n.js',i18n)));
const profiles=JSON.parse((await read('parameter-profiles.js')).replace('export default ','').trim().replace(/;$/,''));
const definitions=category=>profiles[category.includes('/mosfet')?'mosfet':category.includes('/bjt')?'bjt':category.includes('/diode')?'diode':category.split('/').at(-1)]||[];

test('unit-only passive search separates nominal value, minimum power and package',()=>{
 const capacitor=parseShortSearch('100nF 0805',definitions);
 assert.equal(capacitor.category,'passive/capacitor');assert.equal(capacitor.package,'0805');assert.equal(capacitor.text,'');
 assert.equal(capacitor.criteria[0].key,'capacitance');assert.equal(shortSearchLimit(capacitor.criteria[0]).direction,'equal');
 const resistor=parseShortSearch('10mR 2W',definitions);
 assert.equal(resistor.category,'passive/resistor');assert.equal(resistor.text,'');
 assert.deepEqual(resistor.criteria.map(c=>[c.key,c.value]),[['resistance',.01],['power_description',2]]);
 assert.equal(shortSearchLimit(resistor.criteria[1]).direction,'min');
 assert.equal(parseShortSearch('100nF 10mR',definitions),null);
 assert.equal(parseShortSearch('2W',definitions),null);
 assert.ok(matchesShortPackage({footprint:'Capacitor_SMD:C_0805_2012Metric'},'0805'));
 assert.ok(matchesShortPackage({symbol:'CERN:Capacitors SMD/C0805_100N_50V'},'0805'));
 assert.ok(matchesShortPackage({name:'CC0805_100NF_50V',footprint:'Capacitors SMD:CAPC2012X135N'},'0805'));
 assert.equal(matchesShortPackage({footprint:'Capacitor_SMD:C_0402_1005Metric'},'0805'),false);
});
test('NFET shorthand recognizes category, default VDS, explicit VGS and residual MPN/package',()=>{
 const result=parseShortSearch('NFET 60V 5A SOT-23',definitions);
 assert.equal(result.category,'semiconductor/transistor/fet/mosfet/n_channel');assert.equal(result.text,'SOT-23');
 assert.deepEqual(result.criteria.map(c=>[c.key,c.value]),[['vds_max',60],['id_cont',5]]);
 assert.deepEqual(shortSearchLimit(result.criteria[0]),{value:60,direction:'min'});
 const gate=parseShortSearch('N-FET VGS ≥ 20V',definitions).criteria[0];assert.equal(gate.key,'gate_voltage_abs');assert.equal(shortSearchLimit(gate).direction,'min');
 assert.equal(parseShortSearch('NFET VGS_RDS=10V',definitions).criteria[0].key,'rds_on_vgs');
});
test('multiple unlabeled voltages require assignment instead of guessing',()=>{
 const result=parseShortSearch('NFET 60V 20V',definitions);assert.equal(result.criteria.length,2);assert.ok(result.criteria.every(c=>c.key===null));
 assert.ok(result.criteria[0].options.includes('gate_voltage_abs'));
 assert.equal(parseShortSearch('NFET VDS=60V VGS=20V',definitions).criteria[1].key,'gate_voltage_abs');
});
test('passive quantities use SI prefixes and nominal equality; resistance limit uses maximum',()=>{
 for(const [query,value,key] of [['resistor 4.7kOhm',4700,'resistance'],['Kondensator 100nF',1e-7,'capacitance'],['Spule 2,2mH',.0022,'inductance']]){
 const item=parseShortSearch(query,definitions).criteria[0];assert.equal(item.key,key);assert.ok(Math.abs(item.value-value)<Math.abs(value)*1e-12);assert.equal(shortSearchLimit(item).direction,'equal');
 }
 assert.equal(shortSearchLimit(parseShortSearch('NFET RDS ≤ 50mOhm',definitions).criteria[0]).direction,'max');
});
test('ordinary MPN/references and unknown units remain text; invalid explicit fields are not reinterpreted',()=>{
 assert.equal(parseShortSearch('2N7002',definitions),null);assert.equal(parseShortSearch('Diode:1N914',definitions),null);assert.equal(parseShortSearch('60V',definitions),null);
 const unknown=parseShortSearch('NFET VIN=60V 10xyz',definitions);assert.equal(unknown.criteria.length,0);assert.equal(unknown.text,'VIN=60V 10xyz');
});
