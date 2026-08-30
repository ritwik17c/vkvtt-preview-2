import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, writeBatch, FieldPath, deleteField } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js";

const firebaseConfig={apiKey:"AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4",authDomain:"vkv-nalbari-timetable.firebaseapp.com",projectId:"vkv-nalbari-timetable",storageBucket:"vkv-nalbari-timetable.firebasestorage.app",messagingSenderId:"791432856951",appId:"1:791432856951:web:61324065a54bef30f98d72"};
const firebaseApp=initializeApp(firebaseConfig),auth=getAuth(firebaseApp),db=getFirestore(firebaseApp),provider=new GoogleAuthProvider();
await setPersistence(auth,browserLocalPersistence).catch(e=>console.warn('Auth persistence setup:',e));
if(typeof auth.authStateReady==='function')await auth.authStateReady().catch(e=>console.warn('Auth restore:',e));
const gate=document.getElementById('authGate'),msg=document.getElementById('authMessage'),loginBtn=document.getElementById('googleSignIn'),switchAccountBtn=document.getElementById('googleSwitchAccount'),copyUidBtn=document.getElementById('copySetupUid'),signOutBtn=document.getElementById('authSignOut'),cloudBar=document.getElementById('cloudBar'),cloudUser=document.getElementById('cloudUser'),cloudSync=document.getElementById('cloudSync'),cloudSwitchAccount=document.getElementById('cloudSwitchAccount'),cloudSignOut=document.getElementById('cloudSignOut');
let currentUser=null,currentProfile=null,todayPollTimer=null,publishedPollTimer=null,leavePlanPollTimer=null,schedulePollTimer=null,accessCheckTimer=null,cloudHydrating=false,cloudWriting=false,syncTimer=null,coreWrapped=false,homepageLeaveContextCache=null;
const statusEditorRoles=new Set(['admin','manager']);
const proxyRoles=new Set(['admin','manager','proxy_manager']);
const isAdmin=()=>currentProfile&&currentProfile.role==='admin';
const canEditStatus=()=>currentProfile&&statusEditorRoles.has(currentProfile.role);
const canManageProxy=()=>currentProfile&&proxyRoles.has(currentProfile.role);
const canWriteDaily=()=>canEditStatus()||canManageProxy();
const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const withTimeout=(promise,ms,label)=>Promise.race([
 promise,
 new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out after '+Math.round(ms/1000)+' seconds.')),ms))
]);
function setMessage(text,kind='info'){msg.className=kind==='error'?'authError':'authInfo';msg.innerHTML=text}
function showGate(){gate.classList.remove('hidden');cloudBar.classList.remove('show')}
function openApp(){gate.classList.add('hidden');cloudBar.classList.add('show')}
async function applyAnnualCalendarVisibility(){
 const button=document.getElementById('annualCalendarBtn');if(!button)return;
 button.style.display='none';
 try{const snap=await getDoc(doc(db,'annualCalendar','current'));button.style.display=(!snap.exists()||snap.data().visible!==false)?'inline-block':'none'}
 catch(e){console.warn('Annual Calendar visibility check:',e)}
}
async function doSignIn(forceChooser=true){
 setMessage(forceChooser?'Choose the Google account you want to use…':'Opening Google sign-in…');
 try{
   await setPersistence(auth,browserLocalPersistence);
   provider.setCustomParameters(forceChooser?{prompt:'select_account'}:{});
   await signInWithPopup(auth,provider);
 }catch(e){
   if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code)){
     await setPersistence(auth,browserLocalPersistence);
     provider.setCustomParameters(forceChooser?{prompt:'select_account'}:{});
     await signInWithRedirect(auth,provider);
   }else setMessage('<b>Sign-in error:</b> '+safe(e.message||e),'error');
 }
}
async function switchGoogleAccount(){
 try{
   await signOut(auth);
   await doSignIn(true);
 }catch(e){setMessage('<b>Could not switch Google account:</b> '+safe(e.message||e),'error')}
}
loginBtn.addEventListener('click',()=>doSignIn(true));
if(switchAccountBtn)switchAccountBtn.addEventListener('click',switchGoogleAccount);
signOutBtn.addEventListener('click',()=>signOut(auth));
cloudSignOut.addEventListener('click',()=>signOut(auth));
if(cloudSwitchAccount)cloudSwitchAccount.addEventListener('click',switchGoogleAccount);
copyUidBtn.addEventListener('click',async()=>{if(!currentUser)return;try{await navigator.clipboard.writeText(currentUser.uid);copyUidBtn.textContent='UID copied ✓'}catch(e){prompt('Copy this Firebase UID:',currentUser.uid)}});
function pendingAccess(user,extra=''){
 showGate();loginBtn.style.display='none';copyUidBtn.style.display='inline-block';signOutBtn.style.display='inline-block';
 setMessage('<b>Access is not authorised yet.</b><br><b>Google email:</b> '+safe(user.email||'')+'<br><b>Firebase UID:</b><div class="uidBox">'+safe(user.uid)+'</div>'+extra+'<br><br>For normal Viewer access, ask the Admin to add your Google email. The UID is needed only for privileged roles such as Proxy Manager.','error');
}
function populateMasterSelectors(){
 const currentTeachers=operationalTeachers().sort((a,b)=>a.name.localeCompare(b.name));
 const statusTeachers=statusAssignableTeachers().sort((a,b)=>a.name.localeCompare(b.name));
 const classes=[...(DATA.classes||[])];
 const fill=(id,placeholder,items)=>{const el=document.getElementById(id);if(!el)return;const old=el.value;el.innerHTML='<option value="">'+placeholder+'</option>'+items.map(x=>'<option value="'+safe(x.value)+'">'+safe(x.label)+'</option>').join('');if([...el.options].some(o=>o.value===old))el.value=old};
 const label=t=>t.name+' ('+t.code+')'+(t.nonTeaching?' · Non-Teaching · '+(t.designation||'Staff'):(t.temporary?' · Temporary Leave Vacancy':''));
 const currentItems=currentTeachers.map(t=>({value:t.code,label:label(t)}));
 const statusItems=statusTeachers.map(t=>({value:t.code,label:label(t)}));
 const cItems=classes.map(c=>({value:c,label:c}));
 ['teacherSel','nowTeacher'].forEach(id=>fill(id,'Select…',currentItems));
 fill('leaveTeacher','Select…',statusItems);
 ['classSel','slotClass'].forEach(id=>fill(id,'Select…',cItems));
 fill('dayClass','All',cItems);
}

function scheduleSignature(data){
 const id=(data&&data.activeScheduleProfileId)||'normal',profiles=(data&&data.scheduleProfiles)||{},p=profiles[id]||profiles.normal||{};
 const timetableVersion=(data&&data.activeTimetableVersionId)||'';
 const reps=((data&&data.temporaryReplacements)||[]).map(r=>[r.id,r.originalCode,r.tempCode,r.tempName,r.startDate,r.endDate,r.active!==false,r.archived===true,r.updatedAtMs||0]);
 const nts=((data&&data.nonTeachingStaff)||[]).map(x=>[x.id,x.code,x.name,x.designation,x.email,x.active!==false,x.updatedAtMs||0]);
 const emailMap=(data&&data.teacherEmailMap)||{};
 return JSON.stringify([timetableVersion,id,p.updatedAtMs||0,p.name||'',p.times||{},p.classPeriods||{},reps,nts,emailMap]);
}
async function refreshActiveScheduleFromCloud(){
 if(!currentUser||!window.DATA)return;
 try{
   const snap=await getDoc(doc(db,'master','current'));if(!snap.exists())return;
   const raw=snap.data(),fresh=raw.data||raw;
   if(scheduleSignature(fresh)===scheduleSignature(window.DATA))return;
   const timetableChanged=!!fresh.activeTimetableVersionId&&fresh.activeTimetableVersionId!==window.DATA.activeTimetableVersionId;
   if(timetableChanged){
     window.DATA.teachers=Array.isArray(fresh.teachers)?fresh.teachers:window.DATA.teachers;
     window.DATA.classes=Array.isArray(fresh.classes)?fresh.classes:window.DATA.classes;
     window.DATA.records=Array.isArray(fresh.records)?fresh.records:window.DATA.records;
     window.DATA.subjects=Array.isArray(fresh.subjects)?fresh.subjects:(window.DATA.subjects||[]);
     window.DATA.venues=Array.isArray(fresh.venues)?fresh.venues:(window.DATA.venues||[]);
     window.DATA.assignmentCards=Array.isArray(fresh.assignmentCards)?fresh.assignmentCards:(window.DATA.assignmentCards||[]);
     window.DATA.activeTimetableVersionId=fresh.activeTimetableVersionId;
     window.DATA.activeTimetableVersionName=fresh.activeTimetableVersionName||'';
     __sanitisedRecordsCache={recordsRef:null,teachersRef:null,value:[]};
     __operationalRecordsCache={key:'',value:[]};
     __operationalTeachersCache={key:'',value:[]};
   }
   window.DATA.scheduleProfiles=fresh.scheduleProfiles||{};
   window.DATA.activeScheduleProfileId=fresh.activeScheduleProfileId||'normal';
   window.DATA.temporaryReplacements=Array.isArray(fresh.temporaryReplacements)?fresh.temporaryReplacements:[];
   window.DATA.nonTeachingStaff=Array.isArray(fresh.nonTeachingStaff)?fresh.nonTeachingStaff:[];
   window.DATA.teacherEmailMap=fresh.teacherEmailMap||window.DATA.teacherEmailMap||{};
   if(fresh.times)window.DATA.times=fresh.times;
   if(fresh.patterns)window.DATA.patterns=fresh.patterns;
   populateMasterSelectors();
   if(window.applyActiveScheduleProfile)window.applyActiveScheduleProfile();
   if(window.__vkvCoreInitialized){
     try{renderLeave();renderLeavePlansList();renderActiveProxyView(true)}catch(e){console.warn('Operational refresh:',e)}
   }
 }catch(e){console.warn('Active schedule / temporary replacement refresh:',e)}
}

