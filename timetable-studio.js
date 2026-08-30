import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js";

const firebaseConfig={apiKey:"AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4",authDomain:"vkv-nalbari-timetable.firebaseapp.com",projectId:"vkv-nalbari-timetable",storageBucket:"vkv-nalbari-timetable.firebasestorage.app",messagingSenderId:"791432856951",appId:"1:791432856951:web:61324065a54bef30f98d72"};
const firebaseApp=initializeApp(firebaseConfig),auth=getAuth(firebaseApp),db=getFirestore(firebaseApp),provider=new GoogleAuthProvider();
setPersistence(auth,browserLocalPersistence).catch(()=>{});

const APP_VERSION='66.0';
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const PALETTE=['#dbeafe','#dcfce7','#fef3c7','#fce7f3','#ede9fe','#cffafe','#ffedd5','#e2e8f0','#ecfccb','#fae8ff'];
const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanClone=value=>JSON.parse(JSON.stringify(value));
const nowId=prefix=>prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
const slug=value=>String(value||'ITEM').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)||'ITEM';
const dateKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const displayDate=k=>{const m=String(k||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(k||'')};
const displayDateTime=ms=>{const d=new Date(Number(ms)||0);if(Number.isNaN(d.valueOf()))return '—';const p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`};
const timeLabel=(workspace,period)=>String((workspace.times||{})[String(period)]||`Period ${period}`);

const state={
  user:null,profile:null,isAdmin:false,activeMasterDoc:null,activeMaster:null,
  workspace:null,versionId:null,versionStatus:'unsaved',library:[],dirty:false,frozenVersion:false,
  validation:null,selectedRecordId:null,selectedUnplacedId:null,undo:[],redo:[],
  generationRuns:[],generationCancelled:false,generationRunning:false
};

function setNotice(id,text,kind='info'){
  const el=$(id);if(!el)return;el.hidden=false;el.className='notice '+kind;el.innerHTML=text;
}
function clearNotice(id){const el=$(id);if(el)el.hidden=true}
function setSaveState(text,kind=''){$('saveState').textContent=text;$('saveState').dataset.kind=kind}
function statusLabel(status){return ({draft:'Draft',ready:'Ready',active:'Active',inactive:'Inactive',unsaved:'Unsaved'})[status]||'Draft'}
function markDirty(reason='Unsaved changes'){
  if(state.frozenVersion){state.versionId=null;state.versionStatus='draft';state.frozenVersion=false;reason='Historical version preserved · '+reason}
  state.dirty=true;state.validation=null;if(state.versionStatus==='ready')state.versionStatus='draft';
  setSaveState(reason,'dirty');renderWorkspaceIdentity();updateActionState();
}
function markClean(){state.dirty=false;setSaveState('Saved in version library','saved');renderWorkspaceIdentity();updateActionState()}

function parseCodesFromRecord(record,teachers){
  if(Array.isArray(record.codes)&&record.codes.length)return [...new Set(record.codes.map(String))];
  const text=String(record.entry||''),codes=teachers.map(t=>String(t.code)).sort((a,b)=>b.length-a.length);
  return codes.filter(code=>new RegExp('(^|[^A-Za-z0-9])'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^A-Za-z0-9])').test(text));
}
function subjectFromRecord(record,codes){
  let text=String(record.entry||'').trim();
  for(const code of codes){const esc=code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp('(^|[-/ ,&])'+esc+'(?=$|[-/ ,&])','g'),'$1')}
  return text.replace(/[\s\-\/,&]+$/g,'').trim()||String(record.entry||'Untitled Lesson').trim();
}
function uniqueId(base,used){let id=slug(base),n=2;while(used.has(id))id=slug(base)+'_'+n++;used.add(id);return id}
function parsePeriods(value){return [...new Set(String(value||'').split(/[^0-9]+/).map(Number).filter(n=>n>0&&n<=20))].sort((a,b)=>a-b)}
function parseUnavailable(value){
  const out=[];for(const part of String(value||'').split(';')){const [day,periods]=part.split(':');const cleanDay=DAYS.find(d=>d.toLowerCase()===String(day||'').trim().toLowerCase());if(!cleanDay)continue;for(const p of parsePeriods(periods))out.push(cleanDay+'|'+p)}return [...new Set(out)]
}
function unavailableText(slots){
  const map={};for(const key of slots||[]){const [d,p]=String(key).split('|');(map[d]||(map[d]=[])).push(Number(p))}
  return DAYS.filter(d=>map[d]?.length).map(d=>d+':'+map[d].sort((a,b)=>a-b).join(',')).join('; ');
}

function modelFromMaster(master){
  const teachers=(master.teachers||[]).map(t=>({code:String(t.code),name:String(t.name||t.code),maxPeriodsPerDay:Number(t.maxPeriodsPerDay)||6,unavailableSlots:Array.isArray(t.unavailableSlots)?t.unavailableSlots:[]}));
  const classNames=[...(master.classes||[])].map(String);
  const periods=Object.keys(master.times||{}).map(Number).filter(Boolean).sort((a,b)=>a-b);
  const defaultPeriods=periods.length?periods:[1,2,3,4,5,6,7,8];
  const venues=classNames.map((name,i)=>({id:'ROOM_'+slug(name),name:'Classroom · '+name,type:'Classroom',capacity:40,unavailableSlots:[],colour:PALETTE[i%PALETTE.length]}));
  const classes=classNames.map(name=>({id:name,name,defaultVenueId:'ROOM_'+slug(name),periods:[...new Set(((master.patterns||{})[name]||defaultPeriods).map(Number))].sort((a,b)=>a-b),maxLessonsPerDay:defaultPeriods.length}));
  const subjectMap=new Map(),usedSubjectIds=new Set();
  const rawRecords=(master.records||[]).map((r,i)=>{
    const teacherCodes=parseCodesFromRecord(r,teachers),subjectName=subjectFromRecord(r,teacherCodes);
    const key=subjectName.toLowerCase();
    if(!subjectMap.has(key)){const id=uniqueId(subjectName,usedSubjectIds);subjectMap.set(key,{id,name:subjectName,shortName:subjectName.slice(0,12),colour:PALETTE[subjectMap.size%PALETTE.length],maxPerClassPerDay:1})}
    const cls=String(r.class||'');
    return {id:'REC_'+i+'_'+slug(cls),allocationId:'',day:String(r.day||DAYS[0]),period:Number(r.period)||1,duration:1,classIds:[cls],subjectId:subjectMap.get(key).id,teacherCodes,venueId:'ROOM_'+slug(cls),locked:false,sourceEntry:String(r.entry||''),time:String(r.time||(master.times||{})[String(r.period)]||'')};
  });
  // Identical simultaneous entries taught by the same teacher(s) are imported as
  // one combined-class event. This preserves genuine joined lessons instead of
  // reporting the same teacher as being in two places at once.
  const joined=new Map();
  for(const record of rawRecords){
    const key=[record.day,record.period,record.subjectId,record.teacherCodes.slice().sort().join('+')].join('|');
    const existing=joined.get(key);
    if(existing){existing.classIds.push(...record.classIds);existing.classIds=[...new Set(existing.classIds)];existing.combined=existing.classIds.length>1}
    else joined.set(key,{...record,classIds:[...record.classIds],combined:false});
  }
  const records=[...joined.values()];
  const allocationMap=new Map();
  for(const record of records){
    const key=[record.classIds.join('+'),record.subjectId,record.teacherCodes.slice().sort().join('+')].join('|');
    if(!allocationMap.has(key))allocationMap.set(key,{id:nowId('ALLOC'),subjectId:record.subjectId,teacherCodes:[...record.teacherCodes],classIds:[...record.classIds],venueIds:[record.venueId],periodsPerWeek:0,duration:1,priority:'normal',combined:record.classIds.length>1,preferConsecutive:false,preferredDays:[],remarks:'Imported from the active master timetable'});
    const allocation=allocationMap.get(key);allocation.periodsPerWeek+=1;record.allocationId=allocation.id;
  }
  return {
    schemaVersion:1,appVersion:APP_VERSION,teachers,classes,subjects:[...subjectMap.values()],venues,
    allocations:[...allocationMap.values()],records,unplaced:[],times:cleanClone(master.times||Object.fromEntries(defaultPeriods.map(p=>[String(p),'Period '+p]))),
    parameters:{workingDays:[...DAYS],globalPeriods:Math.max(...defaultPeriods),defaultTeacherMax:6,teacherGapWeight:5,repeatSubjectWeight:8,spreadWeight:8,lastPeriodWeight:3,allowEmptyClassSlots:true,generationAttempts:100,candidateBreadth:4},
    generation:null,sourceMasterUpdatedAtMs:Number(master.updatedAtMs)||0
  };
}

function workspaceToMasterData(workspace,currentData){
  const subjectById=new Map(workspace.subjects.map(s=>[s.id,s]));
  const teacherByCode=new Map(workspace.teachers.map(t=>[t.code,t]));
  const venueById=new Map(workspace.venues.map(v=>[v.id,v]));
  const records=[];
  for(const event of workspace.records){
    const subject=subjectById.get(event.subjectId)?.name||event.subjectId;
    const codes=(event.teacherCodes||[]).filter(c=>teacherByCode.has(c));
    const entry=codes.length?subject+'-'+codes.join('/'):subject;
    for(const cls of event.classIds||[]){records.push({class:cls,day:event.day,period:Number(event.period),time:timeLabel(workspace,event.period),entry,codes:[...codes],subject,venue:event.venueId?(venueById.get(event.venueId)?.name||event.venueId):'',venueId:event.venueId||'',studioRecordId:event.id,combinedGroupId:(event.classIds||[]).length>1?event.id:''})}
  }
  const patterns={};for(const cls of workspace.classes)patterns[cls.id]=[...(cls.periods||[])].sort((a,b)=>a-b);
  return {...currentData,teachers:workspace.teachers.map(t=>({...(currentData.teachers||[]).find(x=>String(x.code)===t.code),code:t.code,name:t.name,maxPeriodsPerDay:t.maxPeriodsPerDay,unavailableSlots:t.unavailableSlots||[]})),classes:workspace.classes.map(c=>c.id),subjects:cleanClone(workspace.subjects),venues:cleanClone(workspace.venues),assignmentCards:cleanClone(workspace.allocations),records,patterns,times:cleanClone(workspace.times)};
}

async function verifyAccess(user){
  state.user=user;$('signInButton').hidden=true;
  if(!user){$('gateMessage').textContent='Sign in with an authorised Google account.';$('signInButton').hidden=false;return}
  $('gateMessage').textContent='Checking Timetable Studio permission…';
  try{
    const profileSnap=await getDoc(doc(db,'authorizedUsers',user.uid));
    const profile=profileSnap.exists()?profileSnap.data():null;
    const allowed=profile&&profile.active===true&&(profile.role==='admin'||profile.permissions?.timetableStudio===true);
    if(!allowed){$('gateMessage').innerHTML='<b>Timetable Studio access is not enabled for this account.</b><br>Ask the Principal to delegate Timetable Studio access in User Access & Roles.';return}
    state.profile=profile;state.isAdmin=profile.role==='admin';
    $('authGate').hidden=true;$('studioApp').hidden=false;
    await loadActiveMaster();await loadLibrary();openFreshWorkspace(false);bindRoleUi();
  }catch(error){$('gateMessage').textContent='Could not open Timetable Studio: '+(error.message||error)}
}
$('signInButton').onclick=async()=>{await setPersistence(auth,browserLocalPersistence);provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider)};
onAuthStateChanged(auth,verifyAccess);

async function loadActiveMaster(){
  const snap=await getDoc(doc(db,'master','current'));if(!snap.exists())throw new Error('Active master timetable was not found.');
  state.activeMasterDoc=snap.data();state.activeMaster=cleanClone(state.activeMasterDoc.data||state.activeMasterDoc);
  const name=state.activeMasterDoc.activeTimetableVersionName||'Operational Master Timetable';
  $('activeMasterName').textContent=name;
  $('activeMasterMeta').textContent='Active since '+(state.activeMasterDoc.activeTimetableActivatedAtMs?displayDateTime(state.activeMasterDoc.activeTimetableActivatedAtMs):'the existing deployment')+'. It remains unchanged until an Admin activates another validated version.';
  $('activeMasterStats').innerHTML=[`${state.activeMaster.teachers?.length||0} teachers`,`${state.activeMaster.classes?.length||0} classes`,`${state.activeMaster.records?.length||0} entries`].map(x=>'<span class="statChip">'+safe(x)+'</span>').join('');
}
function openFreshWorkspace(confirmFirst=true){
  const apply=()=>{state.workspace=modelFromMaster(state.activeMaster);state.versionId=null;state.versionStatus='unsaved';state.frozenVersion=false;state.validation=null;state.selectedRecordId=null;state.selectedUnplacedId=null;state.undo=[];state.redo=[];$('versionName').value='Current Master · Working Copy';$('versionDescription').value='Reusable configuration imported from the active master timetable.';markDirty('New unsaved workspace');renderAll()};
  if(confirmFirst&&state.dirty)confirmAction('Start a new workspace?','Unsaved changes in the open workspace will be discarded. Stored timetable versions are unaffected.','Start New Workspace').then(ok=>{if(ok)apply()});else apply();
}
$('newFromMaster').onclick=()=>openFreshWorkspace(true);

function renderWorkspaceIdentity(){
  const name=$('versionName').value.trim()||'Untitled Timetable';$('sidebarVersionName').textContent=name;
  const pill=$('sidebarVersionStatus');pill.textContent=statusLabel(state.versionStatus);pill.className='statusPill '+state.versionStatus;
}
$('versionName').addEventListener('input',()=>markDirty('Name changed'));
$('versionDescription').addEventListener('input',()=>markDirty('Description changed'));

function switchTab(tab){
  document.querySelectorAll('.navButton').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===tab));
  if(tab==='editor')renderEditor();if(tab==='validation')renderValidation();window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.navButton').forEach(button=>button.onclick=()=>switchTab(button.dataset.tab));

async function loadLibrary(){
  const snap=await getDocs(collection(db,'timetableVersions')),rows=[];snap.forEach(d=>rows.push({id:d.id,...d.data()}));
  rows.sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));state.library=rows;renderLibrary();
}
function renderLibrary(){
  const host=$('versionLibrary');if(!state.library.length){host.innerHTML='<div class="emptyState">No stored timetable version yet. Generate or save the open workspace to create the first one.</div>';return}
  host.innerHTML=state.library.map(v=>{
    const model=v.timetable||{},quality=v.quality||model.generation?.quality||{};
    return `<article class="versionCard ${v.status==='active'?'activeVersion':''}"><div class="buttonRow" style="margin:0;justify-content:space-between"><span class="statusPill ${safe(v.status||'draft')}">${safe(statusLabel(v.status||'draft'))}</span><span class="cardLabel">${safe(v.source||'saved')}</span></div><h4>${safe(v.name||'Untitled Timetable')}</h4><p>${safe(v.description||'No description')}</p><div class="versionMeta"><span>${model.records?.length||0} placed</span><span>${model.unplaced?.length||0} unplaced</span><span>Score ${quality.score??'—'}</span><span>${safe(displayDateTime(v.updatedAtMs||v.createdAtMs))}</span></div><div class="buttonRow"><button class="button compact primary" data-open-version="${safe(v.id)}">${v.status==='active'?'Open as Draft':'Open'}</button><button class="button compact quiet" data-export-library="${safe(v.id)}">Export</button>${state.isAdmin&&v.status!=='active'?`<button class="button compact danger" data-delete-library="${safe(v.id)}">Delete</button>`:''}</div></article>`
  }).join('');
}
$('refreshLibrary').onclick=()=>loadLibrary().catch(e=>setNotice('libraryMessage','Could not refresh the version library: '+safe(e.message||e),'error'));

function versionPayload(status=state.versionStatus==='unsaved'?'draft':state.versionStatus){
  const now=Date.now(),existing=state.library.find(v=>v.id===state.versionId);
  return {schemaVersion:1,appVersion:APP_VERSION,name:$('versionName').value.trim()||'Untitled Timetable',description:$('versionDescription').value.trim(),status:status==='unsaved'?'draft':status,source:state.workspace.generation?'generated':'configured',createdAtMs:existing?.createdAtMs||now,createdByUid:existing?.createdByUid||state.user.uid,createdByEmail:existing?.createdByEmail||state.user.email||'',updatedAtMs:now,updatedByUid:state.user.uid,updatedByEmail:state.user.email||'',updatedAt:serverTimestamp(),quality:state.validation?cleanClone(state.validation.summary):(state.workspace.generation?.quality||null),timetable:cleanClone(state.workspace)};
}
async function saveCurrentVersion({asNew=false,status=null,silent=false}={}){
  if(!state.workspace)throw new Error('No workspace is open.');
  const id=(!asNew&&state.versionId)?state.versionId:nowId('TT');
  const nextStatus=status||((!asNew&&state.versionStatus!=='unsaved')?state.versionStatus:'draft');
  if(nextStatus==='active'&&!state.isAdmin)throw new Error('Only the Principal/Admin can activate a timetable.');
  const payload=versionPayload(nextStatus);
  await setDoc(doc(db,'timetableVersions',id),payload,{merge:false});
  state.versionId=id;state.versionStatus=payload.status;state.frozenVersion=payload.status==='active'||payload.status==='inactive';markClean();await loadLibrary();
  if(!silent)setNotice('libraryMessage','<b>'+safe(payload.name)+'</b> has been saved as a '+safe(statusLabel(payload.status).toLowerCase())+' version.','success');
  return id;
}
$('saveVersion').onclick=()=>saveCurrentVersion().catch(e=>setNotice('libraryMessage','Could not save: '+safe(e.message||e),'error'));
$('saveEdits').onclick=()=>saveCurrentVersion().then(()=>setNotice('editorMessage','Card edits saved to this timetable version.','success')).catch(e=>setNotice('editorMessage','Could not save edits: '+safe(e.message||e),'error'));
$('duplicateVersion').onclick=async()=>{if(!state.workspace)return;state.versionId=null;state.versionStatus='draft';$('versionName').value=($('versionName').value.trim()||'Timetable')+' · Copy';markDirty('Unsaved duplicate');await saveCurrentVersion({asNew:true})};

function exportPayload(payload,fileName){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('exportVersion').onclick=()=>exportPayload(versionPayload(),'VKV_Nalbari_Timetable_'+slug($('versionName').value)+'_'+dateKey()+'.json');
function openStoredVersion(id){
  const v=state.library.find(x=>x.id===id);if(!v?.timetable)return;
  state.workspace=cleanClone(v.timetable);state.validation=v.quality?validateWorkspace(state.workspace):null;state.selectedRecordId=null;state.selectedUnplacedId=null;state.undo=[];state.redo=[];
  if(v.status==='active'){state.versionId=null;state.versionStatus='draft';state.frozenVersion=false;$('versionName').value=(v.name||'Active Timetable')+' · Working Copy';$('versionDescription').value='Working copy created from active version '+(v.name||v.id)+'.';markDirty('Active version opened as a safe draft')}else{state.versionId=v.id;state.versionStatus=v.status||'draft';state.frozenVersion=v.status==='inactive';$('versionName').value=v.name||'';$('versionDescription').value=v.description||'';markClean()}
  renderAll();switchTab('library');setNotice('libraryMessage',v.status==='active'?'The active timetable was opened as a new draft. The operational master remains unchanged.':'Stored timetable opened.','success');
}
async function deleteStoredVersion(id){
  const v=state.library.find(x=>x.id===id);if(!v||!state.isAdmin||v.status==='active')return;
  if(!await confirmAction('Delete stored timetable?','Delete “'+(v.name||'Untitled Timetable')+'”? This removes only this stored version; the active operational master is unaffected.','Delete Version'))return;
  await deleteDoc(doc(db,'timetableVersions',id));if(state.versionId===id){state.versionId=null;state.versionStatus='unsaved';markDirty('Open copy is no longer stored')}await loadLibrary();setNotice('libraryMessage','Stored timetable deleted.','success');
}
document.addEventListener('click',event=>{
  const open=event.target.closest('[data-open-version]');if(open)return openStoredVersion(open.dataset.openVersion);
  const del=event.target.closest('[data-delete-library]');if(del)return deleteStoredVersion(del.dataset.deleteLibrary).catch(e=>setNotice('libraryMessage','Could not delete: '+safe(e.message||e),'error'));
  const exp=event.target.closest('[data-export-library]');if(exp){const v=state.library.find(x=>x.id===exp.dataset.exportLibrary);if(v)exportPayload(v,'VKV_Nalbari_Timetable_'+slug(v.name)+'_'+dateKey()+'.json')}
});

function bindRoleUi(){
  $('activateVersion').hidden=!state.isAdmin;$('deleteVersion').hidden=!state.isAdmin;
  if(!state.isAdmin)$('activationHelp').textContent='You may design, generate, edit and mark a clean timetable ready. Only the Principal/Admin can activate or delete a stored version.';
}

function renderAll(){
  if(!state.workspace)return;renderWorkspaceIdentity();renderComponents();renderAllocationInputs();renderAllocations();renderParameters();renderGenerationResult();renderEditorSelectors();renderEditor();renderValidation();updateActionState();
}

function entityButtons(type,id){return `<div class="buttonRow"><button class="button compact quiet" data-edit-entity="${type}" data-entity-id="${safe(id)}">Edit</button><button class="button compact danger" data-delete-entity="${type}" data-entity-id="${safe(id)}">Delete</button></div>`}
function renderComponents(){
  const w=state.workspace;$('teacherCount').textContent=w.teachers.length;$('classCount').textContent=w.classes.length;$('subjectCount').textContent=w.subjects.length;$('venueCount').textContent=w.venues.length;$('periodCount').textContent=Object.keys(w.times||{}).length;
  $('teacherCards').innerHTML=w.teachers.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<article class="entityCard"><h4>${safe(t.name)}</h4><p><b>${safe(t.code)}</b> · Maximum ${t.maxPeriodsPerDay||w.parameters.defaultTeacherMax} per day</p><p>${t.unavailableSlots?.length?safe(t.unavailableSlots.length+' unavailable slot(s)'):'Fully available unless constrained'}</p>${entityButtons('teacher',t.code)}</article>`).join('')||'<div class="emptyState">No teacher added.</div>';
  const venueMap=new Map(w.venues.map(v=>[v.id,v]));
  $('classCards').innerHTML=w.classes.map(c=>`<article class="entityCard"><h4>${safe(c.name)}</h4><p>${safe((venueMap.get(c.defaultVenueId)||{}).name||'No default venue')}</p><p>Periods: ${safe((c.periods||[]).join(', '))}</p>${entityButtons('class',c.id)}</article>`).join('')||'<div class="emptyState">No class or section added.</div>';
  $('subjectCards').innerHTML=w.subjects.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(s=>`<article class="entityCard"><h4><i class="colourSwatch" style="background:${safe(s.colour)}"></i>${safe(s.name)}</h4><p>${safe(s.shortName||'No short name')} · Maximum ${s.maxPerClassPerDay||1} per class/day</p>${entityButtons('subject',s.id)}</article>`).join('')||'<div class="emptyState">No subject added.</div>';
  $('venueCards').innerHTML=w.venues.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(v=>`<article class="entityCard"><h4>${safe(v.name)}</h4><p>${safe(v.type||'Other')} · Capacity ${Number(v.capacity)||0}</p><p>${v.unavailableSlots?.length?safe(v.unavailableSlots.length+' unavailable slot(s)'):'Available throughout the week'}</p>${entityButtons('venue',v.id)}</article>`).join('')||'<div class="emptyState">No venue added.</div>';
  $('periodCards').innerHTML=Object.entries(w.times||{}).sort((a,b)=>Number(a[0])-Number(b[0])).map(([number,time])=>`<article class="entityCard"><h4>Period ${safe(number)}</h4><p>${safe(time||'No bell time configured')}</p>${entityButtons('period',number)}</article>`).join('')||'<div class="emptyState">No period added.</div>';
  const venueOptions='<option value="">No default venue</option>'+w.venues.map(v=>`<option value="${safe(v.id)}">${safe(v.name)}</option>`).join('');$('classVenue').innerHTML=venueOptions;
}

