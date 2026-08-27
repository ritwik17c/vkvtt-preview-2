/* VKVTT Preview 2 — fixed card registry + Admin Interface & Access Control. No card changes section at login. */
(async()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase().replace(/’/g,"'");
const REGISTRY={
 common:[
  {id:'notice',label:'Staff Notice',find:['Staff Notice','Staff Notices','Notice','Important Notice']},
  {id:'activeSchedule',label:'Active Schedule',selector:'#activeScheduleBanner'},
  {id:'attendance',label:'My Attendance',selector:'#myAttendanceBtn'},
  {id:'leave',label:'My Leave & Duty Leave',selector:'#myStatusBtn'},
  {id:'todaySummary',label:"Today's Leave / Duty / Assignment Summary",selector:'#proxyTodayStatusSummary'},
  {id:'finalProxy',label:"Today's Final Proxy Allotment",selector:'#publishedProxyBtn'},
  {id:'teacherWise',label:'Teacher Wise',find:['Teacher Wise']},
  {id:'classWise',label:'Class Wise',find:['Class Wise']},
  {id:'dayWise',label:'Day Wise',find:['Day Wise']},
  {id:'freeTeachers',label:'Free Teachers',find:['Free Teachers']},
  {id:'periodTimings',label:'Period Timings',virtual:true},
  {id:'annualCalendar',label:'Annual Calendar',selector:'#annualCalendarBtn'}
 ],
 teaching:[
  {id:'myTimetable',label:'My Timetable',selector:'#myTimetableBtn'},
  {id:'myProxyToday',label:'My Proxy Today',selector:'#myProxyTodayBtn'},
  {id:'myProxyHistory',label:'My Past Proxy History',selector:'#myProxyHistoryBtn'},
  {id:'periodReminder',label:'Period Reminder',virtual:true}
 ],
 nonTeaching:[{id:'officeDuty',label:'Office Duty Schedule',virtual:true}],
 delegated:[
  {id:'proxyManager',label:'Proxy Manager',selector:'#proxyWorkBtn',role:'proxy'},
  {id:'leaveEditor',label:'Leave Editor',selector:'#leaveOpsBtn',role:'leave'},
  {id:'attendanceManager',label:'Attendance Manager',virtual:true,role:'attendance'},
  {id:'admin',label:'Admin Dashboard',selector:'#adminUserAccessBtn',role:'admin'}
 ]
};
const DEFAULT={};Object.values(REGISTRY).flat().forEach(x=>DEFAULT[x.id]={all:true,teaching:true,nonTeaching:true});
let settings=JSON.parse(localStorage.getItem('vkvInterfaceAccessV1')||'null')||structuredClone(DEFAULT);
const save=()=>localStorage.setItem('vkvInterfaceAccessV1',JSON.stringify(settings));
function findByText(names){const ns=names.map(norm);return $$('button,a,.card,.tile,.navBtn,.opCard,.myAreaCard,[role="button"]').find(e=>ns.includes(norm(e.textContent))||ns.some(n=>norm(e.textContent).startsWith(n+' ')))}
function element(item){return item.selector?$(item.selector):(item.find?findByText(item.find):null)}
function root(e){if(!e)return null;if(e.matches('button,a,.card,.tile,.navBtn,.opCard,.myAreaCard'))return e;return e.closest('button,a,.card,.tile,.navBtn,.opCard,.myAreaCard')||e}
function css(){if($('#vkvRegistryCss'))return;const s=document.createElement('style');s.id='vkvRegistryCss';s.textContent=`.vkvSec{margin:15px 0 20px}.vkvSec h2{font-size:1.08rem;color:#17364f;margin:0 0 4px}.vkvSec p{margin:0 0 10px;color:#667985;font-size:.86rem}.vkvSecGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:11px}.vkvVirtual{padding:14px;min-height:70px;text-align:left;border:1px solid #cbdce5;border-radius:14px;background:#fff;color:#17364f;font:inherit;font-weight:800}.vkvAccessBtn{margin:10px 0;padding:10px 14px;border:1px solid #9fb8c6;border-radius:12px;background:#fff;font-weight:800}.vkvModal{position:fixed;inset:0;z-index:999999;background:rgba(10,25,38,.48);display:grid;place-items:center;padding:14px}.vkvModalBox{background:#fff;width:min(760px,96vw);max-height:88vh;overflow:auto;border-radius:18px;padding:18px}.vkvCtl{display:grid;grid-template-columns:minmax(150px,1fr) repeat(3,76px);gap:7px;align-items:center;padding:8px 0;border-bottom:1px solid #e4eaee}.vkvCtl small{text-align:center}.vkvCtlHead{font-weight:900;margin-top:14px;color:#17364f}@media(max-width:600px){.vkvCtl{grid-template-columns:1fr repeat(3,58px);font-size:.82rem}}`;document.head.appendChild(s)}
function virtual(item){let b=document.getElementById('vkvCard_'+item.id);if(b)return b;b=document.createElement('button');b.id='vkvCard_'+item.id;b.className='vkvVirtual';b.textContent=({periodTimings:'🕐 ',periodReminder:'🔔 ',officeDuty:'🏢 ',attendanceManager:'📍 '}[item.id]||'')+item.label;b.onclick=()=>{if(item.id==='periodTimings'){const x=$$('#freePeriod option').map(o=>o.textContent.trim()).filter(Boolean);alert('Period Timings\n\n'+(x.join('\n')||'Available from Active Schedule.'))}else if(item.id==='periodReminder')alert('Period Reminder');else if(item.id==='officeDuty')alert('Office Duty Schedule');else if(item.id==='attendanceManager')location.href='admin-attendance.html?v=66.0'};return b}
function allowed(item,cat){const x=settings[item.id]||DEFAULT[item.id]||{};return x.all!==false && (cat==='teaching'?x.teaching!==false:x.nonTeaching!==false)}
function section(id,title,sub,before){let s=$('#'+id);if(!s){s=document.createElement('section');s.id=id;s.className='vkvSec';s.innerHTML=`<h2>${title}</h2><p>${sub}</p><div class="vkvSecGrid"></div>`;before?.before(s)}return s}
function move(items,grid,cat){items.forEach(item=>{let e=element(item);if(!e&&item.virtual)e=virtual(item);e=root(e);if(!e)return;e.dataset.vkvCard=item.id;e.style.setProperty('display',allowed(item,cat)?'':'none','important');if(!grid.contains(e))grid.append(e)})}
function controlPanel(){let old=$('#vkvAccessControlModal');if(old)old.remove();const m=document.createElement('div');m.id='vkvAccessControlModal';m.className='vkvModal';let rows='';[['Common / My Area',REGISTRY.common],['Teaching',REGISTRY.teaching],['Non-Teaching',REGISTRY.nonTeaching],['Delegated Responsibilities',REGISTRY.delegated]].forEach(([h,a])=>{rows+=`<div class="vkvCtlHead">${h}</div>`;a.forEach(i=>{const x=settings[i.id]||DEFAULT[i.id];rows+=`<div class="vkvCtl"><b>${i.label}</b><small>All<br><input data-i="${i.id}" data-k="all" type="checkbox" ${x.all!==false?'checked':''}></small><small>Teach<br><input data-i="${i.id}" data-k="teaching" type="checkbox" ${x.teaching!==false?'checked':''}></small><small>NT<br><input data-i="${i.id}" data-k="nonTeaching" type="checkbox" ${x.nonTeaching!==false?'checked':''}></small></div>`})});m.innerHTML=`<div class="vkvModalBox"><h2>Interface & Access Control</h2><p>Cards have fixed sections. These controls decide who can see each card.</p>${rows}<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button id="vkvCtlSave">Save Controls</button><button id="vkvCtlReset">Restore Defaults</button><button id="vkvCtlClose">Close</button></div></div>`;document.body.append(m);m.querySelector('#vkvCtlClose').onclick=()=>m.remove();m.querySelector('#vkvCtlReset').onclick=()=>{settings=structuredClone(DEFAULT);save();m.remove();render()};m.querySelector('#vkvCtlSave').onclick=()=>{m.querySelectorAll('input[data-i]').forEach(c=>{settings[c.dataset.i]??={};settings[c.dataset.i][c.dataset.k]=c.checked});save();m.remove();render()}}
async function identity(){try{const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),U=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js'),cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'},app=A.getApps().length?A.getApp():A.initializeApp(cfg),auth=U.getAuth(app);if(auth.authStateReady)await auth.authStateReady();const u=auth.currentUser;if(!u)return {cat:'teaching',role:'teacher'};const db=F.getFirestore(app),p=(await F.getDoc(F.doc(db,'authorizedUsers',u.uid))).data()||{},role=norm(p.role||'teacher'),t=norm(p.staffType||p.staffCategory||'');return{cat:t==='teaching'?'teaching':'nonTeaching',role}}catch(e){return{cat:'teaching',role:'teacher'}}}
let ID=null;async function render(){css();ID=ID||await identity();const anchor=$('#myAreaTitle')||$('#myAreaGrid')||$('.nav')||$('.opsGrid');if(!anchor)return;const common=section('vkvSecCommon','My Area · Common to All Staff','Information and personal staff services available irrespective of staff category or delegated responsibility.',anchor),cat=section('vkvSecCategory',ID.cat==='teaching'?'My Work · Teaching':'My Work · Non-Teaching','Staff-category specific work area.',anchor),del=section('vkvSecDelegated','My Delegated Responsibilities','Additional responsibilities assigned to this account.',anchor);move(REGISTRY.common,common.querySelector('.vkvSecGrid'),ID.cat);move(ID.cat==='teaching'?REGISTRY.teaching:REGISTRY.nonTeaching,cat.querySelector('.vkvSecGrid'),ID.cat);
 const roles={proxy:['admin','manager','proxy_manager'],leave:['admin','manager','leave_editor'],attendance:['admin','attendance_manager'],admin:['admin']};const d=REGISTRY.delegated.filter(x=>roles[x.role]?.includes(ID.role));move(d,del.querySelector('.vkvSecGrid'),ID.cat);del.style.display=d.length?'':'none';
 // Original containers no longer determine access after registry placement.
 ['#myAreaTitle','#myAreaGrid','.nav','.opsTitle','.opsGrid'].forEach(q=>{const e=$(q);if(e&&!e.closest('.vkvSec'))e.style.display='none'});
 if(ID.role==='admin'&&!$('#vkvInterfaceControlBtn')){const b=document.createElement('button');b.id='vkvInterfaceControlBtn';b.className='vkvAccessBtn';b.textContent='⚙ Interface & Access Control';b.onclick=controlPanel;common.before(b)}
}
setTimeout(render,1600);let n=0;const t=setInterval(()=>{render();if(++n>30)clearInterval(t)},350);
})();