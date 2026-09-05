import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc,setDoc,serverTimestamp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
const CONFIG_ID='EXAM_SUBJECT_MASTER';
let master={classes:{}},signedInUser=null,saving=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
const displaySubject=v=>String(v||'').trim().replace(/\s+/g,' ');
const norm=v=>{let s=displaySubject(v).toLowerCase();if(/^information technology(?:\s*[-–(]?\s*(?:it|bb)\s*\)?)?$/.test(s)||/^it(?:\s*[-–(]?\s*(?:it|bb)\s*\)?)?$/.test(s))return'it';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)?$/.test(s))return'maths';return s.replace(/[^a-z0-9]+/g,'')};
const sortClasses=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const sortSubjects=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
function subjectsForClass(c){const wanted=base(c).toLowerCase(),key=Object.keys(master.classes||{}).find(k=>base(k).toLowerCase()===wanted);return key?[...(master.classes[key]||[])]:[]}

function seedFromVisible(){
  const classes={};
  for(const box of document.querySelectorAll('#majorSubjectGrid [data-major-subject]')){
    const c=base(box.dataset.majorSubjectClass),s=displaySubject(box.dataset.majorSubject);if(!c||!s)continue;(classes[c]||(classes[c]=[])).push(s)
  }
  if(!Object.keys(classes).length){
    for(const tr of document.querySelectorAll('#paperRows tr[data-paper]')){
      const c=base(tr.cells?.[1]?.textContent||''),s=displaySubject(tr.cells?.[2]?.textContent||'');if(!c||!s)continue;(classes[c]||(classes[c]=[])).push(s)
    }
  }
  for(const c of Object.keys(classes))classes[c]=[...new Map(classes[c].map(s=>[norm(s),s])).values()].sort(sortSubjects);
  return{classes}
}

async function loadMaster(){
  try{
    const snap=await getDoc(doc(db,'examSchedules',CONFIG_ID));
    if(snap.exists()&&snap.data()?.subjectMaster?.classes){master=JSON.parse(JSON.stringify(snap.data().subjectMaster));setStatus('Cloud subject master loaded. This is the one-time source used when examination classes are selected.');renderMaster();return}
  }catch(e){setStatus('Cloud subject master could not be read. A temporary master has been prepared from the active timetable. '+(e.message||e),'warn')}
  master=seedFromVisible();renderMaster();setStatus('No saved examination subject master was found. Review this imported starting list, edit it once, then click Save Subject Master.','warn')
}

async function saveMaster(){
  const user=signedInUser||auth.currentUser;
  if(!user){setStatus('Your sign-in session is not available. Please reopen the Examination Module and sign in again.','warn');return}
  if(saving)return;saving=true;
  const btn=$('saveExamSubjectMaster');if(btn)btn.disabled=true;
  setStatus('Saving the examination-only Subject Master to the cloud…');
  try{
    const clean={};for(const c of Object.keys(master.classes||{}).sort(sortClasses)){const list=[...new Map((master.classes[c]||[]).map(s=>[norm(s),displaySubject(s)])).values()].filter(Boolean).sort(sortSubjects);if(list.length)clean[c]=list}
    master={classes:clean};
    const target=doc(db,'examSchedules',CONFIG_ID),savedAtMs=Date.now();
    await setDoc(target,{schemaVersion:2,configOnly:true,name:'Examination Subject Master',status:'draft',ownerUid:user.uid,ownerEmail:user.email||'',subjectMaster:master,updatedByUid:user.uid,updatedByEmail:user.email||'',updatedAt:serverTimestamp(),updatedAtMs:savedAtMs});
    const verify=await getDoc(target),saved=verify.exists()?verify.data():null;
    if(!saved||saved.updatedAtMs!==savedAtMs||JSON.stringify(saved.subjectMaster)!==JSON.stringify(master))throw new Error('Cloud verification failed. The saved record did not match the subjects on this screen.');
    master=JSON.parse(JSON.stringify(saved.subjectMaster));renderMaster();setStatus('Subject Master saved and verified in the cloud. Future class selections will import these examination subjects.');
  }catch(e){setStatus('Could not save Subject Master: '+(e.message||e),'warn')}
  finally{saving=false;if(btn)btn.disabled=false}
}

function setStatus(text,type='info'){const el=$('examSubjectMasterStatus');if(!el)return;el.className='notice '+(type==='warn'?'warn':'info');el.textContent=text}

