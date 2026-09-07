(()=>{
  'use strict';
  let apiReady=null,busy=false;
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const fmtDate=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'')};
  const dayName=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return'';const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return d.toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'})};
  const to12=v=>{if(!v)return'';const [h0,m='00']=String(v).split(':'),h=Number(h0);if(!Number.isFinite(h))return String(v);return`${h%12||12}:${m} ${h>=12?'pm':'am'}`};
  const addMinutes=(v,n)=>{if(!v)return'';const [h,m]=String(v).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return'';const z=(h*60+m+n+1440)%1440;return`${String(Math.floor(z/60)).padStart(2,'0')}:${String(z%60).padStart(2,'0')}`};
  const baseClass=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,g)=>g.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const romanValue=value=>{const raw=String(value||'').trim().toUpperCase().replace(/^CLASS\s*/,'');if(!/^[IVXLCDM]+$/.test(raw))return null;const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let total=0,prev=0;for(let i=raw.length-1;i>=0;i--){const n=map[raw[i]]||0;if(n<prev)total-=n;else{total+=n;prev=n}}return total||null};
  const classRank=value=>{const raw=String(value||'').trim().toUpperCase().replace(/^CLASS\s*/,'').replace(/\s+/g,'');const b=raw.match(/^B(?:ALVATIKA)?[-_ ]?([123])$/i);if(b)return Number(b[1]);const rv=romanValue(raw);return rv==null?999:3+rv};
  const classCompare=(a,b)=>classRank(a)-classRank(b)||String(a||'').localeCompare(String(b||''),undefined,{numeric:true,sensitivity:'base'});
  const logoUrl=()=>new URL('school-logo.jpg',window.location.href).href;

  async function api(){
    if(apiReady)return apiReady;
    apiReady=(async()=>{
      const [{getApps,getApp},{getFirestore,getDoc,doc}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js')
      ]);
      const app=getApps().length?getApp():null;if(!app)throw new Error('Firebase is not ready.');
      return{db:getFirestore(app),getDoc,doc};
    })();
    return apiReady;
  }

  function rowsFrom(ws){
    const generated=[...(ws?.timetable?.events||[])];
    if(generated.length)return generated.map(e=>({date:e.date||'',day:e.day||dayName(e.date),className:baseClass(e.className||e.class||''),subject:e.subject||''}));
    const manual=ws?.manualTimetable?.assignments||[];
    return manual.map(a=>({date:a.date||'',day:a.day||dayName(a.date),className:baseClass(a.className||a.class||''),subject:a.subject||''}));
  }

  function matrix(ws){
    const rows=rowsFrom(ws).filter(x=>x.date&&x.className&&x.subject);
    const classes=[...new Set(rows.map(x=>x.className))].sort(classCompare);
    const byDate=new Map();
    for(const r of rows){
      const key=String(r.date);if(!byDate.has(key))byDate.set(key,{date:key,day:r.day||dayName(key),subjects:new Map()});
      const cell=byDate.get(key);if(!cell.day)cell.day=dayName(key);
      const old=cell.subjects.get(r.className);
      if(!old)cell.subjects.set(r.className,String(r.subject||''));
      else if(!old.split(/\s*\/\s*/).includes(String(r.subject||'')))cell.subjects.set(r.className,old+' / '+String(r.subject||''));
    }
    return{classes,rows:[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date))};
  }

  function sessions(ws){
    const candidates=[ws?.sessions,ws?.slots,ws?.settings?.sessions,ws?.settings?.slots,ws?.examSessions,ws?.settings?.examSessions];
    return candidates.find(x=>Array.isArray(x)&&x.length)||[];
  }
  function sessionBounds(s){return{start:s?.startTime||s?.start||s?.from||'',end:s?.endTime||s?.end||s?.to||''}}
  function examTiming(ws){
    const list=sessions(ws).map(sessionBounds).filter(x=>x.start&&x.end);
    if(!list.length)return'';
    if(list.length===1)return`${to12(list[0].start)}–${to12(list[0].end)}`;
    return list.map((x,i)=>`Session ${i+1}: ${to12(x.start)}–${to12(x.end)}`).join('  ·  ');
  }

  function storedFooter(title){
    try{return JSON.parse(localStorage.getItem('vkvExamFooter:'+String(title||'').trim().toLowerCase())||'{}')||{}}catch{return{}}
  }
  function liveFooter(){
    return{
      reporting:String(document.getElementById('examFooterReporting')?.value||'').trim(),
      bus:String(document.getElementById('examFooterBus')?.value||'').trim(),
      departure:String(document.getElementById('examFooterDeparture')?.value||'').trim()
    };
  }
  function printDetails(item){
    const ws=item?.workspace||{},title=String(item?.name||ws?.name||'Examination Timetable').trim(),saved=storedFooter(title),live=liveFooter(),x=ws.printDetails||item.printDetails||{};
    const list=sessions(ws).map(sessionBounds).filter(y=>y.start&&y.end),last=list[list.length-1]||{};
    return{
      reporting:x.reporting||live.reporting||saved.reporting||'',
      bus:x.bus||live.bus||saved.bus||'',
      departure:x.departure||live.departure||saved.departure||addMinutes(last.end,10)||''
    };
  }

  function footerHtml(item){
    const f=printDetails(item);
    return`<div class="officialFooter"><div class="report"><b>Reporting Time:</b> ${safe(f.reporting?to12(f.reporting):'________')}</div><div class="busrow"><div><b>Bus Timings:</b> Picking Time: ${safe(f.bus?to12(f.bus):'________')} (1st stoppage)</div><div><b>Departure Time:</b> ${safe(f.departure?to12(f.departure):'________')}</div></div><div class="signatures"><div><div class="sigspace"></div><div class="siglabel">Exam Dept.</div></div><div class="seal">School Seal / Stamp</div><div><div class="sigspace"></div><div class="siglabel">Principal</div></div></div></div>`;
  }

  function officialHtml(item){
    const ws=item?.workspace||{},m=matrix(ws),tm=examTiming(ws),title=String(item?.name||ws?.name||'Examination Timetable').trim(),logo=logoUrl();
    const heads=['Date','Day',...m.classes].map((c,i)=>`<th class="${i<2?'left':'centre'}">${safe(c)}</th>`).join('');
    const body=m.rows.map(r=>`<tr><td class="left dateCell">${safe(fmtDate(r.date))}</td><td class="left dayCell">${safe(r.day||dayName(r.date))}</td>${m.classes.map(c=>`<td class="centre subjectCell">${safe(r.subjects.get(c)||'—')}</td>`).join('')}</tr>`).join('');
    return`<!doctype html><html><head><meta charset="utf-8"><base href="${safe(new URL('.',window.location.href).href)}"><title>${safe(title)}</title><style>
      @page{size:A4 landscape;margin:9mm 10mm 8mm}
      *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{font-family:Arial,Helvetica,sans-serif}.toolbar{padding:7px 0 10px;text-align:right}.toolbar button{font:inherit;font-weight:700;padding:8px 13px}.majorPrintSheet{width:100%;max-width:none;margin:0 auto;padding:2mm 2mm 0}.header{text-align:center;margin:0 0 14px}.logo{display:block;width:62px;height:62px;object-fit:contain;margin:0 auto 6px;filter:grayscale(100%);-webkit-filter:grayscale(100%)}h1{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18.5pt;line-height:1.18;letter-spacing:.55px}h2{margin:6px 0 0;font-size:13.5pt;line-height:1.22;letter-spacing:.2px}.timing{margin:0 0 10px;font-size:10.5pt}table{width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;border:1.35px solid #111}th,td{border:1px solid #111;font-size:9pt;line-height:1.18;padding:5px 4px;white-space:normal;overflow:visible;overflow-wrap:anywhere;word-break:normal;height:auto;vertical-align:middle;min-width:0}th{font-weight:700;background:#f1f1f1}.left{text-align:left}.centre{text-align:center}.dateCell{width:10.5%}.dayCell{width:10.5%}.subjectCell{font-weight:500}.officialFooter{margin-top:15px;font-size:10.25pt}.report{margin-bottom:8px}.busrow{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;margin-bottom:13px}.signatures{display:grid;grid-template-columns:1fr .62fr 1fr;align-items:end;gap:36px;min-height:76px;margin-top:8px}.sigspace{height:48px}.siglabel{font-weight:700;border-top:1px solid #222;padding-top:5px}.seal{text-align:center;color:#555;padding-bottom:5px;font-size:9.5pt}
      @media print{.toolbar{display:none!important}.majorPrintSheet{padding:2mm 2mm 0!important}.logo{width:62px!important;height:62px!important}h1{font-size:18.5pt!important}h2{font-size:13.5pt!important}th,td{font-size:9pt!important;line-height:1.18!important;padding:5px 4px!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.header{margin-bottom:14px!important}.officialFooter{break-inside:avoid;page-break-inside:avoid}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">Print</button></div><div class="majorPrintSheet"><div class="header"><img class="logo" src="${safe(logo)}" alt="Vivekananda Kendra Vidyalaya logo"><h1>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h1><h2>TIMETABLE FOR ${safe(title.toUpperCase())}</h2></div>${tm?`<p class="timing"><b>Exam Timings:</b> ${safe(tm)}</p>`:''}<table><thead><tr>${heads}</tr></thead><tbody>${body||`<tr><td colspan="${Math.max(2,m.classes.length+2)}">No timetable assignments are stored in this workspace.</td></tr>`}</tbody></table>${footerHtml(item)}</div></body></html>`;
  }

  async function openOfficial(id){
    if(busy)return;busy=true;
    try{
      const a=await api(),snap=await a.getDoc(a.doc(a.db,'examSchedules',id));
      if(!snap.exists())throw new Error('Saved timetable not found.');
      const item={id,...snap.data()};
      const w=open('','_blank');if(!w)throw new Error('Allow pop-ups to open the official timetable print view.');
      w.document.open();w.document.write(officialHtml(item));w.document.close();
    }catch(e){alert('Could not open approved timetable layout: '+(e?.message||e))}finally{busy=false}
  }

  function reroute(){
    document.querySelectorAll('[data-library-view]').forEach(b=>{if(!b.dataset.approvedLayoutView){b.dataset.approvedLayoutView=b.dataset.libraryView;b.removeAttribute('data-library-view')}});
  }
  new MutationObserver(reroute).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(reroute,250));
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-approved-layout-view]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();openOfficial(String(b.dataset.approvedLayoutView||''))},true);
})();