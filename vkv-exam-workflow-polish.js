(()=>{
  const $=id=>document.getElementById(id);
  const host=()=>$('setupSavedWorkspaceHost');
  const source=()=>$('draftList');
  let items=[];

  function cleanImportedSource(){
    const meta=$('masterMeta');
    if(meta){meta.textContent='';meta.style.display='none'}
  }

  function placeTemplateBox(){
    const h=host(),box=$('majorTemplateBox');
    if(!h||!box)return;
    const savedCard=h.closest('article.surface');
    if(savedCard&&savedCard.nextElementSibling!==box)savedCard.insertAdjacentElement('afterend',box);
    const title=box.querySelector('h3'),p=box.querySelector('.sectionTitle p');
    if(title)title.textContent='Use Saved Examination Template';
    if(p)p.textContent='Reuse the classes and subjects of a previous examination. Dates are not carried forward, so you can set the new examination window afresh.';
    const msg=$('majorTemplateMsg');
    if(msg&&!/Select a saved template/i.test(msg.textContent||''))msg.innerHTML='Select a saved template and choose <b>Load Template</b>. It restores the saved class and subject choices only; dates remain for the new examination.';
  }

  function scan(){
    const root=source();if(!root)return[];
    return [...root.querySelectorAll('.draftCard')].map((card,index)=>{
      const open=card.querySelector('[data-open-cloud]'),revise=card.querySelector('[data-revise-cloud]');
      return{index,name:card.querySelector('h4')?.textContent.trim()||'Untitled Examination Schedule',status:card.querySelector('.workflowPill')?.textContent.trim()||'Draft',meta:card.querySelector('p:nth-of-type(1)')?.textContent.trim()||'',openId:open?.dataset.openCloud||'',reviseId:revise?.dataset.reviseCloud||''};
    });
  }

  function render(){
    const h=host();if(!h)return;items=scan();
    if(!items.length){h.innerHTML='<div class="notice info">No saved examination timetable yet. Start a fresh timetable from the current master timetable and save it to make it available here.</div>';placeTemplateBox();cleanImportedSource();return}
    h.innerHTML=`<div class="formGrid two" style="align-items:end"><label>Select saved timetable<select id="savedExamWorkspaceSelect">${items.map((x,i)=>`<option value="${i}">${x.name} · ${x.status}</option>`).join('')}</select></label><div class="buttonRow" style="margin:0"><button id="savedExamOpen" class="button primary">Open / Edit</button><button id="savedExamRevise" class="button">Start Revision</button><button id="savedExamNew" class="button">Start Fresh from Master</button></div></div><div id="savedExamMeta" class="notice info" style="margin-top:10px"></div>`;
    updateActions();
    $('savedExamWorkspaceSelect')?.addEventListener('change',updateActions);
    $('savedExamOpen')?.addEventListener('click',()=>trigger('open'));
    $('savedExamRevise')?.addEventListener('click',()=>trigger('revise'));
    $('savedExamNew')?.addEventListener('click',()=>{$('newDraft')?.click()});
    placeTemplateBox();cleanImportedSource();
  }

  function current(){const i=Number($('savedExamWorkspaceSelect')?.value||0);return items[i]||null}
  function updateActions(){const x=current(),open=$('savedExamOpen'),revise=$('savedExamRevise'),meta=$('savedExamMeta');if(!x)return;if(open)open.disabled=!x.openId;if(revise)revise.disabled=!x.reviseId;if(meta)meta.innerHTML=`<b>${x.name}</b> · ${x.status}${x.meta?`<br>${x.meta}`:''}<br><small><b>Open / Edit</b> continues the same saved timetable. <b>Start Fresh from Master</b> creates a completely new examination workspace from the currently activated school timetable.</small>`}
  function trigger(kind){const x=current();if(!x)return;const id=kind==='revise'?x.reviseId:x.openId;if(!id)return;const selector=kind==='revise'?`#draftList [data-revise-cloud="${CSS.escape(id)}"]`:`#draftList [data-open-cloud="${CSS.escape(id)}"]`;document.querySelector(selector)?.click()}
  function boot(){const src=source(),h=host();if(!src||!h)return false;render();new MutationObserver(()=>render()).observe(src,{childList:true,subtree:true});new MutationObserver(()=>{placeTemplateBox();cleanImportedSource()}).observe(document.body,{childList:true,subtree:true});return true}
  let tries=0;const timer=setInterval(()=>{cleanImportedSource();placeTemplateBox();if(boot()||++tries>30)clearInterval(timer)},300);
})();
