// VKVTT QB Paper Builder — local manual checkpoint / restore history
// Progressive enhancement only. No Firestore access or writes.
(function(){
  const DRAFT='vkvtt.qb.paperDraft.v1';
  const CHECKPOINT='vkvtt.qb.paperCheckpoint.v1'; // retained for backward compatibility
  const HISTORY='vkvtt.qb.paperCheckpointHistory.v1';
  const MAX=5;
  const $=id=>document.getElementById(id);
  const fmt=ms=>{try{return new Date(ms).toLocaleString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(_){return''}};
  function validDraft(v){return v&&typeof v==='object'&&Array.isArray(v.sections)}
  function readLegacy(){try{return JSON.parse(localStorage.getItem(CHECKPOINT)||'null')}catch(_){return null}}
  function readHistory(){
    let list=[];try{list=JSON.parse(localStorage.getItem(HISTORY)||'[]')}catch(_){}
    if(!Array.isArray(list))list=[];
    list=list.filter(x=>x&&validDraft(x.state)&&Number(x.savedAt));
    if(!list.length){const old=readLegacy();if(old&&validDraft(old.state))list=[old]}
    return list.slice(0,MAX);
  }
  function writeHistory(list){localStorage.setItem(HISTORY,JSON.stringify(list.slice(0,MAX)))}
  function ensure(){
    const panel=$('paperBuilder');if(!panel||$('pbCheckpointBox'))return;
    const actions=$('pbClear')?.parentElement;if(!actions)return;
    const save=document.createElement('button');save.id='pbCheckpointSave';save.textContent='💾 Save Checkpoint';save.title='Keep a manual safety copy of this local paper draft';
    const restore=document.createElement('button');restore.id='pbCheckpointRestore';restore.textContent='↶ Restore Selected';restore.title='Restore the selected manual checkpoint';
    const select=document.createElement('select');select.id='pbCheckpointSelect';select.style.width='auto';select.style.minWidth='205px';select.title='Choose one of the five most recent manual checkpoints';
    actions.insertBefore(save,$('pbClear'));actions.insertBefore(select,$('pbClear'));actions.insertBefore(restore,$('pbClear'));
    const box=document.createElement('div');box.id='pbCheckpointBox';box.className='small';box.style.marginTop='7px';actions.insertAdjacentElement('afterend',box);
    function refresh(message){
      const list=readHistory();select.innerHTML='';
      if(!list.length){const o=document.createElement('option');o.value='';o.textContent='No checkpoint saved';select.appendChild(o);select.disabled=true;restore.disabled=true;box.textContent=message||'No manual checkpoint saved yet. Autosave continues separately.';return}
      select.disabled=false;restore.disabled=false;
      list.forEach((cp,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=(i===0?'Latest · ':'')+fmt(cp.savedAt);select.appendChild(o)});
      box.textContent=message||`${list.length} manual checkpoint${list.length===1?'':'s'} available on this device (up to ${MAX}). Autosave continues separately.`;
    }
    save.onclick=()=>{
      let state=null;try{state=window.__vkvQbPaperBuilder?.getState?.()}catch(_){}
      if(!validDraft(state)){box.textContent='Paper Builder state is not ready yet.';return}
      try{
        const cp={savedAt:Date.now(),state};const list=[cp,...readHistory()].slice(0,MAX);
        writeHistory(list);localStorage.setItem(CHECKPOINT,JSON.stringify(cp));
        refresh('✓ Checkpoint saved '+fmt(cp.savedAt)+`. ${list.length}/${MAX} recovery points retained on this device.`);
      }catch(e){box.textContent='Could not save checkpoint on this device.'}
    };
    restore.onclick=()=>{
      const list=readHistory(),idx=Number(select.value),cp=list[idx];if(!cp||!validDraft(cp.state))return;
      if(!confirm('Restore the checkpoint from '+fmt(cp.savedAt)+'? Your current autosaved local draft will be replaced.'))return;
      try{localStorage.setItem(DRAFT,JSON.stringify(cp.state));location.reload()}catch(e){box.textContent='Could not restore checkpoint on this device.'}
    };
    refresh();
  }
  window.addEventListener('vkv-qb-paper-ready',ensure);
  const timer=setInterval(()=>{if(window.__vkvQbPaperBuilder&&$('paperBuilder')){clearInterval(timer);ensure()}},350);
  setTimeout(()=>{clearInterval(timer);ensure()},8000);
})();