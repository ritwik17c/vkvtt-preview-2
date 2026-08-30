var DATA=null; const DAYS=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const E=id=>document.getElementById(id); const esc=s=>String(s??"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const PL=p=>({1:"1st",2:"2nd",3:"3rd"}[p]||p+"th")+" Period";
function show(id,b){if(id==="leave")proxyWorkDate=todayKey();document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".nav button,.quick button,.myGrid button,.opsGrid button").forEach(x=>x.classList.remove("active"));E(id).classList.add("active");if(b)b.classList.add("active");}
function activeScheduleProfile(){
 const profiles=(DATA&&DATA.scheduleProfiles)||{};
 const id=(DATA&&DATA.activeScheduleProfileId)||"normal";
 return profiles[id]||profiles.normal||null;
}
function activeScheduleId(){return (DATA&&DATA.activeScheduleProfileId)||"normal"}
function activeScheduleName(){const p=activeScheduleProfile();return p&&p.name?p.name:(activeScheduleId()==="normal"?"Normal Schedule":"Active Schedule")}
function scheduleTime(p){
 const prof=activeScheduleProfile(),key=String(Number(p));
 let v="";
 if(prof&&prof.times){v=prof.times[key]??prof.times[Number(p)]??""}
 if(!v&&DATA&&DATA.times){v=DATA.times[key]??DATA.times[Number(p)]??""}
 return String(v||"");
}
function classActivePeriods(cls){
 const prof=activeScheduleProfile();
 if(prof&&prof.classPeriods&&Array.isArray(prof.classPeriods[cls]))return [...new Set(prof.classPeriods[cls].map(Number).filter(Boolean))].sort((a,b)=>a-b);
 if(DATA&&DATA.patterns&&Array.isArray(DATA.patterns[cls]))return [...new Set(DATA.patterns[cls].map(Number).filter(Boolean))].sort((a,b)=>a-b);
 return [...new Set(((DATA&&DATA.records)||[]).filter(r=>r.class===cls).map(r=>Number(r.period)).filter(Boolean))].sort((a,b)=>a-b);
}
function isClassPeriodActive(cls,p){return classActivePeriods(cls).includes(Number(p))}
function isOperationalRecord(r){return !!r&&isClassPeriodActive(r.class,Number(r.period))}
function teacherCodesForRecord(r){
 const out=[],seen=new Set(),add=c=>{c=String(c||"").trim();if(c&&!seen.has(c)&&permanentTeacherByCode(c)){seen.add(c);out.push(c)}};
 if(Array.isArray(r&&r.codes))r.codes.forEach(add);
 if(Array.isArray(r&&r.teacherCodes))r.teacherCodes.forEach(add);
 [r&&r.teacherCode,r&&r.code].forEach(add);
 const entry=String(r&&r.entry||"");
 const codes=((DATA&&DATA.teachers)||[]).map(t=>String(t.code||"")).filter(Boolean).sort((a,b)=>b.length-a.length);
 for(const code of codes){
   const q=code.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
   if(new RegExp("(^|[^A-Za-z0-9])"+q+"(?=$|[^A-Za-z0-9])").test(entry))add(code);
 }
 return out;
}
function sanitiseMasterRecord(r){return {...r,codes:teacherCodesForRecord(r)}}
let __sanitisedRecordsCache={recordsRef:null,teachersRef:null,value:[]};
function sanitisedMasterRecords(){
 const records=(DATA&&DATA.records)||[],teachers=(DATA&&DATA.teachers)||[];
 if(__sanitisedRecordsCache.recordsRef===records&&__sanitisedRecordsCache.teachersRef===teachers)return __sanitisedRecordsCache.value;
 const value=records.map(sanitiseMasterRecord);
 __sanitisedRecordsCache={recordsRef:records,teachersRef:teachers,value};
 return value;
}
function temporaryReplacementRecords(){return Array.isArray(DATA&&DATA.temporaryReplacements)?DATA.temporaryReplacements:[]}
function replacementAppliesToDate(r,date=todayKey()){
 if(!r||r.active===false||!r.originalCode||!r.tempCode||!date)return false;
 const s=String(r.startDate||""),e=String(r.endDate||s);
 return !!s&&date>=s&&date<=e;
}
function activeTemporaryReplacements(date=todayKey()){return temporaryReplacementRecords().filter(r=>replacementAppliesToDate(r,date))}
function activeReplacementForOriginal(code,date=todayKey()){return activeTemporaryReplacements(date).find(r=>String(r.originalCode)===String(code))||null}
function activeReplacementForTemp(code,date=todayKey()){return activeTemporaryReplacements(date).find(r=>String(r.tempCode)===String(code))||null}
function permanentTeacherByCode(code){return ((DATA&&DATA.teachers)||[]).find(t=>t.code===code)||null}
function nonTeachingStaffByCode(code){const x=((DATA&&DATA.nonTeachingStaff)||[]).find(t=>String(t.code)===String(code));return x?{...x,nonTeaching:true}:null}
function teacherByEffectiveCode(code,date=todayKey()){
 const p=permanentTeacherByCode(code);if(p)return p;
 const n=nonTeachingStaffByCode(code);if(n)return n;
 const r=activeReplacementForTemp(code,date)||temporaryReplacementRecords().find(x=>String(x.tempCode)===String(code));
 return r?{code:r.tempCode,name:r.tempName||r.tempCode,temporary:true,originalCode:r.originalCode}:null;
}
let __operationalTeachersCache={key:"",value:[]};
function operationalTeachers(date=todayKey()){
 const teachers=(DATA&&DATA.teachers)||[],reps=activeTemporaryReplacements(date);
 const repSig=reps.map(r=>[r.id,r.active,r.originalCode,r.tempCode,r.tempName,r.startDate,r.endDate].join(':')).join('|');
 const key=[date,teachers.length,repSig].join('||');
 if(__operationalTeachersCache.key===key)return __operationalTeachersCache.value;
 const out=[...teachers],seen=new Set(out.map(t=>t.code));
 for(const r of reps)if(!seen.has(r.tempCode)){
   out.push({code:r.tempCode,name:r.tempName||r.tempCode,temporary:true,originalCode:r.originalCode});seen.add(r.tempCode);
 }
 __operationalTeachersCache={key,value:out};
 return out;
}
function statusAssignableTeachers(){
 const out=[...((DATA&&DATA.teachers)||[]),...((DATA&&DATA.nonTeachingStaff)||[]).filter(x=>x&&x.active!==false).map(x=>({...x,nonTeaching:true}))],seen=new Set(out.map(t=>t.code)),today=todayKey();
 for(const r of temporaryReplacementRecords()){
   if(r.active===false||!r.tempCode||!r.tempName||String(r.endDate||"")<today||seen.has(r.tempCode))continue;
   out.push({code:r.tempCode,name:r.tempName,temporary:true,originalCode:r.originalCode});seen.add(r.tempCode);
 }
 return out;
}
function replaceCodeToken(text,from,to){
 const escCode=String(from).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return String(text||'').replace(new RegExp('(^|[^A-Za-z0-9])'+escCode+'(?=$|[^A-Za-z0-9])','g'),(m,p1)=>p1+to);
}
function applyTemporaryReplacementsToRecord(r,date=todayKey()){
 const codes=teacherCodesForRecord(r),active=activeTemporaryReplacements(date);
 if(!codes.length||!active.length)return {...r,codes};
 let changed=false,entry=String(r.entry||''),newCodes=[...codes];
 for(const rep of active){
   const idx=newCodes.indexOf(rep.originalCode);if(idx<0)continue;
   changed=true;newCodes[idx]=rep.tempCode;
   const original=permanentTeacherByCode(rep.originalCode);
   const label=(rep.tempName||rep.tempCode)+' ('+rep.tempCode+')';
   entry=replaceCodeToken(entry,rep.originalCode,label);
   const note='Leave Vacancy for '+(original?original.name:rep.originalCode);
   if(!entry.includes(note))entry+=' · '+note;
 }
 return changed?{...r,codes:[...new Set(newCodes)],entry,_temporaryReplacement:true}:{...r,codes};
}
let __operationalRecordsCache={key:'',value:[]};
function operationalRecords(date=todayKey()){
 const reps=(DATA&&Array.isArray(DATA.temporaryReplacements)?DATA.temporaryReplacements:[]);
 const repSig=reps.map(r=>[r.id,r.active,r.originalCode,r.tempCode,r.startDate,r.endDate].join(':')).join('|');
 const key=[date,(DATA&&DATA.activeScheduleProfileId)||'normal',repSig,sanitisedMasterRecords().length].join('||');
 if(__operationalRecordsCache.key===key)return __operationalRecordsCache.value;
 const value=sanitisedMasterRecords().filter(isOperationalRecord).map(r=>applyTemporaryReplacementsToRecord(r,date));
 __operationalRecordsCache={key,value};
 return value;
}
function activeSchedulePeriods(){
 const set=new Set(),prof=activeScheduleProfile();
 for(const c of ((DATA&&DATA.classes)||[]))classActivePeriods(c).forEach(p=>set.add(Number(p)));
 if(!(prof&&prof.classPeriods)&&!set.size)((DATA&&DATA.records)||[]).forEach(r=>set.add(Number(r.period)));
 return [...set].filter(Boolean).sort((a,b)=>a-b);
}
function refreshPeriodSelect(id,placeholder,periods){
 const el=E(id);if(!el)return;
 const old=el.value,ps=(periods!==undefined&&periods!==null?periods:activeSchedulePeriods());
 el.innerHTML='<option value="">'+esc(placeholder)+'</option>'+ps.map(p=>'<option value="'+p+'">'+PL(p)+(scheduleTime(p)?' · '+esc(scheduleTime(p)):'')+'</option>').join('');
 if([...el.options].some(o=>o.value===old))el.value=old;
}
function refreshScheduleUi(){
 if(!DATA)return;
 const banner=E("activeScheduleBanner"),id=activeScheduleId(),name=activeScheduleName();
 if(banner){
   banner.classList.toggle("custom",id!=="normal");
   banner.innerHTML='<b>🗓 Active Schedule:</b> '+esc(name);
 }
 refreshPeriodSelect("teacherPeriod","All");
 refreshPeriodSelect("classPeriod","All",E("classSel")&&E("classSel").value?classActivePeriods(E("classSel").value):activeSchedulePeriods());
 refreshPeriodSelect("dayPeriod","All",E("dayClass")&&E("dayClass").value?classActivePeriods(E("dayClass").value):activeSchedulePeriods());
 refreshPeriodSelect("freePeriod","Select…");
 refreshPeriodSelect("nowPeriod","Select…");
 refreshPeriodSelect("slotPeriod","Select…",E("slotClass")&&E("slotClass").value?classActivePeriods(E("slotClass").value):activeSchedulePeriods());
 refreshPeriodSelect("allotPeriod","Select…");
 refreshPeriodSelect("dutyFrom","Select…");
 refreshPeriodSelect("dutyTo","Select…");
 try{setNow()}catch(e){}
 const active=document.querySelector(".view.active");
 try{
   if(active&&active.id==="teacher"&&E("teacherSel").value)teacherResult();
   else if(active&&active.id==="class"&&E("classSel").value)classResult();
   else if(active&&active.id==="day"&&E("daySel").value)dayResult();
   else if(active&&active.id==="free"&&E("freeDay").value&&E("freePeriod").value)freeResult();
   else if(active&&active.id==="now"&&E("nowTeacher").value)nowResult();
   else if(active&&active.id==="slot"&&E("slotClass").value)slotResult();
   else if(active&&active.id==="leave")renderLeave();
   else if(active&&active.id==="allot"){renderProxyPeriod();}
 }catch(e){console.warn("Schedule view refresh:",e)}
}
window.activeScheduleProfile=activeScheduleProfile;window.scheduleTime=scheduleTime;window.applyActiveScheduleProfile=refreshScheduleUi;
function rowsTable(a){return '<div class="table"><table><tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Assignment</th></tr>'+a.map(x=>`<tr><td>${x.day}</td><td>${PL(x.period)}</td><td>${esc(scheduleTime(x.period))}</td><td>${x.class}</td><td>${esc(x.entry)}</td></tr>`).join("")+'</table></div>'}
function teacherResult(){let c=E("teacherSel").value,d=E("teacherDay").value,p=Number(E("teacherPeriod").value);if(!c)return E("teacherResult").innerHTML="Select a teacher.";let t=teacherByEffectiveCode(c),a=operationalRecords().filter(x=>x.codes.includes(c)&&(!d||x.day===d)&&(!p||Number(x.period)===p)).sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||a.period-b.period);let groups={};a.forEach(x=>{let k=x.day+"|"+x.period;if(!groups[k])groups[k]={day:x.day,period:x.period,time:scheduleTime(x.period),classes:[],entries:[]};groups[k].classes.push(x.class);groups[k].entries.push(x.entry)});let g=Object.values(groups);if(!g.length){const rep=activeReplacementForOriginal(c);E("teacherResult").innerHTML=rep?`<b>${esc(t?t.name:c)}</b> is currently covered by <b>${esc(rep.tempName||rep.tempCode)}</b> (${esc(rep.tempCode)}) until ${esc(displayDate(rep.endDate))}.`:"No matching teaching assignment under the active schedule.";return}let table='<div class="table"><table><tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Assignment</th></tr>'+g.map(x=>`<tr><td>${x.day}</td><td>${PL(x.period)}</td><td>${esc(x.time)}</td><td>${x.classes.join(" + ")}</td><td>${x.entries.map(esc).join(" / ")}</td></tr>`).join("")+'</table></div>';E("teacherResult").innerHTML=table+`<p>Matching teaching periods: <b>${g.length}</b></p>`}
function classResult(){let c=E("classSel").value,d=E("classDay").value;if(!c)return E("classResult").innerHTML="Select a class.";refreshPeriodSelect("classPeriod","All",classActivePeriods(c));let p=Number(E("classPeriod").value);let a=operationalRecords().filter(x=>x.class===c&&(!d||x.day===d)&&(!p||Number(x.period)===p)).sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||a.period-b.period);E("classResult").innerHTML=a.length?rowsTable(a):"No matching teaching assignment under the active schedule."}
function dayResult(){let d=E("daySel").value,c=E("dayClass").value;if(c)refreshPeriodSelect("dayPeriod","All",classActivePeriods(c));else refreshPeriodSelect("dayPeriod","All");let p=Number(E("dayPeriod").value||0);if(!d){E("dayResult").innerHTML="Select a day. Period and Class are optional filters.";return}let a=operationalRecords().filter(x=>x.day===d&&(!p||Number(x.period)===p)&&(!c||x.class===c)).sort((a,b)=>a.period-b.period||a.class.localeCompare(b.class));E("dayResult").innerHTML=a.length?rowsTable(a):"No matching timetable entry under the active schedule."}
function freeResult(){let d=E("freeDay").value,p=Number(E("freePeriod").value);if(!d||!p)return;if(!activeSchedulePeriods().includes(p)){E("freeResult").innerHTML="This period is not active in the current schedule.";return}let busy=new Set(operationalRecords().filter(x=>x.day===d&&Number(x.period)===p).flatMap(x=>x.codes));let statuses=leaveData();statuses.forEach(o=>{if(activeLeaveAt(o,p))busy.add(o.code)});activeTemporaryReplacements().forEach(r=>busy.add(r.originalCode));let a=operationalTeachers().filter(t=>!busy.has(t.code)&&!activeReplacementForOriginal(t.code));E("freeResult").innerHTML='<div class="small" style="margin-bottom:7px">'+PL(p)+' · '+esc(scheduleTime(p))+' · '+esc(activeScheduleName())+'</div>'+a.map(t=>`<span class="tag">${esc(t.name)} (${t.code})${t.temporary?' · Temporary replacement':''}</span>`).join("")}
function scheduleClockMinutes(h,m,ampm){h=Number(h);m=Number(m);if(ampm){const x=String(ampm).toLowerCase();h=h%12+(x==="pm"?12:0)}else if(h>=1&&h<=6)h+=12;return h*60+m}
function scheduleWindow(p){const text=scheduleTime(p),matches=[...String(text).matchAll(/(\d{1,2}):(\d{2})\s*(am|pm)?/ig)];if(matches.length<2)return null;const vals=matches.map(x=>scheduleClockMinutes(x[1],x[2],x[3]));let start=vals[0],end=vals[vals.length-1];if(end<=start)end+=12*60;return [start,end]}
function currentP(){let n=new Date(),m=n.getHours()*60+n.getMinutes();for(const p of activeSchedulePeriods()){const w=scheduleWindow(p);if(w&&m>=w[0]&&m<w[1])return p}let s=[[1,515,565],[2,565,605],[3,605,645],[4,645,685],[5,715,755],[6,755,795],[7,795,835],[8,835,875]];for(let x of s)if(activeSchedulePeriods().includes(x[0])&&m>=x[1]&&m<x[2])return x[0];return 0}
function setNow(){let n=new Date(),d=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][n.getDay()],p=currentP();E("clock").innerHTML=`<b>Current day/time:</b> ${d}, ${n.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · ${p?PL(p)+(scheduleTime(p)?" · "+esc(scheduleTime(p)):""):"outside an active teaching period"} · ${esc(activeScheduleName())}`;if(DAYS.includes(d)){E("nowDay").value=d;E("slotDay").value=d}if(p){if([...E("nowPeriod").options].some(o=>o.value===String(p)))E("nowPeriod").value=String(p);if([...E("slotPeriod").options].some(o=>o.value===String(p)))E("slotPeriod").value=String(p)}}
function nowResult(){let c=E("nowTeacher").value,d=E("nowDay").value,p=Number(E("nowPeriod").value);if(!c||!d||!p)return;let t=teacherByEffectiveCode(c),a=operationalRecords().filter(x=>x.day===d&&Number(x.period)===p&&x.codes.includes(c));const nm=t?t.name:c;E("nowResult").innerHTML=a.length?`<b>${esc(nm)}</b> → ${a.map(x=>`<b>${x.class}</b> · ${esc(x.entry)}`).join("<br>")}<br><span class="small">${PL(p)} · ${esc(scheduleTime(p))} · ${esc(activeScheduleName())}</span>`:`<b>${esc(nm)}</b> has no active teaching assignment in ${PL(p)} (${esc(scheduleTime(p))}) on ${d}.`}
function slotResult(){let c=E("slotClass").value,d=E("slotDay").value;if(!c||!d)return;refreshPeriodSelect("slotPeriod","Select…",classActivePeriods(c));let p=Number(E("slotPeriod").value);if(!p)return;if(!isClassPeriodActive(c,p)){E("slotResult").innerHTML=`${esc(activeScheduleName())} does not run ${esc(c)} in ${PL(p)}.`;return}let x=operationalRecords().find(z=>z.class===c&&z.day===d&&Number(z.period)===p);E("slotResult").innerHTML=x?`<b>${c} · ${d} · ${PL(p)} · ${esc(scheduleTime(p))}</b><br>${esc(x.entry)}`:`No teaching assignment is recorded for this active slot.`}

