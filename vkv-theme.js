/* VKVTT selectable presentation theme controller. No operational data is touched. */
(function(){
  'use strict';
  const KEY='vkvtt-theme';
  const VALID=new Set(['black-gold','light']);
  const saved=(()=>{try{return localStorage.getItem(KEY)}catch(_){return null}})();
  let theme=VALID.has(saved)?saved:'black-gold';

  function ensureLightCss(doc=document){
    if(doc.getElementById('vkvLightThemeCss'))return;
    const l=doc.createElement('link');
    l.id='vkvLightThemeCss';l.rel='stylesheet';l.href='./vkv-light-screen.css?v=20260908-theme3';
    doc.head.appendChild(l);
  }
  function ensureThemeSafetyStyle(doc=document){
    if(doc.getElementById('vkvThemeSafetyStyle'))return;
    const st=doc.createElement('style');st.id='vkvThemeSafetyStyle';
    st.textContent=`
      html[data-vkv-theme="light"] body,html[data-vkv-theme="light"] body main,html[data-vkv-theme="light"] body section{color:#17364f!important}
      html[data-vkv-theme="light"] body .noticeTitle,html[data-vkv-theme="light"] body .section h2,html[data-vkv-theme="light"] body .panel h3,html[data-vkv-theme="light"] body .tile,html[data-vkv-theme="light"] body .tile *,html[data-vkv-theme="light"] body .card,html[data-vkv-theme="light"] body .card *,html[data-vkv-theme="light"] body .panel,html[data-vkv-theme="light"] body .panel *{color:#17364f!important}
      html[data-vkv-theme="light"] body .noticeBody,html[data-vkv-theme="light"] body .resultbox,html[data-vkv-theme="light"] body .resultbox *,html[data-vkv-theme="light"] body .tag,html[data-vkv-theme="light"] body .help,html[data-vkv-theme="light"] body .small,html[data-vkv-theme="light"] body .sub,html[data-vkv-theme="light"] body .subtitle{color:#526d7d!important}
      html[data-vkv-theme="light"] body .pill,html[data-vkv-theme="light"] body .badge,html[data-vkv-theme="light"] body .chip{color:#17364f!important;background:#edf5f9!important;border-color:#cbdce5!important}
      html[data-vkv-theme="light"] body a:not(.btn):not(.button){color:#155f8e!important}
      html[data-vkv-theme="light"] body input,html[data-vkv-theme="light"] body select,html[data-vkv-theme="light"] body textarea{background:#fff!important;color:#17364f!important;border-color:#c7d5de!important}
      html[data-vkv-theme="light"] #periodReminderControl #prNext .small,html[data-vkv-theme="light"] #periodReminderControl #prStatus{color:#526d7d!important}
      html[data-vkv-theme="black-gold"] body input,html[data-vkv-theme="black-gold"] body select,html[data-vkv-theme="black-gold"] body textarea{background:#161716!important;color:#f6f2e8!important;border-color:#514d41!important}
      @media print{html[data-vkv-theme="light"] body *,html[data-vkv-theme="black-gold"] body *{text-shadow:none!important}.vkv-screen-only,#vkvThemeSwitch,#vkvCampusHeaderImage{display:none!important}}
    `;
    doc.head.appendChild(st);
  }
  function installCampusHeader(doc=document){
    const page=(doc.location?.pathname||'').split('/').pop()||'index.html';
    if(!(page===''||/^index\.html?$/i.test(page)))return;
    const header=doc.querySelector('body>header');if(!header)return;
    if(!doc.getElementById('vkvCampusHeaderImage')){
      const img=doc.createElement('img');
      img.id='vkvCampusHeaderImage';img.className='vkv-screen-only';img.alt='VKV Nalbari campus';
      img.src='./vkv-campus-header.jpg?v=20260908-theme3';
      img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 48%;z-index:0;opacity:.86;pointer-events:none;';
      header.insertBefore(img,header.firstChild);
    }
    header.style.position='relative';header.style.overflow='hidden';
    let overlay=doc.getElementById('vkvCampusHeaderOverlay');
    if(!overlay){overlay=doc.createElement('div');overlay.id='vkvCampusHeaderOverlay';overlay.className='vkv-screen-only';overlay.style.cssText='position:absolute;inset:0;z-index:0;pointer-events:none;';header.insertBefore(overlay,header.children[1]||null)}
    overlay.style.background=theme==='light'?'linear-gradient(90deg,rgba(19,76,111,.55),rgba(27,98,139,.32),rgba(12,42,61,.18))':'linear-gradient(90deg,rgba(5,6,6,.66),rgba(7,8,8,.42),rgba(7,8,8,.25),rgba(10,9,5,.38))';
    [...header.children].forEach(el=>{if(el.id!=='vkvCampusHeaderImage'&&el.id!=='vkvCampusHeaderOverlay'){el.style.position=el.style.position||'relative';el.style.zIndex='1'}});
  }
  async function ensureUniversalNavigationCoverage(){
    if(!('serviceWorker' in navigator)||location.protocol==='file:')return;
    try{await navigator.serviceWorker.register('./sw.js?v=20260908-theme3',{scope:'./'});}catch(e){console.info('[VKVTT theme] service worker registration skipped:',e?.message||e)}
  }
  function apply(next,doc=document){
    if(!VALID.has(next))next='black-gold';
    theme=next;
    ensureLightCss(doc);ensureThemeSafetyStyle(doc);
    doc.documentElement.dataset.vkvTheme=next;
    try{localStorage.setItem(KEY,next)}catch(_){}
    if(doc===document){
      installCampusHeader(doc);
      document.querySelectorAll('[data-vkv-theme-choice]').forEach(b=>{const on=b.dataset.vkvThemeChoice===next;b.setAttribute('aria-pressed',on?'true':'false')});
      window.dispatchEvent(new CustomEvent('vkv-theme-change',{detail:{theme:next}}));
    }
  }
  function mount(){
    installCampusHeader();
    if(!document.getElementById('vkvThemeSwitch')){
      const box=document.createElement('div');box.id='vkvThemeSwitch';box.className='vkv-screen-only';box.setAttribute('aria-label','Appearance');
      box.innerHTML='<span>Appearance</span><button type="button" data-vkv-theme-choice="light">☀ Light</button><button type="button" data-vkv-theme-choice="black-gold">● Black & Gold</button>';
      const st=document.createElement('style');
      st.textContent='#vkvThemeSwitch{display:inline-flex;align-items:center;gap:5px;padding:4px;border:1px solid #5b5130;border-radius:12px;background:rgba(12,13,13,.88);font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#d9d3c4;white-space:nowrap;position:relative;z-index:20}#vkvThemeSwitch>span{padding:0 4px}#vkvThemeSwitch button{padding:6px 8px!important;border-radius:8px!important;font-size:12px!important;line-height:1!important;min-height:0!important}#vkvThemeSwitch button[aria-pressed="true"]{background:#f2c335!important;color:#17130b!important;border-color:#f2c335!important}@media(max-width:650px){#vkvThemeSwitch>span{display:none}#vkvThemeSwitch button{padding:6px!important}}@media print{#vkvThemeSwitch{display:none!important}}';
      document.head.appendChild(st);
      const host=document.querySelector('.account,.actions,.head,.bar')||document.body;host.appendChild(box);
      box.addEventListener('click',e=>{const b=e.target.closest('[data-vkv-theme-choice]');if(b)apply(b.dataset.vkvThemeChoice)});
    }
    apply(theme);ensureUniversalNavigationCoverage();
  }
  window.addEventListener('storage',e=>{if(e.key===KEY&&VALID.has(e.newValue))apply(e.newValue)});
  ensureLightCss();ensureThemeSafetyStyle();document.documentElement.dataset.vkvTheme=theme;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.VKVTheme={get:()=>theme,set:t=>apply(t),applyToDocument:(doc,t=theme)=>{ensureLightCss(doc);ensureThemeSafetyStyle(doc);doc.documentElement.dataset.vkvTheme=t;}};
})();
