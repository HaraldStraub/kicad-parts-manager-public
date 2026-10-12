import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const file=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const {texts}=await import(uri(await file('ui-texts.js')));
const i18n=uri((await file('i18n.js')).replace('./ui-texts.js',uri(await file('ui-texts.js'))));
const {t,initLanguage,translateDocument,locale,LANGUAGE_KEY,apiError,showError}=await import(i18n);

test('API errors translate stable codes and keep original diagnostics collapsed and safe',()=>{
 const previous=globalThis.document;
 try{
  for(const lang of ['en','de']){
   const dom=new JSDOM('<html lang="'+lang+'"><body><div id="status"></div></body></html>');
   globalThis.document=dom.window.document;
   const error=apiError({code:'stale_data',error:'<script>original diagnostic</script>'});
   const status=dom.window.document.getElementById('status');showError(status,error);
   assert.equal(status.firstChild.textContent,texts[lang]['error.stale_data']);
   assert.equal(status.querySelector('details').open,false);
   assert.equal(status.querySelector('summary').textContent,texts[lang]['error.details']);
   assert.equal(status.querySelector('pre').textContent,error.details);
   assert.equal(status.querySelector('script'),null);
   assert.equal(apiError({code:'unknown_new_code',error:'raw'}).message,texts[lang]['error.request_failed']);
   showError(status,new TypeError('Failed to fetch'));
   assert.equal(status.textContent,texts[lang]['error.network']);
   assert.equal(status.querySelector('details'),null);
   dom.window.close();
  }
 }finally{globalThis.document=previous;}
});