function startSchedulePolling(){
 if(schedulePollTimer){clearInterval(schedulePollTimer);schedulePollTimer=null}
 schedulePollTimer=setInterval(()=>refreshActiveScheduleFromCloud(),60000);
}
window.addEventListener('focus',()=>{refreshActiveScheduleFromCloud();if(currentProfile)applyAnnualCalendarVisibility()});

const LEAVE_PLAN_DOC='__leavePlans';
const PERSONAL_STATUS_TYPES=new Set(['full','half','od','special']);

window.loadHomepageLeaveContext=async function(code,force=false){
 if(!currentUser||!canEditStatus())throw new Error('Admin or Manager access is required to view staff leave balances.');
 const now=Date.now();
 if(!force&&homepageLeaveContextCache&&now-homepageLeaveContextCache.at<30000)return homepageLeaveContextCache.data;
 const [ruleSnap,dailySnap]=await Promise.all([getDoc(doc(db,'leaveRules','current')),getDocs(collection(db,'dailyRecords'))]);
 const rd=ruleSnap.exists()?(ruleSnap.data()||{}):{},scheduled=[],manual=[];
 dailySnap.forEach(d=>{
   const data=d.data()||{};
   if(d.id===LEAVE_PLAN_DOC){Object.values(data.plans||{}).forEach(p=>{if(p&&p.active!==false)scheduled.push({...p})});return}
   const date=data.date||d.id;
   (data.statuses||[]).forEach(x=>{if(x)manual.push({...x,_date:date})});
 });
 let legacy=[],legacyAvailable=false;
 if(isAdmin()){
   try{const ls=await getDocs(collection(db,'legacyLeaveAccounting'));ls.forEach(d=>legacy.push({id:d.id,...(d.data()||{})}));legacyAvailable=true}catch(e){console.warn('Homepage legacy leave context:',e)}
 }
 const data={categories:Array.isArray(rd.categories)?rd.categories:[],entitlementPeriod:rd.entitlementPeriod||null,staffCategoryOverrides:rd.staffCategoryOverrides||{},staffCategories:Array.isArray(rd.staffCategories)?rd.staffCategories:[],staffConditionalEligibility:rd.staffConditionalEligibility||{},scheduled,manual,legacy,legacyAvailable,loadedAt:now};
 homepageLeaveContextCache={at:now,data};
 return data;
};
window.invalidateHomepageLeaveContext=()=>{homepageLeaveContextCache=null};
function normalizedEmail(v){return String(v||'').trim().toLowerCase()}
function teacherEmailForCode(code){
 code=String(code||'').trim();if(!code)return '';
 const map=(window.DATA&&window.DATA.teacherEmailMap)||{};
 let email=normalizedEmail(map[code]);if(email)return email;
 const t=((window.DATA&&window.DATA.teachers)||[]).find(x=>String(x.code)===code);
 if(t){
   for(const k of ['email','gmail','googleEmail','google_email']){email=normalizedEmail(t[k]);if(email)return email}
   if(Array.isArray(t.emails)){email=normalizedEmail(t.emails.find(Boolean));if(email)return email}
 }
 const nt=((window.DATA&&window.DATA.nonTeachingStaff)||[]).find(x=>String(x.code)===code);if(nt){email=normalizedEmail(nt.email);if(email)return email}
 if(code===String(window.__vkvMyTeacherCode||'')&&currentUser) return normalizedEmail(currentUser.email);
 return '';
}
function planDateKeys(plan){
 if(!plan)return [];
 if(plan.mode==='multiple')return [...new Set((plan.dates||[]).filter(Boolean))].sort();
 const start=String(plan.startDate||plan.date||''),end=String(plan.endDate||start);
 if(!start)return [];
 const out=[],d=dateFromKey(start),last=dateFromKey(end||start);
 if(!d||!last||isNaN(d)||isNaN(last))return [start];
 for(let x=new Date(d);x<=last;x.setDate(x.getDate()+1))out.push(dateKeyFromDate(x));
 return out;
}
async function commitPersonalOps(ops){
 for(let i=0;i<ops.length;i+=400){
   const batch=writeBatch(db);
   for(const op of ops.slice(i,i+400))op(batch);
   await batch.commit();
 }
}
async function syncPersonalScheduledPlan(oldPlan,newPlan){
 const oldOk=oldPlan&&PERSONAL_STATUS_TYPES.has(String(oldPlan.type||'')),newOk=newPlan&&PERSONAL_STATUS_TYPES.has(String(newPlan.type||''));
 const oldEmail=oldOk?teacherEmailForCode(oldPlan.code):'',newEmail=newOk?teacherEmailForCode(newPlan.code):'';
 const oldDates=oldOk&&oldEmail?planDateKeys(oldPlan):[],newDates=newOk&&newEmail?planDateKeys(newPlan):[];
 const newSet=new Set(newDates),ops=[];
 if(oldEmail){
   for(const date of oldDates){
     if(oldEmail===newEmail&&newSet.has(date))continue;
     const ref=doc(db,'personalStatus',oldEmail,'records',date),pid=String(oldPlan.id||'');
     ops.push(batch=>batch.set(ref,{updatedAt:serverTimestamp(),scheduledPlans:{[pid]:deleteField()}},{merge:true}));
   }
 }
 if(newEmail){
   const clean={...newPlan,approved:true,source:'scheduled'};
   for(const date of newDates){
     const ref=doc(db,'personalStatus',newEmail,'records',date),pid=String(newPlan.id||'');
     ops.push(batch=>batch.set(ref,{date,email:newEmail,teacherCode:String(newPlan.code||''),updatedAt:serverTimestamp(),scheduledPlans:{[pid]:clean}},{merge:true}));
   }
 }
 if(ops.length)await commitPersonalOps(ops);
}
async function syncPersonalManualStatusesForDate(date,oldStatuses,newStatuses){
 const oldBy=new Map((oldStatuses||[]).filter(x=>x&&PERSONAL_STATUS_TYPES.has(String(x.type||''))).map(x=>[String(x.code||''),x]));
 const newBy=new Map((newStatuses||[]).filter(x=>x&&PERSONAL_STATUS_TYPES.has(String(x.type||''))).map(x=>[String(x.code||''),x]));
 const codes=new Set([...oldBy.keys(),...newBy.keys()]),ops=[];
 for(const code of codes){
   const email=teacherEmailForCode(code);if(!email)continue;
   const ref=doc(db,'personalStatus',email,'records',date),cur=newBy.get(code);
   if(cur)ops.push(batch=>batch.set(ref,{date,email,teacherCode:code,updatedAt:serverTimestamp(),manualStatus:{...cur,approved:true,source:'daily',date}},{merge:true}));
   else ops.push(batch=>batch.set(ref,{updatedAt:serverTimestamp(),manualStatus:deleteField()},{merge:true}));
 }
 if(ops.length)await commitPersonalOps(ops);
}
async function syncApprovedScheduledPlan(oldPlan,newPlan){
 const oldOk=oldPlan&&PERSONAL_STATUS_TYPES.has(String(oldPlan.type||'')),newOk=newPlan&&PERSONAL_STATUS_TYPES.has(String(newPlan.type||''));
 if(oldOk&&oldPlan.id&&(!newOk||String(oldPlan.id)!==String(newPlan&&newPlan.id||''))){
   await deleteDoc(doc(db,'approvedStatusPlans',String(oldPlan.id)));
 }
 if(newOk&&newPlan.id){
   await setDoc(doc(db,'approvedStatusPlans',String(newPlan.id)),{...newPlan,approved:true,source:newPlan.source||'scheduled',updatedAt:serverTimestamp(),updatedBy:currentUser.uid,updatedByEmail:currentUser.email||''},{merge:true});
 }
}
async function syncApprovedManualStatusesForDate(date,statuses){
 const approved=(statuses||[]).filter(x=>x&&PERSONAL_STATUS_TYPES.has(String(x.type||''))).map(x=>({...x,approved:true,source:'daily',date}));
 const ref=doc(db,'approvedDailyStatus',date);
 if(approved.length)await setDoc(ref,{date,statuses:approved,updatedAt:serverTimestamp(),updatedBy:currentUser.uid,updatedByEmail:currentUser.email||''},{merge:true});
 else {try{await deleteDoc(ref)}catch(e){console.warn('Approved daily projection delete:',e)}}
}
function cacheLeavePlans(plans){
 const clean=plans&&typeof plans==='object'?plans:{};
 window.__vkvLeavePlans=clean;
 try{localStorage.setItem('vkvLeavePlansCache',JSON.stringify(clean))}catch(e){}
 if(window.__vkvCoreInitialized){
   try{renderLeave();renderLeavePlansList();renderActiveProxyView(true)}catch(e){console.warn('Leave plan render:',e)}
 }
}
async function loadLeavePlansOnce(){
 if(!currentUser||!currentProfile||currentProfile.role==='leave_viewer')return;
 const snap=await getDoc(doc(db,'dailyRecords',LEAVE_PLAN_DOC));
 cacheLeavePlans(snap.exists()?(snap.data().plans||{}):{});
}
async function loadLeavePlansAndPoll(){
 await loadLeavePlansOnce();
 if(leavePlanPollTimer){clearInterval(leavePlanPollTimer);leavePlanPollTimer=null}
 leavePlanPollTimer=setInterval(()=>loadLeavePlansOnce().catch(e=>console.error('Scheduled leave sync:',e)),10000);
}
window.saveScheduledStatusPlan=async function(plan){
 if(!currentUser||!canEditStatus())throw new Error('Admin or Manager access is required.');
 const ref=doc(db,'dailyRecords',LEAVE_PLAN_DOC),snap=await getDoc(ref),id=String(plan.id||'').trim();
 if(!id)throw new Error('Scheduled entry ID is missing.');
 const oldPlan=snap.exists()?((snap.data().plans||{})[id]||null):null;
 const clean={...plan,updatedAtMs:Date.now(),updatedBy:currentUser.uid,updatedByEmail:currentUser.email||''};
 if(!snap.exists()){
   await setDoc(ref,{date:LEAVE_PLAN_DOC,dayName:'Scheduled Leave / Status Plans',plans:{[id]:clean},updatedAt:serverTimestamp(),updatedBy:currentUser.uid,updatedByEmail:currentUser.email||''});
 }else{
   await updateDoc(ref,
     new FieldPath('plans',id),clean,
     new FieldPath('updatedAt'),serverTimestamp(),
     new FieldPath('updatedBy'),currentUser.uid,
     new FieldPath('updatedByEmail'),currentUser.email||''
   );
 }
 const plans={...cachedLeavePlans(),[id]:clean};cacheLeavePlans(plans);
 try{await syncPersonalScheduledPlan(oldPlan,clean)}catch(e){console.warn('Personal Leave / OD sync:',e)}
 try{await syncApprovedScheduledPlan(oldPlan,clean)}catch(e){console.warn('Approved Leave register sync:',e)}
 return clean;
};
window.deleteScheduledStatusPlan=async function(id){
 if(!currentUser||!canEditStatus())throw new Error('Admin or Manager access is required.');
 id=String(id||'').trim();if(!id)return;
 const ref=doc(db,'dailyRecords',LEAVE_PLAN_DOC),snap=await getDoc(ref);
 const oldPlan=snap.exists()?((snap.data().plans||{})[id]||null):null;
 if(snap.exists()){
   await updateDoc(ref,
     new FieldPath('plans',id),deleteField(),
     new FieldPath('updatedAt'),serverTimestamp(),
     new FieldPath('updatedBy'),currentUser.uid,
     new FieldPath('updatedByEmail'),currentUser.email||''
   );
 }
 const plans={...cachedLeavePlans()};delete plans[id];cacheLeavePlans(plans);
 try{if(oldPlan)await syncPersonalScheduledPlan(oldPlan,null)}catch(e){console.warn('Personal Leave / OD delete sync:',e)}
 try{if(oldPlan)await syncApprovedScheduledPlan(oldPlan,null)}catch(e){console.warn('Approved Leave register delete sync:',e)}
};
function dailyLocalPayload(date=todayKey()){return {date,dayName:dayNameForDate(date),statuses:storedStatusData(date),allotments:allotData(date),supervisions:supervisionData(date)}}
function dailyCloudWritePayload(date=todayKey()){
 const p=dailyLocalPayload(date);
 if(canEditStatus())return p;
 if(canManageProxy())return {date:p.date,dayName:p.dayName,allotments:p.allotments,supervisions:p.supervisions};
 return null;
}
function hydrateDaily(data,date=todayKey()){
 cloudHydrating=true;
 try{
   localStorage.setItem('vkvLeave2_'+date,JSON.stringify(data.statuses||[]));
   localStorage.setItem('vkvAllotments_'+date,JSON.stringify(data.allotments||{}));
   localStorage.setItem('vkvSupervision_'+date,JSON.stringify(data.supervisions||{}));
   let h=historyData();h[date]={date,dayName:data.dayName||dayNameForDate(date),statuses:data.statuses||[],allotments:data.allotments||{},supervisions:data.supervisions||{}};localStorage.setItem('vkvHistory',JSON.stringify(h));
 }finally{cloudHydrating=false}
 if(window.__vkvCoreInitialized){try{renderLeave();const allot=document.getElementById('allot');if(allot&&allot.classList.contains('active'))renderActiveProxyView(true)}catch(e){console.warn(e)}}
}
async function pushToday(payload){
 if(!currentUser||!canWriteDaily()||cloudHydrating)return;
 const p=payload||dailyCloudWritePayload();
 if(!p)return;
 const ref=doc(db,'dailyRecords',p.date);
 cloudWriting=true;
 cloudSync.textContent='Saving…';
 try{
   const snap=await getDoc(ref);
   const oldStatuses=snap.exists()?((snap.data().statuses)||[]):[];
   const meta={updatedAt:serverTimestamp(),updatedBy:currentUser.uid,updatedByEmail:currentUser.email||''};
   if(!snap.exists()){
     await setDoc(ref,{...p,...meta});
   }else if(canEditStatus()){
     // Replace the complete top-level daily maps. This makes removals persistent.
     await updateDoc(ref,{
       date:p.date,
       dayName:p.dayName,
       statuses:p.statuses||[],
       allotments:p.allotments||{},
       supervisions:p.supervisions||{},
       ...meta
     });
   }else if(canManageProxy()){
     // Proxy Manager changes are written item-by-item.
     // Removing one proxy deletes only that one nested allotment field.
     const cloud=snap.data()||{};
     const cloudA=cloud.allotments||{}, localA=p.allotments||{};
     const cloudS=cloud.supervisions||{}, localS=p.supervisions||{};
     const updates=[];

     const diffMap=(root,oldMap,newMap)=>{
       const keys=new Set([...Object.keys(oldMap),...Object.keys(newMap)]);
       for(const k of keys){
         const before=oldMap[k], after=newMap[k];
         if(after===undefined){
           if(before!==undefined)updates.push(new FieldPath(root,k),deleteField());
         }else if(before===undefined || JSON.stringify(before)!==JSON.stringify(after)){
           updates.push(new FieldPath(root,k),after);
         }
       }
     };

     diffMap('allotments',cloudA,localA);
     diffMap('supervisions',cloudS,localS);

     if(updates.length){
       updates.push(
         new FieldPath('updatedAt'),serverTimestamp(),
         new FieldPath('updatedBy'),currentUser.uid,
         new FieldPath('updatedByEmail'),currentUser.email||''
       );
       await updateDoc(ref,...updates);
     }
   }
   if(canEditStatus()){
     try{await syncPersonalManualStatusesForDate(p.date,oldStatuses,p.statuses||[])}catch(e){console.warn('Personal Leave / OD daily sync:',e)}
     try{await syncApprovedManualStatusesForDate(p.date,p.statuses||[])}catch(e){console.warn('Approved Leave daily sync:',e)}
   }
   homepageLeaveContextCache=null;
   cloudSync.textContent='Synced';
 }finally{
   cloudWriting=false;
 }
}
function queueTodaySync(date=todayKey()){
 if(!currentUser||!canWriteDaily()||cloudHydrating)return;
 const payload=dailyCloudWritePayload(date); // capture the exact local state now
 if(!payload)return;
 clearTimeout(syncTimer);
 cloudWriting=true; // stop polling from restoring stale cloud data during debounce
 syncTimer=setTimeout(()=>pushToday(payload).catch(e=>{
   console.error(e);
   cloudWriting=false;
   cloudSync.textContent='Sync failed';
 }),300);
}
function wrapSaveSnapshot(){if(coreWrapped)return;coreWrapped=true;const original=window.saveSnapshot;window.saveSnapshot=function(...args){const r=original.apply(this,args);queueTodaySync(args[0]||todayKey());return r}}
async function loadTodayAndListen(){
 const ref=doc(db,'dailyRecords',todayKey());
 const first=await getDoc(ref);
 if(first.exists())hydrateDaily(first.data());
 else if(canWriteDaily()){const p=dailyCloudWritePayload();if(p)await setDoc(ref,{...p,updatedAt:serverTimestamp(),updatedBy:currentUser.uid,updatedByEmail:currentUser.email||''},{merge:true});}
 if(todayPollTimer){clearInterval(todayPollTimer);todayPollTimer=null}
 if(publishedPollTimer){clearInterval(publishedPollTimer);publishedPollTimer=null}
 if(accessCheckTimer){clearInterval(accessCheckTimer);accessCheckTimer=null}
 let lastCloudStamp='';
 const poll=async()=>{
   if(!currentUser||cloudWriting)return;
   try{
     const snap=await getDoc(ref);
     if(!snap.exists())return;
     const data=snap.data();
     const stamp=data.updatedAt&&typeof data.updatedAt.toMillis==='function'?String(data.updatedAt.toMillis()):JSON.stringify([data.updatedBy,data.statuses,data.allotments,data.supervisions]);
     if(stamp!==lastCloudStamp){
       lastCloudStamp=stamp;
       hydrateDaily(data);
     }
     cloudSync.textContent='Synced';
   }catch(e){
     console.error(e);
     cloudSync.textContent='Sync retrying…';
   }
 };
 await poll();
 todayPollTimer=setInterval(poll,5000);
}

