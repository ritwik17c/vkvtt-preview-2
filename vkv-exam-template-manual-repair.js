(()=>{
  'use strict';
  const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,g)=>g.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const subject=v=>{let s=String(v||'').trim().replace(/\s+/g,' ');if(/^information technology/i.test(s)||/^it(?:\s|$)/i.test(s))return'IT';if(/^maths?(?:\s|$)/i.test(s)||/^mathematics$/i.test(s))return'Maths';return s};
  const sk=v=>subject(v).toLowerCase();
  const parts=v=>subject(v).split(/\s*(?:\/|&|,|\band\b)\s*/i).map(sk).filter(Boolean);
  let fb=null;

  function injectWrapFix(){
    if($('examPrintWrapFix'))return;
    const s=document.createElement('style');s.id='examPrintWrapFix';s.textContent=`
      .majorMatrix,#majorFormattedPreview table,#majorOfficialPrint table{table-layout:fixed!important;width:100%!important}
      .majorMatrix th,.majorMatrix td,#majorFormattedPreview th,#majorFormattedPreview td,#majorOfficialPrint th,#majorOfficialPrint td{white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;min-width:0!important;max-width:none!important;vertical-align:middle!important}
      .majorMatrix select{width:100%!important;min-width:0!important;max-width:100%!important}
      #majorFormattedPreview td,#majorOfficialPrint td{line-height:1.18!important}
      @media print{#majorOfficialPrint th,#majorOfficialPrint td{font-size:8.2pt!important;line-height:1.16!important;padding:5px 3px!important}}
    `;document.head.appendChild(s);
  }
  injectWrapFix();

  async function firebase(){if(fb)return fb;const [{getApps,getApp},{getAuth},{getFirestore,getDoc,doc}]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')]);const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');return fb={auth:getAuth(app),db:getFirestore(app),getDoc,doc}}
  function dispatch(el,type='change'){el?.dispatchEvent(new Event(type,{bubbles:true}))}
  async function waitMajor(){for(let i=0;i<50;i++){if(document.querySelectorAll('[data-major-class]').length&&$('majorSubjectGrid'))return true;await wait(100)}return false}
  function subjectBoxes(c){return[...document.querySelectorAll('[data-major-subject][data-major-subject-class]')].filter(b=>base(b.dataset.majorSubjectClass)===base(c))}

  function patternFromSource(data){
    const manual=data?.manualTimetable?.assignments||[];
    if(manual.length){const dates=[...new Set(manual.map(x=>x.date).filter(Boolean))].sort(),idx=new Map(dates.map((d,i)=>[d,i+1]));return manual.map(x=>({dayIndex:idx.get(x.date),className:base(x.className),subject:subject(x.subject),slotId:String(x.slotId||''),roomId:String(x.roomId||'')})).filter(x=>x.dayIndex&&x.className&&x.subject)}
    const events=data?.workspace?.timetable?.events||[];if(!events.length)return[];
    const dates=[...new Set(events.map(x=>x.date).filter(Boolean))].sort(),idx=new Map(dates.map((d,i)=>[d,i+1]));
    return events.map(x=>({dayIndex:idx.get(x.date),className:base(x.className),subject:subject(x.subject),slotId:String(x.slotId||''),roomId:String(x.roomId||'')})).filter(x=>x.dayIndex&&x.className&&x.subject)
  }

  function canonicalTemplate(raw,sourcePattern=[]){
    const t=JSON.parse(JSON.stringify(raw||{})),classes=new Set(),subjectMaps=new Map(),patterns=new Map();
    const add=(c,s)=>{c=base(c);s=subject(s);if(!c||!s)return;classes.add(c);if(!subjectMaps.has(c))subjectMaps.set(c,new Map());subjectMaps.get(c).set(sk(s),s)};
    for(const c of t.classes||[]){const b=base(c);if(b)classes.add(b)}
    for(const [c,subs] of Object.entries(t.subjects||{}))for(const s of subs||[])add(c,s);
    for(const p of [...(t.timetablePattern||[]),...sourcePattern]){const item={...p,dayIndex:Number(p.dayIndex),className:base(p.className),subject:subject(p.subject)};if(!item.dayIndex||!item.className||!item.subject)continue;add(item.className,item.subject);const k=item.dayIndex+'|'+item.className+'|'+sk(item.subject)+'|'+String(item.slotId||'');if(!patterns.has(k))patterns.set(k,item)}
    const subjects={};for(const c of classes)subjects[c]=[...(subjectMaps.get(c)?.values()||[])];
    return {...t,classes:[...classes],subjects,timetablePattern:[...patterns.values()].sort((a,b)=>a.dayIndex-b.dayIndex||a.className.localeCompare(b.className,undefined,{numeric:true}))}
  }

  function matchesCurrent(current,wanted){
    if(wanted.has(sk(current)))return true;
    const cp=new Set(parts(current));
    for(const w of wanted){if(cp.has(w))return true;for(const p of parts(w))if(cp.has(p))return true}
    return false
  }

  async function templateData(id){
    const api=await firebase(),snap=await api.getDoc(api.doc(api.db,'examSchedules',id));if(!snap.exists())throw new Error('Saved template not found.');
    const data=snap.data()||{};let sourcePattern=[];
    if(data.sourceScheduleId){try{const src=await api.getDoc(api.doc(api.db,'examSchedules',data.sourceScheduleId));if(src.exists())sourcePattern=patternFromSource(src.data()||{})}catch{}}
    const t=canonicalTemplate(data.template||{},sourcePattern);
    return{data,t,name:data.name||'Saved Template'}
  }

  async function applySelections(t){
    const classes=[...new Set((t.classes||[]).map(base).filter(Boolean))],classSet=new Set(classes);
    for(const b of document.querySelectorAll('[data-major-class]')){const on=classSet.has(base(b.dataset.majorClass));if(b.checked!==on){b.checked=on;dispatch(b);await wait(100)}}
    await wait(300);
    for(const c of classes){const wanted=new Set((t.subjects?.[c]||[]).map(sk));for(const b of subjectBoxes(c)){const on=matchesCurrent(b.dataset.majorSubject,wanted);if(b.checked!==on){b.checked=on;dispatch(b);await wait(55)}}}
    await wait(250)
  }

  function optsFor(t,c){return[...new Map([...(t.subjects?.[c]||[]),...(t.timetablePattern||[]).filter(x=>base(x.className)===c).map(x=>subject(x.subject))].filter(Boolean).map(s=>[sk(s),subject(s)])).values()]}

  function renderTemplateEditor(t,name){
    document.querySelector('[data-pane-target="timetable"]')?.click();const pane=document.querySelector('[data-pane="timetable"]');if(!pane)return;
    $('templatePatternQuickEdit')?.remove();const box=document.createElement('article');box.id='templatePatternQuickEdit';box.className='surface';const pattern=t.timetablePattern||[];
    if(!pattern.length){box.innerHTML=`<div class="notice info"><b>${esc(name)}</b> has no stored timetable pattern. All available classes and subjects have been imported; prepare the timetable manually below.</div>`;pane.prepend(box);return}
    const days=[...new Set(pattern.map(x=>Number(x.dayIndex)).filter(Boolean))].sort((a,b)=>a-b),classes=[...new Set((t.classes||[]).map(base).filter(Boolean))],by=new Map();
    for(const p of pattern){const k=Number(p.dayIndex)+'|'+base(p.className),a=by.get(k)||[];if(!a.some(x=>sk(x)===sk(p.subject)))a.push(subject(p.subject));by.set(k,a)}
    box.innerHTML=`<div class="sectionTitle"><div><h3>Template Timetable · Edit</h3><p>All subjects from the saved template and its source timetable are merged class-wise. Edit the pattern, choose new dates, then apply it to the manual timetable.</p></div></div><div class="tableWrap"><table class="majorMatrix"><thead><tr><th>New Date</th><th>Day</th>${classes.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${days.map(d=>`<tr><td><input type="date" data-repair-template-date="${d}"></td><td><b>Day ${d}</b></td>${classes.map(c=>{const vals=by.get(d+'|'+c)||[''],count=Math.max(1,vals.length);const opts=optsFor(t,c);return`<td><div style="display:grid;gap:6px">${Array.from({length:count},(_,i)=>`<select data-repair-template-subject data-day="${d}" data-class="${esc(c)}"><option value="">— No exam —</option>${opts.map(s=>`<option value="${esc(s)}" ${sk(s)===sk(vals[i]||'')?'selected':''}>${esc(s)}</option>`).join('')}</select>`).join('')}</div></td>`}).join('')}</tr>`).join('')}</tbody></table></div><div class="buttonRow" style="margin-top:12px"><button id="applyTemplateToManual" class="button primary">Apply to Manual Timetable</button></div><div id="templatePatternMsg" class="notice info"><b>${pattern.length} timetable assignment(s) recovered.</b> Subject lists are merged across unified XI/XII streams.</div>`;
    const manual=$('printableMatrixEditor');if(manual)manual.before(box);else pane.prepend(box);$('applyTemplateToManual').onclick=applyToManual
  }

  async function applyToManual(){
    const msg=$('templatePatternMsg'),dateMap=new Map();for(const el of document.querySelectorAll('[data-repair-template-date]')){if(!el.value){msg.textContent='Choose every timetable date first.';return}dateMap.set(Number(el.dataset.repairTemplateDate),el.value)}
    const assignments=[];for(const s of document.querySelectorAll('[data-repair-template-subject]')){const v=subject(s.value||'');if(v)assignments.push({className:base(s.dataset.class),subject:v,date:dateMap.get(Number(s.dataset.day))})}
    if(!assignments.length){msg.textContent='No subjects are selected in the template.';return}const dates=[...new Set(dateMap.values())].sort();
    if($('startDate')){$('startDate').value=dates[0];dispatch($('startDate'))}if($('endDate')){$('endDate').value=dates.at(-1);dispatch($('endDate'))}if($('cadence')){$('cadence').value='custom';dispatch($('cadence'))}if($('customDates')){$('customDates').value=dates.join(', ');dispatch($('customDates'),'input');dispatch($('customDates'))}
    const count=new Map();for(const a of assignments){const k=a.date+'|'+a.className;count.set(k,(count.get(k)||0)+1)}const max=Math.max(1,...count.values());if($('allowDoubleBooking')&&max>1){$('allowDoubleBooking').checked=true;dispatch($('allowDoubleBooking'))}if($('maxPerDay')){$('maxPerDay').value=String(max);dispatch($('maxPerDay'))}
    await wait(550);for(const b of document.querySelectorAll('[data-exam-date]')){const on=dates.includes(String(b.dataset.examDate||''));if(b.checked!==on){b.checked=on;dispatch(b)}}
    document.querySelector('[data-pane-target="timetable"]')?.click();await wait(450);const sels=[...document.querySelectorAll('#printableMatrixHost [data-matrix-class][data-matrix-date]')],used=new Set();let placed=0;
    for(const a of assignments){const candidates=sels.map((s,i)=>({s,i})).filter(x=>!used.has(x.i)&&base(x.s.dataset.matrixClass)===a.className&&String(x.s.dataset.matrixDate)===a.date);const hit=candidates.find(x=>[...x.s.options].some(o=>matchesCurrent(o.value,new Set([sk(a.subject)]))));if(!hit)continue;const opt=[...hit.s.options].find(o=>matchesCurrent(o.value,new Set([sk(a.subject)])));hit.s.value=opt.value;used.add(hit.i);dispatch(hit.s);placed++}
    await wait(250);$('saveDraft')?.click();msg.className=placed===assignments.length?'notice success':'notice info';msg.innerHTML=`<b>${placed} of ${assignments.length} template assignment(s) applied to the manual timetable.</b> The cloud draft is being saved.`;setTimeout(()=>$('printableMatrixEditor')?.scrollIntoView({behavior:'smooth',block:'start'}),250)
  }

  async function useTemplate(id){const {t,name}=await templateData(id);if(!confirm(`Create a new editable timetable from “${name}”?\n\nAll saved template subjects, including unified XI/XII stream subjects, will be imported. The saved template itself will not be changed.`))return;$('newDraft')?.click();if(!await waitMajor())throw new Error('Class and subject controls are not ready.');const suggested=String(name).replace(/\s+Template$/i,'').trim()||'New Examination Schedule',entered=prompt('Name for the new examination draft:',suggested);if(entered===null)return;if($('workspaceName')){$('workspaceName').value=entered.trim()||suggested;dispatch($('workspaceName'),'input')}await applySelections(t);renderTemplateEditor(t,name)}

  window.addEventListener('click',e=>{const b=e.target.closest?.('[data-real-use-template]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();useTemplate(String(b.dataset.realUseTemplate||'')).catch(err=>alert('Could not open template for editing: '+(err.message||err)))},true);

  document.addEventListener('click',e=>{
    if(!e.target.closest?.('[data-open-cloud],[data-revise-cloud]'))return;
    const jump=()=>document.querySelector('[data-pane-target="timetable"]')?.click();
    setTimeout(jump,60);setTimeout(jump,420);setTimeout(()=>{jump();$('printableMatrixEditor')?.scrollIntoView({block:'start'})},1250)
  },true);
})();