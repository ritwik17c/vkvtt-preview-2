(()=>{
  'use strict';
  let apiReady=null,events=[],loaded=false,applying=false,baseManualExclusions=new Set();
  const $=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const isoDate=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const parse=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12)};
  const fmt=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:v};

  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getFirestore,getDoc,doc}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{db:getFirestore(app),getDoc,doc};
    })();return apiReady;
  }

  function blocksEvent(ev){
    const cat=String(ev?.cat||ev?.category||'').toLowerCase(),title=String(ev?.title||'').toLowerCase();
    if(cat==='holiday'||cat==='restricted'||cat==='celebration')return true;
    if(cat==='session'&&/(vacation|break)/i.test(title))return true;
    return false;
  }
  function datesFor(ev){
    const start=parse(ev.start||ev.date),end=parse(ev.end||ev.start||ev.date);if(!start||!end)return[];
    const out=[];for(const d=new Date(start);d<=end;d.setDate(d.getDate()+1))out.push(isoDate(d));return out;
  }
  function blockedMap(){
    const map=new Map();
    for(const ev of events){if(!blocksEvent(ev))continue;for(const date of datesFor(ev)){if(!map.has(date))map.set(date,[]);map.get(date).push(String(ev.title||'Academic Calendar restriction'))}}
    return map;
  }

  async function load(){
    try{
      const a=await api(),snap=await a.getDoc(a.doc(a.db,'annualCalendar','current'));
      if(snap.exists()&&Array.isArray(snap.data()?.events))events=snap.data().events;
      else{const mod=await import('./annual-calendar-data.js?v=20260907-exam-date-guard-1');events=mod.DEFAULT_ANNUAL_CALENDAR_EVENTS||[]}
    }catch{
      try{const mod=await import('./annual-calendar-data.js?v=20260907-exam-date-guard-1');events=mod.DEFAULT_ANNUAL_CALENDAR_EVENTS||[]}catch{events=[]}
    }
    loaded=true;
  }

  function ensureNotice(){
    if($('examCalendarGuardNotice'))return $('examCalendarGuardNotice');
    const preview=$('datePreview');if(!preview)return null;
    const n=document.createElement('div');n.id='examCalendarGuardNotice';n.className='notice info';n.style.marginTop='10px';preview.after(n);return n;
  }

  function readManualExclusions(){
    const input=$('excludedDates');if(!input)return;
    if(input.dataset.calendarGuardInit==='1')return;
    baseManualExclusions=new Set(String(input.value||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean));input.dataset.calendarGuardInit='1';
  }

  function apply(){
    if(!loaded||applying)return;const start=$('startDate')?.value,end=$('endDate')?.value;if(!start||!end)return;
    applying=true;
    try{
      readManualExclusions();const blocked=blockedMap(),auto=[];
      const a=parse(start),b=parse(end);if(a&&b)for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1)){
        const date=isoDate(d);if(d.getDay()===0){if(!blocked.has(date))blocked.set(date,[]);blocked.get(date).push('Sunday')}
        if(blocked.has(date))auto.push(date);
      }
      const input=$('excludedDates');
      if(input){
        const merged=[...new Set([...baseManualExclusions,...auto])].sort(),next=merged.join(', ');
        if(input.value!==next){input.value=next;input.dispatchEvent(new Event('change',{bubbles:true}))}
      }
      setTimeout(()=>decorate(blocked),50);
    }finally{setTimeout(()=>{applying=false},80)}
  }

  function decorate(blocked){
    const rows=[];
    for(const box of document.querySelectorAll('[data-exam-date]')){
      const date=box.dataset.examDate,reasons=blocked.get(date)||[],label=box.closest('label');
      if(reasons.length){box.checked=false;box.disabled=true;if(label){label.style.opacity='.62';label.style.textDecoration='line-through';label.title='Invalid examination date: '+reasons.join('; ')}}
      else if(label){box.disabled=false;label.style.opacity='';label.style.textDecoration='';label.title='Valid examination date'}
    }
    const a=parse($('startDate')?.value),b=parse($('endDate')?.value);if(a&&b){for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1)){const k=isoDate(d),r=blocked.get(k);if(r?.length)rows.push(`<b>${safe(fmt(k))}</b> — ${safe([...new Set(r)].join('; '))}`)}}
    const n=ensureNotice();if(n){
      n.className='notice '+(rows.length?'warn':'success');
      n.innerHTML=rows.length?`<b>Academic Calendar check:</b> ${rows.length} date${rows.length===1?' is':'s are'} unavailable for examinations.<br><small>${rows.join(' · ')}</small><br><small>Observances remain valid examination days unless the same date is also a Sunday, holiday/vacation or celebration.</small>`:'<b>Academic Calendar check passed.</b> No Sunday, holiday/vacation or celebration conflicts in this range. Observances remain valid.';
    }
  }

  document.addEventListener('change',e=>{
    if(['startDate','endDate'].includes(e.target.id)){baseManualExclusions=new Set(String($('excludedDates')?.value||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean));setTimeout(apply,60)}
    if(e.target.id==='excludedDates'&&!applying){baseManualExclusions=new Set(String(e.target.value||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean));setTimeout(apply,80)}
  },true);
  document.addEventListener('click',e=>{if(e.target.closest?.('#selectAllExamDates,[data-pane-target="setup"],[data-open-cloud],[data-real-open],[data-real-use-template]'))setTimeout(apply,180)},true);
  const root=$('examApp')||document.body;let timer=null;
  new MutationObserver(()=>{if(timer)clearTimeout(timer);timer=setTimeout(apply,80)}).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',async()=>{await load();setTimeout(apply,500);setTimeout(apply,1200)});
})();
