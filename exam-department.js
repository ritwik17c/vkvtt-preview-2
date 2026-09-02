import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc,collection,getDocs,setDoc,serverTimestamp,writeBatch} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';
import {candidateExamDates,createWorkspaceFromMaster,dayName,displayDate,generateExamTimetable,generateDutyRoster,validateExamTimetable,validateDutyRoster} from './exam-scheduler-core.js?v=1.1.0';

const firebaseConfig={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();setPersistence(auth,browserLocalPersistence).catch(()=>{});
const $=id=>document.getElementById(id),safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clone=value=>JSON.parse(JSON.stringify(value));
const state={user:null,profile:null,isAdmin:false,master:null,workspace:null,dirty:false,visiblePapers:[],visibleTeachers:[],cloudId:'',cloudMeta:null,cloudItems:[],leaveSync:null};
const WEEKDAYS=[['0','Sunday'],['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday']];

function setSaveState(message,dirty=false){$('saveState').textContent=message;$('saveState').dataset.dirty=dirty?'true':'false'}
function markDirty(message='Unsaved changes'){state.dirty=true;if(state.workspace)state.workspace.updatedAtMs=Date.now();setSaveState(message,true);renderReview();renderWorkflow()}
function showNotice(id,message,kind='info'){const el=$(id);el.className='notice '+kind;el.innerHTML=message}
function listValues(value){return [...new Set(String(value||'').split(/[\n,;]+/).map(item=>item.trim()).filter(Boolean))]}
function slotById(id){return state.workspace.slots.find(item=>item.id===id)}
function teacherName(code){const item=state.workspace.teachers.find(teacher=>teacher.code===code);return item?item.name:code}
function timeText(slot){return slot?(slot.startTime&&slot.endTime?slot.startTime+'–'+slot.endTime:(slot.startTime||slot.endTime||'')):''}

function bindNavigation(){
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-pane-target]');if(!button)return;
    document.querySelectorAll('.navButton').forEach(item=>item.classList.toggle('active',item===button));
    document.querySelectorAll('.pane').forEach(item=>item.classList.toggle('active',item.dataset.pane===button.dataset.paneTarget));
    if(button.dataset.paneTarget==='outputs')renderReview();
  });
}

async function verifyAccess(user){
  state.user=user;$('signInButton').hidden=true;
  if(!user){$('gateMessage').textContent='Sign in with an authorised Google account.';$('signInButton').hidden=false;return}
  $('gateMessage').textContent='Checking Examination Department permission…';
  try{
    const profileSnap=await getDoc(doc(db,'authorizedUsers',user.uid)),profile=profileSnap.exists()?profileSnap.data():null;
    const allowed=profile&&profile.active===true&&(profile.role==='admin'||profile.permissions?.examDepartment===true);
    if(!allowed){$('gateMessage').innerHTML='<b>Examination Department access is not enabled for this account.</b><br>Ask the Principal/Admin to delegate this workspace in User Access & Roles.';return}
    state.profile=profile;state.isAdmin=profile.role==='admin';
    const masterSnap=await getDoc(doc(db,'master','current'));if(!masterSnap.exists())throw new Error('The active master timetable was not found.');
    state.master=masterSnap.data();state.workspace=createWorkspaceFromMaster(state.master);
    $('authGate').hidden=true;$('examApp').hidden=false;renderAll();await Promise.all([renderDraftList(),refreshApprovedLeave(false)]);setSaveState('New unsaved cloud draft',true);state.dirty=true;renderWorkflow();
  }catch(error){$('gateMessage').textContent='Could not open the Examination Department: '+(error.message||error)}
}

$('signInButton').onclick=async()=>{await setPersistence(auth,browserLocalPersistence);provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider)};
onAuthStateChanged(auth,verifyAccess);bindNavigation();

function workflowStatus(){return state.cloudMeta?.status||'draft'}
function renderWorkflow(){
  if(!state.workspace)return;const status=workflowStatus(),labels={draft:'Working Draft',submitted:'Submitted to Principal',returned:'Returned for Correction',published:'Approved & Published'},label=labels[status]||status;
  $('workflowStatus').innerHTML=`<span class="workflowPill ${safe(status)}">${safe(label)}</span>${status==='submitted'?'Awaiting Principal review.':status==='published'?'This approved version is visible to all authorised staff.':status==='returned'?safe(state.cloudMeta?.reviewNote||'Please make the requested correction and submit again.'):'Save the cloud draft, complete both schedules, and submit it to the Principal.'}`;
  const editable=status==='draft'||status==='returned';
  $('saveDraft').hidden=!editable;$('submitDraft').hidden=!editable||status==='submitted'||status==='published';
  $('approvePublish').hidden=!(state.isAdmin&&status==='submitted');$('returnDraft').hidden=!(state.isAdmin&&status==='submitted');
}

