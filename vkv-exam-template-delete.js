(()=>{
  'use strict';
  let cloudReady=null,busy=false,adminReady=null,isAdminUser=false,authResolved=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

  async function cloud(){
    if(cloudReady)return cloudReady;
    cloudReady=(async()=>{
      const [{getApps,getApp},{getAuth,onAuthStateChanged},{getFirestore,getDoc,deleteDoc,doc}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),getDoc,deleteDoc,doc,onAuthStateChanged};
    })();
    return cloudReady;
  }

  async function checkAdmin(force=false){
    if(!authResolved)return null;
    if(adminReady&&!force)return adminReady;
    adminReady=(async()=>{
      const api=await cloud(),user=api.auth.currentUser;
      if(!user){isAdminUser=false;return false}
      try{
        const snap=await api.getDoc(api.doc(api.db,'authorizedUsers',user.uid));
        isAdminUser=snap.exists()&&snap.data()?.active===true&&String(snap.data()?.role||'').toLowerCase()==='admin';
      }catch{isAdminUser=false}
      return isAdminUser;
    })();
    return adminReady;
  }

  function templateIdFromButton(button){return String(button?.dataset?.realUseTemplate||'').trim()}
  function cardFor(button){return button.closest?.('article,.surface,.summaryCard,.templateCard,.draftCard,div')||button.parentElement}

  async function enforceControls(){
    const admin=await checkAdmin();
    if(admin===null)return;
    if(!admin){
      document.querySelectorAll('[data-delete-exam-template],[data-real-delete]').forEach(b=>b.remove());
      return;
    }
    for(const use of document.querySelectorAll('[data-real-use-template]')){
      const id=templateIdFromButton(use);if(!id)continue;
      const existing=document.querySelector(`[data-delete-exam-template="${CSS.escape(id)}"]`);if(existing)continue;
      const del=document.createElement('button');
      del.type='button';del.className='button';del.dataset.deleteExamTemplate=id;
      del.textContent='Delete Template';
      del.style.marginLeft='8px';del.style.borderColor='#c96868';del.style.color='#8f2525';
      del.title='Admin only';
      use.insertAdjacentElement('afterend',del);
    }
  }

  async function requireAdmin(){
    const admin=await checkAdmin(true);
    if(admin===true)return true;
    alert('Deletion is restricted to Admin. Exam In-charge / Exam Manager accounts cannot delete saved examination timetables or templates.');
    return false;
  }

  async function removeTemplate(button){
    if(busy)return;if(!await requireAdmin())return;busy=true;button.disabled=true;
    try{
      const id=String(button.dataset.deleteExamTemplate||'').trim();if(!id)throw new Error('Template reference is missing.');
      const api=await cloud(),user=api.auth.currentUser;if(!user)throw new Error('Please sign in first.');
      const ref=api.doc(api.db,'examSchedules',id),snap=await api.getDoc(ref);if(!snap.exists())throw new Error('This template no longer exists.');
      const data=snap.data()||{};
      if(!(data.templateOnly===true||/^TEMPLATE_/i.test(id)))throw new Error('Safety check stopped deletion because this record is not a template.');
      const name=String(data.name||'this template').trim();
      const ok=confirm(`ADMIN-ONLY ACTION\n\nDelete examination template “${name}”?\n\nWARNING: This permanently deletes only the reusable template.\n\nIt will NOT delete the original/source timetable or any saved examination draft.\n\nThis action cannot be undone.`);
      if(!ok)return;
      await api.deleteDoc(ref);
      const use=document.querySelector(`[data-real-use-template="${CSS.escape(id)}"]`),card=cardFor(use||button);
      if(card&&card!==document.body)card.remove();
      const select=document.getElementById('majorTemplateSelect');if(select){const option=[...select.options].find(o=>o.value===id);option?.remove();if(select.value===id)select.value=''}
      const msg=document.getElementById('majorTemplateMsg');if(msg){msg.className='notice success';msg.innerHTML=`<b>${esc(name)}</b> deleted by Admin. The source timetable and saved drafts were not affected.`}
      document.getElementById('refreshSavedExamData')?.click();
      setTimeout(enforceControls,350);
    }catch(e){alert('Could not delete template: '+(e?.message||e))}
    finally{busy=false;button.disabled=false}
  }

  // Capture-phase guard: protects both saved timetables and templates even if an old cached button remains.
  document.addEventListener('click',async e=>{
    const templateDelete=e.target.closest?.('[data-delete-exam-template]');
    if(templateDelete){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();await removeTemplate(templateDelete);return}
    const timetableDelete=e.target.closest?.('[data-real-delete]');
    if(!timetableDelete)return;
    const admin=await checkAdmin(true);
    if(admin===true)return;
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    alert('Deletion is restricted to Admin. Exam In-charge / Exam Manager accounts cannot delete saved examination timetables or templates.');
    timetableDelete.remove();
  },true);

  const root=document.getElementById('examApp')||document.body;
  let timer=null;
  new MutationObserver(()=>{if(timer)clearTimeout(timer);timer=setTimeout(enforceControls,60)}).observe(root,{childList:true,subtree:true});

  (async()=>{
    try{
      const api=await cloud();
      api.onAuthStateChanged(api.auth,async user=>{
        authResolved=true;adminReady=null;isAdminUser=false;
        if(user)await checkAdmin(true);
        // Re-render the saved lists after the authenticated role is known.
        document.getElementById('refreshSavedExamData')?.click();
        setTimeout(enforceControls,180);
        setTimeout(enforceControls,700);
      });
    }catch{}
  })();
})();
