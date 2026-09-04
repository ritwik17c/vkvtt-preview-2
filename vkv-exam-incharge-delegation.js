import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc,getDocs,collection,setDoc,serverTimestamp,writeBatch} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installed=false,profiles=[],selectionInstalled=false,paperIndex=[];

function examName(){return String(document.getElementById('workspaceName')?.value||'Current Examination').trim()||'Current Examination'}
function panel(){return document.getElementById('examInchargeDelegation')}
function setMessage(text,kind='info'){const el=document.getElementById('examInchargeMessage');if(!el)return;el.className='notice '+kind;el.innerHTML=text}
function moduleAssignments(){return profiles.filter(p=>p.active===true&&p.examDelegationSource==='exam_module'&&p.permissions?.examDepartment===true)}
function linkedTeachingProfiles(){return profiles.filter(p=>p.active===true&&p.staffRecordId&&String(p.staffType||p.staffCategory||'').toLowerCase()==='teaching').sort((a,b)=>String(a.name||a.email||'').localeCompare(String(b.name||b.email||'')))}

function renderOptions(){
  const select=document.getElementById('examInchargeSelect');if(!select)return;
  const current=moduleAssignments()[0]?.id||'';
  const rows=linkedTeachingProfiles();
  select.innerHTML='<option value="">No Exam In-charge assigned</option>'+rows.map(p=>`<option value="${safe(p.id)}" ${p.id===current?'selected':''}>${safe(p.name||p.email)}${p.teacherShortCode?' ('+safe(p.teacherShortCode)+')':''}</option>`).join('');
  const assigned=moduleAssignments();
  if(assigned.length){const p=assigned[0];setMessage(`<b>Current Exam In-charge:</b> ${safe(p.name||p.email)}${p.examInChargeFor?' · '+safe(p.examInChargeFor):''}. This gives Examination Department preparation/submission access only; Principal/Admin retains return, approval and publication authority.`,'success')}
  else setMessage('No Exam In-charge is currently delegated from this module. Select a properly linked teaching-staff account and save the assignment.','info');
}

async function loadProfiles(){const snap=await getDocs(collection(db,'authorizedUsers'));profiles=snap.docs.map(d=>({id:d.id,...d.data()}));renderOptions()}

async function saveAssignment(){
  const select=document.getElementById('examInchargeSelect'),button=document.getElementById('saveExamIncharge');if(!select||!button)return;
  const uid=select.value,selected=profiles.find(p=>p.id===uid)||null;
  if(uid&&(!selected?.staffRecordId||String(selected.staffType||selected.staffCategory||'').toLowerCase()!=='teaching')){setMessage('The selected account is not linked to one teaching-staff record. Complete Account · Staff Link first.','error');return}
  if(uid&&!confirm(`Assign ${selected?.name||selected?.email||'this staff member'} as Exam In-charge for “${examName()}”?`))return;
  if(!uid&&!confirm('Clear the current Exam In-charge delegation?'))return;
  button.disabled=true;
  try{
    const batch=writeBatch(db);
    for(const p of moduleAssignments()){
      if(p.id===uid)continue;
      batch.set(doc(db,'authorizedUsers',p.id),{permissions:{...(p.permissions||{}),examDepartment:false},examInCharge:false,examInChargeFor:'',examDelegationSource:'',examInChargeClearedAt:serverTimestamp()},{merge:true});
    }
    if(selected){
      batch.set(doc(db,'authorizedUsers',selected.id),{permissions:{...(selected.permissions||{}),examDepartment:true},examInCharge:true,examInChargeFor:examName(),examDelegationSource:'exam_module',examInChargeAssignedByUid:auth.currentUser?.uid||'',examInChargeAssignedAt:serverTimestamp()},{merge:true});
    }
    await batch.commit();await loadProfiles();
    setMessage(selected?`<b>${safe(selected.name||selected.email)} is now the Exam In-charge for ${safe(examName())}.</b> The assignment remains active until you change or clear it here. Principal/Admin keeps final approval and publication control.`:'<b>Exam In-charge delegation cleared.</b>','success');
  }catch(e){setMessage('Could not save Exam In-charge assignment: '+safe(e.message||e),'error')}
  finally{button.disabled=false}
}

