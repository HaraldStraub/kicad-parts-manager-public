import {initLanguage,t} from './i18n.js';
initLanguage(document);
try{document.body.classList.toggle('light',localStorage.getItem('kicad-parts-manager-theme')==='light');}catch{}
const status=document.getElementById('startup-status'),help=document.getElementById('startup-help'),progress=document.getElementById('startup-progress');
async function poll(){
  try{
    const response=await fetch('/api/startup',{cache:'no-store',signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('startup');
    const state=await response.json();
    if(state.ready){location.reload();return;}
    if(state.failed){document.body.classList.add('failed');status.textContent=t('startup.failed');help.textContent=t('startup.failureHelp');progress.hidden=true;return;}
    status.textContent=t('startup.catalog');
    document.getElementById('startup-time').textContent=t('startup.elapsed',{seconds:state.elapsed});
  }catch{status.textContent=t('startup.connection');}
  setTimeout(poll,1000);
}
poll();
