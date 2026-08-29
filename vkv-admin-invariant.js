/* Preview2 invariant: UI-only. Reuse the core admin card; never create a duplicate. No Firestore reads. */
(()=>{'use strict';
const DEST='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html?v=preview2';
const norm=s=>String(s||'').replace(/[^A-Za-z0-9]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
function ensure(){
  const role=String(window.__vkvRole||'').toLowerCase();
  const core=document.getElementById('adminUserAccessBtn');
  const coreAuthorised=role==='admin'||(core&&getComputedStyle(core).display!=='none');
  if(!coreAuthorised||!core)return false;
  const grid=document.querySelector('#vkvSection3 .vkv3grid');
  if(!grid)return false;
  // Remove any older Preview2 duplicate cards, but preserve the original core control.
  [...grid.querySelectorAll('a,button')].forEach(e=>{if(e!==core&&norm(e.textContent).includes('admin dashboard'))e.remove()});
  if(core.tagName==='A')core.href=DEST;else core.onclick=()=>{location.href=DEST};
  core.dataset.preview2AdminRoute='1';
  core.style.removeProperty('display');core.style.removeProperty('visibility');
  if(core.parentElement!==grid)grid.appendChild(core);
  grid.querySelector('.vkv3empty')?.remove();
  return true;
}
let n=0;const t=setInterval(()=>{ensure();if(++n>=240)clearInterval(t)},250);
window.addEventListener('focus',()=>setTimeout(ensure,100));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensure,100)});
})();
