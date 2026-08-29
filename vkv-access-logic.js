/* Preview2 homepage access logic — single owner for Section 3 authority visibility.
   Important: do not assume teacher while auth/profile is unresolved. Resolve the signed-in
   account once with targeted documents only, then keep that result in memory. */
(async()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],norm=s=>String(s||'').replace(/[^A-Za-z0-9]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
let profile=null,profileResolved=false,resolving=false;

async function resolveProfile(){
  if(profileResolved||resolving)return profile;
  resolving=true;
  try{
    const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const U=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
    const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
    const app=A.getApps().length?A.getApp():A.initializeApp(cfg),auth=U.getAuth(app),db=F.getFirestore(app);
    if(typeof auth.authStateReady==='function')await auth.authStateReady().catch(()=>{});
    const u=auth.currentUser;
    /* A null user during page boot is NOT a resolved non-admin state. Retry later. */
    if(!u){resolving=false;return null}
    let p=null;
    const a=await F.getDoc(F.doc(db,'authorizedUsers',u.uid)).catch(()=>null);
    if(a?.exists()&&a.data().active===true)p=a.data();
    if(!p){
      const email=String(u.email||'').trim().toLowerCase();
      if(email){const v=await F.getDoc(F.doc(db,'viewerEmails',email)).catch(()=>null);if(v?.exists()&&v.data().active===true)p={...v.data(),role:v.data().role||'teacher',emailViewer:true}}
    }
    profile=p||{role:'teacher'};
    profileResolved=true;
    window.__vkvPreview2ResolvedRole=String(profile.role||'teacher').toLowerCase();
    return profile;
  }catch(_){return null}
  finally{resolving=false}
}
function role(){return String(window.__vkvPreview2ResolvedRole||window.__vkvRole||profile?.role||'').toLowerCase()}
function allowances(){const p=profile||{},r=role(),tokens=new Set([r,...(p.permissions||[]),...(p.delegatedRoles||[]),...(p.responsibilities||[])].map(x=>String(x).toLowerCase())),has=x=>tokens.has(x)||p[x]===true;return{known:profileResolved||!!r,admin:r==='admin',proxy:['admin','manager','proxy_manager'].includes(r)||has('proxy_manager')||has('proxy'),leave:['admin','manager','leave_editor'].includes(r)||has('leave_editor')||has('leave'),attendance:['admin','attendance_manager'].includes(r)||has('attendance_manager')||has('attendance')}}
function adminCard(){
  const a=allowances();if(!a.admin)return null;
  const grid=$('#vkvSection3 .vkv3grid');if(!grid)return null;
  let e=$('#vkvAdminDashboardCard')||$('#adminUserAccessBtn')||[...document.querySelectorAll('button,a')].find(x=>norm(x.textContent).includes('admin dashboard'));
  if(!e){e=document.createElement('a');e.id='vkvAdminDashboardCard';e.textContent='⚙ Admin Dashboard'}
  e.href='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html';
  e.style.cssText='box-sizing:border-box;min-height:76px;text-align:left;padding:15px 17px;border:1px solid #c7d8e2;border-left:5px solid #24739d;border-radius:16px;background:#fff;color:#17364f;font:inherit;font-weight:800;text-decoration:none;box-shadow:0 5px 16px rgba(18,63,90,.06);width:100%;margin:0;display:block;visibility:visible';
  if(e.parentElement!==grid)grid.appendChild(e);grid.querySelector('.vkv3empty')?.remove();return e;
}
function apply(){
  const a=allowances();if(!a.known)return;
  adminCard();
  const s3=$('#vkvSection3');if(s3){
    $$('#vkvSection3 button,#vkvSection3 a').forEach(e=>{const t=norm(e.textContent);let ok=true;if(t.includes('admin dashboard'))ok=a.admin;else if(t.includes('proxy manager'))ok=a.proxy;else if(t.includes('leave editor'))ok=a.leave;else if(t.includes('attendance manager'))ok=a.attendance;e.style.display=ok?'':'none'});
    const vis=$$('#vkvSection3 button,#vkvSection3 a').some(e=>getComputedStyle(e).display!=='none'),empty=$('#vkvSection3 .vkv3empty');if(empty)empty.style.display=vis?'none':'';
  }
  const teach=$('#vkvSection2');if(teach&&/non teaching/i.test(teach.querySelector('h2')?.textContent||'')){const qb=$('#vkvQuestionBankTile');if(qb)qb.style.display='none';['myTimetableBtn','myProxyTodayBtn','myProxyHistoryBtn','vkvCard_periodReminder','vkvCard_teacherSpecialDuty'].forEach(id=>{const e=$('#'+id);if(e)e.style.display='none'})}
}
async function cycle(){if(!profileResolved)await resolveProfile();apply()}
/* Retry during auth/bootstrap only. Once resolved, no further Firestore role reads. */
let n=0;const t=setInterval(async()=>{n++;await cycle();if(profileResolved&&$('#vkvSection3')){clearInterval(t);apply()}else if(n>=80)clearInterval(t)},250);
cycle();
window.addEventListener('focus',()=>setTimeout(apply,100));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(apply,100)});
})();
