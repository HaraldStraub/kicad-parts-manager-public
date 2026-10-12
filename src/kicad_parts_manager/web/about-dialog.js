import {createProgress,decorateClose,requestWithProgress,reportProgress} from './model-wizard.js';
import {apiError,showError,t,locale,fieldLabel,conditionLabel} from './i18n.js';
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
export async function aboutDialog(onRescanned=()=>{}){
  const dialog=el('dialog');dialog.className='manual-editor about-dialog';dialog.setAttribute('aria-label',t('catalog.about'));
  dialog.append(el('h2',t('catalog.about')));const close=decorateClose(el('button'));close.addEventListener('click',()=>dialog.close());dialog.append(close);
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  const progress=createProgress(dialog),done=progress.start(t('caption.b9035e3d4c24'));
  const usage=el('details');usage.id='data-usage';usage.append(el('summary',t('usage.title')));
  for(const key of ['data','check','sim','rights'])usage.append(el('p',t('usage.'+key)));
  dialog.append(usage);
  try{
    const response=await fetch('/api/about'),data=await response.json();if(!response.ok)throw apiError(data);
    const list=el('dl'),program=p=>p.version||(p.available?t('caption.900caafd47cd'):t('caption.621ca4c037d3')),date=value=>value?new Date(value).toLocaleString(locale()):t('caption.858cd90696e4');
    const facts=[[t('caption.239a8e5fafbe'),data.application_version+t('caption.2f14c7e8bc65')],['KiCad',program(data.kicad)],['ngspice',program(data.ngspice)],
      [t('caption.3f549d10257b'),date(data.inventory.scanned_at)],[t('caption.cc4fe50475cc'),data.inventory.counts.symbols??t('caption.f47d50ee1d19')],[t('caption.a1356b43505a'),data.inventory.counts.footprints??t('caption.f47d50ee1d19')],
      [t('caption.3f94a156152f'),data.manufacturer_pack.version+' · '+data.manufacturer_pack.records+t('caption.7d3b2c0b1633')+data.manufacturer_pack.parameters+t('caption.36c86987d713')],
      [t('caption.082ee2159e2b'),data.local_data.components+t('caption.656818d18081')+data.local_data.parameters+t('caption.49a991574827')],[t('caption.230318362ba8'),data.local_data.manufacturer_parameters],[t('caption.3682e32ab83a'),date(data.local_data.updated_at)],
      [t('caption.e45efcabe6c7'),data.models.indexed+t('caption.ca97561b874f')+data.models.assigned+t('caption.83041c7ebad9')]];
    const factValues=[];for(const [label,value] of facts){const valueNode=el('dd',value);factValues.push(valueNode);list.append(el('dt',label),valueNode);}dialog.append(list);
    dialog.append(el('p',t('caption.ee6f442cf1d8'),'hint'));
    dialog.append(el('p',t('caption.b17047479b08'),'notice'));
    const technical=el('details');technical.append(el('summary',t('caption.c97484ef9de8')));const details=el('dl');
    for(const [label,value] of [['Server',location.origin],['API-Version',data.catalog_api_version],['Python',data.python_version],[t('caption.8407d22681d4'),data.kicad.path],[t('caption.f5d884957a3c'),data.ngspice.path],...Object.entries(data.paths)])if(value!=null)details.append(el('dt',label),el('dd',value));
    technical.append(details);dialog.append(technical);
    if(data.inventory_scan_available){
      const scan=el('button',t('progress.scanButton')),cancel=el('button',t('progress.cancel')),status=el('p');cancel.hidden=true;status.setAttribute('role','status');technical.append(scan,status);dialog.querySelector('.work-progress').insertBefore(cancel,dialog.querySelector('.progress-track'));
      async function cancelScan(){
        if(cancel.disabled||!scan.disabled)return;cancel.disabled=true;status.textContent=t('progress.cancelling');
        try{
          const response=await fetch('/api/inventory/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
          const data=await response.json();if(!response.ok)throw apiError(data);
        }catch(error){showError(status,error);cancel.disabled=false;}
      }
      cancel.addEventListener('click',cancelScan);
      scan.addEventListener('click',async()=>{
        if(scan.disabled)return;scan.disabled=true;close.disabled=true;cancel.hidden=false;cancel.disabled=false;
        const finish=progress.start(t('progress.phase.discover'));
        try{
          const result=await requestWithProgress('/api/inventory/scan',{},update=>reportProgress(finish,update));
          status.textContent=t('progress.scanDone',{symbols:result.counts.symbols.toLocaleString(locale()),footprints:result.counts.footprints.toLocaleString(locale()),warnings:result.warnings});
          factValues[3].textContent=date(result.scanned_at);factValues[4].textContent=result.counts.symbols;factValues[5].textContent=result.counts.footprints;
          cancel.hidden=true;cancel.disabled=true;close.disabled=false;
          finish.update(t('progress.reloadCatalog'));
          await onRescanned();
        }catch(error){if(error.code==='scan_cancelled')status.textContent=t('progress.cancelled');else showError(status,error);}
        finally{finish();scan.disabled=false;close.disabled=false;cancel.hidden=true;}
      });
      dialog.addEventListener('cancel',event=>{if(scan.disabled){event.preventDefault();cancelScan();}});
    }
  }catch(error){const message=el('div');showError(message,error);message.className='notice';dialog.append(message);}finally{done();}
}
