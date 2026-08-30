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
  try{
    const appMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const authMod=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
    const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(cfg);
    const auth=authMod.getAuth(app);
    await authMod.setPersistence(auth,authMod.browserLocalPersistence);
  }catch(e){console.warn('Auth persistence:',e)}

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
