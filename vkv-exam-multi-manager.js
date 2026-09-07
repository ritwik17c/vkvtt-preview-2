(()=>{
  'use strict';
  let apiReady=null,profile=null,profiles=[],rendering=false;
  const $=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getAuth,onAuthStateChanged},{getFirestore,getDoc,getDocs,collection,doc,writeBatch,serverTimestamp}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),onAuthStateChanged,getDoc,getDocs,collection,doc,writeBatch,serverTimestamp};
    })();
    return apiReady;
  }

  const examName=()=>String($('workspaceName')?.value||'Current Examination').trim()||'Current Examination';
  const isTeaching=p=>p&&p.active===true&&p.staffRecordId&&String(p.staffType||p.staffCategory||'').toLowerCase()==='teaching';
  const delegated=p=>p&&p.active===true&&p.permissions?.examDepartment===true;

  function adminPanel(article){
    const teaching=profiles.filter(isTeaching).sort((a,b)=>String(a.name||a.email||'').localeCompare(String(b.name||b.email||'')));
    const selected=new Set(teaching.filter(delegated).map(p=>p.id));
    article.innerHTML=`<div class="sectionTitle"><div><h3>Exam Managers / In-charges</h3><p>Delegate Examination Department preparation to <b>one or more</b> linked teaching staff members. This does not give the broader Manager role.</p></div></div>
      <div class="notice info" style="margin-bottom:12px"><b>Scope:</b> ${safe(examName())}<br><small>Exam Managers may prepare, edit and submit examination work. Principal/Admin alone approves, publishes and deletes saved examination work.</small></div>
      <div id="examManagerMultiList" class="inlineChecks" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:8px 12px">${teaching.length?teaching.map(p=>`<label style="padding:10px;border:1px solid #d3e1e8;border-radius:10px;background:#fbfefd"><input type="checkbox" data-exam-manager-uid="${safe(p.id)}" ${selected.has(p.id)?'checked':''}> <b>${safe(p.name||p.email)}</b>${p.teacherShortCode?` <small>(${safe(p.teacherShortCode)})</small>`:''}</label>`).join(''):'<span class="small">No linked teaching staff accounts are available.</span>'}</div>
      <div class="buttonRow" style="margin-top:12px"><button class="button primary" id="saveExamManagersMulti">Save Exam Managers</button><a class="button" href="admin-users.html?v=66.0">User Access & Roles</a><a class="button" href="admin-account-staff-link.html">Account · Staff Link</a></div>
      <div id="examManagerMultiMsg" class="notice ${selected.size?'success':'info'}" style="margin-top:12px">${selected.size?`<b>${selected.size} Exam Manager${selected.size===1?'':'s'} currently delegated.</b>`:'No Exam Manager is currently delegated.'}</div>`;
  }

  function delegatedPanel(article){
    article.innerHTML=`<div class="sectionTitle"><div><h3>Exam Managers / In-charges</h3><p>Multiple Examination Department staff may be delegated by the Principal/Admin.</p></div></div><div class="notice info"><b>Your Examination Department access is active.</b><br>Manager assignment is controlled by Principal/Admin. You may prepare/edit permitted drafts and submit them; approval, publication and deletion remain Admin-only.</div>`;
  }

  async function loadProfiles(){
    const a=await api(),user=a.auth.currentUser;if(!user)return;
    const me=await a.getDoc(a.doc(a.db,'authorizedUsers',user.uid));profile=me.exists()?me.data():null;
    if(profile?.active===true&&profile.role==='admin'){
      const snap=await a.getDocs(a.collection(a.db,'authorizedUsers'));profiles=snap.docs.map(d=>({id:d.id,...d.data()}));
    }else profiles=[];
  }

  async function render(){
    if(rendering)return;const article=$('examInchargeDelegation');if(!article)return;
    rendering=true;try{
      await loadProfiles();
      if(profile?.active===true&&profile.role==='admin')adminPanel(article);else delegatedPanel(article);
    }catch(e){article.innerHTML=`<div class="sectionTitle"><div><h3>Exam Managers / In-charges</h3></div></div><div class="notice error">Could not load delegation settings: ${safe(e?.message||e)}</div>`}
    finally{rendering=false}
  }

  async function saveManagers(){
    const a=await api(),user=a.auth.currentUser;if(!user||profile?.role!=='admin')return;
    const selected=new Set([...document.querySelectorAll('[data-exam-manager-uid]:checked')].map(x=>x.dataset.examManagerUid));
    const button=$('saveExamManagersMulti'),msg=$('examManagerMultiMsg');if(button)button.disabled=true;
    try{
      const batch=a.writeBatch(a.db),now=a.serverTimestamp();
      for(const p of profiles.filter(isTeaching)){
        const should=selected.has(p.id),was=delegated(p);
        if(should){
          batch.set(a.doc(a.db,'authorizedUsers',p.id),{
            permissions:{...(p.permissions||{}),examDepartment:true},examInCharge:true,
            examInChargeFor:examName(),examDelegationSource:'exam_module',examInChargeAssignedByUid:user.uid,examInChargeAssignedAt:now
          },{merge:true});
        }else if(was&&p.examDelegationSource==='exam_module'){
          batch.set(a.doc(a.db,'authorizedUsers',p.id),{
            permissions:{...(p.permissions||{}),examDepartment:false},examInCharge:false,examInChargeFor:'',examDelegationSource:'',examInChargeClearedAt:now
          },{merge:true});
        }
      }
      await batch.commit();
      if(msg){msg.className='notice success';msg.innerHTML=`<b>${selected.size} Exam Manager${selected.size===1?'':'s'} saved.</b> Each selected staff member now has independent Examination Department access.`}
      await render();
    }catch(e){if(msg){msg.className='notice error';msg.textContent='Could not save Exam Managers: '+(e?.message||e)}}finally{if(button)button.disabled=false}
  }

  document.addEventListener('click',e=>{if(e.target.closest?.('#saveExamManagersMulti')){e.preventDefault();e.stopImmediatePropagation();saveManagers()}},true);
  document.addEventListener('input',e=>{if(e.target.id==='workspaceName'&&profile?.role==='admin')setTimeout(render,150)});

  (async()=>{const a=await api();a.onAuthStateChanged(a.auth,()=>setTimeout(render,500))})().catch(()=>{});
  const root=$('examApp')||document.body;let timer=null;
  new MutationObserver(()=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>{if($('examInchargeDelegation')&&!$('saveExamManagersMulti'))render()},120)}).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',()=>{setTimeout(render,700);setTimeout(render,1500)});
})();
