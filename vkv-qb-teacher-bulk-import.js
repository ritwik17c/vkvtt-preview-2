import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc,setDoc,serverTimestamp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import{activeQBSubjects}from'./vkv-qb-subject-catalog.js?v=20260901-1';
import{QB_IMPORT_COLUMNS,QB_QUESTION_TYPES,QB_DIFFICULTIES,parseExcelQuestionRows,parseWordQuestionDocument,validateQuestionImports,importFingerprint}from'./vkv-qb-bulk-import-core.js?v=20260903-word-inline-marks-3';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mail=value=>String(value||'').trim().toLowerCase(),text=value=>String(value||'').trim();
const baseClasses=['B1','B2','B3','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
let user=null,profile={},master={},config={},teacher=null,subjects=[],classes=[],coordinatorSubjects=new Set(),items=[],sourceType='',sourceName='',mounted=false;

function loadScript(src,globalName){
  if(window[globalName])return Promise.resolve(window[globalName]);
  return new Promise((resolve,reject)=>{const old=[...document.scripts].find(s=>s.src===src);if(old){old.addEventListener('load',()=>resolve(window[globalName]),{once:true});old.addEventListener('error',reject,{once:true});return}const script=document.createElement('script');script.src=src;script.onload=()=>resolve(window[globalName]);script.onerror=()=>reject(Error('Could not load '+globalName+'. Check the internet connection and try again.'));document.head.appendChild(script)});
}

function combineMaster(snapshot){const raw=snapshot?.exists()?snapshot.data()||{}:{},wrapped=raw.data&&typeof raw.data==='object'?raw.data:{};return{...raw,...wrapped}}
function codes(record){return[record?.code,record?.shortCode,record?.teacherShortCode,record?.timetableCode].map(text).filter(Boolean)}
function emails(record){return[record?.email,record?.gmail,record?.googleEmail,record?.google_email,record?.officialEmail,record?.loginEmail,...(Array.isArray(record?.emails)?record.emails:[])].map(mail).filter(Boolean)}
function canonical(code){const aliases=master.teacherCodeAliases||{},seen=new Set();code=text(code);while(code&&aliases[code]&&!seen.has(code)){seen.add(code);code=text(aliases[code])}return code}
function resolveTeacher(){
  const roster=(master.teachers||[]).filter(Boolean),userEmail=mail(user?.email),wanted=[profile.teacherCode,profile.teacherShortCode,profile.timetableCode,profile.staffCode,profile.shortCode,profile.code].map(canonical).filter(Boolean);
  for(const code of wanted){const hit=roster.find(t=>codes(t).map(canonical).includes(code));if(hit)return hit}
  for(const [code,email] of Object.entries(master.teacherEmailMap||{}))if(mail(email)===userEmail){const hit=roster.find(t=>codes(t).map(canonical).includes(canonical(code)));if(hit)return hit}
  return roster.find(t=>emails(t).includes(userEmail))||null;
}
function classLabel(value){if(typeof value==='string')return text(value);return text(value?.name||value?.className||value?.class||value?.standard||value?.grade||value?.code)}
function option(value,selected=''){return`<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(value)}</option>`}
function selectOptions(values,selected){const missing=selected&&!values.some(value=>String(value)===String(selected))?`<option value="${esc(selected)}" selected>⚠ ${esc(selected)}</option>`:'';return missing+values.map(value=>option(value,selected)).join('')}
function currentDefaults(){return{className:$('qbBulkClass')?.value||'',section:$('qbBulkSection')?.value||'',subject:$('qbBulkSubject')?.value||'',marks:$('qbBulkMarks')?.value||1,difficulty:$('qbBulkDifficulty')?.value||'Moderate',questionType:$('qbBulkType')?.value||'Short Answer'}}
function teacherName(){return text(teacher?.name||teacher?.fullName||user?.displayName||'Teacher')}
function teacherCode(){return canonical(codes(teacher)[0]||profile.teacherCode||'')}
function isPrincipal(){return /admin|principal/i.test(String(profile?.role||''))}
function syncPageSubjectDropdowns(){
  for(const id of ['qSubject','sub']){
    const select=$(id);if(!select)return;
    const previous=select.value;select.innerHTML=selectOptions(subjects,previous);
    if(previous&&subjects.some(subject=>subject===previous))select.value=previous;
  }
}

function ensurePanel(){
  if(mounted)return $('qbTeacherBulkImport');
  const existing=$('io');
  let panel=existing;
  if(!panel){
    const tabs=document.querySelector('.tabs'),anchor=$('paper')||document.querySelector('.panel:last-of-type');
    if(!tabs||!anchor)return null;
    const button=document.createElement('button');button.type='button';button.textContent='📥 Bulk Import';button.dataset.qbBulkTab='1';tabs.appendChild(button);
    panel=document.createElement('section');panel.id='qbBulkPanel';panel.className='card panel';anchor.after(panel);
    button.onclick=()=>{document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x===panel));tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('primary',x===button))};
  }
  const host=document.createElement('div');host.id='qbTeacherBulkImport';host.innerHTML=`<style>
    #qbTeacherBulkImport{margin-top:14px}#qbTeacherBulkImport .qbbi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}#qbTeacherBulkImport .qbbi-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#qbTeacherBulkImport .qbbi-table{overflow:auto;margin-top:10px}#qbTeacherBulkImport table{border-collapse:collapse;width:100%;min-width:1050px}#qbTeacherBulkImport th,#qbTeacherBulkImport td{border:1px solid #dce7ec;padding:7px;vertical-align:top;font-size:.8rem}#qbTeacherBulkImport th{background:#edf5f9;text-align:left}#qbTeacherBulkImport td input,#qbTeacherBulkImport td select,#qbTeacherBulkImport td textarea{min-width:100px;padding:7px}#qbTeacherBulkImport td textarea{min-width:260px;min-height:70px}#qbTeacherBulkImport tr.qbbi-bad{background:#fff3df}#qbTeacherBulkImport .qbbi-errors{color:#8b2d2d;font-size:.75rem;margin-top:4px}#qbTeacherBulkImport .warning{background:#fff7df;border:1px solid #e5cd8c;border-radius:10px;padding:10px;color:#745917}@media(max-width:700px){#qbTeacherBulkImport .qbbi-grid{grid-template-columns:1fr}}
  </style><h2>📥 Bulk Import Questions</h2><div class="tip"><b>Excel:</b> one question per row using the downloadable headings. <b>Word (.docx):</b> use a numbered list such as “1. …”, “2. …”; choose common Class, Subject and Marks below. A marks note such as <b>(2 marks)</b> at the end of a Word question overrides the common marks. Every question is previewed and validated before saving.</div><div class="qbbi-grid" style="margin-top:10px"><div><label>Class *</label><select id="qbBulkClass"></select></div><div><label>Section / Stream</label><input id="qbBulkSection" placeholder="Optional"></div><div><label>Subject *</label><select id="qbBulkSubject"></select></div><div><label>Default Marks *</label><input id="qbBulkMarks" type="number" min="0.5" step="0.5" value="1"></div><div><label>Default Difficulty</label><select id="qbBulkDifficulty">${QB_DIFFICULTIES.map(x=>option(x,'Moderate')).join('')}</select></div><div><label>Default Question Type</label><select id="qbBulkType">${QB_QUESTION_TYPES.map(x=>option(x,'Short Answer')).join('')}</select></div></div><label style="margin-top:10px">Excel or Word file *</label><input id="qbBulkFile" type="file" accept=".xlsx,.xls,.docx"><div class="qbbi-actions"><button id="qbBulkTemplate" type="button">⬇ Download Excel Template</button><button id="qbBulkAnalyse" type="button" class="primary">Analyse & Preview</button></div><div id="qbBulkMsg" class="tip" style="margin-top:10px">No file analysed yet.</div><div id="qbBulkPreview"></div>`;
  panel.appendChild(host);mounted=true;
  return host;
}

