(()=>{
  'use strict';
  let apiReady=null,user=null,profile=null,records=[],busy=false;
  const $=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const fmtMs=v=>v?new Date(Number(v)).toLocaleString('en-GB'):'';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const isAdmin=()=>profile?.active===true&&String(profile.role||'').toLowerCase()==='admin';
  const permitted=()=>profile?.active===true&&(isAdmin()||profile.permissions?.examDepartment===true);
  const isTemplate=x=>x?.templateOnly===true||/^TEMPLATE_/i.test(String(x?.id||''));
  const isSchedule=x=>!isTemplate(x)&&x?.configOnly!==true&&x?.workspace;
  const templateApproved=x=>x?.templateApproved===true||String(x?.status||'').toLowerCase()==='approved';
  const timetablePublished=x=>String(x?.status||'').toLowerCase()==='published';
  const approvableStatus=x=>['draft','submitted','returned','saved'].includes(String(x?.status||'draft').toLowerCase());

  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getAuth,onAuthStateChanged},{getFirestore,getDoc,getDocs,collection,doc,setDoc,deleteDoc,writeBatch,serverTimestamp}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),onAuthStateChanged,getDoc,getDocs,collection,doc,setDoc,deleteDoc,writeBatch,serverTimestamp};
    })();
    return apiReady;
  }

  function scheduleCounts(x){
    const ws=x?.workspace||{},generated=ws.timetable?.events?.length||0,manual=ws.manualTimetable?.assignments?.length||x.manualTimetable?.assignments?.length||0,duties=ws.duties?.invigilation?.length||0;
    return{papers:generated||manual,generated,manual,duties};
  }
  function templateCounts(x){
    const t=x?.template||{},classes=t.classes||Object.keys(t.subjects||{}),subjects=Object.values(t.subjects||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
    return{classes:classes.length,subjects};
  }

  function cleanupLegacyPanels(){
    const pane=document.querySelector('[data-pane="outputs"]');if(!pane)return;
    for(const article of pane.querySelectorAll('article.surface')){
      if(article.id==='examManagerSharedSchedules')continue;
      const heading=String(article.querySelector('h3')?.textContent||'').trim();
      if(/^(Saved Examination Timetables|Cloud Examination Workspaces)$/i.test(heading))article.style.display='none';
    }
    const oldApproved=$('approvedExamManagerOutputs');if(oldApproved)oldApproved.style.display='none';
    const setup=document.querySelector('[data-pane="setup"]');
    for(const article of setup?.querySelectorAll('article.surface')||[]){
      if(article.id==='majorTemplateBox')continue;
      const heading=String(article.querySelector('h3')?.textContent||'').trim();
      if(/^Saved Examination Templates$/i.test(heading))article.style.display='none';
    }
  }

  function installSchedulePanel(){
    const pane=document.querySelector('[data-pane="outputs"]');if(!pane)return null;
    let box=$('examManagerSharedSchedules');
    if(!box){
      box=document.createElement('article');box.id='examManagerSharedSchedules';box.className='surface';
      box.innerHTML=`<div class="sectionTitle"><div><h3>Saved Examination Timetables</h3><p>Single shared library for authorised Exam Managers. Principal/Admin controls approval, publication and deletion.</p></div><button class="button" id="refreshExamManagerSharedLibrary">Refresh</button></div><div id="examManagerSharedScheduleList" class="draftList"><div class="notice info">Loading saved timetables…</div></div>`;
      pane.appendChild(box);
    }
    cleanupLegacyPanels();return box;
  }

  function installTemplatePanel(){
    const parent=$('majorTemplateBox');if(!parent)return null;
    let box=$('examTemplateApprovalLibrary');
    if(!box){
      box=document.createElement('div');box.id='examTemplateApprovalLibrary';box.style.marginTop='16px';
      box.innerHTML='<div class="sectionTitle"><div><h3>Saved Examination Templates</h3><p>Approved templates are reusable by all Exam Managers. Draft templates remain under Admin review.</p></div></div><div id="examTemplateApprovalList" class="draftList"><div class="notice info">Loading templates…</div></div>';
      parent.appendChild(box);
    }
    cleanupLegacyPanels();return box;
  }

  function statusLabel(x){
    const s=String(x?.status||'draft').toLowerCase();
    if(isTemplate(x)&&templateApproved(x))return'Approved';
    if(s==='published')return'Approved & Published';if(s==='submitted')return'Submitted';if(s==='returned')return'Returned';return'Draft';
  }
  function statusClass(x){return isTemplate(x)&&templateApproved(x)?'published':String(x?.status||'draft').toLowerCase()}

  function renderSchedules(){
    const host=$('examManagerSharedScheduleList');if(!host)return;
    const list=records.filter(isSchedule).sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));
    host.innerHTML=list.length?list.map(x=>{
      const status=String(x.status||'draft').toLowerCase(),own=x.ownerUid===user?.uid,c=scheduleCounts(x),canApprove=isAdmin()&&approvableStatus(x)&&c.papers>0;
      const openButton=isAdmin()?`<button class="button" data-library-open="${safe(x.id)}">Open</button>`:(own&&['draft','returned'].includes(status)?`<button class="button" data-library-open="${safe(x.id)}">Open</button>`:`<button class="button" data-library-view="${safe(x.id)}">View / Print</button>`);
      const approve=canApprove?`<button class="button primary" data-approve-timetable="${safe(x.id)}">Approve & Publish</button>`:'';
      const del=isAdmin()&&!timetablePublished(x)?`<button class="button" style="border-color:#d99;color:#8f2525" data-library-delete="${safe(x.id)}" data-library-kind="timetable">Delete</button>`:'';
      return `<div class="draftCard"><h4>${safe(x.name||'Untitled Examination Schedule')}</h4><p><span class="workflowPill ${safe(statusClass(x))}">${safe(statusLabel(x))}</span>${safe(fmtMs(x.updatedAtMs||x.createdAtMs))}</p><p>${c.papers} timetable assignment${c.papers===1?'':'s'} · ${c.duties} invigilation dut${c.duties===1?'y':'ies'}</p><p><small>Prepared by: ${safe(x.ownerName||x.ownerEmail||'Exam Manager')}${own?' · Your timetable':''}</small></p>${isAdmin()&&approvableStatus(x)&&!c.papers?'<div class="notice warn"><b>Approval unavailable:</b> no saved timetable assignments are present.</div>':''}<div class="buttonRow">${openButton}${timetablePublished(x)?`<button class="button primary" data-library-view="${safe(x.id)}">Print / View</button>`:''}${approve}${del}</div></div>`;
    }).join(''):'<div class="notice info">No saved examination timetable found.</div>';
  }

  function templateUsable(x){return isAdmin()||x.ownerUid===user?.uid||templateApproved(x)}
  function renderTemplates(){
    const list=records.filter(isTemplate).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    const sel=$('majorTemplateSelect');
    if(sel){
      const selected=sel.value;
      const visible=list.filter(x=>isAdmin()||x.ownerUid===user?.uid||templateApproved(x));
      sel.innerHTML='<option value="">Select saved template…</option>'+visible.map(t=>`<option value="${safe(t.id)}">${safe(t.name||t.id)}${templateApproved(t)?' · Approved':t.ownerUid===user?.uid?' · Draft':' · Awaiting approval'}</option>`).join('');
      if(visible.some(x=>x.id===selected))sel.value=selected;
    }
    installTemplatePanel();
    const host=$('examTemplateApprovalList');if(!host)return;
    host.innerHTML=list.length?list.map(t=>{
      const own=t.ownerUid===user?.uid,c=templateCounts(t),approved=templateApproved(t),canUse=templateUsable(t),canApprove=isAdmin()&&!approved&&approvableStatus(t);
      return `<div class="draftCard"><h4>${safe(t.name||'Examination Template')}</h4><p><span class="workflowPill ${approved?'published':safe(statusClass(t))}">${approved?'Approved':'Draft · Awaiting Admin Approval'}</span>${safe(fmtMs(t.updatedAtMs||t.createdAtMs))}</p><p>${c.classes} class${c.classes===1?'':'es'} · ${c.subjects} subject selection${c.subjects===1?'':'s'}</p><p><small>Prepared by: ${safe(t.ownerName||t.ownerEmail||'Exam Manager')}${own?' · Your template':''}</small></p><div class="buttonRow">${canUse?`<button class="button" data-library-use-template="${safe(t.id)}">Use for New Timetable</button>`:'<span class="notice info" style="display:inline-block;margin:0">Awaiting Admin approval before shared use.</span>'}${canApprove?`<button class="button primary" data-approve-template="${safe(t.id)}">Approve Template</button>`:''}${isAdmin()?`<button class="button" style="border-color:#d99;color:#8f2525" data-library-delete="${safe(t.id)}" data-library-kind="template">Delete Template</button>`:''}</div></div>`;
    }).join(''):'<div class="notice info">No saved examination template found.</div>';
  }

  async function load(){
    if(!user||!permitted())return;
    installSchedulePanel();installTemplatePanel();
    try{
      const a=await api(),snap=await a.getDocs(a.collection(a.db,'examSchedules'));
      records=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.id!=='EXAM_SUBJECT_MASTER'&&x.configOnly!==true);
      renderSchedules();renderTemplates();cleanupLegacyPanels();
    }catch(e){
      const sh=$('examManagerSharedScheduleList'),th=$('examTemplateApprovalList');
      if(sh)sh.innerHTML='<div class="notice error">Could not load saved examination timetables: '+safe(e?.message||e)+'</div>';
      if(th)th.innerHTML='<div class="notice error">Could not load saved examination templates: '+safe(e?.message||e)+'</div>';
    }
  }

  function applySharedTemplate(item){
    if(!item||!templateUsable(item)){alert('This shared template is awaiting Admin approval.');return false}
    const desired=item.template||{},classes=desired.classes||Object.keys(desired.subjects||{});if(!classes.length){alert('This template does not contain class/subject selections.');return false}
    const title=$('workspaceName');if(title){title.value=item.name||'Examination Template';title.dispatchEvent(new Event('input',{bubbles:true}));title.dispatchEvent(new Event('change',{bubbles:true}))}
    try{$('majorNoClasses')?.click()}catch{}
    setTimeout(()=>{for(const cls of classes){const subs=desired.subjects?.[cls]||[];if(subs.length)window.vkvExamWorkspace?.applySubjectMaster?.(cls,clone(subs))}document.dispatchEvent(new CustomEvent('vkv-exam-template-fresh-draft',{detail:{name:item.name||'Examination Template',sharedTemplateId:item.id}}));const msg=$('majorTemplateMsg');if(msg){msg.className='notice success';msg.innerHTML=`<b>${safe(item.name||'Template')}</b> loaded. Select fresh examination dates for this timetable.`}},120);return true;
  }
  window.vkvExamOpenSharedTemplate=id=>{const item=records.find(x=>x.id===String(id||''));if(!item||!isTemplate(item))return false;if(item.ownerUid===user?.uid)return false;return applySharedTemplate(item)};

  function eventRows(ws){
    const generated=[...(ws?.timetable?.events||[])];if(generated.length)return generated.map(e=>({date:e.date||'',day:e.day||'',className:e.className||'',subject:e.subject||'',roomId:e.roomId||''}));
    const manual=ws?.manualTimetable?.assignments||[];return manual.map(a=>({date:a.date||'',day:a.day||'',className:a.className||'',subject:a.subject||'',roomId:a.roomId||a.className||''}));
  }
  function viewPrint(item){
    const ws=item?.workspace;if(!ws)return;const events=eventRows(ws).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.className).localeCompare(String(b.className),undefined,{numeric:true}));
    const rows=events.map(e=>`<tr><td>${safe(e.date||'')}</td><td>${safe(e.day||'')}</td><td>${safe(e.className||'')}</td><td>${safe(e.subject||'')}</td><td>${safe(e.roomId||'')}</td></tr>`).join('');
    const w=open('','_blank');if(!w){alert('Allow pop-ups to view this saved timetable.');return}
    w.document.write(`<!doctype html><html><head><title>${safe(item.name||'Saved Examination Timetable')}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #222;padding:7px;text-align:left}button{padding:9px 14px;margin:0 0 14px}</style></head><body><button onclick="window.print()">Print</button><h1>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h1><h2>${safe(item.name||'Saved Examination Timetable')}</h2><p><b>Status:</b> ${safe(statusLabel(item))} &nbsp; <b>Prepared by:</b> ${safe(item.ownerName||item.ownerEmail||'Exam Manager')}</p><table><thead><tr><th>Date</th><th>Day</th><th>Class</th><th>Subject</th><th>Room / Venue</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No timetable rows are stored in this workspace.</td></tr>'}</tbody></table></body></html>`);w.document.close();
  }

  async function approveTimetable(id){
    if(busy||!isAdmin())return;const item=records.find(x=>x.id===id);if(!item||!isSchedule(item)||!approvableStatus(item))return;
    const counts=scheduleCounts(item);if(!counts.papers){alert('This timetable cannot be approved because it contains no saved timetable assignments.');return}
    if(!confirm(`Approve and publish “${item.name||'this examination timetable'}”?\n\nAfter approval it becomes read-only output for Exam Managers and the published examination schedule for staff.`))return;
    busy=true;try{
      const a=await api(),now=Date.now(),published={schemaVersion:1,scheduleId:item.id,name:item.name||'Examination Schedule',description:item.description||'',workspace:clone(item.workspace),status:'published',approvedAtMs:now,approvedByUid:user.uid,approvedByName:profile?.name||user.displayName||user.email||'Principal',updatedAt:a.serverTimestamp()},batch=a.writeBatch(a.db);
      batch.set(a.doc(a.db,'publishedExam','current'),published);
      batch.set(a.doc(a.db,'examSchedules',item.id),{status:'published',approvedAtMs:now,approvedByUid:user.uid,approvedByEmail:user.email||'',updatedAtMs:now,updatedAt:a.serverTimestamp()},{merge:true});
      await batch.commit();await load();
    }catch(e){alert('Could not approve timetable: '+(e?.message||e))}finally{busy=false}
  }

  async function approveTemplate(id){
    if(busy||!isAdmin())return;const item=records.find(x=>x.id===id);if(!item||!isTemplate(item)||templateApproved(item))return;
    const c=templateCounts(item);if(!c.classes&&!c.subjects){alert('This template cannot be approved because it contains no reusable class/subject structure.');return}
    if(!confirm(`Approve examination template “${item.name||'this template'}”?\n\nAfter approval it becomes a reusable shared template for all authorised Exam Managers.`))return;
    busy=true;try{const a=await api(),now=Date.now();await a.setDoc(a.doc(a.db,'examSchedules',item.id),{status:'approved',templateApproved:true,approvedAtMs:now,approvedByUid:user.uid,approvedByEmail:user.email||'',updatedAtMs:now,updatedAt:a.serverTimestamp()},{merge:true});await load()}catch(e){alert('Could not approve template: '+(e?.message||e))}finally{busy=false}
  }

  async function removeRecord(id,kind){
    if(busy||!isAdmin())return;const item=records.find(x=>x.id===id);if(!item)return;if(kind==='timetable'&&timetablePublished(item)){alert('Published timetables are protected from deletion in the production interface.');return}
    const label=kind==='template'?'template':'saved timetable';if(!confirm(`ADMIN-ONLY ACTION\n\nDelete ${label} “${item.name||id}”?\n\nThis is permanent and cannot be undone.`))return;
    busy=true;try{const a=await api();await a.deleteDoc(a.doc(a.db,'examSchedules',id));await load()}catch(e){alert('Could not delete '+label+': '+(e?.message||e))}finally{busy=false}
  }

  function openCore(id){
    const existing=document.querySelector(`[data-open-cloud="${CSS.escape(id)}"]`);if(existing){existing.click();return true}
    const refresh=$('refreshSavedExamData');refresh?.click();setTimeout(()=>{document.querySelector(`[data-open-cloud="${CSS.escape(id)}"]`)?.click()},350);return !!refresh;
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#refreshExamManagerSharedLibrary')){load();return}
    let b=e.target.closest?.('[data-library-open]');if(b){openCore(b.dataset.libraryOpen);return}
    b=e.target.closest?.('[data-library-view]');if(b){viewPrint(records.find(x=>x.id===b.dataset.libraryView));return}
    b=e.target.closest?.('[data-approve-timetable]');if(b){approveTimetable(b.dataset.approveTimetable);return}
    b=e.target.closest?.('[data-approve-template]');if(b){approveTemplate(b.dataset.approveTemplate);return}
    b=e.target.closest?.('[data-library-delete]');if(b){removeRecord(b.dataset.libraryDelete,b.dataset.libraryKind);return}
    b=e.target.closest?.('[data-library-use-template]');if(b){const item=records.find(x=>x.id===b.dataset.libraryUseTemplate);if(!item)return;const sel=$('majorTemplateSelect');if(sel)sel.value=item.id;if(item.ownerUid!==user?.uid){applySharedTemplate(item);return}$('majorLoadTemplate')?.click();return}
    if(e.target.closest?.('[data-pane-target="setup"],[data-pane-target="outputs"]'))setTimeout(load,180);
  },true);

  (async()=>{const a=await api();a.onAuthStateChanged(a.auth,async u=>{user=u;profile=null;if(!u)return;try{const me=await a.getDoc(a.doc(a.db,'authorizedUsers',u.uid));profile=me.exists()?me.data():null;if(permitted())setTimeout(load,450)}catch{}})})().catch(()=>{});
  let tries=0,t=setInterval(()=>{if(!permitted())return;if($('majorTemplateSelect')||$('[data-pane="outputs"]'))load();if(++tries>18)clearInterval(t)},700);
})();