function clearForm(type){
  if(type==='teacher'){$('teacherForm').reset();$('teacherOriginalCode').value='';$('teacherMaxDay').value=state.workspace.parameters.defaultTeacherMax||6}
  if(type==='class'){$('classForm').reset();$('classOriginalId').value='';$('classMaxDay').value=state.workspace.parameters.globalPeriods||8}
  if(type==='subject'){$('subjectForm').reset();$('subjectOriginalId').value='';$('subjectColour').value='#dbeafe';$('subjectMaxPerDay').value=1}
  if(type==='venue'){$('venueForm').reset();$('venueOriginalId').value='';$('venueCapacity').value=40}
  if(type==='period'){$('periodForm').reset();$('periodOriginalNumber').value=''}
  if(type==='allocation'){$('allocationForm').reset();$('allocationId').value='';$('allocationPeriods').value=1;renderAllocationInputs()}
}
document.querySelectorAll('[data-clear-form]').forEach(b=>b.onclick=()=>clearForm(b.dataset.clearForm));

$('teacherForm').onsubmit=event=>{
  event.preventDefault();const oldCode=$('teacherOriginalCode').value.trim(),code=$('teacherCode').value.trim().toUpperCase().replace(/\s+/g,''),name=$('teacherName').value.trim();if(!code||!name)return;
  if(state.workspace.teachers.some(t=>t.code===code&&t.code!==oldCode)){alert('Teacher code is already in use.');return}
  const rec={code,name,maxPeriodsPerDay:Number($('teacherMaxDay').value)||6,unavailableSlots:parseUnavailable($('teacherUnavailable').value)};
  const idx=state.workspace.teachers.findIndex(t=>t.code===oldCode);if(idx>=0){state.workspace.teachers[idx]=rec;if(oldCode!==code){state.workspace.allocations.forEach(a=>a.teacherCodes=a.teacherCodes.map(c=>c===oldCode?code:c));state.workspace.records.forEach(r=>r.teacherCodes=r.teacherCodes.map(c=>c===oldCode?code:c));state.workspace.unplaced.forEach(r=>r.teacherCodes=r.teacherCodes.map(c=>c===oldCode?code:c))}}else state.workspace.teachers.push(rec);
  clearForm('teacher');markDirty('Teacher configuration changed');renderAll();
};
$('classForm').onsubmit=event=>{
  event.preventDefault();const oldId=$('classOriginalId').value,name=$('className').value.trim(),id=name;if(!name)return;if(state.workspace.classes.some(c=>c.id===id&&c.id!==oldId)){alert('Class / section already exists.');return}
  const periods=parsePeriods($('classPeriods').value);if(!periods.length){alert('Enter at least one available period.');return}
  const rec={id,name,defaultVenueId:$('classVenue').value,periods,maxLessonsPerDay:Number($('classMaxDay').value)||periods.length};const idx=state.workspace.classes.findIndex(c=>c.id===oldId);if(idx>=0){state.workspace.classes[idx]=rec;if(oldId!==id){state.workspace.allocations.forEach(a=>a.classIds=a.classIds.map(c=>c===oldId?id:c));state.workspace.records.forEach(r=>r.classIds=r.classIds.map(c=>c===oldId?id:c));state.workspace.unplaced.forEach(r=>r.classIds=r.classIds.map(c=>c===oldId?id:c))}}else state.workspace.classes.push(rec);
  clearForm('class');markDirty('Class configuration changed');renderAll();
};
$('subjectForm').onsubmit=event=>{
  event.preventDefault();const oldId=$('subjectOriginalId').value,name=$('subjectName').value.trim();if(!name)return;const existing=oldId&&state.workspace.subjects.find(s=>s.id===oldId),id=existing?oldId:uniqueId(name,new Set(state.workspace.subjects.map(s=>s.id)));
  const rec={id,name,shortName:$('subjectShort').value.trim()||name.slice(0,12),colour:$('subjectColour').value,maxPerClassPerDay:Number($('subjectMaxPerDay').value)||1};const idx=state.workspace.subjects.findIndex(s=>s.id===oldId);if(idx>=0)state.workspace.subjects[idx]=rec;else state.workspace.subjects.push(rec);
  clearForm('subject');markDirty('Subject configuration changed');renderAll();
};
$('venueForm').onsubmit=event=>{
  event.preventDefault();const oldId=$('venueOriginalId').value,name=$('venueName').value.trim();if(!name)return;const existing=oldId&&state.workspace.venues.find(v=>v.id===oldId),id=existing?oldId:uniqueId(name,new Set(state.workspace.venues.map(v=>v.id)));
  const rec={id,name,type:$('venueType').value,capacity:Number($('venueCapacity').value)||0,unavailableSlots:parseUnavailable($('venueUnavailable').value)};const idx=state.workspace.venues.findIndex(v=>v.id===oldId);if(idx>=0)state.workspace.venues[idx]=rec;else state.workspace.venues.push(rec);
  clearForm('venue');markDirty('Venue configuration changed');renderAll();
};
$('periodForm').onsubmit=event=>{
  event.preventDefault();const old=Number($('periodOriginalNumber').value)||0,number=Number($('periodNumber').value)||0,time=$('periodTime').value.trim();if(!number||!time)return;if(state.workspace.times[String(number)]&&number!==old){alert('Period '+number+' already exists.');return}
  if(old&&old!==number){delete state.workspace.times[String(old)];state.workspace.classes.forEach(c=>{c.periods=[...new Set(c.periods.map(p=>Number(p)===old?number:Number(p)))].sort((a,b)=>a-b)});state.workspace.records.forEach(r=>{if(Number(r.period)===old){r.period=number;r.time=time}})}
  state.workspace.times[String(number)]=time;state.workspace.parameters.globalPeriods=Math.max(...Object.keys(state.workspace.times).map(Number));clearForm('period');markDirty('Period and bell time changed');renderAll();
};

