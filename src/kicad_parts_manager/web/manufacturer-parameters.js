import {createProgress,decorateClose} from './model-wizard.js';
import {apiError,showError,t,locale,fieldLabel,conditionLabel,kindLabel,originLabel,evidenceSummary} from './i18n.js';
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
const kinds=()=>({unspecified:kindLabel('unspecified'),nominal:kindLabel('nominal'),typical:kindLabel('typical'),minimum:kindLabel('minimum'),maximum:kindLabel('maximum'),absolute_maximum:kindLabel('absolute_maximum')});
async function request(url,body){const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const result=await response.json();if(!response.ok)throw apiError(result);return result;}
function link(url,label){try{const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)return el('span',t('caption.ef2a03e29cde'));const a=el('a',label);a.href=parsed.href;a.target='_blank';a.rel='noopener noreferrer';return a;}catch{return el('span',t('caption.ef2a03e29cde'));}}
const display=(value,definition)=>value==null?'—':typeof value==='number'?(value*(definition?.factor||1)).toLocaleString(locale(),{maximumSignificantDigits:6})+(definition?.unit?' '+definition.unit:''):String(value);
export function manufacturerMatch(component,record){const category=component.category||'',segments=category.split('/'),polarity=segments.includes('n_channel')?'N':segments.includes('p_channel')?'P':segments.includes('npn')?'NPN':segments.includes('pnp')?'PNP':null;return ['library','manufacturer'].includes(component.kind)&&Boolean(component.symbol)&&component.name?.trim().toLowerCase()===record.mpn.toLowerCase()&&(category===record.category||category.startsWith(record.category+'/'))&&(!polarity||!record.polarity||polarity===record.polarity);}
function dialog(title){const node=el('dialog');node.className='manual-editor manufacturer-dialog';node.setAttribute('aria-label',title);node.append(el('h2',title));const close=decorateClose(el('button'));close.type='button';close.addEventListener('click',()=>node.close());node.append(close);document.body.append(node);node.addEventListener('close',()=>node.remove());node.showModal();return {node,close};}

