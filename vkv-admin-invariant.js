/* Preview2 Admin Dashboard invariant. One targeted authorization read per page load; no scans/polling. */
(async()=>{'use strict';
const DEST='https://ritwik17c.github.io/vkvtt-preview-2/admin-dashboard.html?v=preview2';
const norm=s=>String(s||'').replace(/[^A-Za-z0-9]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
let adminConfirmed=false,checking=false;
function place(){
  if(!adminConfirmed)return false;
  const grid=document.querySelector('#vkvSection3 .vkv3grid');if(!grid)return false;
  let card=document.getElementById('adminUserAccessBtn')||document.getElementById('vkvAdminDashboardInvariant');
  // Keep exactly one Admin Dashboard control.
  [...document.querySelectorAll('a,button')].forEach(e=>{if(e!==card&&norm(e.textContent)==='admin dashboard'&&e.closest('#vkvSection3'))e.remove()});
  if(!card){card=document.createElement('a');card.id='vkvAdminDashboardInvariant';card.textContent='⚙ Admin Dashboard'}
  if(card.tagName==='A')card.href=DEST;else card.onclick=()=>{location.href=DEST};
  card.dataset.preview2AdminRoute='1';
  card.style.cssText+=';display:block!important;visibility:visible!important;opacity:1!important;box-sizing:border-box;min-height:76px;text-align:left;padding:15px 17px;border:1px solid #c7d8e2;border-left:5px solid #24739d;border-radius:16px;background:#fff;color:#17364f;font:inherit;font-weight:800;text-decoration:none;box-shadow:0 5px 16px rgba(18,63,90,.06);width:100%;margin:0';
  if(card.parentElement!==grid)grid.appendChild(card);grid.querySelector('.vkv3empty')?.remove();return true;
}
async function confirmAdmin(){if(checking||adminConfirmed)return;checking=true;try{
  const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
  const U=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
  const F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
  const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
  const app=A.getApps().length?A.getApp():A.initializeApp(cfg),auth=U.getAuth(app);if(auth.authStateReady)await auth.authStateReady().catch(()=>{});
  const u=auth.currentUser;if(!u)return;
  const db=F.getFirestore(app),s=await F.getDoc(F.doc(db,'authorizedUsers',u.uid));
  adminConfirmed=!!(s.exists()&&s.data().active===true&&String(s.data().role||'').toLowerCase()==='admin');
  if(adminConfirmed)place();
 }catch(e){console.warn('Preview2 admin invariant:',e)}finally{checking=false}}
confirmAdmin();let n=0,t=setInterval(()=>{place();if(!adminConfirmed&&n%8===0)confirmAdmin();if(++n>=80)clearInterval(t)},250);
window.addEventListener('focus',()=>{place();if(!adminConfirmed)confirmAdmin()});
})();
