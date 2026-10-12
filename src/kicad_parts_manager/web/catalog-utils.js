import sharedProfiles from './parameter-profiles.js';
export function engineeringUnit(key){return key==='resistance'?'Ω':key==='capacitance'?'F':key==='inductance'?'H':['power_description','power_dissipation','output_power','coil_power','optical_power'].includes(key)?'W':null;}
export function engineeringDisplay(value,key,language='en'){
 const unit=engineeringUnit(key);if(!unit||typeof value!=='number'||!Number.isFinite(value))return null;
 const choices=unit==='Ω'?[[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m']]:unit==='W'?[[1e3,'k'],[1,''],[1e-3,'m']]:[[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']];
 const [scale,prefix]=value===0?[1,'']:choices.find(([scale])=>Math.abs(value)>=scale*(1-1e-12))||choices.at(-1);
 return (value/scale).toLocaleString(language,{maximumSignificantDigits:6})+' '+prefix+unit;
}
export function engineeringInput(text,key,factor=1){
 text=String(text).trim().replaceAll('μ','µ').replace(',','.');if(!text)return null;
 const unit=engineeringUnit(key);const prefixes={p:1e-12,n:1e-9,u:1e-6,'µ':1e-6,m:1e-3,'':1,k:1e3,K:1e3,M:1e6};
 if(!unit)return Number(text)/factor;
 const embedded=text.match(/^(\d+)([RkKMmnuµp])(\d+)$/);
 if(embedded){const prefix=embedded[2];if(prefix==='R'&&unit!=='Ω')return NaN;return Number(embedded[1]+'.'+embedded[3])*(prefix==='R'?1:prefixes[prefix]);}
 const match=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([pnuµmkKM]?)(Ω|R|ohm|F|H|W)?$/i);
 if(!match)return NaN;
 const suffix=match[3];if(suffix&&!((unit==='Ω'&&['Ω','R','ohm'].includes(suffix))||suffix===unit))return NaN;
 const scale=match[2]||suffix?prefixes[match[2]]:1/factor;
 return Number(match[1])*scale;
}
// Keep UI updates aligned with the server's persistent override identity.
export function localDataKey(component) {
  if(component.import_key)return 'import:'+component.import_key;
  if(component.id?.startsWith('CMP-'))return component.id;
  return component.kind==='footprint'?'footprint:'+component.footprint:'symbol:'+component.symbol;
}
// Unknown values stay last in either direction; names use natural ordering.
const naturalOrder = new Intl.Collator('de', {numeric:true, sensitivity:'base'});
export function compareValues(a, b, ascending = true) {
  const missing = value => value == null || value === '' || value === '—' || (typeof value === 'number' && !Number.isFinite(value));
  if (missing(a)) return missing(b) ? 0 : 1;
  if (missing(b)) return -1;
  const order = typeof a === 'number' && typeof b === 'number'
    ? a - b : naturalOrder.compare(String(a), String(b));
  return order * (ascending ? 1 : -1);
}

export function purposePass(model, purpose) {
  if (['REJECTED', 'INCOMPATIBLE', 'DEPRECATED'].includes(model.status) || (model.file_status && model.file_status!=='found') || model.check?.stale) return false;
  const passed = model.passed || [];
  if (purpose === 'switching') return passed.includes('switching');
  if (purpose === 'dc') return passed.includes('operating_point') || passed.includes('dc_current');
  return passed.includes('operating_point') || passed.includes('dc_current') || passed.includes('switching');
}

export function diodeFunctionState(model) {
  const report=model.check?.diode_function;
  if(!report)return null;
  if(report.suite!=='diode-direction-1.0'||model.check?.stale||report.stale||
     (model.file_status&&model.file_status!=='found')||['REJECTED','INCOMPATIBLE','DEPRECATED'].includes(model.status))return 'erneut prüfen';
  return report.ok?'bestanden':'nicht bestanden';
}

