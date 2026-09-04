(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const norm=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
  const storeKey=()=>`vkvExamCustomSubjects:${String($('workspaceName')?.value||'new-exam').trim().toLowerCase()}`;
  function read(){try{return JSON.parse(localStorage.getItem(storeKey())||'{}')||{}}catch{return{}}}
  function write(x){try{localStorage.setItem(storeKey(),JSON.stringify(x))}catch{}}
  function addOptionsToQuickEdit(){
    const data=read();
    for(const sel of document.querySelectorAll('[data-template-pattern-subject][data-template-pattern-class]')){
      const cls=base(sel.dataset.templatePatternClass),items=data[cls]||[];
      for(const s of items){
        if([...sel.options].some(o=>norm(o.value)===norm(s)))continue;
        const o=document.createElement('option');o.value=s;o.textContent=s+' (exam-only)';sel.appendChild(o)
      }
    }
  }
  function render(){
    const grid=$('majorSubjectGrid');if(!grid)return false;
    const data=read();
    for(const group of grid.querySelectorAll('.majorGroup')){
      const h=group.querySelector('h4');if(!h)continue;
      const cls=base(h.textContent),subjectGrid=group.querySelector('.majorGrid');
      let box=group.querySelector('[data-exam-subject-add-box]');
      if(!box){
        box=document.createElement('div');box.dataset.examSubjectAddBox=cls;
        box.style.cssText='margin-top:10px;padding:10px;border:1px dashed #9bbdca;border-radius:10px;background:#f7fbfc';
        box.innerHTML=`<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><label style="flex:1;min-width:220px;margin:0"><small><b>Add exam-only subject for ${esc(cls)}</b></small><input data-exam-subject-input="${esc(cls)}" placeholder="e.g. Science or Social Science"></label><button class="button" data-add-exam-subject="${esc(cls)}">+ Add Subject</button></div><small style="display:block;margin-top:6px;color:#567383">Added exam-only subjects remain selected. For IX/X, Science and Social Science are treated as combined examination subjects; untick component timetable subjects only when they are not separately examined.</small>`;
        group.appendChild(box)
      }
      for(const old of group.querySelectorAll('[data-exam-only-card]'))old.remove();
      for(const s of data[cls]||[]){
        if(!subjectGrid)continue;
        const label=document.createElement('label');label.className='majorCard';label.dataset.examOnlyCard=s;
        label.innerHTML=`<input type="checkbox" checked data-exam-only-subject="${esc(s)}" data-exam-only-class="${esc(cls)}"><span><b>${esc(s)}</b><br><small>Exam-only subject</small></span>`;
        subjectGrid.prepend(label)
      }
    }
    addOptionsToQuickEdit();
    document.dispatchEvent(new CustomEvent('vkv-exam-custom-subjects-rendered'));
    return true
  }
  function scheduleRender(delay=60){setTimeout(render,delay)}
  function addSubject(cls,name){
    const data=read(),items=data[cls]||[];
    if(!items.some(x=>norm(x)===norm(name)))items.push(name);
    data[cls]=items;write(data);render();
    document.dispatchEvent(new CustomEvent('vkv-exam-custom-subjects-changed',{detail:{className:cls,subject:name,selected:true}}))
  }
  document.addEventListener('click',e=>{
    const add=e.target.closest('[data-add-exam-subject]');
    if(add){
      const cls=base(add.dataset.addExamSubject),input=document.querySelector(`[data-exam-subject-input="${CSS.escape(cls)}"]`),name=String(input?.value||'').trim();
      if(!name)return;if(input)input.value='';addSubject(cls,name);return
    }
    if(e.target.closest('[data-pane-target="subjects"],[data-real-use-template],#majorLoadTemplate'))scheduleRender(250)
  },true);
  document.addEventListener('change',e=>{
    const custom=e.target.closest?.('[data-exam-only-subject]');
    if(custom){
      const cls=base(custom.dataset.examOnlyClass),name=String(custom.dataset.examOnlySubject||''),data=read();
      if(custom.checked){if(!(data[cls]||[]).some(x=>norm(x)===norm(name)))(data[cls]||(data[cls]=[])).push(name)}
      else data[cls]=(data[cls]||[]).filter(x=>norm(x)!==norm(name));
      write(data);scheduleRender(20);
      document.dispatchEvent(new CustomEvent('vkv-exam-custom-subjects-changed',{detail:{className:cls,subject:name,selected:custom.checked}}));return
    }
    if(e.target.matches?.('[data-major-subject]')){scheduleRender(80);return}
    if(e.target.id==='workspaceName')scheduleRender(80)
  },true);
  window.addEventListener('load',()=>{let n=0,t=setInterval(()=>{if(render()||++n>40)clearInterval(t)},200)});
  window.vkvExamCustomSubjects={read,addSubject,render};
})();