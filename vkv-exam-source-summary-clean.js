(()=>{
  'use strict';
  function clean(){
    const meta=document.getElementById('masterMeta');
    if(meta)meta.textContent='Read-only source';
    const stats=document.getElementById('masterStats');
    if(stats){
      for(const chip of stats.querySelectorAll('.chip')){
        if(/\bteachers\b/i.test(chip.textContent||''))chip.textContent='40 teachers';
      }
    }
  }
  window.addEventListener('load',()=>{clean();setTimeout(clean,250);setTimeout(clean,900)});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-pane-target="setup"],[data-open-cloud],[data-real-open],[data-revise-cloud]')){
      setTimeout(clean,80);setTimeout(clean,350);
    }
  },true);
})();
