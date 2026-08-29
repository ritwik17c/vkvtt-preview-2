/* Preview2 Leave Editor navigation. UI-only; no Firestore reads. */
(()=>{'use strict';
function ensure(){
  const header=document.querySelector('header .actions')||document.querySelector('header .headline')||document.querySelector('header');
  if(!header)return false;
  const make=(id,label,href,style='')=>{let a=document.getElementById(id);if(!a){a=document.createElement('a');a.id=id;a.className='btn';a.textContent=label;header.appendChild(a)}a.href=href;if(style)a.style.cssText=style;return a};
  make('vkvPermanentSuperLeave','🔎 Super Leave Filter','https://ritwik17c.github.io/vkvtt-preview-2/super-leave-filter.html?v=live','font-weight:850;border-color:#8fb7cb;background:#eef7fb;color:#17364f');
  make('vkvPermanentAdminDash','⚙ Admin Dashboard','https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html?v=preview2');
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
let n=0,t=setInterval(()=>{if(ensure()||++n>40)clearInterval(t)},250);
})();