function installPanel(){
  if(installed||panel())return;const setup=document.querySelector('[data-pane="setup"]');if(!setup)return;
  const summaries=setup.querySelector('.summaryGrid');if(!summaries)return;
  const article=document.createElement('article');article.id='examInchargeDelegation';article.className='surface';article.innerHTML=`<div class="sectionTitle"><div><h3>Exam In-charge</h3><p>Delegate Examination Department preparation to one linked teaching staff member without giving the broader Manager role.</p></div></div><div class="formGrid two"><label>Assigned staff member<select id="examInchargeSelect"><option>Loading linked teaching staff…</option></select></label><div><label>Scope</label><div class="notice info" style="margin:0">Assignment label: <b id="examInchargeScope"></b><br><small>Access remains active until reassigned or cleared here. Principal/Admin alone approves and publishes.</small></div></div></div><div class="buttonRow"><button id="saveExamIncharge" class="button primary">Save Exam In-charge</button><button id="clearExamIncharge" class="button">Clear Assignment</button><a class="button" href="admin-account-staff-link.html">Account · Staff Link</a></div><div id="examInchargeMessage" class="notice info">Loading current assignment…</div>`;
  summaries.insertAdjacentElement('afterend',article);
  const syncScope=()=>{const el=document.getElementById('examInchargeScope');if(el)el.textContent=examName()};syncScope();document.getElementById('workspaceName')?.addEventListener('input',syncScope);
  document.getElementById('saveExamIncharge').onclick=saveAssignment;
  document.getElementById('clearExamIncharge').onclick=()=>{document.getElementById('examInchargeSelect').value='';saveAssignment()};
  installed=true;loadProfiles().catch(e=>setMessage('Could not load staff accounts: '+safe(e.message||e),'error'));
}

function addSelectionStyles(){
  if(document.getElementById('examSelectionStyles'))return;
  const style=document.createElement('style');style.id='examSelectionStyles';style.textContent=`
  .choiceGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:12px 0}.choiceCard{display:flex;align-items:flex-start;gap:9px;margin:0;padding:11px 12px;border:1px solid #cfdee5;border-radius:12px;background:#fbfefd;color:#24485d;font-size:.82rem;font-weight:760;cursor:pointer}.choiceCard:hover{border-color:#72a9c0;background:#f3fafc}.choiceCard input{width:auto;margin:2px 0 0;accent-color:#176f9b}.choiceCard strong{display:block;color:#123d58}.choiceCard small{display:block;color:#718692;margin-top:2px;font-weight:520}.choiceCard.off{background:#f6f7f7;color:#7b8a92}.choiceActions{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.choiceGroup{margin:14px 0 4px;padding-top:9px;border-top:1px solid #e0e9ed}.choiceGroup:first-child{border-top:0;padding-top:0}.choiceGroup h4{margin:0 0 7px;color:#123d58}.dateChoiceCard{min-width:150px}.selectionSummary{margin-top:8px;color:#5d7482;font-size:.78rem}.advancedPaperHeading{margin:18px 0 8px;color:#526d7c;font-size:.82rem;font-weight:800}.classPaneIntro{max-width:820px}.classChoiceCount{font-weight:800;color:#176f9b}`;document.head.appendChild(style);
}

function renumberNavigation(){
  const nav=document.querySelector('.sidebar nav');if(!nav||nav.querySelector('[data-pane-target="classes"]'))return;
  const subjects=nav.querySelector('[data-pane-target="subjects"]');if(!subjects)return;
  const button=document.createElement('button');button.className='navButton';button.dataset.paneTarget='classes';button.innerHTML='<span>2</span> Classes';subjects.before(button);
  const order=['setup','classes','subjects','timetable','staff','duties','outputs'];order.forEach((pane,index)=>{const b=nav.querySelector(`[data-pane-target="${pane}"] span`);if(b)b.textContent=String(index+1)});
}

