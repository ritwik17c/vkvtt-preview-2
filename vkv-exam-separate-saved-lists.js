import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,collection,getDocs}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let templates=[];

function isTemplate(x){return x.templateOnly===true||/^TEMPLATE_/i.test(x.id)||!!(x.template&&(Array.isArray(x.template.classes)||x.template.subjects))}

function ensureTemplateSection(){
  const outputs=document.querySelector('[data-pane="outputs"]');
  if(!outputs)return null;
  let section=document.getElementById('savedExamTemplatesSection');
  if(section)return section;
  section=document.createElement('article');
  section.id='savedExamTemplatesSection';
  section.className='surface';
  section.innerHTML=`<div class="sectionTitle"><div><h3>Saved Examination Templates</h3><p>Reusable class-and-subject structures. Using a template starts a new timetable and does not alter any saved timetable.</p></div></div><div id="savedExamTemplateList" class="draftList"><div class="notice info">Loading saved templates…</div></div>`;
  const timetableSection=document.getElementById('draftList')?.closest('article.surface');
  if(timetableSection){
    const heading=timetableSection.querySelector('h3');if(heading)heading.textContent='Saved Examination Timetables';
    const note=timetableSection.querySelector('.sectionTitle p');if(note)note.textContent='Complete saved examination workspaces. Open, edit, submit, publish or preserve them independently of templates.';
    timetableSection.insertAdjacentElement('afterend',section);
  }else outputs.appendChild(section);
  return section;
}

function cardId(card){return card.querySelector('[data-open-cloud]')?.dataset.openCloud||card.querySelector('[data-revise-cloud]')?.dataset.reviseCloud||''}

function keepListsIndependent(){
  const list=document.getElementById('draftList');if(!list)return;
  for(const card of list.querySelectorAll('.draftCard')){
    const id=cardId(card);
    if(/^TEMPLATE_/i.test(id)){
      card.classList.add('majorHide');
      card.style.display='none';
    }else{
      card.classList.remove('majorHide');
      card.style.display='';
    }
  }
}

async function refreshTemplates(){
  ensureTemplateSection();
  const host=document.getElementById('savedExamTemplateList');if(!host)return;
  try{
    const snap=await getDocs(collection(db,'examSchedules'));
    templates=snap.docs.map(d=>({id:d.id,...d.data()})).filter(isTemplate).filter(x=>x.template&&Array.isArray(x.template.classes)&&x.template.subjects);
    templates.sort((a,b)=>(b.updatedAtMs||0)-(a.updatedAtMs||0));
    if(!templates.length){host.innerHTML='<div class="notice info">No saved examination templates yet.</div>';return}
    host.innerHTML=templates.map(t=>{
      const classes=(t.template?.classes||[]).join(', ');
      const subjectCount=Object.values(t.template?.subjects||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
      return `<div class="draftCard" data-template-card="${esc(t.id)}"><h4>${esc(t.name||t.id)}</h4><p class="tableHint">${esc(classes||'No classes listed')} · ${subjectCount} subject selection${subjectCount===1?'':'s'}</p><div class="buttonRow"><button class="button primary" data-use-saved-template="${esc(t.id)}">Use for New Timetable</button></div></div>`;
    }).join('');
  }catch(e){host.innerHTML='<div class="notice warn">Could not load saved templates: '+esc(e.message||e)+'</div>'}
}

async function useTemplate(id){
  const t=templates.find(x=>x.id===id);if(!t)return;
  document.querySelector('[data-pane-target="setup"]')?.click();
  let n=0;const timer=setInterval(()=>{
    const select=document.getElementById('majorTemplateSelect'),load=document.getElementById('majorLoadTemplate');
    if(select&&load){clearInterval(timer);select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));load.click()}
    else if(++n>30){clearInterval(timer);alert('Template controls are not ready. Please reopen Exam Setup and try again.')}
  },100);
}

function bindDraftListObserver(){
  const list=document.getElementById('draftList');if(!list||list.dataset.separateListsBound)return;
  list.dataset.separateListsBound='1';
  new MutationObserver(()=>setTimeout(keepListsIndependent,0)).observe(list,{childList:true,subtree:true});
  keepListsIndependent();
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-use-saved-template]');if(b){e.preventDefault();useTemplate(b.dataset.useSavedTemplate);return}
  if(e.target.closest('[data-pane-target="outputs"]'))setTimeout(()=>{ensureTemplateSection();bindDraftListObserver();keepListsIndependent();refreshTemplates()},120);
});
window.addEventListener('vkv-template-saved',()=>setTimeout(refreshTemplates,100));

onAuthStateChanged(auth,user=>{if(!user)return;let n=0;const timer=setInterval(()=>{
  if(!document.getElementById('examApp')||document.getElementById('examApp').hidden){if(++n>40)clearInterval(timer);return}
  clearInterval(timer);ensureTemplateSection();bindDraftListObserver();keepListsIndependent();refreshTemplates();
},250)});