async function loadPublishedProxyAndListen(){
 const ref=doc(db,'publishedProxy',todayKey());
 const loadOnce=async()=>{
   try{
     const snap=await getDoc(ref);
     const pub=snap.exists()?snap.data():null;
     window.__vkvPublishedProxy=pub;
     if(window.renderPublishedProxy)window.renderPublishedProxy(pub);
     return true;
   }catch(e){
     console.error('Published proxy:',e);
     return false;
   }
 };
 await loadOnce();
 if(publishedPollTimer){clearInterval(publishedPollTimer);publishedPollTimer=null}
 publishedPollTimer=setInterval(loadOnce,5000);
}


async function checkAccessStillActive(){
 if(!currentUser||!currentProfile)return;
 try{
   let allowed=false;
   if(currentProfile.emailViewer){
     const email=String(currentUser.email||'').trim().toLowerCase();
     if(email){
       const snap=await getDoc(doc(db,'viewerEmails',email));
       allowed=snap.exists()&&snap.data().active===true;
     }
   }else{
     const snap=await getDoc(doc(db,'authorizedUsers',currentUser.uid));
     allowed=snap.exists()&&snap.data().active===true;
   }
   if(!allowed){
     if(accessCheckTimer){clearInterval(accessCheckTimer);accessCheckTimer=null}
     showGate();
     setMessage('<b>Access temporarily disabled.</b><br>Please contact the administrator if access should be restored.','error');
   }
 }catch(e){
   // A temporary network failure must never sign a user out.
   console.warn('Access re-check skipped:',e);
 }
}
function startAccessHeartbeat(){
 if(accessCheckTimer){clearInterval(accessCheckTimer);accessCheckTimer=null}
 accessCheckTimer=setInterval(checkAccessStillActive,60000);
}

