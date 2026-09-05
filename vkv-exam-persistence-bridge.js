(()=>{
  const $=id=>document.getElementById(id);
  let bypass=false,syncing=false,regenerating=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cls(v){let s=String(v||'').trim().replace(/\s+/g,' ');s=s.replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,grade)=>grade.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'');return s.trim()||String(v||'').trim()}
  function subj(v){let s=String(v||'').trim().replace(/\s+/g,' ');if(/^information technology(?:\s*[-–(]?\s*(?:it|bb)\s*\)?)?$/i.test(s)||/^it(?:\s*[-–(]?\s*(?:it|bb)\s*\)?)?$/i.test(s))return'IT';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)$/i.test(s))return'Maths';if(/^hindi$/i.test(s))return'Hindi';return s}
  const key=(c,s)=>cls(c)+'|'+subj(s).toLocaleLowerCase();
  function desiredSelection(){
    const classBoxes=[...document.querySelectorAll('[data-major-class]')],subjectBoxes=[...document.querySelectorAll('[data-major-subject][data-major-subject-class]')];
    if(!classBoxes.length||!subjectBoxes.length)return null;
    const classes=new Set(classBoxes.filter(b=>b.checked).map(b=>cls(b.dataset.majorClass)).filter(Boolean));
    const subjects=new Set(subjectBoxes.filter(b=>b.checked&&classes.has(cls(b.dataset.majorSubjectClass))).map(b=>key(b.dataset.majorSubjectClass,b.dataset.majorSubject)));
    return{classes,subjects};
  }
  function matrixAssignments(){
    const map=new Map();
    for(const sel of document.querySelectorAll('#printableMatrixHost [data-matrix-class][data-matrix-date]')){
      const c=cls(sel.dataset.matrixClass),s=subj(sel.value||''),d=String(sel.dataset.matrixDate||'').trim();
      if(c&&s&&d)map.set(key(c,s),{date:d});
    }
    return map;
  }
  function rawClassOptions(){return [...($('paperClassFilter')?.options||[])].map(o=>o.value).filter(Boolean)}
  function dispatch(el,type){el?.dispatchEvent(new Event(type,{bubbles:true}))}
  function setFilter(raw){const f=$('paperClassFilter');if(!f)return;f.value=raw;dispatch(f,'change')}
  function findRow(id){return [...document.querySelectorAll('#paperRows tr[data-paper]')].find(r=>r.dataset.paper===id)}
  function collectTargets(){
    const f=$('paperClassFilter'),search=$('paperSearch');if(!f||!search)return[];
    const oldF=f.value,oldS=search.value,out=[];search.value='';dispatch(search,'input');
    for(const raw of rawClassOptions()){
      setFilter(raw);
      for(const tr of document.querySelectorAll('#paperRows tr[data-paper]'))out.push({id:tr.dataset.paper,raw,className:cls(tr.cells[1]?.textContent),subject:subj(tr.cells[2]?.textContent)});
    }
    f.value=oldF;dispatch(f,'change');search.value=oldS;dispatch(search,'input');
    return out;
  }
  function soleSlotId(){
    const ids=new Set();
    for(const opt of document.querySelectorAll('#paperRows [data-paper-field="fixedSlotId"] option'))if(opt.value)ids.add(opt.value);
    return ids.size===1?[...ids][0]:'';
  }
  function updateOne(target,wantIncluded,wantAssignment,defaultSlotId){
    setFilter(target.raw);
    let tr=findRow(target.id);if(!tr)return;
    let box=tr.querySelector('[data-paper-field="included"]');
    if(box&&box.checked!==wantIncluded){box.checked=wantIncluded;dispatch(box,'change');tr=findRow(target.id)}
    if(!tr)return;
    const wantDate=wantIncluded?(wantAssignment?.date||''):'';
    const date=tr.querySelector('[data-paper-field="fixedDate"]');
    if(date&&date.value!==wantDate){date.value=wantDate;dispatch(date,'change');tr=findRow(target.id)||tr}
    const slot=tr.querySelector('[data-paper-field="fixedSlotId"]');
    const wantSlot=wantIncluded&&wantDate?(slot?.value||defaultSlotId||''):'';
    if(slot&&slot.value!==wantSlot){slot.value=wantSlot;dispatch(slot,'change')}
  }
  async function syncMajorState(){
    const desired=desiredSelection();if(!desired)return false;
    const assignments=matrixAssignments(),f=$('paperClassFilter'),search=$('paperSearch'),oldF=f?.value||'',oldS=search?.value||'',defaultSlotId=soleSlotId();
    const targets=collectTargets();
    for(const t of targets){const included=desired.classes.has(t.className)&&desired.subjects.has(key(t.className,t.subject));updateOne(t,included,included?assignments.get(key(t.className,t.subject)):null,defaultSlotId)}
    if(f){f.value=oldF;dispatch(f,'change')}if(search){search.value=oldS;dispatch(search,'input')}
    return true;
  }
  function statusMessage(html,kind='info'){const el=$('printableMatrixMsg');if(!el)return;el.className='notice '+kind;el.innerHTML=html}
  function commitMatrixToRealTimetable(){
    if(regenerating)return false;
    const button=$('generateTimetable');if(!button||button.disabled)return false;
    regenerating=true;
    try{button.click();return true}finally{setTimeout(()=>{regenerating=false},250)}
  }
  function watchActualSave(){const node=$('saveState');if(!node)return;const obs=new MutationObserver(()=>{const text=node.textContent||'';if(/Cloud draft saved/i.test(text)){obs.disconnect();statusMessage('<b>Cloud draft saved.</b> Manual timetable assignments were committed to the real timetable and saved. Reopen this same draft to verify the round-trip.','success')}});obs.observe(node,{childList:true,subtree:true,characterData:true});setTimeout(()=>obs.disconnect(),12000)}
  document.addEventListener('change',e=>{
    if(!e.target.closest?.('#printableMatrixHost [data-matrix-class][data-matrix-date]'))return;
    setTimeout(()=>{if(commitMatrixToRealTimetable())statusMessage('<b>Manual edit committed.</b> The real examination timetable has been rebuilt from this matrix and is ready to save.','info')},0);
  });
  document.addEventListener('click',async e=>{
    const btn=e.target.closest('#saveDraft');if(!btn||bypass||syncing)return;
    const desired=desiredSelection();if(!desired)return;
    e.preventDefault();e.stopImmediatePropagation();syncing=true;btn.disabled=true;
    try{
      statusMessage('<b>Preparing cloud save…</b> Synchronising the manual timetable with the actual examination workspace.');
      await syncMajorState();
      commitMatrixToRealTimetable();
      await new Promise(r=>setTimeout(r,280));
      statusMessage('<b>Workspace synchronised.</b> Saving the cloud draft now.');
      watchActualSave();
      bypass=true;btn.disabled=false;btn.click();bypass=false;
    }catch(err){btn.disabled=false;statusMessage('<b>Save stopped before cloud write.</b> '+esc(err?.message||err),'error')}
    finally{setTimeout(()=>{syncing=false;btn.disabled=false},700)}
  },true);
})();
