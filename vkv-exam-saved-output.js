(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function matrixData(){
    const table=$('printableMatrixHost')?.querySelector('table');
    if(!table)return null;
    const heads=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
    const classes=heads.slice(2);
    const rows=[...table.querySelectorAll('tbody tr')].map(tr=>{
      const cells=[...tr.cells];
      return {date:cells[0]?.textContent.trim()||'',day:cells[1]?.textContent.trim()||'',subjects:cells.slice(2).map(td=>{
        const sel=td.querySelector('select');
        return sel?String(sel.value||'').trim():td.textContent.trim();
      })};
    });
    return classes.length&&rows.length?{classes,rows}:null;
  }
  function title(){return String($('workspaceName')?.value||'Examination Timetable').trim()||'Examination Timetable'}
  function timeText(){
    const rows=[...document.querySelectorAll('#sessionRows [data-session-row]')];
    if(rows.length!==1)return'';
    const a=rows[0].querySelector('[data-session-field="startTime"]')?.value||'';
    const b=rows[0].querySelector('[data-session-field="endTime"]')?.value||'';
    return a&&b?`${a}–${b}`:'';
  }
  function asText(m){
    const lines=['VIVEKANANDA KENDRA VIDYALAYA, NALBARI',`TIMETABLE FOR ${title().toUpperCase()}`];
    const tm=timeText(); if(tm)lines.push(`Exam Timings: ${tm}`); lines.push('');
    lines.push(['Date','Day',...m.classes].join('\t'));
    for(const r of m.rows)lines.push([r.date,r.day,...r.subjects.map(x=>x||'—')].join('\t'));
    return lines.join('\n');
  }
  function asHtml(m){
    const tm=timeText();
    return `<div class="majorPrintSheet"><h1>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h1><h2>TIMETABLE FOR ${esc(title().toUpperCase())}</h2>${tm?`<p><b>Exam Timings:</b> ${esc(tm)}</p>`:''}<table class="majorMatrix"><thead><tr><th>Date</th><th>Day</th>${m.classes.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${m.rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.day)}</td>${r.subjects.map(s=>`<td>${esc(s||'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  async function copySaved(){const m=matrixData();if(!m)return alert('Open a saved timetable first.');try{await navigator.clipboard.writeText(asText(m));alert('Saved timetable copied.')}catch{alert('Copy is not available in this browser.')}}
  async function shareSaved(){const m=matrixData();if(!m)return alert('Open a saved timetable first.');const text=asText(m);if(navigator.share){try{await navigator.share({title:'VKV Nalbari · '+title(),text});return}catch(e){if(e?.name==='AbortError')return}}try{await navigator.clipboard.writeText(text);alert('Sharing is unavailable here; the saved timetable was copied instead.')}catch{alert('Sharing is unavailable in this browser.')}}
  function printSaved(){const m=matrixData();if(!m)return alert('Open a saved timetable first.');let host=$('majorOfficialPrint');if(!host){host=document.createElement('div');host.id='majorOfficialPrint';host.style.display='none';document.body.appendChild(host)}host.innerHTML=asHtml(m);document.body.classList.add('majorExamPrint');host.style.display='block';const done=()=>{document.body.classList.remove('majorExamPrint');host.style.display='none';window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);setTimeout(()=>window.print(),50);setTimeout(done,2000)}
  document.addEventListener('click',e=>{
    const b=e.target.closest('#majorCopy,#majorShare,#majorPrint');if(!b)return;
    const m=matrixData();if(!m)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(b.id==='majorCopy')copySaved(); else if(b.id==='majorShare')shareSaved(); else printSaved();
  },true);
})();
