import {profile,availableProfile,descriptionRatings,extraRatings} from './catalog-utils.js';
import {t,locale,fieldLabel,conditionLabel} from './i18n.js';

export const hasValue=value=>value!=null&&value!==''&&(typeof value!=='number'||Number.isFinite(value));
export function pilotSupported(component){return /(^|\/)(diode|mosfet|tvs|zener|bjt|voltage_reference|timer)(\/|$)/.test(component.category||'');}
export function parameterState(component,key){
  if(!hasValue(component.values?.[key]))return 'missing';
  if(component.manual_data?.values?.[key])return component.manual_data.values[key].source_details?.candidate_id?'manufacturer':'manual';
  return hasValue(component.description_values?.[key])?'description':'catalog';
}
export function coverage(rows){
  const groups=new Map();
  for(const c of rows){
    if(!['library','manufacturer'].includes(c.kind)||!c.symbol)continue;
    const path=c.category||'unassigned';
    if(!groups.has(path))groups.set(path,[]);
    groups.get(path).push(c);
  }
  return [...groups].map(([path,components])=>{
    const standard=new Set(profile(path).map(f=>f[0]));
    const fields=availableProfile(path).filter(f=>standard.has(f[0])||components.some(c=>hasValue(c.values?.[f[0]]))).map(f=>({key:f[0],label:f[1],unit:f[2],missing:0,description:0,manual:0,manufacturer:0,catalog:0}));
    for(const c of components)for(const field of fields)field[parameterState(c,field.key)]++;
    return {path,total:components.length,fields};
  }).sort((a,b)=>a.path.localeCompare(b.path,'de'));
}
export function proposals(component,description=component.description||''){
  if(!pilotSupported(component))return [];
  const candidate={...component,description},parsed={...extraRatings(candidate),...descriptionRatings(candidate)};
  return availableProfile(component.category).filter(f=>hasValue(parsed[f[0]])&&!component.manual_data?.values?.[f[0]]&&(!hasValue(component.values?.[f[0]])||parameterState(component,f[0])==='description')).map(f=>({key:f[0],label:f[1],unit:f[2],factor:f[3],value:parsed[f[0]],description}));
}

const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
export function coverageDialog(rows,onSelect,label,pathLabel=path=>path){
  const dialog=el('dialog');dialog.className='manual-editor coverage-dialog';dialog.setAttribute('aria-label',t('caption.5c6fc91e890d'));dialog.append(el('h2',t('caption.95c5fc922ec9')+label),el('p',t('caption.92134ce6ca97')));
  const close=el('button','×');close.type='button';close.className='dialog-close';close.setAttribute('aria-label',t('common.close'));close.addEventListener('click',()=>dialog.close());dialog.append(close);
  const table=el('table'),head=el('thead'),tr=el('tr');for(const name of [t('caption.0f2cc6c1195d'),t('caption.380f98c64bde'),t('caption.76f5df15bbc8'),t('caption.1c58e0c512b1'),t('caption.a929ea997ad4'),t('caption.1b87e69da08a'),t('caption.a4ad259e71cb')])tr.append(el('th',name));head.append(tr);table.append(head);const body=el('tbody');table.append(body);dialog.append(table);
  const groups=coverage(rows);
  for(const group of groups){const title=el('tr'),cell=el('th',pathLabel(group.path)+' · '+group.total+t('caption.fb1214615f9b'));cell.colSpan=7;title.append(cell);body.append(title);
    for(const f of group.fields){const line=el('tr');for(const value of [fieldLabel(f.key,f.label)+(f.unit?' ('+f.unit+')':''),`${f.missing} / ${group.total}`,f.description,f.catalog,f.manufacturer,f.manual])line.append(el('td',value));const action=el('td');if(f.missing){const button=el('button',t('caption.9654de9cd2e1'));button.addEventListener('click',()=>{onSelect(group.path,f.key);dialog.close();});action.append(button);}line.append(action);body.append(line);}
  }
  if(!groups.length)dialog.append(el('p',t('caption.f13e9169806c')));
  dialog.append(el('p',t('caption.d3f69110c2de')));
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
