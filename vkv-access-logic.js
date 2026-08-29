/* Preview 2 — routing/presentation only. Core v66-home-cloud remains the single owner of role and delegated-card visibility. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
function routeAdmin(){
  const b=$('#adminUserAccessBtn');
  if(!b)return;
  const url='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html?v=preview2';
  if(b.tagName==='A')b.href=url;
  else b.onclick=()=>{location.href=url};
  b.dataset.preview2AdminRoute='1';
}
function protectCategoryUI(){
  const s2=$('#vkvSection2');if(!s2)return;
  if(/non teaching/i.test(s2.querySelector('h2')?.textContent||'')){
    const qb=$('#vkvQuestionBankTile');if(qb)qb.style.display='none';
    ['myTimetableBtn','myProxyTodayBtn','myProxyHistoryBtn','vkvCard_periodReminder','vkvCard_teacherSpecialDuty'].forEach(id=>{const e=$('#'+id);if(e)e.style.display='none'});
  }
}
function apply(){routeAdmin();protectCategoryUI()}
let n=0,t=setInterval(()=>{apply();if(++n>80)clearInterval(t)},250);
window.addEventListener('focus',()=>setTimeout(apply,100));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(apply,100)});
})();
