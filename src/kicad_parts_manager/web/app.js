import {geometrySvg} from './catalog-utils.js';
import {searchProfilesDialog,parameterSignature,validateSearch,parseShortSearch,shortSearchLimit,matchesShortPackage} from './search-profiles.js';
import {attachValueInfo,hideValueInfo} from './context-help.js';
import {apiError,showError,initLanguage,initSupport,t,locale,translateDocument,fieldLabel,conditionLabel,kindLabel,originLabel,evidenceSummary} from './i18n.js';
import {manufacturerDialog,manufacturerLibraryDialog} from './manufacturer-parameters.js';
import {aboutDialog} from './about-dialog.js';
import {categoryDialog,categoryRequest} from './category-dialog.js';
import {simulationCoverageDialog} from './simulation-coverage.js';
import {coverageDialog,pilotSupported,parameterState} from './data-coverage.js';
import {manualEditor} from './manual-editor.js';
import {modelWizard,createProgress,decorateClose} from './model-wizard.js';
import {engineeringUnit,engineeringDisplay,engineeringInput,assetCode,simulationCode,categoryPath, matchesView, assetState, matchesAssets, matchesSimulation, simulationCandidates, purposePass, diodeFunctionState, simulation, selectionPayload, catalogCsv, compareValues, descriptionRatings, functionTags, profile, extraRatings, profiles, availableProfile, matchesParameter, parameterEvidence, localDataKey,exportParameter} from './catalog-utils.js';
const $ = id => document.getElementById(id);
let labels,kinds;function updateLabels(){labels = {passive:t('caption.8351e43d240e'),semiconductor:t('caption.8ed9d65c067b'),transistor:t('caption.c846c9b10db9'),fet:'FET',mosfet:'MOSFET',n_channel:t('caption.2199b39678bc'),p_channel:t('caption.d82bb6342f17'),bjt:'BJT',npn:'NPN',pnp:'PNP',igbt:'IGBT',other:t('caption.aa61ce5c8994'),diode:t('caption.a2109164ddb6'),standard:'Standard',schottky:'Schottky',zener:'Zener',resistor:t('caption.3a5e5aaceb0f'),capacitor:t('caption.a0e6e00db85f'),inductor:t('caption.8be4097c3c1a'),libraries:t('caption.f862aaa1e40b'),footprints:'Footprints',connectors:t('caption.d6eb39859ef0'),integrated:t('caption.4a87baf89587'),amplifier:t('caption.de491d68e205'),digital:'Digital'};
Object.assign(labels,Object.fromEntries(["standard_resistor", "precision", "shunt", "power_resistor", "resistor_network", "adjustable", "potentiometer", "trimmer", "ceramic", "aluminium_electrolytic", "aluminium_polymer", "hybrid", "tantalum", "film", "supercapacitor", "adjustable_capacitor", "rotary"].map(key=>[key,t('category.passive.'+key)])));
Object.assign(labels,Object.fromEntries(["melting_fuse", "resettable_fuse", "thermal_fuse", "pushbutton", "toggle_rocker", "slide_switch", "rotary_switch", "dip_switch", "reed_switch", "limit_switch", "electromechanical_relays", "monostable_relay", "bistable_relay", "reed_relay", "solid_state_relay", "rotary_encoder", "jumpers"].map(key=>[key,t("category.selection."+key)])));
Object.assign(labels,{"transistor":t('caption.c846c9b10db9'),"logic":t('caption.eff6565df040'),"triac":t('caption.87f07d5c95e2'),"microphone":t('caption.bb14fec134dc'),"speaker":t('caption.8cb91241fee3'),"buzzer":"Buzzer","antenna":t('caption.92236519fa79'),"balun":"Baluns","common_mode_choke":t('caption.53b0af67bc99'),"temperature":t('caption.2da10076c9e7'),"pressure":t('caption.d9afd08a61d8'),"current":t('caption.7222c5506fcf'),"voltage":t('caption.5fa34faee5f4'),"distance":t('caption.068f35af81c1'),"magnetic":t('caption.000be6cf4aca'),"humidity":t('caption.ee3afd266f47'),"emc_filter":t('caption.a9255d285924'),"rf_filter":t('caption.dacda5affe6f'),"unassigned": t('caption.d4308f999db4'), "analog": t('caption.057ea4d1ce78'), "instrumentation": t('caption.91b3ac2aadc8'), "buffer": "Buffer", "audio_amp": t('caption.f7c2c9928c9c'), "opamp": t('caption.839fb0f3722b'), "differential": t('caption.f012fa6a3929'), "comparator": t('caption.5622b31f4f8e'), "voltage_reference": t('caption.8daf26246ee3'), "current_reference": t('caption.78a49d683139'), "analog_switch": t('caption.05fb0d1650c9'), "digital_pot": t('caption.479a1d23c5c4'), "power_ic": t('caption.2df3e458d674'), "charger": t('caption.43174d9c1a12'), "supervisor": t('caption.93542e95957e'), "protection_ic": t('caption.a78ad22c39de'), "linear_regulator": t('caption.044303b314db'), "switch_regulator": t('caption.936ea9fa33fb'), "drivers": t('caption.4e597bfbb443'), "gate_driver": t('caption.eb9d234819cb'), "motor_driver": t('caption.f5a6d2aa5a6c'), "led_driver": t('caption.3a823f03c472'), "display_driver": t('caption.e61c6c49b08b'), "relay_driver": t('caption.0cbf1e2775ec'), "converters": t('caption.63d6e8406101'), "adc": "ADC", "dac": "DAC", "interfaces": t('caption.9737c3e601d9'), "can_lin": "CAN / LIN", "serial": "UART / RS232 / RS485", "usb_ic": "USB", "ethernet_ic": "Ethernet", "isolation": t('caption.fbd4014507b6'), "logic": t('caption.89aa65653b29'), "level_translator": t('caption.3d5bc4493801'), "logic_family": t('caption.b6437f0da560'), "processors": t('caption.7b08d40af250'), "mcu": t('caption.b96c3158cf5d'), "cpu": "CPU", "dsp": "DSP", "memory": t('caption.4a6d2dcf3b9c'), "eeprom": "EEPROM", "flash": "Flash", "ram": "RAM", "rom": "ROM", "programmable": t('caption.53d7ca9ac15b'), "fpga": "FPGA", "cpld": "CPLD", "timing": t('caption.96d80af948e8'), "rtc": "RTC", "pll": "PLL", "timer": "Timer", "rf_ic": t('caption.5e1d3263c817'), "transceiver": "Transceiver", "rf_amp": t('caption.fddf8be8a4e4'), "headers": t('caption.096c7626b39f'), "board_board": t('caption.d5ccec616422'), "wire_board": t('caption.b444ca7049fc'), "terminal": t('caption.1d56ae0c08e5'), "ffc_fpc": "FFC / FPC", "usb": "USB", "network": t('caption.3fcdec623008'), "dsub": "D-Sub", "rf_coax": t('caption.beeb346e0049'), "audio_video": "Audio / Video", "card": t('caption.aba46027eae5'), "ic_socket": t('caption.1849487f91a1'), "power_connector": t('caption.8ebc83e9ce5e'), "round": t('caption.b3e3b95591fc'), "modules": t('caption.f148224ae44f'), "acdc": "AC/DC", "dcdc": "DC/DC", "radio": t('caption.9543991b2bb9'), "module_other": t('caption.bac1121fdc3a'), "sensors": t('caption.595b5974fcaa'), "switches": t('caption.5ac4b1303d83'), "relays": t('caption.3645ed7f69e5'), "timing_parts": t('caption.00213e3fa377'), "crystals": t('caption.2d6263dc4150'), "oscillators": t('caption.9c0e2eeabff4'), "transformer": t('caption.7c297e0f26e3'), "ferrite": t('caption.deb633a52c55'), "protection": t('caption.980d256e8f01'), "varistor": t('caption.4778e273ec54'), "fuse": t('caption.e4e68d09eb99'), "opto": t('caption.08ce896358bd'), "optocoupler": t('caption.14adbf14b878'), "led": "LED", "display": "Displays", "mechanical": t('caption.689c81a85c3a'), "radio_parts": t('caption.45d9f8bcd0f0'), "filter": "Filter", "audio_parts": t('caption.a73d0d11f0f2'), "thyristor": t('caption.6756ef77391f'), "schematic": t('caption.707c1e0c857d'), "power_ports": t('caption.7c199ff60913')});
Object.assign(labels,Object.fromEntries(["magnetics", "suppression", "general_inductor", "power_inductor", "rf_inductor", "coupled_inductor", "differential_choke", "cable_ferrite", "ferrite_other", "mains_transformer", "switching_transformer", "signal_transformer", "current_transformer", "ferrite"].map(key=>[key,t('category.magnetic.'+key)])));
Object.assign(labels,{"common_mode_choke":t('caption.53b0af67bc99'),"temperature":t('caption.2da10076c9e7'),"pressure":t('caption.d9afd08a61d8'),"current":t('caption.7222c5506fcf'),"voltage":t('caption.5fa34faee5f4'),"distance":t('caption.068f35af81c1'),"magnetic":t('caption.000be6cf4aca'),"humidity":t('caption.ee3afd266f47'),"emc_filter":t('caption.a9255d285924'),"rf_filter":t('caption.dacda5affe6f'),flipflop:'Flipflops / Latches',counter:t('caption.6e35c041ae8d'),multiplexer:'Multiplexer',logic_buffer:t('caption.7b74ab9b262e'),gates:t('caption.0a0152d8ed8f')});
Object.assign(labels,{"common_mode_choke":t('caption.53b0af67bc99'),"temperature":t('caption.2da10076c9e7'),"pressure":t('caption.d9afd08a61d8'),"current":t('caption.7222c5506fcf'),"voltage":t('caption.5fa34faee5f4'),"distance":t('caption.068f35af81c1'),"magnetic":t('caption.000be6cf4aca'),"humidity":t('caption.ee3afd266f47'),"emc_filter":t('caption.a9255d285924'),"rf_filter":t('caption.dacda5affe6f'),test_points:t('caption.8558c49c3f86'),graphics:t('caption.dc9298f548d8'),video_ic:'Video-ICs',security_ic:t('caption.789e00d50f09'),electromechanical:t('caption.60237938e43a'),valve:t('caption.3984a5264124')});
kinds = {generic:t('caption.2f2237e26a9a'),reference:t('caption.9ca8e8a3edf4'),manufacturer:t('caption.cd8cc7331d9c'),library:t('caption.a858a275b791'),footprint:'Footprint'};
Object.assign(labels,{"common_mode_choke":t('caption.53b0af67bc99'),"temperature":t('caption.2da10076c9e7'),"pressure":t('caption.d9afd08a61d8'),"current":t('caption.7222c5506fcf'),"voltage":t('caption.5fa34faee5f4'),"distance":t('caption.068f35af81c1'),"magnetic":t('caption.000be6cf4aca'),"humidity":t('caption.ee3afd266f47'),"emc_filter":t('caption.a9255d285924'),"rf_filter":t('caption.dacda5affe6f'),tvs:t('caption.b5fdc58b961a'),bridge:t('caption.8bca32cde821'),rectifier:t('caption.acc59d1ea60d'),switching:t('caption.8f3584f7eea9'),varactor:t('caption.b7276ad13e78'),laser:t('caption.33d6288da985'),photodiode:t('caption.94d6fc49143c')});
Object.assign(labels,Object.fromEntries(["arrays", "complementary", "power_modules", "silicon", "sic", "gan", "diode_module", "thyristor_module", "mixed_module"].map(key=>[key,t('category.transistors.'+key)])));
Object.assign(labels,{"common_mode_choke":t('caption.53b0af67bc99'),"temperature":t('caption.2da10076c9e7'),"pressure":t('caption.d9afd08a61d8'),"current":t('caption.7222c5506fcf'),"voltage":t('caption.5fa34faee5f4'),"distance":t('caption.068f35af81c1'),"magnetic":t('caption.000be6cf4aca'),"humidity":t('caption.ee3afd266f47'),"emc_filter":t('caption.a9255d285924'),"rf_filter":t('caption.dacda5affe6f'),simulation:'Simulation',generic:t('caption.a678f03f6fdc'),sources:t('caption.c7860048458f'),measurement:t('caption.75e44378ec01'),function_blocks:t('caption.1ef4fd33f8e3')});}
updateLabels();
const mosfetColumns = [['vds_max',t('caption.0c8a2d61bfe2'),'V',1],['id_cont',t('caption.4385d6938db4'),'A',1],['rds_on','RDS(on)','mΩ',1000],['rds_on_vgs',t('caption.26f5d877dc8c'),'V',1],['qg','Qg','nC',1e9]];
const diodeColumns = [['voltage_description',t('caption.3c51c72dec64'),'V',1],['current_description',t('caption.5aac5f1c50e5'),'A',1],['vr_max',t('caption.700e0f943078'),'V',1],['if_avg',t('caption.a5283941e4f4'),'A',1],['vf_typ','VF typ.','V',1],['trr','trr','ns',1e9]];
const bjtColumns = [['vce_description',t('caption.4afa10de77ca'),'V',1],['ic_description',t('caption.53613b7d610d'),'A',1]];
const passiveColumns = {resistor:[['resistance',t('caption.d98aec1798ad'),'Ω',1]],capacitor:[['capacitance',t('caption.97b15223593d'),'µF',1e6]],inductor:[['inductance',t('caption.2db352a29e14'),'mH',1000]]};
let data, category='', selected=null, sort='name', ascending=true, current=[], columns=[], page=0;
const categorySelection=new Set();let categoryUndo=null;
const categoryEditable=c=>c.kind!=='footprint'&&!!(c.symbol||c.import_key||c.id?.startsWith('CMP-'));
function updateCategorySelection(){
 $('category-change').disabled=!categorySelection.size||categorySelection.size>1000;
 $('category-count').textContent=categorySelection.size?t('category.selection',{count:categorySelection.size}):'';
 for(const row of $('rows').children){const active=categorySelection.has(row.dataset.componentId);row.classList.toggle('selected',active);row.setAttribute('aria-selected',String(active));const check=row.querySelector('.category-select');if(check)check.checked=active;}
}
function applyCategoryChanges(changes){
 for(const change of changes){const row=data.components.find(c=>c.id===change.component_id);if(row)Object.assign(row,{category:change.category,automatic_category:change.automatic_category,category_override:change.category_override,category_revision:change.category_revision});}
 categorySelection.clear();selected=null;buildTree();
 const common=changes.length&&changes.every(c=>c.category===changes[0].category)?uiPath(changes[0].category):'';
 if($('tree-mode').value==='category')chooseCategory(common);else{buildFilters();render();}
 if(common&&$('tree-mode').value==='category')for(const node of $('tree').querySelectorAll('[data-category]'))if(node.dataset.category===common){let parent=node.parentElement;while(parent&&parent.id!=='tree'){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}}
 renderDetails();updateCategorySelection();
}
async function openCategoryDialog(){
 const rows=data.components.filter(c=>categorySelection.has(c.id)&&categoryEditable(c));if(!rows.length)return;
 await categoryDialog(rows,path=>pathLabel(uiPath(path)),changes=>{categoryUndo=changes.map(c=>({component_id:c.component_id,revision:c.category_revision,category:c.previous_category}));applyCategoryChanges(changes);$('category-notice').textContent=t('category.changed',{count:changes.length});$('category-undo').hidden=false;});
}
const limits = {}, pageSize=100;
let missingField='',profileColumns=null;
let shortSearch=null;
let packageSize='';
const filterInputs = new Map();
const filterComparisons = new Map();
const scopeCache=new Map(),searchTexts=new WeakMap(),derivedValues=new Map();
const entryParameters=new URLSearchParams(typeof location==='undefined'?'':location.search);
// Opt-in local diagnostics: no extra interface or data requests.
const timings=[];
function recordTime(name,start){if(!entryParameters.has('measure'))return;timings.push({name,ms:Math.round((performance.now()-start)*10)/10});if(timings.length>50)timings.shift();document.body.dataset.catalogTimings=JSON.stringify(timings);}
function measureWork(name,work){if(!entryParameters.has('measure'))return work();const start=performance.now();try{return work();}finally{recordTime(name,start);}}
for(const [parameter,id] of [['workspace','workspace-view'],['kind','kind']]){const value=entryParameters.get(parameter);if(value&&[...$(id).options].some(option=>option.value===value))$(id).value=value;}
if(entryParameters.get('workspace')==='footprints')$('kind').value='footprint';
if(entryParameters.get('workspace')==='pcb')$('asset').value='footprint';
if($('workspace-view').value==='simulation')$('model-availability').value='present';
function effectiveWorkspace(workspace=$('workspace-view').value,kind=$('kind').value){return !workspace&&kind==='footprint'?'footprints':workspace;}
function syncToolbar(){
 const simulation=$('workspace-view').value==='simulation';
 for(const node of document.querySelectorAll('[data-simulation-filter]'))node.hidden=!simulation;
 const box=$('active-extra-filters');box.replaceChildren();
 for(const id of ['kind','purpose','availability-detail','evidence','model-type']){
  const control=$(id);if(!control.value||control.closest('[hidden]'))continue;
  const button=document.createElement('button');button.type='button';
  const caption=control.closest('label').querySelector('span')?.textContent||t('catalog.simPurpose');
  button.textContent=caption+': '+control.selectedOptions[0].textContent+' ×';button.setAttribute('aria-label',t('catalog.clearFilter',{filter:caption}));
  button.addEventListener('click',()=>{control.value='';control.dispatchEvent(new control.ownerDocument.defaultView.Event('input',{bubbles:true}));});box.append(button);
 }
 box.hidden=!box.childElementCount;
}
$('workspace-view').addEventListener('change',()=>{
 for(const id of ['kind','purpose','evidence','model-availability','availability-detail','model-type','library','asset'])$(id).value='';
 $('model-availability').value=$('workspace-view').value==='simulation'?'present':'';
 shortSearch=null;packageSize='';$('search').value='';renderShortSearch();syncToolbar();
});
syncToolbar();
if(entryParameters.has('q'))$('search').value=entryParameters.get('q');
function text(tag,value,cls) { const el=document.createElement(tag); el.textContent=value; if(cls)el.className=cls; return el; }
initSupport(document);
initLanguage(document,{onChange:()=>{updateLabels();if(data){const state=captureSearch(),selection=selected,quick=shortSearch;applySearch(state);selected=selection;if(quick){shortSearch=quick;$('search').value=quick.raw;renderShortSearch();}renderDetails();}const light=document.body.classList.contains('light');$('theme').dataset.i18n=light?'theme.dark':'theme.light';translateDocument(document);document.querySelectorAll('.context-help').forEach(panel=>panel.hidden=true);}});
updateLabels();
function display(value,factor=1) { return value==null||value===''?'—':typeof value==='number'?(value*factor).toLocaleString(locale(),{maximumSignificantDigits:6}):typeof value==='boolean'?(value?t('caption.cde9e58a9a4e'):t('caption.90ebc1bde6f3')):String(value); }
function categoryCaption(part,path='') { return part==='other'&&/^(?:passive\/(?:resistor|capacitor|magnetics)|switches|relays|protection\/fuse)(\/|$)/.test(path)?t('category.passive.unspecified'):labels[part]||part; }
function pathLabel(path) { return path.split('/').map(x=>categoryCaption(x,path)).join(' / '); }
function uiPath(path) { return path.replace('transistor/mosfet','transistor/fet/mosfet'); }
function rowPath(c) { return $('tree-mode').value==='library' ? (c.kind==='footprint'?'footprints/':'libraries/')+(c.library||'KiCad Parts Manager') : uiPath(categoryPath(c)); }
function scopeRows(){const workspace=effectiveWorkspace(),key=JSON.stringify([workspace,$('tree-mode').value,category]);if(!scopeCache.has(key))scopeCache.set(key,data.components.filter(c=>matchesView(c,workspace)&&(!category||rowPath(c)===category||rowPath(c).startsWith(category+'/'))));return scopeCache.get(key);}
function searchText(c){if(!searchTexts.has(c))searchTexts.set(c,[c.name,c.description,c.manufacturer,c.id,c.library,c.symbol,c.footprint].join(' ').toLowerCase());return searchTexts.get(c);}
function buildTree() {
  return measureWork('tree',buildTreeContent);
}
function buildTreeContent() {
  scopeCache.clear();
  const root=Object.create(null), counts=new Map();
  for(const c of data.components.filter(c=>matchesView(c,effectiveWorkspace()))) {
    const parts=rowPath(c).split('/'); let node=root;
    for(let i=0;i<parts.length;i++) { const key=parts.slice(0,i+1).join('/'); counts.set(key,(counts.get(key)||0)+1); node=node[parts[i]]??=Object.create(null); }
  }
  function renderNode(node,parent,path='') {
    for(const [part,children] of Object.entries(node).sort(([a],[b])=>(labels[a]||a).localeCompare(labels[b]||b,'de',{numeric:true}))) {
      const full=path?`${path}/${part}`:part, count=counts.get(full)||0;
      const group=text('div','','tree-node'), caption=`${categoryCaption(part,full)} (${count})`; let target;
      if(Object.keys(children).length) {
        const detail=document.createElement('details'); detail.open=!path&&['passive','semiconductor'].includes(part);
        target=text('summary',caption); detail.append(target); renderNode(children,detail,full); group.append(detail);
      } else { target=text('button',caption,'category'); group.append(target); }
      target.dataset.category=full;
      target.addEventListener('click',event=>{
        if(target.tagName==='SUMMARY' && event.offsetX<16) return;
        chooseCategory(full);
      });
      parent.append(group);
    }
  }
  $('tree').replaceChildren(); renderNode(root,$('tree'));
}
function chooseCategory(path) {
  return measureWork('category',()=>chooseCategoryContent(path));
}
function chooseCategoryContent(path) {
  categorySelection.clear();
  clearShortSearch();
  $('search').value='';
  $('table-mode').value='parameters';
  category=path; profileColumns=null; missingField=''; page=0; for(const key of Object.keys(limits))delete limits[key];
  document.querySelectorAll('[data-category]').forEach(el=>el.classList.toggle('active',el.dataset.category===path));
  $('breadcrumb').textContent=path?pathLabel(path):t('caption.d5a9ae17c387'); buildFilters(); render();
}
function buildFilters() {
  return measureWork('filters',buildFiltersContent);
}
function buildFiltersContent() {
  filterInputs.clear();filterComparisons.clear();
  const available=availableProfile(category);let saved;try{saved=JSON.parse(localStorage.getItem('kicad-parts-manager.columns.'+category));}catch{}columns=profileColumns!==null?available.filter(f=>profileColumns.includes(f[0])):Array.isArray(saved)?available.filter(f=>saved.includes(f[0])):profile(category);
  columns=columns.map(f=>[f[0],fieldLabel(f[0],f[1]),f[2],f[3],f[4]]);
  $('filters').replaceChildren();
  for(const [key,label,unit,factor,metadata={}] of columns) {
    if(metadata.type==='text'){const input=document.createElement('select');input.multiple=metadata.multiple===true;if(input.multiple)input.size=2;input.setAttribute('aria-label',label+t('caption.e44f28bbe928'));const blank=text('option',t('caption.3801a35c5182'));blank.value='';input.append(blank);const options=new Set(metadata.options||[]);for(const c of scopeRows()){if(c.values[key]!=null)for(const value of String(c.values[key]).split(';').map(x=>x.trim()))options.add(value);}for(const value of [...options].sort()){const option=text('option',value);option.value=value;input.append(option);}input.addEventListener('change',()=>{const chosen=[...input.selectedOptions].map(x=>x.value).filter(Boolean);limits[key]={value:chosen.length?chosen:null,direction:'text'};page=0;render();});filterInputs.set(key,input);$('filters').append(input);continue;}
    let direction=metadata.comparison||'min';
    const wrap=text('label',`${label}${unit?' ('+unit+')':''}`), input=document.createElement('input');
    input.type=engineeringUnit(key)?'text':'number'; input.inputMode='decimal'; input.step='any'; input.placeholder=t('caption.d0c50fd56cbc');
    input.placeholder=direction==='equal'?t('caption.643fc524d4e8'):direction==='min'?t('caption.d885f1787773'):t('caption.75ef1c45ef14');if(engineeringUnit(key)){input.placeholder=t('units.default',{unit});input.title=t('units.inputHelp',{unit});}filterInputs.set(key,input);
    input.setAttribute('aria-label',`${label} ${direction==='equal'?t('caption.98970d1a1b80'):direction==='min'?t('caption.b4eb1c411928'):t('caption.7c119e0a0dcb')} in ${unit}`);
    const comparison=document.createElement('select');comparison.setAttribute('aria-label',t('caption.897213b61ddb')+label);for(const [value,caption] of [['min',t('caption.104b0566cd34')],['max',t('caption.f44fe758e723')],['equal',t('caption.9bc6b6a7c5a9')],['range',t('caption.20d0ffd0e4e2')]]){const option=text('option',caption);option.value=value;comparison.append(option);}comparison.value=direction;filterComparisons.set(key,comparison);
    const upper=document.createElement('input');upper.type=engineeringUnit(key)?'text':'number';upper.inputMode='decimal';upper.step='any';upper.hidden=true;upper.placeholder=t('caption.078a815372af');upper.setAttribute('aria-label',label+t('caption.2ac42956e201')+unit);input._upper=upper;
    const update=()=>{direction=comparison.value;input.setAttribute('aria-label',label+' '+(direction==='min'?t('caption.b4eb1c411928'):direction==='max'?t('caption.7c119e0a0dcb'):'gleich')+t('caption.2eb9d0d30d4c')+unit);upper.hidden=direction!=='range';for(const control of [input,upper]){const invalid=control.value!==''&&!Number.isFinite(engineeringInput(control.value,key,factor));control.setCustomValidity(invalid?t('units.invalid'):'');control.setAttribute('aria-invalid',String(invalid));}limits[key]={value:direction==='range'?(input.value===''&&upper.value===''?null:{min:input.value===''?null:engineeringInput(input.value,key,factor),max:upper.value===''?null:engineeringInput(upper.value,key,factor)}):input.value===''?null:engineeringInput(input.value,key,factor),direction};page=0;render();};
    input.addEventListener('input',update);upper.addEventListener('input',update);comparison.addEventListener('change',update);
    wrap.append(comparison,input,upper); $('filters').append(wrap);
  }
  for(const [id,label] of [['package-filter',t('caption.cf5cb9d869b5')],['manufacturer-filter',t('caption.32da517562d9')]]) {
    const wrap=text('label',label),input=document.createElement('select');input.id=id;
    const first=text('option',t('caption.3801a35c5182'));first.value='';input.append(first);
    const options=[...new Set(scopeRows().map(c=>id==='package-filter'?c.footprint?.split(':').at(-1):c.manufacturer).filter(Boolean))].sort((a,b)=>compareValues(a,b));
    for(const value of options){const option=text('option',value);option.value=value;input.append(option);}
    input.setAttribute('aria-label',label+t('caption.e44f28bbe928'));filterInputs.set(id==='package-filter'?'package':'manufacturer',input);
    input.addEventListener('input',()=>{page=0;render();});wrap.append(input);$('filters').append(wrap);
  }
  const input=document.createElement('select');input.setAttribute('aria-label',t('caption.bfdcb7ff5dc4'));input.append(text('option',t('caption.3801a35c5182')));input.firstChild.value='';
  for(const tag of [...new Set(scopeRows().flatMap(c=>c.functions||[]))].sort()){const option=text('option',functionTagLabel(tag));option.value=tag;input.append(option);}
  input.addEventListener('input',()=>{page=0;render();});filterInputs.set('description',input);$('filters').append(input);
}
function assetLabel(c,key){return t('assetStatus.'+assetCode(c,key));}
function simulationLabel(c,purpose){return t('simulationStatus.'+simulationCode(c,purpose));}
function cellValue(c,key) {
  if(key==='package')return c.footprint?.split(':').at(-1);
  if(['symbol','footprint','model3d','datasheet'].includes(key))return assetLabel(c,key);
  if(key==='simulation')return simulationLabel(c,$('purpose').value);
  if(key==='kind')return kinds[c.kind];
  return c[key]??c.values[key];
}
function render() {
  return measureWork('render',renderContent);
}
function renderContent() {
  if(!data)return;
  syncToolbar();
  hideValueInfo(document);
  const simHelp=$('sim-filter-help');simHelp.hidden=$('workspace-view').value!=='simulation'||(!$('model-availability').value&&!$('availability-detail').value&&!$('evidence').value&&!$('model-type').value);
  simHelp.textContent=t('caption.8eacb39167b8');
  const focused=document.activeElement;
  const query=(shortSearch&&$('search').value===shortSearch.raw?shortSearch.text:$('search').value).trim().toLowerCase();
  const queryTerms=query.split(/\s+/).filter(Boolean);
  const filters=Object.fromEntries(['workspace-view','kind','library','asset','model-availability','evidence','model-type','purpose'].map(id=>[id,$(id).value]));
  const packageFilter=filterInputs.get('package').value,manufacturerFilter=filterInputs.get('manufacturer').value,descriptionFilter=filterInputs.get('description').value;
  const definitions=new Map(availableProfile(category).map(f=>[f[0],f[4]]));
  const activeLimits=Object.entries(limits).map(([key,limit])=>[key,{...limit,absolute:definitions.get(key)?.absolute===true,includeUnknown:$('include-unknown').checked}]);
  current=scopeRows().filter(c=>(!filters.kind||c.kind===filters.kind)&&(!filters.library||c.library===filters.library)
    &&queryTerms.every(term=>searchText(c).includes(term))
    &&matchesShortPackage(c,packageSize)
    &&matchesAssets(c,filters.asset)&&matchesSimulation(c,$('availability-detail').value||filters['model-availability'],filters.evidence,filters['model-type'],filters.purpose)
    &&(!packageFilter || c.footprint?.split(':').at(-1)===packageFilter)
    &&(!manufacturerFilter || c.manufacturer===manufacturerFilter)
    &&(!descriptionFilter || c.functions.includes(descriptionFilter))
    &&(!missingField||(['library','manufacturer'].includes(c.kind)&&c.symbol&&parameterState(c,missingField)==='missing'))
    &&activeLimits.every(([key,limit])=>matchesParameter(c.values[key],limit,parameterEvidence(c,key))));
  const headings=[['name','MPN'],...($('table-mode').value==='parameters'?[['description',t('caption.968ffc0e874a')],['manufacturer',t('caption.32da517562d9')],...columns.map(([key,label,unit])=>[key,`${label}${unit&&!engineeringUnit(key)?' ('+unit+')':''}`]),['package',t('caption.cf5cb9d869b5')],['datasheet',t('caption.cfc16b76fd63')],['resources',t('caption.dcc7103e143d')]]:[['kind',t('caption.75df3579c730')],['symbol','Symbol'],['footprint','Footprint'],['model3d','3D'],['datasheet',t('caption.cfc16b76fd63')],['simulation','Simulation'],['library',t('caption.70862cdee3da')]])];
  if(!headings.some(([key])=>key===sort)){sort='name';ascending=true;}
  current.sort((a,b)=>compareValues(cellValue(a,sort),cellValue(b,sort),ascending)||compareValues(a.name,b.name)||compareValues(a.id,b.id));
  const tr=document.createElement('tr');
  for(const [key,label] of headings) {const th=document.createElement('th'),button=text('button',label+(sort===key?(ascending?' ▲':' ▼'):''));
    if(['datasheet','resources'].includes(key)){th.textContent=label;tr.append(th);continue;}
    th.setAttribute('aria-sort',sort===key?(ascending?'ascending':'descending'):'none');
    button.title=t('caption.1a72ef54cfa3',{v0:label,v1:sort===key&&ascending?t('caption.50b47ec0c2e7'):t('caption.02d60fdb8050')});
    button.addEventListener('click',()=>{ascending=sort===key?!ascending:true;sort=key;page=0;render();});th.append(button);tr.append(th);}
  $('columns').replaceChildren(tr); $('rows').replaceChildren();
  if($('table-mode').value==='parameters') {
    const filters=document.createElement('tr');filters.className='column-filters';
    for(const [key] of headings){const th=document.createElement('th');if(filterComparisons.has(key))th.append(filterComparisons.get(key));if(filterInputs.has(key)){const input=filterInputs.get(key);th.append(input);if(input._upper)th.append(input._upper);}filters.append(th);}
    $('columns').append(filters);$('filters').hidden=true;
  } else { $('filters').hidden=false;for(const input of filterInputs.values())$('filters').append(input); }
  if([...filterInputs.values(),...filterComparisons.values(),...[...filterInputs.values()].map(x=>x._upper)].includes(focused))focused.focus();
  page=Math.max(0,Math.min(page,Math.ceil(current.length/pageSize)-1));
  for(const c of current.slice(page*pageSize,(page+1)*pageSize)) {
    const row=document.createElement('tr');row.tabIndex=0;row.dataset.componentId=c.id;row.setAttribute('aria-selected',String(categorySelection.has(c.id)));
    row.classList.toggle('selected',categorySelection.has(c.id));
    for(const [key] of headings) {const definition=columns.find(d=>d[0]===key);const td=text('td',engineeringDisplay(cellValue(c,key),key,locale())??display(cellValue(c,key),definition?.[3]||1));
      if(key==='description')td.className='description-cell';
      if(key==='name'&&categoryEditable(c)){const check=document.createElement('input');check.type='checkbox';check.className='category-select';check.checked=categorySelection.has(c.id);check.setAttribute('aria-label',t('category.select',{name:c.name}));check.addEventListener('click',e=>e.stopPropagation());check.addEventListener('change',()=>{if(check.checked)categorySelection.add(c.id);else categorySelection.delete(c.id);selected=c;renderDetails();updateCategorySelection();});td.prepend(check);}
      if(definition&&cellValue(c,key)!=null)attachValueInfo(td,exportParameter(c,key),definition,engineeringDisplay(cellValue(c,key),key,locale())??display(cellValue(c,key),definition[3]||1));
      if(key==='datasheet'){td.textContent='—';try{const url=new URL(c.datasheet);if(['http:','https:'].includes(url.protocol)){const link=text('a','PDF ↗');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.addEventListener('click',e=>e.stopPropagation());td.replaceChildren(link);}}catch{}}
      if(key==='resources'){td.textContent='';for(const [asset,label] of [['symbol','S'],['footprint','F'],['model3d','3D'],['simulation','Sim']]){const state=cellValue(c,asset);const icon=text('span',label,'resource');icon.title=asset+': '+state;icon.classList.toggle('available',asset==='simulation'?matchesSimulation(c,'present'):['found','partial','linked'].includes(assetCode(c,asset)));td.append(icon);}}
      if(key==='simulation')td.title=t('quality.simScope');
      if(['symbol','footprint','model3d'].includes(key))td.title=key==='symbol'?c.symbol||t('caption.321bbbb9ea13'):key==='footprint'?c.footprint||t('caption.c765e6315eaa'):(c.footprint_info?.models||[]).map(m=>m.reference).join('\n');row.append(td);}
    const select=(event={})=>{if(!event.ctrlKey&&!event.metaKey)categorySelection.clear();if(categoryEditable(c)){if((event.ctrlKey||event.metaKey)&&categorySelection.has(c.id))categorySelection.delete(c.id);else categorySelection.add(c.id);}selected=c;renderDetails();updateCategorySelection();};row.addEventListener('click',select);
    row.addEventListener('contextmenu',event=>{if(!categoryEditable(c)||event.target.closest('a'))return;event.preventDefault();if(!categorySelection.has(c.id))select();openCategoryDialog();});
    row.addEventListener('dblclick',async()=>{selected=c;renderDetails();await copyReference(true);});
    row.addEventListener('keydown',e=>{if(e.target!==row)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(e);}else if(e.key==='F10'&&e.shiftKey){e.preventDefault();if(!categorySelection.has(c.id))select();openCategoryDialog();}});$('rows').append(row);
  }
  $('count').textContent=(missingField?t('caption.06015f41ff03')+(availableProfile(category).find(f=>f[0]===missingField)?.[1]||missingField)+' · ':'')+t('caption.ec3e1cdb3585',{v0:current.length.toLocaleString(locale()),v1:data.components.length.toLocaleString(locale())});
  $('page').textContent=t('caption.da7b385d92dc',{v0:page+1,v1:Math.max(1,Math.ceil(current.length/pageSize)),v2:pageSize});
  $('previous').disabled=page===0;$('next').disabled=(page+1)*pageSize>=current.length;$('empty').hidden=current.length>0;
  if(selected&&!current.some(c=>c.id===selected.id)){selected=null;renderDetails();}
  for(const id of categorySelection)if(!current.some(c=>c.id===id))categorySelection.delete(id);updateCategorySelection();
  const counts=data.inventory?.counts;
  $('status').textContent=counts?t('caption.ad6692d6eece',{v0:counts.symbols.toLocaleString(locale()),v1:counts.footprints.toLocaleString(locale()),v2:data.inventory.warnings.length}):t('caption.68beaa90d432',{v0:data.components.length});
  $('status').title=(data.inventory?.warnings||[]).join('\n');$('csv').disabled=!current.length;
}
function preview(data,label,reason=t('caption.ffef2757098c')) {
  const group=text('div','','preview');group.append(text('h3',label));
  if(!data?.shapes?.length){group.append(text('p',reason,'hint'));return group;}
  const svg=geometrySvg(document,data,label);group.append(svg,text('p',t('caption.9d22c9f632a4'),'hint'));if(data.unsupported?.length)group.append(text('p',t('preview.incomplete'),'notice'));return group;
}
function renderDetails() {
  const box=$('detail');box.replaceChildren();$('selection').disabled=!selected;$('transfer').hidden=!selected;$('copy-status').textContent='';
  if(!selected){box.append(text('p',t('catalog.select')));return;}
  const c=selected;box.append(text('h3',c.name),text('span',kinds[c.kind],'badge'));
  if(c.symbol||c.footprint)if(!c.preview_loaded&&!c.preview_loading){c.preview_loading=true;fetch('/api/preview/'+encodeURIComponent(c.id)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(p=>{c.symbol_preview=p.symbol;c.footprint_preview=p.footprint;c.preview_loaded=true;}).catch(()=>{c.symbol_preview_reason=t('caption.589ab0d8fddd');c.preview_loaded=true;}).finally(()=>{c.preview_loading=false;if(selected?.id===c.id)renderDetails();});}
  box.append(preview(c.symbol_preview,'Symbol',c.symbol_preview_reason||(!c.symbol?t('caption.00fb17b4b85e'):t('caption.e3e0c285f00c'))),preview(c.footprint_preview,c.footprint?.split(':').at(-1)||'Footprint',c.footprint_preview_reason));
  if(c.kind==='reference'||c.description.startsWith('Illustrative reference'))box.append(text('p',t('caption.c9dfe6ba4f4d'),'notice'));
  if(c.registered===false)box.append(text('p',t('caption.50dd20d82bd8',{library:c.symbol?.split(':')[0]||c.library}),'notice'));
  const fields=[['ID',c.id],[t('caption.52f2a87a419c'),pathLabel(uiPath(categoryPath(c)))],[t('caption.70862cdee3da'),c.library],['Symbol',c.symbol||'—'],[t('caption.ec3803f41359'),assetLabel(c,'symbol')],
    ['Footprint',c.footprint||'—'],[t('caption.b31fb7c0083a'),assetLabel(c,'footprint')],[t('caption.1daca27cdbc1'),c.footprint_info?.registered===true?t('caption.cde9e58a9a4e'):c.footprint_info?.registered===false?t('caption.90ebc1bde6f3'):t('caption.276ffa1fb4f9')],[t('caption.b457bd14ed91'),assetLabel(c,'model3d')],[t('caption.0378894a522e'),c.source_file||'KiCad Parts Manager']];
  const technical=document.createElement('details');technical.append(text('summary',t('caption.7a7bda887ff3')));
  const dl=document.createElement('dl');for(const [label,value] of fields)dl.append(text('dt',label),text('dd',value));technical.append(dl);box.append(technical);
  box.append(text('p',`3D: ${assetLabel(c,'model3d')} · Simulation: ${simulationLabel(c,$('purpose').value)}`,'badge'));
  for(const model of c.footprint_info?.models||[])technical.append(text('p',`${model.found?t('caption.dc88cde12b83'):t('caption.24d10fbf2e95')}: ${model.path}`,'hint'));
  if(c.model3d)box.append(text('p',t('caption.b0cc40f02788',{v0:c.model3d}),'hint'));
  if(c.datasheet&&c.datasheet!=='~') {try{const url=new URL(c.datasheet);if(['http:','https:'].includes(url.protocol)){
    const link=text('a',t('caption.485523f3a4b4'));link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.className='detail-datasheet';box.append(link);
  }else box.append(text('p',t('caption.fca71c75b246',{v0:c.datasheet})));}catch{box.append(text('p',t('caption.fca71c75b246',{v0:c.datasheet})));}}
  const openEditor=()=>manualEditor(c,updated=>{
    updateLocalData(updated);$('status').textContent=t('caption.63dce40cfcf4');
  },data.components.filter(row=>row.name.toUpperCase()===c.name.toUpperCase()&&row.datasheet).map(row=>({url:row.datasheet,label:[row.manufacturer,row.library,row.symbol].filter(Boolean).join(' · ')})),{onManufacturer:()=>manufacturerDialog(c,applyManufacturerUpdate)});
  const edit=text('button',t('editor.open'));edit.addEventListener('click',openEditor);box.append(edit);
  if(c.symbol){const add=text('button',t('sim.openModel'));add.addEventListener('click',()=>modelWizard(c,model=>{for(const row of data.components.filter(row=>localDataKey(row)===localDataKey(c))){row.models=row.models.filter(m=>!m.id.startsWith('LOCAL-'));row.models.push(model);}buildTree();render();renderDetails();},preview,simulationCandidates(c)));box.append(add);}
  $('reference').value=c.kicad_reference||c.symbol||c.footprint||'';$('copy').disabled=!$('reference').value;
  $('placement-help').textContent=c.kind==='footprint'?t('caption.075733f77b14'):
    c.kind==='library'?t('caption.c7007cce5014'):
    t('caption.7f9424ac3cf4',{v0:c.placement_key||c.id});
}
function download(name,content,type) {
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
$('selection').addEventListener('click',()=>download(`${selected.id}-kicad-selection.json`,JSON.stringify(selectionPayload(selected,$('purpose').value),null,2),'application/json'));
$('category-change').addEventListener('click',openCategoryDialog);
$('category-undo').addEventListener('click',async()=>{if(!categoryUndo)return;$('category-undo').disabled=true;try{const changes=await categoryRequest(categoryUndo);applyCategoryChanges(changes);categoryUndo=null;$('category-undo').hidden=true;$('category-notice').textContent=t('category.undone');}catch(error){showError($('category-notice'),error);}finally{$('category-undo').disabled=false;}});
async function copyReference(forSearch=false){const value=forSearch?(selected?.symbol||selected?.footprint||$('reference').value).split(':').at(-1):$('reference').value;try{await navigator.clipboard.writeText(value);if(forSearch){$('copy-status').textContent=t('catalog.searchNameCopied',{name:value});$('status').textContent=t('catalog.searchNameCopied',{name:value});return;}$('copy-status').textContent=selected?.kind==='footprint'?t('caption.75f726411534'):t('caption.2c5d2d82c37d');$('status').textContent=t('caption.9890c48f9a67')+$('reference').value;}catch{$('reference').focus();$('reference').select();$('copy-status').textContent=t('caption.a6f7e51b2111');}}
$('copy').addEventListener('click',()=>copyReference());
$('csv').addEventListener('click',()=>{
  download('kicad-parts-manager-auswahl-si.csv',catalogCsv(current,columns,$('purpose').value),'text/csv;charset=utf-8');
});
function beginGlobalSearch(){
  const controls=['kind','purpose','evidence','model-availability','availability-detail','model-type','library','asset'];
  const narrowed=category||Object.keys(limits).length||missingField||controls.some(id=>$(id).value)||['package','manufacturer','description'].some(key=>filterInputs.get(key)?.value);
  if(!$('search').value.trim()||!narrowed)return;
  category='';profileColumns=null;missingField='';selected=null;
  for(const key of Object.keys(limits))delete limits[key];
  for(const id of controls)$(id).value='';
  scopeCache.clear();buildTree();
  document.querySelectorAll('[data-category]').forEach(el=>el.classList.remove('active'));
  $('breadcrumb').textContent=t('caption.d5a9ae17c387');buildFilters();renderDetails();
}
for(const id of ['search','kind','purpose','evidence','model-availability','availability-detail','model-type','library','asset','table-mode'])$(id).addEventListener('input',()=>{if(id==='kind'){scopeCache.clear();buildTree();chooseCategory('');}if(id==='model-availability')$('availability-detail').value='';if(id==='availability-detail'&&$('availability-detail').value)$('model-availability').value='';if(id==='search'){shortSearch=null;packageSize='';renderShortSearch();beginGlobalSearch();}page=0;render();if(selected)renderDetails();});
$('search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();runShortSearch();}});
for(const id of ['filters','columns'])for(const type of ['input','change'])$(id).addEventListener(type,()=>clearShortSearch());
$('reset').addEventListener('click',()=>clearShortSearch());
$('choose-parameters').addEventListener('click',()=>clearShortSearch());
$('all').addEventListener('click',()=>chooseCategory(''));
let changingView=false;
async function rebuildView(workspace){
  if(changingView||catalogLoading)return;changingView=true;
  const finish=catalogProgress.start(t('catalog.buildView'));
  const main=document.querySelector('main'),toolbar=document.querySelector('.toolbar');main.inert=true;toolbar.inert=true;
  try{
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    category='';page=0;
    if(workspace){selected=null;renderDetails();}
    buildTree();chooseCategory('');
    if(workspace)$('view-help').textContent=$('workspace-view').value==='simulation'?t('sim.workspaceHint'):t('caption.d9fb9a90db79');
  }finally{finish();main.inert=false;toolbar.inert=false;changingView=false;}
}
$('workspace-view').addEventListener('change',()=>rebuildView(true));
$('tree-mode').addEventListener('change',()=>rebuildView(false));
$('previous').addEventListener('click',()=>{page--;render();});$('next').addEventListener('click',()=>{page++;render();});
$('reset').addEventListener('click',()=>{missingField='';for(const id of ['search','kind','purpose','evidence','model-availability','availability-detail','model-type','library','asset'])$(id).value='';for(const key of Object.keys(limits))delete limits[key];$('table-mode').value='parameters';page=0;scopeCache.clear();if(category.startsWith('footprints/'))category='';buildTree();buildFilters();render();});
$('theme').addEventListener('click',()=>{const light=document.body.classList.toggle('light');$('theme').dataset.i18n=light?'theme.dark':'theme.light';$('theme').textContent=t($('theme').dataset.i18n);localStorage.setItem('kicad-parts-manager-theme',light?'light':'dark');});
$('about').addEventListener('click',()=>aboutDialog(load));
if(localStorage.getItem('kicad-parts-manager-theme')==='light')$('theme').click();
const catalogProgress=createProgress(document.body);
let catalogLoading=false;
const functionTagKeys={"Buffer": "functionTag.0", "Verstärkung 1": "functionTag.1", "Breitbandig": "functionTag.2", "Hoher Strom (qualitativ)": "functionTag.3", "Operationsverstärker": "functionTag.4", "Komparator": "functionTag.5", "Spannungsregler": "functionTag.6"};
const functionTagLabel=value=>functionTagKeys[value]?t(functionTagKeys[value]):value;
function enrichComponent(c){searchTexts.delete(c);scopeCache.clear();const signature=JSON.stringify([c.name,c.description,c.category,c.kind]);let derived=derivedValues.get(c.id);if(!derived||derived.signature!==signature){derived={signature,functions:functionTags(c),values:{...extraRatings(c),...descriptionRatings(c)}};derivedValues.set(c.id,derived);}c.functions=derived.functions;c.description_values={...derived.values};for(const key of Object.keys(c.description_values)){if(c.values[key]!=null)delete c.description_values[key];}c.values={...c.description_values,...c.values};}
async function load() {
  const started=performance.now();
  if(catalogLoading)return;catalogLoading=true;const finish=catalogProgress.start(t('caption.2981c9cbfb2e'));$('reload').disabled=true;document.querySelector('main').inert=true;document.querySelector('.toolbar').inert=true;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try {
    $('status').textContent=t('caption.2981c9cbfb2e');const response=await fetch('/api/catalog?compact=1');if(!response.ok)throw apiError({code:'catalog_failed',error:'HTTP '+response.status});data=await response.json();
    const total=data.components.length;
    let lastYield=performance.now();
    for(let offset=0;offset<total;offset+=1000){
      const end=Math.min(offset+1000,total);
      for(let index=offset;index<end;index++){const c=data.components[index];for(const [field,values] of Object.entries(data.shared||{})){const ref=c[field+'_shared'];if(ref!==undefined){c[field]=values[ref];delete c[field+'_shared'];}}if(c.footprint_preview_key)c.footprint_preview=(data.previews||data.inventory?.previews)?.footprints?.[c.footprint_preview_key];enrichComponent(c);}
      const percent=Math.round(end/total*100),message=t('caption.edf0ecead9c8',{v0:end.toLocaleString(locale()),v1:total.toLocaleString(locale()),v2:percent});
      finish.update(message,percent);$('status').textContent=message;
      if(offset===0||end===total||performance.now()-lastYield>=8){await new Promise(resolve=>requestAnimationFrame(resolve));lastYield=performance.now();}
    }
    finish.update(t('caption.aa48dbcc8b04'));
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const previousLibrary=$('library').value;$('library').replaceChildren(text('option',t('caption.5a2bb5ed6f24')));$('library').firstChild.value='';
    for(const name of [...new Set(data.components.map(c=>c.library).filter(Boolean))].sort()) {const option=text('option',name);option.value=name;$('library').append(option);}
    $('library').value=previousLibrary;buildTree();buildFilters();selected=null;renderDetails();render();if(shortSearch)applyShortSearch();else if(entryParameters.has('q'))runShortSearch();
  }catch(error){showError($('status'),error);}finally{finish();catalogLoading=false;$('reload').disabled=false;document.querySelector('main').inert=false;document.querySelector('.toolbar').inert=false;recordTime('load',started);}
}
$('reload').addEventListener('click',load);await load();

$('include-unknown').addEventListener('change',()=>{page=0;render();});
$('choose-parameters').addEventListener('click',()=>{
 const dialog=document.createElement('dialog');dialog.className='manual-editor';dialog.setAttribute('aria-label',t('caption.30a3358fa00c'));dialog.append(text('h2',t('caption.f8a7e4b82a1a')+(category?pathLabel(category):t('caption.d5a9ae17c387'))));
 dialog.append(text('p',t('caption.cab3e6b4c1b6'),'hint'));
 const options=availableProfile(category),chosen=new Set(columns.map(f=>f[0]));
 const controls=options.map(f=>{const label=text('label',fieldLabel(f[0],f[1])+(f[2]?' ('+f[2]+')':'')),input=document.createElement('input');input.type='checkbox';input.checked=chosen.has(f[0]);label.prepend(input);dialog.append(label);return {f,input};});
 const save=text('button',t('caption.09fed6d02fa8')),reset=text('button',t('caption.65ef68523535')),close=decorateClose(text('button'));
 save.addEventListener('click',()=>{try{localStorage.setItem('kicad-parts-manager.columns.'+category,JSON.stringify(controls.filter(x=>x.input.checked).map(x=>x.f[0])));profileColumns=null;}catch{dialog.append(text('p',t('caption.342a134f0411')));return;}for(const key of Object.keys(limits))delete limits[key];buildFilters();render();dialog.close();});
 reset.addEventListener('click',()=>{localStorage.removeItem('kicad-parts-manager.columns.'+category);profileColumns=null;for(const key of Object.keys(limits))delete limits[key];buildFilters();render();dialog.close();});close.addEventListener('click',()=>dialog.close());dialog.append(save,reset,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
});

$('data-gaps').addEventListener('click',()=>coverageDialog(current,(path,key)=>{chooseCategory(uiPath(path));missingField=key;render();},category?pathLabel(category):t('caption.6a428c709431'),path=>pathLabel(uiPath(path))));
$('sim-coverage').addEventListener('click',()=>simulationCoverageDialog(current,category?pathLabel(category):t('caption.6a428c709431'),path=>pathLabel(uiPath(path)),path=>{if($('tree-mode').value!=='category'){$('tree-mode').value='category';buildTree();}chooseCategory(uiPath(path));}));

function updateLocalData(updated){for(const c of data.components.filter(c=>localDataKey(c)===localDataKey(updated))){Object.assign(c,{values:{...updated.values},manufacturer:updated.manufacturer,datasheet:updated.datasheet,manual_data:updated.manual_data});enrichComponent(c);}refreshFilters();render();renderDetails();}
function applyManufacturerUpdate(updated){updateLocalData(updated);$('status').textContent=t('caption.905a11d206d2');}
$('manufacturer-data').addEventListener('click',()=>manufacturerLibraryDialog(current,c=>manufacturerDialog(c,applyManufacturerUpdate),category?pathLabel(category):t('caption.6a428c709431')));
if(data&&entryParameters.get('view')==='manufacturer')$('manufacturer-data').click();

function renderShortSearch(){
 const box=$('short-search');box.replaceChildren();box.hidden=!shortSearch&&!packageSize;if(packageSize)box.append(text('span','SMD '+packageSize));if(!shortSearch)return;
 box.append(text('span',pathLabel(shortSearch.category)));
 const waiting=shortSearch.criteria.some(c=>!c.key),duplicates=new Set(shortSearch.criteria.filter(c=>c.key).map(c=>c.key)).size!==shortSearch.criteria.filter(c=>c.key).length;
 for(const [index,item] of shortSearch.criteria.entries()){
  const label=text('label',item.token+' → '),select=document.createElement('select');select.setAttribute('aria-label',t('short.assign',{token:item.token,index:index+1}));
  const blank=text('option',t('short.choose'));blank.value='';select.append(blank);
  const definitions=availableProfile(shortSearch.category);
  for(const key of item.options){const definition=definitions.find(f=>f[0]===key),limit=shortSearchLimit({...item,key}),symbol=limit.direction==='equal'?'=':limit.direction==='min'?(limit.strict?'>':'≥'):(limit.strict?'<':'≤');const option=text('option',fieldLabel(key,definition?.[1]||key)+' '+symbol+' '+(engineeringDisplay(item.value,key,locale())??item.value.toLocaleString(locale(),{maximumSignificantDigits:6})+' '+item.unit));option.value=key;select.append(option);}
  select.value=item.key||'';select.addEventListener('change',()=>{item.key=select.value||null;if(shortSearch.criteria.every(c=>c.key)&&new Set(shortSearch.criteria.map(c=>c.key)).size===shortSearch.criteria.length)applyShortSearch();else renderShortSearch();});label.append(select);box.append(label);
 }
 if(waiting||duplicates)box.append(text('span',t(duplicates?'short.duplicate':'short.pending')));
 else if(shortSearch.criteria.length)box.append(text('span',t('short.edit'),'hint'));
}
function clearShortSearch(){if(shortSearch&&$('search').value===shortSearch.raw)$('search').value=shortSearch.text;shortSearch=null;packageSize='';renderShortSearch();}
function runShortSearch(){
 const parsed=parseShortSearch($('search').value,availableProfile);if(!parsed)return;
 shortSearch=parsed;
 if(parsed.criteria.some(c=>!c.key)||new Set(parsed.criteria.map(c=>c.key)).size!==parsed.criteria.length){renderShortSearch();return;}
 applyShortSearch();
}
function applyShortSearch(){
 const parsed=shortSearch;if(!parsed)return;
 packageSize=parsed.package||'';
 const permitted=data.components.some(c=>uiPath(categoryPath(c))===parsed.category||uiPath(categoryPath(c)).startsWith(parsed.category+'/'));
 if(!permitted){renderShortSearch();$('status').textContent=t('short.noCategory');return;}
 for(const id of ['kind','purpose','evidence','model-availability','availability-detail','model-type','library','asset'])$(id).value='';
 if($('kind').value==='footprint')$('kind').value='';
 $('tree-mode').value='category';$('table-mode').value='parameters';$('include-unknown').checked=false;
 category=parsed.category;missingField='';page=0;selected=null;sort='name';ascending=true;
 for(const key of Object.keys(limits))delete limits[key];
 const definitions=availableProfile(category),defaults=profile(category).map(f=>f[0]);profileColumns=[...new Set([...defaults,...parsed.criteria.map(c=>c.key)])];
 for(const item of parsed.criteria)limits[item.key]=shortSearchLimit(item);
 buildTree();buildFilters();
 for(const item of parsed.criteria){const input=filterInputs.get(item.key),definition=definitions.find(f=>f[0]===item.key);input.value=String(item.value*definition[3]);filterComparisons.get(item.key).value=limits[item.key].direction;}
 for(const node of document.querySelectorAll('[data-category]'))if(node.dataset.category===category){node.classList.add('active');let parent=node.parentElement;while(parent&&parent.id!=='tree'){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}}
 $('breadcrumb').textContent=pathLabel(category);renderShortSearch();render();renderDetails();$('status').textContent=t('short.applied');
}

function refreshFilters(){
 const states=new Map([...filterInputs].map(([key,input])=>[key,{value:input.value,selected:input.multiple?[...input.selectedOptions].map(o=>o.value):null,direction:filterComparisons.get(key)?.value,upper:input._upper?.value}]));
 buildFilters();
 for(const [key,state] of states){const input=filterInputs.get(key);if(!input)continue;if(state.selected){for(const option of input.options)option.selected=state.selected.includes(option.value);}else if(input.tagName!=='SELECT'||[...input.options].some(o=>o.value===state.value))input.value=state.value;if(state.direction&&filterComparisons.has(key))filterComparisons.get(key).value=state.direction;if(input._upper){input._upper.value=state.upper||'';input._upper.hidden=state.direction!=='range';}}
}

const SEARCH_CONTROL_IDS=['workspace-view','tree-mode','search','kind','purpose','evidence','model-availability','availability-detail','model-type','library','asset','table-mode'];
function captureSearch(){
 if(!data)throw Error(t('profiles.noCatalog'));
 const controls=Object.fromEntries(SEARCH_CONTROL_IDS.map(id=>[id,$(id).value]));
 if(shortSearch&&controls.search===shortSearch.raw)controls.search=shortSearch.text;
 for(const key of ['package','manufacturer','description'])controls[key]=filterInputs.get(key)?.value||'';
 const definitions=availableProfile(category);
 return {version:1,category,controls,packageSize,columns:columns.map(f=>f[0]),signatures:Object.fromEntries(definitions.filter(f=>columns.some(c=>c[0]===f[0])||f[0]===missingField).map(f=>[f[0],parameterSignature(f)])),limits:JSON.parse(JSON.stringify(limits)),includeUnknown:$('include-unknown').checked,sort,ascending,missingField};
}
function applySearch(state){
 if(!state||typeof state!=='object')throw Error(t('profiles.stale'));
 if(!data)throw Error(t('profiles.noCatalog'));
 // Retain the stored profile, but never apply deferred, invisible restrictions.
 state=JSON.parse(JSON.stringify(state));let skippedAdvanced=false;
 for(const limit of Object.values(state.limits||{})){
  if(!limit||typeof limit!=='object')continue;
  if(limit.kind||limit.sourceType||Object.keys(limit.conditions||{}).length)skippedAdvanced=true;
  delete limit.kind;delete limit.sourceType;delete limit.conditions;
 }
 const controls=state?.controls||{};
 controls['availability-detail']??='';
 const legacyWorkspace=controls['workspace-view'];
 if(['schematic','pcb','footprints'].includes(legacyWorkspace)){controls['workspace-view']='';if(legacyWorkspace==='footprints')controls.kind='footprint';else if(legacyWorkspace==='pcb')controls.asset='footprint';}
 if(controls['model-availability']&&!['present','incomplete'].includes(controls['model-availability'])){controls['availability-detail']=controls['model-availability'];controls['model-availability']='';}
 if(controls['workspace-view']!=='simulation')for(const id of ['purpose','evidence','model-availability','availability-detail','model-type'])controls[id]='';
 const definitions=availableProfile(typeof state?.category==='string'?state.category:'');
 const path=c=>controls['tree-mode']==='library'?(c.kind==='footprint'?'footprints/':'libraries/')+(c.library||'KiCad Parts Manager'):uiPath(categoryPath(c));
 const rows=data.components.filter(c=>matchesView(c,effectiveWorkspace(controls['workspace-view'],controls.kind)));
 const categories=new Set();for(const c of rows){const parts=path(c).split('/');for(let i=1;i<=parts.length;i++)categories.add(parts.slice(0,i).join('/'));}
 const matches=rows.filter(c=>!state.category||path(c)===state.category||path(c).startsWith(state.category+'/'));
 const options=Object.fromEntries(SEARCH_CONTROL_IDS.map(id=>[id,$(id).tagName==='SELECT'?[...$(id).options].map(o=>o.value):null]));
 options.package=['',...new Set(matches.map(c=>c.footprint?.split(':').at(-1)).filter(Boolean))];
 options.manufacturer=['',...new Set(matches.map(c=>c.manufacturer).filter(Boolean))];
 options.description=['',...new Set(matches.flatMap(c=>c.functions||[]))];
 const textOptions=Object.fromEntries(definitions.filter(f=>f[4]?.type==='text').map(f=>[f[0],[...new Set([...(f[4].options||[]),...matches.flatMap(c=>c.values[f[0]]==null?[]:String(c.values[f[0]]).split(';').map(x=>x.trim()))])]]));
 const issues=validateSearch(state,{definitions,options,categories,textOptions});
 if(Object.keys(options).some(id=>!Object.hasOwn(controls,id)))issues.push(t('profiles.invalid',{key:'controls'}));
 const allowedSort=controls['table-mode']==='assets'?['name','kind','symbol','footprint','model3d','simulation','library']:['name','description','manufacturer',...(Array.isArray(state.columns)?state.columns:[]),'package'];
 if(!allowedSort.includes(state.sort))issues.push(t('profiles.optionMissing',{key:'sort'}));
 if(typeof state.missingField!=='string'||(state.missingField&&!definitions.some(f=>f[0]===state.missingField)))issues.push(t('profiles.parameterChanged',{key:'missingField'}));
 if(issues.length)throw Error(t('profiles.stale')+'\n'+issues.join('\n'));
 // Validation completes before changing any current controls or category defaults.
 shortSearch=null;packageSize=state.packageSize||'';renderShortSearch();
 for(const id of SEARCH_CONTROL_IDS)$(id).value=controls[id];
 category=state.category;profileColumns=[...state.columns];missingField=state.missingField;sort=state.sort;ascending=state.ascending;page=0;selected=null;
 for(const key of Object.keys(limits))delete limits[key];Object.assign(limits,JSON.parse(JSON.stringify(state.limits)));
 $('include-unknown').checked=state.includeUnknown;buildTree();buildFilters();
 document.querySelectorAll('[data-category]').forEach(el=>el.classList.toggle('active',el.dataset.category===category));$('breadcrumb').textContent=category?pathLabel(category):t('caption.d5a9ae17c387');
 for(const key of ['package','manufacturer','description'])filterInputs.get(key).value=controls[key];
 for(const [key,limit] of Object.entries(limits)){
  const input=filterInputs.get(key),definition=columns.find(f=>f[0]===key),factor=definition[3];
  if(limit.direction==='text'){for(const option of input.options)option.selected=Array.isArray(limit.value)?limit.value.includes(option.value):option.value==='';continue;}
  filterComparisons.get(key).value=limit.direction;
  input.setAttribute('aria-label',definition[1]+' '+(limit.direction==='min'?t('caption.b4eb1c411928'):limit.direction==='max'?t('caption.7c119e0a0dcb'):'gleich')+t('caption.2eb9d0d30d4c')+definition[2]);
  input.value=limit.direction==='range'?(limit.value?.min==null?'':String(limit.value.min*factor)):limit.value==null?'':String(limit.value*factor);
  input._upper.value=limit.direction==='range'&&limit.value?.max!=null?String(limit.value.max*factor):'';input._upper.hidden=limit.direction!=='range';
 }
 render();renderDetails();$('status').textContent=t(skippedAdvanced?'profiles.advancedDeferred':'profiles.loaded');
}
$('search-profiles').addEventListener('click',()=>searchProfilesDialog({capture:captureSearch,apply:applySearch}));