function storedStatusData(date=todayKey()){try{
 const key="vkvLeave2_"+date;
 let v=localStorage.getItem(key);
 if(v!==null)return JSON.parse(v||"[]");
 return [];
}catch(e){return[]}}

function cachedLeavePlans(){
 if(window.__vkvLeavePlans&&typeof window.__vkvLeavePlans==="object")return window.__vkvLeavePlans;
 try{
   const x=JSON.parse(localStorage.getItem("vkvLeavePlansCache")||"{}");
   window.__vkvLeavePlans=x&&typeof x==="object"?x:{};
 }catch(e){window.__vkvLeavePlans={}}
 return window.__vkvLeavePlans;
}
function dateFromKey(k){const a=String(k||"").split("-").map(Number);return new Date(a[0]||1970,(a[1]||1)-1,a[2]||1)}
function dateKeyFromDate(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dayNameForDate(k){return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateFromKey(k).getDay()]}
function planAppliesToDate(p,date){
 if(!p||p.active===false||!date)return false;
 if(p.mode==="multiple")return Array.isArray(p.dates)&&p.dates.includes(date);
 const s=p.startDate||p.date||"",e=p.endDate||p.startDate||p.date||"";
 return !!s&&date>=s&&date<=e;
}
function plannedStatusesForDate(date=todayKey()){
 const plans=Object.values(cachedLeavePlans());
 return plans.filter(p=>planAppliesToDate(p,date)).map(p=>({
   code:p.code,type:p.type,from:p.from||0,to:p.to||0,duration:p.duration||"",
   leaveCategory:p.leaveCategory||"",leaveUnits:Number(p.leaveUnits||0),
   note:p.note||"",date,day:dayNameForDate(date),planned:true,planId:p.id||""
 }));
}
window.plannedStatusesForDate=plannedStatusesForDate;
function approvedStatusesForDate(date=todayKey()){
 const daily=((window.__vkvApprovedProxyDaily||{})[date]||[]).filter(x=>x&&x.approved!==false);
 const plans=(window.__vkvApprovedProxyPlans||[]).filter(p=>p&&p.approved!==false&&planAppliesToDate(p,date)).map(p=>({
   code:p.code,type:p.type,from:p.from||0,to:p.to||0,duration:p.duration||"",
   leaveCategory:p.leaveCategory||"",leaveUnits:Number(p.leaveUnits||0),
   note:p.note||"",date,day:dayNameForDate(date),planned:true,approved:true,planId:p.id||""
 }));
 return mergeEffectiveStatuses(daily,plans);
}
window.approvedStatusesForDate=approvedStatusesForDate;
function mergeEffectiveStatuses(base,planned){
 const out=[...(base||[])],seen=new Set(out.map(x=>x&&x.code).filter(Boolean));
 (planned||[]).forEach(x=>{if(x&&x.code&&!seen.has(x.code)){out.push(x);seen.add(x.code)}});
 return out;
}
function leaveData(date=todayKey()){
 const recorded=mergeEffectiveStatuses(storedStatusData(date),plannedStatusesForDate(date));
 return recorded;
}

let selectedStatus="",selectedDuration="";
const LEAVE_CATEGORY_LABELS={VL:"VL",EL:"EL",CL:"CL",SEL:"SEL",EOL:"EOL",MATERNITY:"Maternity Leave"};
function leaveCategoryLabel(v){const code=String(v||'').toUpperCase(),ctx=window.__homepageLeaveContext,r=ctx&&Array.isArray(ctx.categories)?ctx.categories.find(x=>String(x.code||'').toUpperCase()===code):null;return r?(r.name||r.code):(LEAVE_CATEGORY_LABELS[code]||String(v||''))}
let homepageLeaveContextCode='',homepageLeaveContextLoading=false;
function homePeriodValid(ctx){const p=ctx&&ctx.entitlementPeriod;return !!(p&&/^\d{4}-\d{2}-\d{2}$/.test(String(p.startDate||''))&&/^\d{4}-\d{2}-\d{2}$/.test(String(p.endDate||''))&&p.startDate<=p.endDate)}
function homePeriodKey(ctx){const p=ctx&&ctx.entitlementPeriod;return homePeriodValid(ctx)?String(p.key||`${p.startDate}__${p.endDate}`):''}
function homeRule(code,ctx=window.__homepageLeaveContext){code=String(code||'').toUpperCase();return ctx&&Array.isArray(ctx.categories)?ctx.categories.find(r=>String(r.code||'').toUpperCase()===code)||null:null}
function homeActiveRules(ctx=window.__homepageLeaveContext,code=''){const staff=code?homeStaffCategory(code,ctx):'';return ctx&&Array.isArray(ctx.categories)?ctx.categories.filter(r=>{if(!(r&&r.active!==false&&String(r.code||'').trim()&&(r.unlimited===true||(Number.isFinite(Number(r.max))&&Number(r.max)>0))))return false;if(String(r.ruleType||'regular')==='conditional')return !!code&&homeConditionalEligible(code,r,ctx);if(staff&&staff!=='unknown'&&!homeRuleApplies(r,staff))return false;return true}).sort((a,b)=>Number(a.sortOrder||999)-Number(b.sortOrder||999)||String(a.code).localeCompare(String(b.code))):[]}
function homeStaffCategory(code,ctx=window.__homepageLeaveContext){
 const t=teacherByEffectiveCode(code)||permanentTeacherByCode(code)||nonTeachingStaffByCode(code);if(!t)return'unknown';
 const known=new Set((ctx&&ctx.staffCategories||[]).map(x=>String(x.code))),explicit=String(t.leaveStaffCategory||'');if(known.has(explicit)||['teaching','administrative','non-teaching'].includes(explicit))return explicit;
 const ov=String(ctx&&ctx.staffCategoryOverrides&&ctx.staffCategoryOverrides[code]||'');if(known.has(ov)||['teaching','administrative','non-teaching'].includes(ov))return ov;
 if(t.nonTeaching||nonTeachingStaffByCode(code))return'non-teaching';if(permanentTeacherByCode(code))return'teaching';return'unknown';
}
function homeRuleApplicableCodes(rule){const a=Array.isArray(rule&&rule.applicableStaffCategories)?rule.applicableStaffCategories.map(String):[];if(a.length)return a;const out=[];if(rule?.teaching===true)out.push('teaching');if(rule?.admin===true)out.push('administrative');if(rule?.nonTeaching===true)out.push('non-teaching');return out}
function homeRuleApplies(rule,staffCat){return homeRuleApplicableCodes(rule).includes(String(staffCat||''))}
function homeConditionalEligible(code,rule,ctx=window.__homepageLeaveContext){if(String(rule&&rule.ruleType||'regular')!=='conditional'||rule.requiresIndividualEligibility!==true)return true;return !!(ctx&&ctx.staffConditionalEligibility&&ctx.staffConditionalEligibility[code]&&ctx.staffConditionalEligibility[code][String(rule.code||'').toUpperCase()]===true)}
function homePlanDates(p){if(!p)return[];if(p.mode==='multiple')return [...new Set((p.dates||[]).filter(Boolean))].sort();const a=String(p.startDate||p.date||''),b=String(p.endDate||a);if(!a)return[];const out=[];for(let d=dateFromKey(a),last=dateFromKey(b);d<=last;d.setDate(d.getDate()+1))out.push(dateKeyFromDate(d));return out}
function homeLegacyState(x,ctx){const key=homePeriodKey(ctx);if(!key)return'unknown';const assigned=String(x.entitlementPeriodKey||'');if(assigned)return assigned===key?'current':'other';const p=ctx.entitlementPeriod;if(x.vlHasVerifiedRange===true&&x.vlFromDate&&x.vlToDate){if(x.vlFromDate>=p.startDate&&x.vlToDate<=p.endDate)return'current';if(x.vlToDate<p.startDate||x.vlFromDate>p.endDate)return'other'}return'unknown'}
function homeLeaveUsage(code,category,ctx=window.__homepageLeaveContext){
 const cat=String(category||'').toUpperCase(),p=ctx&&ctx.entitlementPeriod;let dated=0,legacyAssigned=0,legacyUnassigned=0;
 if(homePeriodValid(ctx)){
   for(const x of (ctx.scheduled||[])){if(String(x.code)!==String(code)||!['full','half'].includes(x.type)||String(x.leaveCategory||'').toUpperCase()!==cat)continue;const per=x.type==='half'?0.5:1;for(const d of homePlanDates(x))if(d>=p.startDate&&d<=p.endDate)dated+=per}
   for(const x of (ctx.manual||[])){if(String(x.code)!==String(code)||!['full','half'].includes(x.type)||String(x.leaveCategory||'').toUpperCase()!==cat)continue;const d=String(x._date||'');if(d>=p.startDate&&d<=p.endDate)dated+=x.type==='half'?0.5:1}
 }
 if(ctx&&ctx.legacyAvailable){for(const x of (ctx.legacy||[])){if(x&&x.active!==false&&String(x.teacherCode)===String(code)&&String(x.category||'').toUpperCase()===cat&&x.resolutionStatus!=='resolved-dated'){const state=homeLegacyState(x,ctx),u=Number(x.units||0);if(state==='current')legacyAssigned+=u;else if(state==='unknown')legacyUnassigned+=u}}
 }
 return{dated:Math.round(dated*2)/2,legacyAssigned:Math.round(legacyAssigned*2)/2,legacyUnassigned:Math.round(legacyUnassigned*2)/2,used:Math.round((dated+legacyAssigned)*2)/2};
}
function populateHomepageLeaveCategories(ctx,existing=''){
 const select=E('leaveCategory'),quick=E('leaveCategoryQuickBtns');if(!select||!quick)return;
 const current=String(existing||select.value||'').toUpperCase(),staffCode=E('leaveTeacher')?.value||'',rules=homeActiveRules(ctx,staffCode),codes=rules.map(r=>String(r.code||'').toUpperCase());
 if(current&&!codes.includes(current)){const r=homeRule(current,ctx);if(r)codes.push(current)}
 select.innerHTML='<option value="">Select…</option>'+codes.map(c=>`<option value="${esc(c)}">${esc(leaveCategoryLabel(c))}${homeRule(c,ctx)?.active===false?' · Historical':''}</option>`).join('');
 quick.innerHTML=rules.map(r=>{const c=String(r.code||'').toUpperCase();return `<button data-leave-category="${esc(c)}" onclick="chooseLeaveCategory('${esc(c)}',this)">${esc(r.name||c)}</button>`}).join('');
 if(codes.includes(current))select.value=current;
}
function homeHistoryItems(code,ctx=window.__homepageLeaveContext){
 const out=[];for(const x of (ctx?.scheduled||[]))if(String(x.code)===String(code)&&['full','half'].includes(x.type))out.push({...x,_dates:homePlanDates(x)});for(const x of (ctx?.manual||[]))if(String(x.code)===String(code)&&['full','half'].includes(x.type))out.push({...x,_dates:[x._date]});return out.sort((a,b)=>String((b._dates||[]).slice(-1)[0]||'').localeCompare(String((a._dates||[]).slice(-1)[0]||'')))}
