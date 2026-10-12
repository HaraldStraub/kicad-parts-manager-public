import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const texts=uri(await readFile(new URL('../src/kicad_parts_manager/web/ui-texts.js',import.meta.url),'utf8'));
const i18n=uri((await readFile(new URL('../src/kicad_parts_manager/web/i18n.js',import.meta.url),'utf8')).replace('./ui-texts.js',texts));
const profiles=await readFile(new URL('../src/kicad_parts_manager/web/parameter-profiles.js',import.meta.url),'utf8');
const utils=(await readFile(new URL('../src/kicad_parts_manager/web/catalog-utils.js',import.meta.url),'utf8')).replace('./parameter-profiles.js',uri(profiles));
const source=(await readFile(new URL('../src/kicad_parts_manager/web/data-coverage.js',import.meta.url),'utf8')).replace('./catalog-utils.js',uri(utils)).replace('./i18n.js',i18n);
const {coverage,proposals,parameterState}=await import(uri(source));
const diode={kind:'library',symbol:'Diode:1N914',category:'semiconductor/diode/switching',description:'100V 0.3A Small Signal Fast Switching Diode',values:{}};
test('coverage distinguishes unknown, zero, description and local data without counting assets or generic models',()=>{
  const group=coverage([diode,{...diode,values:{vrrm:0,if_cont:.3},description_values:{if_cont:.3}},{...diode,values:{vrrm:100},manual_data:{values:{vrrm:{source:'datasheet'}}}},{...diode,kind:'generic'},{...diode,kind:'footprint'}])[0];
  assert.equal(group.total,3);
  const voltage=group.fields.find(f=>f.key==='vrrm');assert.equal(voltage.missing,1);assert.equal(voltage.catalog,1);assert.equal(voltage.manual,1);
  assert.equal(group.fields.find(f=>f.key==='if_cont').description,1);
  assert.equal(parameterState({...diode,values:{x:NaN}},'x'),'missing');
});
test('proposals preserve catalog/manual values and do not promote generic hints to certified limits',()=>{
  const result=proposals(diode);assert.equal(result.find(p=>p.key==='voltage_description').value,100);assert.equal(result.find(p=>p.key==='current_description').value,.3);assert.ok(!result.some(p=>p.key==='vr_max'));
  assert.equal(proposals({...diode,values:{voltage_description:50,current_description:.1}}).length,0);
  assert.equal(proposals({...diode,manual_data:{values:{voltage_description:{value:50},current_description:{value:.1}}}}).length,0);
});
test('MOSFET proposals require explicit labels and reject ambiguity',()=>{
  const fet={...diode,category:'semiconductor/transistor/fet/mosfet/n_channel',description:'60V Vds, 200mA Id'};
  assert.equal(proposals(fet).find(p=>p.key==='id_cont').value,.2);
  assert.equal(proposals({...fet,description:'60V 2A MOSFET'}).length,0);
  assert.ok(!proposals({...fet,description:'60V Vds, 80V Vds'}).some(p=>p.key==='vds_max'));
  assert.equal(proposals({...fet,category:'integrated/analog/opamp'}).length,0);
});

test('BJT and P-channel proposals use explicit polarity and preserve magnitude without assigning unlabeled values',()=>{
  const bjt={...diode,category:'semiconductor/transistor/bjt/pnp',description:'-45V Vce, -100mA Ic, PNP'};
  assert.equal(proposals(bjt).find(p=>p.key==='vce_description').value,45);
  assert.equal(proposals(bjt).find(p=>p.key==='ic_description').value,.1);
  const fet={...diode,category:'semiconductor/transistor/fet/mosfet/p_channel',description:'−50V Vds, −130mA Id, P-Channel MOSFET'};
  assert.equal(proposals(fet).find(p=>p.key==='id_cont').value,.13);
  assert.equal(proposals({...fet,category:'semiconductor/transistor/fet/mosfet/n_channel',description:'-50V Vds, N-Channel MOSFET'}).length,0);
});

test('imported manufacturer facts remain unverified and are counted separately',()=>{
  const c={...diode,values:{vrrm:100},manual_data:{values:{vrrm:{source_details:{candidate_id:'vishay-1n914'}}}}};
  assert.equal(parameterState(c,'vrrm'),'manufacturer');
  const f=coverage([c])[0].fields.find(f=>f.key==='vrrm');assert.equal(f.manufacturer,1);assert.equal(f.catalog,0);assert.equal(f.manual,0);
});
