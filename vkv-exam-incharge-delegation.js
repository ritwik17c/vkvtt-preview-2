import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc,getDocs,collection,setDoc,serverTimestamp,writeBatch} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installed=false,profiles=[];

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

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{const snap=await getDoc(doc(db,'authorizedUsers',user.uid));const profile=snap.exists()?snap.data():null;if(!profile||profile.active!==true||profile.role!=='admin')return;
    let attempts=0;const timer=setInterval(()=>{installPanel();if(installed||++attempts>40)clearInterval(timer)},250);
  }catch(_){/* Admin-only convenience panel; main examination module handles its own access errors. */}
});
