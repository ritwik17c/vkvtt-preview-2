(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  function msg(text,kind='info'){
    const el=$('printableMatrixMsg')||$('timetableStatus');
    if(!el)return;
    el.className='notice '+kind;
    el.innerHTML=text;
  }
  function waitForSave(timeout=12000){
    return new Promise(resolve=>{
      const node=$('saveState');
      if(!node)return resolve(false);
      if(/Cloud draft saved/i.test(node.textContent||''))return resolve(true);
      const obs=new MutationObserver(()=>{
        if(/Cloud draft saved/i.test(node.textContent||'')){obs.disconnect();resolve(true)}
      });
      obs.observe(node,{childList:true,subtree:true,characterData:true});
      setTimeout(()=>{obs.disconnect();resolve(false)},timeout);
    });
  }
  async function clearAndSave(){
    if(!confirm('Clear the generated examination timetable from this saved draft?\n\nSelected examination dates, classes, subjects and sessions will be kept. Generated events, fixed date/session assignments and dependent duties will be removed.'))return;
    const undo=window.vkvExamWorkspace?.undoTimetable;
    if(typeof undo!=='function'){
      msg('<b>Recovery control is not ready.</b> Reload once and try again.','error');
      return;
    }
    msg('<b>Clearing generated timetable…</b> Selected dates, classes, subjects and sessions are being preserved.','info');
    undo({ask:false});
    await new Promise(r=>setTimeout(r,180));
    const save=$('saveDraft');
    if(!save||save.hidden){
      msg('<b>Generated timetable cleared locally.</b> This workspace is not currently editable, so the cleared state could not be written back to the cloud.','error');
      return;
    }
    if(save.disabled){
      await new Promise(r=>setTimeout(r,350));
    }
    const saveDone=waitForSave();
    save.click();
    const ok=await saveDone;
    msg(ok?'<b>Generated timetable cleared and saved.</b> The draft now keeps only the selected dates, classes, subjects and sessions. You can rebuild the timetable manually from a clean state.':'<b>Generated timetable was cleared locally, but cloud-save confirmation was not received.</b> Click Save Cloud Draft once before leaving this page.',ok?'success':'error');
  }
  function install(){
    const gen=$('generateTimetable');
    if(!gen||$('clearGeneratedTimetableAndSave'))return false;
    const b=document.createElement('button');
    b.id='clearGeneratedTimetableAndSave';
    b.type='button';
    b.className='button';
    b.textContent='Clear Generated Timetable & Save';
    b.onclick=clearAndSave;
    gen.before(b);
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{if(install()||++tries>40)clearInterval(timer)},200);
  window.addEventListener('load',()=>setTimeout(install,500));
})();
