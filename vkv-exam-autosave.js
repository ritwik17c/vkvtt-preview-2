(()=>{
  'use strict';
  let timer=null,pending=false,saving=false,cloudEstablished=false,activeDraftId='',footerDirty=false,cloudReady=null;
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

  async function cloud(){
    if(cloudReady)return cloudReady;
    cloudReady=(async()=>{
      const [{getApps,getApp},{getAuth},{getFirestore,getDocs,getDoc,collection,doc,updateDoc}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),getDocs,getDoc,collection,doc,updateDoc};
    })();
    return cloudReady;
  }

  function footerValues(){
    return{
      reporting:String($('examFooterReporting')?.value||''),
      bus:String($('examFooterBus')?.value||''),
      departure:String($('examFooterDeparture')?.value||'')
    };
  }

  async function resolveDraftId(){
    if(activeDraftId)return activeDraftId;
    const api=await cloud(),user=api.auth.currentUser,name=String($('workspaceName')?.value||'').trim();
    if(!user||!name)return'';
    const snap=await api.getDocs(api.collection(api.db,'examSchedules')),items=[];
    snap.forEach(d=>{const x=d.data()||{};if(x.ownerUid===user.uid&&String(x.name||'').trim()===name&&!/^TEMPLATE_/i.test(d.id)&&d.id!=='EXAM_SUBJECT_MASTER')items.push({id:d.id,...x})});
    items.sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));
    activeDraftId=items[0]?.id||'';return activeDraftId;
  }

  async function persistFooter(){
    if(!cloudEstablished)return false;
    const id=await resolveDraftId();if(!id)return false;
    const api=await cloud(),details=footerValues();
    await api.updateDoc(api.doc(api.db,'examSchedules',id),{'workspace.printDetails':details,'printDetails':details});
    footerDirty=false;return true;
  }

  async function restoreFooter(id=activeDraftId){
    if(!id)return false;
    const api=await cloud(),snap=await api.getDoc(api.doc(api.db,'examSchedules',id));if(!snap.exists())return false;
    const data=snap.data()||{},details=data.workspace?.printDetails||data.printDetails;if(!details)return false;
    for(let i=0;i<20;i++){
      const reporting=$('examFooterReporting'),bus=$('examFooterBus'),departure=$('examFooterDeparture');
      if(reporting&&bus&&departure){
        reporting.value=String(details.reporting||'');bus.value=String(details.bus||'');departure.value=String(details.departure||'');
        footerDirty=false;return true;
      }
      await new Promise(r=>setTimeout(r,100));
    }
    return false;
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
    const open=e.target.closest?.('[data-open-cloud]'),revise=e.target.closest?.('[data-revise-cloud]');
    if(open){activeDraftId=String(open.dataset.openCloud||'');cloudEstablished=true;clearPending();setTimeout(()=>restoreFooter().catch(()=>{}),650);setTimeout(()=>restoreFooter().catch(()=>{}),1200);return}
    if(revise||e.target.closest?.('#newDraft')){activeDraftId='';cloudEstablished=false;footerDirty=false;clearPending();return}
    const t=e.target.closest?.(clickSelectors);if(t)schedule(1200);
  },true);

  document.addEventListener('change',e=>{
    if(!e.isTrusted)return;
    if(e.target.matches?.('#examFooterReporting,#examFooterBus,#examFooterDeparture'))footerDirty=true;
    const t=e.target.closest?.(changeSelectors);if(t)schedule();
  },true);

  document.addEventListener('input',e=>{
    if(!e.isTrusted||!e.target.matches?.('#workspaceName,#workspaceDescription'))return;
    schedule(1200);
  },true);

  // The core module writes this text only after the Firestore save succeeds.
  const watchSaveState=()=>{
    const state=$('saveState');if(!state)return false;
    let previous='';
    const observe=()=>{
      const text=String(state.textContent||'');
      if(text===previous)return;previous=text;
      if(/Cloud draft saved/i.test(text)){
        cloudEstablished=true;clearPending();
        resolveDraftId().then(()=>persistFooter()).catch(()=>{});
      }else if(/Cloud workspace opened/i.test(text)){
        cloudEstablished=true;clearPending();setTimeout(()=>restoreFooter().catch(()=>{}),350);
      }
      if(/New unsaved cloud draft|New revision/i.test(text)){activeDraftId='';cloudEstablished=false;footerDirty=false;clearPending()}
    };
    new MutationObserver(observe).observe(state,{childList:true,characterData:true,subtree:true});observe();return true;
  };
  let tries=0,watch=setInterval(()=>{if(watchSaveState()||++tries>50)clearInterval(watch)},100);

  document.addEventListener('vkv-exam-template-fresh-draft',()=>{activeDraftId='';cloudEstablished=false;footerDirty=false;clearPending()});
  document.addEventListener('vkv-exam-subject-master-applied',()=>schedule(1200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&pending)runAutosave()});
  window.addEventListener('pagehide',()=>{if(pending)runAutosave();if(footerDirty&&cloudEstablished)persistFooter().catch(()=>{})});
})();