function renderHomepageLeaveSnapshot(){
 const box=E('homepageLeaveSnapshot'),code=E('leaveTeacher')?.value,ctx=window.__homepageLeaveContext;if(!box)return;if(!code){box.style.display='none';box.innerHTML='';return}box.style.display='block';
 if(homepageLeaveContextLoading){box.innerHTML='<div class="proxyhead">Leave Snapshot</div><div class="small">Loading leave history and balances…</div>';return}
 if(!ctx||homepageLeaveContextCode!==code){box.innerHTML='<div class="proxyhead">Leave Snapshot</div><div class="small">Leave information is not loaded yet.</div>';return}
 const t=teacherByEffectiveCode(code)||{name:code},rules=homeActiveRules(ctx,code),metrics=rules.map(r=>{const cat=String(r.code||'').toUpperCase(),u=homeLeaveUsage(code,cat,ctx);let value='—',detail='';if(r.unlimited===true){value='Subject to approval';detail=`No fixed maximum · saved dated usage ${u.used}`}else if(!homePeriodValid(ctx)){value='Period not set';detail='Limited balance unavailable'}else{const max=Number(r.max),rem=Math.round((max-u.used)*2)/2;value=`${Math.max(0,rem)} left`;detail=`Used ${u.used} of ${max}${u.legacyUnassigned?` · ${u.legacyUnassigned} legacy unit(s) unassigned`:''}`};return `<div class="teacherHistoryMetric"><b>${esc(cat)} · ${esc(value)}</b><span>${esc(detail)}</span></div>`}).join('');
 const history=homeHistoryItems(code,ctx).slice(0,6).map(x=>{const ds=x._dates||[],dateText=ds.length===1?displayDate(ds[0]):(ds.length?`${displayDate(ds[0])} → ${displayDate(ds[ds.length-1])}`:'—');return `<div class="teacherHistoryLine"><div class="teacherHistoryDate">${esc(dateText)}</div><div>${esc(leaveCategoryLabel(x.leaveCategory))} · ${esc(x.type==='half'?'Half Leave':'Full Leave')}</div><div>${esc(x.note||'No remarks')}</div></div>`}).join('');
 box.innerHTML=`<div class="teacherHistoryHead"><div><div class="proxyhead">${esc(t.name)} · Leave Snapshot</div><div class="small">Regular Leave only. OD / Special Assignment are Duty Leave and are not deducted here.</div></div></div><div class="teacherHistoryMetrics">${metrics||'<div class="small">No active Leave Rules configured.</div>'}</div><div class="teacherHistoryList">${history||'<div class="small">No saved regular leave history.</div>'}</div>`;
}
function evaluateHomepageLeaveRule(code,category,requested=0,ctx=window.__homepageLeaveContext){
 const rule=homeRule(category,ctx),staffCat=homeStaffCategory(code,ctx);if(!ctx)return{kind:'config',message:'Leave Rules are not loaded.'};if(!rule||rule.active===false)return{kind:'config',message:'This leave category is not available for new entries.'};if(staffCat==='unknown')return{kind:'config',message:'Staff leave classification is not configured.'};if(!homeRuleApplies(rule,staffCat))return{kind:'blocked',message:`${leaveCategoryLabel(category)} is not applicable to this staff category.`};if(!homeConditionalEligible(code,rule,ctx))return{kind:'config',message:`${leaveCategoryLabel(category)} is Conditional / Special Leave and individual eligibility has not been enabled for this staff member.`};const u=homeLeaveUsage(code,category,ctx);if(rule.unlimited===true)return{kind:'ok',message:`${leaveCategoryLabel(category)}: Unlimited. Saved dated usage: ${u.used}.`,usage:u,rule};if(!homePeriodValid(ctx))return{kind:'config',message:'Entitlement period is not configured for limited leave.'};const max=Number(rule.max),remaining=Math.round((max-u.used)*2)/2;if(remaining<=0)return{kind:'blocked',message:`${leaveCategoryLabel(category)} exhausted — no leave remaining. Used ${u.used} of ${max}.`,usage:u,rule,remaining};if(Number(requested)>remaining)return{kind:'blocked',message:`${leaveCategoryLabel(category)} available: ${remaining} remaining, but this entry requests ${requested}.`,usage:u,rule,remaining};return{kind:'ok',message:`${leaveCategoryLabel(category)} available: ${remaining} remaining${requested?` · ${requested} requested`:''}.`,usage:u,rule,remaining};
}
function renderHomepageLeaveRuleWarning(){
 const out=E('homepageLeaveRuleWarning');if(!out)return;const code=E('leaveTeacher')?.value,cat=E('leaveCategory')?.value;if(!(selectedStatus==='full'||selectedStatus==='half')){out.textContent='';return}if(!code){out.innerHTML='<span style="color:#7a5b18">Select a teacher to check the leave balance.</span>';return}if(!cat){out.innerHTML='<span style="color:#617685">Choose a leave category to check the remaining balance.</span>';return}const requested=Number(E('leaveUnits')?.value||autoCalculatedLeaveUnits()||0),r=evaluateHomepageLeaveRule(code,cat,requested);const colour=r.kind==='ok'?'#245c34':r.kind==='blocked'?'#8b2d2d':'#7a5b18';out.innerHTML=`<b style="color:${colour}">${esc(r.message)}</b>${r.usage&&r.usage.legacyUnassigned?`<br><span style="color:#7a5b18">⚠ ${esc(r.usage.legacyUnassigned)} legacy unit(s) are period-unassigned and are not included in this balance.</span>`:''}`;
}
async function onHomepageLeaveTeacherChange(force=false){
 const code=E('leaveTeacher')?.value;homepageLeaveContextCode=code||'';if(!code){renderHomepageLeaveSnapshot();renderHomepageLeaveRuleWarning();return}homepageLeaveContextLoading=true;renderHomepageLeaveSnapshot();try{const ctx=await window.loadHomepageLeaveContext(code,force);window.__homepageLeaveContext=ctx;populateHomepageLeaveCategories(ctx,E('leaveCategory')?.value||'');homepageLeaveContextLoading=false;renderHomepageLeaveSnapshot();renderHomepageLeaveRuleWarning()}catch(e){homepageLeaveContextLoading=false;const box=E('homepageLeaveSnapshot');if(box){box.style.display='block';box.innerHTML='<div class="proxyhead">Leave Snapshot</div><div class="warn">Could not load leave history: '+esc(e&&e.message?e.message:e)+'</div>'}renderHomepageLeaveRuleWarning()}
}
async function validateHomepageLeaveBeforeSave(code,category,requested){
 try{const ctx=await window.loadHomepageLeaveContext(code,true);window.__homepageLeaveContext=ctx;homepageLeaveContextCode=code;populateHomepageLeaveCategories(ctx,category);renderHomepageLeaveSnapshot();const r=evaluateHomepageLeaveRule(code,category,requested,ctx);renderHomepageLeaveRuleWarning();if(r.kind==='ok')return'';return r.message+(r.kind==='blocked'?' Use Quick Add Leave / Leave Master Editor if a Principal policy override is genuinely required.':'')}catch(e){return e&&e.message?e.message:String(e)}
}
window.onHomepageLeaveTeacherChange=onHomepageLeaveTeacherChange;window.renderHomepageLeaveRuleWarning=renderHomepageLeaveRuleWarning;
function leaveDateCountFromSpec(spec){if(!spec||spec.invalid)return 0;if(spec.mode==="multiple")return (spec.dates||[]).length;return dateRangeDays(spec.startDate,spec.endDate||spec.startDate)}
function autoCalculatedLeaveUnits(){const n=leaveDateCountFromSpec(selectedDateSpec());if(selectedStatus==="half")return n*0.5;if(selectedStatus==="full")return n;return 0}
function autoFillLeaveUnits(){const el=E("leaveUnits");if(!el)return;const n=autoCalculatedLeaveUnits();el.value=n?String(n):"";refreshLeaveCategoryUi(false)}
function chooseLeaveCategory(cat,btn){
 const sel=E("leaveCategory");if(!sel||sel.disabled)return;sel.value=cat;document.querySelectorAll(".categoryQuickBtns button").forEach(x=>x.classList.toggle("active",x===btn));refreshLeaveCategoryUi(false);
}
function refreshLeaveCategoryUi(auto=false){const box=E("leaveCategoryBox"),cat=E("leaveCategory"),units=E("leaveUnits"),hint=E("leaveAccountHint"),isLeave=selectedStatus==="full"||selectedStatus==="half";if(box)box.classList.toggle("disabledBox",!isLeave);if(cat)cat.disabled=!isLeave;if(units)units.disabled=!isLeave;document.querySelectorAll(".categoryQuickBtns button").forEach(x=>{x.disabled=!isLeave;x.classList.toggle("active",isLeave&&cat&&x.dataset.leaveCategory===cat.value)});if(!isLeave){if(cat)cat.value="";if(units)units.value="";if(hint)hint.textContent="Leave category does not apply to OD / Special Assignment / Vacant Position.";return}if(auto&&units&&document.activeElement!==units){const n=autoCalculatedLeaveUnits();units.value=n?String(n):""}if(hint){const c=cat&&cat.value?leaveCategoryLabel(cat.value):"Select the leave category";const n=units&&units.value?Number(units.value):0;hint.textContent=c+(n?" · "+n+" leave day"+(n===1?"":"s"):"")}renderHomepageLeaveRuleWarning()}
let editingLeavePlanId="";
let proxyPeriod=1;

let leaveDateMode="single",leaveSingleDate=todayKey(),leaveRangeStart=todayKey(),leaveRangeEnd=todayKey(),leaveMultiDates=new Set();
let leaveCalendarMonth=new Date(dateFromKey(todayKey()).getFullYear(),dateFromKey(todayKey()).getMonth(),1);
let leaveCalDragging=false,leaveCalDragAnchor="";

function formatLeaveDate(k,withYear=true){if(!k)return"";const m=String(k).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return String(k);return withYear?`${m[3]}/${m[2]}/${m[1]}`:`${m[3]}/${m[2]}`}
function dateRangeDays(a,b){if(!a||!b)return 0;let x=dateFromKey(a),y=dateFromKey(b);if(x>y){let t=x;x=y;y=t}return Math.round((y-x)/86400000)+1}
function normalizeLeaveRange(){if(leaveRangeStart&&leaveRangeEnd&&leaveRangeStart>leaveRangeEnd){const t=leaveRangeStart;leaveRangeStart=leaveRangeEnd;leaveRangeEnd=t}}
function selectedDateSpec(){
 if(leaveDateMode==="single"){
   if(!leaveSingleDate)return null;
   return {mode:"single",startDate:leaveSingleDate,endDate:leaveSingleDate};
 }
 if(leaveDateMode==="range"){
   if(!leaveRangeStart||!leaveRangeEnd)return null;
   return {mode:"range",startDate:leaveRangeStart,endDate:leaveRangeEnd,invalid:leaveRangeStart>leaveRangeEnd};
 }
 const dates=[...leaveMultiDates].sort();
 if(!dates.length)return null;
 return {mode:"multiple",dates,startDate:dates[0],endDate:dates[dates.length-1]};
}
function leaveDateSpecText(s){
 if(!s)return"No dates selected";
 if(s.mode==="single")return formatLeaveDate(s.startDate);
 if(s.mode==="range"){if(s.invalid)return `From Date (${formatLeaveDate(s.startDate)}) is later than To Date (${formatLeaveDate(s.endDate)})`;return `${formatLeaveDate(s.startDate)} → ${formatLeaveDate(s.endDate)} (${dateRangeDays(s.startDate,s.endDate)} calendar days)`;}
 const shown=s.dates.slice(0,8).map(x=>formatLeaveDate(x,false)).join(" · ");
 return `${s.dates.length} selected date${s.dates.length===1?"":"s"}: ${shown}${s.dates.length>8?` · +${s.dates.length-8} more`:""}`;
}
function renderLeaveSelectionSummary(){
 const out=E("leaveSelectionSummary");if(!out)return;
 const s=selectedDateSpec();
 if(!s){out.innerHTML="<b>No dates selected.</b> Tap dates on the calendar.";return}
 if(s.invalid){out.innerHTML='<b style="color:#8c2525">'+esc(leaveDateSpecText(s))+'</b><br><span class="small">Please correct the From/To dates before saving.</span>';return}
 let extra="";
 if(s.mode==="range"&&s.startDate<todayKey()&&s.endDate>todayKey())extra='<br><span class="small">This range starts in the past, is active today, and continues into the future.</span>';
 else if(s.mode==="range"&&s.endDate>=todayKey()&&dateRangeDays(s.startDate,s.endDate)>31)extra='<br><span class="small">Long multi-month leave is supported as one scheduled entry.</span>';
 out.innerHTML="<b>"+esc(leaveDateSpecText(s))+"</b>"+extra;
}
function selectedOnCalendar(k){
 if(leaveDateMode==="single")return k===leaveSingleDate;
 if(leaveDateMode==="range"){if(!leaveRangeStart||!leaveRangeEnd)return false;let a=leaveRangeStart,b=leaveRangeEnd;if(a>b){let t=a;a=b;b=t}return k>=a&&k<=b}
 return leaveMultiDates.has(k);
}
function renderLeaveCalendar(){
 const grid=E("leaveCalendarGrid"),label=E("leaveCalMonth");if(!grid||!label)return;
 label.textContent=leaveCalendarMonth.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
 const y=leaveCalendarMonth.getFullYear(),m=leaveCalendarMonth.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
 let html="";
 for(let i=0;i<first;i++)html+='<div class="calBlank"></div>';
 const allowed=!window.__vkvRole||["admin","manager"].includes(window.__vkvRole);
 for(let d=1;d<=days;d++){
   const dt=new Date(y,m,d),k=dateKeyFromDate(dt),sel=selectedOnCalendar(k),edge=leaveDateMode==="range"&&(k===leaveRangeStart||k===leaveRangeEnd);
   html+=`<button type="button" class="calDay${dt.getDay()===0?" sun":""}${k===todayKey()?" today":""}${sel?" selected":""}${edge?" rangeEdge":""}" data-date="${k}" ${allowed?"":"disabled"}>${d}</button>`;
 }
 grid.innerHTML=html;
 const rf=E("leaveRangeFrom"),rt=E("leaveRangeTo"),box=E("leaveRangeInputs");
 if(box)box.style.display=leaveDateMode==="range"?"grid":"none";
 if(rf)rf.value=leaveRangeStart?displayDate(leaveRangeStart):"";
 if(rt)rt.value=leaveRangeEnd?displayDate(leaveRangeEnd):"";
 document.querySelectorAll("[data-leave-date-mode]").forEach(b=>b.classList.toggle("active",b.getAttribute("data-leave-date-mode")===leaveDateMode));
 renderLeaveSelectionSummary();
 refreshLeaveCategoryUi(true);
}
function chooseLeaveDateMode(mode,btn){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole))return;
 leaveDateMode=mode;
 if(mode==="single"&&!leaveSingleDate)leaveSingleDate=todayKey();
 if(mode==="range"){if(!leaveRangeStart)leaveRangeStart=todayKey();if(!leaveRangeEnd)leaveRangeEnd=leaveRangeStart}
 if(mode==="multiple"&&!leaveMultiDates.size)leaveMultiDates.add(todayKey());
 renderLeaveCalendar();
}
function changeLeaveCalendarMonth(delta){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole))return;
 leaveCalendarMonth=new Date(leaveCalendarMonth.getFullYear(),leaveCalendarMonth.getMonth()+delta,1);renderLeaveCalendar()
}
function syncLeaveRangeInputs(){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole))return;
 const a=inputDate(E("leaveRangeFrom").value),b=inputDate(E("leaveRangeTo").value);
 if((E("leaveRangeFrom").value&&!a)||(E("leaveRangeTo").value&&!b)){alert("Enter dates as dd/mm/yyyy.");renderLeaveCalendar();return}
 if(a)leaveRangeStart=a;if(b)leaveRangeEnd=b;
 if(leaveRangeStart)leaveCalendarMonth=new Date(dateFromKey(leaveRangeStart).getFullYear(),dateFromKey(leaveRangeStart).getMonth(),1);
 renderLeaveCalendar();
}
function calendarSelectDate(k){
 if(leaveDateMode==="single"){leaveSingleDate=k;leaveCalendarMonth=new Date(dateFromKey(k).getFullYear(),dateFromKey(k).getMonth(),1)}
 else if(leaveDateMode==="multiple"){if(leaveMultiDates.has(k))leaveMultiDates.delete(k);else leaveMultiDates.add(k)}
 renderLeaveCalendar();
}
function initLeaveCalendarPointer(){
 const grid=E("leaveCalendarGrid");if(!grid||grid.dataset.bound==="1")return;grid.dataset.bound="1";
 grid.addEventListener("pointerdown",e=>{
   const b=e.target.closest(".calDay[data-date]");if(!b||b.disabled)return;
   const k=b.dataset.date;
   if(leaveDateMode==="range"){
     e.preventDefault();leaveCalDragging=true;leaveCalDragAnchor=k;leaveRangeStart=k;leaveRangeEnd=k;renderLeaveCalendar();
     try{grid.setPointerCapture(e.pointerId)}catch(x){}
   }else{e.preventDefault();calendarSelectDate(k)}
 });
 grid.addEventListener("pointermove",e=>{
   if(!leaveCalDragging||leaveDateMode!=="range")return;
   const el=document.elementFromPoint(e.clientX,e.clientY),b=el&&el.closest?el.closest(".calDay[data-date]"):null;
   if(!b||!grid.contains(b))return;
   const k=b.dataset.date;
   leaveRangeStart=leaveCalDragAnchor;leaveRangeEnd=k;normalizeLeaveRange();renderLeaveCalendar();
 });
 const stop=e=>{if(!leaveCalDragging)return;leaveCalDragging=false;normalizeLeaveRange();renderLeaveCalendar();try{grid.releasePointerCapture(e.pointerId)}catch(x){}};
 grid.addEventListener("pointerup",stop);grid.addEventListener("pointercancel",stop);
}
function resetLeaveDateSelection(){
 leaveDateMode="single";leaveSingleDate=todayKey();leaveRangeStart=todayKey();leaveRangeEnd=todayKey();leaveMultiDates=new Set();
 const d=dateFromKey(todayKey());leaveCalendarMonth=new Date(d.getFullYear(),d.getMonth(),1);renderLeaveCalendar();
}
function initializeLeaveCalendar(){resetLeaveDateSelection();initLeaveCalendarPointer()}
window.initializeLeaveCalendar=initializeLeaveCalendar;

