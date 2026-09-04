(()=>{
  const $=id=>document.getElementById(id);
  const host=()=>$('setupSavedWorkspaceHost');
  const source=()=>$('draftList');
  let items=[];
  function scan(){
    const root=source();if(!root)return[];
    return [...root.querySelectorAll('.draftCard')].map((card,index)=>{
      const open=card.querySelector('[data-open-cloud]'),revise=card.querySelector('[data-revise-cloud]');
      return{index,name:card.querySelector('h4')?.textContent.trim()||'Untitled Examination Schedule',status:card.querySelector('.workflowPill')?.textContent.trim()||'Draft',meta:card.querySelector('p:nth-of-type(1)')?.textContent.trim()||'',openId:open?.dataset.openCloud||'',reviseId:revise?.dataset.reviseCloud||''};
    });
  }
  function render(){
    const h=host();if(!h)return;items=scan();
    if(!items.length){h.innerHTML='<div class="notice info">No saved examination timetable yet. Start a new timetable below and save it to make it available here.</div>';return}
    h.innerHTML=`<div class="formGrid two" style="align-items:end"><label>Select saved timetable<select id="savedExamWorkspaceSelect">${items.map((x,i)=>`<option value="${i}">${x.name} · ${x.status}</option>`).join('')}</select></label><div class="buttonRow" style="margin:0"><button id="savedExamOpen" class="button primary">Open / Edit</button><button id="savedExamRevise" class="button">Start Revision</button><button id="savedExamNew" class="button">New from Master</button></div></div><div id="savedExamMeta" class="notice info" style="margin-top:10px"></div>`;
    updateActions();
    $('savedExamWorkspaceSelect')?.addEventListener('change',updateActions);
    $('savedExamOpen')?.addEventListener('click',()=>trigger('open'));
    $('savedExamRevise')?.addEventListener('click',()=>trigger('revise'));
    $('savedExamNew')?.addEventListener('click',()=>{$('newDraft')?.click()});
  }
  function current(){const i=Number($('savedExamWorkspaceSelect')?.value||0);return items[i]||null}
  function updateActions(){const x=current(),open=$('savedExamOpen'),revise=$('savedExamRevise'),meta=$('savedExamMeta');if(!x)return;if(open)open.disabled=!x.openId;if(revise)revise.disabled=!x.reviseId;if(meta)meta.innerHTML=`<b>${x.name}</b> · ${x.status}${x.meta?`<br>${x.meta}`:''}<br><small>Open/Edit keeps you in the normal examination workflow; saved class, subject and timetable choices are loaded from the cloud workspace.</small>`}
  function trigger(kind){const x=current();if(!x)return;const id=kind==='revise'?x.reviseId:x.openId;if(!id)return;const selector=kind==='revise'?`#draftList [data-revise-cloud="${CSS.escape(id)}"]`:`#draftList [data-open-cloud="${CSS.escape(id)}"]`;document.querySelector(selector)?.click()}
  function boot(){const src=source(),h=host();if(!src||!h)return false;render();new MutationObserver(()=>render()).observe(src,{childList:true,subtree:true});return true}
  let tries=0;const timer=setInterval(()=>{if(boot()||++tries>30)clearInterval(timer)},300);
})();
