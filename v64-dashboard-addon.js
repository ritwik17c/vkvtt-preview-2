/*
VKV Nalbari Timetable — Cloud v66.4 Dashboard Add-on
Adds Quick Add Leave, dedicated Staff Management and Question Bank Administration.
*/
(() => {
  const VERSION='66.0-leave-fix-1';
  const style=document.createElement('style');
  style.textContent=`.tile,button:not(:disabled),.btn,a[href],[role="button"],summary,[onclick]{cursor:pointer!important}button:disabled{cursor:not-allowed!important}.v64QuickLeaveFrame{width:100%;min-height:900px;border:1px solid #cbdce5;border-radius:16px;background:#f7fbf9}@media(max-width:700px){.v64QuickLeaveFrame{min-height:1180px}}`;
  document.head.appendChild(style);
  function removeLegacyNonTeachingTile(tiles){
    [...tiles.querySelectorAll('.tile')].forEach(tile=>{
      if(tile.id==='v663StaffManagementTile')return;
      const text=(tile.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const click=String(tile.getAttribute('onclick')||tile.dataset?.href||'').toLowerCase();
      const anchor=tile.querySelector('a[href]'),href=String(anchor?.getAttribute('href')||'').toLowerCase();
      if((text.includes('non-teaching staff')||text.includes('non teaching staff')||click.includes('nonteaching')||click.includes('non-teaching')||href.includes('nonteaching')||href.includes('non-teaching'))&&!text.includes('staff management'))tile.remove();
    });
  }
  function install(){
    const tiles=document.querySelector('#dashboardHome .tiles');if(!tiles)return;
    document.getElementById('v63DuplicateTile')?.remove();document.getElementById('v63QuickLeaveTile')?.remove();removeLegacyNonTeachingTile(tiles);
    if(!document.getElementById('v663StaffManagementTile')){
      const staff=document.createElement('div');staff.className='tile';staff.id='v663StaffManagementTile';staff.style.cssText='background:linear-gradient(145deg,#eef8ff,#edf8f2);border-color:#91bfd0';staff.innerHTML='<b>👥 Staff Management</b><span>Timetable-safe staff directory with Employee Code, optional Teacher Short Name, separate Academic / Professional Qualifications, service details, inactive archive access and full extended Excel round-trip import/export.</span>';
      const teachers=[...tiles.querySelectorAll('.tile')].find(x=>/Teachers\s*&\s*Workload/i.test(x.textContent||''));if(teachers)teachers.insertAdjacentElement('beforebegin',staff);else tiles.appendChild(staff);staff.onclick=()=>location.href='admin-staff-management-v7.html?v=66.4-staff-role-fix';
    }
    if(!document.getElementById('vkvQuestionBankAdminTile')){
      const qb=document.createElement('div');qb.className='tile';qb.id='vkvQuestionBankAdminTile';qb.style.cssText='background:linear-gradient(145deg,#eef8ff,#f7f1ff);border-color:#9fb9d8';qb.innerHTML='<b>📚 Question Bank Administration</b><span>Principal control centre for teacher submissions, Subject Coordinator assignments, verification workflow, class/subject/teacher filters, leaderboard, awards, templates and exports.</span>';
      const integrity=document.getElementById('openTimetableIntegrity');if(integrity)integrity.insertAdjacentElement('beforebegin',qb);else tiles.appendChild(qb);qb.onclick=()=>location.href='admin-question-bank-v2.html?v=preview2-qb-3';
    }
    if(!document.getElementById('v64QuickLeaveTile')){
      const quick=document.createElement('div');quick.className='tile';quick.id='v64QuickLeaveTile';quick.style.cssText='background:#eef8ff;border-color:#a9cfe2';quick.innerHTML='<b>➕ Quick Add Leave</b><span>Add an individual Date Row or Date-Range Row directly from the Admin Dashboard.</span>';
      const leaveEditor=document.getElementById('openLeaveEditor');if(leaveEditor)leaveEditor.insertAdjacentElement('afterend',quick);else tiles.appendChild(quick);
      const panel=document.createElement('section');panel.id='v64QuickLeavePanel';panel.className='card panel';panel.innerHTML=`<div class="sectionTop"><div><div class="breadcrumb">Admin Dashboard → Quick Add Leave</div><h2>➕ Quick Add Leave</h2></div><button type="button" data-v64-back>← Admin Dashboard</button></div><div class="help">This is the same Leave Editor and the same Firestore leave data. Each click adds one Date Row or one Date-Range Row, and all leave units are totalled together.</div><iframe class="v64QuickLeaveFrame" title="Quick Add Leave" src="admin-leave-editor.html?v=${VERSION}&quick=1"></iframe>`;document.getElementById('app')?.appendChild(panel);
      function showQuick(){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));const home=document.getElementById('dashboardHome');if(home)home.style.display='none';panel.classList.add('active');panel.scrollIntoView({behavior:'smooth',block:'start'})}function back(){panel.classList.remove('active');const home=document.getElementById('dashboardHome');if(home)home.style.display='block';window.scrollTo({top:0,behavior:'smooth'})}quick.onclick=showQuick;panel.querySelector('[data-v64-back]')?.addEventListener('click',back);
    }
    removeLegacyNonTeachingTile(tiles);
    const sub=document.querySelector('header .subtitle');if(sub)sub.textContent=sub.textContent.replace(/Cloud v\d+(?:\.\d+)?/,'Cloud v66.4');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,800);setTimeout(install,2200);
})();