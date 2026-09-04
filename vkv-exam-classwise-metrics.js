(function(){
  const $=id=>document.getElementById(id);
  function countSelected(){
    const boxes=[...document.querySelectorAll('#majorSubjectGrid [data-major-subject]:checked')];
    if(boxes.length)return boxes.length;
    const seen=new Set();
    for(const tr of document.querySelectorAll('#paperRows tr[data-paper]')){
      const box=tr.querySelector('[data-paper-field="included"]');if(!box?.checked)continue;
      let cls=String(tr.cells[1]?.textContent||'').trim().replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'');
      let sub=String(tr.cells[2]?.textContent||'').trim().replace(/^IT(?:\s*[-–(]?\s*BB\s*\)?)$/i,'IT').replace(/^Maths?(?:\s*[-–(]?\s*BB\s*\)?)$/i,'Maths').replace(/^Hindi$/i,'Hindi');
      if(cls&&sub)seen.add(cls.toLowerCase()+'|'+sub.toLowerCase());
    }
    return seen.size;
  }
  function update(){
    const metrics=$('timetableMetrics');if(!metrics)return;
    const cards=[...metrics.children];if(cards.length<2)return;
    const count=countSelected();
    const strong=cards[1].querySelector('strong'),label=cards[1].querySelector('span');
    if(strong)strong.textContent=String(count);if(label)label.textContent='Selected exam subjects';
  }
  let n=0,t=setInterval(()=>{update();if(++n>80)clearInterval(t)},250);
  document.addEventListener('change',e=>{if(e.target.closest('[data-major-class],[data-major-subject],[data-paper-field="included"]'))setTimeout(update,60)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-pane-target="timetable"],[data-open-cloud],[data-revise-cloud],#generateTimetable'))setTimeout(update,250)},true);
})();
