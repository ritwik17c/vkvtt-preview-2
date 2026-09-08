/* Principal QB production/audit shortcuts. Presentation/navigation only. */
(function(){
  'use strict';
  function install(){
    if(document.getElementById('qbProductionAuditTools'))return true;
    const host=document.querySelector('#settings .actions')||document.querySelector('header .actions');
    if(!host)return false;
    const box=document.createElement('span');
    box.id='qbProductionAuditTools';box.className='actions';box.style.display='contents';
    const links=[
      ['🔎 Live Teacher Audit','admin-qb-live-teacher-audit.html'],
      ['🧭 Source Reconcile','admin-qb-source-reconcile.html'],
      ['📊 Submission Integrity','admin-qb-submission-integrity-summary.html']
    ];
    for(const[label,href]of links){const a=document.createElement('a');a.className='btn';a.href=href;a.textContent=label;host.appendChild(a)}
    return true;
  }
  let n=0,t=setInterval(()=>{if(install()||++n>40)clearInterval(t)},200);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
