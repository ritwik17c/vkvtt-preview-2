(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  async function refreshAfterImport(){
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
        return;
      }
      await wait(100);
    }
  }

  window.addEventListener('click',e=>{
    const direct=e.target.closest?.('[data-real-use-template]');
    if(direct){refreshAfterImport();return}

    const load=e.target.closest?.('#majorLoadTemplate');
    if(!load)return;
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    const id=String($('majorTemplateSelect')?.value||'').trim();
    if(!id){alert('Select a saved template first.');return}

    const open=()=>document.querySelector(`[data-real-use-template="${CSS.escape(id)}"]`);
    let button=open();
    if(button){button.click();refreshAfterImport();return}

    document.querySelector('[data-pane-target="outputs"]')?.click();
    $('refreshSavedExamData')?.click();
    let tries=0;
    const timer=setInterval(()=>{
      button=open();
      if(button){clearInterval(timer);button.click();refreshAfterImport();return}
      if(++tries>=30){clearInterval(timer);alert('The selected saved template could not be opened from the cloud template list. Please refresh and try again.')}
    },100);
  },true);
})();