function allPaperRowsSnapshot(){
  const search=document.getElementById('paperSearch'),filter=document.getElementById('paperClassFilter'),tbody=document.getElementById('paperRows');if(!search||!filter||!tbody)return [];
  const oldSearch=search.value,oldFilter=filter.value;
  if(oldSearch){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}
  if(filter.value){filter.value='';filter.dispatchEvent(new Event('change',{bubbles:true}))}
  const rows=[...tbody.querySelectorAll('tr[data-paper]')].map(row=>({id:row.dataset.paper,className:row.cells[1]?.textContent.trim()||'',subject:row.cells[2]?.textContent.trim()||'',included:!!row.querySelector('[data-paper-field="included"]')?.checked}));
  if(oldSearch!==search.value){search.value=oldSearch;search.dispatchEvent(new Event('input',{bubbles:true}))}
  if(oldFilter!==filter.value){filter.value=oldFilter;filter.dispatchEvent(new Event('change',{bubbles:true}))}
  return rows;
}

function refreshPaperIndex(){const rows=allPaperRowsSnapshot();if(rows.length)paperIndex=rows;renderClassChoices();renderSubjectChoices()}
function setClassIncluded(className,included){
  const filter=document.getElementById('paperClassFilter'),search=document.getElementById('paperSearch');if(!filter||!search)return;
  const oldSearch=search.value,oldFilter=filter.value;search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));filter.value=className;filter.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById(included?'includeVisible':'excludeVisible')?.click();
  search.value=oldSearch;search.dispatchEvent(new Event('input',{bubbles:true}));filter.value=oldFilter;filter.dispatchEvent(new Event('change',{bubbles:true}));
  setTimeout(refreshPaperIndex,30);
}
function setPaperIncluded(id,included,className){
  const filter=document.getElementById('paperClassFilter'),search=document.getElementById('paperSearch'),tbody=document.getElementById('paperRows');if(!filter||!search||!tbody)return;
  const oldSearch=search.value,oldFilter=filter.value;search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));filter.value=className;filter.dispatchEvent(new Event('change',{bubbles:true}));
  const row=[...tbody.querySelectorAll('tr[data-paper]')].find(r=>r.dataset.paper===id),box=row?.querySelector('[data-paper-field="included"]');if(box&&box.checked!==included){box.checked=included;box.dispatchEvent(new Event('change',{bubbles:true}))}
  search.value=oldSearch;search.dispatchEvent(new Event('input',{bubbles:true}));filter.value=oldFilter;filter.dispatchEvent(new Event('change',{bubbles:true}));
  setTimeout(refreshPaperIndex,30);
}

function renderClassChoices(){
  const grid=document.getElementById('classChoiceGrid'),summary=document.getElementById('classChoiceSummary');if(!grid||!paperIndex.length)return;
  const classes=[...new Set(paperIndex.map(p=>p.className))].filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  grid.innerHTML=classes.map(cls=>{const rows=paperIndex.filter(p=>p.className===cls),selected=rows.some(p=>p.included),count=rows.filter(p=>p.included).length;return `<label class="choiceCard ${selected?'':'off'}"><input type="checkbox" data-exam-class="${safe(cls)}" ${selected?'checked':''}><span><strong>${safe(cls)}</strong><small>${count} of ${rows.length} subject${rows.length===1?'':'s'} selected</small></span></label>`}).join('');
  if(summary){const selected=classes.filter(cls=>paperIndex.some(p=>p.className===cls&&p.included)).length;summary.innerHTML=`<span class="classChoiceCount">${selected}</span> of ${classes.length} classes included in this examination.`}
}
function renderSubjectChoices(){
  const host=document.getElementById('subjectChoiceGrid');if(!host||!paperIndex.length)return;
  const classes=[...new Set(paperIndex.map(p=>p.className))].filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  host.innerHTML=classes.map(cls=>{const rows=paperIndex.filter(p=>p.className===cls);return `<div class="choiceGroup"><h4>${safe(cls)}</h4><div class="choiceGrid">${rows.map(p=>`<label class="choiceCard ${p.included?'':'off'}"><input type="checkbox" data-exam-paper="${safe(p.id)}" data-exam-paper-class="${safe(cls)}" ${p.included?'checked':''}><span><strong>${safe(p.subject)}</strong><small>${p.included?'Included':'Not included'}</small></span></label>`).join('')}</div></div>`}).join('');
}