function editEntity(type,id){
  const w=state.workspace;switch(type){
    case 'teacher':{const x=w.teachers.find(t=>t.code===id);if(!x)return;$('teacherOriginalCode').value=x.code;$('teacherCode').value=x.code;$('teacherName').value=x.name;$('teacherMaxDay').value=x.maxPeriodsPerDay||6;$('teacherUnavailable').value=unavailableText(x.unavailableSlots);break}
    case 'class':{const x=w.classes.find(c=>c.id===id);if(!x)return;$('classOriginalId').value=x.id;$('className').value=x.name;$('classVenue').value=x.defaultVenueId||'';$('classPeriods').value=(x.periods||[]).join(',');$('classMaxDay').value=x.maxLessonsPerDay||x.periods.length;break}
    case 'subject':{const x=w.subjects.find(s=>s.id===id);if(!x)return;$('subjectOriginalId').value=x.id;$('subjectName').value=x.name;$('subjectShort').value=x.shortName||'';$('subjectColour').value=x.colour||'#dbeafe';$('subjectMaxPerDay').value=x.maxPerClassPerDay||1;break}
    case 'venue':{const x=w.venues.find(v=>v.id===id);if(!x)return;$('venueOriginalId').value=x.id;$('venueName').value=x.name;$('venueType').value=x.type||'Other';$('venueCapacity').value=x.capacity||0;$('venueUnavailable').value=unavailableText(x.unavailableSlots);break}
    case 'period':{const number=Number(id);$('periodOriginalNumber').value=String(number);$('periodNumber').value=String(number);$('periodTime').value=w.times[String(number)]||'';break}
  }
  switchTab('components');window.scrollTo({top:0,behavior:'smooth'});
}
async function deleteEntity(type,id){
  const names={teacher:'teacher',class:'class / section',subject:'subject',venue:'venue',period:'period'};if(!await confirmAction('Delete '+names[type]+'?','Related allocation and timetable references will also be removed or adjusted in this open workspace. Stored versions and the active master remain unchanged.','Delete'))return;
  const w=state.workspace;
  if(type==='teacher'){w.teachers=w.teachers.filter(t=>t.code!==id);w.allocations.forEach(a=>a.teacherCodes=a.teacherCodes.filter(c=>c!==id));w.records.forEach(r=>r.teacherCodes=r.teacherCodes.filter(c=>c!==id));w.unplaced.forEach(r=>r.teacherCodes=r.teacherCodes.filter(c=>c!==id))}
  if(type==='class'){w.classes=w.classes.filter(c=>c.id!==id);w.allocations.forEach(a=>a.classIds=a.classIds.filter(c=>c!==id));w.allocations=w.allocations.filter(a=>a.classIds.length);w.records.forEach(r=>r.classIds=r.classIds.filter(c=>c!==id));w.records=w.records.filter(r=>r.classIds.length);w.unplaced.forEach(r=>r.classIds=r.classIds.filter(c=>c!==id));w.unplaced=w.unplaced.filter(r=>r.classIds.length)}
  if(type==='subject'){w.subjects=w.subjects.filter(s=>s.id!==id);w.allocations=w.allocations.filter(a=>a.subjectId!==id);w.records=w.records.filter(r=>r.subjectId!==id);w.unplaced=w.unplaced.filter(r=>r.subjectId!==id)}
  if(type==='venue'){w.venues=w.venues.filter(v=>v.id!==id);w.classes.forEach(c=>{if(c.defaultVenueId===id)c.defaultVenueId=''});w.allocations.forEach(a=>a.venueIds=a.venueIds.filter(v=>v!==id));w.records.forEach(r=>{if(r.venueId===id)r.venueId=''})}
  if(type==='period'){const number=Number(id),affected=w.records.filter(r=>number>=Number(r.period)&&number<Number(r.period)+(Number(r.duration)||1));w.records=w.records.filter(r=>!affected.includes(r));w.unplaced.push(...affected.map(eventToUnplaced));w.classes.forEach(c=>c.periods=c.periods.filter(p=>Number(p)!==number));delete w.times[String(number)];w.parameters.globalPeriods=Math.max(1,...Object.keys(w.times).map(Number))}
  markDirty('Component deleted');renderAll();
}
document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit-entity]');if(edit)return editEntity(edit.dataset.editEntity,edit.dataset.entityId);const del=event.target.closest('[data-delete-entity]');if(del)return deleteEntity(del.dataset.deleteEntity,del.dataset.entityId)});

