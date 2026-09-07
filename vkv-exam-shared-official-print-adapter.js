(()=>{
  'use strict';
  let apiReady=null,busy=false;
  const $=id=>document.getElementById(id);
  const norm=v=>String(v??'').trim();
  const baseClass=v=>norm(v).replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,g)=>g.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const dayName=v=>{const m=norm(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return'';return new Date(Date.UTC(+m[1],+m[2]-1,+m[3])).toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'})};
  const fmtDate=v=>{const m=norm(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:norm(v)};
  const addMinutes=(v,n)=>{if(!v)return'';const [h,m]=String(v).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return'';const z=(h*60+m+n+1440)%1440;return`${String(Math.floor(z/60)).padStart(2,'0')}:${String(z%60).padStart(2,'0')}`};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getAuth},{getFirestore,getDoc,updateDoc,doc}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{auth:getAuth(app),db:getFirestore(app),getDoc,updateDoc,doc};
    })();return apiReady;
  }

  function rowsFrom(item){
    const ws=item?.workspace||{};
    const manual=ws?.manualTimetable?.assignments||item?.manualTimetable?.assignments||[];
    const source=manual.length?manual:(ws?.timetable?.events||[]);
    return source.map(x=>({
      date:norm(x.date),
      day:norm(x.day)||dayName(x.date),
      className:baseClass(x.className||x.class),
      subject:norm(x.subject)
    })).filter(x=>x.date&&x.className&&x.subject);
  }

  function matrixFor(item){
    const rows=rowsFrom(item),classes=[...new Set(rows.map(x=>x.className))];
    classes.sort((a,b)=>window.vkvExamClassCompare?.(a,b)??a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
    const byDate=new Map();
    for(const r of rows){
      if(!byDate.has(r.date))byDate.set(r.date,{date:r.date,day:r.day||dayName(r.date),subjects:new Map()});
      const row=byDate.get(r.date);if(!row.day)row.day=dayName(r.date);
      const old=row.subjects.get(r.className);
      if(!old)row.subjects.set(r.className,r.subject);
      else if(!old.split(/\s*\/\s*/).includes(r.subject))row.subjects.set(r.className,old+' / '+r.subject);
    }
    return{classes,rows:[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date))};
  }

  function sessions(item){
    const ws=item?.workspace||{};
    for(const x of [ws.sessions,ws.slots,ws.settings?.sessions,ws.settings?.slots,ws.examSessions,ws.settings?.examSessions])if(Array.isArray(x)&&x.length)return x;
    return[];
  }
  function bounds(s){return{start:norm(s?.startTime||s?.start||s?.from),end:norm(s?.endTime||s?.end||s?.to)}}
  function localFooter(title){try{return JSON.parse(localStorage.getItem('vkvExamFooter:'+norm(title).toLowerCase())||'{}')||{}}catch{return{}}}
  function resolvedDetails(item){
    const ws=item?.workspace||{},title=norm(item?.name||ws?.name||'Examination Timetable'),cloud=ws.printDetails||item.printDetails||ws.settings?.printDetails||{},local=localFooter(title);
    const liveSame=norm($('workspaceName')?.value).toLowerCase()===title.toLowerCase();
    const live=liveSame?{reporting:norm($('examFooterReporting')?.value),bus:norm($('examFooterBus')?.value),departure:norm($('examFooterDeparture')?.value)}:{};
    const ss=sessions(item).map(bounds).filter(x=>x.start||x.end),last=ss[ss.length-1]||{};
    return{
      reporting:norm(cloud.reporting||cloud.reportingTime||live.reporting||local.reporting),
      bus:norm(cloud.bus||cloud.busPicking||cloud.busPickingTime||live.bus||local.bus),
      departure:norm(cloud.departure||cloud.departureTime||live.departure||local.departure||addMinutes(last.end,10))
    };
  }

  async function migrateExact(item,details){
    const ws=item?.workspace||{},cloud=ws.printDetails||item.printDetails||{};
    if((cloud.reporting||cloud.reportingTime)&&(cloud.bus||cloud.busPicking||cloud.busPickingTime))return;
    if(!details.reporting&&!details.bus)return;
    try{
      const a=await api();if(!a.auth.currentUser)return;
      await a.updateDoc(a.doc(a.db,'examSchedules',item.id),{
        'workspace.printDetails':details,
        printDetails:details,
        printDetailsUpdatedAtMs:Date.now(),
        printDetailsUpdatedByUid:a.auth.currentUser.uid
      });
    }catch(e){
      // Published schedules are writable only by Admin. A read-only Exam Manager can
      // still print the exact approved layout; the Admin-side migration is what makes
      // legacy local footer values portable to other browsers/accounts.
      console.info('[exam official print] print-detail migration skipped:',e?.code||e?.message||e);
    }
  }

  function makeTable(item){
    const m=matrixFor(item),table=document.createElement('table');table.className='majorMatrix';
    const thead=document.createElement('thead'),hr=document.createElement('tr');
    for(const h of ['Date','Day',...m.classes]){const th=document.createElement('th');th.textContent=h;hr.appendChild(th)}
    thead.appendChild(hr);table.appendChild(thead);
    const tbody=document.createElement('tbody');
    for(const r of m.rows){const tr=document.createElement('tr');for(const v of [fmtDate(r.date),r.day||dayName(r.date),...m.classes.map(c=>r.subjects.get(c)||'—')]){const td=document.createElement('td');td.textContent=v;tr.appendChild(td)}tbody.appendChild(tr)}
    table.appendChild(tbody);return{table,count:m.rows.length};
  }

  async function waitOfficial(){
    for(let i=0;i<60;i++){
      if($('majorPrint')&&$('examFooterReporting')&&$('examFooterBus')&&$('examFooterDeparture'))return true;
      await wait(100);
    }
    return false;
  }

  function prepareSessions(item){
    const host=$('sessionRows'),all=[...(host?.querySelectorAll('[data-session-row]')||[])],saved=[];
    const list=sessions(item).map(bounds).filter(x=>x.start||x.end),one=list.length?list[0]:null;
    let temp=null;
    if(!host)return()=>{};
    if(!all.length){
      temp=document.createElement('div');temp.dataset.sessionRow='1';temp.style.display='none';temp.innerHTML='<input data-session-field="startTime"><input data-session-field="endTime">';host.appendChild(temp);all.push(temp);
    }
    all.forEach((row,i)=>{
      const start=row.querySelector('[data-session-field="startTime"]'),end=row.querySelector('[data-session-field="endTime"]');
      saved.push({row,had:row.hasAttribute('data-session-row'),start:start?.value,end:end?.value});
      if(i===0){row.setAttribute('data-session-row','1');if(start)start.value=one?.start||'';if(end)end.value=one?.end||''}
      else row.removeAttribute('data-session-row');
    });
    return()=>{for(const s of saved){if(s.had)s.row.setAttribute('data-session-row','1');else s.row.removeAttribute('data-session-row');const a=s.row.querySelector('[data-session-field="startTime"]'),b=s.row.querySelector('[data-session-field="endTime"]');if(a)a.value=s.start??'';if(b)b.value=s.end??''}if(temp)temp.remove()};
  }

  async function printWithApprovedRenderer(id){
    if(busy||!id)return;busy=true;
    let restore=()=>{};
    try{
      const a=await api(),snap=await a.getDoc(a.doc(a.db,'examSchedules',id));if(!snap.exists())throw new Error('Saved timetable not found.');
      const item={id,...snap.data()},built=makeTable(item);if(!built.count)throw new Error('No saved timetable assignments were found.');
      if(!await waitOfficial())throw new Error('The approved timetable renderer did not initialise.');
      const host=$('printableMatrixHost');if(!host)throw new Error('The approved timetable matrix is unavailable.');
      const titleInput=$('workspaceName'),oldTitle=titleInput?.value||'',details=resolvedDetails(item);
      await migrateExact(item,details);

      const fragment=document.createDocumentFragment();while(host.firstChild)fragment.appendChild(host.firstChild);host.appendChild(built.table);
      if(titleInput)titleInput.value=norm(item.name||item.workspace?.name||'Examination Timetable');
      const rSession=prepareSessions(item);
      const f1=$('examFooterReporting'),f2=$('examFooterBus'),f3=$('examFooterDeparture'),oldFooter=[f1?.value||'',f2?.value||'',f3?.value||''];
      if(f1)f1.value=details.reporting;if(f2)f2.value=details.bus;if(f3)f3.value=details.departure;
      restore=()=>{
        rSession();
        built.table.remove();host.appendChild(fragment);
        if(titleInput)titleInput.value=oldTitle;
        if(f1)f1.value=oldFooter[0];if(f2)f2.value=oldFooter[1];if(f3)f3.value=oldFooter[2];
      };
      // Invoke the exact approved vkv-exam-output-finalizer renderer and frozen
      // c3fe9c21 print CSS. No alternate HTML/print template is created here.
      $('majorPrint').click();
      setTimeout(restore,250);
    }catch(e){restore();alert('Could not open the approved timetable print: '+(e?.message||e))}finally{setTimeout(()=>{busy=false},300)}
  }

  window.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-library-view],[data-approved-layout-view]');if(!b)return;
    const id=norm(b.dataset.libraryView||b.dataset.approvedLayoutView);if(!id)return;
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();printWithApprovedRenderer(id);
  },true);
})();