// VKVTT QB Paper Builder — safe subquestion marks drafting helper
// Progressive enhancement only. Stores optional part marks in localStorage; no Firestore/schema changes.
(function(){
  const STORAGE='vkvtt.qb.paperSubquestionMarks.v1';
  let data={};
  try{data=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch(_){data={}}
  const save=()=>localStorage.setItem(STORAGE,JSON.stringify(data));
  const key=t=>'q:'+String(t.dataset.q||'');
  function parts(t){return String(t.value||'').split('\n').filter(x=>/^\s*\([a-z]\)\s+/i.test(x))}
  function enhance(){
    const panel=document.getElementById('paperBuilder');if(!panel)return;
    panel.querySelectorAll('textarea[data-q]').forEach(t=>{
      const box=t.nextElementSibling;if(!box||!box.querySelector?.('[data-subq-status]'))return;
      let host=box.querySelector('[data-subq-marks]');
      if(!host){host=document.createElement('span');host.dataset.subqMarks='1';host.className='small';box.appendChild(host)}
      const refresh=()=>{
        const ps=parts(t),k=key(t),vals=Array.isArray(data[k])?data[k]:[];
        if(!ps.length){host.innerHTML='';return}
        host.innerHTML=' · Part marks: '+ps.map((_,i)=>`<label style="display:inline-flex;align-items:center;gap:2px;margin:0 3px">(${String.fromCharCode(97+i)}) <input data-pm="${i}" type="number" min="0" step="0.5" value="${vals[i]!==undefined&&vals[i]!==null&&vals[i]!==''?Number(vals[i]):''}" style="width:58px;padding:4px 6px"></label>`).join('')+' <b data-pmt></b><span data-pmcheck style="margin-left:6px"></span>';
        const total=()=>{
          const inputs=[...host.querySelectorAll('[data-pm]')],entered=inputs.filter(e=>e.value!==''),xs=inputs.map(e=>e.value===''?'':Number(e.value)||0),sum=entered.reduce((a,e)=>a+(Number(e.value)||0),0),allEntered=entered.length===inputs.length,anyEntered=entered.length>0;
          host.querySelector('[data-pmt]').textContent=anyEntered?`= ${sum} marks`:'';data[k]=xs;save();
          const check=host.querySelector('[data-pmcheck]'),markInput=panel.querySelector(`[data-m="${t.dataset.q}"]`),parent=Number(markInput?.value)||0;
          if(!anyEntered||!markInput){check.innerHTML='';return}
          if(!allEntered){check.innerHTML=`<span style="color:#8a5b13;font-weight:700">⚠ ${entered.length}/${inputs.length} part marks entered</span>`;return}
          if(Math.abs(parent-sum)<0.001){check.innerHTML='<span style="color:#2f6b3b;font-weight:700">✓ matches question marks</span>';return}
          check.innerHTML=`<span style="color:#8a5b13;font-weight:700">⚠ Part total ${sum} ≠ question ${parent}</span> <button type="button" data-use-part-total style="padding:3px 7px;margin-left:4px">Use ${sum}</button>`;
          const use=check.querySelector('[data-use-part-total]');if(use)use.onclick=()=>{markInput.value=String(sum);markInput.dispatchEvent(new Event('input',{bubbles:true}))};
        };
        host.querySelectorAll('[data-pm]').forEach(e=>e.oninput=total);total();
      };
      if(t.dataset.subqMarksEnhanced!=='1'){t.dataset.subqMarksEnhanced='1';t.addEventListener('input',refresh)}
      refresh();
    });
  }
  window.addEventListener('vkv-qb-paper-rendered',enhance);
  window.addEventListener('vkv-qb-paper-ready',enhance);
  const timer=setInterval(enhance,600);setTimeout(()=>clearInterval(timer),10000);
})();