function rawRangeDates(){
  const start=document.getElementById('startDate')?.value,end=document.getElementById('endDate')?.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||''))return[];
  const a=new Date(start+'T12:00:00'),b=new Date(end+'T12:00:00');if(a>b)return[];const excludedWeekdays=new Set([...document.querySelectorAll('[data-weekday]:checked')].map(x=>Number(x.dataset.weekday))),excludedDates=new Set(String(document.getElementById('excludedDates')?.value||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean)),out=[];
  for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1)){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(!excludedWeekdays.has(d.getDay())&&!excludedDates.has(k))out.push(k)}return out;
}
function prettyDate(k){const m=String(k).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return k;const d=new Date(k+'T12:00:00'),day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];return `${m[3]}/${m[2]}/${m[1]} · ${day}`}
function selectedDateSet(available){
  const cadence=document.getElementById('cadence')?.value||'continuous',excluded=new Set(String(document.getElementById('excludedDates')?.value||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean));
  if(cadence==='custom')return new Set(String(document.getElementById('customDates')?.value||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean));
  if(cadence==='alternate'){const out=new Set(),dates=available.filter(x=>!excluded.has(x));let last=null;for(const k of dates){const d=new Date(k+'T12:00:00');if(!last||Math.round((d-last)/86400000)>=2){out.add(k);last=d}}return out}
  return new Set(available.filter(x=>!excluded.has(x)));
}
function renderDateChoices(){
  const host=document.getElementById('examDateChoiceGrid'),summary=document.getElementById('examDateChoiceSummary');if(!host)return;const available=rawRangeDates(),selected=selectedDateSet(available);
  host.innerHTML=available.length?available.map(k=>`<label class="choiceCard dateChoiceCard ${selected.has(k)?'':'off'}"><input type="checkbox" data-exam-date="${safe(k)}" ${selected.has(k)?'checked':''}><span><strong>${safe(prettyDate(k))}</strong><small>${selected.has(k)?'Examination date':'Available — not selected'}</small></span></label>`).join(''):'<div class="notice warn">Choose a valid start and end date. Available school days will appear here.</div>';
  if(summary)summary.textContent=available.length?`${selected.size} of ${available.length} available date(s) selected.`:'No available dates in the current range.';
}
function applyDateCheckboxes(){
  const checked=[...document.querySelectorAll('[data-exam-date]:checked')].map(x=>x.dataset.examDate),cadence=document.getElementById('cadence'),custom=document.getElementById('customDates');if(!cadence||!custom)return;
  cadence.value='custom';custom.value=checked.join(', ');custom.dispatchEvent(new Event('change',{bubbles:true}));renderDateChoices();
}

