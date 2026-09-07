(()=>{
  'use strict';
  let apiReady=null,busy=false;
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const fmtDate=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'')};
  const to12=v=>{if(!v)return'';const [h0,m='00']=String(v).split(':'),h=Number(h0);if(!Number.isFinite(h))return String(v);return`${h%12||12}:${m} ${h>=12?'pm':'am'}`};
  const baseClass=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,g)=>g.toUpperCase()).replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const romanValue=value=>{const raw=String(value||'').trim().toUpperCase().replace(/^CLASS\s*/,'');if(!/^[IVXLCDM]+$/.test(raw))return null;const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let total=0,prev=0;for(let i=raw.length-1;i>=0;i--){const n=map[raw[i]]||0;if(n<prev)total-=n;else{total+=n;prev=n}}return total||null};
  const classRank=value=>{const raw=String(value||'').trim().toUpperCase().replace(/^CLASS\s*/,'').replace(/\s+/g,'');const b=raw.match(/^B(?:ALVATIKA)?[-_ ]?([123])$/i);if(b)return Number(b[1]);const rv=romanValue(raw);return rv==null?999:3+rv};
  const classCompare=(a,b)=>classRank(a)-classRank(b)||String(a||'').localeCompare(String(b||''),undefined,{numeric:true,sensitivity:'base'});

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
    if(generated.length)return generated.map(e=>({date:e.date||'',day:e.day||'',className:baseClass(e.className||e.class||''),subject:e.subject||''}));
    const manual=ws?.manualTimetable?.assignments||[];
    return manual.map(a=>({date:a.date||'',day:a.day||'',className:baseClass(a.className||a.class||''),subject:a.subject||''}));
  }

  function matrix(ws){
    const rows=rowsFrom(ws).filter(x=>x.date&&x.className&&x.subject);
    const classes=[...new Set(rows.map(x=>x.className))].sort(classCompare);
    const byDate=new Map();
    for(const r of rows){
      const key=String(r.date);if(!byDate.has(key))byDate.set(key,{date:key,day:r.day||'',subjects:new Map()});
      const cell=byDate.get(key),old=cell.subjects.get(r.className);
      if(!old)cell.subjects.set(r.className,String(r.subject||''));
      else if(!old.split(/\s*\/\s*/).includes(String(r.subject||'')))cell.subjects.set(r.className,old+' / '+String(r.subject||''));
    }
    return{classes,rows:[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date))};
  }

  function examTiming(ws){
    const slots=ws?.slots||ws?.sessions||[];
    if(slots.length!==1)return'';
    const s=slots[0],a=s.startTime||s.start||'',b=s.endTime||s.end||'';
    return a&&b?`${to12(a)}–${to12(b)}`:'';
  }

  function printDetails(item){
    const ws=item?.workspace||{},x=ws.printDetails||item.printDetails||{};
    return{reporting:x.reporting||'',bus:x.bus||'',departure:x.departure||''};
  }

  function footerHtml(item){
    const f=printDetails(item);
    return`<div class="officialFooter"><div class="report"><b>Reporting Time:</b> ${safe(f.reporting?to12(f.reporting):'________')}</div><div class="busrow"><div><b>Bus Timings:</b> Picking Time: ${safe(f.bus?to12(f.bus):'________')} (1st stoppage)</div><div><b>Departure Time:</b> ${safe(f.departure?to12(f.departure):'________')}</div></div><div class="signatures"><div><div class="sigline"></div><div class="siglabel">Exam Dept.</div></div><div class="seal">School Seal / Stamp</div><div><div class="sigline"></div><div class="siglabel">Principal</div></div></div></div>`;
  }

  function officialHtml(item){
    const ws=item?.workspace||{},m=matrix(ws),tm=examTiming(ws),title=String(item?.name||ws?.name||'Examination Timetable').trim();
    const heads=['Date','Day',...m.classes].map((c,i)=>`<th class="${i<2?'left':'centre'}">${safe(c)}</th>`).join('');
    const body=m.rows.map(r=>`<tr><td class="left">${safe(fmtDate(r.date))}</td><td class="left">${safe(r.day||'')}</td>${m.classes.map(c=>`<td class="centre">${safe(r.subjects.get(c)||'—')}</td>`).join('')}</tr>`).join('');
    return`<!doctype html><html><head><meta charset="utf-8"><title>${safe(title)}</title><style>
      @page{size:A4 landscape;margin:8mm}
      *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{font-family:Arial,Helvetica,sans-serif}.toolbar{padding:8px 0 12px;text-align:right}.toolbar button{font:inherit;font-weight:700;padding:8px 12px}.majorPrintSheet{width:100%;max-width:none;margin:0;padding:3mm 4mm 0}.header{text-align:center;margin-bottom:18px}.logo{display:block;width:56px;height:56px;object-fit:contain;margin:0 auto 7px;filter:grayscale(100%)}h1{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18pt;line-height:1.2;letter-spacing:.6px}h2{margin:7px 0 0;font-size:13.5pt;line-height:1.25;letter-spacing:.3px}.timing{margin:0 0 12px;font-size:10.5pt}table{width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;border:1.4px solid #111}th,td{border:1px solid #111;font-size:8.6pt;line-height:1.12;padding:4px 3px;white-space:normal;overflow:visible;overflow-wrap:anywhere;word-break:break-word;height:auto;vertical-align:middle;min-width:0}th{font-weight:700;background:#f2f2f2}.left{text-align:left}.centre{text-align:center}.officialFooter{margin-top:20px;font-size:10.5pt}.report{margin-bottom:10px}.busrow{display:flex;justify-content:space-between;gap:20px;margin-bottom:30px}.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:end;gap:28px;min-height:95px}.sigline{height:50px;border-bottom:1px solid #222}.siglabel{margin-top:7px;font-weight:700}.seal{text-align:center;color:#666;padding-bottom:8px}
      @media print{.toolbar{display:none!important}.majorPrintSheet{padding:3mm 4mm 0!important}h1{font-size:18pt!important}h2{font-size:13.5pt!important}th,td{font-size:8.6pt!important;line-height:1.12!important;padding:4px 3px!important}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">Print</button></div><div class="majorPrintSheet"><div class="header"><img class="logo" src="school-logo.jpg" alt="School logo"><h1>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h1><h2>TIMETABLE FOR ${safe(title.toUpperCase())}</h2></div>${tm?`<p class="timing"><b>Exam Timings:</b> ${safe(tm)}</p>`:''}<table><thead><tr>${heads}</tr></thead><tbody>${body||`<tr><td colspan="${Math.max(2,m.classes.length+2)}">No timetable assignments are stored in this workspace.</td></tr>`}</tbody></table>${footerHtml(item)}</div></body></html>`;
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