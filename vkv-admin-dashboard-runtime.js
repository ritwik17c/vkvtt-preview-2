/* Preview 2 · Admin Dashboard runtime. Single owner for Preview2 dashboard additions/routing. */
(()=>{'use strict';
const P2='https://ritwik17c.github.io/vkvtt-preview-2/';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const norm=s=>String(s||'').replace(/[^A-Za-z0-9&]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
function tile(id,icon,title,desc,url){const t=document.createElement('div');t.className='tile';t.id=id;t.innerHTML=`<b>${icon} ${title}</b><span>${desc}</span>`;if(url)t.onclick=()=>location.href=url;return t}
function section(id,title){let s=$('#'+id);if(s)return s;s=document.createElement('div');s.id=id;s.className='card';s.style.marginTop='16px';s.innerHTML=`<h2 style="margin-top:0">${title}</h2><div class="tiles"></div>`;return s}
function addTools(){const home=$('#dashboardHome');if(!home||$('#vkvP2AdminTools'))return false;const wrap=document.createElement('div');wrap.id='vkvP2AdminTools';
 const tt=section('vkvP2Timetable','📘 Timetable Administration');tt.querySelector('.tiles').append(
  tile('openWorkingStudio','📘','Timetable Studio','Create, edit, validate and activate timetable versions.',P2+'admin-timetable-studio.html?v=p2'),
  tile('openTeacherTransfer','⇄','Transfer Teacher Timetable','Move one teacher’s complete timetable to another teacher in one controlled action.',null));
 const ops=section('vkvP2LeaveOps','🗂 Leave, Duty & Operational Status');ops.querySelector('.tiles').append(
  tile('openSuperLeaveFilter','🔎','Super Leave Filter','Search leave, duty, special assignment and vacant-position records.',P2+'super-leave-filter.html?v=p2'),
  tile('openPreview2LeaveEditor','🗂','Leave Master Editor','Manage leave and operational-status records.',P2+'admin-leave-editor.html?v=p2'));
 const duty=section('vkvP2Duty','🗓 Duty Scheduling');duty.querySelector('.tiles').append(
  tile('openOfficeDutyScheduler','🏢','Office Duty Scheduler','Manage recurring office and non-teaching duties.',P2+'admin-office-duty-scheduler.html?v=p2'),
  tile('openTeacherSpecialDutyScheduler','🎯',"Teacher's Special Duty Scheduler",'Manage recurring teacher special duties and proxy availability.',P2+'admin-teacher-special-duty-scheduler.html?v=p2'));
 const access=section('vkvP2Access','🔐 Access & Interface');access.querySelector('.tiles').append(tile('openAccessMap','🧭','Access & Section Map','View the fixed Section 1 / Section 2 / Section 3 structure and where permissions are managed.',null));
 wrap.append(tt,ops,duty,access);home.append(wrap);
 $('#openAccessMap').onclick=openAccessMap;return true}
function openAccessMap(){const home=$('#dashboardHome');if(!home)return;$('#vkvP2AccessPanel')?.remove();const box=document.createElement('div');box.id='vkvP2AccessPanel';box.className='card';box.innerHTML=`<div class="sectionTop"><div><div class="breadcrumb">Admin Dashboard → Access & Section Map</div><h2>🧭 Access & Section Map</h2></div><button id="vkvAccessBack">← Admin Dashboard</button></div>
 <div class="help">The section structure is fixed. Staff category decides Section 2; delegated permissions decide Section 3. Staff category and delegated authority are independent.</div>
 <div class="tablewrap"><table><thead><tr><th>Section</th><th>Who sees it</th><th>Examples</th><th>Authority source</th></tr></thead><tbody>
 <tr><td><b>Section 1 · Common</b></td><td>Every active staff member</td><td>Attendance, Leave & Duty, Today Summary, Proxy output, Teacher/Class/Day views, Free Teachers, Where Now?, Period Timings, Annual Calendar</td><td>Common staff access</td></tr>
 <tr><td><b>Section 2 · Category</b></td><td>Teaching or Non-Teaching according to Staff Management category</td><td>Teaching: My Timetable, My Proxy, Period Reminder, Question Bank. Non-Teaching: Office Duty Schedule.</td><td>Staff category</td></tr>
 <tr><td><b>Section 3 · Delegated Responsibilities</b></td><td>Only staff explicitly given that responsibility</td><td>Proxy Manager, Leave Editor, Attendance Manager, Admin Dashboard and other delegated tools</td><td>User Access & Roles / authorised user profile</td></tr>
 </tbody></table></div><div class="status info" style="margin-top:12px"><b>Important:</b> this page is a map, not a second permission system. Actual delegated access must be changed in <b>User Access & Roles</b>.</div>`;document.getElementById('app')?.append(box);home.style.display='none';$('#vkvAccessBack').onclick=()=>{box.remove();home.style.display='block'}}
function routeExisting(){const leave=$('#openLeaveEditor');if(leave&&!leave.dataset.p2route){leave.dataset.p2route='1';leave.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href=P2+'admin-leave-editor.html?v=p2'},true)}
 $$('a,button,.tile').forEach(el=>{if(el.id==='openTeacherTransfer'||el.id==='openWorkingStudio'||el.dataset.p2studio)return;const t=norm(el.textContent);if(t.includes('timetable studio')){el.dataset.p2studio='1';el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href=P2+'admin-timetable-studio.html?v=p2'},true)}})}
let n=0,t=setInterval(()=>{addTools();routeExisting();if(++n>=40)clearInterval(t)},250);window.addEventListener('focus',()=>setTimeout(routeExisting,100));
})();