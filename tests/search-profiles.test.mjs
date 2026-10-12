import test from 'node:test';
globalThis.document={documentElement:{lang:'de'}};
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file=name=>readFile(new URL('../src/kicad_parts_manager/web/'+name,import.meta.url),'utf8');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const translations=uri(await file('ui-texts.js'));
const i18n=uri((await file('i18n.js')).replace('./ui-texts.js',translations));
const {profileStore,SEARCH_PROFILES_KEY,parameterSignature,validateSearch}=await import(uri((await file('search-profiles.js')).replace('./i18n.js',i18n)));
function memory(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
const definition=['rds_on','RDS(on)','mΩ',1000,{conditions:[{key:'gate_voltage',label:'VGS',unit:'V'}]}];
const state=()=>({version:1,category:'mosfet',columns:['rds_on'],signatures:{rds_on:parameterSignature(definition)},limits:{rds_on:{direction:'range',value:{min:0.02,max:0.04},kind:'maximum',sourceType:'manufacturer',conditions:{gate_voltage:4.5}}},controls:{search:'2N',kind:'library'},includeUnknown:false,ascending:true,missingField:''});
const context={definitions:[definition],options:{search:null,kind:['','library']},categories:new Set(['mosfet'])};

test('changed default columns and comparison do not invalidate an explicitly saved search',()=>{
 const updated=[...definition.slice(0,4),{...definition[4],optional:true,comparison:'max'}];
 assert.deepEqual(parameterSignature(updated),parameterSignature(definition));
 assert.deepEqual(validateSearch(state(),{...context,definitions:[updated]}),[]);
 assert.equal(state().limits.rds_on.direction,'range');
});
test('profiles persist independently, preserve SI conditions and support rename/update/delete',()=>{
 const storage=memory(),store=profileStore(storage);let items=store.read();items=store.change(items,'add',{name:'3.3 V MOSFET',state:state()});
 const snapshot=storage.getItem(SEARCH_PROFILES_KEY);const second=profileStore(storage);assert.deepEqual(second.read(),items);
 assert.equal(items[0].state.limits.rds_on.value.max,0.04);assert.equal(items[0].state.limits.rds_on.conditions.gate_voltage,4.5);
 assert.throws(()=>store.change(items,'add',{name:' 3.3 V MOSFET ',state:state()}),/eindeutigen/);assert.equal(storage.getItem(SEARCH_PROFILES_KEY),snapshot);
 const id=items[0].id;items=store.change(items,'rename',{id,name:'Alternative'});const changed=state();changed.controls.search='AO';items=store.change(items,'update',{id,state:changed});assert.equal(items[0].id,id);assert.equal(items[0].state.controls.search,'AO');
 items=store.change(items,'delete',{id});assert.equal(items.length,0);assert.equal(profileStore(storage).read().length,0);
});
test('corrupt, blocked and concurrent storage never overwrite prior data',()=>{
 const storage=memory();storage.setItem(SEARCH_PROFILES_KEY,'broken');assert.throws(()=>profileStore(storage).read(),/beschädigtes/);assert.equal(storage.getItem(SEARCH_PROFILES_KEY),'broken');
 assert.throws(()=>profileStore({getItem(){throw Error('blocked');}}).read(),/Browser-Speicher/);
 const clean=memory(),first=profileStore(clean),second=profileStore(clean),a=first.read(),b=second.read();first.change(a,'add',{name:'First',state:state()});const raw=clean.getItem(SEARCH_PROFILES_KEY);
 assert.throws(()=>second.change(b,'add',{name:'Second',state:state()}),/anderen Fenster/);assert.equal(clean.getItem(SEARCH_PROFILES_KEY),raw);
 const quota=profileStore({getItem(){return raw;},setItem(){throw Error('quota');}});const existing=quota.read();assert.throws(()=>quota.change(existing,'rename',{id:existing[0].id,name:'Changed'}),/Browser-Speicher/);assert.equal(existing[0].name,'First');
});
test('removed definitions, changed conditions, unavailable choices and future versions require review',()=>{
 assert.deepEqual(validateSearch(state(),context),[]);const invalid=state();invalid.signatures.rds_on.factor=1;assert.match(validateSearch(invalid,context).join(' '),/geändert/);
 const absent=state();absent.controls.kind='missing';assert.match(validateSearch(absent,context).join(' '),/nicht mehr verfügbar/);
 const condition=state();condition.limits.rds_on.conditions.temperature=25;assert.match(validateSearch(condition,context).join(' '),/geändert/);
 const range=state();range.limits.rds_on.value={min:0.05,max:0.03};assert.match(validateSearch(range,context).join(' '),/Ungültige/);
 const empty=state();empty.limits.rds_on.value=null;assert.deepEqual(validateSearch(empty,context),[]);
 assert.match(validateSearch({...state(),version:2},context).join(' '),/version/);
 const unknown=state();unknown.category='deleted';assert.match(validateSearch(unknown,context).join(' '),/Kategorie/);
});
