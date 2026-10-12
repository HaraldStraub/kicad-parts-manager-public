import {createProgress,decorateClose} from './model-wizard.js';
import {apiError,showError,t,locale,fieldLabel,conditionLabel,kindLabel,originLabel,evidenceSummary} from './i18n.js';
import {exportParameter} from './catalog-utils.js';
import {proposals} from './data-coverage.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
async function request(url,body){const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();if(!r.ok)throw apiError(data);return data;}
function field(label,input){const wrap=el('label',label);wrap.append(input);return wrap;}
function input(label,value=''){const node=el('input');node.value=value;node.setAttribute('aria-label',label);return node;}
const date=value=>new Date(value).toLocaleString(locale());
export async function manualEditor(component,onSaved,datasheetOptions=[],options={}){
  const dialog=el('dialog');dialog.className='manual-editor';dialog.setAttribute('aria-label',t('caption.89639238a52f'));
  dialog.append(el('h2',t('editor.title',{name:component.name})));
  const close=decorateClose(el('button'));close.addEventListener('click',()=>dialog.close());dialog.append(close);
  const progress=createProgress(dialog),status=el('p');status.setAttribute('role','status');dialog.append(status);
  document.body.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove());
  let finish=progress.start(t('caption.41336b6d878a'));
  try{
    const url='/api/manual-data?component='+encodeURIComponent(component.id),data=await request(url),original=data.override;

    const form=el('form');dialog.append(form);
    const manufacturer=input(t('caption.32da517562d9'),component.manufacturer||''),manufacturerSource=input(t('caption.678ed1f69dfd'),original.manufacturer?.source||'');
    form.append(field(t('caption.8d03e7d6d6f4'),manufacturer));
    const metadata=el('details');metadata.className='editor-metadata';metadata.append(el('summary',t('editor.sources')),field(t('caption.d3a8cdcda5cf'),manufacturerSource));
    let resetManufacturer=false;
    if(original.manufacturer){const reset=el('button',t('caption.20cb318c685b'));reset.type='button';reset.addEventListener('click',()=>{resetManufacturer=true;manufacturer.disabled=true;manufacturerSource.disabled=true;reset.disabled=true;});metadata.append(reset);}
    const sheet=input(t('caption.66a3e22bb7fe'),component.datasheet==='~'?'':component.datasheet||'');sheet.type='url';sheet.placeholder='https://…';
    const source=input(t('caption.553afc0eef13'),original.datasheet?.source||t('caption.39ee463100b6'));
    form.append(field(t('caption.605e267534a5'),sheet));metadata.append(field(t('caption.e2a23ecee1bc'),source));
    const sheetActions=el('div');sheetActions.className='actions';const openSheet=el('a',t('caption.79a7fa90c8ab'));openSheet.target='_blank';openSheet.rel='noopener noreferrer';sheetActions.append(openSheet);form.append(sheetActions);
    const validLink=value=>{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}};
    const updateLink=()=>{const url=validLink(sheet.value);openSheet.hidden=!url;if(url)openSheet.href=url;else openSheet.removeAttribute('href');};sheet.addEventListener('input',updateLink);updateLink();
    const candidates=new Map();for(const candidate of [{url:component.datasheet,label:t('caption.9011cb39b42c')},{url:data.original_datasheet,label:t('caption.96e272af6a61')},...datasheetOptions]){const url=validLink(candidate.url);if(url&&!candidates.has(url))candidates.set(url,candidate.label);}
    if(candidates.size){const choice=el('select');choice.setAttribute('aria-label',t('caption.db6ddde742ea'));const blank=el('option',t('caption.6502b7ce6c30'));blank.value='';choice.append(blank);for(const [url,label] of candidates){const option=el('option',label+' · '+url);option.value=url;choice.append(option);}choice.addEventListener('change',()=>{if(!choice.value)return;sheet.value=choice.value;source.value=candidates.get(choice.value);updateLink();});metadata.append(field(t('caption.624bda43f41d'),choice));}
    let resetSheet=false;
    const resetLink=el('button',t('caption.1cc343944bd5'));resetLink.type='button';resetLink.disabled=!original.datasheet;
    resetLink.addEventListener('click',()=>{resetSheet=true;openSheet.hidden=true;sheet.disabled=true;source.disabled=true;resetLink.disabled=true;form.querySelectorAll('select').forEach(select=>select.disabled=true);status.textContent=t('caption.7a3b68854f4c');});resetLink.hidden=!original.datasheet;metadata.append(resetLink);form.append(metadata);
    const list=el('div');list.className='manual-fields';form.append(el('h3',t('caption.30a0585c5a2b')),el('p',t('editor.instructions'),'hint'),list);
    const entries=[],suggestions=proposals(component);
    const proposalByKey=new Map(suggestions.map(p=>[p.key,p]));
    for(const raw of data.fields){const f={...raw,label:fieldLabel(raw.key,raw.label)};
      const old=original.values[f.key],number=component.values[f.key],card=el('fieldset');const legend=el('legend',f.label);card.append(legend);
      const value=input(t('caption.c0567b7ca2d1')+f.label,number==null?'':f.type==='text'?String(number):String(Number((number*f.factor).toPrecision(12))));value.type=f.type==='text'?'text':'number';value.step=f.key==='pins_description'?'1':'any';
      if(f.type==='text'&&f.options?.length){const choices=el('datalist');choices.id='choices-'+f.key;for(const choice of f.options){const option=el('option');option.value=choice;choices.append(option);}value.setAttribute('list',choices.id);card.append(choices);}if(f.multiple)card.append(el('p',t('caption.752de8f0c9e0'),'hint'));
      const origin=input(t('caption.5d5a4940c950')+f.label,old?.source||''),conditions=input(t('caption.5ceb6ab17d6a')+f.label,old?.conditions||'');
      origin.placeholder=t('caption.f50f683b56d7');conditions.placeholder=f.key==='insertion_loss'?t('caption.4c430ea2dfcc'):t('caption.96e286e7fc18');
      card.append(field(t('caption.7e347daa5ec7')+(f.unit?' ('+f.unit+')':''),value));
      const evidence=el('details');evidence.className='editor-evidence';evidence.append(el('summary',t('editor.evidence')),field(t('caption.0378894a522e'),origin),field(t('caption.3bc53dc30523'),conditions));card.append(evidence);
      if(old)evidence.append(el('p',originLabel(old.source_details?.candidate_id?'manufacturer':'manual')+t('caption.8ad6cf17993f')+date(old.updated_at),'hint'));
      else if(number!=null)evidence.append(el('p',evidenceSummary(exportParameter(component,f.key),[f.key,f.label,f.unit,f.factor,f]),'hint'));
      const reset=el('button',t('caption.dc932e39981e'));reset.type='button';reset.disabled=!old;
      const kind=el('select');kind.setAttribute('aria-label',t('caption.166ede1774e9')+f.label);for(const [key,label] of [['unspecified',kindLabel('unspecified')],['nominal',kindLabel('nominal')],['typical',kindLabel('typical')],['minimum',kindLabel('minimum')],['maximum',kindLabel('maximum')],['absolute_maximum',kindLabel('absolute_maximum')]]){const option=el('option',label);option.value=key;kind.append(option);}kind.value=old?.kind||component.parameters?.find(p=>p.name===f.key)?.kind||'unspecified';if(f.type!=='text')evidence.append(field(t('caption.f3738c5ff061'),kind));
      const measurements=[];for(const c of f.conditions||[]){const control=input(conditionLabel(c.key,c.label)+t('caption.9d53e6079d93')+f.label,old?.conditions_data?.[c.key]??'');if(c.type==='text'){control.type='text';const choices=el('datalist');choices.id='conditions-'+f.key+'-'+c.key;for(const option of c.options||[]){const item=el('option');item.value=option;choices.append(item);}control.setAttribute('list',choices.id);card.append(choices);}else{control.type='number';control.step='any';}evidence.append(field(conditionLabel(c.key,c.label)+(c.unit?' ('+c.unit+')':''),control));measurements.push({c,control,initial:control.value});}
      const entry={f,value,origin,conditions,kind,initialKind:kind.value,measurements,initial:[value.value,origin.value,conditions.value],reset:false};
      entry.card=card;
      reset.addEventListener('click',()=>{entry.reset=true;value.disabled=true;origin.disabled=true;conditions.disabled=true;reset.disabled=true;card.append(el('p',t('caption.6f36409c132f'),'hint'));});reset.hidden=!old;evidence.append(reset);list.append(card);entries.push(entry);
      const p=proposalByKey.get(f.key);if(p){const use=el('button',t('editor.useProposal',{value:(p.value*p.factor).toLocaleString(locale())+(p.unit?' '+p.unit:'')}));use.type='button';use.className='inline-proposal';use.addEventListener('click',()=>{if(entry.reset||entry.proposed||[value.value,origin.value,conditions.value].some((v,i)=>v!==entry.initial[i])||kind.value!==entry.initialKind||measurements.some(m=>m.control.value!==m.initial)){status.textContent=t('editor.edited');return;}value.value=String(Number((p.value*p.factor).toPrecision(12)));entry.proposed=true;origin.value=t('caption.71337c9152da')+component.symbol;conditions.value=t('caption.fad7d5c379fd')+p.description;evidence.open=true;status.textContent=t('editor.proposalPending');use.disabled=true;form.dispatchEvent(new dialog.ownerDocument.defaultView.Event('input',{bubbles:true}));});card.insertBefore(use,evidence);}
    }
    if(options.onManufacturer){
      const vendor=el('button',t('editor.manufacturer'));vendor.type='button';
      const changed=()=>entries.some(e=>e.reset||[e.value.value,e.origin.value,e.conditions.value].some((v,i)=>v!==e.initial[i])||e.kind.value!==e.initialKind||e.measurements.some(m=>m.control.value!==m.initial))||resetManufacturer||resetSheet||manufacturer.value!==(component.manufacturer||'')||manufacturerSource.value!==(original.manufacturer?.source||'')||sheet.value!==(component.datasheet==='~'?'':component.datasheet||'')||source.value!==(original.datasheet?.source||t('caption.39ee463100b6'));
      const update=()=>{vendor.disabled=changed();vendor.title=vendor.disabled?t('editor.saveFirst'):'';};form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('click',()=>queueMicrotask(update));
      vendor.addEventListener('click',()=>{if(changed())return;dialog.close();options.onManufacturer();});metadata.append(vendor);
    }
    const history=el('details');history.append(el('summary',t('caption.f3798e8c0a00')+data.history.length+')'));
    for(const version of data.history){const item=el('details');item.append(el('summary',date(version.updated_at)+t('caption.5a58e83118c1')+version.revision));
      if(version.data.datasheet)item.append(el('p',t('caption.1187003f98c0')+(version.data.datasheet.url||t('caption.869cf1ec2472'))+' · '+version.data.datasheet.source));
      if(version.data.manufacturer)item.append(el('p',t('caption.0a270b0c42d2')+version.data.manufacturer.value+' · '+version.data.manufacturer.source));
      for(const [key,v] of Object.entries(version.data.values)){const f=data.fields.find(f=>f.key===key);item.append(el('p',fieldLabel(key,f?.label||key)+': '+(typeof v.value==='number'?(v.value*(f?.factor||1)).toLocaleString(locale()):String(v.value))+' '+(f?.unit||'')+t('caption.f1961c63f78f')+v.source+(v.conditions?t('caption.fc0e25dc009c')+v.conditions:'')));}
      if(!version.data.datasheet&&!version.data.manufacturer&&!Object.keys(version.data.values).length)item.append(el('p',t('caption.044fba5bf54f')));
      history.append(item);
    }form.append(history);
    const save=el('button',t('editor.save'));save.className='editor-save';save.type='submit';form.append(save);
    form.addEventListener('submit',async event=>{event.preventDefault();const payload={component_id:component.id,revision:original.revision,values:{}};
      try{
        for(const e of entries){const now=[e.value.value,e.origin.value,e.conditions.value];if(e.reset){payload.values[e.f.key]=null;continue;}if(now.every((v,i)=>v===e.initial[i])&&e.kind.value===e.initialKind&&e.measurements.every(m=>m.control.value===m.initial))continue;
          if(!e.value.value){if(original.values[e.f.key])payload.values[e.f.key]=null;continue;}
          if(!e.value.validity.valid)throw Error(t('caption.9a96cbe28f22')+e.f.label+'.');
          const number=e.f.type==='text'?e.value.value.trim():e.value.value===e.initial[0]&&component.values[e.f.key]!=null?component.values[e.f.key]:Number(e.value.value)/e.f.factor;if(e.f.type!=='text'&&!Number.isFinite(number))throw Error(t('caption.9a96cbe28f22')+e.f.label+'.');
          const evidence=e.origin.value.trim()||(!resetSheet?sheet.value.trim():'');if(!evidence)throw Error(t('caption.d8cd109621ea')+e.f.label+t('caption.3597bc0abecd'));
          payload.values[e.f.key]={value:number,source:evidence,conditions:e.conditions.value};if(e.f.type!=='text')payload.values[e.f.key].kind=e.kind.value;const measured={};for(const m of e.measurements){if(m.control.value==='')continue;if(!m.control.validity.valid||(m.c.type!=='text'&&!Number.isFinite(Number(m.control.value))))throw Error(t('caption.00233fcfcc34')+conditionLabel(m.c.key,m.c.label));measured[m.c.key]=m.c.type==='text'?m.control.value:Number(m.control.value);}if(e.measurements.length)payload.values[e.f.key].conditions_data=measured;
        }
        if(resetSheet)payload.datasheet=null;
        else if(sheet.value!==(component.datasheet==='~'?'':component.datasheet||'')||source.value!==(original.datasheet?.source||t('caption.39ee463100b6'))){payload.datasheet=sheet.value;payload.datasheet_source=source.value;}
        if(resetManufacturer)payload.manufacturer=null;
        else if(manufacturer.value!==(component.manufacturer||'')||manufacturerSource.value!==(original.manufacturer?.source||'')){payload.manufacturer=manufacturer.value;payload.manufacturer_source=manufacturerSource.value;}
        if(!Object.keys(payload.values).length&&!('datasheet' in payload)&&!('manufacturer' in payload)){status.textContent=t('caption.328b85477f78');return;}
        const done=progress.start(t('caption.305ede4b6d1d'));const controls=[...form.querySelectorAll('input,button,select')],states=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);close.disabled=true;
        try{await request('/api/manual-data',payload);const latest=await request(url);onSaved(latest.component);dialog.close();}
        finally{controls.forEach((c,i)=>c.disabled=states[i]);close.disabled=false;done();}
      }catch(error){showError(status,error);status.className='notice';}
    });
  }catch(error){showError(status,error);status.className='notice';}finally{finish();}
}
