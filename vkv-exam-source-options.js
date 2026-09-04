(function(){
  const $=id=>document.getElementById(id);
  const VERSION='source-options-3';

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function ensureSourceOptions(){
    const setup=document.querySelector('[data-pane="setup"]');
    if(!setup)return false;
    let box=$('examSourceOptions');
    if(!box||box.dataset.version!==VERSION){
      if(box)box.remove();
      box=document.createElement('article');
      box.id='examSourceOptions';
      box.dataset.version=VERSION;
      box.className='surface';
      box.innerHTML=`
        <div class="sectionTitle">
          <div>
            <h3>Choose How to Continue</h3>
            <p>Keep saved timetables and reusable templates clearly separate.</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">
          <div style="padding:16px;border:1px solid #cfdfe6;border-radius:14px;background:#fbfefd">
            <div class="eyebrow">Option 1</div>
            <h4 style="margin:6px 0 8px">Edit a Saved Timetable</h4>
            <p style="margin:0 0 12px;color:#486577">Open an existing saved cloud timetable. Saving changes will update that saved timetable.</p>
            <button id="examEditSavedOption" class="button primary">Choose Saved Timetable</button>
          </div>
          <div style="padding:16px;border:1px solid #cfdfe6;border-radius:14px;background:#fbfefd">
            <div class="eyebrow">Option 2</div>
            <h4 style="margin:6px 0 8px">Use a Saved Template for a New Timetable</h4>
            <p style="margin:0 0 12px;color:#486577">Start a fresh unsaved timetable, then load a reusable class-and-subject template. Your saved timetable is not changed.</p>
            <button id="examUseTemplateOption" class="button primary">Start New from Template</button>
          </div>
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
    }
    return true;
  }

  function ensureTemplateSaveAction(){
    const box=$('majorTemplateBox'),save=$('majorSaveTemplate');
    if(!box||!save)return false;
    save.textContent='Save Current Timetable as Template';
    save.title='Save the current class and subject selection as a reusable template. Dates and the saved timetable are not changed.';
    let note=$('saveCurrentAsTemplateNote');
    if(!note){
      note=document.createElement('div');
      note.id='saveCurrentAsTemplateNote';
      note.className='notice info';
      note.style.marginTop='12px';
      note.innerHTML='<b>Safe template copy:</b> When a saved timetable is open, use <b>Save Current Timetable as Template</b>. Only its selected classes and subjects are copied to the template; the saved timetable and its dates remain unchanged.';
      box.appendChild(note);
    }
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    const a=ensureSourceOptions(),b=ensureTemplateSaveAction();
    if((a&&b)||++attempts>40)clearInterval(timer);
  },200);
  window.addEventListener('load',()=>setTimeout(()=>{ensureSourceOptions();ensureTemplateSaveAction()},500));

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-cloud]'))setTimeout(()=>{
      document.querySelector('[data-pane-target="setup"]')?.click();
      ensureTemplateSaveAction();
      $('majorTemplateBox')?.scrollIntoView({behavior:'smooth',block:'center'});
    },260);
  },true);
})();