function checkOptions(items,nameFn,valueFn,selected=[]){
  const chosen=new Set(selected||[]);return items.map(item=>{const value=valueFn(item);return `<label><input type="checkbox" value="${safe(value)}" ${chosen.has(value)?'checked':''}> <span>${safe(nameFn(item))}</span></label>`}).join('');
}
function renderAllocationInputs(allocation=null){
  const w=state.workspace;if(!w)return;
  const selected=allocation||{teacherCodes:[],classIds:[],venueIds:[],preferredDays:[]};
  $('allocationSubject').innerHTML='<option value="">Select subject…</option>'+w.subjects.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(s=>`<option value="${safe(s.id)}">${safe(s.name)}</option>`).join('');
  $('allocationTeachers').innerHTML=checkOptions(w.teachers,t=>`${t.name} (${t.code})`,t=>t.code,selected.teacherCodes);
  $('allocationClasses').innerHTML=checkOptions(w.classes,c=>c.name,c=>c.id,selected.classIds);
  $('allocationVenues').innerHTML=checkOptions(w.venues,v=>v.name,v=>v.id,selected.venueIds);
  $('allocationDays').innerHTML=checkOptions(DAYS,d=>d,d=>d,selected.preferredDays);
  $('allocationClassFilter').innerHTML='<option value="">All classes</option>'+w.classes.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');
}
function checkedValues(containerId){return [...$(containerId).querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value)}
$('allocationForm').onsubmit=event=>{
  event.preventDefault();const id=$('allocationId').value||nowId('ALLOC'),subjectId=$('allocationSubject').value,classIds=checkedValues('allocationClasses'),teacherCodes=checkedValues('allocationTeachers'),venueIds=checkedValues('allocationVenues');
  if(!subjectId||!classIds.length){alert('Choose a subject and at least one class / section.');return}
  const rec={id,subjectId,classIds,teacherCodes,venueIds,periodsPerWeek:Number($('allocationPeriods').value)||1,duration:Number($('allocationDuration').value)||1,priority:$('allocationPriority').value,combined:$('allocationCombined').checked,preferConsecutive:$('allocationConsecutive').checked,preferredDays:checkedValues('allocationDays'),remarks:$('allocationRemarks').value.trim()};
  const idx=state.workspace.allocations.findIndex(a=>a.id===id);if(idx>=0)state.workspace.allocations[idx]=rec;else state.workspace.allocations.push(rec);
  clearForm('allocation');markDirty('Allocation cards changed');renderAll();switchTab('allocations');
};
function editAllocation(id){
  const a=state.workspace.allocations.find(x=>x.id===id);if(!a)return;renderAllocationInputs(a);$('allocationId').value=a.id;$('allocationSubject').value=a.subjectId;$('allocationPeriods').value=a.periodsPerWeek;$('allocationDuration').value=a.duration||1;$('allocationPriority').value=a.priority||'normal';$('allocationCombined').checked=!!a.combined;$('allocationConsecutive').checked=!!a.preferConsecutive;$('allocationRemarks').value=a.remarks||'';switchTab('allocations');window.scrollTo({top:0,behavior:'smooth'});
}
async function deleteAllocation(id){if(!await confirmAction('Delete allocation card?','The teaching requirement and its generated lesson cards will be removed from this open workspace only.','Delete Card'))return;state.workspace.allocations=state.workspace.allocations.filter(a=>a.id!==id);state.workspace.records=state.workspace.records.filter(r=>r.allocationId!==id);state.workspace.unplaced=state.workspace.unplaced.filter(r=>r.allocationId!==id);markDirty('Allocation card deleted');renderAll()}
function renderAllocations(){
  const w=state.workspace,subjectMap=new Map(w.subjects.map(s=>[s.id,s])),teacherMap=new Map(w.teachers.map(t=>[t.code,t])),classMap=new Map(w.classes.map(c=>[c.id,c])),venueMap=new Map(w.venues.map(v=>[v.id,v]));
  const query=$('allocationSearch').value.trim().toLowerCase(),classFilter=$('allocationClassFilter').value;
  const rows=w.allocations.filter(a=>!classFilter||a.classIds.includes(classFilter)).filter(a=>{const text=[subjectMap.get(a.subjectId)?.name,...a.teacherCodes.map(c=>teacherMap.get(c)?.name),...a.classIds.map(c=>classMap.get(c)?.name)].join(' ').toLowerCase();return !query||text.includes(query)});
  $('allocationSummary').textContent=`${rows.length} of ${w.allocations.length} allocation card(s)`;
  $('allocationCards').innerHTML=rows.map(a=>{const s=subjectMap.get(a.subjectId)||{name:a.subjectId,colour:'#e2e8f0'},teachers=a.teacherCodes.map(c=>teacherMap.get(c)?.name||c).join(' + ')||'No teacher assigned',classes=a.classIds.map(c=>classMap.get(c)?.name||c).join(a.combined?' + ':', '),venues=a.venueIds.map(v=>venueMap.get(v)?.name||v).join(', ')||'Default classroom';return `<article class="allocationCard" style="--card-colour:${safe(s.colour)}"><h4>${safe(s.name)}</h4><div class="allocationTeacher">${safe(teachers)}</div><p><b>${safe(classes)}</b></p><p>${a.periodsPerWeek} period(s) weekly · ${a.duration===1?'Single':a.duration===2?'Double':'Triple'} · ${safe(venues)}</p><div class="tagRow">${a.combined?'<span class="tag">Combined class</span>':''}<span class="tag">${safe(a.priority||'normal')} priority</span>${a.preferredDays?.length?'<span class="tag">Preferred: '+safe(a.preferredDays.join(', '))+'</span>':''}</div>${a.remarks?'<p>'+safe(a.remarks)+'</p>':''}<div class="buttonRow"><button class="button compact quiet" data-edit-allocation="${safe(a.id)}">Edit</button><button class="button compact danger" data-delete-allocation="${safe(a.id)}">Delete</button></div></article>`}).join('')||'<div class="emptyState">No allocation card matches this filter.</div>';
}
$('allocationSearch').oninput=renderAllocations;$('allocationClassFilter').onchange=renderAllocations;
document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit-allocation]');if(edit)return editAllocation(edit.dataset.editAllocation);const del=event.target.closest('[data-delete-allocation]');if(del)return deleteAllocation(del.dataset.deleteAllocation)});

function deriveAllocationsFromRecords(){
  const map=new Map();for(const r of state.workspace.records){const key=[r.classIds.slice().sort().join('+'),r.subjectId,r.teacherCodes.slice().sort().join('+')].join('|');if(!map.has(key))map.set(key,{id:nowId('ALLOC'),subjectId:r.subjectId,teacherCodes:[...r.teacherCodes],classIds:[...r.classIds],venueIds:r.venueId?[r.venueId]:[],periodsPerWeek:0,duration:1,priority:'normal',combined:r.classIds.length>1,preferConsecutive:false,preferredDays:[],remarks:'Rebuilt from timetable records'});const a=map.get(key);a.periodsPerWeek+=Number(r.duration)||1;if(r.venueId&&!a.venueIds.includes(r.venueId))a.venueIds.push(r.venueId);r.allocationId=a.id}
  state.workspace.allocations=[...map.values()];markDirty('Allocation cards rebuilt');renderAll();setNotice('libraryMessage','Allocation cards have been rebuilt from the open workspace records.','success');
}
$('deriveAllocations').onclick=()=>confirmAction('Rebuild allocation cards?','Existing allocation-card settings will be replaced by requirements inferred from the currently placed records.','Rebuild').then(ok=>{if(ok)deriveAllocationsFromRecords()});

