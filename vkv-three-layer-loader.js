/* VKVTT Preview 2 — SECTION PLACEMENT ONLY. No output logic. One stable pass after login shell settles. */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], clean=s=>String(s||'').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,' ').replace(/[^A-Za-z0-9&?'’]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase().replace(/’/g,"'");
function css(){if($('#vkvSectionPlacementCss'))return;const s=document.createElement('style');s.id='vkvSectionPlacementCss';s.textContent=`
.vkv3sec{margin:16px 0 22px}.vkv3sec h2{font-size:1.08rem;color:#17364f;margin:0 0 4px}.vkv3sec>p{margin:0 0 10px;color:#647985;font-size:.86rem}.vkv3grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.vkv3grid>button,.vkv3grid>a{box-sizing:border-box;min-height:76px;text-align:left;padding:15px 17px!important;border:1px solid #c7d8e2!important;border-left:5px solid #24739d!important;border-radius:16px!important;background:#fff!important;color:#17364f!important;font:inherit;font-weight:800!important;text-decoration:none;box-shadow:0 5px 16px rgba(18,63,90,.06);cursor:pointer;width:100%!important;margin:0!important;position:static!important;transform:none!important}.vkv3grid>button:nth-child(4n+2),.vkv3grid>a:nth-child(4n+2){border-left-color:#2f8a57!important}.vkv3grid>button:nth-child(4n+3),.vkv3grid>a:nth-child(4n+3){border-left-color:#d49517!important}.vkv3grid>button:nth-child(4n),.vkv3grid>a:nth-child(4n){border-left-color:#7353a6!important}.vkvQbTile{border-left-color:#7a4ea3!important;background:linear-gradient(135deg,#fff,#f8f3ff)!important}.vkvPlaceholder{opacity:.96}.vkv3empty{grid-column:1/-1;padding:11px;border:1px dashed #cbdce5;border-radius:12px;color:#647985;background:#fbfefd}@media(max-width:700px){.vkv3grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.vkv3grid{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function section(id,title,sub){let s=$('#'+id);if(!s){s=document.createElement('section');s.id=id;s.className='vkv3sec';s.innerHTML=`<h2>${title}</h2><p>${sub}</p><div class="vkv3grid"></div>`}else{s.querySelector('h2').textContent=title;s.querySelector('p').textContent=sub}return s}
function exact(label){const n=clean(label),all=$$('button,a,[role="button"]').filter(e=>!e.closest('.vkv3sec'));return all.find(e=>clean(e.textContent)===n)||all.find(e=>clean(e.textContent).includes(n))||null}
function get(id,label){return(id&&$('#'+id))||exact(label)}
function put(grid,id,label){const e=get(id,label);if(!e)return null;e.style.removeProperty('display');e.style.removeProperty('visibility');e.style.removeProperty('position');if(e.parentElement!==grid)grid.appendChild(e);return e}
function placeholder(grid,id,label,cls=''){let e=$('#'+id);if(!e){e=document.createElement('button');e.type='button';e.id=id;e.textContent=label;e.className=('vkvPlaceholder '+cls).trim();e.dataset.placementOnly='1'}if(e.parentElement!==grid)grid.appendChild(e);return e}
function link(grid,id,label,href,cls=''){let e=$('#'+id);if(!e){e=document.createElement('a');e.id=id;e.textContent=label;e.href=href;e.className=cls}if(e.parentElement!==grid)grid.appendChild(e);return e}
function isVisible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'}
function category(){const ntHints=['#officeDutyScheduleBtn','#vkvCard_officeDuty','#officeDutyBtn'].map($).find(Boolean);if(isVisible(ntHints))return'nonTeaching';const tt=$('#myTimetableBtn');if(tt&&!isVisible(tt))return'nonTeaching';return'teaching'}
function delegatedCandidates(){const labels=['Proxy Manager','Leave Editor','Attendance Manager','Admin Dashboard'];const out=[];for(const l of labels){const e=exact(l);if(e&&isVisible(e)&&!out.includes(e))out.push(e)}return out}
function hideLegacyShell(){
 const selectors=['.nav','.homebar','.opsGrid','#opsGrid'];
 selectors.forEach(q=>$$(q).forEach(e=>{if(!e.closest('.vkv3sec'))e.style.display='none'}));
 $$('h1,h2,h3,h4,div').forEach(e=>{if(e.closest('.vkv3sec'))return;const t=clean(e.textContent);if(t==='daily management'&&e.children.length===0)e.style.display='none'});
}
function build(){css();const anchor=$('#activeScheduleBanner')||$('.activeScheduleBanner')||$('#myAreaGrid');if(!anchor)return false;
 const s1=section('vkvSection1','Section 1 · Common to All Staff','School-wide and personal information available to every staff member.'),g1=s1.querySelector('.vkv3grid');
 put(g1,'vkvCard_notice','Staff Notice')||placeholder(g1,'vkvCard_notice','📢 Staff Notice');
 put(g1,'myAttendanceBtn','My Attendance')||placeholder(g1,'myAttendanceBtn','📍 My Attendance');
 put(g1,'myStatusBtn','My Leave & Duty Leave')||placeholder(g1,'myStatusBtn','🗂 My Leave & Duty Leave');
 put(g1,'vkvCard_todaySummary',"Today's Leave / Duty / Assignment Summary")||placeholder(g1,'vkvCard_todaySummary',"📁 Today's Leave / Duty / Assignment Summary");
 put(g1,'publishedProxyBtn',"Today's Finalised Proxy Allotment")||placeholder(g1,'publishedProxyBtn',"✅ Today's Finalised Proxy Allotment");
 put(g1,null,'Teacher Wise')||placeholder(g1,'vkvTeacherWiseCard','👨‍🏫 Teacher Wise');
 put(g1,null,'Class Wise')||placeholder(g1,'vkvClassWiseCard','🏫 Class Wise');
 put(g1,null,'Day Wise')||placeholder(g1,'vkvDayWiseCard','📅 Day Wise');
 put(g1,null,'Free Teachers')||placeholder(g1,'vkvFreeTeachersCard','🕐 Free Teachers');
 put(g1,null,'Where Now?')||placeholder(g1,'vkvWhereNowCard','📍 Where Now?');
 put(g1,'vkvCard_periodTimings','Period Timings')||placeholder(g1,'vkvCard_periodTimings','🕐 Period Timings');
 put(g1,'annualCalendarBtn','Annual Calendar')||placeholder(g1,'annualCalendarBtn','🗓 Annual Calendar');
 const cat=category(),s2=section('vkvSection2',cat==='nonTeaching'?'Section 2 · Non-Teaching Staff':'Section 2 · Teaching Staff',cat==='nonTeaching'?'Functions specifically relevant to office, support and non-teaching staff.':'Teaching-specific functions and academic tools.'),g2=s2.querySelector('.vkv3grid');
 if(cat==='nonTeaching'){
   put(g2,'vkvCard_officeDuty','Office Duty Schedule')||placeholder(g2,'vkvCard_officeDuty','🗂 Office Duty Schedule');
 }else{
   put(g2,'myTimetableBtn','My Timetable')||placeholder(g2,'myTimetableBtn','📘 My Timetable');
   put(g2,'myProxyTodayBtn','My Proxy Today')||placeholder(g2,'myProxyTodayBtn','👥 My Proxy Today');
   put(g2,'myProxyHistoryBtn','My Past Proxy History')||placeholder(g2,'myProxyHistoryBtn','🕘 My Past Proxy History');
   put(g2,'vkvCard_periodReminder','Period Reminder')||placeholder(g2,'vkvCard_periodReminder','🔔 Period Reminder');
   put(g2,'vkvCard_teacherSpecialDuty','Teacher Special Duty')||placeholder(g2,'vkvCard_teacherSpecialDuty','🗓 Teacher Special Duty');
   link(g2,'vkvQuestionBankTile','🧠 Question Bank & Paper Builder','https://ritwik17c.github.io/vkvtt-preview/qb-module.html?v=preview2-qb-3','vkvQbTile');
 }
 const s3=section('vkvSection3','Section 3 · Delegated Responsibilities','Additional tools appear only when responsibility has been assigned.'),g3=s3.querySelector('.vkv3grid');const dc=delegatedCandidates();dc.forEach(e=>g3.appendChild(e));if(!dc.length&&!g3.children.length)g3.innerHTML='<div class="vkv3empty">No delegated responsibility is assigned to this account.</div>';
 const parent=anchor.parentNode;parent.insertBefore(s3,anchor.nextSibling);parent.insertBefore(s2,s3);parent.insertBefore(s1,s2);
 ['#myAreaGrid','#myAreaTitle'].forEach(q=>{const e=$(q);if(e)e.style.display='none'});
 hideLegacyShell();
 return true}
let tries=0;const t=setInterval(()=>{tries++;if(build()||tries>=20)clearInterval(t)},350);
})();
