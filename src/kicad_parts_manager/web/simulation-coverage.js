import {simulationCandidates,matchesSimulation,diodeFunctionState} from './catalog-utils.js';
import {t,locale,fieldLabel,conditionLabel} from './i18n.js';

export function simulationCoverage(rows){
  const groups=new Map();
  for(const row of rows){
    if(row.kind==='footprint'||!row.symbol)continue;
    const path=row.category||'unassigned';
    const group=groups.get(path)||{path,total:0,present:0,calculable:0,dc:0,switching:0,diode:0,unavailable:0,generic:0,specific:0,fields:0,missing:0,changed:0,unknown:0,none:0};
    group.total++;
    const candidates=simulationCandidates(row),present=candidates.filter(c=>c.availability==='present');
    if(present.length){
      group.present++;
      if(present.some(c=>c.type==='generic'))group.generic++;
      if(present.some(c=>c.type==='specific'))group.specific++;
      if(matchesSimulation(row,'present','calculable'))group.calculable++;
      if(matchesSimulation(row,'present','dc'))group.dc++;
      if(matchesSimulation(row,'present','switching'))group.switching++;
      if(present.some(c=>c.model&&diodeFunctionState(c.model)==='bestanden'))group.diode++;
    }else{
      group.unavailable++;
      // Mutually exclusive reasons; an altered known file takes precedence.
      const state=['changed','missing','fields','unknown'].find(s=>candidates.some(c=>c.availability===s))||'none';
      group[state]++;
    }
    groups.set(path,group);
  }
  return [...groups.values()].sort((a,b)=>a.path.localeCompare(b.path,'de'));
}

const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
export function simulationCoverageDialog(rows,label,pathLabel,onCategory){
  const groups=simulationCoverage(rows),dialog=el('dialog');dialog.className='manual-editor coverage-dialog';dialog.setAttribute('aria-label',t('caption.482137a5606c'));
  dialog.append(el('h2',t('caption.3cd88a32497b')+label),el('p',t('caption.36425fde70c4')));
  const close=el('button','×');close.type='button';close.className='dialog-close';close.setAttribute('aria-label',t('common.close'));close.addEventListener('click',()=>dialog.close());dialog.append(close);
  const table=el('table'),head=el('thead'),heading=el('tr');
  for(const name of [t('caption.52f2a87a419c'),t('caption.00f163d72cb8'),t('caption.631fa2ecb07d'),t('caption.7aebd8dbcd1b'),t('caption.e3f8d265612a'),t('caption.594662dd182e'),t('caption.ffd66c1aea8d'),t('caption.58d196134da6')])heading.append(el('th',name));
  head.append(heading);table.append(head);const body=el('tbody');table.append(body);dialog.append(table);
  for(const group of groups){
    const line=el('tr'),category=el('td'),button=el('button',pathLabel(group.path));button.title=t('caption.75126d00a3ae');
    button.addEventListener('click',()=>{onCategory(group.path);dialog.close();});category.append(button);line.append(category);
    for(const key of ['total','present','calculable','diode','dc','switching','unavailable'])line.append(el('td',group[key]));body.append(line);
  }
  if(!groups.length)dialog.append(el('p',t('caption.daa5e9927e7a')));
  const sum=key=>groups.reduce((n,g)=>n+g[key],0);
  dialog.append(el('p',t('caption.226578ae7bfe',{v0:sum('generic'),v1:sum('specific')})));
  dialog.append(el('p',t('caption.91f02b3956f3',{v0:sum('changed'),v1:sum('missing'),v2:sum('fields'),v3:sum('unknown'),v4:sum('none')})));
  dialog.append(el('p',t('caption.d78e42eec38f'),'hint'));
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
