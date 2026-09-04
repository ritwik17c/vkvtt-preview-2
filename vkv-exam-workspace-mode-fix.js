(()=>{
  'use strict';
  const $=id=>document.getElementById(id);

  function clearTemplateWorkspace(){
    $('templatePatternQuickEdit')?.remove();
    $('templateFallbackEditor')?.remove();
    document.body.removeAttribute('data-exam-template-mode');
  }

  function templatePaperCount(){
    const panel=$('templatePatternQuickEdit')||$('templateFallbackEditor');
    if(!panel)return 0;
    const selects=[...panel.querySelectorAll('[data-template-pattern-subject],[data-fallback-subject]')];
    if(selects.length)return selects.filter(s=>String(s.value||'').trim()).length;
    const text=panel.textContent||'';
    const m=text.match(/\b(\d+)\s+(?:logical\s+examination\s+subject|imported\s+timetable\s+paper|timetable\s+paper\s+slot)/i);
    return m?Number(m[1])||0:0;
  }

  function fixMetric(){
    const n=templatePaperCount();
    if(!n)return;
    const cards=[...($('timetableMetrics')?.children||[])];
    const card=cards[1];
    if(!card)return;
    const strong=card.querySelector('strong');
    const label=card.querySelector('span');
    if(strong)strong.textContent=String(n);
    if(label)label.textContent='Selected exam subjects';
  }

  function afterTemplateUse(){
    document.body.dataset.examTemplateMode='true';
    setTimeout(fixMetric,250);
    setTimeout(fixMetric,700);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-real-use-template],#majorLoadTemplate')){
      afterTemplateUse();
      return;
    }
    if(e.target.closest('[data-real-open],[data-open-cloud],[data-revise-cloud],#newDraft')){
      clearTemplateWorkspace();
      return;
    }
    if(e.target.closest('[data-pane-target="timetable"]'))setTimeout(fixMetric,80);
  },true);

  document.addEventListener('change',e=>{
    if(e.target.closest('[data-template-pattern-subject],[data-fallback-subject]'))setTimeout(fixMetric,30);
  },true);
})();