export function assetCode(component, asset) {
  if (asset === 'symbol') return component.symbol ? component.symbol_found === true ? 'found' : component.symbol_found === false ? 'not_found' : 'assigned' : 'missing';
  if (asset === 'footprint') return component.footprint ? component.footprint_info?.found ? 'found' : component.footprint_info ? 'not_found' : 'assigned' : 'missing';
  if (asset === 'model3d') {
    const models = component.footprint_info?.models || [];
    if (models.some(m => m.found)) return models.every(m => m.found) ? 'found' : 'partial';
    return models.length ? 'file_missing' : component.model3d ? 'assigned' : component.footprint && !component.footprint_info?.found ? 'unknown' : 'missing';
  }
  if (asset === 'datasheet') return component.datasheet && component.datasheet !== '~' ? 'linked' : 'missing';
  return 'unknown';
}

const assetGerman={"found": "Gefunden", "not_found": "Nicht gefunden", "assigned": "Zugeordnet", "missing": "Fehlt", "partial": "Teilweise gefunden", "file_missing": "Datei fehlt", "unknown": "Unbekannt", "linked": "Verlinkt"};
export function assetState(c,asset){return assetGerman[assetCode(c,asset)];}
export function matchesAssets(component, filter) {
  if (!filter) return true;
  if (filter === 'registered') return component.registered === true;
  if (filter === 'unregistered') return component.registered === false;
  return ['Gefunden', 'Teilweise gefunden', 'Verlinkt'].includes(assetState(component, filter));
}

const blocked=model=>['REJECTED','INCOMPATIBLE','DEPRECATED'].includes(model.status);
export function calculationPass(model){
  return !blocked(model)&&!model.check?.stale&&(!model.file_status||model.file_status==='found')&&(model.check?.ok===true||purposePass(model,''));
}
function intrinsicComplete(c){
  if(!c.intrinsic)return false;
  if(c.kind==='generic')return ['resistance','capacitance','inductance'].some(k=>typeof c.values?.[k]==='number'&&Number.isFinite(c.values[k])&&c.values[k]>=0);
  const fields=c.simulation_fields||{};
  if(!['R','C','L'].includes(fields['Sim.Device'])||fields['Sim.Library'])return false;
  return /^(?:[rcl]\s*=\s*)?[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:meg|[tgkmunpf])?(?:\s|$)/i.test((fields['Sim.Params']||'').trim());
}
function modelType(c,m={}){
  if(['generic','reference'].includes(c.kind)||(c.category||'').startsWith('simulation/generic/'))return 'generic';
  const normalize=value=>String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(m.manufacturer_model||m.model_scope==='specific'||(normalize(m.name)&&normalize(m.name)===normalize(c.name)))return 'specific';
  return 'unknown';
}
function builtinDefinition(c){
  const f=c.simulation_fields||{},device=f['Sim.Device'],type=f['Sim.Type']||'',params=(f['Sim.Params']||'').trim();
  if(f['Sim.Library']||device==='IBIS'||device==='SUBCKT')return false;
  // KiCad generates native SPICE definitions and generic default models.
  if(['D','NPN','PNP','NJFET','PJFET','NMOS','PMOS'].includes(device))return true;
  if(['V','I'].includes(device))return type==='DC'||Boolean(params&&['EXP','PULSE','SIN','PWL','WHITENOISE','RANDUNIFORM'].includes(type));
  if(['SW','TLINE'].includes(device))return Boolean(params);
  if(device==='SPICE')return /\btype="[BEGIV]"/.test(params)&&/\bmodel="[^"]+"/.test(params)&&!(/\blib="[^"]+"/.test(params));
  return false;
}
export function simulationCandidates(c){
  if(c.kind==='footprint')return [];
  const candidates=(c.models||[]).map(m=>({model:m,type:modelType(c,m),availability:m.file_status==='missing'?'missing':m.file_status==='changed'?'changed':m.file_status==='found'&&!blocked(m)?'present':'unknown',intrinsic:false}));
  const fields=c.simulation_fields||{},file=fields['Sim.Library'];
  if(intrinsicComplete(c)||builtinDefinition(c))candidates.push({model:null,type:'generic',availability:'present',intrinsic:true,nativeDevice:fields['Sim.Device']});
  else if(Object.keys(fields).some(key=>key!=='Sim.Enable')||c.intrinsic){
    const state=c.simulation_file_status||(c.simulation_file_found===true?'found':c.simulation_file_found===false?'missing':'unknown');
    candidates.push({model:null,type:modelType(c),availability:file?(state==='found'?'present':state==='missing'?'missing':'fields'):'fields',intrinsic:false});
  }
  return candidates;
}
export function matchesSimulation(c,availability='',evidence='',type='',purpose=''){
  const candidates=simulationCandidates(c);
  if(availability==='incomplete')return !candidates.some(candidate=>candidate.availability==='present')&&matchesSimulation(c,'',evidence,type,purpose);
  if(availability==='none')return !candidates.length&&!evidence&&!type;
  if(!availability&&!evidence&&!type)return true;
  return candidates.some(candidate=>{
    if(availability&&candidate.availability!==availability)return false;
    if(type&&candidate.type!==type)return false;
    if(!evidence)return true;
    const m=candidate.model;
    if(evidence==='untested')return !m||!calculationPass(m);
    if(candidate.availability!=='present'||!m||blocked(m))return false;
    if(evidence==='calculable')return calculationPass(m);
    if(evidence==='diode')return diodeFunctionState(m)==='bestanden';
    if(evidence==='dc'||evidence==='switching')return purposePass(m,evidence);
    if(evidence==='tested')return purposePass(m,purpose);
    if(evidence==='verified')return m.status==='VERIFIED'&&purposePass(m,purpose);
    return false;
  });
}
export function matchesEvidence(c,mode,purpose){return mode==='present'?matchesSimulation(c,'present'):matchesSimulation(c,'',mode,'',purpose);}
export function simulationCode(c,purpose){
  if(c.kind==='footprint')return 'none_applicable';
  const candidates=simulationCandidates(c),present=candidates.filter(x=>x.availability==='present');
  if(present.some(x=>x.model&&purposePass(x.model,purpose)))return purpose==='switching'?'switching_passed':purpose==='dc'?'dc_passed':'purpose_passed';
  if(present.some(x=>x.model&&diodeFunctionState(x.model)==='bestanden'))return 'diode_passed';
  if(present.some(x=>x.model&&calculationPass(x.model)))return 'calculable';
  if(present.some(x=>x.intrinsic))return present.some(x=>x.intrinsic&&x.nativeDevice&&!['R','C','L'].includes(x.nativeDevice))?'native':'passive';
  if(present.length)return 'present';
  if(candidates.some(x=>x.availability==='changed'))return 'changed';
  if(candidates.some(x=>x.availability==='missing'))return 'missing';
  if(candidates.some(x=>x.availability==='unknown'))return 'unknown';
  return candidates.length?'fields':'none';
}

