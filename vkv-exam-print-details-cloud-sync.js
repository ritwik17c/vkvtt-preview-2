(()=>{
  'use strict';
  let apiReady=null,busy=false,lastSignature='';
  const $=id=>document.getElementById(id);
  const norm=v=>String(v??'').trim();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function currentDetails(){return{
    reporting:norm($('examFooterReporting')?.value),
    bus:norm($('examFooterBus')?.value),
    departure:norm($('examFooterDeparture')?.value)
  }}
  function hasUseful(x){return !!(x.reporting||x.bus||x.departure)}
  function title(){return norm($('workspaceName')?.value)||'Untitled Examination Schedule'}
  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getAuth},{getFirestore,getDocs,collection,doc,updateDoc,serverTimestamp}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),getDocs,collection,doc,updateDoc,serverTimestamp};
    })();return apiReady;
  }
  async function findTarget(){
    const a=await api(),u=a.auth.currentUser;if(!u)return null;
    const snap=await a.getDocs(a.collection(a.db,'examSchedules'));
    const name=title().toLowerCase();
    const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.id!=='EXAM_SUBJECT_MASTER'&&x.configOnly!==true&&x.templateOnly!==true&&norm(x.name).toLowerCase()===name);
    const own=rows.filter(x=>x.ownerUid===u.uid);
    const pool=own.length?own:rows;
    pool.sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));
    return pool[0]||null;
  }
  async function sync(reason='save'){
    if(busy)return false;const details=currentDetails();if(!hasUseful(details))return false;
    const sig=title()+'|'+details.reporting+'|'+details.bus+'|'+details.departure;if(reason!=='force'&&sig===lastSignature)return true;
    busy=true;try{
      const a=await api();let target=null;
      for(let i=0;i<5&&!target;i++){target=await findTarget();if(!target)await sleep(350)}
      if(!target)return false;
      await a.updateDoc(a.doc(a.db,'examSchedules',target.id),{
        'workspace.printDetails':details,
        printDetails:details,
        printDetailsUpdatedAtMs:Date.now(),
        printDetailsUpdatedByUid:a.auth.currentUser?.uid||'',
        updatedAt:a.serverTimestamp()
      });
      lastSignature=sig;return true;
    }catch(e){console.warn('[exam print details cloud sync]',e);return false}finally{busy=false}
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#saveDraft'))setTimeout(()=>sync('save'),900);
    if(e.target.closest('#submitDraft'))setTimeout(()=>sync('save'),1200);
    if(e.target.closest('#majorPrint,[data-approved-layout-view]'))setTimeout(()=>sync('force'),50);
  },true);
  document.addEventListener('change',e=>{
    if(e.target.closest('#examFooterReporting,#examFooterBus,#examFooterDeparture'))setTimeout(()=>sync('save'),700);
  },true);
  window.vkvExamSyncPrintDetails=()=>sync('force');
})();