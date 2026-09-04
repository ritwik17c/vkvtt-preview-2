import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc,setDoc,serverTimestamp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const baseClass=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
const subjectName=v=>{let s=String(v||'').trim().replace(/\s+/g,' ');if(/^information technology(?:\s*\(\s*(?:it|bb)\s*\))?$/i.test(s)||/^it\s*\(\s*bb\s*\)$/i.test(s))return'IT';if(/^maths?(?:\s*[-–(]?\s*bb\s*\)?)$/i.test(s))return'Maths';return s};

function templateFromWorkspace(workspace){
  const selected=(workspace?.papers||[]).filter(p=>p.included!==false);
  const classes=[...new Set(selected.map(p=>baseClass(p.className)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const subjects={};
  for(const cls of classes)subjects[cls]=[...new Set(selected.filter(p=>baseClass(p.className)===cls).map(p=>subjectName(p.subject)).filter(Boolean))].sort();
  return{classes,subjects};
}

async function saveAsTemplate(scheduleId,button){
  const user=auth.currentUser;if(!user)return;
  button.disabled=true;
  try{
    const snap=await getDoc(doc(db,'examSchedules',scheduleId));
    if(!snap.exists())throw new Error('Saved timetable was not found.');
    const data=snap.data()||{},workspace=data.workspace;
    if(!workspace)throw new Error('This saved item does not contain a timetable workspace.');
    const template=templateFromWorkspace(workspace);
    if(!template.classes.length)throw new Error('No selected classes/subjects were found in this timetable.');
    const sourceName=String(data.name||workspace.name||'Examination').trim();
    const templateName=prompt('Name for the reusable template:',sourceName+' Template');
    if(templateName===null)return;
    const name=templateName.trim();if(!name)throw new Error('Please enter a template name.');
    if(!confirm(`Save “${name}” as a reusable template?\n\nOnly selected classes and subjects will be copied. The saved timetable and its dates will remain unchanged.`))return;
    const id='TEMPLATE_'+name.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,48),now=Date.now();
    await setDoc(doc(db,'examSchedules',id),{schemaVersion:1,templateOnly:true,name,template,status:'draft',ownerUid:user.uid,ownerEmail:user.email||'',sourceScheduleId:scheduleId,sourceScheduleName:sourceName,createdAtMs:now,updatedAtMs:now,updatedAt:serverTimestamp(),workspace:{name,classes:template.classes,papers:[],teachers:[],settings:{},slots:[],timetable:{events:[],unplaced:[]},duties:{invigilation:[],relievers:[],unfilled:[]}}},{merge:true});
    alert(`Template saved: ${name}\n\nYour saved timetable was not changed.`);
  }catch(e){alert('Could not save template: '+(e.message||e))}finally{button.disabled=false}
}

function enhanceCards(){
  const list=document.getElementById('draftList');if(!list)return false;
  let found=false;
  for(const card of list.querySelectorAll('.draftCard')){
    const open=card.querySelector('[data-open-cloud]');if(!open)continue;
    found=true;
    if(card.querySelector('[data-save-template-cloud]'))continue;
    const row=open.closest('.buttonRow')||open.parentElement;
    const b=document.createElement('button');
    b.className='button';
    b.dataset.saveTemplateCloud=open.dataset.openCloud;
    b.textContent='Save as Template';
    b.title='Create a reusable class-and-subject template from this saved timetable without changing it.';
    row?.appendChild(b);
  }
  return found;
}

document.addEventListener('click',e=>{
  const save=e.target.closest('[data-save-template-cloud]');
  if(save){e.preventDefault();e.stopImmediatePropagation();saveAsTemplate(save.dataset.saveTemplateCloud,save);return}
  if(e.target.closest('[data-pane-target="outputs"],[data-open-cloud],[data-revise-cloud]'))setTimeout(enhanceCards,120);
},true);

onAuthStateChanged(auth,user=>{if(!user)return;let n=0;const t=setInterval(()=>{if(enhanceCards()||++n>40)clearInterval(t)},250)});
