/* Preview 2 — restore Admin Dashboard card into Section 3 after auth/role visibility resolves. */
(()=>{'use strict';
const find=()=>document.getElementById('adminUserAccessBtn')||[...document.querySelectorAll('button,a')].find(e=>String(e.textContent||'').replace(/\s+/g,' ').trim().includes('Admin Dashboard'));
function place(){const grid=document.querySelector('#vkvSection3 .vkv3grid');if(!grid)return false;const btn=find();if(!btn)return false;const visible=getComputedStyle(btn).display!=='none'||btn.id==='adminUserAccessBtn';if(!visible)return false;btn.style.removeProperty('display');btn.style.removeProperty('visibility');if(btn.parentElement!==grid)grid.appendChild(btn);grid.querySelector('.vkv3empty')?.remove();return true}
let n=0;const t=setInterval(()=>{n++;if(place()||n>=30)clearInterval(t)},300);window.addEventListener('focus',()=>setTimeout(place,120));
})();
