/* Preview2 QB: populate complete school class and subject lists from master/current. */
(async()=>{'use strict';
const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'},app=A.getApps().length?A.getApp():A.initializeApp(cfg),db=F.getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),add=(set,v)=>{v=String(v||'').trim();if(v)set.add(v)};
const baseOrder=['B1','B2','B3','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function normClass(v){v=String(v||'').trim().replace(/\s+/g,' ');if(!v)return'';v=v.replace(/\s*[-–—]\s*/g,'-');const m=v.match(/^(B[123]|I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)(?:\s*[- ]\s*([A-Za-z0-9]+))?$/i);if(m){const b=m[1].toUpperCase(),sec=m[2]?m[2].toUpperCase():'';return sec?`${b}-${sec}`:b}return v.toUpperCase()}
function classFrom(x){if(typeof x==='string')return normClass(x);const b=x?.name||x?.className||x?.class||x?.standard||x?.grade||'',s=x?.division||x?.section||x?.div||'';return normClass(s?`${b}-${s}`:b)}
function classCompare(a,b){const split=x=>{const [base,...rest]=x.split('-'),i=baseOrder.indexOf(base);return[i<0?999:i,rest.join('-')]},A=split(a),B=split(b);return A[0]-B[0]||A[1].localeCompare(B[1],undefined,{numeric:true,sensitivity:'base'})}
try{const [s,cfgSnap]=await Promise.all([F.getDoc(F.doc(db,'master','current')),F.getDoc(F.doc(db,'qbConfig','current')).catch(()=>null)]);if(!s.exists())return;const raw=s.data()||{},M=raw.data||raw||{},classes=new Set(),subjects=new Set();
(M.classes||[]).forEach(x=>add(classes,classFrom(x)));
(M.records||[]).forEach(r=>{add(classes,classFrom({class:r.class||r.className||r.standard,section:r.section||r.division||r.div}));add(subjects,r.subject||r.subjectName)});
(M.assignmentCards||[]).forEach(r=>{add(classes,classFrom({class:r.class||r.className||r.standard,section:r.section||r.division||r.div}));add(subjects,r.subject||r.subjectName)});
(M.subjects||[]).forEach(x=>add(subjects,typeof x==='string'?x:(x.name||x.subject||x.subjectName)));
baseOrder.forEach(x=>classes.add(x));
['English','Mathematics','Environmental Studies','EVS','Science','General Science','Physics','Chemistry','Biology','Social Science','History','Geography','Political Science','Economics','Accountancy','Business Studies','Computer Science','Information Technology','Artificial Intelligence','Assamese','Hindi','Sanskrit','Physical Education','Music','Art','Yoga','Moral Science'].forEach(x=>subjects.add(x));
if(cfgSnap?.exists())(cfgSnap.data().extraSubjects||[]).forEach(x=>add(subjects,x));
const fillClass=id=>{const e=document.getElementById(id);if(!e)return;const old=e.value,arr=[...classes].filter(Boolean).sort(classCompare);e.innerHTML=arr.map(x=>`<option>${esc(x)}</option>`).join('');if(arr.includes(old))e.value=old},fillSub=id=>{const e=document.getElementById(id);if(!e)return;const old=e.value,arr=[...subjects].filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));e.innerHTML=arr.map(x=>`<option>${esc(x)}</option>`).join('');if(arr.includes(old))e.value=old};
let n=0,t=setInterval(()=>{const c=document.getElementById('qClass'),q=document.getElementById('qSubject');if(c&&q){fillClass('qClass');fillSub('qSubject');clearInterval(t)}else if(++n>40)clearInterval(t)},250)}catch(e){console.warn('QB master population:',e)}
})();
