import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc,getDocs,collection,query,where,limit,writeBatch}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IMPORT_SOURCES=['admin_excel_import','admin_word_import'];
let currentAdmin=null,batches=[];

function timeOf(q){return Number(q.createdAtMs||q.submittedAtMs||q.updatedAtMs)||0}
function fmt(ms){if(!ms)return'—';const d=new Date(ms);return d.toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function keyOf(q){return[String(q.source||''),String(q.sourceFileName||'Unnamed import'),String(q.teacherUid||q.teacherCode||q.teacherEmail||''),String(q.importedByUid||'')].join('|')}
function splitIntoBatches(rows){
  const groups=new Map();
  for(const row of rows){const k=keyOf(row);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(row)}
  const out=[];
  for(const group of groups.values()){
    group.sort((a,b)=>timeOf(a)-timeOf(b));let part=[];
    for(const row of group){const prev=part.at(-1);if(prev&&timeOf(row)-timeOf(prev)>60000){out.push(part);part=[]}part.push(row)}
    if(part.length)out.push(part);
  }
  return out.map((rows,i)=>{const first=rows[0]||{},times=rows.map(timeOf).filter(Boolean);return{id:'legacy-'+i,rows,count:rows.length,file:first.sourceFileName||'Unnamed import',teacher:first.teacherName||first.teacherCode||first.teacherEmail||'Unknown teacher',teacherCode:first.teacherCode||'',source:first.source||'',importer:first.importedByName||first.importedByEmail||'Admin',importedByUid:first.importedByUid||'',start:times.length?Math.min(...times):0,end:times.length?Math.max(...times):0,allPending:rows.every(x=>String(x.status||'')==='submitted')};}).sort((a,b)=>b.end-a.end);
}
async function verifyAdmin(){const u=auth.currentUser;if(!u)throw Error('Sign in through VKVTT first.');const p=await getDoc(doc(db,'authorizedUsers',u.uid));if(!p.exists()||p.data().active!==true||String(p.data().role||'').toLowerCase()!=='admin')throw Error('Principal/Admin access is required.');currentAdmin=u;return u}
async function loadBatches(){
  const host=$('batchList'),msg=$('batchMsg');if(!host||!msg)return;
  host.innerHTML='';msg.className='tip';msg.textContent='Loading recent Admin import batches…';
  try{await verifyAdmin();const snaps=await Promise.all(IMPORT_SOURCES.map(source=>getDocs(query(collection(db,'qbQuestions'),where('source','==',source),limit(1000))).catch(()=>null))),rows=[];for(const snap of snaps)for(const d of snap?.docs||[])rows.push({id:d.id,...d.data()});batches=splitIntoBatches(rows).slice(0,25);render();}
  catch(e){msg.className='warn';msg.textContent='Could not load import batches: '+(e.message||e)}
}
function render(){
  const host=$('batchList'),msg=$('batchMsg');if(!batches.length){msg.className='tip';msg.textContent='No Admin Excel/Word import batches found.';host.innerHTML='';return}
  msg.className='ok';msg.textContent=`${batches.length} recent import batch(es) found. Only batches still entirely Pending Verification can be deleted here.`;
  host.innerHTML=batches.map((b,i)=>`<div class="batchRow"><div><b>${esc(b.teacher)}</b>${b.teacherCode?` (${esc(b.teacherCode)})`:''}<div class="small">${esc(b.file)} · ${b.count} question(s) · ${fmt(b.start)}${b.end>b.start?' – '+fmt(b.end):''}<br>Imported by ${esc(b.importer)} · ${b.source==='admin_word_import'?'Word':'Excel'}</div></div><div><button class="danger" data-delete-batch="${i}" ${b.allPending?'':'disabled'}>${b.allPending?'Delete This Pending Batch':'Locked: already reviewed'}</button></div></div>`).join('');
  host.querySelectorAll('[data-delete-batch]').forEach(btn=>btn.onclick=()=>deleteBatch(Number(btn.dataset.deleteBatch)));
}
async function deleteBatch(index){
  const b=batches[index];if(!b||!b.allPending)return;
  const warning=`Delete exactly this import batch?\n\nTeacher: ${b.teacher}\nFile: ${b.file}\nQuestions: ${b.count}\nImported: ${fmt(b.start)}\n\nOnly these still-Pending imported questions will be deleted. This cannot be undone.`;
  if(!confirm(warning))return;
  const typed=prompt(`For safety, type DELETE ${b.count} to confirm.`);if(typed!==`DELETE ${b.count}`){alert('Deletion cancelled. Confirmation text did not match.');return}
  const msg=$('batchMsg');msg.className='tip';msg.textContent=`Deleting ${b.count} question(s)…`;
  try{await verifyAdmin();for(let i=0;i<b.rows.length;i+=400){const wb=writeBatch(db);for(const q of b.rows.slice(i,i+400)){const fresh=await getDoc(doc(db,'qbQuestions',q.id));if(!fresh.exists())continue;const data=fresh.data()||{};if(!IMPORT_SOURCES.includes(String(data.source||''))||String(data.status||'')!=='submitted')throw Error(`Safety stop: ${q.id} is no longer an untouched Pending imported question.`);wb.delete(doc(db,'qbQuestions',q.id))}await wb.commit()}msg.className='ok';msg.textContent=`Deleted ${b.count} Pending imported question(s) from ${b.teacher}. You can now re-import the corrected batch.`;await loadBatches();}
  catch(e){msg.className='warn';msg.textContent='Batch deletion stopped: '+(e.message||e)}
}

const loadBtn=$('loadBatches');if(loadBtn)loadBtn.onclick=loadBatches;
