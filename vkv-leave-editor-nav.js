/* Preview2 Leave Editor navigation. UI-only; no Firestore reads. Reuse existing Admin link. */
(()=>{'use strict';
const SUPER='https://ritwik17c.github.io/vkvtt-preview-2/super-leave-filter.html?v=live';
const ADMIN='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html?v=preview2';
function ensure(){
  const header=document.querySelector('header .actions')||document.querySelector('header .headline')||document.querySelector('header');
  if(!header)return false;
  const links=[...header.querySelectorAll('a,button')];
  const adminLinks=links.filter(e=>/admin dashboard/i.test(e.textContent||''));
  if(adminLinks.length){
    const keep=adminLinks[0];if(keep.tagName==='A')keep.href=ADMIN;else keep.onclick=()=>location.href=ADMIN;
    adminLinks.slice(1).forEach(e=>e.remove());
  }
  let s=document.getElementById('vkvPermanentSuperLeave')||links.find(e=>/super leave filter/i.test(e.textContent||''));
  if(!s){s=document.createElement('a');s.id='vkvPermanentSuperLeave';s.className='btn';s.textContent='🔎 Super Leave Filter';header.appendChild(s)}
  if(s.tagName==='A')s.href=SUPER;else s.onclick=()=>location.href=SUPER;
  s.style.cssText='font-weight:850;border-color:#8fb7cb;background:#eef7fb;color:#17364f';
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
let n=0,t=setInterval(()=>{ensure();if(++n>40)clearInterval(t)},250);
})();
