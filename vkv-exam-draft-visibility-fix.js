(function(){
  function restoreSavedTimetableCards(){
    const list=document.getElementById('draftList');
    if(!list)return;
    for(const card of list.querySelectorAll('.draftCard')){
      const opener=card.querySelector('[data-open-cloud],[data-revise-cloud]');
      const id=opener?.dataset.openCloud||opener?.dataset.reviseCloud||'';
      if(id && !/^TEMPLATE_/i.test(id)) card.classList.remove('majorHide');
    }
  }

  function bind(){
    const list=document.getElementById('draftList');
    if(!list)return false;
    restoreSavedTimetableCards();
    const observer=new MutationObserver(restoreSavedTimetableCards);
    observer.observe(list,{childList:true,subtree:true});
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-pane-target="outputs"],[data-save-template-cloud]'))setTimeout(restoreSavedTimetableCards,100);
    });
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    if(bind()||++tries>40)clearInterval(timer);
  },200);
})();
