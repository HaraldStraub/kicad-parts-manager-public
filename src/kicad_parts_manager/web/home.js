import {initLanguage,initSupport,t,locale,language} from './i18n.js';
export function countLabel(value,document){return Number.isSafeInteger(value)&&value>=0?value.toLocaleString(locale(document)):'—';}

export function paintOverview(document,data){
  for(const [id,value] of [['stat-symbols',data.inventory?.counts?.symbols],['stat-footprints',data.inventory?.counts?.footprints],['stat-models',data.models?.indexed],['stat-facts',data.local_data?.manufacturer_parameters]])document.getElementById(id).textContent=countLabel(value,document);
  const scanned=data.inventory?.scanned_at,date=scanned?new Date(scanned):null;
  document.getElementById('home-status').textContent=date&&!Number.isNaN(date.valueOf())?t('home.status.scan',{date:date.toLocaleString(locale(document))},language(document)):t('home.status.noScan',{},language(document));
  const versions=[];if(data.kicad?.version)versions.push('KiCad '+data.kicad.version);if(data.ngspice?.version)versions.push('ngspice '+data.ngspice.version);
  document.getElementById('home-versions').textContent=versions.join(' / ');
  document.getElementById('home-program-paths').textContent=[data.kicad?.path,data.ngspice?.path].filter(Boolean).join(' · ');
  document.getElementById('home-app-version').textContent=data.application_version?t('home.status.version',{version:data.application_version},language(document)):t('home.status.local',{},language(document));
}

export function initLanding(document,{fetchData=globalThis.fetch,storage}={}){
  initSupport(document);
  const theme=document.getElementById('home-theme'),stats=document.getElementById('home-stats'),refresh=document.getElementById('home-refresh'),status=document.getElementById('home-status'),progress=document.getElementById('home-progress');
  if(storage===undefined)try{storage=globalThis.localStorage;}catch{storage=null;}
  const statistics=initStatistics(document,fetchData);
  let pending=false,loaded=false,lastData=null,failed=false;
  const feedback=initFeedback(document,()=>lastData);
  initLanguage(document,{storage,onChange:()=>{feedback.repaint();statistics.repaint();setTheme(document.body.classList.contains("light"));if(lastData)paintOverview(document,lastData);else status.textContent=t("home.status.loading",{},language(document));if(failed)status.textContent=t(loaded?"home.status.stale":"home.status.failed",{},language(document));else if(pending)status.textContent=t("home.status.loading",{},language(document));}});
  function setTheme(light){document.body.classList.toggle('light',light);theme.textContent=t(light?'theme.dark':'theme.light',{},language(document));theme.setAttribute('aria-pressed',String(light));}
  try{setTheme(storage?.getItem('kicad-parts-manager-theme')==='light');}catch{setTheme(false);}
  theme.addEventListener('click',()=>{const light=!document.body.classList.contains('light');setTheme(light);try{storage?.setItem('kicad-parts-manager-theme',light?'light':'dark');}catch{}});
  async function load(){
    if(pending)return;pending=true;refresh.disabled=true;progress.hidden=false;stats.setAttribute('aria-busy','true');failed=false;status.classList.remove('error');status.textContent=t('home.status.loading',{},language(document));
    try{const response=await fetchData('/api/about'),data=await response.json();if(!response.ok)throw Error(data.error||'Datenstand nicht verfügbar.');lastData=data;paintOverview(document,data);loaded=true;stats.classList.remove('stale');}
    catch{failed=true;stats.classList.toggle('stale',loaded);status.classList.add('error');status.textContent=t(loaded?'home.status.stale':'home.status.failed',{},language(document));}
    finally{pending=false;refresh.disabled=false;progress.hidden=true;stats.setAttribute('aria-busy','false');feedback.repaint();}
  }
  const program=document.getElementById('program-description'),open=document.getElementById('home-program-open');
  open.addEventListener('click',()=>program.showModal());
  document.getElementById('home-program-close').addEventListener('click',()=>program.close());
  program.addEventListener('close',()=>open.focus());
  if(new URLSearchParams(document.defaultView.location.search).get('help')==='usage'){
    document.getElementById('data-usage').open=true;program.showModal();
  }
  if(new URLSearchParams(document.defaultView.location.search).get('feedback')==='1')feedback.open();
  refresh.addEventListener('click',load);
  return {ready:load(),reload:load};
}

