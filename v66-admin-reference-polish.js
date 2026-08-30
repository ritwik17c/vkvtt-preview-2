/* v66.3 admin dashboard reference card + Phase 2 leave approvals */
(function(){
  'use strict';
  function schoolIllustration(){return '<svg class="v66-school-illustration" viewBox="0 0 460 142" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 119h430" opacity=".32"/><path d="M31 119V58h118v61M21 58l69-41 69 41M63 119V91h54v28M52 70h17v16H52zM111 70h17v16h-17z"/><path style="stroke:#c88a18" d="M90 17v19M80 27h20"/><rect x="190" y="30" width="105" height="77" rx="5" fill="rgba(31,102,140,.055)"/><path d="M190 30h105v77H190zM205 49h75M205 66h75M205 83h75M225 30v77M258 30v77"/><circle cx="349" cy="59" r="31" fill="rgba(200,138,24,.08)"/><circle cx="349" cy="59" r="31"/><path style="stroke:#c88a18" d="M349 42v18l13 8"/><path d="M372 101c17-10 34-10 51 0v25c-17-10-34-10-51 0-17-10-34-10-51 0v-25c17-10 34-10 51 0ZM372 101v25"/></g></svg>'}
  function ensureRibbon(){
    const host=document.getElementById('dashboardHome'),status=document.getElementById('activeScheduleStatus');
    if(!host)return;
    const existing=host.querySelector(':scope > .v66-school-ribbon,:scope > .v662-school-ribbon,:scope > .v66-admin-reference-ribbon');
    if(existing)return;
    const ribbon=document.createElement('section');
    ribbon.className='v66-school-ribbon v66-admin-reference-ribbon';
    ribbon.innerHTML='<div class="v66-school-copy"><div class="v66-eyebrow">Vivekananda Kendra Vidyalaya, Nalbari</div><strong>School Administration Workspace</strong><p>Timetable, classes, staff, attendance and academic records in one organised workspace.</p></div>'+schoolIllustration();
    if(status)host.insertBefore(ribbon,status);else host.prepend(ribbon);
  }
  function ensureApprovalTile(){
    const tiles=document.querySelector('#dashboardHome .tiles');if(!tiles)return null;
    let tile=document.getElementById('openLeaveApprovals');if(tile)return tile;
    tile=document.createElement('div');tile.className='tile';tile.id='openLeaveApprovals';
    tile.style.background='linear-gradient(145deg,#fff7df,#f4fbf5)';tile.style.borderColor='#d9c277';
    tile.innerHTML='<b id="leaveApprovalTitle">✓ Leave Approvals · Loading</b><span>Review delegated New Leave / Duty submissions and approved-record correction requests. Approve officially or return for correction.</span>';
    const leaveEditor=document.getElementById('openLeaveEditor');
    if(leaveEditor&&leaveEditor.parentNode===tiles)tiles.insertBefore(tile,leaveEditor);else tiles.prepend(tile);
    tile.onclick=()=>location.href='admin-leave-approvals.html?v=66.3-phase2';
    return tile;
  }
  async function refreshPendingCount(){
    const title=document.getElementById('leaveApprovalTitle');if(!title)return;
    try{
      const appMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
      const fs=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
      const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
      const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(cfg),db=fs.getFirestore(app),q=await fs.getDocs(fs.collection(db,'provisionalLeavePlans'));let n=0;q.forEach(d=>{if(String((d.data()||{}).approvalStatus||'')==='provisional')n++});
      title.textContent=n?`✓ Leave Approvals · ${n} Pending`:'✓ Leave Approvals · None Pending';
    }catch(e){title.textContent='✓ Leave Approvals';console.warn('Leave approval count:',e)}
  }
  function ensure(){ensureRibbon();if(ensureApprovalTile())setTimeout(refreshPendingCount,250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  setTimeout(ensure,300);
  window.addEventListener('focus',()=>setTimeout(refreshPendingCount,200));
})();
