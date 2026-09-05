function tidy(){const nav=document.querySelector('.sidebar nav');const major=nav?.querySelector('[data-pane-target="majorClasses"]');if(!major)return false;const oldNav=nav.querySelector('[data-pane-target="classes"]');if(oldNav)oldNav.remove();const oldPane=document.querySelector('[data-pane="classes"]');if(oldPane)oldPane.remove();const order=['setup','majorClasses','subjects','timetable','staff','duties','outputs'];order.forEach((p,i)=>{const n=nav.querySelector(`[data-pane-target="${p}"] span`);if(n)n.textContent=String(i+1)});const oldSubject=document.getElementById('subjectChoiceGrid');if(oldSubject){const wrap=oldSubject.closest('.surface');if(wrap&&wrap.id!=='majorSubjectBox')wrap.style.display='none'}return true}

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const baseClass=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,grade)=>grade.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
const subjectText=v=>String(v||'').trim().replace(/\s+/g,' ');
const subjectKey=v=>{let s=subjectText(v).toLowerCase();if(/^information technology(?:\s*[-–(]?\s*(?:it|bb)\s*\)?)?$/.test(s)||/^it(?:\s*[-–(]?\s*(?:it|bb)\s*\)?)?$/.test(s))return'it';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)?$/.test(s)||s==='mathematics')return'maths';return s.replace(/[^a-z0-9]+/g,'')};
function subjectParts(v){return subjectText(v).split(/\s*(?:\/|&|,|\band\b)\s*/i).map(subjectText).filter(Boolean)}
function subjectKeys(v){const out=new Set([subjectKey(v)]);for(const part of subjectParts(v)){const k=subjectKey(part);if(k)out.add(k)}return out}
function masterCatalogue(){const master=window.vkvExamSubjectMaster?.get?.(),out=new Map();for(const [raw,subjects] of Object.entries(master?.classes||{})){const cls=baseClass(raw);if(!cls)continue;out.set(cls,(subjects||[]).map(subjectText).filter(Boolean))}return out}
function visibleCatalogue(){const out=new Map();for(const box of document.querySelectorAll('[data-major-subject]')){const cls=baseClass(box.dataset.majorSubjectClass),sub=subjectText(box.dataset.majorSubject);if(!cls||!sub)continue;if(!out.has(cls))out.set(cls,[]);out.get(cls).push(sub)}return out}
function sameCatalogue(a,b){if(a.size!==b.size)return false;for(const [cls,subs] of a){const other=b.get(cls);if(!other)return false;const aa=[...new Set(subs.map(subjectKey))].sort(),bb=[...new Set(other.map(subjectKey))].sort();if(JSON.stringify(aa)!==JSON.stringify(bb))return false}return true}
function captureSelected(){const out=new Map();for(const box of document.querySelectorAll('[data-major-subject]:checked')){const cls=baseClass(box.dataset.majorSubjectClass),sub=subjectText(box.dataset.majorSubject);if(!cls||!sub)continue;if(!out.has(cls))out.set(cls,[]);out.get(cls).push(sub)}return out}
function wantedFromOld(masterSubject,oldSubjects){const wanted=subjectKeys(masterSubject);for(const old of oldSubjects||[]){const oldKeys=subjectKeys(old);for(const k of oldKeys)if(wanted.has(k))return true}return false}
function selectedClasses(){return new Set([...document.querySelectorAll('[data-major-class]:checked')].map(b=>baseClass(b.dataset.majorClass)).filter(Boolean))}
function dispatch(el,type='change'){el?.dispatchEvent(new Event(type,{bubbles:true}))}
function allRawClasses(){return [...(document.getElementById('paperClassFilter')?.options||[])].map(o=>o.value).filter(Boolean)}
function paperState(){
  const filter=document.getElementById('paperClassFilter'),search=document.getElementById('paperSearch');if(!filter||!search)return[];
  const oldF=filter.value,oldS=search.value,out=[];search.value='';dispatch(search,'input');
  for(const raw of allRawClasses()){
    filter.value=raw;dispatch(filter);
    for(const tr of document.querySelectorAll('#paperRows tr[data-paper]'))out.push({className:baseClass(tr.cells?.[1]?.textContent||raw),subject:subjectText(tr.cells?.[2]?.textContent||''),fixedDate:tr.querySelector('[data-paper-field="fixedDate"]')?.value||'',fixedSlotId:tr.querySelector('[data-paper-field="fixedSlotId"]')?.value||'',roomId:tr.querySelector('[data-paper-field="roomId"]')?.value||''});
  }
  filter.value=oldF;dispatch(filter);search.value=oldS;dispatch(search,'input');return out
}
function findOldAssignment(oldList,className,subject){const candidates=oldList.filter(x=>x.className===className),wanted=subjectKeys(subject);let exact=candidates.find(x=>subjectKey(x.subject)===subjectKey(subject));if(exact)return exact;return candidates.find(x=>{const keys=subjectKeys(x.subject);for(const k of keys)if(wanted.has(k))return true;return false})||null}
async function restorePaperState(oldList){
  if(!oldList?.length)return 0;const filter=document.getElementById('paperClassFilter'),search=document.getElementById('paperSearch');if(!filter||!search)return 0;
  const oldF=filter.value,oldS=search.value;let restored=0;search.value='';dispatch(search,'input');
  for(const raw of allRawClasses()){
    filter.value=raw;dispatch(filter);
    for(const tr of [...document.querySelectorAll('#paperRows tr[data-paper]')]){
      const className=baseClass(tr.cells?.[1]?.textContent||raw),subject=subjectText(tr.cells?.[2]?.textContent||''),old=findOldAssignment(oldList,className,subject);if(!old)continue;
      const room=tr.querySelector('[data-paper-field="roomId"]'),date=tr.querySelector('[data-paper-field="fixedDate"]'),slot=tr.querySelector('[data-paper-field="fixedSlotId"]');let changed=false;
      if(room&&old.roomId&&room.value!==old.roomId){room.value=old.roomId;dispatch(room);changed=true}
      if(date&&old.fixedDate&&date.value!==old.fixedDate){date.value=old.fixedDate;dispatch(date);changed=true}
      const current=document.querySelector(`#paperRows tr[data-paper="${CSS.escape(tr.dataset.paper)}"]`)||tr,currentSlot=current.querySelector('[data-paper-field="fixedSlotId"]')||slot;
      if(currentSlot&&old.fixedSlotId&&currentSlot.value!==old.fixedSlotId){currentSlot.value=old.fixedSlotId;dispatch(currentSlot);changed=true}
      if(changed)restored++;
    }
  }
  filter.value=oldF;dispatch(filter);search.value=oldS;dispatch(search,'input');return restored
}
function autoSelectCombinedForSelectedClasses(){
  const classes=selectedClasses();let changed=0;
  for(const box of document.querySelectorAll('[data-major-subject]:not(:checked)')){
    const cls=baseClass(box.dataset.majorSubjectClass),sub=subjectText(box.dataset.majorSubject);
    if(!classes.has(cls)||subjectParts(sub).length<2)continue;
    box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));changed++
  }
  return changed
}
async function migrateRestoredWorkspace(){
  for(let i=0;i<30&&(!window.vkvExamSubjectMaster?.installCatalogue||!document.querySelector('[data-major-subject]'));i++)await wait(50);
  const master=masterCatalogue();if(!master.size)return;
  const current=visibleCatalogue(),alreadyCurrent=sameCatalogue(master,current),selected=captureSelected(),assignments=paperState();
  let restoredAssignments=0;
  if(!alreadyCurrent){
    const ok=await window.vkvExamSubjectMaster.installCatalogue();if(!ok)return;
    await wait(120);
    for(const box of document.querySelectorAll('[data-major-subject]')){
      const cls=baseClass(box.dataset.majorSubjectClass),sub=subjectText(box.dataset.majorSubject),old=selected.get(cls)||[];
      const should=old.length?wantedFromOld(sub,old):false;
      if(box.checked!==should){box.checked=should;box.dispatchEvent(new Event('change',{bubbles:true}))}
    }
    await wait(120);restoredAssignments=await restorePaperState(assignments);
  }
  const combinedFixed=autoSelectCombinedForSelectedClasses();
  const status=document.getElementById('examSubjectMasterStatus');if(status){status.className='notice info';status.textContent=restoredAssignments?`Saved Examination Subject Master imported. ${restoredAssignments} saved timetable assignment(s), including date/session slots, were restored.`:combinedFixed?'Saved Examination Subject Master imported. Combined subjects were selected automatically for the selected classes.':'Saved draft subjects match the current Examination Subject Master.'}
  if(restoredAssignments)document.dispatchEvent(new CustomEvent('vkv-exam-saved-slots-restored',{detail:{count:restoredAssignments}}));
  document.dispatchEvent(new CustomEvent('vkv-exam-subject-master-applied'));
}

document.addEventListener('click',e=>{if(e.target.closest?.('[data-open-cloud],[data-revise-cloud]'))setTimeout(()=>migrateRestoredWorkspace(),80);if(e.target.closest?.('[data-pane-target="majorClasses"],[data-pane-target="subjects"]'))setTimeout(()=>autoSelectCombinedForSelectedClasses(),180)},true);
document.addEventListener('vkv-exam-workspace-subjects-applied',()=>setTimeout(()=>autoSelectCombinedForSelectedClasses(),120));
let n=0,t=setInterval(()=>{if(tidy()||++n>40)clearInterval(t)},250);window.addEventListener('load',()=>setTimeout(()=>{tidy();migrateRestoredWorkspace()},900));
