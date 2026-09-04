import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,setDoc,serverTimestamp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let openedSaved=false;

function collectTemplate(){
  const classes=[...document.querySelectorAll('[data-major-class]:checked')].map(x=>String(x.dataset.majorClass||'').trim()).filter(Boolean);
  const subjects={};
  for(const c of classes)subjects[c]=[];
  for(const x of document.querySelectorAll('[data-major-subject]:checked')){
    const c=String(x.dataset.majorSubjectClass||'').trim(),s=String(x.dataset.majorSubject||'').trim();
    if(c&&s&&classes.includes(c)&&!subjects[c].includes(s))subjects[c].push(s);
  }
  return{classes:[...new Set(classes)],subjects};
}

function ensureAction(){
  if(!openedSaved)return false;
  const box=$('majorTemplateBox');if(!box)return false;
  let card=$('saveOpenedDirectTemplateCard');
  if(!card){
    card=document.createElement('div');card.id='saveOpenedDirectTemplateCard';card.style.cssText='margin:0 0 14px;padding:14px;border:2px solid #88bfd2;border-radius:12px;background:#f5fbfd';
    card.innerHTML=`<div class="eyebrow">Saved timetable opened</div><h4 style="margin:6px 0 8px">Save This Saved Timetable as a Template</h4><p style="margin:0 0 12px;color:#486577">This creates a separate reusable template from the current class and subject selection. The saved timetable and its dates are not changed.</p><button id="saveOpenedDirectTemplateButton" class="button primary">Save as Reusable Template</button><div id="saveOpenedDirectTemplateMsg" class="notice info" style="margin-top:10px">Ready to create a separate template copy.</div>`;
    box.prepend(card);
    $('saveOpenedDirectTemplateButton').addEventListener('click',saveDirectTemplate);
  }
  return true;
}

async function saveDirectTemplate(){
  const user=auth.currentUser,msg=$('saveOpenedDirectTemplateMsg'),button=$('saveOpenedDirectTemplateButton');
  if(!user)return;
  const payload=collectTemplate();
  if(!payload.classes.length){if(msg)msg.innerHTML='<b>No selected classes were detected.</b> Open the Classes/Subjects steps once, then return and try again.';return}
  const currentName=String($('workspaceName')?.value||'Saved Examination').trim()||'Saved Examination';
  const proposed=prompt('Template name:',currentName+' Template');if(proposed===null)return;
  const name=String(proposed||'').trim();if(!name){if(msg)msg.textContent='Template name cannot be blank.';return}
  if(!confirm(`Create a separate reusable template named “${name}”?\n\nOnly selected classes and subjects will be copied. The opened saved timetable will not be changed.`))return;
  const id='TEMPLATE_'+name.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,48);
  button.disabled=true;
  try{
    await setDoc(doc(db,'examSchedules',id),{schemaVersion:1,templateOnly:true,name,template:payload,status:'draft',ownerUid:user.uid,ownerEmail:user.email||'',sourceSavedTimetableName:currentName,updatedAt:serverTimestamp(),updatedAtMs:Date.now(),createdAtMs:Date.now(),workspace:{name,classes:payload.classes,papers:[],teachers:[],settings:{},slots:[],timetable:{events:[],unplaced:[]},duties:{invigilation:[],relievers:[],unfilled:[]}}},{merge:true});
    if(msg)msg.innerHTML=`<b>${esc(name)}</b> saved as a reusable template. The opened timetable was not changed.`;
    const select=$('majorTemplateSelect');if(select){const existing=[...select.options].some(o=>o.value===id);if(!existing){const opt=document.createElement('option');opt.value=id;opt.textContent=name;select.appendChild(opt)}select.value=id}
  }catch(e){if(msg)msg.textContent='Could not save template: '+(e.message||e)}finally{button.disabled=false}
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-open-cloud]')){
    openedSaved=true;
    setTimeout(()=>{document.querySelector('[data-pane-target="setup"]')?.click();ensureAction();$('majorTemplateBox')?.scrollIntoView({behavior:'smooth',block:'center'})},350);
  }
},true);

onAuthStateChanged(auth,user=>{if(!user)return;let n=0;const t=setInterval(()=>{if(openedSaved&&ensureAction())clearInterval(t);else if(++n>80)clearInterval(t)},200)});
