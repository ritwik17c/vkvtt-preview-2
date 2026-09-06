(()=>{
  'use strict';
  let timer=null,pending=false,saving=false,cloudEstablished=false;
  const SAVE_DELAY=900;
  const $=id=>document.getElementById(id);

  const changeSelectors=[
    '#workspaceName','#workspaceDescription','#startDate','#endDate','#cadence','#maxPerDay','#allowDoubleBooking','#excludedDates','#customDates',
    '[data-weekday]','[data-exam-date]','[data-session-field]','[data-paper-field]','[data-major-class]','[data-major-subject]',
    '[data-teacher-field]','#invigilatorsPerRoom','#maxInvigPerDay','#relieversPerSession','#avoidOwnSubject','#relieverStart','#relieverEnd',
    '#examFooterReporting','#examFooterBus','#examFooterDeparture','[data-matrix-class][data-matrix-date]','[data-template-pattern-date]'
  ].join(',');

  const clickSelectors=[
    '#majorAllClasses','#majorNoClasses','#includeVisible','#excludeVisible','#enableVisibleTeachers','#disableVisibleTeachers',
    '#addSession','[data-remove-session]','#generateTimetable','#undoGeneratedTimetable','#generateDuties','#applyTemplatePatternDates'
  ].join(',');

  function clearPending(){pending=false;if(timer){clearTimeout(timer);timer=null}}
  function canSave(){
    const b=$('saveDraft');
    return !!(cloudEstablished&&b&&!b.hidden&&!b.disabled&&$('examApp')&&!$('examApp').hidden);
  }

  function runAutosave(){
    timer=null;
    if(!pending||saving||!canSave())return;
    pending=false;saving=true;
    const b=$('saveDraft'),state=$('saveState');
    if(state)state.textContent='Autosaving saved draft…';
    b.click();
    setTimeout(()=>{saving=false;if(pending)schedule(350)},700);
  }

  function schedule(delay=SAVE_DELAY){
    if(!cloudEstablished)return;
    pending=true;
    if(timer)clearTimeout(timer);
    timer=setTimeout(runAutosave,delay);
    const state=$('saveState');
    if(state&&!/saving|submitted|published/i.test(state.textContent||''))state.textContent='Autosave pending…';
  }

  // A programmatic click must never create the first cloud record. Only the
  // user's own Save Cloud Draft click may establish a new cloud draft.
  document.addEventListener('click',e=>{
    const save=e.target.closest?.('#saveDraft');if(!save)return;
    if(!e.isTrusted&&!cloudEstablished){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();return}
    if(e.isTrusted)clearPending();
  },true);

  document.addEventListener('click',e=>{
    if(!e.isTrusted)return;
    if(e.target.closest?.('[data-open-cloud]')){cloudEstablished=true;clearPending();return}
    if(e.target.closest?.('[data-revise-cloud],#newDraft')){cloudEstablished=false;clearPending();return}
    const t=e.target.closest?.(clickSelectors);if(t)schedule(1200);
  },true);

  document.addEventListener('change',e=>{
    if(!e.isTrusted)return;
    const t=e.target.closest?.(changeSelectors);if(t)schedule();
  },true);

  document.addEventListener('input',e=>{
    if(!e.isTrusted||!e.target.matches?.('#workspaceName,#workspaceDescription'))return;
    schedule(1200);
  },true);

  // The core module writes this text only after the Firestore save succeeds.
  const watchSaveState=()=>{
    const state=$('saveState');if(!state)return false;
    const observe=()=>{
      const text=String(state.textContent||'');
      if(/Cloud draft saved|Cloud workspace opened/i.test(text)){cloudEstablished=true;clearPending()}
      if(/New unsaved cloud draft|New revision/i.test(text)){cloudEstablished=false;clearPending()}
    };
    new MutationObserver(observe).observe(state,{childList:true,characterData:true,subtree:true});observe();return true;
  };
  let tries=0,watch=setInterval(()=>{if(watchSaveState()||++tries>50)clearInterval(watch)},100);

  document.addEventListener('vkv-exam-template-fresh-draft',()=>{cloudEstablished=false;clearPending()});
  document.addEventListener('vkv-exam-subject-master-applied',()=>schedule(1200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&pending)runAutosave()});
  window.addEventListener('pagehide',()=>{if(pending)runAutosave()});
})();
