/* Preview 2 surgical fix: canonical staff-category resolution for teaching/non-teaching UI. */
(async()=>{'use strict';
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,'_');
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function catOfStaff(x){
  const c=norm(x?.category||x?.staffCategory||x?.staffType||'');
  if(c==='teaching'||c==='teacher')return'teaching';
  if(['non_teaching','non-teaching','administrative','admin_staff','office_staff','support_staff'].includes(c))return'nonTeaching';
  return'';
}
function allStaff(M){return [...(M.staffDirectory||[]),...(M.teachers||[]),...(M.nonTeachingStaff||[])].filter(Boolean)}
function byRid(M,rid){
  rid=String(rid||'').trim();if(!rid)return null;
  const sd=(M.staffDirectory||[]).find(x=>String(x.id||'')===rid);if(sd)return sd;
  if(rid.startsWith('teacher:')){const c=rid.slice(8);return (M.teachers||[]).find(x=>String(x.code||'')===c)||null}
  if(rid.startsWith('nt:')){const c=rid.slice(3);return (M.nonTeachingStaff||[]).find(x=>String(x.code||x.employeeCode||'')===c)||null}
  return allStaff(M).find(x=>[x.id,x.code,x.employeeCode,x.teacherShortCode,x.timetableCode].some(v=>String(v||'')===rid))||null;
}
function byEmail(M,email){email=String(email||'').trim().toLowerCase();if(!email)return null;const a=allStaff(M).filter(x=>[x.email,x.gmail,x.googleEmail,x.google_email].some(v=>String(v||'').trim().toLowerCase()===email));return a.length===1?a[0]:null}
function byCode(M,code){code=String(code||'').trim();if(!code)return null;return allStaff(M).find(x=>[x.code,x.employeeCode,x.teacherShortCode,x.timetableCode].some(v=>String(v||'')===code))||null}
async function resolve(){
  try{
    const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const U=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
    const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
    const app=A.getApps().length?A.getApp():A.initializeApp(cfg),auth=U.getAuth(app);if(auth.authStateReady)await auth.authStateReady();const u=auth.currentUser;if(!u)return'';
    const db=F.getFirestore(app),email=String(u.email||'').trim().toLowerCase();
    const [ps,vs,ms]=await Promise.all([
      F.getDoc(F.doc(db,'authorizedUsers',u.uid)).catch(()=>null),
      email?F.getDoc(F.doc(db,'viewerEmails',email)).catch(()=>null):Promise.resolve(null),
      F.getDoc(F.doc(db,'master','current')).catch(()=>null)
    ]);
    const p=ps&&ps.exists()?ps.data():{},v=vs&&vs.exists()?vs.data():{},raw=ms&&ms.exists()?ms.data():{},M=raw.data||raw||{};
    let s=byRid(M,p.staffRecordId);
    let cat=catOfStaff(s);
    if(!cat){const c=norm(p.staffType||p.staffCategory||'');if(c==='teaching')cat='teaching';else if(['non_teaching','administrative','non-teaching'].includes(c))cat='nonTeaching'}
    if(!cat){s=byCode(M,v.staffCode||p.staffCode||p.employeeCode);if(s)cat=catOfStaff(s)||((M.nonTeachingStaff||[]).includes(s)?'nonTeaching':'')}
    if(!cat){s=byCode(M,v.teacherCode||p.teacherCode||p.teacherShortCode||p.timetableCode);if(s)cat=catOfStaff(s)||((M.teachers||[]).includes(s)?'teaching':'')}
    if(!cat){s=byEmail(M,email);if(s)cat=catOfStaff(s)||((M.nonTeachingStaff||[]).includes(s)?'nonTeaching':(M.teachers||[]).includes(s)?'teaching':'')}
    return cat;
  }catch(e){console.warn('Preview2 canonical category fix:',e);return''}
}
function reminderPanel(){return $('#periodReminderControl')||$('.periodReminderControl')||$$('div').find(e=>/Period Reminder/.test(e.textContent||'')&&/Test Voice/.test(e.textContent||''))||null}
function ensureOfficeDuty(){
  const sec=$('#vkvSecCategory');if(!sec)return;
  const h=sec.querySelector('h2'),p=sec.querySelector('p'),g=sec.querySelector('.vkvSecGrid');if(h)h.textContent='My Work · Non-Teaching';if(p)p.textContent='Staff-category specific work area.';if(!g)return;
  [...g.children].forEach(x=>x.remove());
  let b=$('#vkvCard_officeDuty');if(!b){b=document.createElement('button');b.id='vkvCard_officeDuty';b.className='vkvVirtual vkvRegistryCard vkvTone1';b.dataset.vkvCard='officeDuty';b.textContent='🏢 Office Duty Schedule';b.onclick=()=>{document.querySelectorAll('.vkvExpand.open').forEach(x=>x.classList.remove('open'));document.querySelectorAll('.vkvSecGrid>button.active').forEach(x=>x.classList.remove('active'));b.classList.add('active');let out=$('#vkvOfficeDutyDetails');if(!out){out=document.createElement('div');out.id='vkvOfficeDutyDetails';out.className='vkvExpand';g.append(out)}out.innerHTML='<div class="vkvExpandTitle">Office Duty Schedule</div><div class="vkvTime">Office sitting duty and after-school stay-back roster.</div>';out.classList.add('open')}}g.append(b)
}
function apply(cat){
  const reminder=reminderPanel();
  if(cat==='nonTeaching'){
    ensureOfficeDuty();
    if(reminder){reminder.style.setProperty('display','none','important');reminder.style.setProperty('visibility','hidden','important')}
    ['#myTimetableBtn','#myProxyTodayBtn','#myProxyHistoryBtn','#vkvCard_periodReminder'].forEach(q=>{const e=$(q);if(e)e.style.setProperty('display','none','important')});
    return;
  }
  if(cat==='teaching'){
    if(reminder){reminder.style.removeProperty('display');reminder.style.setProperty('visibility','visible','important')}
  }
}
async function run(){const c=await resolve();if(c)apply(c)}
setTimeout(run,250);let n=0;const t=setInterval(async()=>{await run();if(++n>10)clearInterval(t)},700);window.addEventListener('focus',run);
})();