function setMessage(message,kind='tip'){const el=$('qbBulkMsg');if(el){el.className=kind;el.textContent=message}}
function validate(){const result=validateQuestionImports(items,subjects,{teacherKey:user?.uid||''});items=result.items;return result}
function renderPreview(){
  const result=validate(),preview=$('qbBulkPreview');if(!preview)return;
  if(!items.length){preview.innerHTML='';return}
  const invalid=result.invalid.length;
  preview.innerHTML=`<div class="qbbi-actions"><b>${items.length} question(s)</b><span>${result.duplicates.length} duplicate row(s) removed${result.overflow?` · ${result.overflow} over the 500-row limit ignored`:''}</span></div><div class="qbbi-table"><table><thead><tr><th>#</th><th>Class *</th><th>Subject *</th><th>Marks *</th><th>Type</th><th>Question *</th><th>Answer</th></tr></thead><tbody>${items.map((item,index)=>`<tr class="${item.errors.length?'qbbi-bad':''}"><td>${index+1}<div class="qbbi-errors">${item.errors.map(esc).join('<br>')}</div></td><td><input data-qbbi="className" data-i="${index}" value="${esc(item.className)}"></td><td><select data-qbbi="subject" data-i="${index}">${selectOptions(subjects,item.subject)}</select></td><td><input data-qbbi="marks" data-i="${index}" type="number" min="0.5" step="0.5" value="${esc(item.marks)}"></td><td><select data-qbbi="questionType" data-i="${index}">${selectOptions(QB_QUESTION_TYPES,item.questionType)}</select></td><td><textarea data-qbbi="questionText" data-i="${index}">${esc(item.questionText)}</textarea></td><td><textarea data-qbbi="answer" data-i="${index}">${esc(item.answer)}</textarea></td></tr>`).join('')}</tbody></table></div><div class="qbbi-actions"><button id="qbBulkDrafts" type="button" ${invalid?'disabled':''}>Save All as Drafts</button><button id="qbBulkSubmit" type="button" class="primary" ${invalid?'disabled':''}>Submit All for Verification</button></div><div class="${invalid?'warning':'tip'}" style="margin-top:8px">${invalid?`${invalid} row(s) need correction before import.`:'Ready. Nothing has been saved yet.'}</div>`;
  preview.querySelectorAll('[data-qbbi]').forEach(control=>control.onchange=()=>{const index=Number(control.dataset.i),field=control.dataset.qbbi;if(!items[index])return;items[index][field]=field==='marks'?Number(control.value):control.value;renderPreview()});
  $('qbBulkDrafts').onclick=()=>importAll('draft');$('qbBulkSubmit').onclick=()=>importAll('submitted');
}

