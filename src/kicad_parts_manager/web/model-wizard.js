import {calculableMessage} from './context-help.js';
import {diodePanel,diodeSymbolRoles} from './diode-panel.js';
import {apiError,showError,t,locale,fieldLabel,conditionLabel} from './i18n.js';
export function decorateClose(button){button.type='button';button.textContent='×';button.classList.add('dialog-close');button.setAttribute('aria-label',t('common.close'));button.title=t('common.close');return button;}
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
async function globalRequest(url,body){const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();if(!r.ok)throw apiError(data);return data;}
export async function requestWithProgress(url,body,onProgress){
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,progress:true})});
  if(!response.ok||!response.body?.getReader||!response.headers?.get('content-type')?.includes('application/x-ndjson')){
    const data=await response.json();if(!response.ok||data.error){throw apiError(data);}return data;
  }
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',result,completed=false;
  const consume=line=>{if(!line.trim())return;const item=JSON.parse(line);if(item.error){throw apiError(item);}if(item.progress)onProgress(item.progress);if(Object.hasOwn(item,'result')){result=item.result;completed=true;}};
  try{
    while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});let end;while((end=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,end));buffer=buffer.slice(end+1);}if(done)break;}
    consume(buffer);if(!completed)throw Error(t('progress.interrupted'));return result;
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function reportProgress(finish,update){
  const measured=Number.isFinite(update.completed)&&Number.isFinite(update.total)&&update.total>0;
  const percent=measured?Math.floor(update.completed/update.total*100):undefined;
  const phase=t('progress.phase.'+update.phase,{},undefined,t('progress.phase.starting'));
  const message=measured?t('progress.count',{phase,done:update.completed.toLocaleString(locale()),total:update.total.toLocaleString(locale()),percent}):phase;
  finish.update(message,percent);
}
export function createProgress(container){
  const box=el('div');box.className='work-progress';box.hidden=true;box.setAttribute('role','status');
  const label=el('span'),track=el('div');track.className='progress-track';track.setAttribute('role','progressbar');
  track.setAttribute('aria-label',t('caption.e5738f6f0529'));track.append(el('span'));box.append(label,track);container.append(box);
  let pending=0;
  function update(message,percent){
    label.textContent=message;track.setAttribute('aria-label',message);
    const measured=Number.isFinite(percent);track.classList.toggle('determinate',measured);
    if(measured){const value=Math.max(0,Math.min(100,percent));track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(value));track.firstChild.style.width=value+'%';}
    else{for(const name of ['aria-valuemin','aria-valuemax','aria-valuenow'])track.removeAttribute(name);track.firstChild.style.removeProperty('width');}
  }
  return {start(message){pending++;update(message);box.hidden=false;container.setAttribute('aria-busy','true');
    let finished=false;const finish=()=>{if(finished)return;finished=true;pending--;if(!pending){box.hidden=true;container.setAttribute('aria-busy','false');}};
    finish.update=(message,percent)=>{if(!finished)update(message,percent);};return finish;}};
}
export function modelWizard(component,onAssigned,renderPreview,candidates=[],options={}){
  const request=options.request||globalRequest;
  const dialog=el('dialog');dialog.className='model-wizard';
  // Load the shared stylesheet even in an import page opened before it existed.
  // External CSS respects the application's Content-Security-Policy.
  if(!document.querySelector('link[data-model-wizard-style]')){
    const stylesheet=el('link');stylesheet.rel='stylesheet';stylesheet.href='/model-wizard.css?v=50';
    stylesheet.setAttribute('data-model-wizard-style','');document.head.append(stylesheet);
  }
  const header=el('div');header.className='actions';header.append(el('h2',t('sim.dialogTitle',{name:component.name})));
  const close=decorateClose(el('button'));close.addEventListener('click',()=>dialog.close());header.append(close);dialog.append(header);
  const progress=createProgress(dialog);
  let pendingWork=0,symbolCanZoom=false,symbolReference=component.symbol||null;
  function startWork(message){pendingWork++;const finish=progress.start(message);const controls=[...dialog.querySelectorAll('button,input,select')].filter(node=>node!==close);const states=controls.map(node=>node.disabled);controls.forEach(node=>node.disabled=true);let finished=false;const done=()=>{if(finished)return;finished=true;controls.forEach((node,i)=>node.disabled=states[i]);pendingWork--;zoom.disabled=pendingWork>0||!symbolCanZoom;finish();};done.update=finish.update;return done;}
  const layout=el('div');layout.className='wizard-layout';const support=el('aside');support.className='wizard-symbol';let work=el('div');work.className='wizard-main';layout.append(support,work);dialog.append(layout);
  const symbolLabel=el('p',component.symbol||t('caption.1cf23aaa9e30'));support.append(el('h3',t('caption.a858a275b791')),symbolLabel);
  let datasheetAvailable=false;
  try{const url=new URL(component.datasheet);if(['https:','http:'].includes(url.protocol)){const link=el('a',t('caption.79a7fa90c8ab'));link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';support.append(link);datasheetAvailable=true;}}catch{}
  if(!datasheetAvailable)support.append(el('p',t('caption.343caeef395b')));
  const drawing=el('div');support.append(drawing);const zoom=el('button',t('caption.9d7e5880854d'));
  function showSymbol(geometry){symbolCanZoom=Boolean(geometry?.shapes?.length);zoom.disabled=pendingWork>0||!symbolCanZoom;drawing.replaceChildren(renderPreview(geometry,t('caption.6fe631fc5e9d'),t('caption.ab934e632db9')));}
  let currentSymbolLoaded=false;
  showSymbol(component.symbol_preview);
  zoom.addEventListener('click',()=>{const large=drawing.classList.toggle('symbol-large');zoom.textContent=large?t('caption.34283cf0f2df'):t('caption.9d7e5880854d');});support.append(zoom);
  if(!component.symbol_preview)request('/api/preview/'+encodeURIComponent(component.id)).then(data=>{if(!currentSymbolLoaded)showSymbol(data.symbol);}).catch(()=>{});
  const pinList=el('div');pinList.className='symbol-pin-list';support.append(pinList);
  const pinHint=el('p');pinHint.className='pin-hint';pinHint.hidden=true;support.append(pinHint);
  const existing=el('section');existing.className='existing-sim';existing.append(el('h3',t('sim.currentTitle')));
  const fields=component.simulation_fields||{};
  const native=candidates.some(candidate=>candidate.intrinsic);
  if(native){
    const semiconductor=['D','NPN','PNP','NJFET','PJFET','NMOS','PMOS'].includes(fields['Sim.Device']);
    existing.append(el('p',t(semiconductor?'sim.genericModel':'sim.internalModel',{name:[fields['Sim.Device'],fields['Sim.Type']].filter(Boolean).join(' / ')||component.name})));
    if(semiconductor)existing.append(el('p',t('sim.genericLimits')));
    existing.append(el('p',t('sim.noAssignment')));
  }
  for(const model of component.models||[]){
    existing.append(el('p',t('sim.assignedModel',{name:model.name})),el('p',t('sim.modelFile',{file:model.file||'—'})),el('p',t('sim.fileState',{state:t('sim.fileState.'+(model.file_status||'unknown'))})));
    if(model.pin_map?.length)existing.append(el('p',t('sim.pinMap',{pins:model.pin_map.map(p=>`${p.model_pin_name||p.model_pin} → ${p.symbol_pin}`).join(', ')})));
  }
  if(fields['Sim.Library'])existing.append(el('p',t('sim.assignedModel',{name:fields['Sim.Name']||fields['Sim.Device']||'—'})),el('p',t('sim.modelFile',{file:fields['Sim.Library']})),el('p',t('sim.fileState',{state:t('sim.fileState.'+(component.simulation_file_status||'unknown'))})));
  if(!native&&!(component.models||[]).length&&!fields['Sim.Library'])existing.append(el('p',t('sim.incompleteModel')));
  if(fields['Sim.Params'])existing.append(el('p',t('sim.modelParams',{params:fields['Sim.Params']})));
  else if(native)existing.append(el('p',t('sim.defaultParams')));
  if(fields['Sim.Pins'])existing.append(el('p',t('sim.pinMap',{pins:fields['Sim.Pins']})));
  const hasModel=native||(component.models||[]).length>0||Boolean(fields['Sim.Library']);
  existing.hidden=!hasModel;work.append(existing);
  const change=el('button',t('sim.change'));change.hidden=!hasModel;change.className='sim-change';work.append(change);
  const selection=el('section');selection.className='sim-selection';selection.hidden=hasModel;work.append(selection);
  // Search and import are only opened intentionally when a model already exists.
  work=selection;
  work.append(el('p',t('caption.5eace7999450')));
  const controls=el('div');controls.className='wizard-controls';
  const query=el('input');query.value=component.name;query.setAttribute('aria-label',t('caption.425d40977d2c'));
  const search=el('button',t('caption.dadffb5e9738'));
  const file=el('input');file.type='file';file.multiple=true;file.accept='.lib,.mod,.cir,.sp,.spice,.txt';file.setAttribute('aria-label',t('caption.896f50f9a164'));
  const folder=el('input');folder.type='file';folder.setAttribute('webkitdirectory','');folder.multiple=true;folder.setAttribute('aria-label',t('caption.91cdb8180cad'));
  controls.append(query,search);work.append(controls);
  const imports=el('details');imports.className='sim-import';imports.append(el('summary',t('sim.import')));work.append(imports);
  const fileLabel=el('label',t('caption.a9642bbcfde0'));fileLabel.append(file);imports.append(fileLabel);
  const folderLabel=el('label',t('caption.015203f2a8dc'));folderLabel.append(folder);imports.append(folderLabel);
  const sourceLabel=el('label',t('caption.5ccede1e14cb'));const source=el('input');source.type='url';source.placeholder='https://…';sourceLabel.append(source);imports.append(sourceLabel);
  const status=el('p');status.setAttribute('role','status');work.append(status);
  const results=el('div');results.className='model-candidates';work.append(results);
  const details=el('section');work.append(details);
  let pins=[],symbolHash=null,chosen=null,selectors=[],biases=[],pinReady=null;
  change.addEventListener('click',async()=>{selection.hidden=false;change.hidden=true;await pinReady;if(dialog.open)await find();});
  async function find(){const finish=startWork(t('caption.c42cbece5091'));try{status.textContent=t('caption.c42cbece5091');const data=await request('/api/models?q='+encodeURIComponent(query.value));results.hidden=false;results.replaceChildren();status.textContent=t('caption.3dbb63de9670',{v0:data.total.toLocaleString(locale()),v1:data.candidates.length});
    for(const c of data.candidates){const entry=el('div');const button=el('button',c.name+(c.exact?t('caption.17b453a0c77c'):''));button.addEventListener('click',()=>choose(c));const info=el('details');info.append(el('summary',t('sim.modelDetails')),el('p',[c.spice_kind,c.collection,c.filename].filter(Boolean).join(' · ')));entry.append(button,info);results.append(entry);}if(options.draft){const initial=data.candidates.find(c=>c.id==='DRAFT-'+options.initialAssignment?.model_id),bundled=data.candidates.filter(c=>c.id.startsWith('DRAFT-'));if(initial||bundled.length===1)choose(initial||bundled[0]);}if(!data.candidates.length)results.append(el('p',t(native||(component.models||[]).length||fields['Sim.Library']?'sim.noAdditional':'sim.noAdditionalNone')));
  }catch(error){showError(status,error);}finally{finish();}}
  function choose(c){chosen=c;selectors=[];biases=[];results.hidden=true;details.replaceChildren(el('h3',c.name+' · '+c.spice_kind));
    const other=el('button',t('caption.6e627252a958'));other.addEventListener('click',()=>{results.hidden=false;details.replaceChildren();});details.append(other);
    details.append(el('p',t('caption.241016553c75',{v0:c.source,v1:c.collection})));
    details.append(el('p',t('caption.d047e283e430')));
    const table=el('table');const head=el('tr');for(const label of [t('caption.2a28ef98f1dc'),t('caption.d25f83dbfee0')])head.append(el('th',label));table.append(head);
    const advanced=el('details'),settings=el('div');advanced.append(el('summary',t('caption.380c4bc706f5')));
    advanced.append(el('p',t('caption.271cd80bbf81')));advanced.append(settings);
    c.pins.forEach((role,i)=>{const row=el('tr');row.append(el('td',t('sim.role.'+c.type+'.'+role,{},undefined,c.terminal_info?.[i]?.role||role)));const cell=el('td'),select=el('select');select.setAttribute('aria-label',t('caption.dd49eac871ab',{v0:i+1}));const blank=el('option',t('caption.612e688edda3'));blank.value='';select.append(blank);
      for(const pin of pins){const option=el('option',t('sim.symbolTerminal',{pin:pin.number})+(pin.name&&pin.name!=='~'?' · '+pin.name:''));option.value=pin.number;select.append(option);}
      const normalize=value=>value.toUpperCase().replace(/[^A-Z0-9]/g,'');
      const aliases={A:['A','ANODE'],K:['K','CATHODE','KATHODE'],D:['D','DRAIN'],G:['G','GATE'],S:['S','SOURCE'],C:['C','COLLECTOR'],E:['E','EMITTER'],B:c.type==='Q'?['B','BASE']:['B','BULK','BODY']};const matches=pins.filter(p=>(c.type==='X'?[role]:aliases[role]||[role]).some(alias=>normalize(p.name)===normalize(alias)));if(matches.length===1)select.value=matches[0].number;
      if(c.terminal_info?.[i]?.suggested)select.value=c.terminal_info[i].suggested;if(c.id==='DRAFT-'+options.initialAssignment?.model_id)select.value=options.initialAssignment.pins[i]||'';
      if(c.type==='D'){const known=diodeSymbolRoles(pins);if(known)select.value=known[role];}
      if(c.type==='M'&&role==='B'){const s=pins.find(p=>p.name==='S');if(s)select.value=s.number;}
      cell.append(select);row.append(cell);selectors.push(select);
      const voltage=el('input');voltage.type='number';voltage.step='any';voltage.setAttribute('aria-label',t('caption.79c379958052',{v0:i+1}));
      const p=c.spice_kind.startsWith('P');const defaults=c.type==='D'?[.65,0]:c.type==='Q'?[p?-2:2,p?-.7:.7,0]:c.type==='M'?[p?-1:1,p?-5:5,0,0]:c.type==='J'?[p?-1:1,0,0]:[];
      voltage.value=defaults[i]??'';const voltageLabel=el('label',t('caption.7dcaa988e08e',{v0:role}));voltageLabel.append(voltage);settings.append(voltageLabel);biases.push(voltage);table.append(row);
    });
    if(c.type==='D'&&diodeSymbolRoles(pins)){const edit=el('details');edit.className='sim-pin-edit';edit.append(el('summary',t('sim.editPins')),table);details.append(edit);}else details.append(table);
    const diode=options.draft?null:diodePanel(c,pins,{...component,symbol_sha256:symbolHash,symbol_reference:symbolReference},()=>selectors.map(s=>s.value),startWork,()=>invalidate(),c.type==='D'?{A:selectors[0],K:selectors[1]}:null);if(diode)details.append(diode.node);
    const test=el('button',t('caption.5f6721edc216')),assign=el('button',t(options.draft?'import.simUseDraft':'sim.save'));const report=el('pre');report.className='model-report';
    details.append(el('p',t('caption.14f7b3c650c4')));if(c.dependencies){test.disabled=true;assign.disabled=true;details.append(el('p',t('import.simDependencies')));}
    if(options.draft)details.append(el('p',t('import.simDraftHelp')));
    if(c.simulator==='TINA')details.append(el('p',t('import.simTina')));
    if(c.type==='X')details.append(el('p',t('caption.0d6f3a86c6d9')));
    const summary=el('div');summary.className='test-summary';summary.hidden=true;summary.setAttribute('role','status');
    const logDetails=el('details');logDetails.append(el('summary',t('caption.d6509255955f')),report);logDetails.hidden=true;
    test.addEventListener('click',async()=>{const finish=startWork(t('caption.175a5d993145'));summary.hidden=true;logDetails.hidden=true;try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const result=await request('/api/models/test',{component_id:component.id,model_id:c.id,symbol_sha256:symbolHash,symbol_reference:symbolReference,pins:selectors.map(s=>s.value),biases:biases.map(v=>v.value===''?null:Number(v.value))});summary.className='test-summary '+(result.ok?'test-partial':'test-error');summary.replaceChildren(el('strong',t('caption.d2b4c260fbdb')),el('p',t('caption.5c114aba813b')+(result.mapping?.status==='conflict'?t('caption.faec0125650b'):result.ok?calculableMessage():t('caption.2b4c87aef234'))),el('p',t('caption.a4fbea110a94')+t('sim.mapping.'+(['checked','conflict','unknown'].includes(result.mapping?.status)?result.mapping.status:'not_checked'))),el('p',t('caption.c1e3b66f4a19')));summary.hidden=false;report.textContent=[result.mapping?.message,result.note,result.log].filter(Boolean).join('\n');logDetails.hidden=false;}catch(error){summary.className='test-summary test-error';showError(summary,error);summary.hidden=false;}finally{finish();}});
    assign.addEventListener('click',async()=>{if(diode&&!diode.roles()){status.textContent=t('sim.confirmRoles');return;}if(selectors.some(s=>!s.value)){status.textContent=t('caption.a6a12c28b593');status.scrollIntoView?.({block:'nearest'});return;}const numbers=selectors.map(s=>s.value);if(new Set(numbers).size!==numbers.length&&!(c.type==='M'&&numbers.length===4&&new Set(numbers.slice(0,3)).size===3&&numbers[3]===numbers[2])){summary.className='test-summary test-error';summary.textContent=t('sim.duplicatePins');summary.hidden=false;summary.scrollIntoView?.({block:'nearest'});return;}const finish=startWork(t('caption.4f62bfd63677'));try{const model=await request('/api/models/assign',{component_id:component.id,model_id:c.id,symbol_sha256:symbolHash,symbol_reference:symbolReference,pins:selectors.map(s=>s.value),biases:biases.map(v=>v.value===''?null:Number(v.value)),diode_roles:diode?.roles()||null});onAssigned(model);dialog.close();}catch(error){showError(status,error);}finally{finish();}});
    const invalidate=()=>{summary.className='test-summary test-partial';summary.textContent=t('caption.2e271d7981ab');summary.hidden=false;logDetails.hidden=true;};biases.forEach(input=>input.addEventListener('input',invalidate));selectors.forEach(select=>select.addEventListener('change',()=>{invalidate();diode?.mappingChanged();}));
    const calculation=el('section');calculation.className='sim-calculation';calculation.append(test,advanced,summary,logDetails);details.append(calculation,assign);
  }
  search.addEventListener('click',find);query.addEventListener('keydown',e=>{if(e.key==='Enter')find();});
  async function importFiles(input){const finish=startWork(t('caption.f395fe6fca58'));try{
    const selected=[...input.files].filter(f=>/\.(lib|mod|cir|sp|spice|txt|bjt|mos|dio|jft)$/i.test(f.name));
    if(!selected.length)throw Error(t('progress.noFiles'));
    if(selected.length>2000||selected.reduce((sum,f)=>sum+f.size,0)>10_000_000)throw Error(t('caption.53b1c598e037'));
    status.textContent=t('caption.f395fe6fca58');const files=[];
    for(const f of selected){files.push({name:f.webkitRelativePath||f.name,content:await f.text()});reportProgress(finish,{phase:'readFiles',completed:files.length,total:selected.length});}
    const imported=options.draft?await request('/api/models/import',{files,source:source.value}):await requestWithProgress('/api/models/import',{files,source:source.value||t('caption.5e47640615ea')},update=>reportProgress(finish,update));
    // End import before refreshing candidates, so controls cannot retain a nested disabled state.
    finish();await find();status.textContent=t('caption.18920ecf760d',{v0:imported.imported})+status.textContent;
  }catch(error){showError(status,error);}finally{finish();}}
  file.addEventListener('change',()=>importFiles(file));folder.addEventListener('change',()=>importFiles(folder));
  dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
  const finishPins=startWork(t('caption.8d6e9288892d'));
  pinReady=request('/api/models/pins?component='+encodeURIComponent(component.id)).then(data=>{pins=data.pins;pinList.replaceChildren(...pins.map(pin=>el('div',pin.number+' · '+(pin.name&&pin.name!=='~'?pin.name:t('sim.unnamedPin')))));symbolHash=data.symbol_sha256||null;symbolReference=data.symbol_reference||symbolReference;symbolLabel.textContent=symbolReference||t('caption.1cf23aaa9e30');if(Object.hasOwn(data,"symbol_preview")){currentSymbolLoaded=true;showSymbol(data.symbol_preview);}if(!diodeSymbolRoles(pins)&&pins.some(pin=>!pin.name||pin.name==='~')){pinHint.textContent=t('caption.289a41093438');pinHint.hidden=false;}if(!pins.length)status.textContent=t('caption.6c0392c74249');}).catch(error=>{showError(status,error);}).finally(finishPins);
  if(!hasModel)pinReady.then(()=>{if(dialog.open)return find();});
}
