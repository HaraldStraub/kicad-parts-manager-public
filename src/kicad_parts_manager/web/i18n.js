import {texts} from './ui-texts.js';

export const LANGUAGE_KEY = 'kicad-parts-manager-language';

export function apiError(payload={}) {
  const code=typeof payload.code==='string'?payload.code:'request_failed';
  const error=Error(t('error.'+code,{},undefined,t('error.request_failed')));
  error.code=code;error.api=true;error.details=String(payload.details??payload.error??'');
  return error;
}

export function showError(container,error) {
  container.replaceChildren();
  const doc=container.ownerDocument;
  const message=doc.createElement('span');
  message.textContent=error.api?t('error.'+error.code,{},undefined,t('error.request_failed')):error instanceof TypeError?t('error.network'):error.message;
  container.append(message);
  if(error.api&&error.details){
    const details=doc.createElement('details'),summary=doc.createElement('summary'),text=doc.createElement('pre');
    summary.textContent=t('error.details');text.textContent=error.details;
    text.style.whiteSpace='pre-wrap';text.style.overflowWrap='anywhere';
    details.append(summary,text);container.append(details);
  }
}

export function language(document = globalThis.document) {
  return document?.documentElement?.lang === 'de' ? 'de' : 'en';
}

export function locale(document = globalThis.document) {
  return language(document) === 'en' ? 'en-GB' : 'de-DE';
}

export function t(key, variables = {}, lang = language(), fallback) {
  const lookup = catalog => catalog && Object.hasOwn(catalog, key) ? catalog[key] : undefined;
  const template = lookup(texts[lang]) ?? lookup(texts.de) ?? fallback ?? key;
  return template.replace(/\{([a-zA-Z_][a-zA-Z_0-9]*)\}/g, (match, name) =>
    Object.hasOwn(variables, name) ? String(variables[name]) : match);
}

export function translateDocument(document) {
  const lang = language(document);
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n, {}, lang);
  }
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder, {}, lang));
  }
  for (const node of document.querySelectorAll('[data-i18n-label]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nLabel, {}, lang));
  }
  const title = document.documentElement.dataset.i18nTitle;
  if (title) document.title = t(title, {}, lang);
  const note = document.getElementById('language-notice');
  if (note) {
    note.textContent = t('language.partial', {}, lang);
    note.hidden = true;
  }
}

export function initLanguage(document, {storage, onChange = () => {}} = {}) {
  if (storage === undefined) {
    try { storage = document.defaultView?.localStorage; } catch { storage = null; }
  }
  migrateLegacySettings(storage);
  const select = document.getElementById('language-select');
  let saved;
  try { saved = storage?.getItem(LANGUAGE_KEY); } catch {}
  document.documentElement.lang = saved === 'de' ? 'de' : 'en';
  translateDocument(document);
  if (select) {
    select.value = language(document);
    select.addEventListener('change', () => {
      const lang = select.value === 'en' ? 'en' : 'de';
      document.documentElement.lang = lang;
      try { storage?.setItem(LANGUAGE_KEY, lang); } catch {}
      translateDocument(document);
      onChange(lang);
    });
  }
  return {language: () => language(document)};
}

export const fieldLabel=(key,fallback=key)=>t("parameter."+key,{},undefined,fallback);
export const conditionLabel=(key,fallback=key)=>t("condition."+key,{},undefined,fallback);
export const kindLabel=key=>t('kind.'+(key||'unspecified'),{},undefined,t('kind.unspecified'));
export const originLabel=key=>t('origin.'+(key||'unknown'),{},undefined,t('origin.unknown'));
export function evidenceSummary(evidence={},definition){
  const fields=definition?.[4]?.conditions||[],conditions=evidence.conditions_data||{};
  const measured=fields.filter(f=>conditions[f.key]!=null).map(f=>conditionLabel(f.key,f.label)+': '+(typeof conditions[f.key]==='number'?conditions[f.key].toLocaleString(locale()):String(conditions[f.key]))+(f.unit?' '+f.unit:''));
  const missing=fields.filter(f=>conditions[f.key]==null).map(f=>conditionLabel(f.key,f.label));
  return [t('quality.description',{origin:originLabel(evidence.sourceType||evidence.source_type),kind:kindLabel(evidence.kind)}),
    t('quality.sourceLine',{source:evidence.source||t('quality.noSource')}),
    t('quality.conditionsLine',{conditions:[evidence.conditions,...measured,missing.length?t('quality.missing',{fields:missing.join(', ')}):null].filter(Boolean).join('; ')||t('quality.noConditions')})].join('\n');
}


// Shared optional-support dialog: opening it never navigates to PayPal.
export function initSupport(document){
  const opener=document.querySelector('.donate-button');
  if(!opener||opener.dataset.supportReady)return;
  opener.dataset.supportReady='true';
  let dialog;
  opener.addEventListener('click',event=>{
    event.preventDefault();
    if(!dialog){
      dialog=document.createElement('dialog');dialog.className='support-dialog';dialog.id='support-dialog';dialog.setAttribute('aria-labelledby','support-title');
      const heading=document.createElement('h2');heading.id='support-title';heading.dataset.i18n='donate.title';
      const close=document.createElement('button');close.type='button';close.className='dialog-close';close.textContent='×';close.dataset.i18nLabel='common.close';close.addEventListener('click',()=>dialog.close());
      dialog.append(heading,close);
      for(const key of ['donate.intro','donate.message','donate.welcome']){const paragraph=document.createElement('p');paragraph.dataset.i18n=key;dialog.append(paragraph);}
      const actions=document.createElement('div');actions.className='support-actions';
      const paypal=document.createElement('a');paypal.href='https://paypal.me/HaraldStraub70';paypal.target='_blank';paypal.rel='noopener noreferrer';paypal.className='support-paypal';paypal.dataset.i18n='donate.paypal';
      const later=document.createElement('button');later.type='button';later.dataset.i18n='donate.later';later.addEventListener('click',()=>dialog.close());actions.append(paypal,later);dialog.append(actions);
      const note=document.createElement('p');note.className='hint';note.dataset.i18n='donate.note';dialog.append(note);
      document.body.append(dialog);dialog.addEventListener('close',()=>opener.focus());
    }
    translateDocument(document);dialog.showModal();
  });
}


// Keep existing language, theme, columns and saved search profiles on upgrade.
export function migrateLegacySettings(storage){
  try{
    if(!storage)return;
    const keys=Array.from({length:storage.length||0},(_,i)=>storage.key(i));
    // Minimal storage adapters still support the language and theme fallback.
    for(const old of [...keys,'componentdb-language','componentdb-theme']){
      if(!old?.startsWith('componentdb'))continue;
      const key='kicad-parts-manager'+old.slice('componentdb'.length);
      if(storage.getItem(key)==null&&storage.getItem(old)!=null)storage.setItem(key,storage.getItem(old));
    }
  }catch{} // Unavailable/blocked storage must not prevent use of the app.
}