async function hash(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,28)}
async function importAll(requestedStatus){
  const result=validate();if(!items.length||result.invalid.length)return;
  const action=requestedStatus==='draft'?'save these questions as drafts':'submit these questions to the verification workflow';
  if(!confirm(`Do you want to ${action}?\n\nQuestions: ${items.length}`))return;
  const draftBtn=$('qbBulkDrafts'),submitBtn=$('qbBulkSubmit');draftBtn.disabled=true;submitBtn.disabled=true;
  let saved=0,skipped=0;
  try{
    for(let index=0;index<items.length;index++){
      const item=items[index],fingerprint=importFingerprint(item,user.uid),id='QBTI-'+await hash(fingerprint),ref=doc(db,'qbQuestions',id),existing=await getDoc(ref);
      if(existing.exists()){skipped++;continue}
      const now=Date.now()+index,principalSubmit=isPrincipal()&&requestedStatus==='submitted',coordinatorSubmit=!principalSubmit&&requestedStatus==='submitted'&&coordinatorSubjects.has(item.subject),status=principalSubmit?'approved':requestedStatus,actor=teacherName();
      const workflow=[{action:requestedStatus==='draft'?'teacher_bulk_import_draft':'teacher_bulk_import_submitted',atMs:now,byUid:user.uid,byName:actor,source:sourceType}];
      const data={questionId:id,questionText:item.questionText,answer:item.answer,markingScheme:item.markingScheme||'',className:item.className,section:item.section||'',subject:item.subject,chapter:item.chapter||'',topic:item.topic||'',learningOutcome:item.learningOutcome||'',marks:Number(item.marks),difficulty:item.difficulty||'Moderate',questionType:item.questionType||'Short Answer',teacherUid:user.uid,teacherEmail:mail(user.email),teacherName:actor,teacherCode:teacherCode(),status,coordinatorRequired:status==='submitted',createdAtMs:now,updatedAtMs:now,submittedAtMs:requestedStatus==='submitted'?now:null,source:sourceType==='word'?'teacher_word_import':'teacher_excel_import',sourceFileName:sourceName,sourceRow:item.sourceRow||index+2,importedByUid:user.uid,importedByEmail:mail(user.email),importedAt:serverTimestamp(),version:1,workflow};
      if(principalSubmit)Object.assign(data,{coordinatorRequired:false,verificationMethod:'principal_self_submission',verifiedAtMs:now,verifiedByUid:user.uid,verifiedByEmail:mail(user.email),verifiedByName:actor,workflow:[...workflow,{action:'principal_self_submission',atMs:now,byUid:user.uid,byName:actor}]});
      await setDoc(ref,data);
      if(coordinatorSubmit){const verifiedAt=Date.now(),verifiedWorkflow=[...workflow,{action:'subject_coordinator_self_verification',atMs:verifiedAt,byUid:user.uid,byName:actor,subject:item.subject}];await setDoc(ref,{status:'approved',coordinatorRequired:false,verificationMethod:'subject_coordinator_self_verification',verifiedAtMs:verifiedAt,verifiedByUid:user.uid,verifiedByEmail:mail(user.email),verifiedByName:actor,updatedAtMs:verifiedAt,workflow:verifiedWorkflow},{merge:true})}
      saved++;setMessage(`Saving… ${saved+skipped} of ${items.length}`,'tip');
    }
    setMessage(`Import complete: ${saved} question(s) saved${skipped?`; ${skipped} already-existing question(s) safely skipped`:''}. They are now available in My History.`, 'ok');window.dispatchEvent(new CustomEvent('vkv-qb-questions-saved',{detail:{saved,skipped,status:requestedStatus}}));items=[];$('qbBulkFile').value='';$('qbBulkPreview').innerHTML='';
  }catch(error){setMessage('Import stopped: '+(error.message||error),'warning');renderPreview()}
}