test('English is the default and an explicitly saved German preference is respected',async()=>{
 for(const saved of [null,'invalid','en','de']){
  const dom=new JSDOM(await file('home.html'),{url:'http://localhost/'});
  initLanguage(dom.window.document,{storage:{getItem:()=>saved,setItem(){}}});
  assert.equal(dom.window.document.documentElement.lang,saved==='de'?'de':'en');
  assert.equal(dom.window.document.getElementById('language-notice').hidden,true);
  dom.window.close();
 }
});
test('catalog keys and placeholders match in DE/EN with explicit German fallback',()=>{
 assert.deepEqual(Object.keys(texts.de).sort(),Object.keys(texts.en).sort());
 const slots=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
 for(const key of Object.keys(texts.de))assert.deepEqual(slots(texts.de[key]),slots(texts.en[key]),key);
 assert.equal(t('home.status.scan',{date:'X'},'en'),'Last imported: X');
 assert.equal(t('language.label',{},'unsupported'),'Sprache');assert.equal(t('missing',{},'en','Original'),'Original');
 assert.equal(t('missing',{},'en'),'missing');assert.equal(t('constructor',{},'en'),'constructor');assert.match(t('home.status.scan',{},'en'),/\{date\}/);
 texts.de['test.onlyGerman']='Deutscher Rückfall';try{assert.equal(t('test.onlyGerman',{},'en'),'Deutscher Rückfall');}finally{delete texts.de['test.onlyGerman'];}
});
test('language persistence is shared, invalid storage defaults to EN and data values stay unchanged',async()=>{
 const store=new Map([[LANGUAGE_KEY,'en']]),storage={getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)};
 const html=await file('home.html'),dom=new JSDOM(html,{url:'http://localhost/'}),d=dom.window.document;
 initLanguage(d,{storage});assert.equal(d.documentElement.lang,'en');assert.equal(d.title,'KiCad Parts Manager · Your part. Your design.');
 assert.equal(d.querySelector('#home-query').placeholder,'MPN, manufacturer or function …');
 assert.equal(d.querySelector('#language-notice').hidden,true);assert.equal(locale(d),'en-GB');
 d.querySelector('#home-query').value='2N7002 & 3.3 V';const select=d.querySelector('#language-select');select.value='de';select.dispatchEvent(new dom.window.Event('change'));
 assert.equal(store.get(LANGUAGE_KEY),'de');assert.equal(d.querySelector('#home-query').value,'2N7002 & 3.3 V');
 assert.match(d.querySelector('#hero-title').textContent,/Von der Idee zum/);assert.equal(d.querySelector('#home-query').value,'2N7002 & 3.3 V');
 const second=new JSDOM(html,{url:'http://localhost/'});initLanguage(second.window.document,{storage});assert.equal(second.window.document.documentElement.lang,'de');
 initLanguage(d,{storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});select.value='en';select.dispatchEvent(new dom.window.Event('change'));assert.equal(d.documentElement.lang,'en');
 dom.window.close();second.window.close();
});
test('migrated markup references valid keys and translation cannot inject HTML',async()=>{
 for(const page of ['home.html','index.html']){const dom=new JSDOM(await file(page));const d=dom.window.document;for(const node of d.querySelectorAll('[data-i18n]'))assert.ok(texts.de[node.dataset.i18n],node.dataset.i18n);dom.window.close();}
 const dom=new JSDOM('<html lang="en"><body><span data-i18n="language.label"></span></body></html>');translateDocument(dom.window.document);assert.equal(dom.window.document.querySelector('span').textContent,'Language');
 assert.equal(t('help.label',{title:'<img src=x>'},'en'),'Help: <img src=x>');dom.window.close();
});
test('electrical help translates explanations while preserving units and source text',async()=>{
 const {parameterHelp,evidenceHelp}=await import(uri((await file('context-help.js')).replace('./i18n.js',i18n)));
 const dom=new JSDOM('<html lang="en"></html>');const previous=globalThis.document;globalThis.document=dom.window.document;
 try{const definition=['rds_on','RDS(on)','mΩ',1000,{conditions:[{key:'gate_voltage',label:'Gatespannung',unit:'V'}]}];
 const help=parameterHelp(definition);assert.match(help.usedFor,/matching VGS/);assert.equal(help.unit,'mΩ');
 const value=evidenceHelp({sourceType:'manufacturer',source:'Original DE Datenblatt p.4',conditions_data:{gate_voltage:4.5}},definition);
 assert.equal(value.source,'Original DE Datenblatt p.4');assert.match(value.conditions,/Gate voltage: 4.5 V/);assert.match(value.description,/From manufacturer datasheet/);
 }finally{globalThis.document=previous;dom.window.close();}
});
test('reference and regulator profiles have specific bilingual help with operating limits kept separate',async()=>{
 const {default:profiles}=await import(uri(await file('parameter-profiles.js')));
 const {parameterHelp}=await import(uri((await file('context-help.js')).replace('./i18n.js',i18n)));
 const dom=new JSDOM('<html lang="de"></html>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{
  for(const lang of ['de','en']){
   dom.window.document.documentElement.lang=lang;
   for(const category of ['integrated/analog/voltage_reference','integrated/power_ic/linear_regulator','integrated/power_ic/switch_regulator']){
    for(const definition of profiles[category]){
     const help=parameterHelp(definition);
     assert.notEqual(help.description,t('help.generic.description',{},lang),category+'/'+definition[0]);
     assert.equal(help.unit,definition[2]||t('help.noUnit',{},lang));
     for(const field of ['title','description','source','use'])assert.ok(texts[lang]['help.'+definition[0]+'.'+field]);
    }
   }
  }
  dom.window.document.documentElement.lang='en';
  assert.match(parameterHelp(['regulation_current_required','Regelstrom','mA']).description,/not the maximum permitted/);
  assert.match(parameterHelp(['switch_current_limit','Stromgrenze','A']).description,/not the available continuous output current/);
  assert.match(parameterHelp(['efficiency','Wirkungsgrad','%']).usedFor,/peak value does not apply/);
  assert.match(parameterHelp(['dropout_voltage','Dropout','V']).usedFor,/load and temperature/);
  assert.match(parameterHelp(['initial_tolerance','Toleranz','%']).description,/not automatically include temperature drift/);
 }finally{globalThis.document=previous;dom.window.close();}
});
test('opamp and comparator help covers real profiles and distinguishes speed, range and output limits',async()=>{
 const {default:profiles}=await import(uri(await file('parameter-profiles.js')));
 const {parameterHelp}=await import(uri((await file('context-help.js')).replace('./i18n.js',i18n)));
 const dom=new JSDOM('<html lang="de"></html>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{
  for(const lang of ['de','en']){
   dom.window.document.documentElement.lang=lang;
   for(const category of ['integrated/amplifier/opamp','integrated/analog/opamp','integrated/analog/comparator','integrated/amplifier/buffer']){
    for(const definition of profiles[category]){
     const help=parameterHelp(definition);assert.notEqual(help.description,t('help.generic.description',{},lang),category+'/'+definition[0]);
     assert.equal(help.unit,definition[2]||t('help.noUnit',{},lang));
     for(const field of ['title','description','source','use'])assert.ok(texts[lang]['help.'+definition[0]+'.'+field]);
    }
   }
  }
  dom.window.document.documentElement.lang='en';
  assert.match(parameterHelp(['gbw','GBW','MHz']).usedFor,/noise gain.*approximation.*current-feedback/);
  assert.match(parameterHelp(['rail_to_rail','Rail-to-Rail','']).usedFor,/does not mean exactly.*not a functional input range/);
  assert.match(parameterHelp(['propagation_delay','Laufzeit','ns']).usedFor,/overdrive.*not the same as rise time/);
  assert.match(parameterHelp(['output_type','Ausgang','']).usedFor,/external pull-up.*RC time/);
  assert.match(parameterHelp(['output_current','Ausgangsstrom','mA']).usedFor,/short-circuit current is not an allowed continuous/);
  assert.match(parameterHelp(['supply_min_description','Versorgung','V']).usedFor,/total voltage between rails/);
 }finally{globalThis.document=previous;dom.window.close();}
});
test('LED and all optocoupler profiles have bilingual help without conflating optical and isolation ratings',async()=>{
 const {default:profiles}=await import(uri(await file('parameter-profiles.js')));
 const {parameterHelp}=await import(uri((await file('context-help.js')).replace('./i18n.js',i18n)));
 const dom=new JSDOM('<html lang="de"></html>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{
  const categories=Object.keys(profiles).filter(key=>key==='opto/led'||key==='opto/optocoupler'||key.startsWith('opto/optocoupler/'));
  assert.equal(categories.length,6);
  for(const lang of ['de','en']){
   dom.window.document.documentElement.lang=lang;
   for(const category of categories)for(const definition of profiles[category]){
    const help=parameterHelp(definition);assert.notEqual(help.description,t('help.generic.description',{},lang),category+'/'+definition[0]);
    assert.equal(help.unit,definition[2]||t('help.noUnit',{},lang));
    for(const field of ['title','description','source','use'])assert.ok(texts[lang]['help.'+definition[0]+'.'+field]);
   }
  }
  dom.window.document.documentElement.lang='en';
  assert.match(parameterHelp(['isolation_voltage','Isolation','V']).description,/not automatically.*continuous working voltage/);
  assert.match(parameterHelp(['ctr_min','CTR','%']).usedFor,/guaranteed lower bound.*temperature and ageing.*saturation/);
  assert.match(parameterHelp(['trigger_current','IFT','mA']).usedFor,/not the maximum permitted LED current/);
  assert.match(parameterHelp(['source_peak_current','Peak','A']).usedFor,/not continuous current/);
  assert.match(parameterHelp(['cmti','CMTI','V\/µs']).usedFor,/not an isolation or working voltage/);
  assert.match(parameterHelp(['luminous_intensity','Lichtstärke','mcd']).usedFor,/do not equate lm or lux with mcd/);
  assert.match(parameterHelp(['vce_sat','VCE','V']).usedFor,/IF is not base current IB/);
 }finally{globalThis.document=previous;dom.window.close();}
});
test('passive component help covers actual profiles and distinguishes bias, thermal and pulse limits',async()=>{
 const {default:profiles}=await import(uri(await file('parameter-profiles.js')));
 const {parameterHelp,evidenceHelp}=await import(uri((await file('context-help.js')).replace('./i18n.js',i18n)));
 const dom=new JSDOM('<html lang="de"></html>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{
  for(const lang of ['de','en']){
   dom.window.document.documentElement.lang=lang;
   for(const category of ['resistor','capacitor','inductor'])for(const definition of profiles[category]){
    const help=parameterHelp(definition);assert.notEqual(help.description,t('help.generic.description',{},lang),category+'/'+definition[0]);
    assert.equal(help.unit,definition[2]||t('help.noUnit',{},lang));
    for(const field of ['title','description','source','use'])assert.ok(texts[lang]['help.'+definition[0]+'.'+field]);
   }
  }
  dom.window.document.documentElement.lang='en';
  assert.match(parameterHelp(['capacitance','Kapazität','µF']).usedFor,/not automatically the usable.*DC bias/);
  assert.match(parameterHelp(['saturation_current','Isat','A']).usedFor,/not the thermal rated current.*matching inductance-drop criteria/);
  assert.match(parameterHelp(['current_description','Strom','A']).usedFor,/RMS current.*peak current.*not a confirmed rating for both/);
  assert.match(parameterHelp(['ripple_current','Ripple','A']).usedFor,/RMS is not peak current.*frequency correction/);
  assert.match(parameterHelp(['power_description','Leistung','W']).usedFor,/watts alone do not establish permitted pulse energy/);
  assert.match(parameterHelp(['dielectric','Dielektrikum','']).usedFor,/temperature code does not establish the DC-bias curve/);
  const esr=profiles.capacitor.find(f=>f[0]==='esr'),evidence={sourceType:'manufacturer',source:'Original source',conditions_data:{test_frequency:100000}};
  assert.match(evidenceHelp(evidence,esr).conditions,/Test frequency: 100000 Hz/);assert.equal(evidence.conditions_data.test_frequency,100000);
 }finally{globalThis.document=previous;dom.window.close();}
});
test('connector profiles and temperature help distinguish mating, per-contact loading and RF ratings',async()=>{
 const {default:profiles}=await import(uri(await file('parameter-profiles.js')));
 const {parameterHelp}=await import(uri((await file('context-help.js')).replace('./i18n.js',i18n)));
 const dom=new JSDOM('<html lang="de"></html>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{
  const categories=Object.keys(profiles).filter(key=>key==='connectors'||key.startsWith('connectors/'));assert.equal(categories.length,15);
  const temperatures=profiles.__common.filter(f=>['operating_temp_min','operating_temp_max','temperature_reference'].includes(f[0]));
  for(const lang of ['de','en']){
   dom.window.document.documentElement.lang=lang;
   for(const definition of [...categories.flatMap(category=>profiles[category]),...temperatures]){
    const help=parameterHelp(definition);assert.notEqual(help.description,t('help.generic.description',{},lang),definition[0]);
    assert.equal(help.unit,definition[2]||t('help.noUnit',{},lang));
    for(const field of ['title','description','source','use'])assert.ok(texts[lang]['help.'+definition[0]+'.'+field]);
   }
  }
  dom.window.document.documentElement.lang='en';
  assert.match(parameterHelp(['rated_current','Nennstrom','A']).usedFor,/per contact.*simultaneously.*do not automatically multiply.*measurement method/);
  assert.match(parameterHelp(['pitch_description','Raster','mm']).usedFor,/alone do not establish mechanical compatibility/);
  assert.match(parameterHelp(['rated_voltage','Spannung','V']).usedFor,/working and test voltage.*AC RMS, DC and peak/);
  assert.match(parameterHelp(['mounting','Montage','']).usedFor,/Do not equate mounting with crimp/);
  assert.match(parameterHelp(['characteristic_impedance','Impedanz','Ω']).description,/not ohmic contact resistance/);
  assert.match(parameterHelp(['operating_temp_max','Temperatur','°C']).usedFor,/ambient temperature separately.*full rated current/);
 }finally{globalThis.document=previous;dom.window.close();}
});