function renderMaster(){
  const host=$('examSubjectMasterGrid');if(!host)return;
  const classes=Object.keys(master.classes||{}).sort(sortClasses);
  host.innerHTML=classes.map(c=>`<section class="majorGroup" data-subject-master-class="${esc(c)}"><div class="sectionTitle"><div><h3 style="margin:0">Class ${esc(c)}</h3><p style="margin:4px 0 0">${(master.classes[c]||[]).length} examination subject(s)</p></div><button class="button" data-master-add="${esc(c)}">+ Add Subject</button></div><div class="majorGrid">${(master.classes[c]||[]).map((s,i)=>`<div class="majorCard" style="cursor:default;justify-content:space-between;align-items:center"><b>${esc(s)}</b><span style="display:flex;gap:6px"><button class="button" data-master-edit="${esc(c)}" data-master-index="${i}" style="padding:6px 9px">Edit</button><button class="button" data-master-delete="${esc(c)}" data-master-index="${i}" style="padding:6px 9px">Delete</button></span></div>`).join('')}</div></section>`).join('')||'<div class="notice warn">No examination subjects are configured yet.</div>'
}

function addSubject(c){const entered=prompt(`Add examination subject for Class ${c}:`,'');if(entered===null)return;const s=displaySubject(entered);if(!s)return;const list=master.classes[c]||(master.classes[c]=[]);if(list.some(x=>norm(x)===norm(s))){alert('That subject is already in this class.');return}list.push(s);list.sort(sortSubjects);renderMaster();setStatus('Unsaved change. Click Save Subject Master when the class-wise list is correct.','warn')}
function editSubject(c,i){const old=master.classes?.[c]?.[i];if(old==null)return;const entered=prompt(`Edit examination subject for Class ${c}:`,old);if(entered===null)return;const s=displaySubject(entered);if(!s)return;const list=master.classes[c];if(list.some((x,j)=>j!==i&&norm(x)===norm(s))){alert('That subject is already in this class.');return}list[i]=s;list.sort(sortSubjects);renderMaster();setStatus('Unsaved change. Click Save Subject Master when the class-wise list is correct.','warn')}
function deleteSubject(c,i){const old=master.classes?.[c]?.[i];if(old==null)return;if(!confirm(`Delete “${old}” from the examination subject master for Class ${c}?\n\nThis changes the master only. It will not delete other subjects or classes.`))return;master.classes[c].splice(i,1);renderMaster();setStatus('Unsaved change. Only the selected master subject was removed. Click Save Subject Master to keep the change.','warn')}

function ensurePane(){
  const nav=document.querySelector('.sidebar nav'),workspace=document.querySelector('.workspace');if(!nav||!workspace)return false;
  let classNav=nav.querySelector('[data-pane-target="majorClasses"]');if(!classNav)return false;
  let b=nav.querySelector('[data-pane-target="examSubjectMaster"]');
  if(!b){b=document.createElement('button');b.className='navButton';b.dataset.paneTarget='examSubjectMaster';b.innerHTML='<span>2</span> Subject Setup';classNav.before(b)}
  let pane=workspace.querySelector('[data-pane="examSubjectMaster"]');
  if(!pane){pane=document.createElement('section');pane.className='pane';pane.dataset.pane='examSubjectMaster';pane.innerHTML=`<div class="paneHead"><div><div class="eyebrow">One-time examination master</div><h2>Subject Setup</h2><p>Add, edit or delete the examination subjects for each class here. This examination-only master is independent of the school timetable and never changes the activated Master Timetable.</p></div><button id="saveExamSubjectMaster" class="button primary large">Save Subject Master</button></div><div id="examSubjectMasterStatus" class="notice info">Loading examination subject master…</div><article class="surface"><div class="sectionTitle"><div><h3>Class-wise Examination Subjects</h3><p>Do this setup once. When a class is selected for an examination, its subjects will be imported from this master.</p></div><button id="resetExamSubjectMaster" class="button">Reload from Active Timetable</button></div><div class="notice info"><b>Important:</b> deleting a subject here removes only that one master subject. It does not trigger deletion of any other subject.</div><div id="examSubjectMasterGrid"></div></article>`;const classPane=workspace.querySelector('[data-pane="majorClasses"]');classPane.before(pane)}
  const oldSubjects=nav.querySelector('[data-pane-target="subjects"]');if(oldSubjects){const span=oldSubjects.querySelector('span');oldSubjects.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)n.nodeValue=' Imported Subjects'});if(span)span.textContent=span.textContent}
  [...nav.querySelectorAll('.navButton')].forEach((x,i)=>{const n=x.querySelector('span');if(n)n.textContent=String(i+1)});
  if(!$('examSubjectMasterHideOldAdd')){const st=document.createElement('style');st.id='examSubjectMasterHideOldAdd';st.textContent='[data-exam-subject-add-box]{display:none!important}';document.head.appendChild(st)}
  return true
}

