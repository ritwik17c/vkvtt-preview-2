(()=>{
  'use strict';
  window.__vkvFreshTemplateFlow=true;
  const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
  const base=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,g)=>g.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const subject=v=>{let s=String(v||'').trim().replace(/\s+/g,' ');if(/^(?:as|assamese)$/i.test(s))return'Assamese';if(/^(?:eng|english)$/i.test(s))return'English';if(/^(?:sci|science)$/i.test(s))return'Science';if(/^(?:ssc|social science)$/i.test(s))return'Social Science';if(/^(?:sans|sanskrit)$/i.test(s))return'Sanskrit';if(/^information technology/i.test(s)||/^it(?:\s|$)/i.test(s))return'IT';if(/^maths?(?:\s|$)/i.test(s)||/^mathematics$/i.test(s))return'Maths';if(/^hindi$/i.test(s))return'Hindi';return s};
  const key=(c,s)=>base(c).toLowerCase()+'|'+subject(s).toLowerCase().replace(/[^a-z0-9]+/g,'');
  const dispatch=(el,type='change')=>el?.dispatchEvent(new Event(type,{bubbles:true}));
  let busy=false;

  async function firebase(){
    const [{getApps,getApp},{getFirestore,getDoc,doc}]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
    ]);
    const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
    return{db:getFirestore(app),getDoc,doc};
  }

  function patterns(data){
    const out=[];
    for(const x of data?.template?.timetablePattern||[])out.push(x);
    for(const x of data?.manualTimetable?.assignments||[])out.push({className:x.className,subject:x.subject,slotId:x.slotId,roomId:x.roomId});
    for(const x of data?.workspace?.timetable?.events||[])out.push({className:x.className,subject:x.subject,slotId:x.slotId,roomId:x.roomId});
    return out;
  }

  function mergeTemplate(data,source){
    const raw=JSON.parse(JSON.stringify(data?.template||{})),classes=new Set(),subjects=new Map();
    const add=(c,s)=>{c=base(c);s=subject(s);if(!c||!s)return;classes.add(c);if(!subjects.has(c))subjects.set(c,new Map());subjects.get(c).set(key(c,s),s)};
    for(const c of raw.classes||[])if(base(c))classes.add(base(c));
    for(const [c,subs] of Object.entries(raw.subjects||{}))for(const s of subs||[])add(c,s);
    for(const p of [...patterns(data),...patterns(source)])add(p.className,p.subject);
    const target=new Set(classes);
    for(const src of [data,source])for(const p of src?.workspace?.papers||[]){const c=base(p.className),s=subject(p.subject);if(c&&s&&(!target.size||target.has(c)))add(c,s)}
    const settings={...(source?.workspace?.settings||{}),...(raw.settings||{})};
    const sessions=(raw.sessions?.length?raw.sessions:source?.workspace?.slots)||[];
    const printDetails=raw.printDetails||source?.workspace?.printDetails||{};
    const subjectObj={};for(const c of classes)subjectObj[c]=[...(subjects.get(c)?.values()||[])];
    return{...raw,classes:[...classes],subjects:subjectObj,settings,sessions,printDetails};
  }

  async function getTemplate(id){
    const api=await firebase(),snap=await api.getDoc(api.doc(api.db,'examSchedules',id));if(!snap.exists())throw new Error('Saved template not found.');
    const data=snap.data()||{};let source={};
    if(data.sourceScheduleId){try{const s=await api.getDoc(api.doc(api.db,'examSchedules',data.sourceScheduleId));if(s.exists())source=s.data()||{}}catch{}}
    return{template:mergeTemplate(data,source),name:data.name||'Saved Template'};
  }

  async function waitControls(){for(let i=0;i<80;i++){if($('paperClassFilter')?.options?.length>1&&$('paperRows')&&$('sessionRows')&&window.vkvExamWorkspace)return true;await wait(100)}return false}

  async function applySubjects(t){
    if(window.vkvExamWorkspace?.installSubjectCatalogue){window.vkvExamWorkspace.installSubjectCatalogue(t.subjects||{});await wait(220)}
    const wanted=new Set();for(const [c,subs] of Object.entries(t.subjects||{}))for(const s of subs||[])wanted.add(key(c,s));
    const f=$('paperClassFilter'),search=$('paperSearch');if(!f||!search)return 0;const oldF=f.value,oldS=search.value;search.value='';dispatch(search,'input');
    let selected=0;
    for(const raw of [...f.options].map(o=>o.value).filter(Boolean)){
      f.value=raw;dispatch(f);await wait(12);
      for(const row of [...document.querySelectorAll('#paperRows tr[data-paper]')]){
        const c=base(row.cells?.[1]?.textContent||raw),s=subject(row.cells?.[2]?.textContent||''),box=row.querySelector('[data-paper-field="included"]'),on=wanted.has(key(c,s));
        if(on)selected++;if(box&&box.checked!==on){box.checked=on;dispatch(box);await wait(5)}
      }
    }
    f.value=oldF;dispatch(f);search.value=oldS;dispatch(search,'input');await wait(120);return selected;
  }

  async function applySessions(t){
    const slots=t.sessions||[];if(!slots.length)return;let rows=()=>[...document.querySelectorAll('#sessionRows [data-session-row]')];
    while(rows().length<slots.length){$('addSession')?.click();await wait(35)}
    while(rows().length>slots.length&&rows().length>1){rows().at(-1)?.querySelector('[data-remove-session]')?.click();await wait(35)}
    slots.forEach((slot,i)=>{const row=rows()[i];if(!row)return;for(const field of['name','startTime','endTime','durationMinutes']){const el=row.querySelector(`[data-session-field="${field}"]`);if(el&&slot?.[field]!=null){el.value=slot[field];dispatch(el)}}});
  }

  function applyReusableSettings(t){
    const s=t.settings||{};
    const max=$('maxPerDay');if(max&&s.maxExamsPerClassPerDay){max.value=String(s.maxExamsPerClassPerDay);dispatch(max)}
    if(Array.isArray(s.excludedWeekdays))for(const b of document.querySelectorAll('[data-weekday]')){const on=s.excludedWeekdays.map(Number).includes(Number(b.dataset.weekday));if(b.checked!==on){b.checked=on;dispatch(b)}}
  }

  function resetFreshDates(){
    for(const id of['startDate','endDate','excludedDates','customDates']){const el=$(id);if(el){el.value='';dispatch(el,'input');dispatch(el)}}
    const cadence=$('cadence');if(cadence){cadence.value='custom';dispatch(cadence,'input');dispatch(cadence)}
    for(const b of document.querySelectorAll('[data-exam-date]')){if(b.checked){b.checked=false;dispatch(b)}}
  }

  function applyPrintDetails(t){const p=t.printDetails||{};for(const [id,v] of [['examFooterReporting',p.reporting],['examFooterBus',p.bus],['examFooterDeparture',p.departure]]){const el=$(id);if(el&&v){el.value=v;dispatch(el)}}}

  function forceSetup(){
    document.querySelectorAll('.navButton').forEach(b=>b.classList.toggle('active',b.dataset.paneTarget==='setup'));
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.dataset.pane==='setup'));
    document.querySelector('[data-pane-target="setup"]')?.click();
  }

  function goSetup(name,count){
    forceSetup();
    [80,220,500,900].forEach(ms=>setTimeout(()=>{forceSetup();resetFreshDates()},ms));
    setTimeout(()=>$('startDate')?.parentElement?.scrollIntoView({behavior:'smooth',block:'center'}),180);
    const m=$('majorTemplateMsg');if(m){m.className='notice success';m.innerHTML=`<b>${name}</b> loaded. ${count} subject selection(s), sessions and reusable settings were imported. Choose a fresh date range and tick the required examination dates. Previous dates were not imported.`}
  }

  async function use(id){
    if(busy)return;busy=true;
    try{
      const {template,name}=await getTemplate(id);
      if(!confirm(`Create a new editable timetable from “${name}”?\n\nClasses, subjects, sessions and reusable settings will be imported.\n\nPrevious examination dates will NOT be imported. You will start again from Step 1.`))return;
      $('newDraft')?.click();if(!await waitControls())throw new Error('Examination controls are not ready.');
      const suggested=String(name).replace(/\s+Template$/i,'').trim()||'New Examination Schedule',entered=prompt('Name for the new examination draft:',suggested);if(entered===null)return;
      if($('workspaceName')){$('workspaceName').value=entered.trim()||suggested;dispatch($('workspaceName'),'input');dispatch($('workspaceName'))}
      await applySessions(template);
      const count=await applySubjects(template);
      applyReusableSettings(template);
      applyPrintDetails(template);
      resetFreshDates();
      goSetup(name,count);
      await wait(180);
      resetFreshDates();
      $('saveDraft')?.click();
    }catch(e){alert('Could not start from template: '+(e.message||e))}finally{busy=false}
  }

  window.addEventListener('click',e=>{const b=e.target.closest?.('[data-real-use-template]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();use(String(b.dataset.realUseTemplate||''))},true);
})();