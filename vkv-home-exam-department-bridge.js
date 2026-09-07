import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';
const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'},app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
let allowed=false,checking=false,timer=null;
async function refreshAccess(){
  if(checking)return allowed;checking=true;
  try{
    const user=auth.currentUser;if(!user){allowed=false;return false}
    const snap=await getDoc(doc(db,'authorizedUsers',user.uid));
    const profile=snap.exists()?snap.data():null;
    allowed=!!profile&&profile.active!==false&&(String(profile.role||'').toLowerCase()==='admin'||profile.permissions?.examDepartment===true);
    return allowed;
  }catch(_){allowed=false;return false}finally{checking=false}
}
function ensureTile(){
  const grid=document.getElementById('delegatedGrid'),section=document.getElementById('delegated');
  if(!grid||!section)return;
  const existing=[...grid.querySelectorAll('a')].find(item=>/exam-department\.html/i.test(item.getAttribute('href')||''));
  if(!allowed){if(existing)existing.remove();return}
  if(!existing){
    const link=document.createElement('a');link.className='tile gold';link.href='./exam-department.html';link.textContent='🗓️ Examination Department';link.dataset.examDepartmentTile='1';grid.appendChild(link);
  }
  section.classList.remove('hidden');
}
function scheduleEnsure(){if(timer)clearTimeout(timer);timer=setTimeout(ensureTile,80)}
onAuthStateChanged(auth,async()=>{await refreshAccess();scheduleEnsure();setTimeout(ensureTile,400);setTimeout(ensureTile,1200)});
const start=()=>{
  const grid=document.getElementById('delegatedGrid');if(!grid)return setTimeout(start,150);
  new MutationObserver(scheduleEnsure).observe(grid,{childList:true,subtree:true});
  scheduleEnsure();
};
start();
window.addEventListener('load',async()=>{await refreshAccess();scheduleEnsure();setTimeout(ensureTile,700);setTimeout(ensureTile,1800)});
