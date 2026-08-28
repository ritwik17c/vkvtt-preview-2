/* Preview2 QB: populate the complete school class and subject lists from master/current. */
(async()=>{'use strict';
const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'},app=A.getApps().length?A.getApp():A.initializeApp(cfg),db=F.getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),add=(set,v)=>{v=String(v||'').trim();if(v)set.add(v)};
try{const s=await F.getDoc(F.doc(db,'master','current'));if(!s.exists())return;const raw=s.data()||{},M=raw.data||raw||{},classes=new Set(),subjects=new Set();
(M.classes||[]).forEach(x=>add(classes,typeof x==='string'?x:(x.name||x.className||x.class||x.standard)));
(M.records||[]).forEach(r=>{add(classes,r.class||r.className||r.standard);add(subjects,r.subject||r.subjectName)});
(M.assignmentCards||[]).forEach(r=>{add(classes,r.class||r.className||r.standard);add(subjects,r.subject||r.subjectName)});
(M.subjects||[]).forEach(x=>add(subjects,typeof x==='string'?x:(x.name||x.subject||x.subjectName)));
['B1','B2','B3','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'].forEach(x=>classes.add(x));
['English','Mathematics','Science','Physics','Chemistry','Biology','Social Science','History','Geography','Political Science','Economics','Accountancy','Business Studies','Computer Science','Assamese','Hindi','Sanskrit'].forEach(x=>subjects.add(x));
const natural=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}),fill=(id,set)=>{const e=document.getElementById(id);if(!e)return;const old=e.value,arr=[...set].sort(natural);e.innerHTML=arr.map(x=>`<option>${esc(x)}</option>`).join('');if(arr.includes(old))e.value=old};
let n=0,t=setInterval(()=>{const c=document.getElementById('qClass'),q=document.getElementById('qSubject');if(c&&q){fill('qClass',classes);fill('qSubject',subjects);clearInterval(t)}else if(++n>40)clearInterval(t)},250)}catch(e){console.warn('QB master population:',e)}
})();
