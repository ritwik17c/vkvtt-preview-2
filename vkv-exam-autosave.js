(()=>{
  'use strict';
  let timer=null,pending=false,saving=false;
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

  function canSave(){
    const b=$('saveDraft');
    return !!(b && !b.hidden && !b.disabled && $('examApp') && !$('examApp').hidden);
  }

  function runAutosave(){
    timer=null;
    if(!pending||saving||!canSave())return;
    pending=false;saving=true;
    const b=$('saveDraft');
    const state=$('saveState');
    if(state)state.textContent='Autosaving draft…';
    b.click();
    setTimeout(()=>{saving=false;if(pending)schedule(350)},700);
  }

  function schedule(delay=SAVE_DELAY){
    pending=true;
    if(timer)clearTimeout(timer);
    timer=setTimeout(runAutosave,delay);
    const state=$('saveState');
    if(state&&!/saving|submitted|published/i.test(state.textContent||''))state.textContent='Autosave pending…';
  }

  document.addEventListener('change',e=>{
    if(!e.isTrusted)return;
    const t=e.target.closest?.(changeSelectors);if(!t)return;
    schedule();
  },true);

  document.addEventListener('input',e=>{
    if(!e.isTrusted)return;
    if(!e.target.matches?.('#workspaceName,#workspaceDescription'))return;
    schedule(1200);
  },true);

  document.addEventListener('click',e=>{
    if(!e.isTrusted)return;
    const t=e.target.closest?.(clickSelectors);if(!t)return;
    schedule(1200);
  },true);

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#saveDraft')){pending=false;if(timer){clearTimeout(timer);timer=null}}
  },true);

  document.addEventListener('visibilitychange',()=>{if(document.hidden&&pending)runAutosave()});
  document.addEventListener('vkv-exam-subject-master-applied',()=>schedule(1200));
  window.addEventListener('pagehide',()=>{if(pending)runAutosave()});
})();
