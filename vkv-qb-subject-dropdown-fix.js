/* Preview-2: keep the teacher QB subject dropdown in sync with master subjects + QB extra subjects. */
(async()=>{
  'use strict';
  if(!/qb-teacher-hub\.html$/i.test(location.pathname))return;
  const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
  const F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js');
  const cfg={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
  const app=A.getApps().length?A.getApp():A.initializeApp(cfg),db=F.getFirestore(app);
  const fallbacks=['English','Assamese','Hindi','Sanskrit','Mathematics','Environmental Studies','EVS','Science','Social Science','Physics','Chemistry','Biology','History','Geography','Political Science','Economics','Accountancy','Business Studies','Computer Science','Informatics Practices','Artificial Intelligence','Information Technology','Physical Education','Art Education','Work Experience','Value Education','General Knowledge','Music','Yoga'];
  const add=(set,v)=>{v=String(v||'').trim();if(v)set.add(v)};
  async function subjects(){
    const [ms,cs]=await Promise.all([F.getDoc(F.doc(db,'master','current')),F.getDoc(F.doc(db,'qbConfig','current')).catch(()=>null)]);
    const raw=ms.exists()?ms.data()||{}:{},m=raw.data&&typeof raw.data==='object'?{...raw,...raw.data}:raw,c=cs&&cs.exists()?cs.data()||{}:{},set=new Set();
    (m.subjects||[]).forEach(x=>add(set,typeof x==='string'?x:(x.name||x.subject||x.subjectName)));
    (m.records||[]).forEach(x=>{add(set,x?.subject);add(set,x?.subjectName)});
    (m.assignmentCards||[]).forEach(x=>{add(set,x?.subject);add(set,x?.subjectName)});
    (c.extraSubjects||[]).forEach(x=>add(set,x));
    fallbacks.forEach(x=>add(set,x));
    return [...set].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
  }
  const all=await subjects();
  function patchFrame(){
    const frame=document.querySelector('iframe[name="qbframe"]');if(!frame)return;
    let doc;try{doc=frame.contentDocument}catch(_){return}if(!doc)return;
    const sel=doc.getElementById('sub');if(!sel)return;
    const old=sel.value,existing=new Set([...sel.options].map(o=>String(o.value||o.textContent||'').trim()));
    for(const s of all)if(!existing.has(s)){const o=doc.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o)}
    const opts=[...sel.options].map(o=>String(o.value||o.textContent||'').trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
    sel.innerHTML=opts.map(s=>`<option value="${s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}">${s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('');
    if(old&&opts.includes(old))sel.value=old;
    sel.dataset.vkvSubjectSync='1';
  }
  const frame=document.querySelector('iframe[name="qbframe"]');if(frame)frame.addEventListener('load',()=>setTimeout(patchFrame,500));
  let tries=0;const timer=setInterval(()=>{patchFrame();if(++tries>30)clearInterval(timer)},400);
})();
