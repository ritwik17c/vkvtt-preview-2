/* VKVTT Home campus-header compatibility guard.
   Home presentation only: removes the legacy dynamically-created image element
   and restores the CSS background photograph declared by the Home shell.
   Operational data and print layouts are untouched. */
(function(){
  'use strict';
  if(window.__VKV_CAMPUS_HEADER_GUARD__)return;
  window.__VKV_CAMPUS_HEADER_GUARD__=true;
  let fixing=false;
  function fix(){
    if(fixing)return;
    const header=document.querySelector('body>header');
    if(!header)return;
    fixing=true;
    try{
      document.getElementById('vkvCampusHeaderImage')?.remove();
      header.style.removeProperty('background-image');
      header.style.position='relative';
      header.style.overflow='hidden';
      const overlay=document.getElementById('vkvCampusHeaderOverlay');
      if(overlay){overlay.style.position='absolute';overlay.style.inset='0';overlay.style.zIndex='1';overlay.style.pointerEvents='none';}
      const head=header.querySelector('.head');
      if(head){head.style.position='relative';head.style.zIndex='3';}
    }finally{fixing=false;}
  }
  function start(){
    fix();
    const header=document.querySelector('body>header');
    if(!header)return;
    new MutationObserver(()=>queueMicrotask(fix)).observe(header,{childList:true,attributes:true,attributeFilter:['style']});
    window.addEventListener('vkv-theme-change',()=>queueMicrotask(fix));
    setTimeout(fix,250);setTimeout(fix,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