export async function manufacturerDialog(component,onSaved){
  const {node,close}=dialog(t('caption.0a28c1cddb72')+component.name),progress=createProgress(node),status=el('p');status.setAttribute('role','status');node.append(status);const done=progress.start(t('caption.fdd21e7f21ee'));
  try{
    const {candidates}=await request('/api/manufacturer-parameters?component='+encodeURIComponent(component.id));
    if(!candidates.length){node.append(el('p',t('editor.noManufacturer')));return;}
    node.append(el('p',t('caption.9db091801444')));
    for(const preview of candidates){
      const record=preview.candidate,section=el('section');node.append(section);section.append(el('h3',record.publisher+' · '+record.mpn+' · '+record.package),link(record.source.url,t('caption.6d453eb9a42c')),el('p',record.source.document+' · '+record.source.revision+t('caption.498f31ac4f8a')+record.source.accessed_on));
      const identity=el('div');identity.className='notice';identity.append(el('p',t('caption.5ab557ae4a11')+(preview.current_manufacturer||t('caption.cf12db2a9abb'))));if(preview.current_datasheet)identity.append(link(preview.current_datasheet,t('caption.9ffa20a0e9fa')));for(const warning of preview.warnings)identity.append(el('p',warning));section.append(identity);
      const table=el('table'),head=el('tr');for(const label of [t('caption.936378b371b9'),'Parameter',t('caption.064439d37dcf'),t('caption.791734237f83'),t('caption.f3738c5ff061'),t('caption.d429e361fda9')])head.append(el('th',label));const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');table.append(body);section.append(table);const controls=[];
      for(const f of preview.fields){const row=el('tr'),check=el('input');check.type='checkbox';check.setAttribute('aria-label',t('caption.6024d865cc69')+(fieldLabel(f.key,f.definition?.label||f.key)));check.disabled=['protected','unsupported'].includes(f.state);check.checked=f.state==='new';const box=el('td');box.append(check);row.append(box,el('td',fieldLabel(f.key,f.definition?.label||f.key)),el('td',display(f.before,f.definition)),el('td',display(f.after.value,f.definition)),el('td',kinds()[f.after.kind]||kindLabel('unspecified')));
        const info=el('td',f.after.conditions+t('caption.35d14e8fcce2')+f.after.page);if(f.state==='protected')info.append(el('p',t('caption.03d7cbecb729')));if(f.state==='same')info.append(el('p',t('caption.507cced3b1ee')));if(f.state==='different'){info.append(el('p',t('caption.6b1ba8bddf4f')));row.className='parameter-conflict';}if(f.state==='unsupported')info.append(el('p',t('caption.87e609256281')));row.append(info);body.append(row);controls.push({field:f,check});}
      const confirm=el('input');confirm.type='checkbox';confirm.setAttribute('aria-label',t('caption.beaee1fafa90'));const confirmLabel=el('label');confirmLabel.append(confirm,el('span',t('caption.c20117ce4eae')));section.append(confirmLabel);
      const sheet=el('input');sheet.type='checkbox';sheet.checked=!preview.datasheet_protected;sheet.disabled=preview.datasheet_protected;const sheetLabel=el('label');sheetLabel.append(sheet,el('span',t('caption.cedaa958098d')+(preview.datasheet_protected?t('caption.e24593cbd6f3'):'')));section.append(sheetLabel);
      const maker=el('input');maker.type='checkbox';maker.checked=!preview.current_manufacturer&&!preview.manufacturer_protected;maker.disabled=preview.manufacturer_protected;const makerLabel=el('label');makerLabel.append(maker,el('span',t('caption.02e28a9d66bd')+record.publisher+t('caption.c8aa5773e410')+(preview.manufacturer_protected?t('caption.6d0cf911adc1'):'')));section.append(makerLabel);
      const apply=el('button',t('caption.f80d469b568c'));apply.type='button';const update=()=>{apply.disabled=!confirm.checked||!controls.some(c=>c.check.checked&&!c.check.disabled);};confirm.addEventListener('change',update);controls.forEach(c=>c.check.addEventListener('change',update));update();section.append(apply);
      apply.addEventListener('click',async()=>{const selected=controls.filter(c=>c.check.checked&&!c.check.disabled),payload={component_id:component.id,candidate_id:record.id,revision:preview.revision,preview_token:preview.token,keys:selected.map(c=>c.field.key),replace_catalog_keys:selected.filter(c=>['different','same'].includes(c.field.state)).map(c=>c.field.key),confirm_identity:confirm.checked,use_datasheet:sheet.checked&&!sheet.disabled,use_manufacturer:maker.checked&&!maker.disabled};
        const inputs=[...node.querySelectorAll('input,button')],states=inputs.map(x=>x.disabled);inputs.forEach(x=>x.disabled=true);const finish=progress.start(t('caption.827d4a79ebc1'));
        try{const result=await request('/api/manufacturer-parameters/apply',payload);onSaved(result.component);node.close();}
        catch(error){showError(status,error);status.className='notice';}
        finally{inputs.forEach((x,i)=>x.disabled=states[i]);finish();}
      });
      const audit=el('details');audit.append(el('summary',t('caption.842c95dc4ef5')),el('p',record.source.review_method),el('p',record.source.sha256?'PDF-SHA256: '+record.source.sha256:t('caption.56da88ac826f')));section.append(audit);
    }
  }catch(error){showError(status,error);status.className='notice';}finally{done();}
}

export async function manufacturerLibraryDialog(rows,onChoose,label){
  const {node}=dialog(t('caption.0a28c1cddb72')+label),progress=createProgress(node),done=progress.start(t('caption.88c22d4b5182'));
  try{const library=await request('/api/manufacturer-parameters');node.append(el('p',t('caption.26e547eb33d0')+library.version+t('caption.aeba8be42f9f')));
    let count=0;for(const record of library.components){const matches=rows.filter(c=>manufacturerMatch(c,record));if(!matches.length)continue;count+=matches.length;
      const section=el('section');section.className='proposal';section.append(el('h3',record.mpn+' · '+record.publisher+' · '+record.package),el('p',record.parameter_count+t('caption.ede87d9879a0')),link(record.source.url,t('caption.79a7fa90c8ab')));for(const c of matches){const open=el('button',t('caption.b6975ccfa77c')+(c.symbol||c.name));open.addEventListener('click',()=>{node.close();onChoose(c);});section.append(open);}node.append(section);
    }if(!count)node.append(el('p',t('caption.493b38f9d449')));
  }catch(error){const message=el('div');showError(message,error);node.append(message);}finally{done();}
}