function renderParameters(){
  const p=state.workspace.parameters;
  $('workingDays').innerHTML=checkOptions(DAYS,d=>d,d=>d,p.workingDays||DAYS);$('globalPeriods').value=p.globalPeriods||8;$('defaultTeacherMax').value=p.defaultTeacherMax||6;$('teacherGapWeight').value=p.teacherGapWeight??5;$('repeatSubjectWeight').value=p.repeatSubjectWeight??8;$('spreadWeight').value=p.spreadWeight??8;$('lastPeriodWeight').value=p.lastPeriodWeight??3;$('allowEmptyClassSlots').checked=p.allowEmptyClassSlots!==false;$('generationAttempts').value=p.generationAttempts||100;$('candidateBreadth').value=p.candidateBreadth||4;updateRangeOutputs();
}
function updateRangeOutputs(){for(const id of ['teacherGapWeight','repeatSubjectWeight','spreadWeight','lastPeriodWeight'])$(id+'Out').textContent=$(id).value}
for(const id of ['teacherGapWeight','repeatSubjectWeight','spreadWeight','lastPeriodWeight'])$(id).oninput=updateRangeOutputs;
function readParameters(){return {workingDays:checkedValues('workingDays'),globalPeriods:Number($('globalPeriods').value)||8,defaultTeacherMax:Number($('defaultTeacherMax').value)||6,teacherGapWeight:Number($('teacherGapWeight').value),repeatSubjectWeight:Number($('repeatSubjectWeight').value),spreadWeight:Number($('spreadWeight').value),lastPeriodWeight:Number($('lastPeriodWeight').value),allowEmptyClassSlots:$('allowEmptyClassSlots').checked,generationAttempts:Number($('generationAttempts').value)||100,candidateBreadth:Number($('candidateBreadth').value)||4}}
$('saveParameters').onclick=()=>{const p=readParameters();if(!p.workingDays.length){setNotice('parameterMessage','Select at least one working day.','warn');return}state.workspace.parameters=p;state.workspace.teachers.forEach(t=>{if(!t.maxPeriodsPerDay)t.maxPeriodsPerDay=p.defaultTeacherMax});markDirty('Generation parameters changed');setNotice('parameterMessage','Parameters applied to this workspace. They will be retained with every new generation round.','success')};
$('resetParameters').onclick=()=>{state.workspace.parameters={workingDays:[...DAYS],globalPeriods:8,defaultTeacherMax:6,teacherGapWeight:5,repeatSubjectWeight:8,spreadWeight:8,lastPeriodWeight:3,allowEmptyClassSlots:true,generationAttempts:100,candidateBreadth:4};renderParameters();markDirty('Recommended parameters restored')};

