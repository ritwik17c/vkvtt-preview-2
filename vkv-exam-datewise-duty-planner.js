(()=>{
  'use strict';
  let apiReady=null,user=null,profile=null,master=null,teachers=[],masterVenues=[],planId='',plan={venues:[],dates:{},meta:{}};
  const $=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const fmt=d=>{const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:d};
  const dateName=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long'})}catch{return''}};

  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getAuth,onAuthStateChanged},{getFirestore,getDoc,getDocs,setDoc,collection,doc,serverTimestamp}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),onAuthStateChanged,getDoc,getDocs,setDoc,collection,doc,serverTimestamp};
    })();return apiReady;
  }

  function unwrap(raw){return raw?.data&&typeof raw.data==='object'?{...raw,...raw.data}:raw||{}}
  function classList(raw){
    const m=unwrap(raw),out=[];
    for(const c of m.classes||[]){const v=String(typeof c==='string'?c:(c?.name||c?.id||c?.class||'')).trim();if(v)out.push(v)}
    for(const r of m.records||[]){const v=String(r?.class||r?.className||'').trim();if(v)out.push(v)}
    return [...new Set(out)].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
  }
  function teacherList(raw){const m=unwrap(raw);return (m.teachers||[]).filter(x=>x&&x.active!==false).map(x=>({code:String(x.code||x.shortCode||x.id||'').trim(),name:String(x.name||x.code||'').trim()})).filter(x=>x.code).sort((a,b)=>a.name.localeCompare(b.name))}
  function levelFor(v){const s=String(v||'').toUpperCase();if(/\b(?:B1|B2|B3|I|II|III|IV|V)\b/.test(s))return'Jr.';if(/\b(?:VI|VII|VIII|IX|X|XI|XII)\b/.test(s))return'Sr.';return''}
  function selectedDates(){return [...document.querySelectorAll('[data-exam-date]:checked:not(:disabled)')].map(x=>x.dataset.examDate).filter(Boolean).sort()}
  function teacherOptions(selected=''){return '<option value="">— Select —</option>'+teachers.map(t=>`<option value="${safe(t.code)}" ${t.code===selected?'selected':''}>${safe(t.name)} (${safe(t.code)})</option>`).join('')}
  function teacherName(code){return teachers.find(t=>t.code===code)?.name||code||''}

  function ensurePlanDates(){
    const dates=selectedDates();for(const d of dates){if(!plan.dates[d])plan.dates[d]={rows:{},seniorObserver:'',juniorObserver:''};for(const v of plan.venues){if(!plan.dates[d].rows[v.id])plan.dates[d].rows[v.id]={invigilator:'',reliever:'',relievingTime:plan.meta.defaultRelievingTime||'11:30-11:55'}}}
    for(const d of Object.keys(plan.dates))if(!dates.includes(d))delete plan.dates[d];
  }
  function venueId(name){return 'V_'+String(name||'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,50)}
  function addVenue(name,custom=false){name=String(name||'').trim();if(!name)return;const id=venueId(name);if(!plan.venues.some(v=>v.id===id))plan.venues.push({id,name,level:levelFor(name),custom});ensurePlanDates()}
  function removeVenue(id){plan.venues=plan.venues.filter(v=>v.id!==id);for(const d of Object.values(plan.dates))delete d.rows?.[id]}

  function install(){
    const pane=document.querySelector('[data-pane="duties"]');if(!pane||$('datewiseDutyPlanner'))return false;
    const oldFirst=pane.querySelector('article.surface');const box=document.createElement('article');box.id='datewiseDutyPlanner';box.className='surface';
    box.innerHTML=`<div class="sectionTitle"><div><h3>Date-wise Duty / Invigilation Planner</h3><p>Choose examination rooms first. The selected venues then populate one duty table for every selected examination date.</p></div><div class="buttonRow"><button type="button" class="button" id="refreshDutyPlanner">Refresh Dates</button></div></div>
      <div id="dutyPlannerNotice" class="notice info">Select examination dates in Exam Setup, then assign classrooms.</div>
      <div style="display:grid;grid-template-columns:minmax(280px,1.2fr) minmax(260px,1fr);gap:16px;align-items:start">
        <div><h4>1. Assign Classrooms / Venues</h4><div id="dutyVenueChecks" class="inlineChecks" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:7px"></div><div class="buttonRow" style="margin-top:10px"><input id="extraDutyVenue" placeholder="Library, Activity Room…" style="max-width:280px"><button class="button" id="addExtraDutyVenue" type="button">+ Add Venue</button></div></div>
        <div><h4>Duty-list details</h4><div class="formGrid two"><label>Junior exam timing<input id="dutyJuniorTime" value="10:00 am–12:00 pm"></label><label>Senior exam timing<input id="dutySeniorTime" value="11:00 am–02:00 pm"></label><label>Question paper collection<input id="dutyCollectionTime" value="09:30 am (Jr.) & 10:30 am (Sr.)"></label><label>Distribution instruction<input id="dutyDistribution" value="Before 15 min of Exam"></label><label>Default relieving time<input id="dutyDefaultRelieving" value="11:30-11:55"></label></div></div>
      </div>
      <div class="buttonRow" style="margin:16px 0"><button class="button primary" id="saveDutyCloudDraft">Save Duty Cloud Draft</button><button class="button" id="saveDutyTemplate">Save as Duty Template</button><button class="button" id="printAllDutyDates">Print All Duty Dates</button></div>
      <div id="dutyCloudMsg" class="notice info">Duty plan not yet saved.</div>
      <div id="datewiseDutyTables"></div>
      <div style="margin-top:18px"><h4>Saved Duty Drafts & Templates</h4><div id="savedDutyPlans" class="draftList"><div class="small">Loading…</div></div></div>`;
    if(oldFirst)oldFirst.before(box);else pane.appendChild(box);renderVenues();render();loadSaved().catch(()=>{});return true;
  }

  function renderVenues(){
    const host=$('dutyVenueChecks');if(!host)return;
    host.innerHTML=masterVenues.length?masterVenues.map(name=>{const id=venueId(name),checked=plan.venues.some(v=>v.id===id);return `<label style="padding:7px;border:1px solid #d7e4ea;border-radius:9px"><input type="checkbox" data-master-duty-venue="${safe(name)}" ${checked?'checked':''}> ${safe(name)}</label>`}).join(''):'<span class="small">Master timetable classes are still loading.</span>';
  }

  function syncMeta(){plan.meta={...(plan.meta||{}),juniorTime:$('dutyJuniorTime')?.value||'',seniorTime:$('dutySeniorTime')?.value||'',collectionTime:$('dutyCollectionTime')?.value||'',distribution:$('dutyDistribution')?.value||'',defaultRelievingTime:$('dutyDefaultRelieving')?.value||''}}
  function restoreMeta(){if(!$('dutyJuniorTime'))return;$('dutyJuniorTime').value=plan.meta?.juniorTime||'10:00 am–12:00 pm';$('dutySeniorTime').value=plan.meta?.seniorTime||'11:00 am–02:00 pm';$('dutyCollectionTime').value=plan.meta?.collectionTime||'09:30 am (Jr.) & 10:30 am (Sr.)';$('dutyDistribution').value=plan.meta?.distribution||'Before 15 min of Exam';$('dutyDefaultRelieving').value=plan.meta?.defaultRelievingTime||'11:30-11:55'}

  function conflict(date,role,code,currentVenue){
    if(!code)return'';const rows=plan.dates?.[date]?.rows||{};
    for(const [venueId,row] of Object.entries(rows)){if(venueId===currentVenue)continue;if(row.invigilator===code||row.reliever===code)return teacherName(code)+' already has a duty on '+fmt(date)+'.'}
    const own=rows[currentVenue]||{};if(role==='reliever'&&own.invigilator===code)return teacherName(code)+' cannot be invigilator and reliever in the same room.';if(role==='invigilator'&&own.reliever===code)return teacherName(code)+' cannot be invigilator and reliever in the same room.';return''
  }

  function render(){
    if(!$('datewiseDutyTables'))return;syncMeta();ensurePlanDates();const dates=selectedDates();
    const notice=$('dutyPlannerNotice');if(notice){notice.className='notice '+(dates.length&&plan.venues.length?'success':'info');notice.innerHTML=dates.length?`<b>${dates.length} examination date${dates.length===1?'':'s'} linked.</b> ${plan.venues.length?plan.venues.length+' selected venue(s) will appear on every date.':'Choose classrooms/venues to build duty tables.'}`:'Select examination dates in <b>Exam Setup</b> first.'}
    const host=$('datewiseDutyTables');
    if(!dates.length||!plan.venues.length){host.innerHTML='<div class="notice info">No date-wise duty table yet.</div>';return}
    host.innerHTML=dates.map(date=>{const day=plan.dates[date]||{rows:{}},rows=plan.venues.map((v,i)=>{const r=day.rows[v.id]||{};return `<tr data-duty-plan-date="${date}" data-duty-plan-venue="${safe(v.id)}"><td>${safe(v.level||'')}</td><td>${i+1}</td><td><b>${safe(v.name)}</b>${v.custom?' <small>Custom venue</small>':''}</td><td><select data-duty-plan-role="invigilator">${teacherOptions(r.invigilator)}</select></td><td><select data-duty-plan-role="reliever">${teacherOptions(r.reliever)}</select></td><td><input data-duty-plan-time value="${safe(r.relievingTime||plan.meta.defaultRelievingTime||'')}"></td><td>${v.custom?`<button class="button" data-remove-duty-venue="${safe(v.id)}" type="button">Remove</button>`:''}</td></tr>`}).join('');return `<article class="surface" style="margin-top:14px"><div class="sectionTitle"><div><h4 style="margin:0">${safe(fmt(date))} · ${safe(dateName(date))}</h4><p>One venue-wise duty list for this examination date.</p></div><button class="button" data-print-duty-date="${date}" type="button">Print This Date</button></div><div class="formGrid two"><label>Senior Observer<select data-duty-observer="senior" data-duty-date="${date}">${teacherOptions(day.seniorObserver)}</select></label><label>Junior Observer<select data-duty-observer="junior" data-duty-date="${date}">${teacherOptions(day.juniorObserver)}</select></label></div><div class="tableWrap"><table><thead><tr><th>Level</th><th>Room No.</th><th>Class Room / Venue</th><th>Invigilator</th><th>Reliever</th><th>Relieving Time</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></article>`}).join('');
  }

  function payload(templateOnly=false){syncMeta();ensurePlanDates();const name=String($('workspaceName')?.value||'Examination').trim()||'Examination';return {schemaVersion:1,configOnly:true,dutyPlanOnly:!templateOnly,dutyTemplateOnly:templateOnly,status:'draft',name:(templateOnly?'Duty Template · ':'Duty List · ')+name,examName:name,ownerUid:user.uid,ownerName:profile?.name||user.displayName||user.email||'Exam Manager',ownerEmail:user.email||'',updatedAtMs:Date.now(),dutyPlan:templateOnly?{venues:clone(plan.venues),meta:clone(plan.meta)}:clone(plan)}}

  async function saveDraft(){
    if(!user)return;const a=await api(),button=$('saveDutyCloudDraft');button.disabled=true;try{const id=planId||('DUTY_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),data=payload(false);await a.setDoc(a.doc(a.db,'examSchedules',id),{...data,createdAtMs:data.createdAtMs||Date.now(),updatedAt:a.serverTimestamp()},{merge:true});planId=id;$('dutyCloudMsg').className='notice success';$('dutyCloudMsg').innerHTML=`<b>Duty cloud draft saved.</b> ${safe(data.examName)} · ${selectedDates().length} date(s) · ${plan.venues.length} venue(s).`;await loadSaved()}catch(e){$('dutyCloudMsg').className='notice error';$('dutyCloudMsg').textContent='Could not save duty cloud draft: '+(e?.message||e)}finally{button.disabled=false}
  }
  async function saveTemplate(){
    if(!user)return;const a=await api(),name=prompt('Duty template name:',String($('workspaceName')?.value||'Examination')+' Duty Template');if(name===null)return;const id='DUTY_TEMPLATE_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),data={...payload(true),name:name.trim()||'Duty Template'};try{await a.setDoc(a.doc(a.db,'examSchedules',id),{...data,createdAtMs:Date.now(),updatedAt:a.serverTimestamp()});$('dutyCloudMsg').className='notice success';$('dutyCloudMsg').innerHTML='<b>Duty template saved.</b> Dates and staff assignments were intentionally excluded; venue structure and duty-list timings were retained.';await loadSaved()}catch(e){$('dutyCloudMsg').className='notice error';$('dutyCloudMsg').textContent='Could not save duty template: '+(e?.message||e)}}

  async function loadSaved(){
    if(!user||!$('savedDutyPlans'))return;const a=await api();try{const snap=await a.getDocs(a.collection(a.db,'examSchedules')),items=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.dutyPlanOnly||x.dutyTemplateOnly)&&(profile?.role==='admin'||x.ownerUid===user.uid)).sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));$('savedDutyPlans').innerHTML=items.length?items.map(x=>`<div class="draftCard"><h4>${safe(x.name||'Duty Plan')}</h4><p>${x.dutyTemplateOnly?'Reusable duty template':'Cloud duty draft'} · ${new Date(x.updatedAtMs||x.createdAtMs||Date.now()).toLocaleString('en-GB')}</p><div class="buttonRow"><button class="button" data-load-duty-plan="${safe(x.id)}">${x.dutyTemplateOnly?'Use Template':'Open Duty Draft'}</button></div></div>`).join(''):'<div class="notice info">No saved duty drafts/templates yet.</div>'}catch(e){$('savedDutyPlans').innerHTML='<div class="notice error">Could not load duty drafts/templates: '+safe(e?.message||e)+'</div>'}
  }
  async function loadPlan(id){const a=await api(),snap=await a.getDoc(a.doc(a.db,'examSchedules',id));if(!snap.exists())return;const x=snap.data()||{};if(x.dutyTemplateOnly){planId='';plan={venues:clone(x.dutyPlan?.venues||[]),meta:clone(x.dutyPlan?.meta||{}),dates:{}}}else{planId=id;plan=clone(x.dutyPlan||{venues:[],dates:{},meta:{}})}restoreMeta();renderVenues();render();document.querySelector('[data-pane-target="duties"]')?.click();$('datewiseDutyPlanner')?.scrollIntoView({behavior:'smooth',block:'start'})}

  function printDate(date){
    syncMeta();const day=plan.dates?.[date];if(!day)return;const name=String($('workspaceName')?.value||'Examination'),rows=plan.venues.map((v,i)=>{const r=day.rows?.[v.id]||{};return `<tr><td>${safe(v.level)}</td><td>${i+1}</td><td>${safe(v.name)}</td><td>${safe(teacherName(r.invigilator))}</td><td>${safe(teacherName(r.reliever))}</td><td>${safe(r.relievingTime||'')}</td></tr>`}).join('');const w=open('','_blank');if(!w)return;w.document.write(`<!doctype html><html><head><title>Invigilators Duty List ${safe(fmt(date))}</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h2,h3,p{text-align:center;margin:5px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #222;padding:7px;text-align:left;font-size:12px}.meta{text-align:left;margin:10px 0}.footer{margin-top:24px;text-align:right}</style></head><body><h2>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h2><h3>INVIGILATORS’ DUTY LIST</h3><p><b>${safe(name)}</b></p><p>DATE: ${safe(fmt(date))} · ${safe(dateName(date))}</p><div class="meta"><b>Exam Timings:</b> Junior: ${safe(plan.meta.juniorTime||'')} · Senior: ${safe(plan.meta.seniorTime||'')}<br><b>Question Paper Collection:</b> ${safe(plan.meta.collectionTime||'')}<br><b>Question Paper Distribution:</b> ${safe(plan.meta.distribution||'')}</div><table><thead><tr><th>Level</th><th>Room No.</th><th>Class Room</th><th>Name of the Invigilator</th><th>Name of the Reliever</th><th>Relieving Time</th></tr></thead><tbody>${rows}</tbody></table><p class="meta"><b>Observers:</b> (Sr.) ${safe(teacherName(day.seniorObserver))} &nbsp;&nbsp; (Jr.) ${safe(teacherName(day.juniorObserver))}</p><div class="footer">Exam Dept.</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}

  document.addEventListener('change',e=>{
    const mv=e.target.closest?.('[data-master-duty-venue]');if(mv){if(mv.checked)addVenue(mv.dataset.masterDutyVenue);else removeVenue(venueId(mv.dataset.masterDutyVenue));render();return}
    const role=e.target.closest?.('[data-duty-plan-role]');if(role){const tr=role.closest('[data-duty-plan-date]'),date=tr?.dataset.dutyPlanDate,venue=tr?.dataset.dutyPlanVenue;if(!date||!venue)return;const row=plan.dates[date].rows[venue],kind=role.dataset.dutyPlanRole,old=row[kind]||'',problem=conflict(date,kind,role.value,venue);if(problem){alert(problem);role.value=old;return}row[kind]=role.value;render();return}
    const time=e.target.closest?.('[data-duty-plan-time]');if(time){const tr=time.closest('[data-duty-plan-date]');plan.dates[tr.dataset.dutyPlanDate].rows[tr.dataset.dutyPlanVenue].relievingTime=time.value;return}
    const obs=e.target.closest?.('[data-duty-observer]');if(obs){const d=obs.dataset.dutyDate;if(plan.dates[d])plan.dates[d][obs.dataset.dutyObserver==='senior'?'seniorObserver':'juniorObserver']=obs.value;return}
    if(['dutyJuniorTime','dutySeniorTime','dutyCollectionTime','dutyDistribution','dutyDefaultRelieving'].includes(e.target.id)){syncMeta();if(e.target.id==='dutyDefaultRelieving')for(const d of Object.values(plan.dates))for(const r of Object.values(d.rows||{}))if(!r.relievingTime)r.relievingTime=e.target.value}
    if(e.target.matches?.('[data-exam-date],#startDate,#endDate'))setTimeout(render,120);
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#addExtraDutyVenue')){const input=$('extraDutyVenue');addVenue(input.value,true);input.value='';render();return}
    const rm=e.target.closest?.('[data-remove-duty-venue]');if(rm){removeVenue(rm.dataset.removeDutyVenue);renderVenues();render();return}
    if(e.target.closest?.('#refreshDutyPlanner')){render();return}
    if(e.target.closest?.('#saveDutyCloudDraft')){saveDraft();return}
    if(e.target.closest?.('#saveDutyTemplate')){saveTemplate();return}
    const load=e.target.closest?.('[data-load-duty-plan]');if(load){loadPlan(load.dataset.loadDutyPlan);return}
    const pd=e.target.closest?.('[data-print-duty-date]');if(pd){printDate(pd.dataset.printDutyDate);return}
    if(e.target.closest?.('#printAllDutyDates')){for(const d of selectedDates())printDate(d);return}
    if(e.target.closest?.('[data-pane-target="duties"]'))setTimeout(()=>{install();render()},160);
  },true);

  async function initialise(u){user=u;if(!u)return;try{const a=await api(),[me,ms]=await Promise.all([a.getDoc(a.doc(a.db,'authorizedUsers',u.uid)),a.getDoc(a.doc(a.db,'master','current'))]);profile=me.exists()?me.data():{};master=ms.exists()?ms.data():{};teachers=teacherList(master);masterVenues=classList(master);install();renderVenues();render();loadSaved()}catch(e){console.warn('Duty planner init failed',e)}}
  (async()=>{const a=await api();a.onAuthStateChanged(a.auth,u=>setTimeout(()=>initialise(u),450))})().catch(()=>{});
  const root=$('examApp')||document.body;new MutationObserver(()=>{if(!$('datewiseDutyPlanner'))install()}).observe(root,{childList:true,subtree:true});
})();