const simulationGerman={"none_applicable": "—", "switching_passed": "Schalttest bestanden", "dc_passed": "DC-Test bestanden", "purpose_passed": "Zwecktest bestanden", "diode_passed": "Dioden-Grundfunktion · weitere Prüfung offen", "calculable": "Berechenbar · Verhalten ungeprüft", "native": "Internes KiCad-Modell · ungeprüft", "passive": "Internes R/C/L-Modell", "present": "Modell vorhanden · ungeprüft", "changed": "Modelldatei geändert", "missing": "Modelldatei fehlt", "unknown": "Modell ungeklärt / ausgeschlossen", "fields": "Nur SIM-Felder", "none": "Kein Modell"};
export function simulation(c,purpose){return simulationGerman[simulationCode(c,purpose)];}
export function selectionPayload(component, purpose) {
  return {schema_version: 1, adapter: 'kicad-parts-manager-selection', component_id: component.id,
    kicad_reference: component.kicad_reference, symbol: component.symbol, footprint: component.footprint,
    kind: component.kind, registered: component.registered, purpose: purpose || null,
    models: component.models, simulation_fields: component.simulation_fields || {}, automatic_placement: false,
    electrical_parameters:Object.fromEntries(Object.keys(component.values||{}).map(key=>[key,exportParameter(component,key)]))};
}