async function analyse(){
  const file=$('qbBulkFile')?.files?.[0];if(!file)return setMessage('Choose an Excel (.xlsx/.xls) or Word (.docx) file first.','warning');
  if(file.size>12*1024*1024)return setMessage('The file is larger than 12 MB. Please split it into smaller files.','warning');
  const extension=file.name.split('.').pop().toLowerCase(),defaults=currentDefaults();sourceName=file.name;
  try{
    if(extension==='xlsx'||extension==='xls'){
      const XLSX=await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX'),workbook=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});items=parseExcelQuestionRows(rows,defaults);sourceType='excel';
    }else if(extension==='docx'){
      const mammoth=await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.12.2/mammoth.browser.min.js','mammoth'),buffer=await file.arrayBuffer(),[plain,structured]=await Promise.all([mammoth.extractRawText({arrayBuffer:buffer.slice(0)}),mammoth.convertToHtml({arrayBuffer:buffer})]);items=parseWordQuestionDocument({text:plain.value,html:structured.value},defaults);sourceType='word';
    }else throw Error('Only .xlsx, .xls and .docx files are supported. Old .doc files should first be saved as .docx in Word.');
    if(!items.length)throw Error(sourceType==='word'?'No numbered questions were detected. Number each Word question as 1., 2., 3. and try again.':'No question rows were found in the first worksheet.');
    renderPreview();const invalid=items.filter(item=>item.errors?.length).length;setMessage(`File analysed: ${items.length} question(s) found${invalid?`; ${invalid} need correction`:''}. Review the preview before saving.`,invalid?'warning':'ok');
  }catch(error){items=[];$('qbBulkPreview').innerHTML='';setMessage('Could not analyse the file: '+(error.message||error),'warning')}
}