function installSelectionUi(){
  if(selectionInstalled)return true;const examApp=document.getElementById('examApp'),subjectsPane=document.querySelector('[data-pane="subjects"]'),setupPane=document.querySelector('[data-pane="setup"]');if(!examApp||examApp.hidden||!subjectsPane||!setupPane||!document.getElementById('paperRows'))return false;
  addSelectionStyles();renumberNavigation();
  const classPane=document.createElement('section');classPane.className='pane';classPane.dataset.pane='classes';classPane.innerHTML=`<div class="paneHead"><div><div class="eyebrow">Examination scope</div><h2>Classes for Examination</h2><p class="classPaneIntro">Select the classes participating in this examination. Clearing a class automatically excludes all its subjects from the examination timetable.</p></div></div><article class="surface"><div class="sectionTitle"><div><h3>Select Classes</h3><p>Classes are imported from the activated master timetable.</p></div></div><div class="choiceActions"><button id="selectAllExamClasses" class="button">Select All Classes</button><button id="clearAllExamClasses" class="button">Clear All Classes</button></div><div id="classChoiceGrid" class="choiceGrid"></div><div id="classChoiceSummary" class="selectionSummary"></div></article>`;subjectsPane.before(classPane);
  const subjectSurface=subjectsPane.querySelector('.surface');if(subjectSurface){const selector=document.createElement('div');selector.id='subjectSelectorBlock';selector.innerHTML=`<div class="sectionTitle"><div><h3>Select Subjects</h3><p>Tick only the subjects for which an examination will be conducted.</p></div></div><div id="subjectChoiceGrid"></div><div class="advancedPaperHeading">Advanced paper settings — room, fixed date and session</div>`;subjectSurface.prepend(selector)}
  const datePreview=document.getElementById('datePreview');if(datePreview){const block=document.createElement('div');block.id='examDateSelectorBlock';block.innerHTML=`<div class="sectionTitle" style="margin-top:16px"><div><h3>Choose Examination Dates</h3><p>After setting the date range, tick the actual dates on which examinations will be conducted.</p></div></div><div id="examDateChoiceGrid" class="choiceGrid"></div><div id="examDateChoiceSummary" class="selectionSummary"></div>`;datePreview.insertAdjacentElement('afterend',block)}
  document.getElementById('classChoiceGrid')?.addEventListener('change',e=>{const box=e.target.closest('[data-exam-class]');if(box)setClassIncluded(box.dataset.examClass,box.checked)});
  document.getElementById('subjectChoiceGrid')?.addEventListener('change',e=>{const box=e.target.closest('[data-exam-paper]');if(box)setPaperIncluded(box.dataset.examPaper,box.checked,box.dataset.examPaperClass)});
  document.getElementById('examDateChoiceGrid')?.addEventListener('change',e=>{if(e.target.matches('[data-exam-date]'))applyDateCheckboxes()});
  document.getElementById('selectAllExamClasses').onclick=()=>{for(const cls of [...new Set(paperIndex.map(p=>p.className))])setClassIncluded(cls,true)};
  document.getElementById('clearAllExamClasses').onclick=()=>{for(const cls of [...new Set(paperIndex.map(p=>p.className))])setClassIncluded(cls,false)};
  ['startDate','endDate','cadence','excludedDates','customDates'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>setTimeout(renderDateChoices,20)));document.getElementById('weekdayChecks')?.addEventListener('change',()=>setTimeout(renderDateChoices,20));
  const tbody=document.getElementById('paperRows');let scanTimer=null;new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(()=>{if(!document.getElementById('paperSearch')?.value&&!document.getElementById('paperClassFilter')?.value)refreshPaperIndex()},80)}).observe(tbody,{childList:true});
  paperIndex=allPaperRowsSnapshot();renderClassChoices();renderSubjectChoices();renderDateChoices();selectionInstalled=true;return true;
}

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{const snap=await getDoc(doc(db,'authorizedUsers',user.uid));const profile=snap.exists()?snap.data():null;if(!profile||profile.active!==true)return;
    let attempts=0;const selectionTimer=setInterval(()=>{const ready=installSelectionUi();if(ready||++attempts>50)clearInterval(selectionTimer)},250);
    if(profile.role==='admin'){let adminAttempts=0;const timer=setInterval(()=>{installPanel();if(installed||++adminAttempts>40)clearInterval(timer)},250)}
  }catch(_){/* Main examination module handles its own access errors. */}
});
