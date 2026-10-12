import {t,language,apiError,showError} from './i18n.js';

async function scanLibraries(body,onProgress){
  const {requestWithProgress}=await import('./model-wizard.js');
  return requestWithProgress('/api/setup/scan',body,onProgress);
}

export function initFirstRun(document,{fetchData=globalThis.fetch,runScan=scanLibraries}={}){
  const panel=document.getElementById('first-run');
  if(!panel)return {ready:Promise.resolve()};
  const get=id=>document.getElementById('setup-'+id),tr=(key,vars={})=>t('setup.'+key,vars,language(document));
  const form=get('form'),select=get('version'),share=get('share'),config=get('config'),status=get('status'),start=get('start'),cancel=get('cancel'),refresh=get('refresh'),progress=get('progress'),result=get('result');
  let installations=[],busy=false,lastResult=null,lastProgress=null,loading=false;
  function paint(){
    get('found').textContent=tr(lastResult?'ready':busy?'working':installations.length?'found':'missing');
    get('tables').hidden=lastResult?lastResult.tables_ready:(!installations.length||installations[Number(select.value)]?.tables_ready===true);
    if(lastResult)status.textContent=tr('done',{symbols:lastResult.counts.symbols,footprints:lastResult.counts.footprints,warnings:lastResult.warnings});
    else if(lastProgress){
      const phase=t('progress.phase.'+lastProgress.phase,{},language(document),tr('reading'));
      status.textContent=lastProgress.total?`${phase} (${lastProgress.completed} / ${lastProgress.total})`:phase;
    }
  }
  function controls(){
    for(const field of [select,share,config,start,refresh])field.disabled=busy||loading;
    start.disabled=busy||loading||!share.value.trim()||!config.value.trim();
    cancel.hidden=!busy;progress.hidden=!busy;panel.setAttribute('aria-busy',String(busy));
  }
  function chosen(){const choice=installations[Number(select.value)];if(select.value!==''&&choice){share.value=choice.share;config.value=choice.config;}paint();controls();}
  async function discover(){
    if(busy||loading)return;loading=true;controls();
    try{
      const response=await fetchData('/api/setup'),data=await response.json();if(!response.ok)throw apiError(data);
      panel.hidden=!data.required;if(!data.required)return;
      installations=data.installations||[];select.replaceChildren();
      for(const [index,item] of installations.entries()){const option=document.createElement('option');option.value=String(index);option.textContent=`KiCad ${item.version} — ${item.share}`;select.append(option);}
      const other=document.createElement('option');other.value='';other.textContent=tr('manual');select.append(other);
      select.value=installations.length?'0':'';get('paths').open=!installations.length;chosen();
    }catch(error){panel.hidden=false;showError(status,error);}
    finally{loading=false;controls();}
  }
  select.addEventListener('change',()=>{chosen();if(select.value==='')get('paths').open=true;});
  share.addEventListener('input',controls);config.addEventListener('input',controls);refresh.addEventListener('click',discover);
  cancel.addEventListener('click',async()=>{
    if(!busy)return;cancel.disabled=true;
    try{const response=await fetchData('/api/inventory/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw apiError(await response.json());status.textContent=t('progress.cancelling',{},language(document));}
    catch(error){showError(status,error);cancel.disabled=false;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||start.disabled)return;
    busy=true;lastProgress={phase:'discover'};lastResult=null;cancel.disabled=false;controls();paint();
    try{
      lastResult=await runScan({share:share.value.trim(),config:config.value.trim()},update=>{lastProgress=update;paint();});
      const warnings=get('warning-list');warnings.replaceChildren();
      for(const warning of lastResult.warning_details||[]){const item=document.createElement('li');item.textContent=warning;warnings.append(item);}
      get('warnings').hidden=!warnings.childElementCount;
      form.hidden=true;result.hidden=false;lastProgress=null;paint();get('catalog').focus();
    }catch(error){lastProgress=null;if(error.code==='scan_cancelled')status.textContent=t('progress.cancelled',{},language(document));else showError(status,error);}
    finally{busy=false;controls();paint();}
  });
  document.getElementById('language-select')?.addEventListener('change',()=>{paint();if(select.lastChild)select.lastChild.textContent=tr('manual');});
  return {ready:discover()};
}
if(typeof document!=='undefined'&&document.getElementById('first-run'))initFirstRun(document);