async function downloadTemplate(){
  try{const XLSX=await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX'),sample={};QB_IMPORT_COLUMNS.forEach(key=>sample[key]='');Object.assign(sample,{'Class':'X','Section / Stream':'','Subject':subjects[0]||'English','Marks':2,'Difficulty':'Moderate','Question Type':'Short Answer','Question':'Write the question here.','Answer':'Optional answer.','Marking Scheme':''});const workbook=XLSX.utils.book_new(),sheet=XLSX.utils.json_to_sheet([sample],{header:QB_IMPORT_COLUMNS});XLSX.utils.book_append_sheet(workbook,sheet,'Questions');XLSX.writeFile(workbook,'VKV_QB_Teacher_Bulk_Import_Template.xlsx')}catch(error){setMessage('Could not create the template: '+(error.message||error),'warning')}}

async function boot(u){
  user=u;if(!user)return;
  const email=mail(u.email),[authorised,viewer,masterSnap,configSnap,accessSnap]=await Promise.all([getDoc(doc(db,'authorizedUsers',u.uid)).catch(()=>null),getDoc(doc(db,'viewerEmails',email)).catch(()=>null),getDoc(doc(db,'master','current')),getDoc(doc(db,'qbConfig','current')).catch(()=>null),getDoc(doc(db,'qbCoordinatorAccess',u.uid)).catch(()=>null)]);
  profile=authorised?.exists()&&authorised.data().active!==false?authorised.data():viewer?.exists()&&viewer.data().active!==false?{role:'teacher',...viewer.data()}:null;
  if(!profile)return;master=combineMaster(masterSnap);config=configSnap?.exists()?configSnap.data()||{}:{};teacher=resolveTeacher();if(!teacher)return;
  const directory=(master.staffDirectory||[]).find(record=>emails(record).includes(email)),category=String(directory?.category||directory?.staffCategory||directory?.staffType||'').toLowerCase().replace(/[ _-]+/g,'');if(category.includes('nonteaching')||category.includes('support')||category.includes('office'))return;
  subjects=activeQBSubjects(master,config);classes=[...new Set([...(master.classes||[]).map(classLabel),...baseClasses].filter(Boolean))];
  for(const [subject,records] of Object.entries(config.coordinators||{}))if((Array.isArray(records)?records:[]).some(record=>record.uid===u.uid||mail(record.email)===email||canonical(record.teacherCode)===teacherCode()))coordinatorSubjects.add(subject);
  if(accessSnap?.exists()&&accessSnap.data().active===true)for(const [subject,active] of Object.entries(accessSnap.data().subjects||{}))if(active===true)coordinatorSubjects.add(subject);
  syncPageSubjectDropdowns();const host=ensurePanel();if(!host)return;$('qbBulkClass').innerHTML=selectOptions(classes,$('qClass')?.value||$('cls')?.value||classes[0]);$('qbBulkSubject').innerHTML=selectOptions(subjects,$('qSubject')?.value||$('sub')?.value||subjects[0]);$('qbBulkTemplate').onclick=downloadTemplate;$('qbBulkAnalyse').onclick=analyse;
}

if(auth.currentUser)boot(auth.currentUser).catch(error=>console.warn('Teacher QB bulk import:',error));
onAuthStateChanged(auth,u=>{if(u)boot(u).catch(error=>console.warn('Teacher QB bulk import:',error))});
