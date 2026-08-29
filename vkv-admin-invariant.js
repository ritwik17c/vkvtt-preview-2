/* Preview2 invariant: UI-only. No Firestore reads. Core v66-home-cloud remains the authority for role. */
(()=>{'use strict';
const DEST='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html?v=preview2';
function ensure(){
  const role=String(window.__vkvRole||'').toLowerCase();
  const core=document.getElementById('adminUserAccessBtn');
  const coreAuthorised=role==='admin'||(core&&core.style.display==='inline-block');
  if(!coreAuthorised)return false;
  const grid=document.querySelector('#vkvSection3 .vkv3grid');
  if(!grid)return false;
  let a=document.getElementById('vkvAdminDashboardInvariant');
  if(!a){
    a=document.createElement('a');a.id='vkvAdminDashboardInvariant';a.textContent='⚙ Admin Dashboard';a.href=DEST;
    a.style.cssText='box-sizing:border-box;min-height:76px;text-align:left;padding:15px 17px;border:1px solid #c7d8e2;border-left:5px solid #24739d;border-radius:16px;background:#fff;color:#17364f;font:inherit;font-weight:800;text-decoration:none;box-shadow:0 5px 16px rgba(18,63,90,.06);width:100%;margin:0';
    grid.appendChild(a);
  }
  a.href=DEST;a.style.display='';a.style.visibility='visible';grid.querySelector('.vkv3empty')?.remove();
  return true;
}
let n=0;const t=setInterval(()=>{if(ensure()||++n>=240)clearInterval(t)},250);
window.addEventListener('focus',()=>setTimeout(ensure,100));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensure,100)});
})();