async function syncClassFromMaster(c){
  const subjects=subjectsForClass(c);if(!subjects.length){setStatus(`No saved examination subjects were found for Class ${c}.`,'warn');return false}
  for(let step=0;step<60&&!window.vkvExamWorkspace?.applySubjectMaster;step++)await wait(100);
  const apply=window.vkvExamWorkspace?.applySubjectMaster;
  if(!apply){setStatus(`Class ${c} could not be imported because the examination workspace is not ready. Please reload this page and try again.`,'warn');return false}
  const applied=apply(c,subjects);
  if(!applied){setStatus(`The saved examination subjects for Class ${c} could not be imported.`,'warn');return false}
  await wait(180);
  const shown=[...document.querySelectorAll('[data-major-subject]')].filter(x=>base(x.dataset.majorSubjectClass).toLowerCase()===base(c).toLowerCase()).map(x=>displaySubject(x.dataset.majorSubject));
  const expected=subjects.map(norm).sort(),actual=shown.map(norm).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected)){setStatus(`Import verification failed for Class ${c}. The old timetable subjects are still visible; please reload and try once more.`,'warn');return false}
  setStatus(`Saved examination subjects imported and verified for Class ${c}.`);return true
}

async function applyToSelected(silent=false){
  const selected=[...document.querySelectorAll('[data-major-class]:checked')].map(x=>base(x.dataset.majorClass)).filter(Boolean);if(!selected.length){if(!silent)alert('Select the examination class or classes first.');return false}
  const btn=$('applyExamSubjectMaster');if(btn)btn.disabled=true;
  try{let applied=0;for(const c of selected)if(await syncClassFromMaster(c))applied++;if(applied===selected.length)setStatus(`Master subjects applied to ${applied} selected class(es).`);return applied===selected.length}finally{if(btn)btn.disabled=false}
}

function bind(){
  const saveBtn=$('saveExamSubjectMaster');
  if(saveBtn){saveBtn.type='button';saveBtn.onclick=e=>{e.preventDefault();saveMaster()}}
  $('resetExamSubjectMaster')?.addEventListener('click',()=>{if(!confirm('Replace the unsaved master on this screen with subjects currently available in the active timetable?'))return;master=seedFromVisible();renderMaster();setStatus('Active timetable subjects loaded as a starting point. Review them and click Save Subject Master.','warn')});
  $('examSubjectMasterGrid')?.addEventListener('click',e=>{const a=e.target.closest('[data-master-add]'),ed=e.target.closest('[data-master-edit]'),del=e.target.closest('[data-master-delete]');if(a)return addSubject(base(a.dataset.masterAdd));if(ed)return editSubject(base(ed.dataset.masterEdit),Number(ed.dataset.masterIndex));if(del)return deleteSubject(base(del.dataset.masterDelete),Number(del.dataset.masterIndex))});
  const classPane=document.querySelector('[data-pane="majorClasses"] article.surface');if(classPane&&!$('applyExamSubjectMaster')){const bar=document.createElement('div');bar.className='notice info';bar.style.marginBottom='12px';bar.innerHTML='<b>Subjects come from Subject Setup.</b> Select a class and its saved examination subjects will be imported automatically. <button id="applyExamSubjectMaster" class="button" style="margin-left:8px">Apply Master to Selected Classes</button>';classPane.prepend(bar);$('applyExamSubjectMaster')?.addEventListener('click',applyToSelected)}
  document.addEventListener('change',e=>{const box=e.target.closest?.('[data-major-class]');if(box?.checked){const c=base(box.dataset.majorClass);setTimeout(()=>syncClassFromMaster(c),350)}},true)
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-open-cloud],[data-revise-cloud],#newDraft,#goFreshExamSetup'))setTimeout(()=>applyToSelected(true),700);
    if(e.target.closest?.('[data-pane-target="majorClasses"],[data-pane-target="subjects"]'))setTimeout(()=>applyToSelected(true),220)
  },true)
}

async function boot(){
  for(let i=0;i<40;i++){if(ensurePane())break;await wait(150)}
  bind();
  for(let i=0;i<40&&!document.querySelector('#majorSubjectGrid [data-major-subject]');i++)await wait(150);
  await loadMaster();
  await wait(250);
  await applyToSelected(true);
}
onAuthStateChanged(auth,user=>{signedInUser=user||null;if(user)boot()});
window.vkvExamSubjectMaster={get:()=>JSON.parse(JSON.stringify(master)),getSubjects:subjectsForClass,applyToSelected};
