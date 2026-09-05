(()=>{
  const $=id=>document.getElementById(id);
  let bypass=false,syncing=false;
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
      if(c&&s&&d)map.set(key(c,s),d);
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
  function updateOne(target,wantIncluded,wantDate){
    setFilter(target.raw);
    let tr=findRow(target.id);if(!tr)return;
    let box=tr.querySelector('[data-paper-field="included"]');
    if(box&&box.checked!==wantIncluded){box.checked=wantIncluded;dispatch(box,'change');tr=findRow(target.id)}
    if(!tr)return;
    const date=tr.querySelector('[data-paper-field="fixedDate"]'),next=wantIncluded?(wantDate||''):'';
    if(date&&date.value!==next){date.value=next;dispatch(date,'change')}
  }
  async function syncMajorState(){
    const desired=desiredSelection();if(!desired)return false;
    const assignments=matrixAssignments(),f=$('paperClassFilter'),search=$('paperSearch'),oldF=f?.value||'',oldS=search?.value||'';
    const targets=collectTargets();
    for(const t of targets){const included=desired.classes.has(t.className)&&desired.subjects.has(key(t.className,t.subject));updateOne(t,included,included?(assignments.get(key(t.className,t.subject))||''):'')}
    if(f){f.value=oldF;dispatch(f,'change')}if(search){search.value=oldS;dispatch(search,'input')}
    return true;
  }
  function statusMessage(html,kind='info'){const el=$('printableMatrixMsg');if(!el)return;el.className='notice '+kind;el.innerHTML=html}
  function watchActualSave(){const node=$('saveState');if(!node)return;const obs=new MutationObserver(()=>{const text=node.textContent||'';if(/Cloud draft saved/i.test(text)){obs.disconnect();statusMessage('<b>Cloud draft saved.</b> Classes, subjects and current timetable date choices were written to the workspace. Reopen the draft to verify the round-trip.','success')}});obs.observe(node,{childList:true,subtree:true,characterData:true});setTimeout(()=>obs.disconnect(),12000)}
  document.addEventListener('click',async e=>{
    const btn=e.target.closest('#saveDraft');if(!btn||bypass||syncing)return;
    const desired=desiredSelection();if(!desired)return;
    e.preventDefault();e.stopImmediatePropagation();syncing=true;btn.disabled=true;
    try{
      statusMessage('<b>Preparing cloud save…</b> Synchronising selected classes, selected subjects and timetable slots with the actual examination workspace.');
      await syncMajorState();
      statusMessage('<b>Workspace synchronised.</b> Saving the actual cloud draft now.');
      watchActualSave();
      bypass=true;btn.disabled=false;btn.click();bypass=false;
    }catch(err){btn.disabled=false;statusMessage('<b>Save stopped before cloud write.</b> '+esc(err?.message||err),'error')}
    finally{setTimeout(()=>{syncing=false;btn.disabled=false},600)}
  },true);
})();
