(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  function clean(){
    const meta=$('masterMeta');
    if(meta&&meta.textContent!=='Read-only source')meta.textContent='Read-only source';
  }

  function romanValue(value){
    const raw=String(value||'').trim().toUpperCase().replace(/^CLASS\s*/,'');
    if(!/^[IVXLCDM]+$/.test(raw))return null;
    const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let total=0,prev=0;
    for(let i=raw.length-1;i>=0;i--){const n=map[raw[i]]||0;if(n<prev)total-=n;else{total+=n;prev=n}}
    return total||null;
  }

  function classRank(value){
    const raw=String(value||'').trim().toUpperCase().replace(/^CLASS\s*/,'').replace(/\s+/g,'');
    const b=raw.match(/^B(?:ALVATIKA)?[-_ ]?([123])$/i);if(b)return Number(b[1]);
    const rv=romanValue(raw);if(rv!=null)return 3+rv;
    return null;
  }

  function classCompare(a,b){
    const av=classRank(a),bv=classRank(b);
    if(av!=null&&bv!=null)return av-bv;
    if(av!=null)return -1;if(bv!=null)return 1;
    return String(a||'').localeCompare(String(b||''),undefined,{numeric:true,sensitivity:'base'});
  }

  function reorderChildren(host,getName){
    if(!host)return;
    const items=[...host.children];if(items.length<2)return;
    const sorted=[...items].sort((a,b)=>classCompare(getName(a),getName(b)));
    if(sorted.every((node,i)=>node===items[i]))return;
    for(const node of sorted)host.appendChild(node);
  }

  function reorderSelect(select){
    if(!select)return;
    const fixed=[...select.options].filter(o=>!o.value),movable=[...select.options].filter(o=>o.value);
    const sorted=[...movable].sort((a,b)=>classCompare(a.value||a.textContent,b.value||b.textContent));
    if(sorted.every((o,i)=>o===movable[i]))return;
    for(const o of [...fixed,...sorted])select.appendChild(o);
  }

  function reorderClassColumns(table){
    const head=table?.tHead?.rows?.[0];if(!head||head.cells.length<4)return;
    const fixedCount=2,headers=[...head.cells].slice(fixedCount);
    const order=headers.map((cell,index)=>({index,name:(cell.textContent||'').replace(/^Class[-\s]*/i,'').trim()})).sort((a,b)=>classCompare(a.name,b.name));
    if(order.every((x,i)=>x.index===i))return;
    const rows=[head,...(table.tBodies?.[0]?.rows||[])];
    for(const row of rows){
      const cells=[...row.cells],fixed=cells.slice(0,fixedCount),rest=cells.slice(fixedCount);
      if(rest.length!==headers.length)continue;
      for(const cell of fixed)row.appendChild(cell);
      for(const x of order)row.appendChild(rest[x.index]);
    }
  }

  function enforceClassOrder(){
    reorderChildren($('majorClassGrid'),node=>node.querySelector('[data-major-class]')?.dataset.majorClass||node.textContent);
    reorderChildren($('majorSubjectGrid'),node=>node.querySelector('h4')?.textContent||node.textContent);
    reorderChildren($('examSubjectMasterGrid'),node=>node.dataset.subjectMasterClass||node.querySelector('h3')?.textContent||node.textContent);
    reorderSelect($('paperClassFilter'));
    for(const table of document.querySelectorAll('#printableMatrixHost table.majorMatrix,#majorFormattedPreview table.majorMatrix,#majorOfficialPrint table.majorMatrix'))reorderClassColumns(table);
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
        enforceClassOrder();
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

  let orderTimer=null;
  function scheduleOrder(delay=40){if(orderTimer)clearTimeout(orderTimer);orderTimer=setTimeout(()=>{orderTimer=null;enforceClassOrder()},delay)}

  window.vkvExamClassCompare=classCompare;
  window.addEventListener('load',()=>{clean();enforceClassOrder();setTimeout(()=>{clean();enforceClassOrder()},250);setTimeout(()=>{clean();enforceClassOrder()},900)});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-pane-target],[data-open-cloud],[data-real-open],[data-revise-cloud],[data-real-use-template],#generateTimetable,#refreshPrintableMatrix')){
      scheduleOrder(80);setTimeout(enforceClassOrder,350);
    }
    if(e.target.closest('[data-pane-target="setup"],[data-open-cloud],[data-real-open],[data-revise-cloud]')){
      setTimeout(clean,80);setTimeout(clean,350);
    }
    const load=e.target.closest('#majorLoadTemplate');
    if(load){
      e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
      routeLegacyTemplateLoad();
    }
  },true);
  document.addEventListener('vkv-exam-workspace-subjects-applied',()=>{clean();scheduleOrder(80)});
  document.addEventListener('vkv-exam-subject-master-applied',()=>{clean();scheduleOrder(80)});
  const root=$('examApp')||document.body;
  new MutationObserver(()=>{clean();scheduleOrder(30)}).observe(root,{childList:true,subtree:true});
})();