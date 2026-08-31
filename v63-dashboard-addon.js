/*
VKV Nalbari Timetable — Cloud v63.0 Dashboard Add-on
Load this file AFTER the existing admin-dashboard.html script:
<script src="v63-dashboard-addon.js"></script>
*/
(() => {
  const VERSION='63.0';
  const style=document.createElement('style');
  style.textContent=`
    .tile,button,.btn,a[href],[role="button"],summary{cursor:pointer}
    button:disabled{cursor:not-allowed!important}
    .v63QuickLeaveFrame{width:100%;min-height:970px;border:1px solid #cbdce5;border-radius:16px;background:#f7fbf9}
    @media(max-width:700px){.v63QuickLeaveFrame{min-height:1180px}}
  `;
  document.head.appendChild(style);

  function install(){
    const tiles=document.querySelector('#dashboardHome .tiles');
    if(!tiles||document.getElementById('v63QuickLeaveTile'))return;

    const quick=document.createElement('div');
    quick.className='tile';quick.id='v63QuickLeaveTile';
    quick.style.cssText='background:#eef8ff;border-color:#a9cfe2';
    quick.innerHTML='<b>➕ Quick Add Leave</b><span>Use the same Leave Editor here for One Date, Date Range or Staggered Dates.</span>';

    const manager=document.createElement('div');
    manager.className='tile';manager.id='v63DuplicateTile';
    manager.style.cssText='background:#fff8e8;border-color:#e5c979';
    manager.innerHTML='<b>🧹 Duplicate & Conflict Manager</b><span>Scan exact duplicates and overlapping leave conflicts; archive only after review.</span>';

    const leaveEditor=document.getElementById('openLeaveEditor');
    if(leaveEditor){leaveEditor.insertAdjacentElement('afterend',manager);manager.insertAdjacentElement('beforebegin',quick)}
    else{tiles.appendChild(quick);tiles.appendChild(manager)}

    const panel=document.createElement('section');
    panel.id='v63QuickLeavePanel';panel.className='card panel';
    panel.innerHTML=`
      <div class="sectionTop">
        <div><div class="breadcrumb">Admin Dashboard → Quick Add Leave</div><h2>➕ Quick Add Leave</h2></div>
        <button type="button" data-v63-back>← Admin Dashboard</button>
      </div>
      <div class="help">This is the same Cloud v63 Leave Editor in quick-entry mode. Saved records use the same Firestore leave plans, validation, duplicate checks and audit trail.</div>
      <iframe class="v63QuickLeaveFrame" title="Quick Add Leave" src="admin-leave-editor.html?v=${VERSION}&quick=1"></iframe>
    `;
    const app=document.getElementById('app');if(app)app.appendChild(panel);

    const originalShowDashboard=window.showDashboard;
    function showQuick(){
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      const home=document.getElementById('dashboardHome');if(home)home.style.display='none';
      panel.classList.add('active');panel.scrollIntoView({behavior:'smooth',block:'start'});
    }
    function back(){
      panel.classList.remove('active');
      if(typeof originalShowDashboard==='function')originalShowDashboard();
      else{const home=document.getElementById('dashboardHome');if(home)home.style.display='block';window.scrollTo({top:0,behavior:'smooth'})}
    }
    quick.onclick=showQuick;panel.querySelector('[data-v63-back]').onclick=back;
    manager.onclick=()=>location.href=`admin-leave-editor.html?v=${VERSION}#leaveIntegritySection`;

    // Update visible version references without changing app logic.
    document.querySelectorAll('a[href*="?v=62.0"]').forEach(a=>a.href=a.href.replace('?v=62.0','?v=63.0'));
    const sub=document.querySelector('header .subtitle');
    if(sub)sub.textContent=sub.textContent.replace(/Cloud v\d+(?:\.\d+)?/,'Cloud v63.0');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();