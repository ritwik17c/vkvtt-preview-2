(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function matrixData(){
    const table=$('printableMatrixHost')?.querySelector('table');
    if(!table)return null;
    const heads=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
    const classes=heads.slice(2);
    const rows=[...table.querySelectorAll('tbody tr')].map(tr=>{const cells=[...tr.cells];return{date:cells[0]?.textContent.trim()||'',day:cells[1]?.textContent.trim()||'',subjects:cells.slice(2).map(td=>td.querySelector('select')?String(td.querySelector('select').value||'').trim():td.textContent.trim())}});
    return classes.length&&rows.length?{classes,rows}:null;
  }
  function title(){return String($('workspaceName')?.value||'Examination Timetable').trim()||'Examination Timetable'}
  function storageKey(){return 'vkvExamFooter:'+title().toLowerCase()}
  function to12h(v){if(!v)return'';const [h0,m='00']=v.split(':'),h=Number(h0);if(Number.isNaN(h))return v;return `${h%12||12}:${m} ${h>=12?'pm':'am'}`}
  function addMinutes(v,min){if(!v)return'';const [h,m]=v.split(':').map(Number);if(Number.isNaN(h)||Number.isNaN(m))return'';const total=(h*60+m+min)%(24*60);return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
  function timeText(){const rows=[...document.querySelectorAll('#sessionRows [data-session-row]')];if(rows.length!==1)return'';const a=rows[0].querySelector('[data-session-field="startTime"]')?.value||'',b=rows[0].querySelector('[data-session-field="endTime"]')?.value||'';return a&&b?`${to12h(a)}–${to12h(b)}`:''}
  function examEnd(){const rows=[...document.querySelectorAll('#sessionRows [data-session-row]')];if(rows.length!==1)return'';return rows[0].querySelector('[data-session-field="endTime"]')?.value||''}
  function footerValues(){
    const end=examEnd();
    return{reporting:$('examFooterReporting')?.value||'',bus:$('examFooterBus')?.value||'',departure:addMinutes(end,10)};
  }
  function persistFooter(){try{localStorage.setItem(storageKey(),JSON.stringify({reporting:$('examFooterReporting')?.value||'',bus:$('examFooterBus')?.value||''}))}catch{}updateDeparture()}
  function restoreFooter(){let x={};try{x=JSON.parse(localStorage.getItem(storageKey())||'{}')||{}}catch{}if($('examFooterReporting'))$('examFooterReporting').value=x.reporting||'';if($('examFooterBus'))$('examFooterBus').value=x.bus||'';updateDeparture()}
  function updateDeparture(){const v=footerValues().departure;if($('examFooterDeparture'))$('examFooterDeparture').textContent=v?to12h(v):'—'}
  function ensureFooterUi(){
    const box=$('majorTimetableActions');if(!box||$('examFooterSettings'))return !!box;
    const d=document.createElement('div');d.id='examFooterSettings';d.style.cssText='margin:14px 0;padding:14px;border:1px solid #cfdfe6;border-radius:12px;background:#f8fcfd';
    d.innerHTML='<h4 style="margin:0 0 10px">Printable Timetable Footer</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px"><label>Reporting Time<input id="examFooterReporting" type="time"></label><label>Bus Picking Time (1st stoppage)<input id="examFooterBus" type="time"></label><label>Departure Time <small>(automatic: 10 min after exam)</small><div id="examFooterDeparture" style="padding:10px 0;font-weight:700">—</div></label></div><div style="margin-top:10px;color:#486577"><b>Signature placeholders:</b> Exam Dept. · Principal</div>';
    const actions=box.querySelector('.buttonRow');box.insertBefore(d,actions||box.firstChild);$('examFooterReporting')?.addEventListener('change',persistFooter);$('examFooterBus')?.addEventListener('change',persistFooter);restoreFooter();return true;
  }
  function footerText(){const f=footerValues(),lines=[];if(f.reporting)lines.push(`Reporting Time: ${to12h(f.reporting)}`);const timing=[];if(f.bus)timing.push(`Bus Timings: Picking Time: ${to12h(f.bus)} (1st stoppage)`);if(f.departure)timing.push(`Departure Time: ${to12h(f.departure)}`);if(timing.length)lines.push(timing.join('    '));lines.push('','Exam Dept. ____________________                         Principal ____________________');return lines.join('\n')}
  function footerHtml(){const f=footerValues();return `<div style="margin-top:22px;font-size:11pt"><div style="margin-bottom:12px"><b>Reporting Time:</b> ${esc(f.reporting?to12h(f.reporting):'________')}</div><div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:34px"><div><b>Bus Timings:</b> Picking Time: ${esc(f.bus?to12h(f.bus):'________')} (1st stoppage)</div><div><b>Departure Time:</b> ${esc(f.departure?to12h(f.departure):'________')}</div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:end;gap:20px;min-height:95px"><div><b>Exam Dept.</b><div style="height:55px;border-bottom:1px solid #777"></div></div><div style="text-align:center;color:#777">School Seal / Stamp</div><div><b>Principal</b><div style="height:55px;border-bottom:1px solid #777"></div></div></div></div>`}
  function asText(m){const lines=['VIVEKANANDA KENDRA VIDYALAYA, NALBARI',`TIMETABLE FOR ${title().toUpperCase()}`],tm=timeText();if(tm)lines.push(`Exam Timings: ${tm}`);lines.push('', ['Date','Day',...m.classes].join('\t'));for(const r of m.rows)lines.push([r.date,r.day,...r.subjects.map(x=>x||'—')].join('\t'));lines.push('',footerText());return lines.join('\n')}
  function asHtml(m){const tm=timeText();return `<div class="majorPrintSheet"><h1>VIVEKANANDA KENDRA VIDYALAYA, NALBARI</h1><h2>TIMETABLE FOR ${esc(title().toUpperCase())}</h2>${tm?`<p><b>Exam Timings:</b> ${esc(tm)}</p>`:''}<table class="majorMatrix"><thead><tr><th>Date</th><th>Day</th>${m.classes.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${m.rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.day)}</td>${r.subjects.map(s=>`<td>${esc(s||'—')}</td>`).join('')}</tr>`).join('')}</tbody></table>${footerHtml()}</div>`}
  async function copySaved(){const m=matrixData();if(!m)return alert('Open a saved timetable first.');persistFooter();try{await navigator.clipboard.writeText(asText(m));alert('Saved timetable copied.')}catch{alert('Copy is not available in this browser.')}}
  async function shareSaved(){const m=matrixData();if(!m)return alert('Open a saved timetable first.');persistFooter();const text=asText(m);if(navigator.share){try{await navigator.share({title:'VKV Nalbari · '+title(),text});return}catch(e){if(e?.name==='AbortError')return}}try{await navigator.clipboard.writeText(text);alert('Sharing is unavailable here; the saved timetable was copied instead.')}catch{alert('Sharing is unavailable in this browser.')}}
  function printSaved(){const m=matrixData();if(!m)return alert('Open a saved timetable first.');persistFooter();let host=$('majorOfficialPrint');if(!host){host=document.createElement('div');host.id='majorOfficialPrint';host.style.display='none';document.body.appendChild(host)}host.innerHTML=asHtml(m);document.body.classList.add('majorExamPrint');host.style.display='block';const done=()=>{document.body.classList.remove('majorExamPrint');host.style.display='none';window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);setTimeout(()=>window.print(),50);setTimeout(done,2000)}
  function replaceAndBind(id,handler){const old=$(id);if(!old||old.dataset.savedOutputBound==='1')return !!old;const fresh=old.cloneNode(true);fresh.dataset.savedOutputBound='1';old.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();handler()});return true}
  function bind(){ensureFooterUi();const a=replaceAndBind('majorCopy',copySaved),b=replaceAndBind('majorShare',shareSaved),c=replaceAndBind('majorPrint',printSaved);return a&&b&&c}
  let tries=0,t=setInterval(()=>{if(bind()||++tries>60)clearInterval(t)},200);window.addEventListener('load',()=>setTimeout(bind,700));document.addEventListener('click',e=>{if(e.target.closest('[data-pane-target="timetable"],[data-open-cloud],[data-revise-cloud]'))setTimeout(()=>{bind();restoreFooter()},350)},true);
})();
