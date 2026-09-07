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
    const [{getApps,getApp},{getFirestore,getDoc,getDocs,doc,collection}]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
    ]);
    const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
    return{db:getFirestore(app),getDoc,getDocs,doc,collection};
  }
  function patterns(data){const out=[];for(const x of data?.template?.timetablePattern||[])out.push(x);for(const x of data?.manualTimetable?.assignments||[])out.push({className:x.className,subject:x.subject,slotId:x.slotId,roomId:x.roomId,dayIndex:x.dayIndex});for(const x of data?.workspace?.timetable?.events||[])out.push({className:x.className,subject:x.subject,slotId:x.slotId,roomId:x.roomId,date:x.date});return out}
  function normalizedPattern(data,source,allowedClasses){
    const allowed=allowedClasses&&allowedClasses.size?allowedClasses:null;
    const direct=[...(data?.template?.timetablePattern||[])].filter(x=>!allowed||allowed.has(base(x.className)));if(direct.length)return direct.map(x=>({...x,className:base(x.className),subject:subject(x.subject)}));
    const events=[...(source?.workspace?.timetable?.events||[]),...(data?.workspace?.timetable?.events||[])].filter(x=>x?.className&&x?.subject&&x?.date&&(!allowed||allowed.has(base(x.className)))).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.slotId||'').localeCompare(String(b.slotId||''))||String(a.className).localeCompare(String(b.className),undefined,{numeric:true}));
    const dates=[...new Set(events.map(x=>String(x.date)))],index=new Map(dates.map((d,i)=>[d,i+1]));
    return events.map(x=>({dayIndex:index.get(String(x.date))||1,className:base(x.className),subject:subject(x.subject),slotId:String(x.slotId||''),roomId:String(x.roomId||'')}));
  }
  function mergeTemplate(data,source){
    const raw=JSON.parse(JSON.stringify(data?.template||{})),savedClasses=[...new Set((raw.classes||[]).map(base).filter(Boolean))],classes=new Set(savedClasses),subjects=new Map(),paperMeta={},authoritative=savedClasses.length>0;
    const classAllowed=c=>!authoritative||classes.has(base(c));
    const add=(c,s)=>{c=base(c);s=subject(s);if(!c||!s||!classAllowed(c))return;if(!authoritative)classes.add(c);if(!subjects.has(c))subjects.set(c,new Map());subjects.get(c).set(key(c,s),s)};
    const addMeta=(c,s,obj={})=>{c=base(c);s=subject(s);if(!c||!s||!classAllowed(c))return;const k=key(c,s),old=paperMeta[k]||{};paperMeta[k]={...old,roomId:String(obj.roomId||old.roomId||''),fixedSlotId:String(obj.fixedSlotId||obj.slotId||old.fixedSlotId||'')}};
    for(const c of classes)subjects.set(c,new Map());
    const actualPattern=normalizedPattern(data,source,classes);
    if(actualPattern.length){
      for(const p of actualPattern){add(p.className,p.subject);addMeta(p.className,p.subject,p)}
    }else{
      for(const [c,subs] of Object.entries(raw.subjects||{}))for(const s of subs||[])add(c,s);
      for(const p of patterns(data))if(classAllowed(p.className)){add(p.className,p.subject);addMeta(p.className,p.subject,p)}
      for(const src of[data,source])for(const p of src?.workspace?.papers||[]){const c=base(p.className),s=subject(p.subject);if(c&&s&&classAllowed(c)&&p.included!==false){add(c,s);addMeta(c,s,p)}}
    }
    for(const src of[data,source])for(const p of src?.workspace?.papers||[]){const c=base(p.className),s=subject(p.subject);if(c&&s&&classAllowed(c))addMeta(c,s,p)}
    const settings={...(source?.workspace?.settings||{}),...(raw.settings||{})},sessions=(raw.sessions?.length?raw.sessions:source?.workspace?.slots)||[],printDetails=raw.printDetails||source?.workspace?.printDetails||{},subjectObj={};
    for(const c of classes)subjectObj[c]=[...(subjects.get(c)?.values()||[])];
    return{...raw,classes:[...classes],subjects:subjectObj,settings,sessions,printDetails,paperMeta,timetablePattern:actualPattern,description:String(raw.description||source?.workspace?.description||data?.description||'')};
  }
  async function findLegacySource(api,data,id){
    const target=String(data.sourceScheduleName||data.name||'').replace(/\s+Template$/i,'').trim().toLowerCase();if(!target)return{};
    try{const snap=await api.getDocs(api.collection(api.db,'examSchedules')),items=[];snap.forEach(d=>{if(d.id===id||/^TEMPLATE_/i.test(d.id)||d.id==='EXAM_SUBJECT_MASTER')return;const x=d.data()||{},name=String(x.name||x.workspace?.name||'').trim().toLowerCase();if(name===target&&x.workspace)items.push(x)});items.sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));return items[0]||{}}catch{return{}}
  }
  async function getTemplate(id){const api=await firebase(),snap=await api.getDoc(api.doc(api.db,'examSchedules',id));if(!snap.exists())throw new Error('Saved template not found.');const data=snap.data()||{};let source={};if(data.sourceScheduleId){try{const s=await api.getDoc(api.doc(api.db,'examSchedules',data.sourceScheduleId));if(s.exists())source=s.data()||{}}catch{}}if(!source?.workspace)source=await findLegacySource(api,data,id);return{template:mergeTemplate(data,source),name:data.name||'Saved Template'}}
  async function waitControls(){for(let i=0;i<80;i++){if($('paperClassFilter')?.options?.length>1&&$('paperRows')&&$('sessionRows')&&window.vkvExamWorkspace)return true;await wait(100)}return false}

  async function enforceMajorSubjects(t){
    const wanted=new Set();for(const[c,subs]of Object.entries(t.subjects||{}))for(const s of subs||[])wanted.add(key(c,s));
    const allowed=new Set((t.classes||[]).map(base));
    for(let round=0;round<220;round++){
      const boxes=[...document.querySelectorAll('[data-major-subject],[data-exam-only-subject]')];
      let mismatch=null;
      for(const box of boxes){
        const c=base(box.dataset.majorSubjectClass||box.dataset.examOnlyClass||''),s=subject(box.dataset.majorSubject||box.dataset.examOnlySubject||'');if(!c||!s||!allowed.has(c))continue;
        const on=wanted.has(key(c,s));if(box.checked!==on){mismatch={box,on};break}
      }
      if(!mismatch)return;
      mismatch.box.checked=mismatch.on;dispatch(mismatch.box);await wait(75);
    }
  }

  async function applySubjects(t){
    if(window.vkvExamWorkspace?.installSubjectCatalogue){window.vkvExamWorkspace.installSubjectCatalogue(t.subjects||{});await wait(350)}
    const wanted=new Set();for(const[c,subs]of Object.entries(t.subjects||{}))for(const s of subs||[])wanted.add(key(c,s));
    const f=$('paperClassFilter'),search=$('paperSearch');if(!f||!search)return 0;const oldF=f.value,oldS=search.value;search.value='';dispatch(search,'input');
    const rawClasses=[...f.options].map(o=>o.value).filter(Boolean);
    for(const raw of rawClasses){
      for(let round=0;round<120;round++){
        f.value=raw;dispatch(f);await wait(18);
        const rows=[...document.querySelectorAll('#paperRows tr[data-paper]')];let mismatch=null;
        for(const row of rows){
          const c=base(row.cells?.[1]?.textContent||raw),s=subject(row.cells?.[2]?.textContent||''),box=row.querySelector('[data-paper-field="included"]');if(!box)continue;
          const on=wanted.has(key(c,s));if(box.checked!==on){mismatch={box,on};break}
        }
        if(!mismatch)break;
        mismatch.box.checked=mismatch.on;dispatch(mismatch.box);await wait(45);
      }
      f.value=raw;dispatch(f);await wait(20);
      for(const row of [...document.querySelectorAll('#paperRows tr[data-paper]')]){
        const c=base(row.cells?.[1]?.textContent||raw),s=subject(row.cells?.[2]?.textContent||''),on=wanted.has(key(c,s));if(!on)continue;
        const meta=t.paperMeta?.[key(c,s)]||{},room=row.querySelector('[data-paper-field="roomId"]'),slot=row.querySelector('[data-paper-field="fixedSlotId"]'),date=row.querySelector('[data-paper-field="fixedDate"]');
        if(room&&meta.roomId&&room.value!==meta.roomId){room.value=meta.roomId;dispatch(room);await wait(20)}if(slot&&meta.fixedSlotId&&slot.value!==meta.fixedSlotId){slot.value=meta.fixedSlotId;dispatch(slot);await wait(20)}if(date&&date.value){date.value='';dispatch(date);await wait(20)}
      }
    }
    f.value=oldF;dispatch(f);search.value=oldS;dispatch(search,'input');await wait(220);
    await enforceMajorSubjects(t);await wait(150);
    let selected=0;for(const box of document.querySelectorAll('[data-major-subject]:checked,[data-exam-only-subject]:checked')){const c=base(box.dataset.majorSubjectClass||box.dataset.examOnlyClass||''),s=subject(box.dataset.majorSubject||box.dataset.examOnlySubject||'');if(wanted.has(key(c,s)))selected++}
    return selected||wanted.size;
  }
  async function applySessions(t){const slots=t.sessions||[];if(!slots.length)return;let rows=()=>[...document.querySelectorAll('#sessionRows [data-session-row]')];while(rows().length<slots.length){$('addSession')?.click();await wait(35)}while(rows().length>slots.length&&rows().length>1){rows().at(-1)?.querySelector('[data-remove-session]')?.click();await wait(35)}slots.forEach((slot,i)=>{const row=rows()[i];if(!row)return;for(const field of['name','startTime','endTime','durationMinutes']){const el=row.querySelector(`[data-session-field="${field}"]`);if(el&&slot?.[field]!=null){el.value=slot[field];dispatch(el)}}})}
  function applyReusableSettings(t){const s=t.settings||{},set=(id,val,type='change')=>{const el=$(id);if(!el||val==null)return;el.value=String(val);dispatch(el,type);dispatch(el)};const max=$('maxPerDay');if(max&&s.maxExamsPerClassPerDay){max.value=String(s.maxExamsPerClassPerDay);dispatch(max)}const dbl=$('allowDoubleBooking');if(dbl&&s.allowDoubleBooking!=null){dbl.checked=s.allowDoubleBooking===true;dispatch(dbl)}if(Array.isArray(s.excludedWeekdays))for(const b of document.querySelectorAll('[data-weekday]')){const on=s.excludedWeekdays.map(Number).includes(Number(b.dataset.weekday));if(b.checked!==on){b.checked=on;dispatch(b)}}set('invigilatorsPerRoom',s.invigilatorsPerRoom);set('maxInvigPerDay',s.maxInvigilationPerDay);set('relieversPerSession',s.relieversPerSession);const own=$('avoidOwnSubject');if(own&&s.avoidOwnSubject!=null){own.checked=s.avoidOwnSubject===true;dispatch(own)}set('relieverStart',s.relieverStart);set('relieverEnd',s.relieverEnd)}
  function resetFreshDates(){for(const id of['startDate','endDate','excludedDates','customDates']){const el=$(id);if(el){el.value='';dispatch(el,'input');dispatch(el)}}const cadence=$('cadence');if(cadence){cadence.value='custom';dispatch(cadence,'input');dispatch(cadence)}for(const b of document.querySelectorAll('[data-exam-date]'))if(b.checked){b.checked=false;dispatch(b)}}
  function applyPrintDetails(t){const p=t.printDetails||{};let applied=false;for(const[id,v]of[['examFooterReporting',p.reporting],['examFooterBus',p.bus],['examFooterDeparture',p.departure]]){const el=$(id);if(el&&v){el.value=v;dispatch(el);applied=true}}return applied}
  function applyDescription(t){const el=$('workspaceDescription');if(el&&t.description){el.value=t.description;dispatch(el,'input');dispatch(el)}}
  function setTitle(value){const el=$('workspaceName');if(!el)return;el.value=value;dispatch(el,'input');dispatch(el)}
  function forceSetup(){document.querySelectorAll('.navButton').forEach(b=>b.classList.toggle('active',b.dataset.paneTarget==='setup'));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.dataset.pane==='setup'));document.querySelector('[data-pane-target="setup"]')?.click()}
  function goSetup(name,count){forceSetup();[80,220,500,900].forEach(ms=>setTimeout(()=>{forceSetup();resetFreshDates()},ms));setTimeout(()=>$('startDate')?.parentElement?.scrollIntoView({behavior:'smooth',block:'center'}),180);const m=$('majorTemplateMsg');if(m){m.className='notice success';m.innerHTML=`<b>${name}</b> loaded. ${count} subject selection(s), sessions, timetable pattern and reusable settings were imported. Choose a fresh date range and tick the required examination dates. Previous dates were not imported.`}}
  async function use(id){if(busy)return;busy=true;try{const{template,name}=await getTemplate(id);if(!confirm(`Create a new editable timetable from “${name}”?\n\nAll reusable components will be imported: classes, subjects, sessions, timetable pattern, rooms/sessions, reporting/departure setup and reusable settings.\n\nPrevious examination dates will NOT be imported. You will start again from Step 1.`))return;$('newDraft')?.click();if(!await waitControls())throw new Error('Examination controls are not ready.');const suggested=String(name).replace(/\s+Template$/i,'').trim()||'New Examination Schedule',entered=prompt('Name for the new examination draft:',suggested);if(entered===null)return;const finalName=entered.trim()||suggested;await applySessions(template);const count=await applySubjects(template);applyReusableSettings(template);applyDescription(template);applyPrintDetails(template);resetFreshDates();goSetup(name,count);await wait(220);resetFreshDates();setTitle(finalName);await wait(150);setTitle(finalName);[400,900,1600].forEach(ms=>setTimeout(()=>applyPrintDetails(template),ms));document.dispatchEvent(new CustomEvent('vkv-exam-template-fresh-draft',{detail:{name:finalName,timetablePattern:template.timetablePattern||[],subjects:template.subjects||{},classes:template.classes||[]}}));const saveState=$('saveState');if(saveState)saveState.textContent='Unsaved — press Save Cloud Draft when ready.';}catch(e){alert('Could not start from template: '+(e.message||e))}finally{busy=false}}
  window.addEventListener('click',e=>{const b=e.target.closest?.('[data-real-use-template]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();use(String(b.dataset.realUseTemplate||''))},true);
})();
