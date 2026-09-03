// VKVTT v66.2 final six-point runtime corrections
(async function(){
  'use strict';

  // Preview only: clear stale service-worker/cache state once after a synchronized upload.
  if(location.pathname.startsWith('/vkvtt-preview/')){
    try{
      const flag='vkvttPreviewCacheResetV662Final1';
      if(!sessionStorage.getItem(flag)){
        sessionStorage.setItem(flag,'1');
        if('serviceWorker' in navigator){
          const regs=await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r=>r.unregister()));
        }
        if('caches' in window){
          const keys=await caches.keys();
          await Promise.all(keys.filter(k=>/vkvtt/i.test(k)).map(k=>caches.delete(k)));
        }
        const u=new URL(location.href);u.searchParams.set('fresh','662final1');location.replace(u.toString());return;
      }
    }catch(e){console.warn('Preview cache reset:',e)}
  }

  // Make Firebase auth persistence explicit on every page that loads this shared patch.
  let sharedApp=null,sharedAuth=null;
  try{
    const appMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const authMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
    sharedApp=appMod.getApps().length?appMod.getApp():appMod.initializeApp(cfg);
    sharedAuth=authMod.getAuth(sharedApp);
    await authMod.setPersistence(sharedAuth,authMod.browserLocalPersistence);
  }catch(e){console.warn('Auth persistence:',e)}

  // Attendance Manager compatibility: show all same-day app punches and same-day biometric rows.
  // This is intentionally read-only and only runs on the Attendance Administration page.
  if(/admin-attendance\.html$/i.test(location.pathname)){
    try{
      const fs=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
      const db=fs.getFirestore(sharedApp),today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
      const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const normalDate=v=>{const s=String(v||'').trim();let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return`${m[1]}-${m[2]}-${m[3]}`;m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?`${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`:''};
      const recordDate=x=>normalDate(x.date)||(()=>{const ms=Number(x.clientTimeMs||0);if(!ms)return'';const d=new Date(ms);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)})();
      const waitUser=async()=>{for(let i=0;i<30;i++){if(sharedAuth?.currentUser)return sharedAuth.currentUser;await new Promise(r=>setTimeout(r,200))}return null};
      const user=await waitUser();
      if(user){
        const ps=await fs.getDoc(fs.doc(db,'authorizedUsers',user.uid)).catch(()=>null),p=ps?.exists()?ps.data():null;
        if(p&&p.active===true&&['admin','manager','attendance_manager'].includes(p.role)){
          setTimeout(async()=>{
            const host=document.getElementById('events');if(!host)return;
            try{
              const key=today();
              let appRows=[];
              try{
                const q=await fs.getDocs(fs.query(fs.collection(db,'attendanceEvents'),fs.where('date','==',key)));
                appRows=q.docs.map(d=>({id:d.id,...d.data()}));
              }catch(_){/* fallback below */}
              if(!appRows.length){
                const all=await fs.getDocs(fs.collection(db,'attendanceEvents'));
                appRows=all.docs.map(d=>({id:d.id,...d.data()})).filter(x=>recordDate(x)===key);
              }
              let bioRows=[];
              try{
                const bq=await fs.getDocs(fs.query(fs.collection(db,'biometricRecords'),fs.where('date','==',key)));
                bioRows=bq.docs.map(d=>({id:d.id,...d.data()}));
              }catch(_){
                try{const allb=await fs.getDocs(fs.collection(db,'biometricRecords'));bioRows=allb.docs.map(d=>({id:d.id,...d.data()})).filter(x=>normalDate(x.date)===key)}catch(__){}
              }
              const coreSaysNone=/No attendance event has been recorded today/i.test(host.textContent||'');
              if(coreSaysNone&&appRows.length){
                host.innerHTML='<div class="ok" style="padding:10px;border-radius:10px;margin-bottom:10px"><b>Today’s app attendance recovered:</b> '+appRows.length+' record(s).</div><table><thead><tr><th>Staff</th><th>Event / Time</th><th>Location</th><th>Schedule result</th></tr></thead><tbody>'+appRows.sort((a,b)=>(a.clientTimeMs||0)-(b.clientTimeMs||0)).map(x=>`<tr><td>${esc(x.staffName||'')}<div class="small">${esc(x.staffCode||'')}</div></td><td>${esc(String(x.type||'').replaceAll('_',' '))}<div class="small">${x.clientTimeMs?new Date(x.clientTimeMs).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}):'—'}</div></td><td>${Math.round(Number(x.distanceMetres||0))} m · accuracy ${Math.round(Number(x.accuracy||0))} m</td><td>${x.lateMinutes?'Late by '+Number(x.lateMinutes)+' min':x.earlyDepartureMinutes?Number(x.earlyDepartureMinutes)+' min early':'—'}</td></tr>`).join('')+'</tbody></table>';
              }
              let bio=document.getElementById('vkvTodayBiometric');
              if(!bio){bio=document.createElement('div');bio.id='vkvTodayBiometric';bio.style.marginTop='14px';host.insertAdjacentElement('afterend',bio)}
              bio.innerHTML=bioRows.length?`<div class="card" style="margin:0"><h3>Today’s Biometric Records</h3><div class="small">${bioRows.length} imported punching-machine row(s) for ${key.split('-').reverse().join('/')}.</div><div class="table"><table><thead><tr><th>Staff</th><th>Time</th><th>Type</th><th>Device</th></tr></thead><tbody>${bioRows.sort((a,b)=>String(a.time||'').localeCompare(String(b.time||''))).map(x=>`<tr><td>${esc(x.name||'')} (${esc(x.code||'')})</td><td>${esc(x.time||'')}</td><td>${esc(x.type||'—')}</td><td>${esc(x.device||'—')}</td></tr>`).join('')}</tbody></table></div></div>`:'';
            }catch(e){
              console.warn('Attendance Manager compatibility view:',e);
              if(/permission|insufficient/i.test(String(e.message||e))){
                host.insertAdjacentHTML('afterbegin','<div class="warn"><b>Attendance read is still blocked by Firestore permissions for this Manager account.</b> The page code is loaded correctly; the deployed attendance rules need to be checked.</div>');
              }
            }
          },1200);
        }
      }
    }catch(e){console.warn('Attendance Manager compatibility setup:',e)}
  }

  // Retain the light click nudge without changing label/icon visibility.
  document.addEventListener('click',e=>{
    const b=e.target.closest('.myGrid button,.nav button,.opsGrid button,.homebar button,.adminDashboardPage .tile');
    if(!b)return;
    b.classList.remove('v662-click-nudge');void b.offsetWidth;b.classList.add('v662-click-nudge');
    setTimeout(()=>b.classList.remove('v662-click-nudge'),220);
  },true);

  // Homepage Daily History: supplement the old snapshot with authoritative dated records.
  if(!document.getElementById('historyResult'))return;
  try{
    const appMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const fs=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
    const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
    const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(cfg);
    const db=fs.getFirestore(app);

    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
    const toIso=v=>{const m=String(v||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:''};
    const covers=(p,date)=>{
      if(!p||p.active===false||p.archived===true||p.deleted===true)return false;
      if(p.mode==='multiple')return Array.isArray(p.dates)&&p.dates.includes(date);
      const a=String(p.startDate||p.date||''),b=String(p.endDate||a);return !!a&&date>=a&&date<=b;
    };
    const teacherName=code=>{
      const D=window.DATA||{};
      const all=[...(D.teachers||[]),...(D.nonTeachingStaff||[]),...(D.temporaryReplacements||[])];
      const t=all.find(x=>String(x.code||x.tempCode||'')===String(code||''));
      return t?(t.name||t.tempName||code):(code||'Staff');
    };
    const kind=x=>String(x.type||x.kind||'').toLowerCase();
    const label=x=>{
      const k=kind(x),cat=x.category||x.leaveCategory||'';
      if(k==='full')return 'Full Leave'+(cat?' · '+cat:'');
      if(k==='half')return 'Half Leave'+(cat?' · '+cat:'');
      if(k==='od')return 'On Duty';
      if(k==='special')return 'Special Assignment';
      if(k==='vacant')return 'Vacant Position';
      return x.label||x.status||k||'Status';
    };
    const group=x=>{const k=kind(x);return (k==='full'||k==='half')?'leave':(k==='od'||k==='special')?'duty':k==='vacant'?'vacant':'other'};
    const dedupe=arr=>{
      const seen=new Set();return arr.filter(x=>{const key=[x.code,kind(x),x.category||'',x.note||x.remarks||'',x.startDate||'',x.endDate||''].join('|');if(seen.has(key))return false;seen.add(key);return true});
    };
    async function authoritativeSummary(){
      const input=document.getElementById('historyDate');const date=toIso(input&&input.value);if(!date)return;
      const [daySnap,plansSnap]=await Promise.all([
        fs.getDoc(fs.doc(db,'dailyRecords',date)),
        fs.getDoc(fs.doc(db,'dailyRecords','__leavePlans'))
      ]);
      const rows=[];
      if(daySnap.exists()){
        const d=daySnap.data()||{};(d.statuses||[]).forEach(x=>{if(x&&x.active!==false&&x.deleted!==true)rows.push({...x,_source:'daily'})});
      }
      if(plansSnap.exists()){
        const d=plansSnap.data()||{};Object.values(d.plans||{}).forEach(p=>{if(covers(p,date))rows.push({...p,_source:'scheduled'})});
      }
      const clean=dedupe(rows),leave=clean.filter(x=>group(x)==='leave'),duty=clean.filter(x=>group(x)==='duty'),vacant=clean.filter(x=>group(x)==='vacant');
      const fmt=a=>a.length?a.map(x=>`<div class="v662-history-item"><b>${esc(teacherName(x.code))}</b> <span>${esc(x.code||'')}</span> · ${esc(label(x))}${x.note||x.remarks?` · ${esc(x.note||x.remarks)}`:''}</div>`).join(''):'<div class="v662-none">None</div>';
      const block=`<div class="v662-authoritative-history"><h3>Regular Leave</h3>${fmt(leave)}<h3>Duty Leave · OD / Special Assignment</h3>${fmt(duty)}<h3>Operational Status · Vacant Position</h3>${fmt(vacant)}</div>`;
      const host=document.getElementById('historyResult');if(!host)return;
      let heading=[...host.querySelectorAll('h2,h3,h4,strong')].find(n=>/Leave\s*\/\s*OD\s*\/\s*Special Assignment\s*\/\s*Vacant/i.test(n.textContent||''));
      if(heading){
        const next=heading.nextElementSibling;heading.insertAdjacentHTML('beforebegin',block);heading.style.display='none';if(next&&/^None$/i.test((next.textContent||'').trim()))next.style.display='none';
      }else if(!host.querySelector('.v662-authoritative-history'))host.insertAdjacentHTML('afterbegin',block);
    }

    const wait=()=>{
      if(typeof window.renderHistory!=='function')return setTimeout(wait,120);
      if(window.renderHistory.__v662Wrapped)return;
      const orig=window.renderHistory;
      const wrapped=function(...args){const r=orig.apply(this,args);Promise.resolve(r).finally(()=>setTimeout(()=>authoritativeSummary().catch(e=>console.warn('Daily History summary:',e)),40));return r};
      wrapped.__v662Wrapped=true;window.renderHistory=wrapped;
      const input=document.getElementById('historyDate');if(input)input.addEventListener('change',()=>setTimeout(()=>authoritativeSummary().catch(()=>{}),80));
    };
    wait();
  }catch(e){console.warn('Daily History enhancer:',e)}
})();
