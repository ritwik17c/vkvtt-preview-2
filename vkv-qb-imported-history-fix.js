import{getApps,getApp,initializeApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,collection,getDocs,query,where,limit}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mail=v=>String(v||'').trim().toLowerCase();
const imported=q=>{const s=String(q?.source||'').toLowerCase();return s==='google_sheet_import'||s==='admin_excel_import'||s==='admin_word_import'||s.includes('import')};
function card(q){return`<div class="q"><b>${esc(q.questionText||'')}</b><div>${esc(q.className||'')} · ${esc(q.subject||'')} · ${esc(q.status||'')}</div><small>Imported submission · ${esc(q.teacherName||'')} ${q.marks!=null?'· '+esc(q.marks)+' mark(s)':''}</small></div>`}
async function loadImportedFixed(){
 const msg=document.getElementById('histMsg'),list=document.getElementById('list'),more=document.getElementById('showMore');
 try{
  const u=auth.currentUser;if(!u)throw Error('VKVTT sign-in is not restored. Return Home and sign in first.');
  msg.textContent='Loading imported questions…';
  const map=new Map(),jobs=[getDocs(query(collection(db,'qbQuestions'),where('teacherUid','==',u.uid),limit(500)))];
  if(u.email)jobs.push(getDocs(query(collection(db,'qbQuestions'),where('teacherEmail','==',mail(u.email)),limit(500))).catch(()=>null));
  for(const s of await Promise.all(jobs))for(const d of s?.docs||[]){const q={id:d.id,...d.data()};if(imported(q))map.set(d.id,q)}
  const rows=[...map.values()].sort((a,b)=>(Number(b.submittedAtMs||b.createdAtMs)||0)-(Number(a.submittedAtMs||a.createdAtMs)||0));
  list.innerHTML=rows.slice(0,100).map(card).join('');
  more.style.display='none';
  msg.innerHTML=`<div class="ok">Imported history: ${rows.length} question(s) found.</div>`;
  if(rows.length>100){let shown=100;more.style.display='inline-block';more.onclick=()=>{const next=rows.slice(shown,shown+100);list.insertAdjacentHTML('beforeend',next.map(card).join(''));shown+=next.length;more.style.display=shown<rows.length?'inline-block':'none'}}
 }catch(e){msg.innerHTML=`<div class="warn">${esc(e.message||e)}</div>`}
}
function attach(){const b=document.getElementById('loadImported');if(!b||b.dataset.importFix==='1')return;b.dataset.importFix='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();loadImportedFixed()},{capture:true})}
attach();new MutationObserver(attach).observe(document.documentElement,{childList:true,subtree:true});