export function exportParameter(component,key) {
  const value=component.values?.[key],evidence=parameterEvidence(component,key);
  const definition=availableProfile(component.category||'').find(f=>f[0]===key);
  const original=component.parameters?.find(p=>p.name===key);
  const described=evidence.sourceType==='description';
  return {value:value??null,stored_unit:evidence.unit||original?.unit||'',display_unit:definition?.[2]??'',display_factor:definition?.[3]??1,
    kind:evidence.kind||original?.kind||'unspecified',source_type:evidence.sourceType,
    source:evidence.source||(described?'KiCad-Beschreibung: '+component.symbol:original?.source||component.source_file||''),conditions:evidence.conditions||(described?component.description:''),conditions_data:evidence.conditions_data||original?.conditions||{},
    source_details:evidence.source_details||{},status:evidence.status||'UNVERIFIED'};
}

export function catalogCsv(rows,fields,purpose='') {
  const ids=['name','kind','manufacturer','category','symbol','footprint','datasheet','library','kicad_reference','model3d'];
  const metadata=['stored_unit','display_unit','display_factor','kind','source_type','source','conditions','conditions_data','source_details','status'];
  const header=[...ids,...fields.flatMap(([key])=>[key,...metadata.map(name=>key+'.'+name)]),'model3d_status','simulation'];
  const lines=[header.map(csvCell).join(';')];
  for(const component of rows){
    const values=ids.map(key=>component[key]);
    for(const [key] of fields){const exported=exportParameter(component,key);values.push(exported.value,...metadata.map(name=>typeof exported[name]==='object'?JSON.stringify(exported[name]):exported[name]));}
    values.push(assetState(component,'model3d'),simulation(component,purpose));lines.push(values.map(csvCell).join(';'));
  }
  return '\ufeff'+lines.join('\r\n');
}

export function csvCell(value) {
  let string = String(value ?? '');
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(string)) string = "'" + string;
  return '"' + string.replaceAll('"', '""') + '"';
}
export function descriptionRatings(component) {
  const result = {};
  // Only explicitly labelled Vds/Id entries; never infer an unlabelled voltage/current.
  const definitions=component.category.includes('/mosfet')?[['vds_max','V','Vds'],['id_cont','A','Id']]:component.category.includes('/bjt')?[['vce_description','V','Vce'],['ic_description','A','Ic']]:[];
  for (const [key, unit, label] of definitions) {
    const pattern = new RegExp(`(?:^|[,;\\s])([+\\-−]?[0-9]+(?:\\.[0-9]+)?)\\s*(m?)${unit}\\s+${label}\\b`, 'gi');
    const matches = [...component.description.matchAll(pattern)];
    if(matches.length===1){const value=Number(matches[0][1].replace('−','-'))*(matches[0][2].toLowerCase()==='m'?.001:1);if(value>=0||/p_channel|\/pnp(?:\/|$)/.test(component.category)||/P[- ]Channel|\bPNP\b/i.test(component.description))result[key]=Math.abs(value);}
  }
  if(component.category.includes('/diode')) {
    // Unlabelled leading values are useful search hints, not certified VR/IF ratings.
    const match=component.description.match(/^\s*(\d+(?:\.\d+)?)\s*V\s*[,;]?\s+(\d+(?:\.\d+)?)\s*(m?)A\b/i);
    if(match){result.voltage_description=Number(match[1]);result.current_description=Number(match[2])*(match[3].toLowerCase()==='m'?.001:1);}
  }
  return result;
}

export function functionTags(component) {
  if(!component.category.startsWith('integrated/'))return [];
  const value=component.description.toLowerCase(), tags=[];
  for(const [pattern,label] of [[/\bbuffer\b/,'Buffer'],[/unity[ -]gain/,'Verstärkung 1'],[/wide[ -]band/,'Breitbandig'],[/high[ -]current/,'Hoher Strom (qualitativ)'],[/operational|\bop[ -]?amp/,'Operationsverstärker'],[/comparator/,'Komparator'],[/voltage regulator/,'Spannungsregler']])if(pattern.test(value))tags.push(label);
  return tags;
}

// Search fields are deliberately separate from certified manufacturer ratings.
export const profiles = sharedProfiles;
export function family(path) {
  const parts=path.split('/');
  for(const name of ['ferrite','emc_filter','rf_filter','filter','tvs','zener','mosfet','bjt','fet','diode','resistor','capacitor','inductor','connectors','integrated'])if(parts.includes(name))return name;
  return 'general';
}
export function baseProfile(path){const parts=path.split('/');for(let n=parts.length;n>0;n--){const key=parts.slice(0,n).join('/');if(Object.hasOwn(profiles,key))return profiles[key];}return profiles[family(path)];}

