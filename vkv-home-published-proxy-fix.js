import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const dateKey = () => { const d=new Date(), z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; };
const displayDate = v => { const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v||''); };
const periodLabel = p => p ? `P${Number(p)}` : '—';

function values(v){
  if(Array.isArray(v)) return v.filter(Boolean);
  if(v && typeof v === 'object') return Object.values(v).filter(Boolean);
  return [];
}

function normalizedRows(pub){
  if(Array.isArray(pub?.rows)) return pub.rows.filter(Boolean);
  const normal = values(pub?.allotments).map(a => ({
    period:a.period,
    className:a.className||a.class||'—',
    absentTeacher:a.absentTeacher||a.forTeacher||a.proxyFor||'',
    absentCode:a.absentCode||a.forCode||'',
    assignedName:a.assignedName||a.proxyName||a.teacherName||a.name||'',
    assignedCode:a.assignedCode||a.proxyCode||a.teacherCode||a.code||a.toCode||'',
    reason:a.reason||a.note||'',
    kind:a.kind||'Normal Proxy'
  }));
  const emergency = values(pub?.supervisions).map(a => ({
    period:a.period,
    className:a.className||a.class||'—',
    absentTeacher:a.absentTeacher||a.forTeacher||a.proxyFor||'',
    absentCode:a.absentCode||a.forCode||'',
    assignedName:a.assignedName||a.proxyName||a.teacherName||a.name||'',
    assignedCode:a.assignedCode||a.proxyCode||a.teacherCode||a.code||a.toCode||'',
    reason:a.reason||a.note||'',
    kind:a.kind||'Emergency Supervision'
  }));
  return [...normal,...emergency];
}

function historyControl(selectedDate){
  const today=dateKey();
  return `<div class="filterbar" style="grid-template-columns:minmax(190px,260px) auto;align-items:end;max-width:520px">
    <label>Choose date
      <input id="proxyHistoryDate" type="date" value="${esc(selectedDate)}" max="${today}" style="display:block;width:100%;margin-top:4px;padding:9px;border:1px solid #c5d8e1;border-radius:9px;background:#fff;color:inherit">
    </label>
    <button id="proxyHistoryViewBtn" type="button" class="btn primary">View Proxy</button>
  </div>`;
}

function renderPanel(title, html, selectedDate){
  const out=document.getElementById('output');
  if(!out) return;
  out.innerHTML=`<section class="panel"><h3>${esc(title)}</h3><div class="mount">${historyControl(selectedDate)}${html}</div></section>`;
  const viewBtn=document.getElementById('proxyHistoryViewBtn');
  const dateInput=document.getElementById('proxyHistoryDate');
  if(viewBtn && dateInput) viewBtn.addEventListener('click',()=>{
    const d=dateInput.value||dateKey();
    if(d>dateKey()) return;
    showPublishedProxy(d);
  });
  out.firstElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function rowHtml(r){
  const teacher=[r.assignedName,r.assignedCode?`(${r.assignedCode})`:``].filter(Boolean).join(' ') || '—';
  const forTeacher=[r.absentTeacher,r.absentCode?`(${r.absentCode})`:``].filter(Boolean).join(' ') || '—';
  const remarks=[r.kind,r.reason].filter(Boolean).join(' · ') || '—';
  return `<tr><td>${esc(periodLabel(r.period))}</td><td>${esc(r.className||r.class||'—')}</td><td>${esc(forTeacher)}</td><td>${esc(teacher)}</td><td>${esc(remarks)}</td></tr>`;
}

async function showPublishedProxy(selectedDate=dateKey()){
  const d=selectedDate||dateKey(), isToday=d===dateKey(), title=isToday?"Today's Finalised Proxy Allotment":"Finalised Proxy Allotment";
  try{
    if(!getApps().length) throw new Error('The school database is still loading. Please try again in a moment.');
    const db=getFirestore(getApp()), snap=await getDoc(doc(db,'publishedProxy',d));
    if(!snap.exists()){
      renderPanel(title,`<p>No final proxy allotment was published for <b>${esc(displayDate(d))}</b>.</p>`,d);
      return;
    }
    const pub=snap.data()||{}, rows=normalizedRows(pub).sort((a,b)=>Number(a.period||0)-Number(b.period||0)||String(a.className||'').localeCompare(String(b.className||'')));
    if(!rows.length){
      renderPanel(title,`<p>The final proxy record for <b>${esc(displayDate(d))}</b> exists, but it contains no proxy duties.</p>`,d);
      return;
    }
    const by=pub.finalizedByName||pub.finalizedByEmail||'Authorised user';
    const meta=`<p class="small"><b>${esc(displayDate(d))}</b> · <b>✓ Finalised</b>${pub.finalizedAtMs?` · ${esc(new Date(pub.finalizedAtMs).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}`:''} · ${esc(by)}</p>`;
    const table=`<div class="tablewrap"><table><thead><tr><th>Period</th><th>Class</th><th>Proxy For</th><th>Teacher Allotted</th><th>Remarks</th></tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table></div>`;
    renderPanel(title,meta+table,d);
  }catch(e){
    renderPanel(title,`Could not load the final proxy allotment for ${esc(displayDate(d))}: ${esc(e?.message||e)}`,d);
  }
}

document.addEventListener('click', e => {
  const b=e.target.closest('button.tile');
  if(!b || !/Finalised Proxy Allotment/i.test(b.textContent||'')) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  showPublishedProxy(dateKey());
}, true);