function selectLeaveButton(btn){document.querySelectorAll(".leaveBtns button[data-leave-type]").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active")}
function chooseStatus(type,btn){selectedStatus=type;selectLeaveButton(btn);let duty=(type==="od"||type==="special"),box=E("dutyDurationBox");box.classList.toggle("disabledBox",!duty);if(!duty){selectedDuration="";document.querySelectorAll(".durationBtns button").forEach(x=>x.classList.remove("active"));E("dutyFrom").disabled=true;E("dutyTo").disabled=true;E("dutyFrom").value="";E("dutyTo").value="";E("durationHelp").textContent=type==="full"?"Full Leave applies to each selected date.":type==="vacant"?"Vacant Position applies to each selected date.":"Half Leave applies to P5–P8 on each selected date."}else{E("durationHelp").textContent="Choose Full Day, Half Day or Custom Period Range.";E("dutyFrom").disabled=true;E("dutyTo").disabled=true}refreshLeaveCategoryUi(true)}
function chooseDutyDuration(type,btn){if(!(selectedStatus==="od"||selectedStatus==="special"))return;selectedDuration=type;document.querySelectorAll(".durationBtns button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");let custom=type==="custom";E("dutyFrom").disabled=!custom;E("dutyTo").disabled=!custom;if(!custom){E("dutyFrom").value="";E("dutyTo").value=""}E("durationHelp").textContent=type==="full"?"Whole day selected. Period range is disabled.":type==="half"?"Half day selected: P5–P8. Period range is disabled.":"Select both From Period and To Period."}
function setLeaveEditUi(editing){
 editingLeavePlanId=editing?String(editing):"";
 const save=E("saveStatusBtn"),cancel=E("cancelEditStatusBtn");
 if(save)save.textContent=editingLeavePlanId?"💾 Update Entry":"💾 Save";
 if(cancel)cancel.style.display=editingLeavePlanId?"inline-block":"none";
}
function clearStatusForm(){selectedStatus="";selectedDuration="";setLeaveEditUi("");E("leaveTeacher").value="";E("dutyFrom").value="";E("dutyTo").value="";E("dutyNote").value="";E("leaveCategory").value="";E("leaveUnits").value="";E("leaveCategory").disabled=true;E("leaveUnits").disabled=true;E("leaveCategoryBox").classList.add("disabledBox");E("dutyFrom").disabled=true;E("dutyTo").disabled=true;E("dutyDurationBox").classList.add("disabledBox");document.querySelectorAll(".leaveBtns button[data-leave-type],.durationBtns button").forEach(x=>x.classList.remove("active"));E("durationHelp").textContent="Choose On Duty or Special Assignment first.";resetLeaveDateSelection();refreshLeaveCategoryUi(false);E("statusMsg").textContent="Form cleared. Saved records were not deleted."}
function cancelLeavePlanEdit(){clearStatusForm();E("statusMsg").textContent="Edit cancelled. No saved record was changed."}
function editScheduledPlan(id){
 if(window.__vkvRole&&!['admin','manager'].includes(window.__vkvRole)){alert('This account cannot edit scheduled leave/status entries.');return}
 const p=cachedLeavePlans()[id];if(!p){E("statusMsg").textContent="This scheduled entry could not be found. Refresh and try again.";return}
 show("leave",E("leaveOpsBtn"));
 E("leaveTeacher").value=p.code||"";
 if(p.mode==="multiple"){leaveDateMode="multiple";leaveMultiDates=new Set((p.dates||[]).slice());leaveRangeStart=p.startDate||"";leaveRangeEnd=p.endDate||"";leaveSingleDate=p.startDate||todayKey()}
 else if(p.mode==="range"||(p.startDate&&p.endDate&&p.startDate!==p.endDate)){leaveDateMode="range";leaveRangeStart=p.startDate||p.date||todayKey();leaveRangeEnd=p.endDate||leaveRangeStart;leaveSingleDate=leaveRangeStart;leaveMultiDates=new Set()}
 else{leaveDateMode="single";leaveSingleDate=p.startDate||p.date||todayKey();leaveRangeStart=leaveSingleDate;leaveRangeEnd=leaveSingleDate;leaveMultiDates=new Set()}
 const first=p.startDate||p.date||((p.dates||[])[0])||todayKey(),fd=dateFromKey(first);leaveCalendarMonth=new Date(fd.getFullYear(),fd.getMonth(),1);
 const typeBtn=document.querySelector('[data-leave-type="'+String(p.type||'').replace(/"/g,'')+'"]');chooseStatus(p.type,typeBtn);
 E("dutyNote").value=p.note||"";
 if(p.type==="od"||p.type==="special"){
   let dur=p.duration||((!p.from&&!p.to)?"full":(Number(p.from)===5&&Number(p.to)===8?"half":"custom"));
   const dBtn=document.querySelector('[data-duration="'+dur+'"]');chooseDutyDuration(dur,dBtn);
   if(dur==="custom"){E("dutyFrom").value=String(p.from||"");E("dutyTo").value=String(p.to||"")}
 }
 setLeaveEditUi(id);renderLeaveCalendar();
 E("leaveCategory").value=p.leaveCategory||"";
 E("leaveUnits").value=(p.leaveUnits!==undefined&&p.leaveUnits!==null&&p.leaveUnits!=="")?String(p.leaveUnits):String(autoCalculatedLeaveUnits()||"");
 refreshLeaveCategoryUi(false);onHomepageLeaveTeacherChange();
 E("statusMsg").textContent="Editing saved entry: "+leavePlanDateText(p)+". Change the dates, category or status, then tap Update Entry.";
 E("leave").scrollIntoView({behavior:"smooth",block:"start"});
}
function editScheduledPlanFromHistory(id){editScheduledPlan(id)}

function plansOverlap(a,b){
 if(!a||!b)return false;
 if(a.mode==="multiple")return (a.dates||[]).some(d=>planAppliesToDate(b,d));
 if(b.mode==="multiple")return (b.dates||[]).some(d=>planAppliesToDate(a,d));
 const as=a.startDate||a.date,ae=a.endDate||as,bs=b.startDate||b.date,be=b.endDate||bs;
 return !!as&&!!bs&&as<=be&&bs<=ae;
}
async function saveStatusRecord(){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole)){alert("This account cannot change Leave / OD / Special Assignment / Vacant Position records.");return}
 let c=E("leaveTeacher").value;if(!c){E("statusMsg").textContent="Select a teacher.";return}
 if(!selectedStatus){E("statusMsg").textContent="Select Leave, On Duty, Special Assignment or Vacant Position.";return}
 const spec=selectedDateSpec();if(!spec){E("statusMsg").textContent="Select at least one date.";return}if(spec.invalid){E("statusMsg").textContent="From Date cannot be later than To Date.";return}
 const existing=editingLeavePlanId?cachedLeavePlans()[editingLeavePlanId]:null,wasEditing=!!existing;
 let rec={...(existing||{}),id:editingLeavePlanId||(c+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,7)),code:c,type:selectedStatus,...spec,active:true,createdAtMs:(existing&&existing.createdAtMs)||Date.now()},note=E("dutyNote").value.trim();
 delete rec.date;if(spec.mode!=="multiple")delete rec.dates;delete rec.from;delete rec.to;delete rec.duration;delete rec.note;delete rec.leaveCategory;delete rec.leaveUnits;
 if(selectedStatus==="full"||selectedStatus==="half"){
   const cat=String(E("leaveCategory").value||"").trim().toUpperCase();if(!cat){E("statusMsg").textContent="Select the leave category.";return}
   let units=Number(E("leaveUnits").value);if(!isFinite(units)||units<=0)units=autoCalculatedLeaveUnits();if(!units||units<=0){E("statusMsg").textContent="Enter the number of leave days.";return}
   const ruleError=await validateHomepageLeaveBeforeSave(c,cat,Math.round(units*2)/2);if(ruleError){E("statusMsg").textContent=ruleError;return}
   rec.leaveCategory=cat;rec.leaveUnits=Math.round(units*2)/2;
 }
 if(selectedStatus==="od"||selectedStatus==="special"){
   if(!selectedDuration){E("statusMsg").textContent="Select Full Day, Half Day or Custom Period Range.";return}
   if(selectedDuration==="half"){rec.from=5;rec.to=8;rec.duration="half"}
   else if(selectedDuration==="custom"){let f=Number(E("dutyFrom").value||0),t=Number(E("dutyTo").value||0);if(!f||!t){E("statusMsg").textContent="Select both From and To periods.";return}if(f>t){E("statusMsg").textContent="From Period cannot be later than To Period.";return}rec.from=f;rec.to=t;rec.duration="custom"}
   else{rec.from=0;rec.to=0;rec.duration="full"}
 }
 if(note)rec.note=note;
 const overlap=Object.values(cachedLeavePlans()).find(p=>p&&p.id!==rec.id&&p.code===c&&p.active!==false&&plansOverlap(p,rec));
 if(overlap&&!confirm("This teacher already has a scheduled status overlapping one or more of these dates. Save the new entry anyway?"))return;
 if(typeof window.saveScheduledStatusPlan!=="function"){E("statusMsg").textContent="Cloud scheduling is still loading. Please try again in a moment.";return}
 E("statusMsg").textContent="Saving scheduled entry…";
 try{
   await window.saveScheduledStatusPlan(rec);
   const t=teacherByEffectiveCode(c),desc=leaveDateSpecText(spec),activeToday=planAppliesToDate(rec,todayKey());
   clearStatusForm();
   E("statusMsg").textContent=`${wasEditing?"Updated":"Saved"} for ${t?t.name:c}: ${desc}.${activeToday?" Active today and included in availability calculations.":""}`;
   renderLeave();renderLeavePlansList();proxyPeriod=firstProxyPeriod();renderProxyPeriod();
 }catch(e){E("statusMsg").textContent="Could not save: "+(e&&e.message?e.message:e)}
}
async function deleteSelectedStatus(){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole)){alert("This account cannot change Leave / OD / Special Assignment / Vacant Position records.");return}
 let c=E("leaveTeacher").value;if(!c){E("statusMsg").textContent="Select the teacher whose saved record you want to delete.";return}
 let t=teacherByEffectiveCode(c),a=storedStatusData();
 if(a.some(x=>x.code===c)){
   if(!confirm(`Delete today's manual saved record for ${t?t.name:c}?`))return;
   a=a.filter(x=>x.code!==c);localStorage.setItem("vkvLeave2_"+todayKey(),JSON.stringify(a));saveSnapshot();renderLeave();proxyPeriod=firstProxyPeriod();renderProxyPeriod();clearStatusForm();E("statusMsg").textContent="Today’s manual record deleted.";return;
 }
 const activePlans=Object.values(cachedLeavePlans()).filter(p=>p&&p.code===c&&planAppliesToDate(p,todayKey()));
 if(activePlans.length===1){
   const p=activePlans[0];
   if(!confirm(`This is part of a scheduled entry (${leavePlanDateText(p)}). Delete the entire scheduled entry for ${t?t.name:c}?`))return;
   if(typeof window.deleteScheduledStatusPlan!=="function"){E("statusMsg").textContent="Cloud scheduling is still loading. Please try again.";return}
   await window.deleteScheduledStatusPlan(p.id);clearStatusForm();E("statusMsg").textContent="Scheduled entry deleted.";return;
 }
 if(activePlans.length>1){E("statusMsg").textContent="More than one scheduled entry is active today. Delete the required one from Scheduled / Date-based Entries below.";return}
 E("statusMsg").textContent="No saved record found for this teacher today.";
}
function deleteTodayStatuses(){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole)){alert("This account cannot change Leave / OD / Special Assignment / Vacant Position records.");return}
 if(!confirm("Delete all manual status records saved specifically for today? Scheduled date/range entries will NOT be deleted."))return;
 localStorage.removeItem("vkvLeave2_"+todayKey());saveSnapshot();renderLeave();proxyPeriod=1;renderProxyPeriod();clearStatusForm();E("statusMsg").textContent="Today’s manual status records deleted. Scheduled entries are unchanged.";
}
function clearLeave(){localStorage.removeItem("vkvLeave2_"+todayKey());saveSnapshot();document.querySelectorAll(".leaveBtns button[data-leave-type]").forEach(x=>x.classList.remove("active"));renderLeave()}
function todayName(){return dayNameForDate(todayKey())}