export function availableProfile(path){return [...baseProfile(path),...(profiles.__common||[])];}
export function profile(path){return baseProfile(path).filter(f=>!f[4]?.optional);}
export function parameterEvidence(component,key){
  const local=component.manual_data?.values?.[key];
  return {...(local||{}),sourceType:local?(local.source_details?.document==='KiCad symbol description'?'description':local.source_details?.candidate_id?'manufacturer':'manual'):component.description_values?.[key]!=null?'description':component.values?.[key]!=null?'catalog':'unknown'};
}
export function matchesParameter(value,limit,evidence={}){
  if(limit.kind&&evidence?.kind!==limit.kind)return false;
  if(limit.sourceType&&evidence?.sourceType!==limit.sourceType)return false;
  for(const [key,wanted] of Object.entries(limit.conditions||{})){const actual=evidence?.conditions_data?.[key];if(actual==null){if(!limit.includeUnknown)return false;}else if(typeof wanted==='string'?actual!==wanted:typeof actual!=='number'||Math.abs(actual-wanted)>Math.max(Math.abs(wanted)*1e-9,1e-18))return false;}
  if(limit.value==null||limit.value==='')return true;
  if(value==null)return limit.includeUnknown===true;
  if(limit.direction==='text')return limit.value.every(wanted=>String(value).split(';').map(x=>x.trim()).includes(wanted));
  if(typeof value!=='number'||!Number.isFinite(value))return false;
  if(limit.absolute)value=Math.abs(value);
  if(limit.direction==='range')return (limit.value.min==null||value>=limit.value.min)&&(limit.value.max==null||value<=limit.value.max);
  if(limit.direction==='equal')return Math.abs(value-limit.value)<=Math.max(Math.abs(limit.value)*1e-9,1e-18);
  return limit.direction==='min'?value>=limit.value:value<=limit.value;
}

export function extraRatings(component) {
  const result={}, seen=new Set(), ambiguous=new Set(), f=family(component.category), description=component.description||'';
  function single(key, expression, scale=1) {
    const matches=[...description.matchAll(expression)];
    if(matches.length){if(matches.length!==1||seen.has(key)){ambiguous.add(key);delete result[key];}else{seen.add(key);const value=Number(matches[0][1])*scale;if(Number.isFinite(value))result[key]=value;}}
  }
  const number='(\\d+(?:\\.\\d+)?)';
  function unit(key,unit,scale=1){single(key,new RegExp(`(?:^|[\\s,;])${number}\\s*${unit}(?=$|[\\s,;])`,'g'),scale);}
  if(['resistor','capacitor','inductor'].includes(f)) {
    single('tolerance_description',/(\d+(?:\.\d+)?)\s*%/g);
    for(const [prefix,scale] of [['p',1e-12],['n',1e-9],['u',1e-6],['µ',1e-6],['m',1e-3],['',1]]) {
      if(f==='capacitor')unit('capacitance',prefix+'F',scale);
      if(f==='inductor')unit('inductance',prefix+'H',scale);
    }
    if(f==='resistor') {
      for(const [prefix,scale] of [['M',1e6],['k',1e3],['',1]])unit('resistance',prefix+'(?:Ω|Ohm|ohms?)',scale);
    }
  }
  // Generic voltage/current parsing is only used for non-semiconductor families.
  if(['general','capacitor','inductor'].includes(f)){unit('voltage_description','V');unit('current_description','A');unit('current_description','mA',.001);}
  if(['general','resistor','inductor','zener','tvs','diode'].includes(f)){unit('power_description','W');unit('power_description','mW',.001);}
  if(f==='zener')single('zener_description',/^\s*(\d+(?:\.\d+)?)\s*V\b/g);
  if(f==='tvs') {
    for(const [key,label] of [['stand_off_description','(?:VRWM|stand.?off)'],['breakdown_description','(?:VBR|breakdown)'],['clamp_description','(?:clamping|VCL)']])
      single(key,new RegExp(`${label}\\s*[:=]?\\s*${number}\\s*V`,'gi'));
  }
  if(f==='connectors') {
    single('pins_description',/(\d+)\s*[- ](?:pins?|positions?|poles?)\b/gi);
    single('pitch_description',/(\d+(?:\.\d+)?)\s*mm\s*(?:pitch|raster)/gi);
    const matrix=description.match(/\b(\d+)\s*x\s*(\d+)\b/i);
    if(matrix && /connector|header|socket/i.test(description) && !('pins_description' in result))result.pins_description=Number(matrix[1])*Number(matrix[2]);
  }
  if(f==='integrated') {
    single('bandwidth_description',/(\d+(?:\.\d+)?)\s*MHz\s*(?:bandwidth|BW)/gi,1e6);
    const supply=description.match(/(?:supply|versorgung)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:V\s*)?(?:to|[-–])\s*(\d+(?:\.\d+)?)\s*V/i);
    if(supply){result.supply_min_description=Number(supply[1]);result.supply_max_description=Number(supply[2]);}
  }
  for(const key of ambiguous)delete result[key];
  return result;
}

