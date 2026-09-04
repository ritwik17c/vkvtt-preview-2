import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);

function baseClass(v){return String(v||'').trim().replace(/\s+/g,' ').replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim()}
function subjectName(v){let s=String(v||'').trim().replace(/\s+/g,' ');if(/^information technology(?:\s*\(\s*(?:it|bb)\s*\))?$/i.test(s)||/^it\s*\(\s*bb\s*\)$/i.test(s))return'IT';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)$/i.test(s))return'Maths';return s}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}

async function waitForMajorControls(){for(let i=0;i<50;i++){if(document.getElementById('majorNoClasses')&&document.querySelectorAll('[data-major-class]').length&&document.getElementById('majorSubjectGrid'))return true;await wait(100)}return false}
function classBox(cls){return [...document.querySelectorAll('[data-major-class]')].find(b=>baseClass(b.dataset.majorClass)===baseClass(cls))}
function subjectBoxesFor(cls){return [...document.querySelectorAll('[data-major-subject]')].filter(b=>baseClass(b.dataset.majorSubjectClass)===baseClass(cls))}

async function applyViaClassSubjectControls(template,name){
  const desiredClasses=[...(template.classes||[])].map(baseClass).filter(Boolean);
  const classSet=new Set(desiredClasses);
  const desiredSubjects={};
  for(const [cls,subs] of Object.entries(template.subjects||{}))desiredSubjects[baseClass(cls)]=new Set((subs||[]).map(subjectName));

  const clear=document.getElementById('majorNoClasses');
  if(!clear)throw new Error('Class controls are not ready.');
  clear.click();
  await wait(350);

  for(const cls of desiredClasses){
    const box=classBox(cls);
    if(!box)continue;
    if(!box.checked){box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));}
    await wait(220);
  }

  await wait(300);
  for(const cls of desiredClasses){
    const wanted=desiredSubjects[baseClass(cls)]||new Set();
    const boxes=subjectBoxesFor(cls);
    for(const box of boxes){
      const shouldBeOn=wanted.has(subjectName(box.dataset.majorSubject));
      if(box.checked!==shouldBeOn){box.checked=shouldBeOn;box.dispatchEvent(new Event('change',{bubbles:true}));await wait(180);}
    }
  }

  await wait(350);
  document.querySelector('[data-pane-target="majorClasses"]')?.click();
  await wait(120);
  const selectedClasses=[...document.querySelectorAll('[data-major-class]:checked')].map(b=>baseClass(b.dataset.majorClass));
  const selectedSubjects=[...document.querySelectorAll('[data-major-subject]:checked')].length;
  const missing=desiredClasses.filter(cls=>!selectedClasses.includes(cls));
  if(missing.length)throw new Error('These template classes could not be applied: '+missing.join(', '));
  if(selectedClasses.some(cls=>!classSet.has(cls)))throw new Error('Extra classes remained selected after template import.');

  const msg=document.getElementById('majorTemplateMsg');
  if(msg){msg.className='notice success';msg.innerHTML=`<b>${name}</b> imported correctly: ${selectedClasses.length} class(es) selected. Subjects have been reduced to the template selection. You can edit them further.`}
  alert(`Template imported: ${name}\n\n${selectedClasses.length} class(es) selected. The saved template's subject choices have also been applied.`);
}

async function handle(id){
  const user=auth.currentUser;if(!user)return;
  const snap=await getDoc(doc(db,'examSchedules',id));if(!snap.exists()){alert('Saved template not found.');return}
  const data=snap.data()||{},template=data.template;
  if(!template||!Array.isArray(template.classes)||!template.subjects){alert('This saved item does not contain a usable examination template.');return}
  const name=data.name||'Saved Template';
  if(!confirm(`Create a NEW timetable from “${name}”?\n\nOnly the template's classes and subjects will be selected. Dates and timetable assignments will start fresh.`))return;
  const newDraft=document.getElementById('newDraft');if(!newDraft){alert('New timetable control is not ready.');return}
  newDraft.click();
  if(!await waitForMajorControls()){alert('The class/subject controls did not become ready.');return}
  try{await applyViaClassSubjectControls(template,name)}catch(e){alert('Could not import the template components: '+(e.message||e))}
}

window.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-real-use-template]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  handle(b.dataset.realUseTemplate);
},true);
