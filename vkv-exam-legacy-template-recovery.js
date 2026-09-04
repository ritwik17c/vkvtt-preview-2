import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,collection,getDocs,doc,getDoc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const allow=new Set();
const norm=v=>String(v||'').toLowerCase().replace(/\btemplate\b/g,'').replace(/\bcopy\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const isTemplate=x=>x?.templateOnly===true||/^TEMPLATE_/i.test(x?.id||'');

async function recover(id){
  const snap=await getDoc(doc(db,'examSchedules',id));
  if(!snap.exists())return false;
  const data={id,...snap.data()},t=data.template||{};
  if((t.timetablePattern||[]).length||data.sourceScheduleId)return false;
  const allSnap=await getDocs(collection(db,'examSchedules'));
  const timetables=allSnap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!isTemplate(x)&&x.workspace?.timetable?.events?.length);
  const target=norm(data.sourceScheduleName||data.name||'');
  let matches=timetables.filter(x=>norm(x.name||x.workspace?.name||'')===target);
  if(!matches.length)matches=timetables.filter(x=>{const n=norm(x.name||x.workspace?.name||'');return target&&n&&(target.includes(n)||n.includes(target))});
  if(matches.length!==1)return false;
  const source=matches[0];
  await setDoc(doc(db,'examSchedules',id),{sourceScheduleId:source.id,sourceScheduleName:source.name||source.workspace?.name||'',updatedAtMs:Date.now(),updatedAt:serverTimestamp()},{merge:true});
  return true;
}

window.addEventListener('click',async e=>{
  const b=e.target.closest?.('[data-real-use-template]');
  if(!b)return;
  const id=String(b.dataset.realUseTemplate||'');
  if(!id||allow.has(id)){allow.delete(id);return}
  e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  try{
    const changed=await recover(id);
    allow.add(id);
    b.click();
    if(changed)setTimeout(()=>{const m=document.getElementById('templatePatternMsg');if(m)m.insertAdjacentHTML('beforeend','<br><b>Legacy template recovered from its original saved timetable.</b>')},700);
  }catch(err){
    allow.add(id);b.click();
  }
},true);