export function initFeedback(document,getData=()=>null){
  const dialog=document.getElementById('feedback-dialog'),opener=document.getElementById('feedback-open');
  const kind=document.getElementById('feedback-kind'),description=document.getElementById('feedback-description'),report=document.getElementById('feedback-report'),status=document.getElementById('feedback-status'),github=document.getElementById('feedback-github');
  // Set only when the approved public repository and templates are actually online.
  const published=document.documentElement.dataset.feedbackPublished==='true';
  const translate=key=>t('feedback.'+key,{},language(document));
  function repaint(){
    const data=getData()||{},unknown=translate('unknown');
    report.value=[`KiCad Parts Manager: ${data.application_version||unknown}`,`KiCad: ${data.kicad?.version||unknown}`,`ngspice: ${data.ngspice?.version||unknown}`,'',translate(kind.value==='bug'?'bug':'idea'),'',translate('steps')+':',description.value,'',translate('expected')+':','',translate('actual')+':'].join('\n');
    github.disabled=!published;document.getElementById('feedback-pending').hidden=published;
  }
  function open(){status.textContent='';repaint();dialog.showModal();description.focus();}
  opener.addEventListener('click',open);kind.addEventListener('change',()=>{status.textContent='';repaint();});description.addEventListener('input',()=>{status.textContent='';repaint();});
  document.getElementById('feedback-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener.focus());
  document.getElementById('feedback-copy').addEventListener('click',async()=>{
    repaint();try{await document.defaultView.navigator.clipboard.writeText(report.value);status.textContent=translate('copied');}catch{report.focus();report.select();status.textContent=translate('manual');}
  });
  github.addEventListener('click',()=>{
    if(!published)return;repaint();
    const url=new URL('https://github.com/HaraldStraub/kicad-parts-manager-public/issues/new');
    url.search=new URLSearchParams({template:kind.value==='bug'?'bug_report.md':'feature_request.md',title:translate(kind.value==='bug'?'bug':'idea'),body:report.value}).toString();
    document.defaultView.open(url.href,'_blank','noopener,noreferrer');
  });
  repaint();return {repaint,open};
}

export function initStatistics(document,fetchData){
  const dialog=document.getElementById('category-statistics'),open=document.getElementById('home-statistics-open'),refresh=document.getElementById('statistics-refresh'),status=document.getElementById('statistics-status'),progress=document.getElementById('statistics-progress');
  const search=document.createElement('input');search.type='search';search.id='statistics-search';search.dataset.i18nPlaceholder='statistics.search';search.dataset.i18nLabel='statistics.search';dialog.querySelector('.statistics-actions').prepend(search);search.addEventListener('input',()=>repaint());
  let data=null,pending=false,failed=false,sort='path',ascending=true;
  const keys=['path','total','symbol','footprint','model3d','simulation','values'];
  const text=(tag,value)=>{const node=document.createElement(tag);node.textContent=value;return node;};
  const translate=(key,variables={})=>t(key,variables,language(document));
  const pathLabel=path=>path.replace('transistor/mosfet','transistor/fet/mosfet').split('/').map(part=>t('statistics.category.'+part,{},language(document),part.replaceAll('_',' '))).join(' / ');
  function repaint(){
    const head=document.getElementById('statistics-head'),body=document.getElementById('statistics-body');head.replaceChildren();body.replaceChildren();
    const titles=text('tr','');
    for(const key of keys){const cell=text('th',''),button=text('button',translate('statistics.column.'+key)+(sort===key?(ascending?' ▲':' ▼'):''));button.type='button';cell.setAttribute('scope','col');if(sort===key)cell.setAttribute('aria-sort',ascending?'ascending':'descending');button.addEventListener('click',()=>{ascending=sort===key?!ascending:key==='path';sort=key;repaint();});cell.append(button);titles.append(cell);}head.append(titles);
    const order=new Intl.Collator(locale(document),{numeric:true,sensitivity:'base'});
    search.placeholder=translate('statistics.search');search.setAttribute('aria-label',translate('statistics.search'));
    const query=search.value.trim().toLocaleLowerCase(locale(document));
    for(const group of [...(data?.categories||[])].filter(group=>!query||pathLabel(group.path).toLocaleLowerCase(locale(document)).includes(query)).sort((a,b)=>((sort==='path'?order.compare(pathLabel(a.path),pathLabel(b.path)):a[sort]-b[sort])*(ascending?1:-1))||order.compare(a.path,b.path))){
      const row=text('tr','');row.append(text('th',pathLabel(group.path)));row.firstChild.setAttribute('scope','row');
      for(const key of keys.slice(1)){const value=group[key]||0;row.append(text('td',key==='total'?countLabel(value,document):`${countLabel(value,document)} (${Math.round(value/group.total*100)}%)`));}body.append(row);
    }
    status.textContent=pending?translate('statistics.loading'):failed?translate(data?'statistics.stale':'statistics.failed'):data?translate('statistics.summary',{total:countLabel(data.total,document),categories:countLabel(data.categories.length,document)}):'';
    status.classList.toggle('error',failed);body.parentElement.setAttribute('aria-busy',String(pending));
  }
  async function load(){
    if(pending)return;pending=true;failed=false;refresh.disabled=true;progress.hidden=false;repaint();
    try{const response=await fetchData('/api/statistics'),result=await response.json();if(!response.ok||!Array.isArray(result.categories))throw Error('statistics unavailable');data=result;}
    catch{failed=true;}
    finally{pending=false;refresh.disabled=false;progress.hidden=true;repaint();}
  }
  open.addEventListener('click',()=>{dialog.showModal();load();});refresh.addEventListener('click',load);
  document.getElementById('statistics-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>open.focus());
  return {repaint,load};
}

if(typeof document!=='undefined'&&document.getElementById('home-page'))initLanding(document);
