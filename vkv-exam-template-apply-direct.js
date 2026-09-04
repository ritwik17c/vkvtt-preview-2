import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);

function baseClass(v){return String(v||'').trim().replace(/\s+/g,' ').replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim()}
function subjectName(v){let s=String(v||'').trim().replace(/\s+/g,' ');if(/^information technology(?:\s*\(\s*(?:it|bb)\s*\))?$/i.test(s)||/^it\s*\(\s*bb\s*\)$/i.test(s))return'IT';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)$/i.test(s))return'Maths';return s}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}

async function waitForPaperControls(){for(let i=0;i<40;i++){const filter=document.getElementById('paperClassFilter'),rows=document.getElementById('paperRows');if(filter&&rows&&filter.options.length>1)return true;await wait(100)}return false}

async function applyTemplate(template,name){
  const classSet=new Set((template.classes||[]).map(baseClass));
  const subjectSets={};
  for(const [cls,subs] of Object.entries(template.subjects||{}))subjectSets[baseClass(cls)]=new Set((subs||[]).map(subjectName));
  const filter=document.getElementById('paperClassFilter'),search=document.getElementById('paperSearch');
  if(!filter||!search)throw new Error('Subject controls are not ready.');
  const originalSearch=search.value,originalFilter=filter.value;
  search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
  const rawClasses=[...filter.options].map(o=>o.value).filter(Boolean);
  let selectedRecords=0;
  for(const rawClass of rawClasses){
    filter.value=rawClass;filter.dispatchEvent(new Event('change',{bubbles:true}));
    await wait(10);
    const base=baseClass(rawClass),wantedSubjects=subjectSets[base]||new Set(),classWanted=classSet.has(base);
    const rows=[...document.querySelectorAll('#paperRows tr[data-paper]')];
    for(const row of rows){
      const box=row.querySelector('[data-paper-field="included"]');if(!box)continue;
      const rowClass=baseClass(row.cells?.[1]?.textContent||rawClass),sub=subjectName(row.cells?.[2]?.textContent||'');
      const wanted=classWanted&&rowClass===base&&wantedSubjects.has(sub);
      if(wanted)selectedRecords++;
      if(box.checked!==wanted){box.checked=wanted;box.dispatchEvent(new Event('change',{bubbles:true}));await wait(8)}
    }
  }
  filter.value=originalFilter;filter.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=originalSearch;search.dispatchEvent(new Event('input',{bubbles:true}));
  const msg=document.getElementById('majorTemplateMsg');
  if(msg){msg.className='notice success';msg.innerHTML=`<b>${name}</b> imported: ${classSet.size} class(es) and ${selectedRecords} underlying subject record(s). You can now edit Classes and Subjects before setting dates.`}
  const select=document.getElementById('majorTemplateSelect');if(select){if(![...select.options].some(o=>o.textContent===name)){const o=document.createElement('option');o.textContent=name;o.value='';select.appendChild(o)}select.selectedIndex=[...select.options].findIndex(o=>o.textContent===name)}
  document.querySelector('[data-pane-target="majorClasses"]')?.click();
  alert(`Template imported: ${name}\n\nOnly the template's classes and subjects are selected now. You can edit them further.`);
}

async function handle(id){
  const user=auth.currentUser;if(!user)return;
  const snap=await getDoc(doc(db,'examSchedules',id));if(!snap.exists()){alert('Saved template not found.');return}
  const data=snap.data()||{},template=data.template;
  if(!template||!Array.isArray(template.classes)||!template.subjects){alert('This saved item does not contain a usable examination template.');return}
  const name=data.name||'Saved Template';
  if(!confirm(`Create a NEW timetable from “${name}”?\n\nThe template's classes and subjects will be imported. Dates and timetable assignments will start fresh.`))return;
  const newDraft=document.getElementById('newDraft');if(!newDraft){alert('New timetable control is not ready.');return}
  const before=String(document.getElementById('workspaceName')?.value||'');
  newDraft.click();await wait(180);
  const after=String(document.getElementById('workspaceName')?.value||'');
  if(before===after&&before&&before!=='New Examination Schedule'){return}
  if(!await waitForPaperControls()){alert('The new timetable controls did not become ready.');return}
  try{await applyTemplate(template,name)}catch(e){alert('Could not import the template components: '+(e.message||e))}
}

window.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-real-use-template]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  handle(b.dataset.realUseTemplate);
},true);
