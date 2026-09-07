import'./vkv-cache-bootstrap.js?v=20260908-production-cache-1';
import{getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';
import{getStorage,ref as storageRef,getDownloadURL}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const app=getApps().length?getApp():null;
if(app){
  const auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanTitle=s=>String(s||'').replace(/^📌\s*/,'').trim();
  let timer=null,busy=false;

  function removeLegacyExamLink(host){
    for(const a of host.querySelectorAll('a[href*="exam-timetable.html"]'))a.remove();
    for(const body of host.querySelectorAll('.noticeBody')){
      body.normalize();
      if(/Principal-approved examination timetable, invigilation and reliever duties are available\.?\s*$/i.test(body.textContent||'')){
        body.textContent='Principal-approved examination timetable, invigilation and reliever duties are available.';
      }
    }
  }

  async function apply(){
    if(busy||!auth.currentUser)return;
    const host=document.getElementById('notice');
    if(!host)return;
    removeLegacyExamLink(host);
    busy=true;
    try{
      const snap=await getDoc(doc(db,'master','current'));
      if(!snap.exists())return;
      const raw=snap.data()||{},master=raw.data&&typeof raw.data==='object'?raw.data:raw;
      const notices=(Array.isArray(master.staffNotices)?master.staffNotices:[])
        .filter(n=>n&&n.active!==false&&n.visible!==false)
        .sort((a,b)=>Number(b.priority==='important')-Number(a.priority==='important')||Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0))
        .slice(0,3);
      const items=[...host.querySelectorAll('.noticeItem')];
      for(const n of notices){
        const att=n.attachment;
        if(!att?.path)continue;
        const item=items.find(x=>cleanTitle(x.querySelector('.noticeTitle')?.textContent)===String(n.title||'Notice').trim());
        if(!item||item.querySelector('[data-notice-attachment]'))continue;
        let url='';
        try{url=await getDownloadURL(storageRef(storage,att.path))}catch{continue}
        const box=document.createElement('div');
        box.dataset.noticeAttachment='1';
        box.style.marginTop='9px';
        if(att.kind==='image'){
          box.innerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block"><img src="${esc(url)}" alt="${esc(att.name||'Notice attachment')}" style="display:block;max-width:min(100%,420px);max-height:320px;object-fit:contain;border:1px solid #decf9d;border-radius:10px;background:#fff"></a><div style="font-size:.78rem;color:#6c6043;margin-top:4px">🖼 ${esc(att.name||'Image attachment')}</div>`;
        }else{
          box.innerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 11px;border:1px solid #d6c58a;border-radius:9px;background:#fff;color:#17364f;text-decoration:none;font-weight:800">📄 Open PDF · ${esc(att.name||'Attachment')}</a>`;
        }
        item.appendChild(box);
      }
    }catch(e){console.warn('Staff notice attachment renderer:',e)}
    finally{busy=false}
  }

  function schedule(){if(timer)clearTimeout(timer);timer=setTimeout(apply,120)}
  onAuthStateChanged(auth,u=>{if(u){schedule();setTimeout(apply,700)}});
  const start=()=>{const host=document.getElementById('notice');if(!host)return setTimeout(start,150);removeLegacyExamLink(host);new MutationObserver(()=>{removeLegacyExamLink(host);schedule()}).observe(host,{childList:true,subtree:true});schedule()};
  start();
}
