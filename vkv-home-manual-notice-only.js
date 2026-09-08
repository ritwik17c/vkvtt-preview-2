// VKVTT Home Staff Notice Board: manual Principal notices only.
// Automatic Exam/Timetable publication messages are intentionally suppressed here.
let cleaning=false;
function cleanManualOnlyNotice(){
 if(cleaning)return;
 const host=document.getElementById('notice');
 if(!host)return;
 cleaning=true;
 try{
  [...host.querySelectorAll('.noticeItem')].forEach(item=>{
   const examLink=item.querySelector('a[href*="exam-timetable.html"]');
   const text=String(item.textContent||'');
   if(examLink||/Principal-approved examination timetable, invigilation and reliever duties are available\.?/i.test(text))item.remove();
  });
  if(!host.querySelector('.noticeItem')){
   const head=host.querySelector('.noticeHead');
   host.innerHTML=(head?head.outerHTML:'<div class="noticeHead">📢 STAFF NOTICE & CIRCULAR</div>')+'<div class="noticeItem"><div class="noticeBody">No current staff notice is published.</div></div>';
  }
 }finally{cleaning=false}
}
function start(){
 const host=document.getElementById('notice');
 if(!host)return;
 cleanManualOnlyNotice();
 new MutationObserver(()=>queueMicrotask(cleanManualOnlyNotice)).observe(host,{childList:true,subtree:true});
 setInterval(cleanManualOnlyNotice,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