function leavePlanDateText(p){
 if(!p)return"";
 if(p.mode==="multiple"){const ds=(p.dates||[]).slice().sort();return ds.length?`${ds.length} selected date${ds.length===1?"":"s"} · ${ds.slice(0,5).map(x=>formatLeaveDate(x,false)).join(" · ")}${ds.length>5?` · +${ds.length-5} more`:""}`:"No dates"}
 const s=p.startDate||p.date||"",e=p.endDate||s;
 return s===e?formatLeaveDate(s):`${formatLeaveDate(s)} → ${formatLeaveDate(e)}`;
}
function leavePlanState(p){
 const t=todayKey();
 if(planAppliesToDate(p,t))return["Active today","activeNow"];
 if((p.startDate||p.date||"")>t)return["Upcoming","upcoming"];
 if(p.mode==="multiple"&&(p.dates||[]).some(d=>d>t))return["Upcoming","upcoming"];
 return["Completed","completed"];
}
function renderLeavePlansList(){
 const out=E("leavePlansList");if(!out)return;
 const plans=Object.values(cachedLeavePlans()).filter(Boolean).sort((a,b)=>String(a.startDate||a.date||"").localeCompare(String(b.startDate||b.date||""))||String(a.code||"").localeCompare(String(b.code||"")));
 if(!plans.length){out.innerHTML='<div class="small">No scheduled/date-based entries saved yet.</div>';return}
 const canEdit=!window.__vkvRole||["admin","manager"].includes(window.__vkvRole);
 out.innerHTML=plans.map(p=>{
   const t=teacherByEffectiveCode(p.code),[state,cls]=leavePlanState(p),rep=planAppliesToDate(p,todayKey())?activeReplacementForOriginal(p.code,todayKey()):null;
   const coverage=rep?`<div class="leavePlanMeta"><b>Covered by ${esc(rep.tempName||rep.tempCode)}${rep.tempCode?" ("+esc(rep.tempCode)+")":""}</b> · no proxy is generated for the original teacher.</div>`:"";
   const pid=String(p.id).replace(/'/g,"&#39;");
   const account=(p.type==="full"||p.type==="half")?`<div class="leavePlanMeta"><b>${esc(leaveCategoryLabel(p.leaveCategory)||"Uncategorised")}</b>${p.leaveUnits?` · ${esc(p.leaveUnits)} leave day${Number(p.leaveUnits)===1?"":"s"}`:""}</div>`:"";
   return `<div class="leavePlanItem"><div><b>${esc(t?t.name:p.code)}</b> · ${esc(statusLabel(p))}<span class="planState ${cls}">${state}</span><div class="leavePlanMeta">${esc(leavePlanDateText(p))}${p.note?" · "+esc(p.note):""}</div>${account}${coverage}</div>${canEdit?`<div class="actions" style="margin-top:0"><button onclick="editScheduledPlan('${pid}')">✏️ Edit / Dates</button><button class="dangerBtn" onclick="deleteScheduledPlan('${pid}')">Delete</button></div>`:""}</div>`;
 }).join("");
}
async function deleteScheduledPlan(id){
 if(window.__vkvRole&&!["admin","manager"].includes(window.__vkvRole)){alert("This account cannot delete scheduled leave/status entries.");return}
 const p=cachedLeavePlans()[id];if(!p)return;
 const t=teacherByEffectiveCode(p.code);
 if(!confirm(`Delete the scheduled entry for ${t?t.name:p.code} (${leavePlanDateText(p)})?`))return;
 if(typeof window.deleteScheduledStatusPlan!=="function"){E("statusMsg").textContent="Cloud scheduling is still loading. Please try again.";return}
 try{await window.deleteScheduledStatusPlan(id);E("statusMsg").textContent="Scheduled entry deleted.";renderLeave();renderLeavePlansList();proxyPeriod=firstProxyPeriod();renderProxyPeriod()}
 catch(e){E("statusMsg").textContent="Could not delete: "+(e&&e.message?e.message:e)}
}
window.renderLeavePlansList=renderLeavePlansList;

function activeLeaveAt(o,p){if(o.type==="full"||o.type==="vacant")return true;if(o.type==="half"){let f=Number(o.from||5),t=Number(o.to||8);return p>=f&&p<=t}if(o.type==="od"||o.type==="special"){if(!o.from&&!o.to)return true;let f=Number(o.from||1),t=Number(o.to||8);return p>=f&&p<=t}return false}
function freeFor(day,p,leaves,date=todayKey()){let busy=new Set(operationalRecords(date).filter(x=>x.day===day&&Number(x.period)===Number(p)).flatMap(x=>x.codes));leaves.forEach(o=>{if(activeLeaveAt(o,p))busy.add(o.code)});activeTemporaryReplacements(date).forEach(r=>busy.add(r.originalCode));return operationalTeachers(date).filter(t=>!busy.has(t.code)&&!activeReplacementForOriginal(t.code,date))}
function proxyRows(date=proxyDateKey()){
 const statuses=leaveData(date), day=dayNameForDate(date), grouped=new Map();
 statuses.forEach(o=>{
   const code=String(o.code||"").trim();
   if(activeReplacementForOriginal(code,date))return;
   const t=teacherByEffectiveCode(code,date);
   for(const x of operationalRecords(date)){
     if(x.day!==day)continue;
     if(!Array.isArray(x.codes)||!x.codes.includes(code))continue;
     const period=Number(x.period);
     if(!activeLeaveAt(o,period))continue;
     const key=code+"|"+day+"|"+period;
     if(!grouped.has(key))grouped.set(key,{teacher:t?t.name:code,code,type:o.type,period,time:scheduleTime(period),classes:[],entries:[],free:freeFor(day,period,statuses,date)});
     const g=grouped.get(key);
     if(x.class&&!g.classes.includes(x.class))g.classes.push(x.class);
     if(x.entry&&!g.entries.includes(x.entry))g.entries.push(x.entry);
   }
 });
 return [...grouped.values()].map(g=>({...g,className:g.classes.join(" + "),entry:g.entries.join(" / ")}))
   .sort((a,b)=>a.period-b.period||a.teacher.localeCompare(b.teacher)||a.className.localeCompare(b.className));
}
function statusLabel(o){const cat=o&&o.leaveCategory?" · "+leaveCategoryLabel(o.leaveCategory):"";if(o.type==="full")return "Full Leave"+cat;if(o.type==="vacant")return "Vacant Position · Full Day";if(o.type==="half"){const f=Number(o.from||5),t=Number(o.to||8);return `Half Leave P${f}–P${t}`+cat}let base=o.type==="od"?"On Duty":"Special Assignment";let range=(o.duration==="half"||(o.from===5&&o.to===8))?"Half Day · P5–P8":(!o.from&&!o.to)?"Full Day":`P${o.from||1}–P${o.to||8}`;return base+" · "+range+(o.note?" · "+o.note:"")}
function renderLeave(){let a=leaveData(),out=E("leaveResult");if(!a.length){out.innerHTML="No Leave, On Duty, Special Assignment or Vacant Position recorded today.";return}let day=todayName(),rows=proxyRows();let covered=[];let chips=a.map(o=>{let t=teacherByEffectiveCode(o.code),rep=activeReplacementForOriginal(o.code,todayKey());if(rep)covered.push({o,t,rep});return `<span class="tag">${esc(t?t.name:o.code)} · ${statusLabel(o)}${rep?` · Covered by ${esc(rep.tempName||rep.tempCode)}`:""}</span>`}).join("");let coverageNote=covered.length?`<div class="slotComplete" style="margin-top:10px">${covered.map(x=>`✓ ${esc(x.t?x.t.name:x.o.code)} remains recorded as ${esc(statusLabel(x.o))}; ${esc(x.rep.tempName||x.rep.tempCode)} is covering the leave vacancy, so the original teacher's periods do not enter proxy allotment.`).join("<br>")}</div>`:"";let details=rows.length?`<div class="table"><table><tr><th>Unavailable Teacher</th><th>Period</th><th>Class</th><th>Scheduled Period</th><th>Free Teachers for Proxy</th></tr>${rows.map(r=>`<tr><td>${esc(r.teacher)}</td><td>${PL(r.period)}<br><span class="small">${r.time}</span></td><td>${r.className}</td><td>${esc(r.entry)}</td><td>${r.free.slice(0,15).map(t=>`<span class="tag">${esc(t.name)} (${t.code})</span>`).join("")}</td></tr>`).join("")}</table></div>`:`<p>No affected teaching periods require proxy for ${day}.</p>`;out.innerHTML=`<div><b>Unavailable / Engaged for ${day}:</b><br>${chips}${coverageNote}</div><div class="proxycard"><div class="proxyhead">Periods Requiring Proxy · ${rows.length} timetable entr${rows.length===1?"y":"ies"}</div>${details}<div class="small">A teacher covered by an active leave-vacancy replacement remains shown on leave, but those covered periods are excluded from proxy requirements. If the replacement teacher is absent, the inherited periods become proxy requirements.</div></div>`}
function proxyText(){
 const day=todayName(), date=displayDate(), a=Object.values(allotData()).filter(x=>x&&x.day===day).sort((x,y)=>Number(x.period)-Number(y.period)||String(x.name).localeCompare(String(y.name)));
 let lines=["VKV NALBARI — PROXY ALLOTMENT",day+", "+date,""];
 if(!a.length){lines.push("No proxy allotments recorded.");return lines.join("\n")}
 let current=null;
 a.forEach(x=>{
   if(Number(x.period)!==current){
     if(current!==null)lines.push("");
     current=Number(x.period);
     lines.push(PL(current)+" ("+(scheduleTime(current)||x.time||"")+")");
   }
   lines.push("• "+x.name+" ("+x.code+") — Regular "+x.regular+" + Proxy "+x.proxyNumber+" = Total "+x.total+(x.warn?" — "+x.warn:""));
 });
 lines.push("","Total proxy allotments: "+a.length);
 return lines.join("\n");
}
async function copyProxy(){let text=proxyText(),msg=E("copyMsg");try{await navigator.clipboard.writeText(text);msg.textContent="Copied."}catch(e){let ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");msg.textContent="Copied."}catch(x){msg.textContent="Copy not supported in this viewer."}ta.remove()}}
async function shareProxy(){let c=proxyCompletion();if(c.required&&c.covered<c.required){alert("Share becomes available only after all proxy requirements are allotted and finalised.");return}let text=proxyText();if(navigator.share){try{await navigator.share({title:"VKV Nalbari — Proxy Allotment",text});return}catch(e){}}await copyProxy();E("copyMsg").textContent="Sharing unavailable here; proxy list copied instead."}


function viewText(resultId,title){
 let el=E(resultId);if(!el)return title;
 let text=(el.innerText||el.textContent||"").trim();
 return `VKV Nalbari – ${title}\n${text}`;
}
async function copyTextSafe(text,msgId){
 let msg=E(msgId);
 try{await navigator.clipboard.writeText(text);if(msg)msg.textContent="Copied."}
 catch(e){let ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");if(msg)msg.textContent="Copied."}catch(x){if(msg)msg.textContent="Copy unavailable in this viewer."}ta.remove()}
}
async function copyView(resultId,title){await copyTextSafe(viewText(resultId,title),resultId+"Msg")}
async function shareView(resultId,title){
 let text=viewText(resultId,title);
 if(navigator.share){try{await navigator.share({title:`VKV Nalbari – ${title}`,text});return}catch(e){}}
 await copyTextSafe(text,resultId+"Msg");let msg=E(resultId+"Msg");if(msg)msg.textContent="Sharing unavailable here; copied instead.";
}

function todayKey(){let n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")}
let proxyWorkDate=todayKey(),proxyWorkPollTimer=null,previousProxyWorkDate=todayKey();
let proxyViewMode="period";
let proxyEmergencyPanelOpen=false;
function proxyDateKey(){return proxyWorkDate||todayKey()}
function proxyDayName(){return dayNameForDate(proxyDateKey())}
function nextDayKey(){let d=dateFromKey(todayKey());d.setDate(d.getDate()+1);return dateKeyFromDate(d)}
function proxyFutureLimitKey(){let d=dateFromKey(todayKey());d.setDate(d.getDate()+3);return dateKeyFromDate(d)}
function setupProxyDateSelector(){const el=E("proxyWorkDate");if(!el)return;el.value=displayDate(proxyDateKey());updateProxyDateUi()}
function updateProxyDateUi(){const date=proxyDateKey(),offset=Math.round((dateFromKey(date)-dateFromKey(todayKey()))/86400000),scope=offset===0?"Today’s":offset>0?`Day +${offset} Proxy`:"Earlier Date";if(E("proxyScopeTitle"))E("proxyScopeTitle").textContent=scope;if(E("proxyDateLabel"))E("proxyDateLabel").textContent="· "+displayDate(date)+" · "+proxyDayName()}
function historicalProxyAuthorised(){return proxyDateKey()>=todayKey()||window.__vkvRole==='admin'||!!(window.__vkvHistoricalProxyAuthorization&&window.__vkvHistoricalProxyAuthorization.enabled===true&&window.__vkvHistoricalProxyAuthorization.date===proxyDateKey())}
async function changeProxyWorkDate(){const el=E("proxyWorkDate"),date=el&&inputDate(el.value);if(!date||date>proxyFutureLimitKey()){alert("Enter a valid date as dd/mm/yyyy. A proxy record can be prepared for today and the coming three days.");el.value=displayDate(previousProxyWorkDate);return}proxyEmergencyPanelOpen=false;const old=previousProxyWorkDate;proxyWorkDate=date;el.value=displayDate(date);updateProxyDateUi();proxyPeriod=firstProxyPeriod();E("allotPeriod").value=String(proxyPeriod);E("allotReview").style.display="none";await loadProxyWorkState(date);if(date<todayKey()&&!historicalProxyAuthorised()){alert("This earlier date is locked. The Principal must authorise historical proxy entry or correction first.");proxyWorkDate=old||todayKey();el.value=displayDate(proxyWorkDate);updateProxyDateUi();await loadProxyWorkState(proxyWorkDate);return}previousProxyWorkDate=date;renderActiveProxyView()}
async function loadProxyWorkState(date){if(window.loadProxyWorkCloud){try{await window.loadProxyWorkCloud(date)}catch(e){console.warn("Proxy date load:",e)}}renderTodayProxyStatusSummary();renderProxyLockState();renderActiveProxyView()}
function proxyIsLocked(){const p=window.__vkvWorkPublishedProxy;return !!(p&&p.date===proxyDateKey()&&!p.correctionEnabled)}
function ensureProxyEditable(){if(window.__vkvRole&&!['admin','manager','proxy_manager'].includes(window.__vkvRole)){alert('This account has view-only proxy access.');return false}if(proxyDateKey()<todayKey()&&!historicalProxyAuthorised()){alert("This earlier date is locked. The Principal must authorise it before the Proxy Manager can add or correct a record.");return false}if(proxyIsLocked()){alert("This proxy timetable is finalised and locked. The Principal must enable correction first.");return false}return true}
function renderProxyLockState(){const p=window.__vkvWorkPublishedProxy,locked=proxyIsLocked(),past=proxyDateKey()<todayKey(),authorised=historicalProxyAuthorised(),note=E("publishedDraftNote"),unlock=E("enableCorrectionBtn"),pastBtn=E("authorisePastProxyBtn"),finalBtn=E("finaliseProxyBtn");if(note){note.style.display=(!!p||past)?"block":"none";note.innerHTML=locked?"<b>Finalised and locked.</b> The Principal may enable correction for a mistake or emergency.":past&&authorised?"<b>Earlier-date work authorised.</b> The Proxy Manager may add or correct this record and must Review &amp; Finalise it again.":past?"<b>Earlier date locked.</b> Principal authorisation is required before any entry or correction.":p?"<b>Correction enabled.</b> Changes remain a draft until Review &amp; Finalise is completed again.":""}if(unlock)unlock.style.display=locked&&window.__vkvRole==='admin'&&!past?"inline-block":"none";if(pastBtn)pastBtn.style.display=past&&window.__vkvRole==='admin'?"inline-block":"none";if(finalBtn)finalBtn.disabled=locked||!authorised}
window.renderProxyLockState=renderProxyLockState;
async function enableProxyCorrection(){if(window.__vkvRole!=="admin"){alert("Only the Principal can enable correction.");return}const reason=prompt("Reason for enabling correction (mistake or emergency):");if(!reason||!reason.trim())return;try{const pub=await window.enableProxyCorrectionCloud(proxyDateKey(),reason.trim());window.__vkvWorkPublishedProxy=pub;renderProxyLockState();E("allotMsg").textContent="Correction enabled. The Proxy Manager may now revise and re-finalise this date."}catch(e){alert("Could not enable correction: "+(e.message||e))}}
async function authoriseHistoricalProxy(){if(window.__vkvRole!=="admin"){alert("Only the Principal can authorise an earlier proxy record.");return}if(proxyDateKey()>=todayKey()){alert("Select an earlier date first.");return}const reason=prompt("Reason for authorising this earlier proxy record or correction:");if(!reason||!reason.trim())return;try{const result=await window.authoriseHistoricalProxyCloud(proxyDateKey(),reason.trim());window.__vkvHistoricalProxyAuthorization=result.authorization;if(result.published)window.__vkvWorkPublishedProxy=result.published;renderProxyLockState();E("allotMsg").textContent="Earlier date authorised. The Proxy Manager may now add or correct and re-finalise this record."}catch(e){alert("Could not authorise the earlier record: "+(e.message||e))}}
function renderTodayProxyStatusSummary(){const out=E("proxyTodayStatusSummary");if(!out)return;const base=Array.isArray(window.__vkvTodayStatusSummary)?window.__vkvTodayStatusSummary:leaveData(todayKey()),planned=window.plannedStatusesForDate?window.plannedStatusesForDate(todayKey()):[],seen=new Set(base.map(x=>x&&x.code).filter(Boolean)),rows=[...base,...planned.filter(x=>x&&x.code&&!seen.has(x.code))].filter(o=>o&&['full','half','od','special','vacant'].includes(o.type));if(!rows.length){out.innerHTML='<b>Today’s Leave / Duty Leave / Operational Status Summary</b><div class="small" style="margin-top:5px">No approved Leave, Duty Leave or Vacant Position record is available for today.</div>';return}out.innerHTML='<b>Today’s Leave / Duty Leave / Operational Status Summary</b><div class="small" style="margin:4px 0 8px">'+rows.length+' staff record'+(rows.length===1?'':'s')+' affecting today’s availability.</div>'+rows.map(o=>{const t=teacherByEffectiveCode(o.code,todayKey());return '<div style="padding:4px 0;border-top:1px solid #dbe7df"><b>'+esc(t?t.name:o.code)+'</b> ('+esc(o.code)+') — '+esc(statusLabel(o))+'</div>'}).join('')}
window.renderTodayProxyStatusSummary=renderTodayProxyStatusSummary;
function displayDate(k){if(k){const m=String(k).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(k)}let n=new Date();return String(n.getDate()).padStart(2,"0")+"/"+String(n.getMonth()+1).padStart(2,"0")+"/"+n.getFullYear()}
function inputDate(v){const m=String(v||"").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return"";const iso=`${m[3]}-${m[2]}-${m[1]}`,d=new Date(iso+"T00:00:00");return d.getFullYear()===Number(m[3])&&d.getMonth()+1===Number(m[2])&&d.getDate()===Number(m[1])?iso:""}
function displayDateTime(ms=Date.now()){const d=new Date(Number(ms)||0),p=n=>String(n).padStart(2,"0");return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`}
function historyData(){try{return JSON.parse(localStorage.getItem("vkvHistory")||"{}")}catch(e){return{}}}
function saveSnapshot(day=todayKey()){let h=historyData();h[day]={date:day,dayName:dayNameForDate(day),statuses:storedStatusData(day),allotments:allotData(day),supervisions:supervisionData(day)};localStorage.setItem("vkvHistory",JSON.stringify(h))}
function allotData(date=proxyDateKey()){try{
 const key="vkvAllotments_"+date;
 let v=localStorage.getItem(key);
 if(v!==null)return JSON.parse(v||"{}");
 return {};
}catch(e){return{}}}
function saveAllotData(x,date=proxyDateKey()){localStorage.setItem("vkvAllotments_"+date,JSON.stringify(x));saveSnapshot(date)}
const VERIFIED_SUPPLEMENTAL_SLOTS=()=>((DATA&&DATA.supplementalSlots)||{});
function uniqueTeachingSlots(code,day,date=proxyDateKey()){
 const periods=new Set(operationalRecords(date).filter(x=>x.day===day&&Array.isArray(x.codes)&&x.codes.includes(code)).map(x=>Number(x.period)));
 const activeP=new Set(activeSchedulePeriods());
 ((VERIFIED_SUPPLEMENTAL_SLOTS()[code]||{})[day]||[]).forEach(p=>{p=Number(p);if(activeP.has(p))periods.add(p)});
 return periods.size;
}
function dailyRegularLoad(code,day,date=proxyDateKey()){return uniqueTeachingSlots(code,day,date)}
function proxyCount(code){let day=proxyDayName();return Object.values(allotData()).filter(x=>x&&x.day===day&&x.code===code).length}
function totalLoad(code,day){return dailyRegularLoad(code,day)+proxyCount(code)}
function occupiedSlots(code,day,includeProposed){let set=new Set(operationalRecords(proxyDateKey()).filter(x=>x.day===day&&x.codes.includes(code)).map(x=>Number(x.period)));Object.values(allotData()).filter(x=>x&&x.day===day&&x.code===code).forEach(x=>set.add(Number(x.period)));if(includeProposed)set.add(Number(includeProposed));return set}
function continuousWarning(code,p){
 const set=occupiedSlots(code,proxyDayName(),Number(p));
 for(const block of [[1,2,3,4],[5,6,7,8]]){
   if(block.every(x=>set.has(x))) return `⚠️ 4 continuous periods: P${block[0]}–P${block[3]}`;
 }
 return "";
}
function activeStatusAt(o,p){return activeLeaveAt(o,p)}
function isFreeForProxy(code,p,excludeNeedKey){let day=proxyDayName();if(operationalRecords(proxyDateKey()).some(x=>x.day===day&&Number(x.period)===Number(p)&&x.codes.includes(code)))return false;if(leaveData(proxyDateKey()).some(o=>o.code===code&&activeStatusAt(o,p)))return false;let a=allotData();return !Object.entries(a).some(([k,x])=>x&&x.day===day&&Number(x.period)===Number(p)&&x.code===code&&k!==excludeNeedKey)}
function proxyNeedsForPeriod(p){return proxyRows().filter(r=>r.period===p)}
function proxyNavigationPeriods(){const p=activeSchedulePeriods();return p.length?p:[1,2,3,4,5,6,7,8]}
function firstProxyPeriod(){let rows=proxyRows();return rows.length?Math.min(...rows.map(r=>Number(r.period))):(proxyNavigationPeriods()[0]||1)}
function openProxyAllotment(btn){show("allot",btn);setupProxyDateSelector();proxyPeriod=firstProxyPeriod();proxyViewMode="period";proxyEmergencyPanelOpen=false;E("allotPeriod").value=String(proxyPeriod);renderProxyPeriod();loadProxyWorkState(proxyDateKey())}
function needKey(r){return proxyDayName()+"|"+r.period+"|"+r.className+"|"+r.code}
function supervisionData(date=proxyDateKey()){try{return JSON.parse(localStorage.getItem("vkvSupervision_"+date)||"{}")}catch(e){return{}}}
function saveSupervisionData(x,date=proxyDateKey()){localStorage.setItem("vkvSupervision_"+date,JSON.stringify(x));saveSnapshot(date)}
function supervisionCount(code){return Object.values(supervisionData()).filter(x=>x&&x.day===proxyDayName()&&x.code===code).length}
function emergencyCandidates(p,key){
 const day=proxyDayName(), statuses=leaveData(proxyDateKey()), sup=supervisionData();
 return operationalTeachers(proxyDateKey()).filter(t=>{
   if(activeReplacementForOriginal(t.code,proxyDateKey()))return false;
   if(statuses.some(o=>o.code===t.code&&activeLeaveAt(o,Number(p))))return false;
   if(Object.entries(sup).some(([k,x])=>k!==key&&x&&x.day===day&&Number(x.period)===Number(p)&&x.code===t.code))return false;
   // Emergency supervision deliberately includes teachers already teaching in this period.
   return operationalRecords(proxyDateKey()).some(x=>x.day===day&&Number(x.period)===Number(p)&&Array.isArray(x.codes)&&x.codes.includes(t.code));
 }).map(t=>{
   const classes=operationalRecords(proxyDateKey()).filter(x=>x.day===day&&Number(x.period)===Number(p)&&Array.isArray(x.codes)&&x.codes.includes(t.code)).map(x=>x.class);
   return {code:t.code,name:t.name,classes:[...new Set(classes)],regular:dailyRegularLoad(t.code,day),proxies:proxyCount(t.code),supervisions:supervisionCount(t.code)};
 }).sort((a,b)=>(a.proxies+a.supervisions)-(b.proxies+b.supervisions)||a.regular-b.regular||a.name.localeCompare(b.name));
}
function showEmergencyForNeed(btn){
 const area=E(btn.dataset.target),p=Number(btn.dataset.period),k=decodeURIComponent(btn.dataset.key);
 if(!area)return;
 if(area.innerHTML){area.innerHTML="";btn.classList.remove("active");proxyEmergencyPanelOpen=false;return}
 proxyEmergencyPanelOpen=true;
 btn.classList.add("active");
 const ec=emergencyCandidates(p,k);
 let h='<div class="emergencyBox"><div class="proxyhead">Emergency Supervision · '+PL(p)+' · '+esc(scheduleTime(p))+'</div><div class="small" style="margin-bottom:8px">Showing only teachers already engaged in this time slot.</div>';
 if(!ec.length){area.innerHTML=h+'<div class="warn">No engaged teacher found for this time slot.</div></div>';return}
 h+='<select id="'+btn.dataset.target+'Pick"><option value="">Select engaged teacher…</option>';
 ec.forEach(t=>{h+='<option value="'+esc(t.code)+'">'+esc(t.name)+' ('+esc(t.code)+') — teaching '+esc(t.classes.join(", "))+' · Regular '+t.regular+' + Proxy '+t.proxies+' + Supervision '+t.supervisions+'</option>'});
 h+='</select><button type="button" class="emergencyBtn" data-pick="'+btn.dataset.target+'Pick" data-key="'+encodeURIComponent(k)+'" data-period="'+p+'" onclick="assignEmergencyFromButton(this)">Assign Emergency Supervision</button></div>';
 area.innerHTML=h;
}
function assignEmergencyFromButton(btn){if(window.__vkvRole&&!['admin','manager','proxy_manager'].includes(window.__vkvRole)){alert('This account has view-only proxy access.');return;}let sel=E(btn.dataset.pick),v=sel?sel.value:"";if(!v){alert("Please select an engaged teacher.");return}proxyEmergencyPanelOpen=false;allotEmergency(btn.dataset.key,v,Number(btn.dataset.period))}
function allotEmergency(encKey,code,p){if(!ensureProxyEditable())return;
 const k=decodeURIComponent(encKey),t=teacherByEffectiveCode(code);if(!t)return;
 if(!confirm("Emergency Supervision assigns an additional adjacent-class supervision duty to a teacher who is already teaching in this period. Continue?"))return;
 const d=supervisionData(),ec=emergencyCandidates(p,k).find(x=>x.code===code);
 d[k]={key:k,code:code,name:t.name,period:Number(p),time:scheduleTime(p),day:proxyDayName(),regular:dailyRegularLoad(code,proxyDayName()),proxy:proxyCount(code),supervisionNumber:supervisionCount(code)+1,engagedClasses:ec?ec.classes:[]};
 saveSupervisionData(d);showAllProxyNeeds();renderLeave();
}
function removeEmergency(encKey){if(!ensureProxyEditable())return;let k=decodeURIComponent(encKey),d=supervisionData();delete d[k];saveSupervisionData(d);showAllProxyNeeds();renderLeave()}
function candidateList(p,key){
 const day=proxyDayName(), statuses=leaveData(proxyDateKey()), allot=allotData();
 return operationalTeachers(proxyDateKey()).filter(t=>{
   if(activeReplacementForOriginal(t.code,proxyDateKey()))return false;
   if(operationalRecords(proxyDateKey()).some(x=>x.day===day&&Number(x.period)===Number(p)&&Array.isArray(x.codes)&&x.codes.includes(t.code)))return false;
   if((((VERIFIED_SUPPLEMENTAL_SLOTS()[t.code]||{})[day]||[]).map(Number)).includes(Number(p)))return false;
   if(statuses.some(o=>o.code===t.code&&activeLeaveAt(o,Number(p))))return false;
   if(Object.entries(allot).some(([k,x])=>k!==key&&x&&x.day===day&&Number(x.period)===Number(p)&&x.code===t.code))return false;
   return true;
 }).map(t=>({code:t.code,name:t.name,temporary:!!t.temporary,originalCode:t.originalCode||"",regular:dailyRegularLoad(t.code,day),proxies:proxyCount(t.code),total:totalLoad(t.code,day),warn:continuousWarning(t.code,Number(p))}))
 .sort((a,b)=>a.total-b.total||a.proxies-b.proxies||a.name.localeCompare(b.name));
}
function renderActiveProxyView(backgroundRefresh=false){if(backgroundRefresh&&proxyEmergencyPanelOpen)return;if(proxyViewMode==="all")showAllProxyNeeds(true);else renderProxyPeriod(true)}
function prevProxyPeriod(){proxyEmergencyPanelOpen=false;proxyViewMode="period";const ps=proxyNavigationPeriods();let i=ps.indexOf(Number(proxyPeriod));if(i<0)i=0;proxyPeriod=ps[Math.max(0,i-1)]||ps[0]||1;E("allotPeriod").value=String(proxyPeriod);renderProxyPeriod()}
function nextProxyPeriod(){proxyEmergencyPanelOpen=false;proxyViewMode="period";const ps=proxyNavigationPeriods();let i=ps.indexOf(Number(proxyPeriod));if(i<0)i=0;proxyPeriod=ps[Math.min(ps.length-1,i+1)]||ps[0]||1;E("allotPeriod").value=String(proxyPeriod);renderProxyPeriod()}
function renderProxyPeriod(){
 proxyViewMode="period";
 let ps=proxyNavigationPeriods();if(!ps.includes(Number(proxyPeriod)))proxyPeriod=ps[0]||1;let p=proxyPeriod,day=proxyDayName(),needs=proxyNeedsForPeriod(p),a=allotData(),allNeeds=proxyRows(),idx=Math.max(0,ps.indexOf(Number(p)));E("proxyPeriodTitle").textContent=`${PL(p)} · ${scheduleTime(p)}`;E("proxyProgress").textContent=`Period ${idx+1} of ${ps.length} · ${day} · ${allNeeds.length} proxy requirement${allNeeds.length===1?"":"s"} for this date`;E("allotPeriod").value=String(p);
 if(!needs.length){let all=proxyRows();E("allotResult").innerHTML=all.length?`<div class="proxySummary">✓ No proxy required in ${PL(p)}.</div><div class="small">${all.length} proxy requirement${all.length===1?"":"s"} exist today in other period(s). Use Next/Previous or Jump to Period.</div>`:`<div class="proxySummary">✓ No proxy is required for the whole day based on the saved Leave / OD / Special Assignment records.</div>`;return}
 let completed=needs.length&&needs.every(r=>!!a[needKey(r)]||!!supervisionData()[needKey(r)]);
 E("allotResult").innerHTML=(completed?`<div class="slotComplete">✓ Allotment for this time slot completed.</div>`:"")+needs.map(r=>{let k=needKey(r),assigned=a[k],cands=candidateList(p,k);let info=`<div class="needInfo"><b>${r.className}</b><br>${esc(r.teacher)} · ${esc(r.entry)}<br><span class="small">${PL(p)} · ${r.time}</span>${assigned?`<div class="proxycard assigned"><b>Allotted:</b> ${esc(assigned.name)} (${assigned.code})<br><span class="loadpill">Regular ${assigned.regular} + Proxy ${assigned.proxyNumber} = Total ${assigned.regular+assigned.proxyNumber}</span><br><button onclick="removeProxy('${encodeURIComponent(k)}')">Change / Remove</button></div>`:""}</div>`;
 let emergencyId=`periodEmergency${p}_${Math.abs([...k].reduce((n,c)=>((n*31)+c.charCodeAt(0))|0,0))}`;
 let list=assigned?"":`<div><div class="proxyhead">Available teachers — lowest current load first</div>${cands.map(t=>`<div class="candidate"><div><b>${esc(t.name)}</b> (${t.code})${t.temporary?' <span class="tag">Temporary replacement</span>':''}<div class="loadpill">Regular ${t.regular} + Proxy ${t.proxies} = Total ${t.total}</div>${t.warn?`<div class="warn">${t.warn} · warning only</div>`:""}</div><button onclick="attemptProxy('${encodeURIComponent(k)}','${t.code}',${p})">Allot${t.warn?" Anyway":""}</button></div>`).join("")||"<p>No free teacher available.</p>"}<div class="emergencyAction"><button type="button" class="emergencyBtn" data-target="${emergencyId}" data-key="${encodeURIComponent(k)}" data-period="${p}" onclick="showEmergencyForNeed(this)">⚠ Emergency Supervision</button><div id="${emergencyId}"></div></div></div>`;
 return `<div class="needcard ${assigned?"done":""}">${info}${list}</div>`}).join("");
}
function attemptProxy(encKey,code,p){if(!ensureProxyEditable())return;let k=decodeURIComponent(encKey),t=teacherByEffectiveCode(code,proxyDateKey());if(!t)return;let warn=continuousWarning(code,p);if(warn&&!confirm(warn+"\\n\\nThis is an advisory warning. Allot anyway?"))return;let a=allotData(),regular=dailyRegularLoad(code,proxyDayName()),before=proxyCount(code);a[k]={key:k,code,name:t.name,period:p,time:scheduleTime(p),day:proxyDayName(),regular,proxyNumber:before+1,total:regular+before+1,warn};saveAllotData(a);renderProxyPeriod();renderLeave()}
function removeProxy(encKey){if(!ensureProxyEditable())return;let k=decodeURIComponent(encKey),a=allotData();delete a[k];saveAllotData(a);renderProxyPeriod();renderLeave()}
function showAllProxyNeeds(preserveMode){
 try{
   if(!preserveMode)proxyEmergencyPanelOpen=false;
   proxyViewMode="all";
   const rows=proxyRows(), out=E("allotResult");
   if(!out)return;
   if(!rows.length){out.innerHTML='<div class="warn">No proxy requirements found for today.</div>';return}
   let html='<h3>All Required Proxies — '+proxyDayName()+' · '+displayDate(proxyDateKey())+'</h3><p class="small">'+rows.length+' affected timetable entr'+(rows.length===1?'y':'ies')+'. Select a free teacher and tap Allot.</p>';
   const completedPeriods=new Set();
   for(const pp of proxyNavigationPeriods()){let rr=rows.filter(x=>Number(x.period)===Number(pp));if(rr.length&&rr.every(x=>!!allotData()[needKey(x)]||!!supervisionData()[needKey(x)]))completedPeriods.add(Number(pp))}
   let announced=new Set();
   rows.forEach((r,i)=>{
     const k=needKey(r), a=allotData(), assigned=a[k], supervision=supervisionData()[k];
     if(completedPeriods.has(Number(r.period))&&!announced.has(Number(r.period))){html+='<div class="slotComplete">✓ '+PL(r.period)+' ('+esc(scheduleTime(r.period)||r.time||'')+') — allotment for this time slot completed.</div>';announced.add(Number(r.period))}
     html+='<div class="proxycard"><div class="proxyhead">'+PL(r.period)+' · '+esc(scheduleTime(r.period)||r.time||'')+' · '+esc(r.className)+'</div>';
     html+='<div>'+esc(r.teacher)+' ('+esc(r.code)+') · '+esc(r.entry)+'</div>';
     if(supervision && supervision.code){
       html+='<div class="emergencyBox"><b>⚠ Emergency Supervision:</b> '+esc(supervision.name)+' ('+esc(supervision.code)+')<br><span class="small">Already teaching: '+esc((supervision.engagedClasses||[]).join(", ")||"another class")+'</span><br><button type="button" onclick="removeEmergency(\''+encodeURIComponent(k)+'\')">Remove Emergency Supervision</button></div>';
     }else if(assigned && assigned.code){
       const nm=assigned.name||(DATA.teachers.find(t=>t.code===assigned.code)||{}).name||assigned.code;
       html+='<div class="candidate"><div><b>✓ '+esc(nm)+'</b> ('+esc(assigned.code)+')</div><button type="button" onclick="removeProxySimple(\''+encodeURIComponent(k)+'\')">Remove</button></div>';
     }else{
       let cands=[];
       try{cands=candidateList(Number(r.period),k)||[]}catch(e){html+='<div class="warn"><b>Candidate calculation error:</b> '+esc(e.message||String(e))+'</div>';cands=[]}
       html+='<div class="controls"><div><label>Available teacher</label><select id="proxyPick'+i+'"><option value="">Select…</option>';
       cands.forEach(t=>{html+='<option value="'+esc(t.code)+'">'+esc(t.name)+' ('+esc(t.code)+')'+(t.temporary?' — Temporary replacement':'')+' — Regular '+t.regular+' + Proxy '+t.proxies+' = '+t.total+(t.warn?' ⚠':'')+'</option>'});
       html+='</select></div><div style="align-self:end"><button type="button" onclick="allotProxySimple('+i+',\''+encodeURIComponent(k)+'\','+Number(r.period)+')">Allot</button></div></div>';
       if(!cands.length)html+='<div class="warn">No free teacher available for this period. Emergency Supervision may be used if appropriate.</div>';
       html+='<div class="emergencyAction"><button type="button" class="emergencyBtn" data-target="emergencyArea'+i+'" data-key="'+encodeURIComponent(k)+'" data-period="'+Number(r.period)+'" onclick="showEmergencyForNeed(this)">⚠ Emergency Supervision</button><div id="emergencyArea'+i+'"></div></div>';
     }
     html+='</div>';
   });
   out.innerHTML=html;
 }catch(err){
   const out=E("allotResult");if(out)out.innerHTML='<div class="warn"><b>Proxy screen error:</b> '+esc(err&&err.message?err.message:String(err))+'</div>';
 }
}
function allotProxySimple(i,encKey,p){if(!ensureProxyEditable())return;
 const sel=E("proxyPick"+i),code=sel?sel.value:"";if(!code){alert("Please select a teacher.");return}
 const t=teacherByEffectiveCode(code,proxyDateKey());if(!t){alert("Teacher code not found.");return}
 const warn=continuousWarning(code,p);if(warn&&!confirm(warn+"\n\nThis is an advisory warning. Allot anyway?"))return;
 const k=decodeURIComponent(encKey),a=allotData(),regular=dailyRegularLoad(code,proxyDayName()),before=proxyCount(code);
 a[k]={key:k,code:code,name:t.name,period:p,time:scheduleTime(p),day:proxyDayName(),regular:regular,proxyNumber:before+1,total:regular+before+1,warn:warn};
 saveAllotData(a);showAllProxyNeeds();renderLeave();
}
function removeProxySimple(encKey){if(!ensureProxyEditable())return;const k=decodeURIComponent(encKey),a=allotData();delete a[k];saveAllotData(a);showAllProxyNeeds();renderLeave()}
function attemptProxyFromAll(encKey,code,p){if(!ensureProxyEditable())return;let k=decodeURIComponent(encKey),t=teacherByEffectiveCode(code,proxyDateKey());if(!t)return;let warn=continuousWarning(code,p);if(warn&&!confirm(warn+"\\n\\nThis is an advisory warning. Allot anyway?"))return;let a=allotData(),regular=dailyRegularLoad(code,proxyDayName()),before=proxyCount(code);a[k]={key:k,code,name:t.name,period:p,time:scheduleTime(p),day:proxyDayName(),regular,proxyNumber:before+1,total:regular+before+1,warn};saveAllotData(a);showAllProxyNeeds();renderLeave()}
function removeProxyAndShowAll(encKey){if(!ensureProxyEditable())return;let k=decodeURIComponent(encKey),a=allotData();delete a[k];saveAllotData(a);showAllProxyNeeds();renderLeave()}
function proxyReasonForNeed(r){
 const o=leaveData(proxyDateKey()).find(x=>x.code===r.code&&activeLeaveAt(x,Number(r.period)));
 if(!o)return "Unavailable";
 if(o.type==="full")return "Full Leave";
 if(o.type==="half")return "Half Leave";
 if(o.type==="vacant")return "Vacant Position";
 if(o.type==="od")return "On Duty"+(o.note?" — "+o.note:"");
 if(o.type==="special")return "Special Assignment"+(o.note?" — "+o.note:"");
 return statusLabel(o);
}
function finalDutyRows(){
 const needs=proxyRows(),a=allotData(),sup=supervisionData(),rows=[];
 needs.forEach(r=>{
   const k=needKey(r),x=a[k],e=sup[k];
   if(x){
     rows.push({period:Number(r.period),time:scheduleTime(r.period)||r.time||"",className:r.className,
       absentTeacher:r.teacher,absentCode:r.code,reason:proxyReasonForNeed(r),
       assignedName:x.name||(DATA.teachers.find(t=>t.code===x.code)||{}).name||x.code,
       assignedCode:x.code,kind:"Normal Proxy",regular:x.regular,proxyNumber:x.proxyNumber,total:x.total,warn:x.warn||""});
   }else if(e){
     rows.push({period:Number(r.period),time:scheduleTime(r.period)||r.time||"",className:r.className,
       absentTeacher:r.teacher,absentCode:r.code,reason:proxyReasonForNeed(r),
       assignedName:e.name||(DATA.teachers.find(t=>t.code===e.code)||{}).name||e.code,
       assignedCode:e.code,kind:"Emergency Supervision",engagedClasses:e.engagedClasses||[]});
   }
 });
 return rows.sort((x,y)=>x.period-y.period||String(x.className).localeCompare(String(y.className)));
}
function proxyCompletion(){
 const needs=proxyRows(),a=allotData(),sup=supervisionData();
 return {required:needs.length,covered:needs.filter(r=>!!a[needKey(r)]||!!sup[needKey(r)]).length};
}
function reviewProxies(){
 try{
 const rows=finalDutyRows(),c=proxyCompletion(),out=E("allotReview");
 if(!out){alert("Review area could not be opened.");return}
 out.style.display="block";
 let ready=c.required>0&&c.covered===c.required;
 out.innerHTML=`<div class="${ready?"slotComplete":"warn"}"><b>${ready?"✓ Proxy list ready for print":"Proxy list incomplete"}</b><br>${c.covered} of ${c.required} requirements allotted. Normal Proxy and Emergency Supervision are both counted as valid allotments.</div>
 <div class="printSheet">
 <div class="printHead"><h2>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h2><h3>PROXY ALLOTMENT</h3><div><b>Date:</b> ${displayDate(proxyDateKey())} &nbsp;&nbsp; <b>Day:</b> ${proxyDayName()}</div></div>
 ${rows.length?`<div class="table"><table><tr><th>Period / Time</th><th>Class</th><th>Proxy For / Reason</th><th>Teacher Allotted</th><th>Teacher's Signature</th></tr>${rows.map(x=>`<tr><td>${PL(x.period)}<br>${esc(x.time)}</td><td>${esc(x.className)}</td><td>${esc(x.absentTeacher)} (${esc(x.absentCode)})<br><span class="small">${esc(x.reason)}</span>${x.kind==="Emergency Supervision"?'<br><b>Emergency Supervision</b>':""}</td><td>${esc(x.assignedName)} (${esc(x.assignedCode)})</td><td class="signatureCell">&nbsp;</td></tr>`).join("")}</table></div>`:"No duties allotted."}
 <div class="principalSignature">Principal's Signature: ______________________________</div>
 </div>`;
 saveSnapshot(proxyDateKey());
 setTimeout(()=>out.scrollIntoView({behavior:"smooth",block:"start"}),50)

 }catch(err){
   const out=E("allotReview");
   if(out){out.style.display="block";out.innerHTML='<div class="warn"><b>Review error:</b> '+esc(err&&err.message?err.message:String(err))+'</div>'}
   else alert("Review error: "+(err&&err.message?err.message:String(err)));
 }
}


function proxyPrintSheetHtml(rows,date=proxyDateKey(),day=dayNameForDate(date)){
 return `<div class="printSheet">
 <div class="printHead"><h2>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h2><h3>PROXY ALLOTMENT</h3><div><b>Date:</b> ${displayDate(date)} &nbsp;&nbsp; <b>Day:</b> ${day}</div></div>
 ${rows.length?`<div class="table"><table><tr><th>Period / Time</th><th>Class</th><th>Proxy For / Reason</th><th>Teacher Allotted</th><th>Teacher's Signature</th></tr>${rows.map(x=>`<tr><td>${PL(x.period)}<br>${esc(x.time)}</td><td>${esc(x.className)}</td><td>${esc(x.absentTeacher)} (${esc(x.absentCode)})<br><span class="small">${esc(x.reason)}</span>${x.kind==="Emergency Supervision"?'<br><b>Emergency Supervision</b>':""}</td><td>${esc(x.assignedName)} (${esc(x.assignedCode)})</td><td class="signatureCell">&nbsp;</td></tr>`).join("")}</table></div>`:"No duties allotted."}
 <div class="principalSignature">Principal's Signature: ______________________________</div>
 </div>`;
}
function publishedProxySnapshot(){
 const rows=finalDutyRows().map(x=>({
   period:Number(x.period),time:String(x.time||""),className:String(x.className||""),
   absentTeacher:String(x.absentTeacher||""),absentCode:String(x.absentCode||""),
   reason:String(x.reason||""),assignedName:String(x.assignedName||""),
   assignedCode:String(x.assignedCode||""),kind:String(x.kind||"Normal Proxy"),
   engagedClasses:Array.isArray(x.engagedClasses)?x.engagedClasses:[]
 }));
 const c=proxyCompletion();
 return {date:proxyDateKey(),dayName:proxyDayName(),required:c.required,covered:c.covered,rows,text:allotmentText()};
}
function renderPublishedProxy(pub){
 window.__vkvPublishedProxy=pub&&pub.date===todayKey()?pub:null;
 const btn=E("publishedProxyBtn"),out=E("publishedProxyResult"),dateEl=E("publishedProxyDate");
 if(!window.__vkvPublishedProxy){
   if(btn){btn.style.display="block";btn.innerHTML="✅ Today’s Proxy Allotment (All Teachers)";}
   if(dateEl)dateEl.textContent="";
   if(out)out.innerHTML="The final proxy allotment has not yet been published for today.";
   if(window.refreshMyProxyBadge)window.refreshMyProxyBadge();
   return;
 }
 const p=window.__vkvPublishedProxy;
 if(btn){btn.style.display="block";btn.innerHTML="✅ Today’s Proxy Allotment (All Teachers)";}
 if(dateEl)dateEl.textContent="· "+displayDate();
 const by=p.finalizedByName||p.finalizedByEmail||"Authorised user";
 const when=p.finalizedAtMs?new Date(p.finalizedAtMs).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
 if(out){
   out.innerHTML=`<div class="publishedMeta"><b>✓ Finalised</b>${when?" at "+esc(when):""} by ${esc(by)}.<br><span class="small">Teachers see this published version. Draft changes do not appear here until the list is finalised again.</span></div>${proxyPrintSheetHtml((p.rows||[]).map(x=>({...x,time:scheduleTime(x.period)||x.time||""})),p.date,p.dayName||dayNameForDate(p.date))}`;
 }
 if(window.refreshMyProxyBadge)window.refreshMyProxyBadge();
}
function openPublishedProxy(btn){show("publishedProxy",btn);renderPublishedProxy(window.__vkvPublishedProxy)}
async function finaliseProxies(){
 if(window.__vkvRole&&!["admin","manager","proxy_manager"].includes(window.__vkvRole)){alert("This account has view-only proxy access.");return}
 if(proxyIsLocked()){alert("This date is finalised and locked. The Principal must enable correction first.");return}
 const c=proxyCompletion();
 if(c.required>0&&c.covered<c.required){
   alert("The proxy list is incomplete. Please allot all "+c.required+" requirements before finalising.");
   reviewProxies();
   return;
 }
 reviewProxies();
 const snapshot=publishedProxySnapshot();
 if(!window.finaliseProxyCloud){alert("Cloud finalisation is not ready. Please refresh once and try again.");return}
 E("allotMsg").textContent="Finalising…";
 try{
   const pub=await window.finaliseProxyCloud(snapshot);
   window.__vkvWorkPublishedProxy=pub;renderProxyLockState();if(pub.date===todayKey())renderPublishedProxy(pub);
   E("allotMsg").textContent="Finalised and published.";
   if(pub.date===todayKey())setTimeout(()=>openPublishedProxy(E("publishedProxyBtn")),80);
 }catch(e){
   console.error(e);
   E("allotMsg").textContent="Finalisation failed.";
   alert("Could not finalise the proxy list: "+(e&&e.message?e.message:String(e)));
 }
}
function publishedProxyText(){
 const p=window.__vkvPublishedProxy;
 if(!p)return "No final proxy allotment has been published for today.";
 return p.text||"No proxy allotments recorded.";
}
async function copyPublishedProxy(){await copyTextSafe(publishedProxyText(),"publishedProxyMsg")}
async function sharePublishedProxy(){
 const text=publishedProxyText();
 if(navigator.share){try{await navigator.share({title:"VKV Nalbari — Today’s Proxy Allotment (All Teachers)",text});return}catch(e){if(e&&e.name==="AbortError")return}}
 await copyPublishedProxy();E("publishedProxyMsg").textContent="Sharing unavailable here; final proxy list copied instead.";
}
function printPublishedProxy(){
 if(!window.__vkvPublishedProxy){alert("No final proxy allotment has been published for today.");return}
 renderPublishedProxy(window.__vkvPublishedProxy);
 document.body.classList.add("printPublishedMode");
 const cleanup=()=>document.body.classList.remove("printPublishedMode");
 window.addEventListener("afterprint",cleanup,{once:true});
 setTimeout(()=>window.print(),80);
 setTimeout(cleanup,1500);
}

function allotmentText(){
 const rows=finalDutyRows(),c=proxyCompletion();
 let lines=["VIVEKANANDA KENDRA VIDYALAYA, NALBARI","PROXY ALLOTMENT",displayDate(proxyDateKey())+" · "+proxyDayName(),""];
 if(!rows.length){lines.push("No proxy allotments recorded.");return lines.join("\n")}
 let current=null;
 rows.forEach(x=>{
   if(x.period!==current){if(current!==null)lines.push("");current=x.period;lines.push(PL(current)+" ("+x.time+")")}
   lines.push("• "+x.className+" — "+x.assignedName+" ("+x.assignedCode+")");
   lines.push("  For: "+x.absentTeacher+" ("+x.absentCode+") — "+x.reason);
   if(x.kind==="Emergency Supervision")lines.push("  Duty: EMERGENCY SUPERVISION"+(x.engagedClasses.length?" while teaching "+x.engagedClasses.join(", "):""));
 });
 lines.push("","Status: "+c.covered+" of "+c.required+" proxy requirements allotted.");
 if(c.required&&c.covered===c.required)lines.push("✓ PROXY LIST COMPLETE");
 return lines.join("\n");
}
async function copyAllotments(){try{await copyTextSafe(allotmentText(),"allotMsg")}catch(e){alert("Copy could not be completed. Please use Review & Finalise and copy from the preview.")}}
async function shareAllotments(){let c=proxyCompletion();if(c.required&&c.covered<c.required){alert("Share becomes available only after all proxy requirements are allotted and finalised.");return}try{let text=allotmentText();if(navigator.share){try{await navigator.share({title:"VKV Nalbari Proxy Allotment",text});return}catch(e){if(e&&e.name==="AbortError")return}}await copyAllotments()}catch(e){alert("Sharing is not supported here. The proxy list can still be copied.")}}
function printProxy(){let c=proxyCompletion();if(c.required&&c.covered<c.required){alert("Print becomes available only after all proxy requirements are allotted and finalised.");return}reviewProxies();setTimeout(()=>window.print(),100)}
window.renderPublishedProxy=renderPublishedProxy;
window.openPublishedProxy=openPublishedProxy;

function myTeacherCode(){return String(window.__vkvMyTeacherCode||"").trim()}
function myTeacherRecord(){
 const code=myTeacherCode();
 return code?permanentTeacherByCode(code)||teacherByEffectiveCode(code):null;
}
function myTeacherLabel(){
 const t=myTeacherRecord(),code=myTeacherCode();
 return t?(t.name+" ("+t.code+")"):(code||"Signed-in teacher");
}
function myLinkMissingHtml(){
 return '<div class="warn"><b>Your Google account is authorised, but it could not be matched confidently to a teacher in the timetable roster.</b><br>Please ask the Admin to link this email to the correct teacher record.</div>';
}
function refreshMyAreaIdentity(){
 const code=myTeacherCode(),label=code?myTeacherLabel():"";
 const title=E("myAreaTitle"),grid=E("myAreaGrid");
 if(title)title.style.display=code?"block":"none";
 if(grid)grid.style.display=code?"grid":"none";
 ["myTimetableIdentity","myProxyTodayIdentity","myProxyHistoryIdentity","myStatusIdentity"].forEach(id=>{
   const el=E(id);if(el)el.textContent=label?("Signed in as "+label):"";
 });
 refreshMyProxyBadge();
}
function masterRecordsForMyTeacher(code){
 const isTemp=!!temporaryReplacementRecords().find(r=>String(r&&r.tempCode)===String(code));
 const source=isTemp?operationalRecords(todayKey()):sanitisedMasterRecords().filter(isOperationalRecord);
 return source.filter(r=>Array.isArray(r.codes)&&r.codes.includes(code));
}
function renderMyTimetable(scope="today",btn){
 const out=E("myTimetableResult"),code=myTeacherCode();
 if(btn){document.querySelectorAll(".myModeBtns button").forEach(x=>x.classList.remove("active"));btn.classList.add("active")}
 if(!out)return;
 if(!code){out.innerHTML=myLinkMissingHtml();return}
 const day=scope==="today"?todayName():"";
 let a=masterRecordsForMyTeacher(code).filter(r=>!day||r.day===day)
   .sort((x,y)=>DAYS.indexOf(x.day)-DAYS.indexOf(y.day)||Number(x.period)-Number(y.period));
 let groups={};
 a.forEach(x=>{
   const k=x.day+"|"+x.period;
   if(!groups[k])groups[k]={day:x.day,period:Number(x.period),time:scheduleTime(x.period),classes:[],entries:[]};
   groups[k].classes.push(x.class);groups[k].entries.push(x.entry);
 });
 const rows=Object.values(groups);
 const rep=activeReplacementForOriginal(code,todayKey());
 const coverNote=rep?`<div class="warn" style="margin-bottom:10px">Your timetable is currently being covered by <b>${esc(rep.tempName||rep.tempCode)} (${esc(rep.tempCode)})</b> as a leave-vacancy replacement until ${esc(displayDate(rep.endDate))}.</div>`:"";
 if(!rows.length){
   out.innerHTML=coverNote+(scope==="today"?`No regular teaching period is scheduled for you today (${esc(todayName())}) under the active schedule.`:"No teaching assignment was found under the active schedule.");
   return;
 }
 out.innerHTML=coverNote+`<div class="small" style="margin-bottom:8px">${scope==="today"?esc(todayName())+" · ":""}${esc(activeScheduleName())}</div>`+
   '<div class="table"><table><tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Assignment</th></tr>'+
   rows.map(x=>`<tr><td>${esc(x.day)}</td><td>${PL(x.period)}</td><td>${esc(x.time)}</td><td>${esc(x.classes.join(" + "))}</td><td>${x.entries.map(esc).join(" / ")}</td></tr>`).join("")+
   '</table></div>';
}
function openMyTimetable(btn){
 show("myTimetable",btn);refreshMyAreaIdentity();
 const b=E("myTodayModeBtn");
 document.querySelectorAll(".myModeBtns button").forEach(x=>x.classList.remove("active"));if(b)b.classList.add("active");
 renderMyTimetable("today");
}
function myProxyRowsFromPublished(pub){
 const code=myTeacherCode();
 return code&&pub&&Array.isArray(pub.rows)?pub.rows.filter(x=>String(x.assignedCode||"")===code):[];
}
function refreshMyProxyBadge(){
 const badge=E("myProxyBadge");if(!badge)return;
 const n=myProxyRowsFromPublished(window.__vkvPublishedProxy).length;
 if(n){badge.textContent=String(n);badge.style.display="inline-flex"}else{badge.textContent="";badge.style.display="none"}
}
function renderMyProxyTodayFromPublished(pub){
 const out=E("myProxyTodayResult"),code=myTeacherCode();if(!out)return;
 if(!code){out.innerHTML=myLinkMissingHtml();return}
 const rows=myProxyRowsFromPublished(pub);
 if(!pub){out.innerHTML=`No final proxy allotment has been published for today (${esc(displayDate())}).`;refreshMyProxyBadge();return}
 if(!rows.length){out.innerHTML=`<div class="slotComplete">✓ No proxy has been allotted to you today.</div><div class="small">${esc(displayDate())} · ${esc(todayName())}</div>`;refreshMyProxyBadge();return}
 out.innerHTML=`<div class="slotComplete"><b>${rows.length} proxy dut${rows.length===1?"y":"ies"} allotted to you today.</b></div>
 <div class="table"><table><tr><th>Period / Time</th><th>Class</th><th>Proxy For / Reason</th><th>Duty</th></tr>
 ${rows.sort((a,b)=>Number(a.period)-Number(b.period)).map(x=>`<tr><td>${PL(Number(x.period))}<br>${esc(scheduleTime(x.period)||x.time||"")}</td><td>${esc(x.className||"")}</td><td>${esc(x.absentTeacher||"")} (${esc(x.absentCode||"")})<br><span class="small">${esc(x.reason||"")}</span></td><td>${esc(x.kind||"Normal Proxy")}</td></tr>`).join("")}
 </table></div>`;
 refreshMyProxyBadge();
}
function openMyProxyToday(btn){
 show("myProxyToday",btn);refreshMyAreaIdentity();
 const out=E("myProxyTodayResult");if(out)out.innerHTML="Checking today’s published proxy allotment…";
 if(window.loadMyProxyToday)window.loadMyProxyToday();else renderMyProxyTodayFromPublished(window.__vkvPublishedProxy);
}
function openMyProxyHistory(btn){
 show("myProxyHistory",btn);refreshMyAreaIdentity();
 const to=E("myProxyHistoryTo");if(to&&!to.value)to.value=displayDate(todayKey());
 loadMyProxyHistory();
}
function loadMyProxyHistory(){
 const out=E("myProxyHistoryResult"),msg=E("myProxyHistoryMsg");
 if(msg)msg.textContent="Loading…";
 if(!myTeacherCode()){if(out)out.innerHTML=myLinkMissingHtml();if(msg)msg.textContent="";return}
 if(window.loadMyProxyHistoryCloud)window.loadMyProxyHistoryCloud();
 else{if(out)out.innerHTML='<div class="warn">Cloud history is not ready yet. Please try again in a moment.</div>';if(msg)msg.textContent=""}
}
function openMyStatus(btn){
 show("myStatus",btn);refreshMyAreaIdentity();
 if(window.__vkvLeaveHistoryVisible===false){
   const out=E("myStatusResult"),msg=E("myStatusMsg");
   if(out)out.innerHTML='<div class="warn"><b>My Leave History is temporarily unavailable.</b><br>The Principal is completing the historical leave reconciliation. Leave history will become visible automatically after all pending legacy leave items are resolved.</div>';
   if(msg)msg.textContent='Temporarily locked';
   return;
 }
 loadMyStatus();
}
function loadMyStatus(){
 const out=E("myStatusResult"),msg=E("myStatusMsg");
 if(msg)msg.textContent="Loading…";
 if(!myTeacherCode()){if(out)out.innerHTML=myLinkMissingHtml();if(msg)msg.textContent="";return}
 if(window.loadMyStatusCloud)window.loadMyStatusCloud();
 else{if(out)out.innerHTML='<div class="warn">Your personal status record is still loading. Please try again in a moment.</div>';if(msg)msg.textContent=""}
}
window.myLinkMissingHtml=myLinkMissingHtml;
window.renderMyProxyTodayFromPublished=renderMyProxyTodayFromPublished;
window.refreshMyProxyBadge=refreshMyProxyBadge;
window.refreshMyAreaIdentity=refreshMyAreaIdentity;

function exportLeaveExcel(){if(window.exportLeaveExcelCloud)window.exportLeaveExcelCloud();else alert("Leave export is still loading. Please try again in a moment.")}
window.exportLeaveExcel=exportLeaveExcel;
function openAdminDashboard(){
 const w=window.open('admin-dashboard.html?v=66.0','vkvAdminDashboard');
 if(!w)location.href='admin-dashboard.html?v=66.0';
}
function openApprovedLeaveRegister(){
 const w=window.open('admin-leave.html?v=66.0-leave-fix-1','vkvApprovedLeave');
 if(!w)location.href='admin-leave.html?v=66.0-leave-fix-1';
}
window.openApprovedLeaveRegister=openApprovedLeaveRegister;
function resetHome(){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".nav button,.myGrid button,.opsGrid button,.homebar button").forEach(x=>x.classList.remove("active"));document.querySelectorAll("select").forEach(x=>{if(!["historyDate"].includes(x.id))x.selectedIndex=0});document.querySelectorAll(".copymsg").forEach(x=>x.textContent="");window.scrollTo({top:0,behavior:"smooth"})}
function renderHistory(){let inp=E("historyDate");if(!inp.value)inp.value=displayDate(todayKey());const date=inputDate(inp.value);if(!date){E("historyResult").innerHTML='<div class="warn">Enter the date as dd/mm/yyyy.</div>';return}inp.value=displayDate(date);let h=historyData()[date],out=E("historyResult");if(!h){out.innerHTML="No saved record for this date.";return}let snapSts=Array.isArray(h.statuses)?h.statuses:[],liveSts=[];try{liveSts=leaveData(date)||[]}catch(_){liveSts=[]}let planned=[];try{planned=window.plannedStatusesForDate?window.plannedStatusesForDate(date):[]}catch(_){planned=[]}const byKey=new Map();[...snapSts,...liveSts,...planned].filter(o=>o&&["full","half","od","special","vacant"].includes(o.type)).forEach(o=>byKey.set(String(o.code||"")+"|"+String(o.type||"")+"|"+String(o.fromPeriod||"")+"|"+String(o.toPeriod||""),o));let sts=[...byKey.values()],als=Object.values(h.allotments||{}).filter(x=>x&&x.day===h.dayName).sort((a,b)=>a.period-b.period);out.innerHTML=`<b>${displayDate(date)} · ${h.dayName}</b><h3>Leave / Duty Leave / Operational Status</h3>${sts.length?sts.map(o=>{let t=teacherByEffectiveCode(o.code,date);return `<div>${esc(t?t.name:o.code)} (${o.code}) — ${statusLabel(o)}</div>`}).join(""):"None"}<h3>Proxy Allotments</h3>${als.length?als.map(x=>`<div>${PL(x.period)} — ${esc(x.name)} (${x.code}) — Regular ${x.regular} + Proxy ${x.proxyNumber} = ${x.total}</div>`).join(""):"None"}`}
function historyText(){let el=E("historyResult");return `VKV Nalbari – Daily History\\n${el.innerText||el.textContent||""}`}
async function copyHistory(){await copyTextSafe(historyText(),"historyResultMsg")}
async function shareHistory(){let text=historyText();if(navigator.share){try{await navigator.share({title:"VKV Nalbari Daily History",text});return}catch(e){}}await copyHistory()}
function deleteAllHistory(){
 const h=historyData(),count=Object.keys(h).length;
 if(!count){E("historyResult").innerHTML="No saved history to delete.";return}
 if(!confirm("Delete ALL saved history? This cannot be undone. Today's live Leave / OD / Special Assignment / Vacant Position and proxy allotments will NOT be deleted."))return;
 localStorage.removeItem("vkvHistory");
 E("historyResult").innerHTML='<div class="slotComplete">All saved history has been deleted. Today\'s live working records are unchanged.</div>';
 if(E("historyResultMsg"))E("historyResultMsg").textContent="";
}
function migrateStoredTeacherCodes(){
 const amap={"KN":"KCN","BB":"BB1","MD1":"MD"};
 try{
   let a=JSON.parse(localStorage.getItem("vkvLeave2")||"[]");
   a=a.map(o=>({...o,code:amap[o.code]||o.code})).filter(o=>DATA.teachers.some(t=>t.code===o.code));
   localStorage.setItem("vkvLeave2_"+todayKey(),JSON.stringify(a));
 }catch(e){}
 try{
   let a=JSON.parse(localStorage.getItem("vkvAllotments")||"{}");
   Object.keys(a).forEach(k=>{
     if(a[k]&&a[k].code){a[k].code=amap[a[k].code]||a[k].code;let t=DATA.teachers.find(x=>x.code===a[k].code);if(t)a[k].name=t.name;}
   });
   localStorage.setItem("vkvAllotments_"+todayKey(),JSON.stringify(a));
 }catch(e){}
}

window.initializeVKVCore=function(){
 if(window.__vkvCoreInitialized)return;
 window.__vkvCoreInitialized=true;
 try{if(E("proxyDateLabel"))E("proxyDateLabel").textContent="· "+displayDate()}catch(e){};
 migrateStoredTeacherCodes();refreshScheduleUi();initializeLeaveCalendar();renderLeave();renderLeavePlansList();E("dutyFrom").disabled=true;E("dutyTo").disabled=true;proxyPeriod=firstProxyPeriod();E("allotPeriod").value=String(proxyPeriod);renderProxyPeriod();saveSnapshot();
};


/* v66.2 authoritative Daily History override */
renderHistory=function(){
  const inp=E("historyDate");
  if(!inp.value)inp.value=displayDate(todayKey());
  const date=inputDate(inp.value),out=E("historyResult");
  if(!date){out.innerHTML='<div class="warn">Enter the date as dd/mm/yyyy.</div>';return}
  inp.value=displayDate(date);
  const h=historyData()[date]||{};
  const day=h.dayName||dayNameForDate(date);
  const sts=(leaveData(date)||[]).filter(o=>o&&['full','half','od','special','vacant'].includes(String(o.type||'')));
  const allots=Object.values((h.allotments||allotData(date)||{})).filter(x=>x&&(!x.day||x.day===day)).sort((a,b)=>Number(a.period||0)-Number(b.period||0));
  const groups={leave:[],duty:[],operational:[]};
  sts.forEach(o=>{if(['full','half'].includes(o.type))groups.leave.push(o);else if(['od','special'].includes(o.type))groups.duty.push(o);else if(o.type==='vacant')groups.operational.push(o)});
  const block=(title,rows)=>'<h3>'+title+'</h3>'+(rows.length?rows.map(o=>{const t=teacherByEffectiveCode(o.code,date);return '<div>'+esc(t?t.name:o.code)+' ('+esc(o.code)+') — '+esc(statusLabel(o))+'</div>'}).join(''):'None');
  out.innerHTML='<b>'+displayDate(date)+' · '+esc(day)+'</b>'+block('Regular Leave',groups.leave)+block('Duty Leave · OD / Special Assignment',groups.duty)+block('Operational Status · Vacant Position',groups.operational)+'<h3>Normal Proxy Allotments</h3>'+(allots.length?allots.map(x=>'<div>'+PL(x.period)+' — '+esc(x.name)+' ('+esc(x.code)+') — Regular '+esc(x.regular)+' + Proxy '+esc(x.proxyNumber)+' = '+esc(x.total)+'</div>').join(''):'None');
};
