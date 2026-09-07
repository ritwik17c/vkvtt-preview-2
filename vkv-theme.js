/* VKVTT global presentation theme controller. Operational data and print layouts are untouched. */
(function(){
  'use strict';
  if(window.__VKV_THEME_CONTROLLER__)return;
  window.__VKV_THEME_CONTROLLER__=true;
  const KEY='vkvtt-theme',VALID=new Set(['black-gold','light']);
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const EXEMPT=/^(admin-leave|admin-print-master|exam-timetable)\.html$/i.test(page);
  let theme=(()=>{try{const v=localStorage.getItem(KEY);return VALID.has(v)?v:'black-gold'}catch(_){return'black-gold'}})();

  function ensureCss(doc,id,href){
    let l=doc.getElementById(id);
    if(!l){l=doc.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;doc.head.appendChild(l)}
    return l;
  }
  function allThemeLinks(doc=document){
    const bg=ensureCss(doc,'vkvBlackGoldThemeCss','./vkv-black-gold-screen.css?v=20260908-theme4');
    const lt=ensureCss(doc,'vkvLightThemeCss','./vkv-light-screen.css?v=20260908-theme4');
    return{
      bg:[...new Set([bg,...doc.querySelectorAll('link[href*="vkv-black-gold-screen.css"]')])],
      lt:[...new Set([lt,...doc.querySelectorAll('link[href*="vkv-light-screen.css"]')])]
    };
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
      html[data-vkv-theme="black-gold"] body input,html[data-vkv-theme="black-gold"] body select,html[data-vkv-theme="black-gold"] body textarea{background:#161716!important;color:#f6f2e8!important;border-color:#514d41!important}
      html[data-vkv-theme="light"] #periodReminderControl #prNext .small,html[data-vkv-theme="light"] #periodReminderControl #prStatus{color:#526d7d!important}
      @media print{.vkv-screen-only,#vkvThemeSwitch,#vkvCampusHeaderImage,#vkvCampusHeaderOverlay{display:none!important}html[data-vkv-theme] body *{text-shadow:none!important}}
    `;doc.head.appendChild(st);
  }
  function installCampusHeader(doc=document){
    const p=(doc.location?.pathname||'').split('/').pop()||'index.html';
    if(!(p===''||/^index\.html?$/i.test(p)))return;
    const header=doc.querySelector('body>header');if(!header)return;
    header.style.position='relative';header.style.overflow='hidden';header.style.backgroundImage='none';
    let img=doc.getElementById('vkvCampusHeaderImage');
    if(!img){
      img=doc.createElement('img');img.id='vkvCampusHeaderImage';img.className='vkv-screen-only';img.alt='VKV Nalbari campus';
      img.src='./vkv-campus-header.jpg?v=20260908-theme4';
      img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 48%;z-index:0;opacity:.94;pointer-events:none;display:block;';
      header.insertBefore(img,header.firstChild);
    }
    let overlay=doc.getElementById('vkvCampusHeaderOverlay');
    if(!overlay){overlay=doc.createElement('div');overlay.id='vkvCampusHeaderOverlay';overlay.className='vkv-screen-only';overlay.style.cssText='position:absolute;inset:0;z-index:1;pointer-events:none;';header.insertBefore(overlay,img.nextSibling)}
    overlay.style.background=theme==='light'?'linear-gradient(90deg,rgba(18,74,109,.54),rgba(29,100,143,.26),rgba(8,35,52,.10))':'linear-gradient(90deg,rgba(5,6,6,.66),rgba(7,8,8,.38),rgba(7,8,8,.20),rgba(10,9,5,.32))';
    const head=header.querySelector('.head');if(head){head.style.position='relative';head.style.zIndex='2'}
    img.onerror=()=>console.warn('[VKVTT theme] Campus header image failed to load:',img.src);
  }
  function apply(next,doc=document,persist=doc===document){
    if(!VALID.has(next))next='black-gold';
    if(EXEMPT&&doc===document){doc.documentElement.dataset.vkvTheme='semantic';return}
    const links=allThemeLinks(doc);ensureThemeSafetyStyle(doc);
    doc.documentElement.dataset.vkvTheme=next;
    links.bg.forEach(l=>l.disabled=next!=='black-gold');
    links.lt.forEach(l=>l.disabled=next!=='light');
    if(doc===document)theme=next;
    if(persist){try{localStorage.setItem(KEY,next)}catch(_){} }
    if(doc===document){
      installCampusHeader(doc);
      document.querySelectorAll('[data-vkv-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.vkvThemeChoice===next?'true':'false'));
      window.dispatchEvent(new CustomEvent('vkv-theme-change',{detail:{theme:next}}));
    }
  }
  function registerThemeShell(){
    if(!('serviceWorker' in navigator)||location.protocol==='file:')return;
    navigator.serviceWorker.register('./sw.js?v=20260908-theme4',{scope:'./'}).catch(e=>console.info('[VKVTT theme] shell registration skipped:',e?.message||e));
  }
  function mount(){
    if(EXEMPT)return;
    installCampusHeader();
    if(!document.getElementById('vkvThemeSwitch')){
      const box=document.createElement('div');box.id='vkvThemeSwitch';box.className='vkv-screen-only';box.setAttribute('aria-label','Appearance');
      box.innerHTML='<span>Appearance</span><button type="button" data-vkv-theme-choice="light">☀ Light</button><button type="button" data-vkv-theme-choice="black-gold">● Black & Gold</button>';
      const st=document.createElement('style');st.textContent=`#vkvThemeSwitch{display:inline-flex;align-items:center;gap:5px;padding:4px;border:1px solid #5b5130;border-radius:12px;background:rgba(12,13,13,.88);font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#d9d3c4;white-space:nowrap;position:relative;z-index:20}#vkvThemeSwitch>span{padding:0 4px}#vkvThemeSwitch button{padding:6px 8px!important;border-radius:8px!important;font-size:12px!important;line-height:1!important;min-height:0!important}#vkvThemeSwitch button[aria-pressed="true"]{background:#f2c335!important;color:#17130b!important;border-color:#f2c335!important}@media(max-width:650px){#vkvThemeSwitch>span{display:none}#vkvThemeSwitch button{padding:6px!important}}@media print{#vkvThemeSwitch{display:none!important}}`;document.head.appendChild(st);
      const host=document.querySelector('.account,.actions,.head,.bar,.top')||document.body;host.appendChild(box);
      box.addEventListener('click',e=>{const b=e.target.closest('[data-vkv-theme-choice]');if(b)apply(b.dataset.vkvThemeChoice)});
    }
    apply(theme);registerThemeShell();
  }

  if(!EXEMPT){allThemeLinks();ensureThemeSafetyStyle();apply(theme,document,false)}
  window.addEventListener('storage',e=>{if(e.key===KEY&&VALID.has(e.newValue)&&e.newValue!==theme)apply(e.newValue,document,false)});
  try{const bc=new BroadcastChannel('vkvtt-theme');bc.onmessage=e=>{if(VALID.has(e.data)&&e.data!==theme)apply(e.data,document,false)};window.addEventListener('vkv-theme-change',e=>{if(VALID.has(e.detail?.theme))bc.postMessage(e.detail.theme)})}catch(_){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.VKVTheme={get:()=>theme,set:t=>apply(t),applyToDocument:(doc,t=theme)=>apply(t,doc,false)};
})();
