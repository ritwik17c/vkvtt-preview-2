/* VKVTT global presentation theme controller. Operational data and print layouts are untouched. */
(function(){
  'use strict';
  if(window.__VKV_THEME_CONTROLLER__)return;
  window.__VKV_THEME_CONTROLLER__=true;
  const KEY='vkvtt-theme',VALID=new Set(['black-gold','light']);
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const EXEMPT=/^(admin-leave|admin-print-master|exam-timetable)\.html$/i.test(page);
  let theme=(()=>{try{const v=localStorage.getItem(KEY);return VALID.has(v)?v:'black-gold'}catch(_){return'black-gold'}})();

  function ensureCss(doc,id,href){let l=doc.getElementById(id);if(!l){l=doc.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;doc.head.appendChild(l)}return l}
  function allThemeLinks(doc=document){
    const bg=ensureCss(doc,'vkvBlackGoldThemeCss','./vkv-black-gold-screen.css?v=20260909-theme8');
    const lt=ensureCss(doc,'vkvLightThemeCss','./vkv-light-screen.css?v=20260909-theme8');
    return{bg:[...new Set([bg,...doc.querySelectorAll('link[href*="vkv-black-gold-screen.css"]')])],lt:[...new Set([lt,...doc.querySelectorAll('link[href*="vkv-light-screen.css"]')])]};
  }
  function ensureThemeSafetyStyle(doc=document){
    if(doc.getElementById('vkvThemeSafetyStyle'))return;
    const st=doc.createElement('style');st.id='vkvThemeSafetyStyle';st.textContent=`
      html[data-vkv-theme="light"] body,html[data-vkv-theme="light"] body main,html[data-vkv-theme="light"] body section{color:#17364f!important}
      html[data-vkv-theme="light"] body .noticeTitle,html[data-vkv-theme="light"] body .section h2,html[data-vkv-theme="light"] body .panel h3{color:#17364f!important}
      html[data-vkv-theme="light"] body .noticeBody,html[data-vkv-theme="light"] body .help,html[data-vkv-theme="light"] body .small,html[data-vkv-theme="light"] body .sub{color:#526d7d!important}
      html[data-vkv-theme="black-gold"] body .tip,html[data-vkv-theme="black-gold"] body .notice,html[data-vkv-theme="black-gold"] body .status{color:#f6f2e8!important}
      html[data-vkv-theme="black-gold"] body .tip *,html[data-vkv-theme="black-gold"] body .notice *,html[data-vkv-theme="black-gold"] body .status *{color:inherit!important}
      html[data-vkv-theme="light"] body input,html[data-vkv-theme="light"] body select,html[data-vkv-theme="light"] body textarea{background:#fff!important;color:#17364f!important;border-color:#c7d5de!important}
      html[data-vkv-theme="black-gold"] body input,html[data-vkv-theme="black-gold"] body select,html[data-vkv-theme="black-gold"] body textarea{background:#161716!important;color:#f6f2e8!important;border-color:#514d41!important}
      body>header[data-vkv-campus-header="1"]::before,body>header[data-vkv-campus-header="1"]::after{display:none!important;content:none!important;background:none!important;background-image:none!important;opacity:0!important}
      body>header[data-vkv-campus-header="1"]>.head,body>header[data-vkv-campus-header="1"]>.headline{position:relative!important;z-index:3!important}
      @media print{.vkv-screen-only,#vkvThemeSwitch{display:none!important}html[data-vkv-theme] body *{text-shadow:none!important}}
    `;doc.head.appendChild(st);
  }
  function forceHeaderIdentity(header){
    if(!header)return;
    const small=header.querySelector('.brand small');
    const title=header.querySelector('.brand h1');
    const session=header.querySelector('.brand p');
    const portrait=header.querySelector('.portrait');
    const logo=header.querySelector('.logo');
    if(small){
      small.style.setProperty('color','#ffd34d','important');
      small.style.setProperty('font-weight','950','important');
      small.style.setProperty('-webkit-text-stroke','.45px rgba(16,20,22,.98)','important');
      small.style.setProperty('text-shadow','0 1px 0 #000,0 2px 6px rgba(0,0,0,.95),0 0 12px rgba(0,0,0,.7)','important');
    }
    if(title){
      title.style.setProperty('color','#fff','important');
      title.style.setProperty('font-weight','900','important');
      title.style.setProperty('-webkit-text-stroke','1.25px rgba(12,18,22,.98)','important');
      title.style.setProperty('paint-order','stroke fill','important');
      title.style.setProperty('text-shadow','0 2px 0 #000,0 4px 12px rgba(0,0,0,.95),0 0 20px rgba(0,0,0,.72)','important');
    }
    if(session){
      session.style.setProperty('color','#fff','important');
      session.style.setProperty('font-weight','750','important');
      session.style.setProperty('-webkit-text-stroke','.7px rgba(12,18,22,.98)','important');
      session.style.setProperty('paint-order','stroke fill','important');
      session.style.setProperty('text-shadow','0 1px 0 #000,0 3px 9px rgba(0,0,0,.95)','important');
    }
    if(portrait){
      portrait.style.setProperty('opacity','1','important');
      portrait.style.setProperty('filter','brightness(0) saturate(100%) invert(79%) sepia(84%) saturate(1390%) hue-rotate(351deg) brightness(101%) contrast(102%) drop-shadow(0 2px 3px rgba(0,0,0,.98)) drop-shadow(0 0 5px rgba(242,195,53,.5))','important');
    }
    if(logo){
      logo.style.setProperty('filter','drop-shadow(0 3px 8px rgba(0,0,0,.9)) drop-shadow(0 0 4px rgba(255,255,255,.2))','important');
    }
  }
  function installCampusHeader(doc=document){
    const p=(doc.location?.pathname||'').split('/').pop()||'index.html';if(!(p===''||/^index\.html?$/i.test(p)))return;
    const header=doc.querySelector('body>header');if(!header)return;
    header.dataset.vkvCampusHeader='1';
    header.style.position='relative';header.style.overflow='hidden';
    const legacy=doc.getElementById('vkvCampusHeaderImage');if(legacy)legacy.remove();
    const overlay=doc.getElementById('vkvCampusHeaderOverlay');if(overlay)overlay.remove();
    header.style.setProperty('background','#1c668f','important');
    header.style.setProperty('background-image',"url('./vkv-campus-header.jpg?v=20260909-direct2')",'important');
    header.style.setProperty('background-position','center center','important');
    header.style.setProperty('background-size','cover','important');
    header.style.setProperty('background-repeat','no-repeat','important');
    header.style.setProperty('background-blend-mode','normal','important');
    forceHeaderIdentity(header);
    requestAnimationFrame(()=>forceHeaderIdentity(header));
    setTimeout(()=>forceHeaderIdentity(header),250);
  }
  function apply(next,doc=document,persist=doc===document){
    if(!VALID.has(next))next='black-gold';if(EXEMPT&&doc===document){doc.documentElement.dataset.vkvTheme='semantic';return}
    const links=allThemeLinks(doc);ensureThemeSafetyStyle(doc);doc.documentElement.dataset.vkvTheme=next;links.bg.forEach(l=>l.disabled=next!=='black-gold');links.lt.forEach(l=>l.disabled=next!=='light');if(doc===document)theme=next;
    if(persist){try{localStorage.setItem(KEY,next)}catch(_){}}
    if(doc===document){installCampusHeader(doc);document.querySelectorAll('[data-vkv-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.vkvThemeChoice===next?'true':'false'));window.dispatchEvent(new CustomEvent('vkv-theme-change',{detail:{theme:next}}));}
  }
  function registerThemeShell(){if(!('serviceWorker' in navigator)||location.protocol==='file:')return;navigator.serviceWorker.register('./sw.js?v=20260909-theme8',{scope:'./'}).catch(e=>console.info('[VKVTT theme] shell registration skipped:',e?.message||e))}
  function mount(){
    if(EXEMPT)return;installCampusHeader();
    if(!document.getElementById('vkvThemeSwitch')){
      const box=document.createElement('div');box.id='vkvThemeSwitch';box.className='vkv-screen-only';box.setAttribute('aria-label','Appearance');
      box.innerHTML='<span>Appearance</span><button type="button" data-vkv-theme-choice="light">☀ Light</button><button type="button" data-vkv-theme-choice="black-gold">● Black & Gold</button>';
      const st=document.createElement('style');st.textContent=`#vkvThemeSwitch{display:inline-flex;align-items:center;gap:5px;padding:4px;border:1px solid #5b5130;border-radius:12px;background:rgba(12,13,13,.90);font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#e7e1d5;white-space:nowrap;position:relative;z-index:200}#vkvThemeSwitch>span{padding:0 4px}#vkvThemeSwitch button{padding:6px 8px!important;border-radius:8px!important;font-size:12px!important;line-height:1!important;min-height:0!important}#vkvThemeSwitch button[data-vkv-theme-choice="light"][aria-pressed="true"]{background:#f7faf8!important;color:#17364f!important;border-color:#bad0db!important}#vkvThemeSwitch button[data-vkv-theme-choice="black-gold"][aria-pressed="true"]{background:#f2c335!important;color:#17130b!important;border-color:#f2c335!important}#vkvThemeSwitch button[aria-pressed="false"]{background:#171817!important;color:#f6f2e8!important;border-color:#5a5648!important}@media(max-width:650px){#vkvThemeSwitch>span{display:none}#vkvThemeSwitch button{padding:6px!important}}@media print{#vkvThemeSwitch{display:none!important}}`;document.head.appendChild(st);
      const host=document.querySelector('.account,.headline,.headActions,.toolbar-actions,.actions,.head,.bar,.top,.topbar');
      if(host)host.appendChild(box);else{box.style.position='fixed';box.style.top='8px';box.style.right='8px';document.body.appendChild(box)}
      box.addEventListener('click',e=>{const b=e.target.closest('[data-vkv-theme-choice]');if(b)apply(b.dataset.vkvThemeChoice)});
    }
    apply(theme);registerThemeShell();
    if(/^annual-calendar-2026-27\.html$/i.test(page)&&!document.getElementById('vkvAnnualCalendarThemeHelper')){const s=document.createElement('script');s.id='vkvAnnualCalendarThemeHelper';s.src='./vkv-annual-calendar-theme.js?v=20260909-calendar-theme2';document.head.appendChild(s)}
  }
  if(!EXEMPT){allThemeLinks();ensureThemeSafetyStyle();apply(theme,document,false)}
  window.addEventListener('storage',e=>{if(e.key===KEY&&VALID.has(e.newValue)&&e.newValue!==theme)apply(e.newValue,document,false)});
  try{const bc=new BroadcastChannel('vkvtt-theme');bc.onmessage=e=>{if(VALID.has(e.data)&&e.data!==theme)apply(e.data,document,false)};window.addEventListener('vkv-theme-change',e=>{if(VALID.has(e.detail?.theme))bc.postMessage(e.detail.theme)})}catch(_){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.VKVTheme={get:()=>theme,set:t=>apply(t),applyToDocument:(doc,t=theme)=>apply(t,doc,false)};
})();
