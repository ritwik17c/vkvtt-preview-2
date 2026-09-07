(()=>{
  'use strict';
  const GRADES=['B1','B2','B3','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const repaired=new Set(),working=new Set();
  let apiPromise=null;
  const norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,' ');
  function rangeFromName(name){
    const s=norm(name).replace(/[—–]/g,'-');
    const m=s.match(/(?:^|[^A-Z0-9])(B[1-3]|XII|XI|IX|VIII|VII|VI|IV|V|III|II|I)\s*-\s*(B[1-3]|XII|XI|IX|VIII|VII|VI|IV|V|III|II|I)(?:[^A-Z0-9]|$)/);
    if(!m)return[];
    const a=GRADES.indexOf(m[1]),b=GRADES.indexOf(m[2]);
    if(a<0||b<0)return[];
    return GRADES.slice(Math.min(a,b),Math.max(a,b)+1);
  }
  async function api(){
    if(apiPromise)return apiPromise;
    apiPromise=(async()=>{
      const [{getApps,getApp},{getFirestore,getDoc,doc,setDoc,serverTimestamp}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{db:getFirestore(app),getDoc,doc,setDoc,serverTimestamp};
    })();
    return apiPromise;
  }
  function nearestCard(button){
    let el=button;
    for(let i=0;i<6&&el?.parentElement;i++,el=el.parentElement){
      const text=String(el.textContent||'');
      if(/subject selections/i.test(text)&&text.length<1200)return el;
    }
    return button.parentElement;
  }
  function updateCard(button,name,classes,count){
    const card=nearestCard(button);if(!card)return;
    const candidates=[...card.querySelectorAll('p,small,div')].filter(el=>/subject selections/i.test(el.textContent||''));
    const line=candidates.sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length)[0];
    if(line)line.textContent=`${classes.join(', ')} · ${count} subject selection${count===1?'':'s'}`;
    button.dataset.templateScope=classes.join(',');
    button.title=`Template classes: ${classes.join(', ')}`;
  }
  function filteredSubjects(template,allowed){
    const out={};let count=0;
    for(const c of allowed){
      const list=Array.isArray(template?.subjects?.[c])?template.subjects[c]:[];
      out[c]=[...new Set(list.map(x=>String(x||'').trim()).filter(Boolean))];count+=out[c].length;
    }
    return{subjects:out,count};
  }
  async function repair(button){
    const id=String(button?.dataset?.realUseTemplate||'');if(!id||repaired.has(id)||working.has(id))return;
    working.add(id);button.disabled=true;
    try{
      const x=await api(),snap=await x.getDoc(x.doc(x.db,'examSchedules',id));if(!snap.exists())return;
      const data=snap.data()||{},name=String(data.name||data.sourceScheduleName||''),allowed=rangeFromName(name);
      if(!allowed.length){repaired.add(id);return}
      const t=data.template||{},filtered=filteredSubjects(t,allowed),pattern=(t.timetablePattern||[]).filter(p=>allowed.includes(norm(p.className)));
      const workspace=data.workspace||{},workspacePapers=(workspace.papers||[]).filter(p=>allowed.includes(norm(p.className)));
      updateCard(button,name,allowed,filtered.count);
      const current=(t.classes||[]).map(norm),needs=current.length!==allowed.length||current.some((c,i)=>c!==allowed[i])||Object.keys(t.subjects||{}).some(c=>!allowed.includes(norm(c)))||(t.timetablePattern||[]).length!==pattern.length;
      if(needs){
        await x.setDoc(x.doc(x.db,'examSchedules',id),{
          template:{...t,classes:allowed,subjects:filtered.subjects,timetablePattern:pattern},
          workspace:{...workspace,classes:allowed,papers:workspacePapers},
          updatedAtMs:Date.now(),updatedAt:x.serverTimestamp()
        },{merge:true});
      }
      repaired.add(id);
    }catch(err){console.warn('Template class-scope repair skipped',err)}finally{working.delete(id);button.disabled=false}
  }
  function scan(){for(const b of document.querySelectorAll('[data-real-use-template]'))repair(b)}
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>{setTimeout(scan,250);setTimeout(scan,900)});
  setTimeout(scan,500);
})();