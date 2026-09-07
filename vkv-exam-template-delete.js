(()=>{
  'use strict';
  let cloudReady=null,busy=false;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

  async function cloud(){
    if(cloudReady)return cloudReady;
    cloudReady=(async()=>{
      const [{getApps,getApp},{getAuth},{getFirestore,getDoc,deleteDoc,doc}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),getDoc,deleteDoc,doc};
    })();
    return cloudReady;
  }

  function templateIdFromButton(button){return String(button?.dataset?.realUseTemplate||'').trim()}
  function cardFor(button){return button.closest?.('article,.surface,.summaryCard,.templateCard,.draftCard,div')||button.parentElement}

  function enhance(){
    for(const use of document.querySelectorAll('[data-real-use-template]')){
      if(use.dataset.deleteEnhanced==='1')continue;
      use.dataset.deleteEnhanced='1';
      const id=templateIdFromButton(use);if(!id)continue;
      const del=document.createElement('button');
      del.type='button';del.className='button';del.dataset.deleteExamTemplate=id;
      del.textContent='Delete Template';
      del.style.marginLeft='8px';
      del.style.borderColor='#c96868';
      del.style.color='#8f2525';
      use.insertAdjacentElement('afterend',del);
    }
  }

  async function removeTemplate(button){
    if(busy)return;busy=true;button.disabled=true;
    try{
      const id=String(button.dataset.deleteExamTemplate||'').trim();if(!id)throw new Error('Template reference is missing.');
      const api=await cloud(),user=api.auth.currentUser;if(!user)throw new Error('Please sign in first.');
      const ref=api.doc(api.db,'examSchedules',id),snap=await api.getDoc(ref);if(!snap.exists())throw new Error('This template no longer exists.');
      const data=snap.data()||{};
      if(!(data.templateOnly===true||/^TEMPLATE_/i.test(id)))throw new Error('Safety check stopped deletion because this record is not a template.');
      if(data.ownerUid&&data.ownerUid!==user.uid)throw new Error('You can delete only your own saved examination templates.');
      const name=String(data.name||'this template').trim();
      const ok=confirm(`Delete examination template “${name}”?\n\nWARNING: This permanently deletes only the reusable template.\n\nIt will NOT delete the original/source timetable or any saved examination draft.\n\nThis action cannot be undone.`);
      if(!ok)return;
      await api.deleteDoc(ref);
      const use=document.querySelector(`[data-real-use-template="${CSS.escape(id)}"]`),card=cardFor(use||button);
      if(card&&card!==document.body)card.remove();
      const select=document.getElementById('majorTemplateSelect');if(select){const option=[...select.options].find(o=>o.value===id);option?.remove();if(select.value===id)select.value=''}
      const msg=document.getElementById('majorTemplateMsg');if(msg){msg.className='notice success';msg.innerHTML=`<b>${esc(name)}</b> deleted. The source timetable and saved drafts were not affected.`}
      document.getElementById('refreshSavedExamData')?.click();
      setTimeout(enhance,350);
    }catch(e){alert('Could not delete template: '+(e?.message||e))}
    finally{busy=false;button.disabled=false}
  }

  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-delete-exam-template]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();removeTemplate(b)},true);
  const root=document.getElementById('examApp')||document.body;
  new MutationObserver(()=>enhance()).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',()=>{setTimeout(enhance,500);setTimeout(enhance,1200)});
})();
