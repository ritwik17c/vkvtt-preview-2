// VKVTT QB Paper Builder — local-only preview/print enhancement
// Phase E3: formatted preview + marks validation. Reads local draft only; no Firestore access/writes.
(function(){
  const STORAGE='vkvtt.qb.paperDraft.v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nl=s=>esc(s).replace(/\n/g,'<br>');
  function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch(_){return {}}}
  function total(state){return (state.sections||[]).reduce((a,s)=>a+(s.questions||[]).reduce((x,q)=>x+(Number(q.marks)||0),0),0)}
  function paperHtml(state){
    const used=total(state),target=Number(state.target)||0,balanced=!target||used===target;
    const sections=(state.sections||[]).map((s,si)=>{
      const sectionMarks=(s.questions||[]).reduce((a,q)=>a+(Number(q.marks)||0),0);
      const qs=(s.questions||[]).map((q,qi)=>{
        const marks=Number(q.marks)||0;
        return `<div class="q"><div class="qn">${qi+1}.</div><div class="qt">${nl(q.text||'')} ${q.choice?`<div class="or">OR</div><div>${nl(q.choice)}</div>`:''}</div><div class="mk">[${marks}]</div></div>`;
      }).join('');
      return `<section><div class="sec"><strong>Section ${String.fromCharCode(65+si)}${s.name?' — '+esc(s.name):''}</strong><span>${sectionMarks} marks</span></div>${s.instructions?`<div class="inst">${nl(s.instructions)}</div>`:''}${qs||'<div class="empty">No questions in this section.</div>'}</section>`;
    }).join('');
    const check=target?`<div class="check ${balanced?'ok':'warn'}">${balanced?'✓ Total marks match the target.':`⚠ Draft total is ${used}; target is ${target}. Please correct the marks before final use.`}</div>`:'';
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(state.title||'Question Paper Preview')}</title><style>
      body{font-family:Georgia,'Times New Roman',serif;color:#111;background:#f3f5f7;margin:0}.bar{position:sticky;top:0;background:#17364f;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;gap:10px;align-items:center;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif}.bar button{border:0;border-radius:9px;padding:9px 13px;font-weight:700;cursor:pointer}.paper{max-width:820px;margin:22px auto;background:#fff;padding:42px 50px;box-shadow:0 4px 22px #0002}.school{text-align:center;font-weight:700;font-size:18px}.title{text-align:center;font-size:22px;font-weight:700;margin:6px 0}.meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;border-top:1px solid #222;border-bottom:1px solid #222;padding:9px 0;margin:16px 0 20px}.meta div:nth-child(even){text-align:right}.sec{display:flex;justify-content:space-between;border-bottom:1px solid #777;padding:7px 0;margin-top:18px}.inst{font-style:italic;margin:8px 0}.q{display:grid;grid-template-columns:28px 1fr 52px;gap:6px;margin:14px 0;line-height:1.45}.mk{text-align:right;white-space:nowrap}.or{text-align:center;font-weight:700;margin:7px 0}.check{font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;padding:9px 12px;border-radius:9px;margin:14px 0}.ok{background:#ecf8ef;border:1px solid #aad3b4}.warn{background:#fff5dc;border:1px solid #ddbd68}.empty{color:#777;font-style:italic;margin:10px 0}.foot{border-top:1px solid #aaa;margin-top:28px;padding-top:8px;text-align:right;font-size:12px;color:#555}@media(max-width:700px){.paper{margin:0;padding:24px 18px;box-shadow:none}.meta{grid-template-columns:1fr}.meta div:nth-child(even){text-align:left}}@media print{body{background:#fff}.bar{display:none}.paper{box-shadow:none;margin:0;max-width:none;padding:0}.check.warn{display:block}.foot{margin-top:20px}@page{size:A4;margin:16mm}}
    </style></head><body><div class="bar"><span>VKVTT · Paper Preview</span><div><button onclick="window.print()">Print / Save as PDF</button></div></div><main class="paper"><div class="school">Vivekananda Kendra Vidyalaya, Nalbari</div><div class="title">${esc(state.exam||state.title||'Question Paper')}</div>${state.title&&state.exam?`<div style="text-align:center">${esc(state.title)}</div>`:''}<div class="meta"><div><b>Class:</b> ${esc(state.className||'—')}</div><div><b>Subject:</b> ${esc(state.subject||'—')}</div><div><b>Time:</b> ${esc(state.duration||'—')}</div><div><b>Full Marks:</b> ${target||used||'—'}</div></div>${check}${sections||'<div class="empty">No sections have been added yet.</div>'}<div class="foot">Draft preview generated from VKVTT · ${used} marks currently allocated</div></main></body></html>`;
  }
  function preview(){
    const state=read();
    if(!(state.sections||[]).length){alert('Add at least one section before previewing the paper.');return}
    const w=window.open('','_blank');
    if(!w){alert('Please allow pop-ups for VKVTT to open the paper preview.');return}
    w.document.open();w.document.write(paperHtml(state));w.document.close();
  }
  function attach(){
    const panel=document.getElementById('paperBuilder');
    if(!panel||document.getElementById('pbPreview'))return false;
    const actions=panel.querySelector('.actions');if(!actions)return false;
    const b=document.createElement('button');b.id='pbPreview';b.textContent='👁 Preview / Print Paper';b.title='Open a formatted local preview. No question data is uploaded.';b.onclick=preview;actions.appendChild(b);
    const note=document.createElement('div');note.className='small';note.style.marginTop='6px';note.textContent='Preview/Print reads only this device’s local draft and does not publish or change Question Bank records.';actions.after(note);
    return true;
  }
  const timer=setInterval(()=>{if(attach())clearInterval(timer)},350);setTimeout(()=>{clearInterval(timer);attach()},10000);
})();