function applyRoleUI(){
 window.__vkvRole=String(currentProfile&&currentProfile.role||'teacher');

 const role=window.__vkvRole;
 const statusAllowed=canEditStatus();
 const proxyAllowed=canManageProxy();

 // Leave/OD/Vacant form is editable only by Admin/Manager.
 const leaveControls=[
   ...document.querySelectorAll('[data-leave-type]'),
   ...document.querySelectorAll('[data-duration]'),
   ...document.querySelectorAll('[data-leave-date-mode]'),
   document.getElementById('leaveTeacher'),
   document.getElementById('dutyFrom'),
   document.getElementById('dutyTo'),
   document.getElementById('dutyNote'),
   document.getElementById('leaveRangeFrom'),
   document.getElementById('leaveRangeTo'),
   document.getElementById('leaveCalPrev'),
   document.getElementById('leaveCalNext')
 ].filter(Boolean);
 leaveControls.forEach(el=>{el.disabled=!statusAllowed});
 const recordActions=document.querySelector('.recordActions');
 if(recordActions)recordActions.style.display=statusAllowed?'flex':'none';

 // Archived-history deletion is Admin only.
 document.querySelectorAll('button[onclick*="deleteAllHistory"]').forEach(b=>{
   b.style.display=isAdmin()?'inline-block':'none';
 });
 const myStatusBtn=document.getElementById('myStatusBtn');
 if(myStatusBtn){
   // Keep My Leave Record visible. If locked, the page itself explains the lock.
   myStatusBtn.style.display='';
 }
 const myAttendanceBtn=document.getElementById('myAttendanceBtn');
 if(myAttendanceBtn)myAttendanceBtn.style.display='';
 const approvedLeaveBtn=document.getElementById('approvedLeaveBtn');
 if(approvedLeaveBtn)approvedLeaveBtn.style.display=(isAdmin()||role==='leave_viewer')?'inline-block':'none';
 const adminAccessBtn=document.getElementById('adminUserAccessBtn');
 if(adminAccessBtn){
   adminAccessBtn.style.display=isAdmin()?'inline-block':'none';
 }
 const emailViewer=!!currentProfile.emailViewer;
 const leaveViewer=role==='leave_viewer';
 ['historyBtn','leaveOpsBtn','proxyWorkBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=(emailViewer||leaveViewer)?'none':''});

 // Keep the everyday interface uncluttered. Role information is enforced silently.
 const oldNote=document.getElementById('rolePermissionNote');if(oldNote)oldNote.remove();

 // Guard write buttons in the UI. Firestore rules independently enforce the same boundary.
 if(!window.__vkvRoleGuardInstalled){
   window.__vkvRoleGuardInstalled=true;
   document.addEventListener('click',e=>{
     const b=e.target.closest('button');
     if(!b)return;
     const oc=b.getAttribute('onclick')||'';

     const statusActions=['saveStatusRecord','deleteSelectedStatus','deleteTodayStatuses','deleteScheduledPlan','chooseStatus(','chooseDutyDuration(','chooseLeaveDateMode(','changeLeaveCalendarMonth(','syncLeaveRangeInputs'];
     const proxyActions=['attemptProxy(','attemptProxyFromAll','allotProxySimple','removeProxy(','removeProxySimple','removeProxyAndShowAll','assignEmergencyFromButton','allotEmergency','removeEmergency','finaliseProxies('];

     if(statusActions.some(x=>oc.includes(x)) && !canEditStatus()){
       e.preventDefault();e.stopImmediatePropagation();
       alert('This account cannot change Leave / OD / Special Assignment / Vacant Position records.');
       return;
     }
     if(proxyActions.some(x=>oc.includes(x)) && !canManageProxy()){
       e.preventDefault();e.stopImmediatePropagation();
       alert('This account has view-only proxy access.');
       return;
     }
     if(oc.includes('deleteAllHistory') && !isAdmin()){
       e.preventDefault();e.stopImmediatePropagation();
       alert('Only the Admin can delete archived history.');
     }
   },true);
 }

 // For ordinary Teachers, visually disable the proxy allotment mutation buttons after they render.
 document.body.classList.toggle('readOnly',role==='teacher'||role==='leave_viewer');
}

window.finaliseProxyCloud=async function(snapshot){
 if(!currentUser||!canManageProxy())throw new Error('Proxy Manager or Admin access is required.');
 const ref=doc(db,'publishedProxy',snapshot.date),existing=await getDoc(ref),old=existing.exists()?existing.data():null;
 const pub={
   ...snapshot,
   locked:true,
   correctionEnabled:false,
   revision:old?Number(old.revision||1)+1:1,
   correctionHistory:Array.isArray(old&&old.correctionHistory)?old.correctionHistory:[],
   finalizedAtMs:Date.now(),
   finalizedByUid:currentUser.uid,
   finalizedByName:currentUser.displayName||currentProfile.name||currentUser.email||'Authorised user',
   finalizedByEmail:currentUser.email||'',
   updatedAt:serverTimestamp()
 };
 cloudWriting=true;
 try{
   await setDoc(ref,pub);
   const localPub={...pub,updatedAt:null};
   window.__vkvWorkPublishedProxy=localPub;
   if(snapshot.date===todayKey()){window.__vkvPublishedProxy=localPub;if(window.renderPublishedProxy)window.renderPublishedProxy(localPub)}
   return localPub;
 }finally{
   cloudWriting=false;
 }
};

window.enableProxyCorrectionCloud=async function(date,reason){
 if(!currentUser||!isAdmin())throw new Error('Only the Principal can enable correction.');
 const ref=doc(db,'publishedProxy',date),snap=await getDoc(ref);if(!snap.exists())throw new Error('No finalised proxy timetable exists for this date.');
 const old=snap.data(),entry={enabledAtMs:Date.now(),enabledByUid:currentUser.uid,enabledByEmail:currentUser.email||'',reason};
 const history=[...(Array.isArray(old.correctionHistory)?old.correctionHistory:[]),entry].slice(-25);
 await updateDoc(ref,{correctionEnabled:true,locked:false,correctionReason:reason,correctionEnabledAtMs:entry.enabledAtMs,correctionEnabledByUid:entry.enabledByUid,correctionEnabledByEmail:entry.enabledByEmail,correctionHistory:history,updatedAt:serverTimestamp()});
 return {...old,correctionEnabled:true,locked:false,correctionReason:reason,correctionHistory:history};
};

window.authoriseHistoricalProxyCloud=async function(date,reason){
 if(!currentUser||!isAdmin())throw new Error('Only the Principal can authorise an earlier proxy record.');
 if(!date||date>=todayKey())throw new Error('Select an earlier date.');
 const entry={date,enabled:true,reason,enabledAtMs:Date.now(),enabledByUid:currentUser.uid,enabledByName:currentUser.displayName||currentProfile.name||currentUser.email||'Principal',enabledByEmail:currentUser.email||'',updatedAt:serverTimestamp()};
 await setDoc(doc(db,'proxyEditAuthorizations',date),entry);
 const ref=doc(db,'publishedProxy',date),snap=await getDoc(ref);let published=null;
 if(snap.exists()){
   const old=snap.data(),history=[...(Array.isArray(old.correctionHistory)?old.correctionHistory:[]),{enabledAtMs:entry.enabledAtMs,enabledByUid:entry.enabledByUid,enabledByEmail:entry.enabledByEmail,reason,historical:true}].slice(-25);
   await updateDoc(ref,{correctionEnabled:true,locked:false,correctionReason:reason,correctionEnabledAtMs:entry.enabledAtMs,correctionEnabledByUid:entry.enabledByUid,correctionEnabledByEmail:entry.enabledByEmail,correctionHistory:history,updatedAt:serverTimestamp()});
   published={...old,correctionEnabled:true,locked:false,correctionReason:reason,correctionHistory:history};
 }
 return {authorization:{...entry,updatedAt:null},published};
};

window.loadProxyWorkCloud=async function(date){
 if(!currentUser)return;
 const load=async()=>{if(cloudWriting)return;const [daily,published,authorization,todayDaily,leavePlans]=await Promise.all([getDoc(doc(db,'dailyRecords',date)),getDoc(doc(db,'publishedProxy',date)),getDoc(doc(db,'proxyEditAuthorizations',date)),date!==todayKey()?getDoc(doc(db,'dailyRecords',todayKey())):Promise.resolve(null),getDoc(doc(db,'dailyRecords',LEAVE_PLAN_DOC))]);cacheLeavePlans(leavePlans.exists()?(leavePlans.data().plans||{}):{});if(daily.exists())hydrateDaily(daily.data(),date);else hydrateDaily({date,dayName:dayNameForDate(date),statuses:[],allotments:allotData(date),supervisions:supervisionData(date)},date);window.__vkvWorkPublishedProxy=published.exists()?published.data():null;window.__vkvHistoricalProxyAuthorization=authorization.exists()?authorization.data():null;window.__vkvTodayStatusSummary=date===todayKey()?leaveData(date):(todayDaily&&todayDaily.exists()?(todayDaily.data().statuses||[]):[]);if(window.renderTodayProxyStatusSummary)window.renderTodayProxyStatusSummary();if(window.renderProxyLockState)window.renderProxyLockState();if(document.getElementById('allot')?.classList.contains('active'))renderActiveProxyView(true)};
 await load();if(proxyWorkPollTimer){clearInterval(proxyWorkPollTimer);proxyWorkPollTimer=null}if(date!==todayKey())proxyWorkPollTimer=setInterval(()=>load().catch(e=>console.warn('Next-day proxy sync:',e)),10000);
};

async function loadMaster(){const snap=await getDoc(doc(db,'master','current'));if(!snap.exists())return false;const d=snap.data();window.DATA=d.data||d;if(!Array.isArray(window.DATA.temporaryReplacements))window.DATA.temporaryReplacements=[];if(!Array.isArray(window.DATA.nonTeachingStaff))window.DATA.nonTeachingStaff=[];__sanitisedRecordsCache={recordsRef:null,teachersRef:null,value:[]};__operationalRecordsCache={key:'',value:[]};populateMasterSelectors();if(window.applyActiveScheduleProfile)window.applyActiveScheduleProfile();return true}
async function cloudHistoryRender(){
 const inp=document.getElementById('historyDate'),out=document.getElementById('historyResult');if(!inp.value)inp.value=displayDate(todayKey());const selectedDate=inputDate(inp.value);if(!selectedDate){out.innerHTML='<div class="warn">Enter the date as dd/mm/yyyy.</div>';return}inp.value=displayDate(selectedDate);
 try{
   const snap=await getDoc(doc(db,'dailyRecords',selectedDate));
   const h=snap.exists()?snap.data():{date:selectedDate,dayName:dayNameForDate(selectedDate),statuses:[],allotments:{},supervisions:{}};
   const base=h.statuses||[],planned=window.plannedStatusesForDate?window.plannedStatusesForDate(inp.value):[];
   const seen=new Set(base.map(x=>x&&x.code).filter(Boolean));
   const sts=[...base,...planned.filter(x=>x&&x.code&&!seen.has(x.code))];
   const als=Object.values(h.allotments||{}).sort((a,b)=>a.period-b.period),sups=Object.values(h.supervisions||{}).sort((a,b)=>a.period-b.period);
   if(!snap.exists()&&!sts.length){out.innerHTML='No saved record for this date.';return}
   const editable=canEditStatus();
   const statusHtml=sts.length?sts.map(o=>{
     let t=teacherByEffectiveCode(o.code,selectedDate),rep=activeReplacementForOriginal(o.code,selectedDate);
     const cover=rep?' · <b>Covered by '+safe(rep.tempName||rep.tempCode)+(rep.tempCode?' ('+safe(rep.tempCode)+')':'')+'</b>':'';
     const edit=(editable&&o.planned&&o.planId)?' <button style="margin-left:8px;padding:5px 9px" onclick="editScheduledPlanFromHistory(\''+String(o.planId).replace(/'/g,'&#39;')+'\')">✏️ Edit / Dates</button>':'';
     return '<div style="margin:7px 0">'+safe(t?t.name:o.code)+' ('+safe(o.code)+') — '+safe(statusLabel(o))+(o.planned?' · Scheduled':'')+cover+edit+'</div>';
   }).join(''):'None';
   out.innerHTML='<b>'+safe(displayDate(selectedDate))+' · '+safe(h.dayName||dayNameForDate(selectedDate))+'</b><h3>Leave / OD / Special Assignment / Vacant</h3>'+statusHtml+'<h3>Normal Proxy Allotments</h3>'+(als.length?als.map(x=>'<div>'+PL(x.period)+' — '+safe(x.name)+' ('+safe(x.code)+')</div>').join(''):'None')+'<h3>Emergency Supervision</h3>'+(sups.length?sups.map(x=>'<div>'+PL(x.period)+' — '+safe(x.name)+' ('+safe(x.code)+')</div>').join(''):'None');
 }catch(e){out.innerHTML='<div class="warn">Cloud history could not be loaded: '+safe(e.message||e)+'</div>'}
}
window.renderHistory=cloudHistoryRender;
window.deleteAllHistory=async function(){if(!isAdmin()){alert('Only an Admin can delete history.');return}if(!confirm("Delete ALL archived history except today's live working record and today's final proxy? This cannot be undone."))return;const today=todayKey();const daily=await getDocs(collection(db,'dailyRecords'));let batch=writeBatch(db),count=0;for(const d of daily.docs){if(d.id!==today&&d.id!==LEAVE_PLAN_DOC){batch.delete(d.ref);count++;if(count===450){await batch.commit();batch=writeBatch(db);count=0}}}if(count)await batch.commit();const pubs=await getDocs(collection(db,'publishedProxy'));batch=writeBatch(db);count=0;for(const d of pubs.docs){if(d.id!==today){batch.delete(d.ref);count++;if(count===450){await batch.commit();batch=writeBatch(db);count=0}}}if(count)await batch.commit();localStorage.removeItem('vkvHistory');document.getElementById('historyResult').innerHTML='<div class="slotComplete">Archived history deleted. Today\'s live working record, today\'s final proxy and scheduled leave entries are unchanged.</div>'};


function normalizePersonName(v){
 return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function resolveMyTeacherCode(user,profile,masterData){
 const teachers=Array.isArray(masterData&&masterData.teachers)?masterData.teachers:[];
 const nonTeaching=Array.isArray(masterData&&masterData.nonTeachingStaff)?masterData.nonTeachingStaff.filter(x=>x&&x.active!==false):[];
 const reps=Array.isArray(masterData&&masterData.temporaryReplacements)?masterData.temporaryReplacements:[];
 const personalStaff=[...teachers,...nonTeaching];
 const knownCode=c=>personalStaff.some(t=>String(t.code)===String(c))||reps.some(r=>String(r&&r.tempCode)===String(c));
 const explicit=String((profile&&(profile.teacherCode||profile.teacher_code||profile.code||profile.teacherId))||'').trim();
 if(explicit&&knownCode(explicit))return explicit;
 const email=String((user&&user.email)||profile&&profile.email||'').trim().toLowerCase();
 if(email){
   const emailMatches=personalStaff.filter(t=>{
     const vals=[t.email,t.gmail,t.googleEmail,t.google_email].concat(Array.isArray(t.emails)?t.emails:[]);
     return vals.some(v=>String(v||'').trim().toLowerCase()===email);
   });
   if(emailMatches.length===1)return String(emailMatches[0].code);
   const map=masterData&&masterData.teacherEmailMap||{};
   const mapped=Object.entries(map).find(([c,e])=>String(e||'').trim().toLowerCase()===email&&knownCode(c));
   if(mapped)return String(mapped[0]);
 }
 const names=[profile&&profile.teacherName,profile&&profile.name,user&&user.displayName].map(normalizePersonName).filter(Boolean);
 for(const n of names){
   const exact=personalStaff.filter(t=>normalizePersonName(t.name)===n);
   if(exact.length===1)return String(exact[0].code);
   const temp=reps.filter(r=>normalizePersonName(r&&r.tempName)===n&&r&&r.tempCode);
   if(temp.length===1)return String(temp[0].tempCode);
 }
 return '';
}
window.loadMyProxyToday=async function(){
 const out=document.getElementById('myProxyTodayResult');
 if(!currentUser){if(out)out.innerHTML='<div class="warn">Please sign in again.</div>';return}
 try{
   const snap=await getDoc(doc(db,'publishedProxy',todayKey()));
   const pub=snap.exists()?snap.data():null;
   window.__vkvPublishedProxy=pub&&pub.date===todayKey()?pub:null;
   if(window.renderMyProxyTodayFromPublished)window.renderMyProxyTodayFromPublished(window.__vkvPublishedProxy);
 }catch(e){
   if(out)out.innerHTML='<div class="warn">Today’s published proxy could not be checked: '+safe(e&&e.message?e.message:String(e))+'</div>';
 }
};
window.loadMyProxyHistoryCloud=async function(){
 const out=document.getElementById('myProxyHistoryResult'),msg=document.getElementById('myProxyHistoryMsg');
 const code=String(window.__vkvMyTeacherCode||'').trim();
 if(!code){if(out)out.innerHTML=window.myLinkMissingHtml?window.myLinkMissingHtml():'Teacher link unavailable.';if(msg)msg.textContent='';return}
 const fromEl=document.getElementById('myProxyHistoryFrom'),toEl=document.getElementById('myProxyHistoryTo'),from=fromEl&&fromEl.value?inputDate(fromEl.value):'',to=toEl&&toEl.value?inputDate(toEl.value):todayKey();
 if((fromEl&&fromEl.value&&!from)||(toEl&&toEl.value&&!to)){if(out)out.innerHTML='<div class="warn">Enter dates as dd/mm/yyyy.</div>';if(msg)msg.textContent='';return}
 if(fromEl&&from)fromEl.value=displayDate(from);if(toEl&&to)toEl.value=displayDate(to);
 if(from&&to&&from>to){if(out)out.innerHTML='<div class="warn">From Date cannot be later than To Date.</div>';if(msg)msg.textContent='';return}
 try{
   const qs=await getDocs(collection(db,'publishedProxy'));
   const items=[];
   qs.forEach(d=>{
     const date=d.id,data=d.data()||{};
     if(date>=todayKey())return;
     if(from&&date<from)return;
     if(to&&date>to)return;
     const rows=(Array.isArray(data.rows)?data.rows:[]).filter(x=>String(x.assignedCode||'')===code);
     rows.forEach(x=>items.push({date,dayName:data.dayName||'',...x}));
   });
   items.sort((a,b)=>String(b.date).localeCompare(String(a.date))||Number(a.period)-Number(b.period));
   if(!items.length){
     if(out)out.innerHTML='<div class="slotComplete">No past published proxy duty was found for you in this date range.</div>';
     if(msg)msg.textContent='';return;
   }
   const dayCount=new Set(items.map(x=>x.date)).size;
   if(out)out.innerHTML='<div class="slotComplete"><b>Total Proxy Periods: '+items.length+'</b> · '+dayCount+' day'+(dayCount===1?'':'s')+'</div>'+
     '<div class="table"><table><tr><th>Date</th><th>Day</th><th>Period / Time</th><th>Class</th><th>Proxy For / Reason</th><th>Duty</th></tr>'+
     items.map(x=>'<tr><td>'+safe(displayDate(x.date))+'</td><td>'+safe(x.dayName)+'</td><td>'+PL(Number(x.period))+'<br>'+safe(x.time||'')+'</td><td>'+safe(x.className||'')+'</td><td>'+safe(x.absentTeacher||'')+' ('+safe(x.absentCode||'')+')<br><span class="small">'+safe(x.reason||'')+'</span></td><td>'+safe(x.kind||'Normal Proxy')+'</td></tr>').join('')+
     '</table></div>';
   if(msg)msg.textContent=items.length+' period'+(items.length===1?'':'s');
 }catch(e){
   if(out)out.innerHTML='<div class="warn">Past proxy history could not be loaded: '+safe(e&&e.message?e.message:String(e))+'</div>';
   if(msg)msg.textContent='';
 }
};
window.loadMyStatusCloud=async function(){
 const out=document.getElementById('myStatusResult'),msg=document.getElementById('myStatusMsg');
 if(window.__vkvLeaveHistoryVisible===false){
   if(out)out.innerHTML='<div class="warn"><b>My Leave History is temporarily unavailable.</b><br>Historical leave reconciliation is still pending. The Principal/Admin Leave Master Editor remains available to the administrator.</div>';
   if(msg)msg.textContent='Temporarily locked';
   return;
 }
 const code=String(window.__vkvMyTeacherCode||'').trim(),email=normalizedEmail(currentUser&&currentUser.email);
 if(!code){if(out)out.innerHTML=window.myLinkMissingHtml?window.myLinkMissingHtml():'Teacher link unavailable.';if(msg)msg.textContent='';return}
 if(!email){if(out)out.innerHTML='<div class="warn">Your signed-in Google email could not be read.</div>';if(msg)msg.textContent='';return}
 try{
   const qs=await getDocs(collection(db,'personalStatus',email,'records'));
   const plans=new Map(),manual=[];
   qs.forEach(d=>{
     const data=d.data()||{},date=data.date||d.id;
     const m=data.manualStatus;
     if(m&&PERSONAL_STATUS_TYPES.has(String(m.type||''))&&String(m.code||data.teacherCode||'')===code)manual.push({...m,date,kind:'manual'});
     Object.values(data.scheduledPlans||{}).forEach(p=>{
       if(!p||p.active===false||!PERSONAL_STATUS_TYPES.has(String(p.type||''))||String(p.code||'')!==code)return;
       const id=String(p.id||'');if(id&&!plans.has(id))plans.set(id,{...p,kind:'scheduled'});
     });
   });
   // Complete-history fallback: personal projections are convenient but older approved dated records
   // may pre-date projection creation. Merge surviving authoritative dailyRecords for this staff code.
   try{
     const ds=await getDocs(collection(db,'dailyRecords'));
     const seenManual=new Set(manual.map(x=>[x.date,x.type,x.code||code,x.fromPeriod||'',x.toPeriod||'',x.leaveCategory||''].join('|')));
     ds.forEach(d=>{
       if(d.id===LEAVE_PLAN_DOC)return;
       const data=d.data()||{},date=data.date||d.id;
       (data.statuses||[]).forEach(m=>{
         if(!m||!PERSONAL_STATUS_TYPES.has(String(m.type||''))||String(m.code||'')!==code)return;
         const k=[date,m.type,m.code||code,m.fromPeriod||'',m.toPeriod||'',m.leaveCategory||''].join('|');
         if(seenManual.has(k))return;seenManual.add(k);manual.push({...m,date,kind:'manual',source:m.source||'daily'});
       });
     });
   }catch(e){console.warn('My Leave complete-history fallback:',e)}
   const items=[...plans.values(),...manual];
   const today=todayKey();
   const stateOf=x=>{
     if(x.kind==='manual')return x.date===today?'current':(x.date>today?'upcoming':'past');
     const ds=planDateKeys(x);if(ds.includes(today))return 'current';
     if(ds.some(d=>d>today))return 'upcoming';return 'past';
   };
   const dateSortKey=x=>x.kind==='manual'?(x.date||''):(x.startDate||x.date||((x.dates||[]).slice().sort()[0])||'');
   const dateText=x=>{
     if(x.kind==='manual')return displayDate(x.date);
     if(x.mode==='multiple'){const ds=(x.dates||[]).slice().sort();return ds.length<=5?ds.map(displayDate).join(' · '):(ds.slice(0,5).map(displayDate).join(' · ')+' · +'+(ds.length-5)+' more');}
     const a=x.startDate||x.date||'',b=x.endDate||a;return a===b?displayDate(a):(displayDate(a)+' → '+displayDate(b));
   };
   const labelOf=x=>window.statusLabel?window.statusLabel(x):(x.type||'Status');
   const leaveItems=items.filter(x=>['full','half'].includes(String(x.type||''))),dutyItems=items.filter(x=>['od','special'].includes(String(x.type||'')));
   const stateLabel=x=>{const s=stateOf(x);return s==='current'?'Current':s==='upcoming'?'Upcoming':'Past'};
   const categorySection=(title,arr,empty)=>'<h3 style="margin:16px 0 7px">'+title+'</h3>'+(arr.length?'<div class="table"><table><tr><th>State</th><th>Status</th><th>Category</th><th>Leave Days</th><th>Date(s)</th><th>Remarks</th></tr>'+arr.sort((a,b)=>dateSortKey(b).localeCompare(dateSortKey(a))).map(x=>'<tr><td>'+safe(stateLabel(x))+'</td><td>'+safe(labelOf(x))+'</td><td>'+safe(x.leaveCategory?leaveCategoryLabel(x.leaveCategory):'—')+'</td><td>'+safe((x.type==='full'||x.type==='half')?(x.leaveUnits||'—'):'—')+'</td><td>'+safe(dateText(x))+'</td><td>'+safe(x.note||'—')+'</td></tr>').join('')+'</table></div>':'<div class="small">'+empty+'</div>');
   if(!items.length){
     out.innerHTML='<div class="slotComplete">No approved Leave or Duty Leave record is available for you yet.</div><div class="small">If an older approved record is missing, the Admin can run “Sync My Area Records” once from User Access & Roles.</div>';
   }else{
     out.innerHTML='<div class="slotComplete"><b>'+items.length+' approved record'+(items.length===1?'':'s')+' available.</b> Leave and Duty Leave are shown separately.</div>'+categorySection('Leave History',leaveItems,'No approved Leave history.')+categorySection('Duty Leave History',dutyItems,'No approved Duty Leave history.');
   }
   if(msg)msg.textContent='Updated';
 }catch(e){
   if(out)out.innerHTML='<div class="warn">Your personal Leave / OD / Special Assignment record could not be loaded: '+safe(e&&e.message?e.message:String(e))+'<br><br>If this is the first time this button is being used, the Admin needs to publish the v54.6 Firestore Rules and run “Sync My Area Records” once.</div>';
   if(msg)msg.textContent='';
 }
};


window.exportLeaveExcelCloud=async function(){
 if(!currentUser||!canEditStatus()){alert('Admin or Manager access is required to export the school leave register.');return}
 if(!window.XLSX){alert('Excel export library is still loading. Please try again in a moment.');return}
 const btn=document.getElementById('exportLeaveExcelBtn'),oldText=btn?btn.textContent:'';if(btn){btn.disabled=true;btn.textContent='Preparing Excel…'}
 try{
   const qs=await getDocs(collection(db,'dailyRecords')),scheduled=[],manual=[];
   qs.forEach(d=>{const data=d.data()||{};if(d.id===LEAVE_PLAN_DOC){Object.values(data.plans||{}).forEach(p=>{if(p&&p.active!==false&&PERSONAL_STATUS_TYPES.has(String(p.type||'')))scheduled.push({...p,_source:'Scheduled / Imported'})});return}const date=data.date||d.id;(data.statuses||[]).forEach(x=>{if(x&&PERSONAL_STATUS_TYPES.has(String(x.type||'')))manual.push({...x,date,_source:'Daily record'})})});
   const teacherName=code=>{const t=teacherByEffectiveCode(code)||permanentTeacherByCode(code);return t?t.name:String(code||'')};
   const leaveUnits=x=>{if(Number(x.leaveUnits)>0)return Number(x.leaveUnits);const count=x._source==='Daily record'?1:planDateKeys(x).length;if(x.type==='half')return count*0.5;if(x.type==='full')return count;return 0};
   const recs=[];
   for(const x of scheduled){const ds=planDateKeys(x),start=x.startDate||x.date||(ds[0]||''),end=x.endDate||start||(ds[ds.length-1]||'');recs.push({code:String(x.code||''),name:teacherName(x.code),type:String(x.type||''),status:statusLabel(x),category:String(x.leaveCategory||''),units:leaveUnits(x),from:displayDate(start),to:displayDate(end),specific:x.mode==='multiple'?(x.dates||[]).map(displayDate).join(', '):'',duration:x.duration||'',periods:x.duration==='custom'?`P${x.from}–P${x.to}`:(x.duration==='half'?'P5–P8':''),note:x.note||'',reference:x.referenceNo||'',source:x._source})}
   for(const x of manual){recs.push({code:String(x.code||''),name:teacherName(x.code),type:String(x.type||''),status:statusLabel(x),category:String(x.leaveCategory||''),units:leaveUnits(x),from:displayDate(x.date||''),to:displayDate(x.date||''),specific:'',duration:x.duration||'',periods:(x.from||x.to)?`P${x.from||1}–P${x.to||8}`:'',note:x.note||'',reference:x.referenceNo||'',source:x._source})}
   recs.sort((a,b)=>String(a.from).localeCompare(String(b.from))||a.name.localeCompare(b.name));
   const wb=XLSX.utils.book_new();
   const history=[['Teacher Code','Teacher Name','Status','Leave Category','Leave Days','From Date','To Date','Specific Dates','Duration / Periods','Remarks','Reference No.','Source'],...recs.map(r=>[r.code,r.name,r.status,r.category?leaveCategoryLabel(r.category):'',r.units||'',r.from,r.to,r.specific,[r.duration,r.periods].filter(Boolean).join(' · '),r.note,r.reference,r.source])];
   const hws=XLSX.utils.aoa_to_sheet(history);hws['!freeze']={xSplit:0,ySplit:1};hws['!cols']=[{wch:13},{wch:25},{wch:24},{wch:25},{wch:11},{wch:12},{wch:12},{wch:28},{wch:18},{wch:32},{wch:18},{wch:18}];XLSX.utils.book_append_sheet(wb,hws,'Leave_History');
   const cats=['VL','EL','CL','SEL','EOL','MATERNITY'],sum=new Map();
   for(const r of recs){if(!(r.type==='full'||r.type==='half'))continue;const k=r.code||r.name;if(!sum.has(k))sum.set(k,{code:r.code,name:r.name,VL:0,EL:0,CL:0,SEL:0,EOL:0,MATERNITY:0,UNCAT:0});const o=sum.get(k),c=cats.includes(r.category)?r.category:'UNCAT';o[c]+=Number(r.units||0)}
   const srows=[['Teacher Code','Teacher Name','VL Used','EL Used','CL Used','CL Balance (12)','SEL Used','SEL Balance (10)','EOL Used','Maternity Used','Uncategorised','Total Leave Used'],...([...sum.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(o=>[o.code,o.name,o.VL,o.EL,o.CL,12-o.CL,o.SEL,10-o.SEL,o.EOL,o.MATERNITY,o.UNCAT,o.VL+o.EL+o.CL+o.SEL+o.EOL+o.MATERNITY+o.UNCAT]))];
   const sws=XLSX.utils.aoa_to_sheet(srows);sws['!freeze']={xSplit:0,ySplit:1};sws['!cols']=[{wch:13},{wch:25},...Array(10).fill({wch:16})];XLSX.utils.book_append_sheet(wb,sws,'Leave_Summary');
   const months=new Map();for(const r of recs){if(!(r.type==='full'||r.type==='half')||!r.from)continue;let dates=[];if(r.specific)dates=String(r.specific).split(',').map(x=>x.trim()).filter(Boolean);else if(r.from&&r.to){for(let d=dateFromKey(r.from),last=dateFromKey(r.to);d<=last;d.setDate(d.getDate()+1))dates.push(dateKeyFromDate(d))}if(!dates.length)dates=[r.from];const perDate=Number(r.units||0)/(dates.length||1),c=cats.includes(r.category)?r.category:'UNCAT';for(const date of dates){const month=String(date).slice(0,7),key=(r.code||r.name)+'|'+month;if(!months.has(key))months.set(key,{code:r.code,name:r.name,month,VL:0,EL:0,CL:0,SEL:0,EOL:0,MATERNITY:0,UNCAT:0});months.get(key)[c]+=perDate}}
   const mrows=[['Month','Teacher Code','Teacher Name','VL','EL','CL','SEL','EOL','Maternity','Uncategorised'],...([...months.values()].sort((a,b)=>a.month.localeCompare(b.month)||a.name.localeCompare(b.name)).map(o=>[o.month,o.code,o.name,o.VL,o.EL,o.CL,o.SEL,o.EOL,o.MATERNITY,o.UNCAT]))];const mws=XLSX.utils.aoa_to_sheet(mrows);mws['!freeze']={xSplit:0,ySplit:1};mws['!cols']=[{wch:11},{wch:13},{wch:25},...Array(7).fill({wch:14})];XLSX.utils.book_append_sheet(wb,mws,'Monthly_Summary');
   const notes=XLSX.utils.aoa_to_sheet([['VKV Nalbari Leave Register Export'],['Generated',displayDateTime()],[],['Leave account logic'],['CL entitlement','12 days per year'],['SEL entitlement','10 days per year'],['VL / EL / Maternity','As per VKSPV / applicable school rules; export reports usage but does not assume a universal entitlement.'],['EOL','Usage reported; no fixed entitlement assumed.'],[],['Important'],['The app stores operational status (Leave / OD / Special) separately from leave-account category (VL / EL / CL / SEL / EOL / Maternity). This prevents duplicate maintenance of a timetable record and a separate leave spreadsheet.']]);XLSX.utils.book_append_sheet(wb,notes,'Notes');
   XLSX.writeFile(wb,'VKV_Nalbari_Leave_Register_'+todayKey()+'.xlsx');
 }catch(e){alert('Leave export failed: '+(e&&e.message?e.message:e))}finally{if(btn){btn.disabled=false;btn.textContent=oldText||'⬇ Export Leave Register (Excel)'}}
};
onAuthStateChanged(auth,async user=>{
 currentUser=user;currentProfile=null;
 loginBtn.style.display='inline-block';copyUidBtn.style.display='none';signOutBtn.style.display='none';
 if(todayPollTimer){clearInterval(todayPollTimer);todayPollTimer=null}
 if(leavePlanPollTimer){clearInterval(leavePlanPollTimer);leavePlanPollTimer=null}
 if(schedulePollTimer){clearInterval(schedulePollTimer);schedulePollTimer=null}
 if(!user){
   showGate();
   setMessage('Private school application. Sign in with an authorised Google account.');
   return;
 }
 loginBtn.style.display='none';signOutBtn.style.display='inline-block';

 try{
   setMessage('<b>Step 1/3:</b> Verifying authorised access…');
   const profSnap=await withTimeout(getDoc(doc(db,'authorizedUsers',user.uid)),12000,'Privileged authorisation check');
   if(profSnap.exists()&&profSnap.data().active===true){
     currentProfile=profSnap.data();
   }else{
     const email=String(user.email||'').trim().toLowerCase();
     if(email){
       try{
         const viewerSnap=await withTimeout(getDoc(doc(db,'viewerEmails',email)),12000,'Viewer email authorisation check');
         if(viewerSnap.exists()&&viewerSnap.data().active===true){
           currentProfile={...viewerSnap.data(),active:true,role:(viewerSnap.data().role==='leave_viewer'?'leave_viewer':'teacher'),name:user.displayName||viewerSnap.data().name||'',email:email,emailViewer:true};
         }
       }catch(e){
         console.warn('Viewer email check:',e);
       }
     }
   }
   if(!currentProfile){pendingAccess(user);return}

   setMessage('<b>Step 2/3:</b> Authorisation successful. Loading master timetable…');
   const roleLabel=currentProfile.emailViewer?'VIEWER':String(currentProfile.role||'teacher').toUpperCase();
   cloudUser.textContent=(user.displayName||user.email||'User')+' · '+roleLabel;
   cloudSync.textContent='Loading school data…';

   const snap=await withTimeout(getDoc(doc(db,'master','current')),15000,'Master timetable load');
   if(!snap.exists()){
     showGate();loginBtn.style.display='none';copyUidBtn.style.display='none';signOutBtn.style.display='inline-block';
     setMessage('<b>Authorisation successful.</b><br>The master timetable has not yet been uploaded to Firestore.'+(isAdmin()?'<br><br><a href="admin-import.html?v=66.0">Open Admin Importer</a> to upload the private timetable seed.':''),'error');
     return;
   }
   const masterDoc=snap.data();
   window.DATA=masterDoc.data||masterDoc;
   if(!Array.isArray(window.DATA.nonTeachingStaff))window.DATA.nonTeachingStaff=[];
   __sanitisedRecordsCache={recordsRef:null,teachersRef:null,value:[]};__operationalRecordsCache={key:'',value:[]};
   window.DATA.teacherEmailMap=window.DATA.teacherEmailMap||{};
   if(currentProfile&&currentProfile.teacherCode&&user.email)window.DATA.teacherEmailMap[String(currentProfile.teacherCode)]=normalizedEmail(user.email);
   window.__vkvMyTeacherCode=resolveMyTeacherCode(user,currentProfile,window.DATA);
   window.__vkvMyTeacherName=(teacherByEffectiveCode(window.__vkvMyTeacherCode||'',todayKey())||{}).name||'';
   populateMasterSelectors();
   if(window.applyActiveScheduleProfile)window.applyActiveScheduleProfile();
   if(window.refreshMyAreaIdentity)window.refreshMyAreaIdentity();

   setMessage('<b>Step 3/3:</b> Master timetable loaded. Opening app…');
   if(currentProfile.emailViewer||currentProfile.role==='leave_viewer'){
     try{
       localStorage.removeItem('vkvLeave2_'+todayKey());
       localStorage.removeItem('vkvAllotments_'+todayKey());
       localStorage.removeItem('vkvSupervision_'+todayKey());
       localStorage.removeItem('vkvHistory');
       localStorage.removeItem('vkvLeavePlansCache');
       window.__vkvLeavePlans={};
     }catch(e){}
   }
   window.__vkvLeaveHistoryVisible=null;
   getDoc(doc(db,'leaveControl','current')).then(lc=>{
     window.__vkvLeaveHistoryVisible=lc.exists()&&lc.data().myAreaLeaveHistoryVisible===true;
     if(window.refreshMyAreaIdentity)window.refreshMyAreaIdentity();
     applyRoleUI();
   }).catch(e=>console.warn('Leave-history visibility control:',e));
   wrapSaveSnapshot();
   applyRoleUI();
   applyAnnualCalendarVisibility();

   try{
     cloudHydrating=true;
     window.initializeVKVCore();
   }finally{
     cloudHydrating=false;
   }

   // IMPORTANT: open the working timetable immediately.
   // Daily cloud synchronisation must never block access to the app.
   openApp();
   cloudSync.textContent='App ready · starting cloud sync…';
   startAccessHeartbeat();
   startSchedulePolling();

   loadPublishedProxyAndListen().catch(e=>console.error('Published proxy sync:',e));
   if(currentProfile.emailViewer||currentProfile.role==='leave_viewer'){
     cloudSync.textContent=currentProfile.role==='leave_viewer'?'Approved Leave Viewer ready':'Viewer ready · final proxy sync active';
   }else{
     loadLeavePlansAndPoll().catch(e=>console.error('Scheduled leave sync:',e));
     loadTodayAndListen()
       .then(()=>{cloudSync.textContent='Synced'})
       .catch(e=>{
         console.error('Daily cloud sync:',e);
         cloudSync.textContent='App ready · daily sync unavailable';
       });
   }

 }catch(e){
   console.error('Startup error:',e);
   showGate();
   loginBtn.style.display='none';
   copyUidBtn.style.display='inline-block';
   signOutBtn.style.display='inline-block';
   setMessage('<b>Startup stopped.</b><br>'+safe(e&&e.message?e.message:String(e))+'<br><br>Please send a screenshot of this exact message.','error');
 }
});


/* v66.2 authoritative personal leave history override */
window.loadMyStatusCloud=async function(){
 const out=document.getElementById('myStatusResult'),msg=document.getElementById('myStatusMsg');
 const code=String(window.__vkvMyTeacherCode||'').trim();
 if(!code){if(out)out.innerHTML=window.myLinkMissingHtml?window.myLinkMissingHtml():'Staff link unavailable.';if(msg)msg.textContent='';return}
 if(msg)msg.textContent='Loading complete approved history…';
 const TYPES=new Set(['full','half','od','special']);
 const today=(()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`})();
 const fmt=k=>{const m=String(k||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(k||'')};
 const dateObj=k=>{const a=String(k||'').split('-').map(Number);return new Date(a[0]||1970,(a[1]||1)-1,a[2]||1)};
 const dateKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const planDates=p=>{if(!p)return[];if(p.mode==='multiple')return[...new Set((p.dates||[]).filter(Boolean))].sort();const a=String(p.startDate||p.date||''),b=String(p.endDate||a);if(!a)return[];const z=[];for(let d=dateObj(a),e=dateObj(b);d<=e;d.setDate(d.getDate()+1))z.push(dateKey(d));return z};
 const state=d=>d>today?'Upcoming':d===today?'Current':'Past';
 const label=x=>x.type==='full'?'Full Leave':x.type==='half'?'Half Leave':x.type==='od'?'On Duty (OD)':x.type==='special'?'Special Assignment':String(x.type||'');
 const cat=x=>String(x.leaveCategory||x.category||'—');
 const units=x=>x.leaveUnits!=null?x.leaveUnits:(x.type==='half'?0.5:(x.type==='full'?1:'—'));
 const remarks=x=>String(x.note||x.remarks||x.reason||'—');
 try{
   const source=await getDocs(collection(db,'dailyRecords')),rows=[],seen=new Set();
   const add=(x,date,sourceName)=>{if(!x||!TYPES.has(String(x.type||''))||String(x.code||'')!==code||!date)return;const key=[date,x.type,cat(x),remarks(x),String(x.id||''),sourceName].join('|');if(seen.has(key))return;seen.add(key);rows.push({...x,date,_source:sourceName})};
   source.forEach(d=>{const x=d.data()||{};if(d.id==='__leavePlans'){Object.values(x.plans||{}).forEach(p=>{if(!p||p.active===false||!TYPES.has(String(p.type||''))||String(p.code||'')!==code)return;planDates(p).forEach(date=>add(p,date,'Scheduled / Imported'))});return}const date=x.date||d.id;(x.statuses||[]).forEach(r=>add(r,date,'Daily'))});
   rows.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.type).localeCompare(String(b.type)));
   const leave=rows.filter(x=>['full','half'].includes(String(x.type))),duty=rows.filter(x=>['od','special'].includes(String(x.type)));
   const table=(title,arr)=>{if(!arr.length)return '<h3>'+title+'</h3><div class="small">No approved '+(title.startsWith('Duty')?'Duty Leave':'Leave')+' history.</div>';return '<h3>'+title+'</h3><div class="table"><table><thead><tr><th>State</th><th>Status</th><th>Category</th><th>Leave Days</th><th>Date(s)</th><th>Remarks</th></tr></thead><tbody>'+arr.map(x=>'<tr><td>'+safe(state(x.date))+'</td><td>'+safe(label(x))+'</td><td>'+safe(['full','half'].includes(String(x.type))?cat(x):'—')+'</td><td>'+safe(['full','half'].includes(String(x.type))?units(x):'—')+'</td><td>'+safe(fmt(x.date))+'</td><td>'+safe(remarks(x))+'</td></tr>').join('')+'</tbody></table></div>'};
   if(out)out.innerHTML='<div class="status ok"><b>'+rows.length+' approved dated record'+(rows.length===1?'':'s')+' available.</b> Leave and Duty Leave are shown separately.</div>'+table('Leave History',leave)+table('Duty Leave History',duty);
   if(msg)msg.textContent='Updated';
 }catch(e){if(out)out.innerHTML='<div class="warn"><b>Could not load complete approved history.</b><br>'+safe(e&&e.message?e.message:String(e))+'</div>';if(msg)msg.textContent=''}
};
