import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import{getFirestore,doc,getDoc}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';
const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
async function install(){if(!/(^|\/)index\.html$|\/$/i.test(location.pathname))return;if(auth.authStateReady)await auth.authStateReady().catch(()=>{});const u=auth.currentUser;if(!u)return;const p=await getDoc(doc(db,'authorizedUsers',u.uid)).catch(()=>null);if(!p?.exists()||p.data().active===false)return;const role=String(p.data().role||'').trim().toLowerCase();if(!['admin','manager'].includes(role))return;const grid=document.getElementById('delegatedGrid'),sec=document.getElementById('delegated');if(!grid||document.getElementById('homeClassObservation'))return;const a=document.createElement('a');a.id='homeClassObservation';a.className='tile gold';a.href='./class-observation.html?v=20260919-manager-access-refresh-1';a.textContent='📝 Class Observation';grid.appendChild(a);if(sec)sec.classList.remove('hidden')}
const run=()=>install().catch(e=>console.warn('Class Observation Home access:',e));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
onAuthStateChanged(auth,()=>run());
window.addEventListener('focus',run);
