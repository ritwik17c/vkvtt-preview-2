(function(){
  const $=id=>document.getElementById(id);
  const VERSION='source-options-4';

  function ensureSourceOptions(){
    const setup=document.querySelector('[data-pane="setup"]');
    if(!setup)return false;
    let box=$('examSourceOptions');
    if(box?.dataset.version===VERSION)return true;
    if(box)box.remove();
    box=document.createElement('article');
    box.id='examSourceOptions';
    box.dataset.version=VERSION;
    box.className='surface';
    box.innerHTML=`
      <div class="sectionTitle">
        <div>
          <h3>Choose How to Continue</h3>
          <p>Saved timetables and reusable templates are kept separate.</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">
        <div style="padding:16px;border:1px solid #cfdfe6;border-radius:14px;background:#fbfefd">
          <div class="eyebrow">Option 1</div>
          <h4 style="margin:6px 0 8px">Edit a Saved Timetable</h4>
          <p style="margin:0 0 12px;color:#486577">Open an existing saved cloud timetable. Saving changes will update that timetable.</p>
          <button id="examEditSavedOption" class="button primary">Choose Saved Timetable</button>
        </div>
        <div style="padding:16px;border:1px solid #cfdfe6;border-radius:14px;background:#fbfefd">
          <div class="eyebrow">Option 2</div>
          <h4 style="margin:6px 0 8px">Use a Saved Template for a New Timetable</h4>
          <p style="margin:0 0 12px;color:#486577">Start a new timetable from a reusable class-and-subject template. Existing saved timetables remain unchanged.</p>
          <button id="examUseTemplateOption" class="button primary">Start New from Template</button>
        </div>
      </div>
      <div style="margin-top:14px;padding:16px;border:2px solid #88bfd2;border-radius:14px;background:#f5fbfd">
        <div class="eyebrow">Opened saved timetable</div>
        <h4 style="margin:6px 0 8px">Save Opened Timetable as a Reusable Template</h4>
        <p style="margin:0 0 12px;color:#486577">After opening a saved timetable, use this button to copy only its selected classes and subjects into a reusable template. Dates and the saved timetable itself are not changed.</p>
        <button id="examSaveOpenedAsTemplate" class="button primary">Save Opened Timetable as Template</button>
        <div id="examSaveOpenedTemplateMsg" class="notice info" style="margin-top:10px">Open the saved timetable first, then use this button.</div>
      </div>`;
    const workflow=$('workflowStatus');
    workflow?.insertAdjacentElement('afterend',box);

    $('examEditSavedOption')?.addEventListener('click',()=>{
      document.querySelector('[data-pane-target="outputs"]')?.click();
      setTimeout(()=>$('draftList')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
    });

    $('examUseTemplateOption')?.addEventListener('click',()=>{
      const newDraft=$('newDraft');
      if(!newDraft)return;
      newDraft.click();
      setTimeout(()=>{
        document.querySelector('[data-pane-target="setup"]')?.click();
        $('majorTemplateBox')?.scrollIntoView({behavior:'smooth',block:'center'});
        $('majorTemplateSelect')?.focus();
      },180);
    });

    $('examSaveOpenedAsTemplate')?.addEventListener('click',()=>{
      const msg=$('examSaveOpenedTemplateMsg');
      const save=$('majorSaveTemplate');
      if(!save){
        if(msg)msg.textContent='Template engine is still loading. Please wait a moment and try again.';
        return;
      }
      const name=String($('workspaceName')?.value||'').trim();
      if(!name||/^New Examination Schedule$/i.test(name)){
        if(msg)msg.innerHTML='<b>Please open the saved timetable first.</b> Then return to Exam Setup and use this button.';
        return;
      }
      if(!confirm('Save the opened timetable’s selected classes and subjects as a reusable template?\n\nDates and the saved timetable itself will remain unchanged.'))return;
      save.click();
      if(msg)msg.innerHTML='<b>Template save requested.</b> Check the Reusable Examination Template section below for the saved confirmation.';
      setTimeout(()=>$('majorTemplateBox')?.scrollIntoView({behavior:'smooth',block:'center'}),160);
    });
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    if(ensureSourceOptions()||++attempts>30)clearInterval(timer);
  },200);
  window.addEventListener('load',()=>setTimeout(ensureSourceOptions,500));
})();
