import'./vkv-theme.js?v=20260908-theme4';
import'./class-observation-teacher-bridge.js?v=20260908-observation-direct-1';
import'./class-observation-home-admin-bridge.js?v=20260908-observation-direct-1';
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
  let timer=null,busy=false,pending=false,cachedNotices=null,cachedAt=0;

  function manualSignature(notices){
    return notices.map(n=>[n.id||'',n.title||'',n.body||'',n.priority||'',n.updatedAtMs||0,n.attachment?.path||''].join('|')).join('||');
  }

  function hostMatchesManualOnly(host,notices,signature){
    if(host.dataset.manualNoticeSignature!==signature)return false;
    const items=[...host.querySelectorAll(':scope > .noticeItem')];
    if(items.length!==notices.length)return false;
    return items.every((item,i)=>cleanTitle(item.querySelector('.noticeTitle')?.textContent)===String(notices[i]?.title||'').trim());
  }

  function renderManualOnly(host,notices){
    const signature=manualSignature(notices);
    if(hostMatchesManualOnly(host,notices,signature))return false;
    host.dataset.manualNoticeSignature=signature;
    host.innerHTML='<div class="noticeHead">📢 STAFF NOTICE & CIRCULAR</div>'+notices.map(n=>
      '<div class="noticeItem" data-manual-notice-id="'+esc(n.id||'')+'">'+
      '<div class="noticeTitle">'+(n.priority==='important'?'📌 ':'')+esc(n.title||'')+'</div>'+
      (n.body?'<div class="noticeBody">'+esc(n.body)+'</div>':'')+
      '</div>'
    ).join('');
    return true;
  }

  async function addAttachments(host,notices){
    const items=[...host.querySelectorAll(':scope > .noticeItem')];
    await Promise.all(notices.map(async n=>{
      const att=n.attachment;
      if(!att?.path)return;
      const item=items.find(x=>x.dataset.manualNoticeId===String(n.id||''))||items.find(x=>cleanTitle(x.querySelector('.noticeTitle')?.textContent)===String(n.title||'').trim());
      if(!item||item.querySelector('[data-notice-attachment]'))return;
      // Show the attachment straight away, then fill in the link (or the reason it failed).
      const box=document.createElement('div');
      box.dataset.noticeAttachment='1';
      box.style.marginTop='9px';
      const icon=att.kind==='image'?'🖼':'📄';
      box.innerHTML=`<span style="display:inline-block;padding:8px 11px;border:1px solid rgba(201,162,74,.65);border-radius:9px;background:rgba(201,162,74,.10);color:inherit;font-weight:700">${icon} ${esc(att.name||'Attachment')} · loading…</span>`;
      item.appendChild(box);
      let url='',failure='';
      try{
        url=await Promise.race([
          getDownloadURL(storageRef(storage,att.path)),
          new Promise((_,reject)=>setTimeout(()=>reject(new Error('timed out after 15 seconds')),15000))
        ]);
      }catch(e){failure=String(e?.code||e?.message||e||'unknown error');console.warn('Staff notice attachment could not be loaded:',att.path,e)}
      if(!url){
        box.innerHTML=`<span style="display:inline-block;padding:8px 11px;border:1px dashed rgba(201,162,74,.9);border-radius:9px;background:rgba(201,162,74,.10);color:inherit;font-weight:700">${icon} ${esc(att.name||'Attachment')} · could not be loaded (${esc(failure)}). Please reload the page; if this continues, inform the office.</span>`;
      }else if(att.kind==='image'){
        box.innerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener" style="display:block"><img src="${esc(url)}" alt="${esc(att.name||'Notice attachment')}" style="display:block;width:100%;max-width:100%;height:auto;object-fit:contain;border:1px solid #decf9d;border-radius:10px;background:#fff"></a><div style="font-size:.78rem;color:inherit;opacity:.8;margin-top:4px">🖼 ${esc(att.name||'Image attachment')}</div>`;
      }else{
        box.innerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 11px;border:1px solid rgba(201,162,74,.85);border-radius:9px;background:rgba(201,162,74,.14);color:inherit;text-decoration:none;font-weight:800">📄 Open PDF · ${esc(att.name||'Attachment')}</a>`;
      }
    }));
  }

  async function apply(){
    if(!auth.currentUser)return;
    if(busy){pending=true;return}
    const host=document.getElementById('notice');
    if(!host)return;
    busy=true;
    try{
      // One read per 5 minutes: redraws by other Home scripts reuse the notices already fetched.
      let master=null;
      if(cachedNotices&&Date.now()-cachedAt<300000){master={staffNotices:cachedNotices}}
      else{
        const snap=await getDoc(doc(db,'master','current'));
        if(!snap.exists())return;
        const raw=snap.data()||{};master=raw.data&&typeof raw.data==='object'?raw.data:raw;
        cachedNotices=Array.isArray(master.staffNotices)?master.staffNotices:[];cachedAt=Date.now();
      }
      const notices=(Array.isArray(master.staffNotices)?master.staffNotices:[])
        .filter(n=>n&&n.active!==false&&n.visible!==false)
        .sort((a,b)=>Number(b.priority==='important')-Number(a.priority==='important')||Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0))
        .slice(0,3);
      renderManualOnly(host,notices);
      await addAttachments(host,notices);
    }catch(e){console.warn('Staff notice manual-only renderer:',e)}
    finally{busy=false;if(pending){pending=false;schedule()}}
  }

  function schedule(){if(timer)clearTimeout(timer);timer=setTimeout(apply,120)}
  onAuthStateChanged(auth,u=>{if(u){schedule();setTimeout(apply,700)}});
  const start=()=>{
    const host=document.getElementById('notice');
    if(!host)return setTimeout(start,150);
    new MutationObserver(schedule).observe(host,{childList:true,subtree:true});
    schedule();
  };
  start();
}