function seededRandom(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function allocationUnits(workspace){
  const lockedByAllocation=new Map();for(const r of workspace.records.filter(x=>x.locked&&x.allocationId))lockedByAllocation.set(r.allocationId,(lockedByAllocation.get(r.allocationId)||0)+(Number(r.duration)||1));
  const units=[];for(const a of workspace.allocations){let remaining=Math.max(0,(Number(a.periodsPerWeek)||0)-(lockedByAllocation.get(a.id)||0)),unit=0;while(remaining>0){const duration=Math.min(Number(a.duration)||1,remaining);units.push({id:a.id+'__'+unit++,allocationId:a.id,subjectId:a.subjectId,teacherCodes:[...(a.teacherCodes||[])],classIds:[...(a.classIds||[])],venueIds:[...(a.venueIds||[])],duration,priority:a.priority||'normal',combined:!!a.combined,preferConsecutive:!!a.preferConsecutive,preferredDays:[...(a.preferredDays||[])]});remaining-=duration}}
  return units;
}
function candidateSlots(workspace,unit){
  const classMap=new Map(workspace.classes.map(c=>[c.id,c])),days=workspace.parameters.workingDays||DAYS;
  let periods=null;for(const classId of unit.classIds){const ps=new Set((classMap.get(classId)?.periods||[]).map(Number));periods=periods===null?ps:new Set([...periods].filter(p=>ps.has(p)))}
  const allowed=[...(periods||new Set())].sort((a,b)=>a-b),out=[];
  for(const day of days)for(const start of allowed){let ok=true;for(let offset=0;offset<unit.duration;offset++)if(!allowed.includes(start+offset))ok=false;if(ok)out.push({day,period:start})}
  return out;
}
function newOccupancy(){return {classes:new Set(),teachers:new Set(),venues:new Set(),classSubjectDay:new Map(),teacherDay:new Map(),allocationDay:new Map()}}
function occupy(occ,event){
  for(let o=0;o<(event.duration||1);o++){const slot=event.day+'|'+(event.period+o);for(const c of event.classIds)occ.classes.add(c+'|'+slot);for(const t of event.teacherCodes)occ.teachers.add(t+'|'+slot);if(event.venueId)occ.venues.add(event.venueId+'|'+slot)}
  for(const c of event.classIds){const k=c+'|'+event.subjectId+'|'+event.day;occ.classSubjectDay.set(k,(occ.classSubjectDay.get(k)||0)+1)}
  for(const t of event.teacherCodes){const k=t+'|'+event.day;occ.teacherDay.set(k,(occ.teacherDay.get(k)||0)+(event.duration||1))}
  if(event.allocationId){const k=event.allocationId+'|'+event.day;occ.allocationDay.set(k,(occ.allocationDay.get(k)||0)+1)}
}
function canPlace(workspace,occ,unit,slot,venueId){
  const teacherMap=new Map(workspace.teachers.map(t=>[t.code,t])),venueMap=new Map(workspace.venues.map(v=>[v.id,v]));
  for(let o=0;o<unit.duration;o++){const key=slot.day+'|'+(slot.period+o);for(const c of unit.classIds)if(occ.classes.has(c+'|'+key))return false;for(const t of unit.teacherCodes){if(occ.teachers.has(t+'|'+key)||teacherMap.get(t)?.unavailableSlots?.includes(key))return false}if(venueId&&(occ.venues.has(venueId+'|'+key)||venueMap.get(venueId)?.unavailableSlots?.includes(key)))return false}
  return true;
}
function choicePenalty(workspace,occ,unit,slot,venueId,random){
  const p=workspace.parameters,teacherMap=new Map(workspace.teachers.map(t=>[t.code,t]));let score=random()*1.5;
  if(unit.preferredDays.length&&!unit.preferredDays.includes(slot.day))score+=4;
  for(const c of unit.classIds){const repeats=occ.classSubjectDay.get(c+'|'+unit.subjectId+'|'+slot.day)||0;score+=repeats*(p.repeatSubjectWeight||0)}
  for(const t of unit.teacherCodes){const load=occ.teacherDay.get(t+'|'+slot.day)||0,max=teacherMap.get(t)?.maxPeriodsPerDay||p.defaultTeacherMax||6;if(load+unit.duration>max)score+=1000+(load+unit.duration-max)*100;else score+=Math.max(0,load+unit.duration-max+1)*2}
  const sameDay=occ.allocationDay.get(unit.allocationId+'|'+slot.day)||0;score+=sameDay*(p.spreadWeight||0);
  const maxPeriod=Math.max(...(workspace.classes.find(c=>unit.classIds.includes(c.id))?.periods||[p.globalPeriods||8]));if(slot.period+unit.duration-1===maxPeriod)score+=p.lastPeriodWeight||0;
  if(unit.priority==='critical')score*=.6;else if(unit.priority==='high')score*=.8;return score;
}
function buildAttempt(workspace,seed){
  const random=seededRandom(seed),occ=newOccupancy(),records=[];
  for(const locked of workspace.records.filter(r=>r.locked)){const copy=cleanClone(locked);records.push(copy);occupy(occ,copy)}
  const units=allocationUnits(workspace).map(unit=>({...unit,difficulty:candidateSlots(workspace,unit).length/(1+unit.teacherCodes.length+unit.classIds.length+unit.duration)+(unit.priority==='critical'?-100:unit.priority==='high'?-20:0),tie:random()})).sort((a,b)=>a.difficulty-b.difficulty||a.tie-b.tie);
  const unplaced=[];
  for(const unit of units){
    const allocation=workspace.allocations.find(a=>a.id===unit.allocationId),classMap=new Map(workspace.classes.map(c=>[c.id,c]));let venueIds=unit.venueIds.length?[...unit.venueIds]:[...new Set(unit.classIds.map(c=>classMap.get(c)?.defaultVenueId).filter(Boolean))];if(!venueIds.length)venueIds=[''];
    const choices=[];for(const slot of candidateSlots(workspace,unit))for(const venueId of venueIds)if(canPlace(workspace,occ,unit,slot,venueId))choices.push({slot,venueId,penalty:choicePenalty(workspace,occ,unit,slot,venueId,random)});
    choices.sort((a,b)=>a.penalty-b.penalty);const breadth=Math.min(choices.length,workspace.parameters.candidateBreadth||4),choice=breadth?choices[Math.floor(random()*breadth)]:null;
    if(!choice){unplaced.push({...unit,id:nowId('UNPLACED'),reason:'No conflict-free slot found'});continue}
    const event={id:nowId('CARD'),allocationId:unit.allocationId,day:choice.slot.day,period:choice.slot.period,duration:unit.duration,classIds:[...unit.classIds],subjectId:unit.subjectId,teacherCodes:[...unit.teacherCodes],venueId:choice.venueId,locked:false,time:timeLabel(workspace,choice.slot.period),combined:allocation?.combined||unit.classIds.length>1};records.push(event);occupy(occ,event);
  }
  const test=validateWorkspace({...workspace,records,unplaced});return {records,unplaced,quality:test.summary,issues:test.issues};
}

function validationMaps(){return {class:new Map(),teacher:new Map(),venue:new Map()}}
function validateWorkspace(workspace){
  const issues=[],maps=validationMaps(),classMap=new Map(workspace.classes.map(c=>[c.id,c])),teacherMap=new Map(workspace.teachers.map(t=>[t.code,t])),subjectMap=new Map(workspace.subjects.map(s=>[s.id,s])),venueMap=new Map(workspace.venues.map(v=>[v.id,v]));
  const add=(severity,title,detail,recordIds=[])=>issues.push({severity,title,detail,recordIds});
  for(const r of workspace.records){
    if(!subjectMap.has(r.subjectId))add('error','Missing subject','A lesson card refers to a subject that no longer exists.',[r.id]);
    for(const c of r.classIds)if(!classMap.has(c))add('error','Missing class','A lesson card refers to class '+c+', which no longer exists.',[r.id]);
    for(const t of r.teacherCodes)if(!teacherMap.has(t))add('error','Missing teacher','A lesson card refers to teacher '+t+', who no longer exists.',[r.id]);
    if(r.venueId&&!venueMap.has(r.venueId))add('error','Missing venue','A lesson card refers to venue '+r.venueId+', which no longer exists.',[r.id]);
    for(let o=0;o<(r.duration||1);o++){
      const period=Number(r.period)+o,slot=r.day+'|'+period;
      for(const c of r.classIds){if(!classMap.get(c)?.periods?.includes(period))add('error','Class outside available pattern',`${c} is not available on ${r.day}, Period ${period}.`,[r.id]);const key=c+'|'+slot;if(maps.class.has(key))add('error','Class conflict',`${c} has two lessons on ${r.day}, Period ${period}.`,[maps.class.get(key),r.id]);else maps.class.set(key,r.id)}
      for(const t of r.teacherCodes){const key=t+'|'+slot;if(maps.teacher.has(key))add('error','Teacher conflict',`${teacherMap.get(t)?.name||t} is assigned twice on ${r.day}, Period ${period}.`,[maps.teacher.get(key),r.id]);else maps.teacher.set(key,r.id);if(teacherMap.get(t)?.unavailableSlots?.includes(slot))add('error','Teacher unavailable',`${teacherMap.get(t)?.name||t} is unavailable on ${r.day}, Period ${period}.`,[r.id])}
      if(r.venueId){const key=r.venueId+'|'+slot;if(maps.venue.has(key))add('error','Venue conflict',`${venueMap.get(r.venueId)?.name||r.venueId} is double-booked on ${r.day}, Period ${period}.`,[maps.venue.get(key),r.id]);else maps.venue.set(key,r.id);if(venueMap.get(r.venueId)?.unavailableSlots?.includes(slot))add('error','Venue unavailable',`${venueMap.get(r.venueId)?.name||r.venueId} is unavailable on ${r.day}, Period ${period}.`,[r.id])}
    }
  }
  for(const item of workspace.unplaced||[])add('error','Unplaced lesson',`${subjectMap.get(item.subjectId)?.name||item.subjectId} for ${(item.classIds||[]).join(' + ')} could not be placed.`,[item.id]);
  const classSubjectDay=new Map(),teacherDayPeriods=new Map();
  for(const r of workspace.records){for(const c of r.classIds){const k=c+'|'+r.subjectId+'|'+r.day;(classSubjectDay.get(k)||classSubjectDay.set(k,[]).get(k)).push(r.period)}for(const t of r.teacherCodes){const k=t+'|'+r.day;(teacherDayPeriods.get(k)||teacherDayPeriods.set(k,[]).get(k)).push(...Array.from({length:r.duration||1},(_,i)=>r.period+i))}}
  for(const [key,periods] of classSubjectDay){const [c,s,d]=key.split('|'),max=subjectMap.get(s)?.maxPerClassPerDay||1;if(periods.length>max)add('warn','Repeated subject',`${subjectMap.get(s)?.name||s} occurs ${periods.length} times for ${c} on ${d}.`)}
  for(const [key,periods] of teacherDayPeriods){const [t,d]=key.split('|'),sorted=[...new Set(periods)].sort((a,b)=>a-b),max=teacherMap.get(t)?.maxPeriodsPerDay||workspace.parameters.defaultTeacherMax||6;if(sorted.length>max)add('warn','Teacher daily load',`${teacherMap.get(t)?.name||t} has ${sorted.length} periods on ${d}; configured maximum is ${max}.`);if(sorted.length>1){const gaps=sorted[sorted.length-1]-sorted[0]+1-sorted.length;if(gaps>1)add('warn','Teacher gaps',`${teacherMap.get(t)?.name||t} has ${gaps} free gaps inside the teaching span on ${d}.`)}}
  const hard=issues.filter(x=>x.severity==='error').length,warnings=issues.filter(x=>x.severity==='warn').length,unplaced=(workspace.unplaced||[]).length,score=Math.max(0,1000-hard*100-unplaced*40-warnings*3);
  return {issues,summary:{score,hardConflicts:hard,unplaced,softWarnings:warnings,placed:workspace.records.length}};
}

function setGenerationProgress(done,total,text){const percent=Math.round(done/Math.max(1,total)*100);$('generatorPercent').textContent=percent+'%';$('generatorRing').style.setProperty('--progress',(percent*3.6)+'deg');$('generatorStatus').textContent=text}
function renderGenerationResult(){
  const g=state.workspace?.generation,host=$('generationResult');if(!g){host.innerHTML='<div class="emptyState">No candidate has been generated in this session.</div>';return}
  const q=g.quality||{};host.innerHTML=`<div class="resultMetrics"><div class="resultMetric"><strong>${q.score??'—'}</strong><span>Quality score</span></div><div class="resultMetric"><strong>${q.placed??state.workspace.records.length}</strong><span>Placed cards</span></div><div class="resultMetric"><strong>${q.unplaced??state.workspace.unplaced.length}</strong><span>Unplaced cards</span></div><div class="resultMetric"><strong>${q.hardConflicts??0}</strong><span>Hard conflicts</span></div></div><div class="notice ${q.hardConflicts||q.unplaced?'warn':'success'}">Seed <b>${safe(g.seed)}</b> · ${safe(g.attempts)} construction attempts · generated ${safe(displayDateTime(g.generatedAtMs))}. ${q.hardConflicts||q.unplaced?'Open the Visual Editor to resolve remaining items.':'This candidate is ready for full validation.'}</div><div class="buttonRow"><button class="button primary" data-go-editor>Open Visual Editor</button><button class="button quiet" data-go-validation>Validate Candidate</button></div>`;
  $('generationHistory').innerHTML=state.generationRuns.map(run=>`<div class="runItem"><div><strong>${safe(run.name)}</strong><p>${safe(displayDateTime(run.atMs))} · Seed ${safe(run.seed)} · ${run.quality.placed} placed</p></div><span class="statusPill ${run.quality.hardConflicts||run.quality.unplaced?'draft':'ready'}">Score ${run.quality.score}</span></div>`).join('')||'<div class="emptyState">No generation run in this session.</div>';
}
document.addEventListener('click',event=>{if(event.target.closest('[data-go-editor]'))switchTab('editor');if(event.target.closest('[data-go-validation]'))switchTab('validation')});
$('cancelGeneration').onclick=()=>{state.generationCancelled=true;$('generatorStatus').textContent='Stopping after the current attempt…'};
$('generateCandidate').onclick=async()=>{
  if(state.generationRunning)return;if(!state.workspace.allocations.length){setNotice('parameterMessage','Add at least one allocation card before generating.','warn');switchTab('allocations');return}
  const invalid=state.workspace.allocations.filter(a=>!a.subjectId||!a.classIds?.length);if(invalid.length){alert('Some allocation cards are incomplete. Please correct them before generation.');switchTab('allocations');return}
  state.workspace.parameters=readParameters();const attempts=Math.max(10,Math.min(500,state.workspace.parameters.generationAttempts||100)),seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  state.generationRunning=true;state.generationCancelled=false;$('generateCandidate').disabled=true;$('cancelGeneration').hidden=false;clearNotice('libraryMessage');let best=null;
  try{
    for(let i=0;i<attempts;i++){
      if(state.generationCancelled&&i>0)break;const result=buildAttempt(state.workspace,(seed+i*2654435761)>>>0);if(!best||result.quality.score>best.quality.score||result.quality.hardConflicts<best.quality.hardConflicts)best={...result,attemptSeed:(seed+i*2654435761)>>>0};
      if(i%4===0||i===attempts-1){setGenerationProgress(i+1,attempts,`Evaluating alternative ${i+1} of ${attempts}…`);await new Promise(resolve=>setTimeout(resolve,0))}
      if(best.quality.hardConflicts===0&&best.quality.unplaced===0&&best.quality.score>=990&&i>=Math.min(20,attempts-1))break;
    }
    if(!best)throw new Error('Generation stopped before a candidate could be built.');
    const runNumber=state.generationRuns.length+1,name=$('generatedName').value.trim()||`Generated Candidate ${displayDate(dateKey())} · Run ${runNumber}`;
    state.workspace.records=best.records;state.workspace.unplaced=best.unplaced;state.workspace.generation={seed:best.attemptSeed,baseSeed:seed,attempts,generatedAtMs:Date.now(),quality:best.quality,parameters:cleanClone(state.workspace.parameters),allocationCount:state.workspace.allocations.length};
    state.validation={issues:best.issues,summary:best.quality};state.versionId=null;state.versionStatus='draft';state.frozenVersion=false;$('versionName').value=name;$('versionDescription').value=`Automatically generated candidate. Seed ${best.attemptSeed}; ${attempts} configured attempts.`;state.selectedRecordId=null;state.selectedUnplacedId=null;state.undo=[];state.redo=[];markDirty('Generated candidate not yet stored');renderAll();
    await saveCurrentVersion({asNew:true,status:'draft',silent:true});state.generationRuns.unshift({name,seed:best.attemptSeed,atMs:Date.now(),quality:best.quality});renderGenerationResult();setGenerationProgress(1,1,'Candidate generated and stored in the version library.');setNotice('libraryMessage','<b>'+safe(name)+'</b> was generated and stored independently. The active timetable was not changed.','success');
  }catch(error){setGenerationProgress(0,1,'Generation could not be completed.');setNotice('libraryMessage','Generation failed: '+safe(error.message||error),'error')}
  finally{state.generationRunning=false;$('generateCandidate').disabled=false;$('cancelGeneration').hidden=true}
};

function renderEditorSelectors(){
  const w=state.workspace,keepClass=$('editorClass').value,keepTeacher=$('editorTeacherFilter').value,keepDay=$('editorDayFilter').value;
  $('editorClass').innerHTML=w.classes.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');if(w.classes.some(c=>c.id===keepClass))$('editorClass').value=keepClass;
  $('editorTeacherFilter').innerHTML='<option value="">All teachers</option>'+w.teachers.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${safe(t.code)}">${safe(t.name)} (${safe(t.code)})</option>`).join('');if(w.teachers.some(t=>t.code===keepTeacher))$('editorTeacherFilter').value=keepTeacher;
  $('editorDayFilter').innerHTML='<option value="">Whole week</option>'+(w.parameters.workingDays||DAYS).map(d=>`<option value="${safe(d)}">${safe(d)}</option>`).join('');if((w.parameters.workingDays||DAYS).includes(keepDay))$('editorDayFilter').value=keepDay;
}
$('editorClass').onchange=()=>{state.selectedRecordId=null;state.selectedUnplacedId=null;renderEditor()};$('editorTeacherFilter').onchange=renderEditor;$('editorDayFilter').onchange=renderEditor;

function subjectInfo(id){return state.workspace.subjects.find(s=>s.id===id)||{name:id||'Untitled',shortName:id||'—',colour:'#e2e8f0'}}
function teacherNames(codes){const map=new Map(state.workspace.teachers.map(t=>[t.code,t.name]));return (codes||[]).map(c=>map.get(c)||c).join(' + ')||'No teacher'}
function venueName(id){return state.workspace.venues.find(v=>v.id===id)?.name||id||'No venue'}
function recordAt(classId,day,period){return state.workspace.records.find(r=>r.classIds.includes(classId)&&r.day===day&&Number(r.period)===Number(period))||null}
function lessonCardHtml(record){
  const s=subjectInfo(record.subjectId),selected=state.selectedRecordId===record.id,filter=$('editorTeacherFilter').value,dim=filter&&!record.teacherCodes.includes(filter);return `<div class="lessonCard ${selected?'selected':''}" data-record-id="${safe(record.id)}" draggable="${record.locked?'false':'true'}" style="--subject-colour:${safe(s.colour)};--subject-bg:${safe(s.colour)}88;${dim?'opacity:.28':''}"><button class="lockButton" type="button" data-toggle-lock="${safe(record.id)}" title="${record.locked?'Unlock':'Lock'} card">${record.locked?'🔒':'○'}</button><h4>${safe(s.shortName||s.name)}</h4><p>${safe(teacherNames(record.teacherCodes))}</p><p>${safe(venueName(record.venueId))}</p>${record.classIds.length>1?`<div class="combinedFlag">Combined · ${safe(record.classIds.join(' + '))}</div>`:''}</div>`;
}
function renderEditor(){
  if(!state.workspace)return;const classId=$('editorClass').value||state.workspace.classes[0]?.id;if(!classId){$('timetableGrid').innerHTML='<div class="emptyState">Add a class / section to begin editing.</div>';return}
  const cls=state.workspace.classes.find(c=>c.id===classId),allDays=state.workspace.parameters.workingDays||DAYS,dayFilter=$('editorDayFilter').value,days=dayFilter?[dayFilter]:allDays,periods=[...(cls?.periods||[])].sort((a,b)=>a-b);
  let html='<table class="timetableTable"><thead><tr><th>Period</th>'+days.map(d=>`<th>${safe(d)}</th>`).join('')+'</tr></thead><tbody>';
  for(const period of periods){html+=`<tr><th class="periodCell">P${period}<br><span>${safe(timeLabel(state.workspace,period))}</span></th>`;for(const day of days){const record=recordAt(classId,day,period);html+=`<td class="dropCell" data-day="${safe(day)}" data-period="${period}" data-class="${safe(classId)}">${record?lessonCardHtml(record):'<div class="emptySlot">Drop or tap to place</div>'}</td>`}html+='</tr>'}
  html+='</tbody></table>';$('timetableGrid').innerHTML=html;renderUnplaced();renderSelectedCard();updateUndoButtons();
}
function renderUnplaced(){
  const host=$('unplacedTray'),filterClass=$('editorClass').value,rows=(state.workspace.unplaced||[]).filter(x=>!filterClass||x.classIds.includes(filterClass));$('unplacedCount').textContent=state.workspace.unplaced?.length||0;
  host.innerHTML=rows.map(item=>{const s=subjectInfo(item.subjectId);return `<button class="unplacedCard ${state.selectedUnplacedId===item.id?'selected':''}" data-unplaced-id="${safe(item.id)}" style="border-left:5px solid ${safe(s.colour)}"><strong>${safe(s.name)}</strong><span>${safe(item.classIds.join(' + '))} · ${safe(teacherNames(item.teacherCodes))} · ${item.duration} period(s)</span></button>`}).join('')||'<div class="emptyState">No unplaced cards for this class.</div>';
}
function renderSelectedCard(){
  const host=$('selectedCardEditor'),r=state.workspace.records.find(x=>x.id===state.selectedRecordId);if(!r){const u=state.workspace.unplaced.find(x=>x.id===state.selectedUnplacedId);host.innerHTML=u?`<div><strong>${safe(subjectInfo(u.subjectId).name)}</strong><p>${safe(u.classIds.join(' + '))} · ${safe(teacherNames(u.teacherCodes))}</p><p>Tap an available cell to place this card. Tapping an occupied cell replaces that card and sends it to the tray.</p></div>`:'<div class="emptyState">No card selected.</div>';return}
  host.innerHTML=`<div class="selectedForm"><div><b>${safe(subjectInfo(r.subjectId).name)}</b></div><div>${safe(r.classIds.join(' + '))} · ${safe(teacherNames(r.teacherCodes))}</div><div><label for="selectedVenue">Venue</label><select id="selectedVenue">${state.workspace.venues.map(v=>`<option value="${safe(v.id)}" ${v.id===r.venueId?'selected':''}>${safe(v.name)}</option>`).join('')}</select></div><label><input id="selectedLocked" type="checkbox" ${r.locked?'checked':''}> Lock this card during future generation</label><div class="buttonRow"><button class="button compact danger" id="sendSelectedToTray">Move to Unplaced Tray</button><button class="button compact quiet" id="clearCardSelection">Clear Selection</button></div></div>`;
  $('selectedVenue').onchange=e=>mutateWithUndo(()=>{r.venueId=e.target.value},'Venue changed');$('selectedLocked').onchange=e=>mutateWithUndo(()=>{r.locked=e.target.checked},e.target.checked?'Card locked':'Card unlocked');$('sendSelectedToTray').onclick=()=>moveRecordToTray(r.id);$('clearCardSelection').onclick=()=>{state.selectedRecordId=null;renderEditor()};
}
function pushUndo(){state.undo.push(cleanClone({records:state.workspace.records,unplaced:state.workspace.unplaced}));if(state.undo.length>30)state.undo.shift();state.redo=[]}
function restoreSnapshot(snapshot){state.workspace.records=cleanClone(snapshot.records);state.workspace.unplaced=cleanClone(snapshot.unplaced);state.selectedRecordId=null;state.selectedUnplacedId=null;markDirty('Card edit not saved');renderEditor();renderValidation()}
function mutateWithUndo(fn,label){pushUndo();fn();markDirty(label);renderEditor();renderValidation()}
function updateUndoButtons(){$('undoEdit').disabled=!state.undo.length;$('redoEdit').disabled=!state.redo.length}
$('undoEdit').onclick=()=>{if(!state.undo.length)return;state.redo.push(cleanClone({records:state.workspace.records,unplaced:state.workspace.unplaced}));restoreSnapshot(state.undo.pop())};
$('redoEdit').onclick=()=>{if(!state.redo.length)return;state.undo.push(cleanClone({records:state.workspace.records,unplaced:state.workspace.unplaced}));restoreSnapshot(state.redo.pop())};

function eventToUnplaced(record){return {id:nowId('UNPLACED'),allocationId:record.allocationId,subjectId:record.subjectId,teacherCodes:[...record.teacherCodes],classIds:[...record.classIds],venueIds:record.venueId?[record.venueId]:[],duration:record.duration||1,priority:'normal',combined:record.classIds.length>1,preferredDays:[],reason:'Moved from timetable editor'}}
function moveRecordToTray(id){const r=state.workspace.records.find(x=>x.id===id);if(!r||r.locked)return;mutateWithUndo(()=>{state.workspace.records=state.workspace.records.filter(x=>x.id!==id);state.workspace.unplaced.push(eventToUnplaced(r));state.selectedRecordId=null},'Card moved to unplaced tray')}
function applyMove(day,period,classId){
  const beforeHard=validateWorkspace(state.workspace).summary.hardConflicts,target=recordAt(classId,day,period);
  if(state.selectedRecordId){const moving=state.workspace.records.find(r=>r.id===state.selectedRecordId);if(!moving||moving.locked)return;if(target?.id===moving.id)return;const old={day:moving.day,period:moving.period};pushUndo();moving.day=day;moving.period=Number(period);moving.time=timeLabel(state.workspace,period);if(target){if(target.locked){restoreSnapshot(state.undo.pop());setNotice('editorMessage','The destination card is locked. Unlock it before swapping.','warn');return}target.day=old.day;target.period=old.period;target.time=timeLabel(state.workspace,old.period)}const afterHard=validateWorkspace(state.workspace).summary.hardConflicts;if(afterHard>beforeHard){restoreSnapshot(state.undo.pop());setNotice('editorMessage','Move rejected because it would create a teacher, class, venue or availability conflict.','error');return}markDirty(target?'Cards swapped':'Card moved');state.selectedRecordId=moving.id;renderEditor();setNotice('editorMessage',target?'Cards swapped successfully.':'Card moved successfully.','success');return}
  if(state.selectedUnplacedId){const item=state.workspace.unplaced.find(u=>u.id===state.selectedUnplacedId);if(!item)return;pushUndo();if(target){if(target.locked){state.undo.pop();setNotice('editorMessage','The destination card is locked.','warn');return}state.workspace.records=state.workspace.records.filter(r=>r.id!==target.id);state.workspace.unplaced.push(eventToUnplaced(target))}const classMap=new Map(state.workspace.classes.map(c=>[c.id,c])),venue=item.venueIds?.[0]||item.classIds.map(c=>classMap.get(c)?.defaultVenueId).find(Boolean)||'';const placed={id:nowId('CARD'),allocationId:item.allocationId,day,period:Number(period),duration:item.duration||1,classIds:[...item.classIds],subjectId:item.subjectId,teacherCodes:[...item.teacherCodes],venueId:venue,locked:false,time:timeLabel(state.workspace,period),combined:item.classIds.length>1};state.workspace.records.push(placed);state.workspace.unplaced=state.workspace.unplaced.filter(u=>u.id!==item.id);const afterHard=validateWorkspace(state.workspace).summary.hardConflicts;if(afterHard>beforeHard){restoreSnapshot(state.undo.pop());setNotice('editorMessage','Placement rejected because it would create a conflict.','error');return}state.selectedUnplacedId=null;state.selectedRecordId=placed.id;markDirty(target?'Card replaced from tray':'Unplaced card added');renderEditor();setNotice('editorMessage',target?'The existing card was moved to the tray and replaced.':'Card placed successfully.','success')}
}
document.addEventListener('dragstart',event=>{const card=event.target.closest('[data-record-id]');if(!card)return;state.selectedRecordId=card.dataset.recordId;state.selectedUnplacedId=null;event.dataTransfer.setData('text/plain',card.dataset.recordId);event.dataTransfer.effectAllowed='move'});
document.addEventListener('dragover',event=>{const cell=event.target.closest('.dropCell');if(!cell)return;event.preventDefault();cell.classList.add('dragOver')});
document.addEventListener('dragleave',event=>event.target.closest('.dropCell')?.classList.remove('dragOver'));
document.addEventListener('drop',event=>{const cell=event.target.closest('.dropCell');if(!cell)return;event.preventDefault();cell.classList.remove('dragOver');applyMove(cell.dataset.day,Number(cell.dataset.period),cell.dataset.class)});
document.addEventListener('click',event=>{
  const lock=event.target.closest('[data-toggle-lock]');if(lock){event.stopPropagation();const r=state.workspace.records.find(x=>x.id===lock.dataset.toggleLock);if(r)mutateWithUndo(()=>r.locked=!r.locked,r.locked?'Card unlocked':'Card locked');return}
  const card=event.target.closest('[data-record-id]');if(card){state.selectedRecordId=card.dataset.recordId;state.selectedUnplacedId=null;renderEditor();setNotice('editorMessage','Card selected. Tap another cell to move or swap it.','info');return}
  const unplaced=event.target.closest('[data-unplaced-id]');if(unplaced){state.selectedUnplacedId=unplaced.dataset.unplacedId;state.selectedRecordId=null;renderEditor();setNotice('editorMessage','Unplaced card selected. Tap an available timetable cell to place it.','info');return}
  const cell=event.target.closest('.dropCell');if(cell&&(state.selectedRecordId||state.selectedUnplacedId))applyMove(cell.dataset.day,Number(cell.dataset.period),cell.dataset.class);
});

function renderValidation(){
  if(!state.workspace)return;const v=state.validation||validateWorkspace(state.workspace);state.validation=v;const q=v.summary,score=$('validationScore').children;score[0].querySelector('strong').textContent=q.score;score[1].querySelector('strong').textContent=q.hardConflicts;score[2].querySelector('strong').textContent=q.unplaced;score[3].querySelector('strong').textContent=q.softWarnings;
  $('validationIssues').innerHTML=v.issues.length?v.issues.map(x=>`<div class="issue ${x.severity}"><span>${x.severity==='error'?'✕':'!'}</span><div><strong>${safe(x.title)}</strong><p>${safe(x.detail)}</p></div></div>`).join(''):'<div class="notice success"><b>No conflicts found.</b> All lessons are placed and the timetable satisfies the configured hard rules.</div>';
  updateActionState();
}
$('runValidation').onclick=()=>{state.validation=validateWorkspace(state.workspace);renderValidation();setNotice('activationMessage',state.validation.summary.hardConflicts||state.validation.summary.unplaced?'Validation completed. Resolve all hard conflicts and unplaced cards before marking the version ready.':'Validation passed. This version can be marked ready. ',state.validation.summary.hardConflicts||state.validation.summary.unplaced?'warn':'success')};
function updateActionState(){
  if(!state.workspace)return;const v=state.validation||validateWorkspace(state.workspace),clean=v.summary.hardConflicts===0&&v.summary.unplaced===0,saved=!!state.versionId;
  $('markReady').disabled=!clean||!saved||state.dirty||state.versionStatus==='active';$('activateVersion').disabled=!state.isAdmin||!clean||!saved||state.dirty||!['ready','inactive'].includes(state.versionStatus);$('deleteVersion').disabled=!state.isAdmin||!saved||state.versionStatus==='active';
}
$('markReady').onclick=async()=>{state.validation=validateWorkspace(state.workspace);if(state.validation.summary.hardConflicts||state.validation.summary.unplaced)return;await saveCurrentVersion({status:'ready',silent:true});state.versionStatus='ready';markClean();setNotice('activationMessage','This timetable is validated and marked Ready. It remains stored and inactive until the Principal activates it.','success')};

async function activateCurrentVersion(){
  if(!state.isAdmin)throw new Error('Only the Principal/Admin can activate a timetable.');state.validation=validateWorkspace(state.workspace);if(state.validation.summary.hardConflicts||state.validation.summary.unplaced)throw new Error('Resolve all hard conflicts and unplaced lessons before activation.');if(state.dirty)throw new Error('Save the latest edits before activation.');if(!state.versionId)throw new Error('Save this timetable version before activation.');
  const name=$('versionName').value.trim()||'Untitled Timetable';if(!await confirmAction('Activate this timetable?','“'+name+'” will become the operational master immediately. The existing active timetable will be retained in the version library as Inactive and can be reactivated later.','Activate Timetable','success'))return;
  const masterSnap=await getDoc(doc(db,'master','current'));if(!masterSnap.exists())throw new Error('The operational master could not be found.');const masterDoc=masterSnap.data(),currentData=masterDoc.data||masterDoc,nextData=workspaceToMasterData(state.workspace,currentData),now=Date.now(),batch=writeBatch(db);
  nextData.activeTimetableVersionId=state.versionId;nextData.activeTimetableVersionName=name;nextData.activeTimetableActivatedAtMs=now;
  for(const v of state.library.filter(v=>v.status==='active'&&v.id!==state.versionId))batch.set(doc(db,'timetableVersions',v.id),{status:'inactive',deactivatedAtMs:now,deactivatedByUid:state.user.uid,updatedAtMs:now,updatedAt:serverTimestamp()},{merge:true});
  let previousVersionId=masterDoc.activeTimetableVersionId||'',previousVersionName=masterDoc.activeTimetableVersionName||'Operational Master Timetable';
  if(!previousVersionId||!state.library.some(v=>v.id===previousVersionId)){
    previousVersionId=nowId('TT_ARCHIVE');
    batch.set(doc(db,'timetableVersions',previousVersionId),{schemaVersion:1,appVersion:APP_VERSION,name:previousVersionName+' · Preserved Before Activation',description:'Automatic immutable snapshot of the previously active operational master.',status:'inactive',source:'activation_snapshot',createdAtMs:now,createdByUid:state.user.uid,createdByEmail:state.user.email||'',updatedAtMs:now,updatedByUid:state.user.uid,updatedByEmail:state.user.email||'',updatedAt:serverTimestamp(),quality:null,timetable:modelFromMaster(currentData)});
  }
  const history=[{atMs:now,type:'timetable_version_activation',byUid:state.user.uid,byName:state.user.displayName||state.profile.name||state.user.email||'Admin',summary:'Activated stored timetable version: '+name,versionId:state.versionId},...(masterDoc.changeHistory||[])].slice(0,150);
  batch.set(doc(db,'master','current'),{data:nextData,changeHistory:history,session:masterDoc.session||'2026-27',activeTimetableVersionId:state.versionId,activeTimetableVersionName:name,activeTimetableActivatedAtMs:now,activeTimetableActivatedByUid:state.user.uid,activeTimetableActivatedByEmail:state.user.email||'',updatedAt:serverTimestamp(),updatedBy:state.user.uid,updatedByEmail:state.user.email||''},{merge:true});
  batch.set(doc(db,'timetableVersions',state.versionId),{status:'active',activatedAtMs:now,activatedByUid:state.user.uid,activatedByEmail:state.user.email||'',updatedAtMs:now,updatedAt:serverTimestamp()},{merge:true});
  const activationId=nowId('ACT');batch.set(doc(db,'timetableActivations',activationId),{versionId:state.versionId,versionName:name,activatedAtMs:now,activatedAt:serverTimestamp(),activatedByUid:state.user.uid,activatedByEmail:state.user.email||'',previousVersionId,previousVersionName,recordCount:nextData.records.length});
  await batch.commit();state.versionStatus='active';state.frozenVersion=true;markClean();await loadActiveMaster();await loadLibrary();renderAll();setNotice('activationMessage','<b>'+safe(name)+'</b> is now the active operational timetable. The previous timetable remains stored and can be reactivated.','success');
}
$('activateVersion').onclick=()=>activateCurrentVersion().catch(e=>setNotice('activationMessage','Activation failed: '+safe(e.message||e),'error'));
$('deleteVersion').onclick=()=>state.versionId&&deleteStoredVersion(state.versionId);
$('printVersion').onclick=()=>{switchTab('editor');setTimeout(()=>window.print(),120)};
function versionSummary(){const q=(state.validation||validateWorkspace(state.workspace)).summary;return `VKV Nalbari · Timetable Version\n${$('versionName').value.trim()||'Untitled Timetable'}\nStatus: ${statusLabel(state.versionStatus)}\nTeachers: ${state.workspace.teachers.length}\nClasses: ${state.workspace.classes.length}\nPlaced lessons: ${q.placed}\nUnplaced lessons: ${q.unplaced}\nHard conflicts: ${q.hardConflicts}\nQuality score: ${q.score}`}
$('shareVersion').onclick=async()=>{const text=versionSummary();try{if(navigator.share){await navigator.share({title:$('versionName').value.trim()||'VKV Nalbari Timetable',text});return}await navigator.clipboard.writeText(text);setNotice('activationMessage','Timetable summary copied for sharing.','success')}catch(e){if(e?.name!=='AbortError')setNotice('activationMessage','Sharing is unavailable. You can use Export JSON instead.','warn')}};

function confirmAction(title,text,proceedLabel='Continue',kind='danger'){
  return new Promise(resolve=>{const modal=$('confirmDialog');$('confirmTitle').textContent=title;$('confirmText').textContent=text;$('confirmProceed').textContent=proceedLabel;$('confirmProceed').className='button '+(kind==='success'?'success':'danger');modal.hidden=false;const finish=value=>{modal.hidden=true;$('confirmCancel').onclick=null;$('confirmProceed').onclick=null;resolve(value)};$('confirmCancel').onclick=()=>finish(false);$('confirmProceed').onclick=()=>finish(true)})
}

window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue=''}});
