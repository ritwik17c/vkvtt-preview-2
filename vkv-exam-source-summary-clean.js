(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  function clean(){
    const meta=$('masterMeta');
    if(meta)meta.textContent='Read-only source';
    const stats=$('masterStats');
    if(stats){
      for(const chip of stats.querySelectorAll('.chip')){
        if(/\bteachers\b/i.test(chip.textContent||''))chip.textContent='40 teachers';
      }
    }
  }

  async function refreshImportedTimetable(){
    for(let i=0;i<60;i++){
      const panel=$('templatePatternQuickEdit');
      if(panel){
        const subjectsNav=document.querySelector('[data-pane-target="subjects"]');
        const timetableNav=document.querySelector('[data-pane-target="timetable"]');
        subjectsNav?.click();
        await wait(120);
        timetableNav?.click();
        await wait(120);
        const count=[...panel.querySelectorAll('[data-template-pattern-subject]')].filter(s=>String(s.value||'').trim()).length;
        const cards=[...($('timetableMetrics')?.children||[])];
        const strong=cards[1]?.querySelector('strong'),label=cards[1]?.querySelector('span');
        if(strong&&count)strong.textContent=String(count);
        if(label&&count)label.textContent='Imported timetable papers';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      await wait(100);
    }
  }

  async function routeLegacyTemplateLoad(){
    const id=String($('majorTemplateSelect')?.value||'').trim();
    if(!id){alert('Select a saved template first.');return}
    const find=()=>document.querySelector(`[data-real-use-template="${CSS.escape(id)}"]`);
    let button=find();
    if(button){button.click();refreshImportedTimetable();return}
    document.querySelector('[data-pane-target="outputs"]')?.click();
    $('refreshSavedExamData')?.click();
    for(let i=0;i<30;i++){
      await wait(100);button=find();
      if(button){button.click();refreshImportedTimetable();return}
    }
    alert('The selected saved template could not be opened from the saved-template list. Please refresh and try again.');
  }

  window.addEventListener('load',()=>{clean();setTimeout(clean,250);setTimeout(clean,900)});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-pane-target="setup"],[data-open-cloud],[data-real-open],[data-revise-cloud]')){
      setTimeout(clean,80);setTimeout(clean,350);
    }
    const load=e.target.closest('#majorLoadTemplate');
    if(load){
      e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
      routeLegacyTemplateLoad();
    }
  },true);
})();
