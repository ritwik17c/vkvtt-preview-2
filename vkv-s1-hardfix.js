/* Preview 2 — reminder-only safety guard. No Firebase reads and no leave/summary click interception. */
(()=>{'use strict';
const $$=s=>[...document.querySelectorAll(s)];
function isNonTeachingUi(){
 const h=document.querySelector('#vkvSecCategory h2');
 if(h&&/Non[- ]?Teaching/i.test(h.textContent||''))return true;
 const sec=document.querySelector('#vkvSecCategory');
 return !!(sec&&/Office Duty Schedule/i.test(sec.textContent||'')&&!/My Timetable/i.test(sec.textContent||''));
}
function apply(){
 if(!isNonTeachingUi())return;
 ['#vkvCard_periodReminder','#periodReminderControl','.periodReminderControl'].forEach(q=>$$((q)).forEach(e=>{
  e.style.setProperty('display','none','important');
  e.style.setProperty('visibility','hidden','important');
  e.style.setProperty('pointer-events','none','important');
  e.setAttribute('aria-hidden','true');
 }));
 $$('#vkvSecCategory button').forEach(b=>{if(/Period Reminder/i.test(b.textContent||'')){
  b.style.setProperty('display','none','important');b.style.setProperty('visibility','hidden','important');b.style.setProperty('pointer-events','none','important');
 }});
}
let n=0,t=setInterval(()=>{apply();if(++n>20)clearInterval(t)},300);
new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('focus',apply);
})();
