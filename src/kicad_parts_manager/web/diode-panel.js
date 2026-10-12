import {apiError,showError,t,locale,fieldLabel,conditionLabel} from './i18n.js';
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
const current=value=>value==null?t('caption.500af0d48759'):(value*1e6).toLocaleString(locale(),{maximumSignificantDigits:5})+' µA';
// Symbol identity is independent of the chosen model pin mapping.
export function diodeSymbolRoles(pins){
  const aliases={A:'A',ANODE:'A',K:'K',CATHODE:'K',KATHODE:'K'};
  const groups={A:[],K:[]};
  for(const pin of pins){const name=String(pin.name||'').trim().toUpperCase();const role=aliases[name]||((!name||name==='~')?aliases[String(pin.number).trim().toUpperCase()]:null);if(role)groups[role].push(pin.number);}
  return pins.length===2&&groups.A.length===1&&groups.K.length===1&&groups.A[0]!==groups.K[0]?{A:groups.A[0],K:groups.K[0]}:null;
}
export function diodePanel(model,pins,component,readMapping,startWork,onChanged,sharedChoices=null){
  if(model.type!=='D'||pins.length!==2)return null;
  const node=el('section');node.className='enrichment-guide';node.append(el('h3',t('caption.455803bb379f')));
  const identified=diodeSymbolRoles(pins);const identification=el('p');node.append(identification);
  const choices=sharedChoices||{};
  if(!sharedChoices)for(const [role,label] of [['A',t('caption.8ef9f60fe41c')],['K',t('caption.39628096e58f')]]){
    const select=el('select');select.setAttribute('aria-label',label);const blank=el('option',t('caption.65e454a59d11'));blank.value='';select.append(blank);
    for(const pin of pins){const option=el('option','Pin '+pin.number+(pin.name&&pin.name!=='~'?' · '+pin.name:t('caption.b5d932d7c5b8')));option.value=pin.number;select.append(option);}
    if(identified)select.value=identified[role];
    const wrap=el('label',label+' ');wrap.append(select);node.append(wrap);choices[role]=select;
  }
  const confirm=el('input');confirm.type='checkbox';confirm.setAttribute('aria-label',t('caption.978b221501dc'));const label=el('label');label.append(confirm,el('span',t('caption.15001c2e4618')));node.append(label);
  const button=el('button',t('caption.2dcb9c89afa0'));button.type='button';node.append(button);
  node.append(el('p',t('caption.1c14aebc0662'),'hint'));
  node.append(el('p',t('caption.f3df740d5eb1'),'hint'));
  const summary=el('div');summary.className='test-summary';summary.hidden=true;summary.setAttribute('role','status');node.append(summary);
  const technical=el('details'),log=el('pre');log.className='model-report';technical.append(el('summary',t('caption.d6509255955f')),log);technical.hidden=true;node.append(technical);
  const automatic=()=>identified&&choices.A.value===identified.A&&choices.K.value===identified.K;
  const roles=()=>automatic()?{...identified}:confirm.checked&&choices.A.value&&choices.K.value&&choices.A.value!==choices.K.value?{A:choices.A.value,K:choices.K.value}:null;
  const refresh=()=>{label.hidden=Boolean(automatic());identification.textContent=automatic()?t('sim.recognized',{a:identified.A,k:identified.K}):t(sharedChoices?'sim.confirmAtSymbol':'caption.73bc7bfa367b');button.disabled=!roles()||readMapping().some(p=>!p);};
  const invalidate=()=>{if(!summary.hidden){summary.className='test-summary test-partial';summary.textContent=t('caption.87e63fce5b12');}technical.hidden=true;refresh();};
  for(const select of Object.values(choices))select.addEventListener('change',()=>{confirm.checked=false;invalidate();onChanged();});
  confirm.addEventListener('change',()=>{invalidate();onChanged();});
  button.addEventListener('click',async()=>{
    const selected=roles();if(!selected)return;const finish=startWork(t('caption.415df081a38a'));technical.hidden=true;summary.hidden=true;
    try{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const response=await fetch('/api/models/test-diode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({component_id:component.id,model_id:model.id,pins:readMapping(),roles:selected,confirmed:true,symbol_sha256:component.symbol_sha256||null,symbol_reference:component.symbol_reference||component.symbol||null})}),result=await response.json();
      if(!response.ok)throw apiError(result);
      summary.className='test-summary '+(result.ok?'test-partial':'test-error');summary.replaceChildren(el('strong',result.ok?t('caption.1941d401b1b6'):t('caption.a7727ea48ae6')),
        el('p',t('caption.ef0bb9366454')+current(result.forward_current)+' · '+(result.forward_pass?t('caption.1ddc43a84b0b'):t('caption.7fcbc27f985d'))),
        el('p',t('caption.13c70c59f9aa')+current(result.reverse_current==null?null:Math.abs(result.reverse_current))),
        el('p',t('sim.directionCriterion')+' '+(result.reverse_pass?t('caption.1ddc43a84b0b'):t('caption.7fcbc27f985d'))),
        el('p',result.calculated?(result.ok?t('caption.8942663ad673'):t('caption.4f4daec7dd80')):t('caption.bda179fcb744')),
        el('p',t('caption.d0d429bb706a')));
      summary.hidden=false;log.textContent=result.note+'\n'+result.log;technical.hidden=false;
    }catch(error){summary.className='test-summary test-error';showError(summary,error);summary.hidden=false;}
    finally{finish();refresh();}
  });refresh();return {node,roles,refresh,invalidate,mappingChanged(){confirm.checked=false;invalidate();}};
}
