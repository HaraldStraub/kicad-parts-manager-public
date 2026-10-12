import {t} from './i18n.js';

// Category IDs and SI values remain independent of the display language.
const shortCategories=[
 [/\b(?:n[ -]?fet|nmos|n[ -]?mosfet)\b/i,'semiconductor/transistor/fet/mosfet/n_channel'],
 [/\b(?:p[ -]?fet|pmos|p[ -]?mosfet)\b/i,'semiconductor/transistor/fet/mosfet/p_channel'],
 [/\bmosfet\b/i,'semiconductor/transistor/fet/mosfet'],
 [/\bnpn\b/i,'semiconductor/transistor/bjt/npn'],[/\bpnp\b/i,'semiconductor/transistor/bjt/pnp'],
 [/\b(?:schottky|schottkey)\b/i,'semiconductor/diode/schottky'],
 [/\b(?:diode|dioden?)\b/i,'semiconductor/diode'],
 [/\b(?:resistor|widerstand)\b/i,'passive/resistor'],
 [/\b(?:capacitor|kondensator)\b/i,'passive/capacitor'],
 [/\b(?:inductor|induktivität|spule)\b/i,'passive/magnetics/inductor']
];
const shortFields={vds:'vds_max',vgs:'gate_voltage_abs',vgs_rds:'rds_on_vgs',id:'id_cont',rds:'rds_on',vce:'vce_description',ic:'ic_description',vr:'vr_max',if:'if_avg',vf:'vf_typ',r:'resistance',c:'capacitance',l:'inductance'};
const unitBase={V:'V',A:'A',F:'F',H:'H',W:'W',R:'Ω',Ω:'Ω',Ohm:'Ω'};
const prefixFactor={'':1,p:1e-12,n:1e-9,u:1e-6,'µ':1e-6,'μ':1e-6,m:1e-3,k:1e3,M:1e6};
export function parseShortSearch(raw,definitionsFor){
 let match=shortCategories.map(([pattern,category])=>({match:raw.match(pattern),category})).find(x=>x.match);
 if(!match){
  const inferred=new Set([...raw.matchAll(/(?<![\w.-])\d+(?:[.,]\d+)?\s*[pnuµμmkM]?(F|H|R|Ω|Ohm)(?!\w)/g)].map(m=>m[1]==='F'?'passive/capacitor':m[1]==='H'?'passive/magnetics/inductor':'passive/resistor'));
  if(inferred.size===1)match={category:[...inferred][0],match:Object.assign([''],{index:0})};
 }
 if(!match||raw[match.match.index+match.match[0].length]===':')return null;
 const category=match.category,definitions=definitionsFor(category),criteria=[],spans=[[match.match.index,match.match.index+match.match[0].length]];
 const units=unit=>{const m=String(unit).match(/^([pnuµμmkM]?)(V|A|F|H|W|Ω|Ohm)$/);return m?{base:unitBase[m[2]],factor:prefixFactor[m[1]]}:null;};
 const expression=/(?<![\w.-])(?:(VGS_RDS|VDS|VGS|RDS|VCE|VR|VF|ID|IC|IF|R|C|L)\s*)?(>=|<=|≥|≤|=|>|<)?\s*(\d+(?:[.,]\d+)?)\s*([pnuµμmkM]?)(V|A|F|H|W|R|Ω|Ohm)(?![\w])/gi;
 for(const m of raw.matchAll(expression)){
  if(m[2]==='>'||m[2]==='<')continue;
  const before=raw.slice(0,m.index).trimEnd();
  if(!m[1]&&(before.endsWith('=')||before.endsWith('>')||before.endsWith('<')||(m[2]&&/[a-z_]$/i.test(before)&&!before.toLowerCase().endsWith(match.match[0].toLowerCase()))))continue;
  const base=m[5].toLowerCase()==='ohm'?'Ω':unitBase[m[5].toUpperCase()]||unitBase[m[5]],scale=prefixFactor[m[4]],value=Number(m[3].replace(',','.'))*scale;
  if(!base||!Number.isFinite(value))continue;
  const options=definitions.filter(f=>units(f[2])?.base===base&&f[4]?.type!=='text').map(f=>f[0]);
  const explicit=m[1]?shortFields[m[1].toLowerCase()]:null;
  if(!options.length||(m[1]&&!options.includes(explicit)))continue;
  let key=explicit;
  if(!key){
   const preferred=category.includes('/mosfet')?{V:'vds_max',A:'id_cont',Ω:'rds_on'}:category.includes('/bjt')?{V:'vce_description',A:'ic_description'}:category.includes('/diode')?{V:'vr_max',A:'if_avg'}:{Ω:'resistance',F:'capacitance',H:'inductance',W:'power_description'};
   key=options.includes(preferred[base])?preferred[base]:options.length===1?options[0]:null;
  }
  const operator=m[2]||null;
  criteria.push({key,options,value,unit:base,explicit:!!m[1],operator,token:m[0].trim()});spans.push([m.index,m.index+m[0].length]);
 }
 // Multiple unlabeled quantities of the same dimension require an explicit choice.
 for(const item of criteria.filter(c=>!c.explicit))if(criteria.filter(c=>!c.explicit&&c.unit===item.unit).length>1)item.key=null;
 const packageMatch=category.startsWith('passive/')?raw.match(/\b(?:0201|0402|0603|0805|1206|1210|2010|2512)\b/):null;
 if(packageMatch)spans.push([packageMatch.index,packageMatch.index+packageMatch[0].length]);
 const chars=raw.split('');for(const [start,end] of spans)for(let i=start;i<end;i++)chars[i]=' ';
 return {raw,category,criteria,package:packageMatch?.[0]||'',text:chars.join('').trim().replace(/\s+/g,' ')};
}
export function matchesShortPackage(row,size){
 if(!size)return true;
 const footprint=(row.footprint||'').split(':').at(-1);
 if(new RegExp('(?:^|_)'+size+'(?:_|$)').test(footprint))return true;
 const designation=(row.kicad_reference||row.symbol||'').split(/[/:]/).at(-1);
 return [designation,row.name||''].some(name=>new RegExp('^(?:CC|C|R)'+size+'_').test(name));
}
export function shortSearchLimit(item){
 const direction=item.operator?({'=':'equal','>=':'min','≥':'min','<=':'max','≤':'max','>':'min','<':'max'}[item.operator]):['resistance','capacitance','inductance','rds_on_vgs'].includes(item.key)?'equal':['rds_on','vf_typ'].includes(item.key)?'max':'min';
 return {value:item.value,direction};
}
export const SEARCH_PROFILES_KEY = 'kicad-parts-manager.search-profiles.v1';
const copy = value => JSON.parse(JSON.stringify(value));
const validName = name => typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 80;
export function profileStore(storage) {
  let raw;
  function read() {
    try { raw = storage.getItem(SEARCH_PROFILES_KEY); } catch { throw Error(t('profiles.storage')); }
    if (!raw) return [];
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw Error(t('profiles.corrupt')); }
    if (parsed?.version !== 1 || !Array.isArray(parsed.items) || parsed.items.some(item =>
      typeof item.id !== 'string' || !validName(item.name) || !item.state || typeof item.state !== 'object')) {
      throw Error(t('profiles.corrupt'));
    }
    if (new Set(parsed.items.map(item => item.id)).size !== parsed.items.length) throw Error(t('profiles.corrupt'));
    return parsed.items;
  }
  function write(items) {
    try {
      if (storage.getItem(SEARCH_PROFILES_KEY) !== raw) throw Error(t('profiles.conflict'));
      const next = JSON.stringify({version: 1, items});
      storage.setItem(SEARCH_PROFILES_KEY, next); raw = next;
    } catch (error) {
      if (error.message === t('profiles.conflict')) throw error;
      throw Error(t('profiles.storage'));
    }
  }
  function change(items, action, {id, name, state} = {}) {
    const next = copy(items), index = next.findIndex(item => item.id === id);
    if (action !== 'add' && index < 0) throw Error(t('profiles.conflict'));
    if (action === 'add' || action === 'rename') {
      if (!validName(name) || next.some(item => item.id !== id && item.name.toLowerCase() === name.trim().toLowerCase())) throw Error(t('profiles.nameError'));
    }
    const now = new Date().toISOString();
    if (action === 'add') next.push({id: globalThis.crypto?.randomUUID?.() || now + '-' + Math.random().toString(36).slice(2), name: name.trim(), state: copy(state), updated: now});
    else if (action === 'rename') { next[index].name = name.trim(); next[index].updated = now; }
    else if (action === 'update') { next[index].state = copy(state); next[index].updated = now; }
    else if (action === 'delete') next.splice(index, 1);
    else throw Error(t('profiles.invalid', {key: action}));
    write(next); return next;
  }
  return {read, change};
}
export function parameterSignature(definition) {
  const [key,,unit,factor,metadata = {}] = definition;
  return {key, unit, factor, type: metadata.type || 'number', multiple: metadata.multiple === true,
    options: metadata.options || [], conditions: (metadata.conditions || []).map(c => ({key:c.key, unit:c.unit, type:c.type || 'number', options:c.options || []}))};
}
export function validateSearch(state, {definitions, options, categories, textOptions = {}}) {
  const issues = [];
  const issue = (key, value) => issues.push(t(key, {key:value}));
  if (!state || state.version !== 1) return [t('profiles.version')];
  if (state.packageSize !== undefined && !['','0201','0402','0603','0805','1206','1210','2010','2512'].includes(state.packageSize)) issue('profiles.invalid','packageSize');
  if (typeof state.category !== 'string' || (state.category && !categories.has(state.category))) issue('profiles.missingCategory', state.category || '?');
  if (!Array.isArray(state.columns) || new Set(state.columns).size!==state.columns.length || !state.limits || typeof state.limits !== 'object' || !state.controls || typeof state.controls !== 'object') return [...issues,t('profiles.invalid',{key:'structure'})];
  const fields = new Map(definitions.map(definition => [definition[0], definition]));
  for (const key of state.columns) {
    const definition = fields.get(key);
    if (!definition || JSON.stringify(state.signatures?.[key]) !== JSON.stringify(parameterSignature(definition))) issue('profiles.parameterChanged', key);
  }
  for (const [id, value] of Object.entries(state.controls)) {
    if (!Object.hasOwn(options, id) || typeof value !== 'string' || (options[id] && !options[id].includes(value))) issue('profiles.optionMissing', id);
  }
  for (const [key, limit] of Object.entries(state.limits)) {
    const definition = fields.get(key), type = definition?.[4]?.type || 'number';
    if (!definition || !state.columns.includes(key) || !limit || !['min','max','equal','range','text'].includes(limit.direction)) { issue('profiles.invalid', key); continue; }
    const finite = value => value === null || (typeof value === 'number' && Number.isFinite(value));
    if (type === 'text') {
      if (limit.direction !== 'text' || (limit.value !== null && (!Array.isArray(limit.value) || limit.value.some(v=>typeof v !== 'string' || ((textOptions[key] || definition[4].options)?.length && !(textOptions[key] || definition[4].options).includes(v)))))) issue('profiles.invalid', key);
    } else if (limit.direction === 'text' || (limit.direction === 'range' ? limit.value!==null && (!limit.value || !finite(limit.value.min) || !finite(limit.value.max) || (limit.value.min !== null && limit.value.max !== null && limit.value.min > limit.value.max)) : !finite(limit.value))) issue('profiles.invalid', key);
    if (limit.kind && !['nominal','typical','minimum','maximum','absolute_maximum'].includes(limit.kind)) issue('profiles.invalid', key);
    if (limit.sourceType && !['manufacturer','manual','description','catalog'].includes(limit.sourceType)) issue('profiles.invalid', key);
    const conditions = new Map((definition[4]?.conditions || []).map(c=>[c.key,c]));
    for (const [name,value] of Object.entries(limit.conditions || {})) {
      const c = conditions.get(name);
      if (!c || (c.type === 'text' ? typeof value !== 'string' || (c.options?.length && !c.options.includes(value)) : typeof value !== 'number' || !Number.isFinite(value))) issue('profiles.parameterChanged', key+'/'+name);
    }
  }
  if (state.missingField && (!fields.has(state.missingField) || JSON.stringify(state.signatures?.[state.missingField]) !== JSON.stringify(parameterSignature(fields.get(state.missingField))))) issue('profiles.parameterChanged', state.missingField);
  if (typeof state.includeUnknown !== 'boolean' || typeof state.ascending !== 'boolean') issue('profiles.invalid', 'flags');
  return [...new Set(issues)];
}
export function searchProfilesDialog({capture, apply}) {
  const d = document, node = (tag,value) => {const el=d.createElement(tag);if(value!==undefined)el.textContent=value;return el;};
  const dialog=node('dialog');dialog.className='manual-editor search-profiles';dialog.setAttribute('aria-label',t('profiles.title'));
  const status=node('p');status.setAttribute('role','status');
  const name=node('input');name.maxLength=80;name.setAttribute('aria-label',t('profiles.name'));
  const label=node('label',t('profiles.name'));label.append(name);
  const list=node('div');list.className='search-profile-list';
  const button=(key,fn) => {const b=node('button',t(key));b.type='button';b.addEventListener('click',()=>{try{fn();}catch(error){status.textContent=error.message;}});return b;};
  let store,items;
  const redraw=()=>{list.replaceChildren();if(!items.length)list.append(node('p',t('profiles.empty')));for(const item of items){const row=node('section');row.className='search-profile-row';const rename=node('input');rename.value=item.name;rename.maxLength=80;rename.setAttribute('aria-label',t('profiles.rename')+' '+item.name);row.append(rename,
    button('profiles.load',()=>{apply(copy(item.state));dialog.close();}),
    button('profiles.rename',()=>{items=store.change(items,'rename',{id:item.id,name:rename.value});status.textContent=t('profiles.saved');redraw();}),
    button('profiles.update',()=>{items=store.change(items,'update',{id:item.id,state:capture()});status.textContent=t('profiles.saved');redraw();}),
    button('profiles.delete',()=>{items=store.change(items,'delete',{id:item.id});redraw();}));list.append(row);}};
  const save=button('profiles.save',()=>{items=store.change(items,'add',{name:name.value,state:capture()});name.value='';status.textContent=t('profiles.saved');redraw();});
  const close=button('common.close',()=>dialog.close());close.setAttribute('aria-label',t('common.close'));close.title=t('common.close');close.textContent='×';close.className='dialog-close';
  dialog.append(node('h2',t('profiles.title')),close,node('p',t('profiles.description')),label,save,status,list);
  d.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  try{store=profileStore(globalThis.localStorage);items=store.read();redraw();}catch(error){save.disabled=true;status.textContent=error.message;}
}
