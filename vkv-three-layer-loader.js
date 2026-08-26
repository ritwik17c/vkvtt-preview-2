/* Preview 2: deterministic three-layer access. Runs after the original VKVTT shell and keeps enforcing category visibility for late-rendered controls. */
(async()=>{try{
  let s=await (await fetch('https://raw.githubusercontent.com/ritwik17c/vkvtt-preview-2/main/v66-staff-identity-once.js?fix=3',{cache:'no-store'})).text();
  s=s.replace("if(!u)return,db=F.getFirestore(app);","if(!u)return;");
  (0,eval)(s);

  const apply=()=>{
    const cat=window.__vkvStaffCategory;
    if(!cat)return;
    const non=cat!=='teaching';
    document.body.classList.toggle('vkv-nonteaching',non);
    document.body.classList.toggle('vkv-teaching',!non);

    // Section 2 is exclusive: exactly one category section.
    let area=document.getElementById('vkvCategoryArea');
    if(!area){
      area=document.createElement('section'); area.id='vkvCategoryArea';
      const anchor=document.querySelector('.nav')||document.querySelector('.opsTitle')||document.querySelector('.opsGrid');
      if(anchor) anchor.before(area); else document.body.appendChild(area);
    }
    area.innerHTML=non
      ? '<div class="vkvLayerTitle">My Work · Non-Teaching</div><div class="vkvLayerGrid"><button id="vkvOfficeDuty">🏢 Office Duty Schedule</button></div><div id="vkvCategoryPanel" class="vkvLayerPanel"></div>'
      : '<div class="vkvLayerTitle">My Work · Teaching</div><div class="vkvLayerGrid"><button id="vkvTeachingPersonal">📘 My Teaching Work</button></div><div id="vkvCategoryPanel" class="vkvLayerPanel"></div>';
    if(non){const b=document.getElementById('vkvOfficeDuty');if(b)b.onclick=()=>{const p=document.getElementById('vkvCategoryPanel');p.innerHTML='<b>Office Duty Schedule</b><div class="vkvNotice"><b>Daily Office Sitting Duty</b><br>Time-slot based office duty roster.</div><div class="vkvNotice"><b>After-School Stay-Back Duty</b><br>Monday–Saturday · 3:00–4:00 p.m. roster.</div>';p.style.display='block'}}

    // Teaching-only personal controls: never leak into NT, even if created later.
    const teachingOnly=['myTimetableBtn','myProxyTodayBtn','myProxyHistoryBtn','periodReminderControl','periodReminderBtn'];
    teachingOnly.forEach(id=>{const e=document.getElementById(id);if(e)e.style.setProperty('display',non?'none':'','important')});
    document.querySelectorAll('[id*="periodReminder" i],[class*="periodReminder" i]').forEach(e=>{if(non)e.style.setProperty('display','none','important')});
  };

  window.addEventListener('vkv-staff-category-ready',apply);
  let n=0; const timer=setInterval(()=>{apply(); if(++n>40)clearInterval(timer)},250);
  new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true});
}catch(e){console.error('Three-layer loader failed',e)}})();