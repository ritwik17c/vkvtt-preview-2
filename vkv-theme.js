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
    l.id='vkvLightThemeCss';l.rel='stylesheet';l.href='./vkv-light-screen.css?v=20260908-theme2';
    doc.head.appendChild(l);
  }
  function ensureThemeSafetyStyle(doc=document){
    if(doc.getElementById('vkvThemeSafetyStyle'))return;
    const st=doc.createElement('style');st.id='vkvThemeSafetyStyle';
    const page=(doc.location?.pathname||'').split('/').pop()||'index.html';
    st.textContent=`
      html[data-vkv-theme="light"] body .noticeTitle,html[data-vkv-theme="light"] body .section h2,html[data-vkv-theme="light"] body .panel h3,html[data-vkv-theme="light"] body .tile,html[data-vkv-theme="light"] body .tile *{color:#17364f!important}
      html[data-vkv-theme="light"] body .noticeBody,html[data-vkv-theme="light"] body .resultbox,html[data-vkv-theme="light"] body .resultbox *,html[data-vkv-theme="light"] body .tag{color:#526d7d!important}
      html[data-vkv-theme="light"] #periodReminderControl #prNext .small,html[data-vkv-theme="light"] #periodReminderControl #prStatus{color:#526d7d!important}
      html[data-vkv-theme="light"] body .pill,html[data-vkv-theme="light"] body .badge,html[data-vkv-theme="light"] body .chip{color:#17364f!important}
      @media print{html[data-vkv-theme="light"] body *,html[data-vkv-theme="black-gold"] body *{text-shadow:none!important}}
    `;
    if(/^index\.html?$/i.test(page)||page==='')st.textContent+=`
      body>header{background-image:linear-gradient(90deg,rgba(5,6,6,.78) 0%,rgba(7,8,8,.58) 42%,rgba(7,8,8,.42) 70%,rgba(10,9,5,.56) 100%),linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.28)),url('./vkv-campus-header.jpg?v=20260908-theme2')!important;background-position:center 48%!important;background-size:cover!important;background-repeat:no-repeat!important}
      html[data-vkv-theme="light"] body>header{background-image:linear-gradient(90deg,rgba(22,83,121,.72),rgba(31,102,145,.50)),linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.20)),url('./vkv-campus-header.jpg?v=20260908-theme2')!important}
    `;
    doc.head.appendChild(st);
  }
  function apply(next,doc=document){
    if(!VALID.has(next))next='black-gold';
    theme=next;
    ensureLightCss(doc);ensureThemeSafetyStyle(doc);
    doc.documentElement.dataset.vkvTheme=next;
    try{localStorage.setItem(KEY,next)}catch(_){}
    if(doc===document){
      document.querySelectorAll('[data-vkv-theme-choice]').forEach(b=>{
        const on=b.dataset.vkvThemeChoice===next;
        b.setAttribute('aria-pressed',on?'true':'false');
      });
      window.dispatchEvent(new CustomEvent('vkv-theme-change',{detail:{theme:next}}));
    }
  }
  function mount(){
    if(document.getElementById('vkvThemeSwitch'))return;
    const box=document.createElement('div');
    box.id='vkvThemeSwitch';
    box.setAttribute('aria-label','Appearance');
    box.innerHTML='<span>Appearance</span><button type="button" data-vkv-theme-choice="light">☀ Light</button><button type="button" data-vkv-theme-choice="black-gold">● Black & Gold</button>';
    const st=document.createElement('style');
    st.textContent='#vkvThemeSwitch{display:inline-flex;align-items:center;gap:5px;padding:4px;border:1px solid #5b5130;border-radius:12px;background:rgba(12,13,13,.88);font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#d9d3c4;white-space:nowrap}#vkvThemeSwitch>span{padding:0 4px}#vkvThemeSwitch button{padding:6px 8px!important;border-radius:8px!important;font-size:12px!important;line-height:1!important;min-height:0!important}#vkvThemeSwitch button[aria-pressed="true"]{background:#f2c335!important;color:#17130b!important;border-color:#f2c335!important}@media(max-width:650px){#vkvThemeSwitch>span{display:none}#vkvThemeSwitch button{padding:6px!important}}@media print{#vkvThemeSwitch{display:none!important}}';
    document.head.appendChild(st);
    const host=document.querySelector('.account,.actions,.head,.bar')||document.body;
    host.appendChild(box);
    box.addEventListener('click',e=>{const b=e.target.closest('[data-vkv-theme-choice]');if(b)apply(b.dataset.vkvThemeChoice)});
    apply(theme);
  }
  ensureLightCss();ensureThemeSafetyStyle();
  document.documentElement.dataset.vkvTheme=theme;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.VKVTheme={get:()=>theme,set:t=>apply(t),applyToDocument:(doc,t=theme)=>{ensureLightCss(doc);ensureThemeSafetyStyle(doc);doc.documentElement.dataset.vkvTheme=t;}};
})();
