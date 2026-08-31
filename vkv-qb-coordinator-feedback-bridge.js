// Progressive bridge: replaces only the browser prompt used by the existing Return action.
// No Firestore access; the canonical returnQ workflow remains in qb-module-v3.js.
(function(){
  'use strict';
  async function handle(e){
    const list=document.getElementById('reviewList');
    const btn=e.target.closest('button');
    if(!list||!btn||!list.contains(btn))return;
    const raw=btn.getAttribute('onclick')||'';
    const m=raw.match(/returnQ\(['"]([^'"]+)['"]\)/);
    if(!m||typeof window.returnQ!=='function'||typeof window.qbGetCoordinatorReturnNote!=='function')return;
    e.preventDefault();e.stopImmediatePropagation();
    const note=await window.qbGetCoordinatorReturnNote();
    if(!note)return;
    const originalPrompt=window.prompt;
    try{
      window.prompt=()=>note;
      await window.returnQ(m[1]);
    }finally{
      window.prompt=originalPrompt;
    }
  }
  document.addEventListener('click',handle,true);
})();