export function categoryPath(component) {
  if(component.category_override!=null)return component.category;
  if(component.kind==='generic' && component.intrinsic) return 'simulation/generic/'+component.category.split('/').at(-1);
  return component.category;
}
export function matchesView(component, view) {
  if(view==='footprints') return component.kind==='footprint';
  if(view==='pcb') return component.kind==='footprint'||assetState(component,'footprint')==='Gefunden';
  if(component.kind==='footprint') return false;
  if(view==='schematic') return !!component.symbol && component.symbol_found!==false;
  if(view==='simulation') return categoryPath(component).startsWith('simulation/')||component.intrinsic||simulationCandidates(component).length>0;
  return true;
}

// Shared symbol/footprint drawing for catalog and import previews.
export function geometrySvg(doc,data,label){
 const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg'),points=[],drawing=doc.createElementNS(ns,'g');
 if(data.flip_y)drawing.setAttribute('transform','scale(1,-1)');svg.append(drawing);
 const set=(tag,attrs)=>{const e=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
 for(const shape of data.shapes||[]){let node;
  if(shape.a&&shape.b){points.push(shape.a,shape.b);const [x,y]=shape.a,[u,v]=shape.b;node=shape.type==='line'?set('line',{x1:x,y1:y,x2:u,y2:v}):set('rect',{x:Math.min(x,u),y:Math.min(y,v),width:Math.abs(u-x),height:Math.abs(v-y),class:shape.type==='pad'?'pad':''});}
  else if(shape.type==='polyline'){points.push(...shape.points);node=set('polyline',{points:shape.points.map(p=>p.join(',')).join(' ')});}
  else if(shape.type==='circle'){const [x,y]=shape.center,r=shape.radius;points.push([x-r,y-r],[x+r,y+r]);node=set('circle',{cx:x,cy:y,r});}
  else if(shape.type==='text'){
   const [x,y]=shape.at,size=(shape.size||.8)*1.25,anchor=shape.anchor||'start',angle=shape.angle||0;
   const width=String(shape.label).length*size*.65,left=anchor==='end'?-width:anchor==='middle'?-width/2:0;
   const corners=[[left,-size],[left+width,-size],[left,size],[left+width,size]],rad=angle*Math.PI/180;
   points.push(...corners.map(([u,v])=>[x+u*Math.cos(rad)-v*Math.sin(rad),y+u*Math.sin(rad)+v*Math.cos(rad)]));
   node=set('text',{x:0,y:0,'font-size':size,'text-anchor':anchor,'dominant-baseline':shape.baseline||'auto',class:'symbol-label'});node.textContent=shape.label;
   node.setAttribute('transform',`translate(${x},${y}) rotate(${angle})${data.flip_y?' scale(1,-1)':''}`);
  }
  if(node)drawing.append(node);
 }
 if(points.length){const xs=points.map(p=>p[0]),ys=points.map(p=>data.flip_y?-p[1]:p[1]),x=Math.min(...xs)-1,y=Math.min(...ys)-1;svg.setAttribute('viewBox',`${x} ${y} ${Math.max(...xs)-x+1} ${Math.max(...ys)-y+1}`);}
 svg.setAttribute('role','img');svg.setAttribute('aria-label',label);return svg;
}
