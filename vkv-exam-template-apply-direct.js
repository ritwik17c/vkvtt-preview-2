import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);

function baseClass(v){return String(v||'').trim().replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,grade)=>grade.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim()}
function subjectName(v){let s=String(v||'').trim().replace(/\s+/g,' ');if(/^information technology(?:\s*\(\s*(?:it|bb)\s*\))?$/i.test(s)||/^it\s*\(\s*bb\s*\)$/i.test(s))return'IT';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)$/i.test(s))return'Maths';return s}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}

function ensureFreshStartOption(){
  const box=document.getElementById('examSavedStartChoices');
  if(!box||document.getElementById('goFreshExamSetup'))return false;
  const grid=[...box.children].find(el=>el instanceof HTMLElement&&String(el.style.gridTemplateColumns||'').includes('minmax'))||box.querySelector('div[style*="grid-template-columns"]');
  if(!grid)return false;
  const card=document.createElement('div');
  card.style.cssText='padding:16px;border:1px solid #cfdfe6;border-radius:14px;background:#fbfefd';
  card.innerHTML='<div class="eyebrow">Fresh setup</div><h4 style="margin:6px 0 8px">Start a Fresh Timetable Setup</h4><p style="margin:0 0 12px;color:#486577">Begin from the active master timetable without using any saved timetable or template.</p><button class="button primary" id="goFreshExamSetup">Start Fresh Timetable</button>';
  grid.appendChild(card);
  document.getElementById('goFreshExamSetup').onclick=()=>{
    const fresh=document.getElementById('newDraft');
    if(!fresh){alert('Fresh timetable setup is not ready yet.');return}
    fresh.click();
    setTimeout(()=>document.querySelector('[data-pane-target="setup"]')?.click(),120);
  };
  return true;
}

async function waitForMajorControls(){for(let i=0;i<50;i++){if(document.querySelectorAll('[data-major-class]').length&&document.getElementById('majorSubjectGrid'))return true;await wait(100)}return false}
function classBox(cls){return [...document.querySelectorAll('[data-major-class]')].find(b=>baseClass(b.dataset.majorClass)===baseClass(cls))}
function subjectBoxesFor(cls){return [...document.querySelectorAll('[data-major-subject]')].filter(b=>baseClass(b.dataset.majorSubjectClass)===baseClass(cls))}

async function applyTemplateSelections(template,name){
  const desiredClasses=(template.classes||[]).map(baseClass).filter(Boolean);
  const classSet=new Set(desiredClasses);
  const subjectSets={};
  for(const [cls,subs] of Object.entries(template.subjects||{}))subjectSets[baseClass(cls)]=new Set((subs||[]).map(subjectName));

  const allClasses=[...document.querySelectorAll('[data-major-class]')].map(b=>baseClass(b.dataset.majorClass));
  for(const cls of allClasses){
    const box=classBox(cls);if(!box)continue;
    const wanted=classSet.has(cls);
    if(box.checked!==wanted){box.checked=wanted;box.dispatchEvent(new Event('change',{bubbles:true}));await wait(260)}
  }

  await wait(350);
  for(const cls of desiredClasses){
    const wantedSubjects=subjectSets[cls]||new Set();
    const names=subjectBoxesFor(cls).map(b=>subjectName(b.dataset.majorSubject));
    for(const sub of names){
      const box=subjectBoxesFor(cls).find(b=>subjectName(b.dataset.majorSubject)===sub);if(!box)continue;
      const wanted=wantedSubjects.has(sub);
      if(box.checked!==wanted){box.checked=wanted;box.dispatchEvent(new Event('change',{bubbles:true}));await wait(220)}
    }
  }

  await wait(400);
  document.querySelector('[data-pane-target="majorClasses"]')?.click();
  await wait(150);
  const selectedClasses=[...document.querySelectorAll('[data-major-class]:checked')].map(b=>baseClass(b.dataset.majorClass));
  const extras=selectedClasses.filter(cls=>!classSet.has(cls));
  const missing=desiredClasses.filter(cls=>!selectedClasses.includes(cls));
  if(extras.length||missing.length)throw new Error(`Template verification failed. Extra: ${extras.join(', ')||'none'}; missing: ${missing.join(', ')||'none'}.`);

  let expectedSubjects=0,selectedSubjects=0;
  for(const cls of desiredClasses){expectedSubjects+=(subjectSets[cls]?.size||0);selectedSubjects+=subjectBoxesFor(cls).filter(b=>b.checked).length}
  if(selectedSubjects!==expectedSubjects)throw new Error(`Template subject verification failed: expected ${expectedSubjects}, selected ${selectedSubjects}.`);

  const msg=document.getElementById('majorTemplateMsg');
  if(msg){msg.className='notice success';msg.innerHTML=`<b>${name}</b> imported: ${selectedClasses.length} class(es) and ${selectedSubjects} class-level subject selection(s). You can edit them further.`}
  alert(`Template imported: ${name}\n\n${selectedClasses.length} class(es) and ${selectedSubjects} subject selection(s) are now active.`);
}

async function handle(id){
  const user=auth.currentUser;if(!user)return;
  const snap=await getDoc(doc(db,'examSchedules',id));if(!snap.exists()){alert('Saved template not found.');return}
  const data=snap.data()||{},template=data.template;
  if(!template||!Array.isArray(template.classes)||!template.subjects){alert('This saved item does not contain a usable examination template.');return}
  const name=data.name||'Saved Template';
  if(!confirm(`Create a NEW timetable from “${name}”?\n\nOnly this template's classes and subjects will remain selected. Dates and timetable assignments will start fresh.`))return;
  const newDraft=document.getElementById('newDraft');if(!newDraft){alert('New timetable control is not ready.');return}
  newDraft.click();
  if(!await waitForMajorControls()){alert('The class/subject controls did not become ready.');return}
  try{await applyTemplateSelections(template,name)}catch(e){alert('Could not import the template components: '+(e.message||e))}
}

window.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-real-use-template]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  handle(b.dataset.realUseTemplate);
},true);

let freshTries=0;const freshTimer=setInterval(()=>{if(ensureFreshStartOption()||++freshTries>40)clearInterval(freshTimer)},200);
window.addEventListener('load',()=>setTimeout(ensureFreshStartOption,600));
