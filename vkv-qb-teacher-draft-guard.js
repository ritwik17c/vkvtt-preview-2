(()=>{
  const KEY='vkv_qb_teacher_form_autosave_v1';
  const FRAME='iframe[name="qbframe"]';
  const ids=['cls','sub','marks','qt','ans'];
  const read=doc=>Object.fromEntries(ids.map(id=>[id,doc.getElementById(id)?.value??'']));
  const hasContent=x=>String(x.qt||'').trim()||String(x.ans||'').trim();
  function save(doc){
    const data=read(doc);
    if(!hasContent(data)){localStorage.removeItem(KEY);return;}
    localStorage.setItem(KEY,JSON.stringify({...data,savedAt:Date.now()}));
    const s=doc.getElementById('qbDraftGuardStatus');
    if(s)s.textContent='Local safety copy saved.';
  }
  function clear(){localStorage.removeItem(KEY)}
  function attach(frame){
    let doc;try{doc=frame.contentDocument}catch(_){return}
    if(!doc||!doc.getElementById('qt')||doc.getElementById('qbDraftGuardStatus'))return;
    const qt=doc.getElementById('qt');
    const status=doc.createElement('div');
    status.id='qbDraftGuardStatus';status.className='tip';status.style.marginTop='8px';
    status.textContent='Draft safety: this device keeps a local copy while you type.';
    qt.parentNode.insertBefore(status,qt.nextSibling);
    let timer;
    ids.forEach(id=>doc.getElementById(id)?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>save(doc),450)}));
    ids.forEach(id=>doc.getElementById(id)?.addEventListener('change',()=>save(doc)));
    let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){clear()}
    if(saved&&hasContent(saved)&&!hasContent(read(doc))){
      const when=saved.savedAt?new Date(saved.savedAt).toLocaleString('en-IN'):'';
      const box=doc.createElement('div');box.className='warn';box.style.marginTop='8px';
      box.innerHTML='<b>Unsaved question recovered on this device.</b> '+(when?'Last local copy: '+when+'. ':'')+'Restore it? <button type="button" id="qbRestoreLocal">Restore</button> <button type="button" id="qbDiscardLocal">Discard</button>';
      status.after(box);
      box.querySelector('#qbRestoreLocal').onclick=()=>{ids.forEach(id=>{const el=doc.getElementById(id);if(el&&saved[id]!=null)el.value=saved[id]});box.remove();status.textContent='Recovered local copy. Review it before saving or submitting.'};
      box.querySelector('#qbDiscardLocal').onclick=()=>{clear();box.remove();status.textContent='Local safety copy discarded.'};
    }
    ['draft','submit'].forEach(id=>doc.getElementById(id)?.addEventListener('click',()=>setTimeout(()=>{if(!String(doc.getElementById('qt')?.value||'').trim())clear()},1200)));
  }
  function boot(){const f=document.querySelector(FRAME);if(!f)return;f.addEventListener('load',()=>setTimeout(()=>attach(f),250));setTimeout(()=>attach(f),700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