function cloudPayload(status=workflowStatus()){
  const now=Date.now(),old=state.cloudMeta||{};return {schemaVersion:1,name:state.workspace.name||'Untitled Examination Schedule',description:state.workspace.description||'',status,workspace:clone(state.workspace),ownerUid:old.ownerUid||state.user.uid,ownerName:old.ownerName||state.profile?.name||state.user.displayName||state.user.email||'Exam Manager',ownerEmail:old.ownerEmail||state.user.email||'',revisionOf:old.revisionOf||'',createdAtMs:old.createdAtMs||now,updatedAtMs:now,updatedByUid:state.user.uid,updatedByEmail:state.user.email||''};
}
async function saveCloudDraft({quiet=false}={}){
  syncSetup();syncDutySettings();const status=workflowStatus();if(!state.isAdmin&&!['draft','returned'].includes(status))throw new Error('This submitted/published version is locked. Start a revision from the cloud workspace list.');
  const id=state.cloudId||('EXAM_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),payload=cloudPayload(status==='returned'?'draft':status);
  await setDoc(doc(db,'examSchedules',id),{...payload,updatedAt:serverTimestamp()},{merge:true});state.cloudId=id;state.cloudMeta={...payload,status:payload.status};state.dirty=false;setSaveState('Cloud draft saved',false);renderWorkflow();if(!quiet)await renderDraftList();return id;
}
$('saveDraft').onclick=async()=>{try{$('saveDraft').disabled=true;await saveCloudDraft()}catch(e){alert('Could not save cloud draft: '+(e.message||e))}finally{$('saveDraft').disabled=false}};
$('submitDraft').onclick=async()=>{try{const exam=validateExamTimetable(state.workspace),duty=validateDutyRoster(state.workspace);if(!exam.valid||!exam.scheduled)throw new Error('Generate a complete valid examination timetable before submission.');if(!state.workspace.duties?.invigilation?.length||!duty.valid)throw new Error('Generate a complete valid duty allocation before submission.');$('submitDraft').disabled=true;await saveCloudDraft({quiet:true});const meta={...state.cloudMeta,status:'submitted',submittedAtMs:Date.now(),submittedByUid:state.user.uid,submittedByEmail:state.user.email||''};await setDoc(doc(db,'examSchedules',state.cloudId),{status:'submitted',submittedAtMs:meta.submittedAtMs,submittedByUid:meta.submittedByUid,submittedByEmail:meta.submittedByEmail,updatedAt:serverTimestamp()},{merge:true});state.cloudMeta=meta;state.dirty=false;setSaveState('Submitted to Principal',false);renderWorkflow();await renderDraftList()}catch(e){alert('Could not submit: '+(e.message||e))}finally{$('submitDraft').disabled=false}};
$('approvePublish').onclick=async()=>{try{if(!state.isAdmin||workflowStatus()!=='submitted')return;const exam=validateExamTimetable(state.workspace),duty=validateDutyRoster(state.workspace);if(!exam.valid||!exam.scheduled||!duty.valid||!state.workspace.duties?.invigilation?.length)throw new Error('The timetable and duty allocation must pass all hard-rule checks.');if(!confirm('Approve and publish this examination schedule to all staff?'))return;$('approvePublish').disabled=true;const now=Date.now(),published={schemaVersion:1,scheduleId:state.cloudId,name:state.workspace.name,description:state.workspace.description||'',workspace:clone(state.workspace),status:'published',approvedAtMs:now,approvedByUid:state.user.uid,approvedByName:state.profile?.name||state.user.displayName||'Principal',updatedAt:serverTimestamp()},batch=writeBatch(db);batch.set(doc(db,'publishedExam','current'),published);batch.set(doc(db,'examSchedules',state.cloudId),{status:'published',approvedAtMs:now,approvedByUid:state.user.uid,approvedByEmail:state.user.email||'',updatedAt:serverTimestamp()},{merge:true});await batch.commit();state.cloudMeta={...state.cloudMeta,...published,status:'published'};state.dirty=false;setSaveState('Approved and published',false);renderWorkflow();await renderDraftList()}catch(e){alert('Could not approve and publish: '+(e.message||e))}finally{$('approvePublish').disabled=false}};
$('returnDraft').onclick=async()=>{try{if(!state.isAdmin||workflowStatus()!=='submitted')return;const note=prompt('Correction note for the Exam Manager:','Please review and resubmit.');if(note===null)return;await setDoc(doc(db,'examSchedules',state.cloudId),{status:'returned',reviewNote:note.trim(),returnedAtMs:Date.now(),returnedByUid:state.user.uid,updatedAt:serverTimestamp()},{merge:true});state.cloudMeta={...state.cloudMeta,status:'returned',reviewNote:note.trim()};setSaveState('Returned for correction',false);renderWorkflow();await renderDraftList()}catch(e){alert('Could not return the draft: '+(e.message||e))}};

function renderAll(){
  renderMasterSummary();renderSetup();renderSessions();renderPapers();renderTeachers();renderTimetable();renderDuties();renderReview();renderWorkflow();
}

function renderMasterSummary(){
  const master=state.master||{},data=master.data&&typeof master.data==='object'?{...master,...master.data}:master,source=state.workspace.sourceSchedule||{};
  $('masterName').textContent=source.name||master.activeTimetableVersionName||'Activated Schedule';
  $('masterMeta').textContent='Read-only source · '+(master.activeTimetableVersionName||'Operational master timetable');
  $('masterStats').innerHTML=[`${state.workspace.classes.length} classes`,`${state.workspace.papers.length} class-subject papers`,`${state.workspace.teachers.length} teachers`,`${(data.records||[]).length} timetable entries`].map(value=>'<span class="chip">'+safe(value)+'</span>').join('');
  $('sideSource').textContent=source.name||'Activated Schedule';
}

function renderSetup(){
  const workspace=state.workspace,settings=workspace.settings;
  $('workspaceName').value=workspace.name;$('workspaceDescription').value=workspace.description||'';$('sideName').textContent=workspace.name;
  $('startDate').value=settings.startDate||'';$('endDate').value=settings.endDate||'';$('cadence').value=settings.cadence||'continuous';$('maxPerDay').value=settings.maxExamsPerClassPerDay||1;
  $('excludedDates').value=(settings.excludedDates||[]).join(', ');$('customDates').value=(settings.customDates||[]).join(', ');
  $('weekdayChecks').innerHTML=WEEKDAYS.map(([number,name])=>`<label><input type="checkbox" data-weekday="${number}" ${(settings.excludedWeekdays||[]).map(Number).includes(Number(number))?'checked':''}> ${name}</label>`).join('');
  renderDatePreview();
}

function syncSetup(){
  const workspace=state.workspace,settings=workspace.settings;
  workspace.name=$('workspaceName').value.trim()||'Untitled Examination Schedule';workspace.description=$('workspaceDescription').value.trim();$('sideName').textContent=workspace.name;
  settings.startDate=$('startDate').value;settings.endDate=$('endDate').value;settings.cadence=$('cadence').value;settings.maxExamsPerClassPerDay=Math.max(1,Number($('maxPerDay').value)||1);
  settings.excludedDates=listValues($('excludedDates').value);settings.customDates=listValues($('customDates').value);settings.excludedWeekdays=[...document.querySelectorAll('[data-weekday]:checked')].map(item=>Number(item.dataset.weekday));
  renderDatePreview();markDirty();
}

['workspaceName','workspaceDescription','startDate','endDate','cadence','maxPerDay','excludedDates','customDates'].forEach(id=>$(id).addEventListener('change',syncSetup));
$('weekdayChecks').addEventListener('change',syncSetup);

function renderDatePreview(){
  const dates=candidateExamDates(state.workspace.settings),settings=state.workspace.settings;
  const sample=dates.slice(0,7).map(value=>displayDate(value)+' '+dayName(value)).join(' · ');
  showNotice('datePreview',dates.length?`<b>${dates.length} eligible examination date(s).</b> ${safe(sample)}${dates.length>7?' …':''}`:'<b>No eligible examination dates.</b> Check the date range, cadence and exclusions.',dates.length?'info':'warn');
}

function renderSessions(){
  const options=state.workspace.slots;
  $('sessionRows').innerHTML=options.map((slot,index)=>`<div class="sessionRow" data-session-row="${safe(slot.id)}"><label>Session name<input data-session-field="name" value="${safe(slot.name)}"></label><label>Starts<input data-session-field="startTime" type="time" value="${safe(slot.startTime)}"></label><label>Ends<input data-session-field="endTime" type="time" value="${safe(slot.endTime)}"></label><label>Duration (minutes)<input data-session-field="durationMinutes" type="number" min="15" value="${Number(slot.durationMinutes)||0}"></label><button class="button" data-remove-session="${safe(slot.id)}" ${options.length===1?'disabled':''}>Remove</button></div>`).join('');
}
$('addSession').onclick=()=>{const number=state.workspace.slots.length+1;state.workspace.slots.push({id:'SESSION_'+Date.now(),name:'Session '+number,startTime:'09:00',endTime:'12:00',durationMinutes:180});renderSessions();renderPapers();markDirty('Session added')};
$('sessionRows').addEventListener('change',event=>{const row=event.target.closest('[data-session-row]'),field=event.target.dataset.sessionField;if(!row||!field)return;const slot=slotById(row.dataset.sessionRow);if(!slot)return;slot[field]=field==='durationMinutes'?Math.max(15,Number(event.target.value)||15):event.target.value;markDirty()});
$('sessionRows').addEventListener('click',event=>{const button=event.target.closest('[data-remove-session]');if(!button||state.workspace.slots.length===1)return;const id=button.dataset.removeSession;state.workspace.slots=state.workspace.slots.filter(item=>item.id!==id);for(const paper of state.workspace.papers)if(paper.fixedSlotId===id)paper.fixedSlotId='';state.workspace.timetable={events:[],unplaced:[],dates:[],slots:[]};state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderSessions();renderPapers();renderTimetable();renderDuties();markDirty('Session removed; schedules need regeneration')});

function filteredPapers(){const search=$('paperSearch').value.trim().toLowerCase(),className=$('paperClassFilter').value;return state.workspace.papers.filter(item=>(!className||item.className===className)&&(!search||(item.className+' '+item.subject+' '+(item.teacherCodes||[]).join(' ')).toLowerCase().includes(search)))}
function renderPapers(){
  const current=$('paperClassFilter').value;$('paperClassFilter').innerHTML='<option value="">All classes</option>'+state.workspace.classes.map(value=>`<option value="${safe(value)}" ${value===current?'selected':''}>${safe(value)}</option>`).join('');
  const papers=filteredPapers();state.visiblePapers=papers.map(item=>item.id);const slotOptions='<option value="">Any session</option>'+state.workspace.slots.map(slot=>`<option value="${safe(slot.id)}">${safe(slot.name)}</option>`).join('');
  $('paperRows').innerHTML=papers.length?papers.map(item=>`<tr data-paper="${safe(item.id)}"><td><input type="checkbox" data-paper-field="included" ${item.included!==false?'checked':''}></td><td><b>${safe(item.className)}</b></td><td>${safe(item.subject)}</td><td>${safe((item.teacherCodes||[]).map(teacherName).join(', ')||'—')}</td><td><input data-paper-field="roomId" value="${safe(item.roomId||item.className)}"></td><td><input type="date" data-paper-field="fixedDate" value="${safe(item.fixedDate||'')}"></td><td><select data-paper-field="fixedSlotId">${slotOptions.replace(`value="${safe(item.fixedSlotId||'')}"`,`value="${safe(item.fixedSlotId||'')}" selected`)}</select></td></tr>`).join(''):'<tr><td colspan="7">No subjects match this filter.</td></tr>';
  const included=state.workspace.papers.filter(item=>item.included!==false).length;showNotice('paperCounts',`<b>${included}</b> of ${state.workspace.papers.length} class-subject papers included · ${papers.length} visible`,'info');
}
$('paperSearch').addEventListener('input',renderPapers);$('paperClassFilter').addEventListener('change',renderPapers);
$('paperRows').addEventListener('change',event=>{const row=event.target.closest('[data-paper]'),field=event.target.dataset.paperField;if(!row||!field)return;const paper=state.workspace.papers.find(item=>item.id===row.dataset.paper);if(!paper)return;paper[field]=field==='included'?event.target.checked:event.target.value;state.workspace.timetable={events:[],unplaced:[],dates:[],slots:[]};state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderPapers();renderTimetable();renderDuties();markDirty('Subjects changed; schedules need regeneration')});
function setVisiblePapers(included){for(const id of state.visiblePapers){const paper=state.workspace.papers.find(item=>item.id===id);if(paper)paper.included=included}state.workspace.timetable={events:[],unplaced:[],dates:[],slots:[]};state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderPapers();renderTimetable();renderDuties();markDirty(included?'Visible subjects included':'Visible subjects excluded')}
$('includeVisible').onclick=()=>setVisiblePapers(true);$('excludeVisible').onclick=()=>setVisiblePapers(false);

function renderTimetable(){
  const result=state.workspace.timetable||{events:[],unplaced:[]},validation=validateExamTimetable(state.workspace),events=result.events||[];
  $('examRows').innerHTML=events.length?events.map(item=>{const slot=slotById(item.slotId);return `<tr><td>${displayDate(item.date)}</td><td>${safe(item.day)}</td><td>${safe(slot?.name||item.slotId)}</td><td>${safe(timeText(slot))}</td><td><b>${safe(item.className)}</b></td><td>${safe(item.subject)}</td></tr>`}).join(''):'<tr><td colspan="6">No timetable generated.</td></tr>';
  $('timetableMetrics').innerHTML=[['Eligible dates',(result.dates||[]).length],['Included papers',validation.total],['Scheduled',validation.scheduled],['Unplaced',validation.unplaced]].map(([label,value])=>`<div class="metric"><strong>${value}</strong><span>${label}</span></div>`).join('');
  if(events.length)showNotice('timetableStatus',validation.valid?'<b>Timetable passes the current hard-rule checks.</b> Continue to staff availability and duty allocation.':'<b>Timetable needs attention.</b> '+validation.issues.map(item=>safe(item.message)).join(' '),validation.valid?'success':'error');
  else showNotice('timetableStatus','Complete Exam Setup and Subjects, then generate a draft timetable.','info');
  $('unplacedBlock').innerHTML=(result.unplaced||[]).length?`<div class="notice error"><b>Unscheduled papers</b><ul class="issueList">${result.unplaced.map(item=>`<li>${safe(item.className)} · ${safe(item.subject)} — ${safe(item.reason)}</li>`).join('')}</ul></div>`:'';
}
$('generateTimetable').onclick=()=>{syncSetup();state.workspace.timetable=generateExamTimetable(state.workspace);state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderTimetable();renderDuties();markDirty('Exam timetable generated');document.querySelector('[data-pane="timetable"]').scrollIntoView({behavior:'smooth'})};

function normalDate(value){const textValue=String(value||'').trim();let match=textValue.match(/^(\d{4})-(\d{2})-(\d{2})/);if(match)return match[1]+'-'+match[2]+'-'+match[3];match=textValue.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return match?match[3]+'-'+String(match[2]).padStart(2,'0')+'-'+String(match[1]).padStart(2,'0'):''}
function planDates(plan){if(plan.mode==='multiple'&&Array.isArray(plan.dates))return plan.dates.map(normalDate).filter(Boolean);const start=normalDate(plan.startDate||plan.date||plan.fromDate),end=normalDate(plan.endDate||plan.toDate||start);if(!start)return[];const out=[],cursor=new Date(start+'T12:00:00');for(let guard=0;guard<400;guard++){const value=cursor.toISOString().slice(0,10);if(value>end)break;out.push(value);cursor.setDate(cursor.getDate()+1)}return out}
function leaveCode(record){return String(record.code||record.teacherCode||record.staffCode||record.teacherShortCode||record.shortCode||'').trim()}
function leaveLabel(record){const type=String(record.type||record.statusType||record.kind||'').toLowerCase();if(type.includes('duty')||type==='od')return'Duty/OD';if(type.includes('special')||type.includes('assignment'))return'Special Assignment';if(type.includes('vacant'))return'Vacant Position';if(type.includes('half'))return'Half Leave';return record.leaveCategory||record.category||'Approved Leave'}
async function refreshApprovedLeave(showFeedback=true){
  if(!state.workspace||!state.user)return;const button=$('refreshApprovedLeave');if(button)button.disabled=true;showNotice('leaveSyncStatus','Reading approved Leave, Duty/OD and Special Assignment records…','info');
  try{const [daily,plans]=await Promise.all([getDocs(collection(db,'approvedDailyStatus')),getDocs(collection(db,'approvedStatusPlans'))]),byCode=new Map(),windowDates=new Set(candidateExamDates(state.workspace.settings||{}));for(const event of state.workspace.timetable?.events||[])windowDates.add(event.date);
    const add=(record,date,source)=>{const code=leaveCode(record),value=normalDate(date);if(!code||!value||!windowDates.has(value)||record.active===false||record.approved===false)return;if(!byCode.has(code))byCode.set(code,[]);if(!byCode.get(code).some(item=>item.date===value&&item.label===leaveLabel(record)))byCode.get(code).push({date:value,label:leaveLabel(record),source})};
    daily.forEach(item=>{const data=item.data()||{},date=normalDate(data.date||item.id);for(const record of data.statuses||[])add(record,date,'Approved daily status')});plans.forEach(item=>{const record=item.data()||{};for(const date of planDates(record))add(record,date,'Approved status plan')});
    for(const teacher of state.workspace.teachers){const rows=(byCode.get(teacher.code)||[]).sort((a,b)=>a.date.localeCompare(b.date));teacher.approvedLeaveDates=[...new Set(rows.map(item=>item.date))];teacher.approvedLeaveRecords=rows}
    const teachers=[...byCode.keys()].filter(code=>state.workspace.teachers.some(item=>item.code===code)),dates=new Set([...byCode.values()].flat().map(item=>item.date));state.leaveSync={checkedAtMs:Date.now(),teacherCount:teachers.length,dateCount:dates.size};showNotice('leaveSyncStatus',teachers.length?`<b>${teachers.length} staff member(s) excluded on ${dates.size} examination date(s)</b> from approved Leave / Duty / Assignment records.`:'<b>No approved unavailability was found inside the current examination window.</b>','success');renderTeachers();if(showFeedback)markDirty('Approved leave refreshed; regenerate duties');return state.leaveSync;
  }catch(e){state.leaveSync={checkedAtMs:Date.now(),error:String(e.message||e)};showNotice('leaveSyncStatus','Approved leave could not be refreshed: '+safe(e.message||e),'error');throw e}finally{if(button)button.disabled=false}
}
$('refreshApprovedLeave').onclick=()=>refreshApprovedLeave(true).catch(()=>{});

function filteredTeachers(){const search=$('teacherSearch').value.trim().toLowerCase();return state.workspace.teachers.filter(item=>!search||(item.name+' '+item.code).toLowerCase().includes(search))}
function renderTeachers(){
  const teachers=filteredTeachers();state.visibleTeachers=teachers.map(item=>item.code);
  $('teacherRows').innerHTML=teachers.length?teachers.map(item=>`<tr data-teacher="${safe(item.code)}"><td><input type="checkbox" data-teacher-field="active" ${item.active!==false?'checked':''}></td><td><b>${safe(item.name)}</b></td><td>${safe(item.code)}</td><td><input type="number" min="1" max="50" data-teacher-field="maxInvigilationDuties" value="${Number(item.maxInvigilationDuties)||4}"></td><td><input type="number" min="1" max="50" data-teacher-field="maxReliefDuties" value="${Number(item.maxReliefDuties)||3}"></td><td><input data-teacher-field="unavailableSlots" value="${safe((item.unavailableSlots||[]).join(', '))}" placeholder="2026-09-03, 2026-09-05|SESSION_1">${item.approvedLeaveRecords?.length?`<small><b>Approved:</b> ${item.approvedLeaveRecords.map(record=>displayDate(record.date)+' '+record.label).join(' · ')}</small>`:''}</td></tr>`).join(''):'<tr><td colspan="6">No teachers match this filter.</td></tr>';
}
$('teacherSearch').addEventListener('input',renderTeachers);
$('teacherRows').addEventListener('change',event=>{const row=event.target.closest('[data-teacher]'),field=event.target.dataset.teacherField;if(!row||!field)return;const teacher=state.workspace.teachers.find(item=>item.code===row.dataset.teacher);if(!teacher)return;if(field==='active')teacher.active=event.target.checked;else if(field==='unavailableSlots')teacher.unavailableSlots=listValues(event.target.value);else teacher[field]=Math.max(1,Number(event.target.value)||1);state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderDuties();markDirty('Staff availability changed; duties need regeneration')});
function setVisibleTeachers(active){for(const code of state.visibleTeachers){const teacher=state.workspace.teachers.find(item=>item.code===code);if(teacher)teacher.active=active}state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderTeachers();renderDuties();markDirty(active?'Visible teachers enabled':'Visible teachers disabled')}
$('enableVisibleTeachers').onclick=()=>setVisibleTeachers(true);$('disableVisibleTeachers').onclick=()=>setVisibleTeachers(false);

function syncDutySettings(){const settings=state.workspace.settings;settings.invigilatorsPerRoom=Math.max(1,Number($('invigilatorsPerRoom').value)||1);settings.maxInvigilationPerDay=Math.max(1,Number($('maxInvigPerDay').value)||1);settings.relieversPerSession=Math.max(0,Number($('relieversPerSession').value)||0);settings.avoidOwnSubject=$('avoidOwnSubject').checked;settings.relieverStartTime=$('relieverStart').value;settings.relieverEndTime=$('relieverEnd').value}
['invigilatorsPerRoom','maxInvigPerDay','relieversPerSession','avoidOwnSubject','relieverStart','relieverEnd'].forEach(id=>$(id).addEventListener('change',()=>{syncDutySettings();state.workspace.duties={invigilation:[],relievers:[],unfilled:[]};renderDuties();markDirty('Duty rules changed; allocation needs regeneration')}));

function teacherUnavailable(teacher,date,slotId){const manual=new Set((teacher.unavailableSlots||[]).map(String)),approved=new Set((teacher.approvedLeaveDates||[]).map(String));return approved.has(date)||manual.has(date)||manual.has(date+'|'+slotId)}
function dutyTeacherOptions(item,role,index){const duties=state.workspace.duties||{},current=item.teacherCode,teachers=(state.workspace.teachers||[]).filter(teacher=>{if(teacher.code===current)return true;if(teacher.active===false||teacherUnavailable(teacher,item.date,item.slotId))return false;if(role==='reliever'&&(duties.invigilation||[]).some(value=>value.teacherCode===teacher.code&&value.date===item.date))return false;const sameCell=[...(duties.invigilation||[]),...(duties.relievers||[])].some((value,i)=>value.teacherCode===teacher.code&&value.date===item.date&&value.slotId===item.slotId&&!(role==='invigilator'&&i===index));return !sameCell}).sort((a,b)=>a.name.localeCompare(b.name));return teachers.map(teacher=>`<option value="${safe(teacher.code)}" ${teacher.code===current?'selected':''}>${safe(teacher.name)} (${safe(teacher.code)})</option>`).join('')}

function renderDuties(){
  const settings=state.workspace.settings,duties=state.workspace.duties||{invigilation:[],relievers:[],unfilled:[]};
  $('invigilatorsPerRoom').value=settings.invigilatorsPerRoom||1;$('maxInvigPerDay').value=settings.maxInvigilationPerDay||1;$('relieversPerSession').value=settings.relieversPerSession??1;$('avoidOwnSubject').checked=settings.avoidOwnSubject===true;$('relieverStart').value=settings.relieverStartTime||'';$('relieverEnd').value=settings.relieverEndTime||'';
  const validation=validateDutyRoster(state.workspace);
  $('invigilationRows').innerHTML=duties.invigilation?.length?duties.invigilation.map((item,index)=>`<tr><td>${displayDate(item.date)}<br><small>${safe(item.day)}</small></td><td>${safe(item.session)}</td><td>${safe(item.roomId)}</td><td><select data-duty-role="invigilator" data-duty-index="${index}">${dutyTeacherOptions(item,'invigilator',index)}</select></td><td>${safe(item.teacherCode)}</td></tr>`).join(''):'<tr><td colspan="5">No allocation generated.</td></tr>';
  $('relieverRows').innerHTML=duties.relievers?.length?duties.relievers.map((item,index)=>`<tr><td>${displayDate(item.date)}<br><small>${safe(item.day)}</small></td><td>${safe(item.session)}</td><td>${safe(item.startTime)}–${safe(item.endTime)}</td><td><select data-duty-role="reliever" data-duty-index="${index}">${dutyTeacherOptions(item,'reliever',index)}</select></td><td>${safe(item.teacherCode)}</td></tr>`).join(''):'<tr><td colspan="5">No allocation generated.</td></tr>';
  $('dutyMetrics').innerHTML=[['Invigilation duties',validation.invigilation],['Reliever duties',validation.relievers],['Unfilled duties',validation.unfilled],['Eligible teachers',state.workspace.teachers.filter(item=>item.active!==false).length]].map(([label,value])=>`<div class="metric"><strong>${value}</strong><span>${label}</span></div>`).join('');
  if(duties.invigilation?.length||duties.relievers?.length||duties.unfilled?.length)showNotice('dutyStatus',validation.valid?'<b>Duty allocation passes all current hard-rule checks.</b> Invigilators and relievers are separated by date.':`<b>${validation.unfilled} duty position(s) remain unfilled.</b><ul class="issueList">${validation.issues.map(item=>'<li>'+safe(item.message)+'</li>').join('')}</ul>`,validation.valid?'success':'error');
  else showNotice('dutyStatus',state.workspace.timetable?.events?.length?'Set availability and duty rules, then generate the allocation.':'Generate the exam timetable before allocating duties.','info');
}
$('generateDuties').onclick=async()=>{if(!state.workspace.timetable?.events?.length){showNotice('dutyStatus','<b>No exam timetable is available.</b> Generate it first.','warn');return}try{$('generateDuties').disabled=true;await refreshApprovedLeave(false);syncDutySettings();state.workspace.duties=generateDutyRoster(state.workspace);renderDuties();renderReview();markDirty('Duty lists generated after approved-leave check')}catch(e){showNotice('dutyStatus','Duty generation stopped because approved leave could not be checked: '+safe(e.message||e),'error')}finally{$('generateDuties').disabled=false}};
$('invigilationRows').addEventListener('change',changeDutyTeacher);$('relieverRows').addEventListener('change',changeDutyTeacher);
function changeDutyTeacher(event){const select=event.target.closest('[data-duty-role]');if(!select)return;const list=select.dataset.dutyRole==='invigilator'?state.workspace.duties.invigilation:state.workspace.duties.relievers,item=list?.[Number(select.dataset.dutyIndex)],teacher=state.workspace.teachers.find(value=>value.code===select.value);if(!item||!teacher)return;item.teacherCode=teacher.code;item.teacherName=teacher.name;renderDuties();renderReview();markDirty('Day-of duty correction made')}

function renderReview(){
  if(!state.workspace)return;const exam=validateExamTimetable(state.workspace),duty=validateDutyRoster(state.workspace),hasDuty=!!(state.workspace.duties?.invigilation?.length||state.workspace.duties?.relievers?.length||state.workspace.duties?.unfilled?.length);
  const cards=[{label:'Exam timetable',value:exam.valid&&exam.scheduled?'Ready':exam.scheduled?'Issues':'Not generated',good:exam.valid&&exam.scheduled},{label:'Papers scheduled',value:exam.scheduled+'/'+exam.total,good:exam.valid&&exam.total>0},{label:'Duty allocation',value:hasDuty?(duty.valid?'Ready':'Issues'):'Not generated',good:hasDuty&&duty.valid},{label:'Unfilled positions',value:duty.unfilled,good:hasDuty&&duty.unfilled===0}];
  $('reviewSummary').innerHTML=cards.map(item=>`<div class="reviewCard ${item.good?'good':'bad'}"><strong>${safe(item.value)}</strong><span>${safe(item.label)}</span></div>`).join('');
}

async function renderDraftList(){
  if(!state.user)return;try{const snap=await getDocs(collection(db,'examSchedules')),items=[];snap.forEach(item=>{const data=item.data()||{};if(state.isAdmin||data.ownerUid===state.user.uid)items.push({id:item.id,...data})});items.sort((a,b)=>Number(b.updatedAtMs||b.createdAtMs||0)-Number(a.updatedAtMs||a.createdAtMs||0));state.cloudItems=items;
    $('draftList').innerHTML=items.length?items.map(item=>{const status=item.status||'draft',canOpen=state.isAdmin||['draft','returned'].includes(status),revision=status==='published'&&item.ownerUid===state.user.uid;return `<div class="draftCard"><h4>${safe(item.name||'Untitled Examination Schedule')}</h4><p><span class="workflowPill ${safe(status)}">${safe(status==='published'?'Published':status==='submitted'?'Submitted':status==='returned'?'Returned':'Draft')}</span>${new Date(item.updatedAtMs||item.createdAtMs||Date.now()).toLocaleString('en-GB')}</p><p>${item.workspace?.timetable?.events?.length||0} papers · ${item.workspace?.duties?.invigilation?.length||0} invigilation duties</p>${item.reviewNote?`<p><b>Principal note:</b> ${safe(item.reviewNote)}</p>`:''}<div class="buttonRow">${canOpen?`<button class="button" data-open-cloud="${safe(item.id)}">Open</button>`:''}${revision?`<button class="button" data-revise-cloud="${safe(item.id)}">Start Revision</button>`:''}</div></div>`}).join(''):'<div class="empty">No cloud examination workspace has been saved yet.</div>';
  }catch(e){$('draftList').innerHTML='<div class="notice error">Cloud workspaces could not be loaded: '+safe(e.message||e)+'</div>'}
}
$('draftList').addEventListener('click',event=>{const open=event.target.closest('[data-open-cloud]'),revise=event.target.closest('[data-revise-cloud]'),id=open?.dataset.openCloud||revise?.dataset.reviseCloud;if(!id)return;const item=state.cloudItems.find(value=>value.id===id);if(!item?.workspace)return;if(state.dirty&&!confirm('Open this cloud workspace and discard the current unsaved changes?'))return;state.workspace=clone(item.workspace);state.cloudId=revise?'':item.id;state.cloudMeta=revise?{status:'draft',ownerUid:state.user.uid,ownerName:state.profile?.name||state.user.displayName||state.user.email,ownerEmail:state.user.email,revisionOf:item.id}:clone(item);state.dirty=!!revise;renderAll();setSaveState(revise?'New revision — save before submission':'Cloud workspace opened',!!revise);document.querySelector('[data-pane-target="setup"]').click()});
$('newDraft').onclick=()=>{if(state.dirty&&!confirm('Start a new draft from the active master and discard current unsaved changes?'))return;state.workspace=createWorkspaceFromMaster(state.master);state.cloudId='';state.cloudMeta={status:'draft',ownerUid:state.user.uid,ownerName:state.profile?.name||state.user.displayName||state.user.email,ownerEmail:state.user.email};state.dirty=true;renderAll();setSaveState('New unsaved cloud draft',true);document.querySelector('[data-pane-target="setup"]').click()};

function csvCell(value){const text=String(value??'');return /[",\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}
function download(name,rows){const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('downloadExamCsv').onclick=()=>download('exam-timetable.csv',[['Date','Day','Session','Start','End','Class','Subject'],...(state.workspace.timetable?.events||[]).map(item=>{const slot=slotById(item.slotId)||{};return [item.date,item.day,slot.name||item.slotId,slot.startTime||'',slot.endTime||'',item.className,item.subject]})]);
$('downloadDutyCsv').onclick=()=>download('exam-duty-lists.csv',[['Role','Date','Day','Session','Time','Room / Class','Teacher','Code'],...(state.workspace.duties?.invigilation||[]).map(item=>['Invigilator',item.date,item.day,item.session,'',item.roomId,item.teacherName,item.teacherCode]),...(state.workspace.duties?.relievers||[]).map(item=>['Reliever',item.date,item.day,item.session,item.startTime+'-'+item.endTime,'',item.teacherName,item.teacherCode])]);
function printPane(name){const pane=document.querySelector(`[data-pane="${name}"]`);document.querySelectorAll('.pane').forEach(item=>item.classList.remove('printing'));pane.classList.add('printing');window.print();setTimeout(()=>pane.classList.remove('printing'),500)}
$('printExam').onclick=()=>printPane('timetable');$('printDuties').onclick=()=>printPane('duties');window.addEventListener('afterprint',()=>document.querySelectorAll('.pane').forEach(item=>item.classList.remove('printing')));
window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue=''}});
