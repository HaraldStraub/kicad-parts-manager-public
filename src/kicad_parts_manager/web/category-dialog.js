import {decorateClose} from './model-wizard.js';
import {t,apiError,showError} from './i18n.js';
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
export async function categoryRequest(items){
 const response=await fetch('/api/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
 const data=await response.json();if(!response.ok)throw apiError(data);return data.changes;
}
export async function categoryDialog(rows,label,onSaved){
 const dialog=el('dialog');dialog.className='category-dialog';dialog.setAttribute('aria-label',t('category.change'));
 const close=decorateClose(el('button'));close.addEventListener('click',()=>dialog.close());dialog.append(close,el('h2',t('category.change')));
 dialog.append(el('p',t('category.selection',{count:rows.length})),el('p',t('category.preserve')));
 const search=el('input');search.type='search';search.placeholder=t('category.find');search.setAttribute('aria-label',t('category.find'));
 const select=el('select');select.size=8;select.setAttribute('aria-label',t('category.target'));
 const status=el('p');status.setAttribute('role','status');
 const automatic=el('button',t('category.automatic')),save=el('button',t('category.apply'));save.disabled=true;
 const actions=el('div');actions.className='dialog-actions';actions.append(automatic,save);dialog.append(search,select,status,actions);
 document.body.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove());
 let options=[];
 const filter=()=>{const current=select.value;select.replaceChildren();const query=search.value.trim().toLowerCase();for(const option of options.filter(o=>o.label.toLowerCase().includes(query))){const node=el('option',option.label);node.value=option.path;select.append(node);}if([...select.options].some(o=>o.value===current))select.value=current;save.disabled=!select.value;};
 search.addEventListener('input',filter);select.addEventListener('change',()=>{save.disabled=!select.value;});
 const commit=async target=>{
  save.disabled=true;automatic.disabled=true;close.disabled=true;status.textContent=t('category.saving');
  try{const changes=await categoryRequest(rows.map(c=>({component_id:c.id,revision:c.category_revision||0,category:target})));onSaved(changes);dialog.close();}
  catch(error){showError(status,error);}finally{save.disabled=!select.value;automatic.disabled=false;close.disabled=false;}
 };
 save.addEventListener('click',()=>commit(select.value));automatic.addEventListener('click',()=>commit(null));
 try{const response=await fetch('/api/categories');const data=await response.json();if(!response.ok)throw apiError(data);options=[...new Map(data.categories.map(path=>[label(path),{path,label:label(path)}])).values()].sort((a,b)=>a.label.localeCompare(b.label));filter();if(rows.every(c=>c.category===rows[0].category)){const current=options.find(o=>o.label===label(rows[0].category));if(current)select.value=current.path;}save.disabled=!select.value;}
 catch(error){showError(status,error);automatic.disabled=true;}
}
