/* Preview 2 — robust Admin Dashboard restorer. Uses VKVTT's resolved runtime role; does not perform extra Firestore reads. */
(()=>{'use strict';
const norm=s=>String(s||'').replace(/[^A-Za-z0-9]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
function roleIsAdmin(){return String(window.__vkvRole||'').toLowerCase()==='admin'}
function existing(){return document.getElementById('vkvAdminDashboardCard')||document.getElementById('adminUserAccessBtn')||[...document.querySelectorAll('button,a')].find(e=>norm(e.textContent).includes('admin dashboard'))}
function place(){const grid=document.querySelector('#vkvSection3 .vkv3grid');if(!grid||!roleIsAdmin())return false;let btn=existing();if(!btn){btn=document.createElement('a');btn.id='vkvAdminDashboardCard';btn.href='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html';btn.textContent='⚙ Admin Dashboard';btn.style.cssText='box-sizing:border-box;min-height:76px;text-align:left;padding:15px 17px;border:1px solid #c7d8e2;border-left:5px solid #24739d;border-radius:16px;background:#fff;color:#17364f;font:inherit;font-weight:800;text-decoration:none;box-shadow:0 5px 16px rgba(18,63,90,.06);width:100%;margin:0'}btn.style.removeProperty('display');btn.style.removeProperty('visibility');if(btn.parentElement!==grid)grid.appendChild(btn);grid.querySelector('.vkv3empty')?.remove();return true}
let n=0;const t=setInterval(()=>{n++;if(place()||n>=80)clearInterval(t)},250);window.addEventListener('focus',()=>setTimeout(place,100));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(place,100)});
})();
