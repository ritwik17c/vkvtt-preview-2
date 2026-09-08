/* VKVTT Home launcher cleanup — presentation/navigation only. */
(function(){
  'use strict';
  if(window.__VKV_HOME_CARD_CLEANUP__)return;
  window.__VKV_HOME_CARD_CLEANUP__=true;

  function clean(){
    const grid=document.getElementById('nonTeachingGrid');
    if(!grid)return;
    /* Admin already has the Office Duty Scheduler in Admin Dashboard.
       Keep the staff-facing Office Duty Schedule here and remove the duplicate scheduler launcher. */
    [...grid.querySelectorAll('a.tile,button.tile')].forEach(el=>{
      const label=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const href=String(el.getAttribute('href')||'').toLowerCase();
      if(label.includes('office duty scheduler')||href.includes('admin-office-duty-scheduler.html'))el.remove();
    });
  }

  function start(){
    clean();
    const host=document.getElementById('nonTeachingGrid')||document.body;
    new MutationObserver(()=>queueMicrotask(clean)).observe(host,{childList:true,subtree:true});
    setTimeout(clean,250);setTimeout(clean,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
