/* VKVTT QB submission-readiness progressive enhancement.
   UI-only: marks roadmap-required fields and gives live, non-blocking readiness feedback.
   No Firestore reads/writes and no submission logic changes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const fields=[
  {id:'qClass',name:'Class'},
  {id:'qSubject',name:'Subject'},
  {id:'qMarks',name:'Marks'},
  {id:'qType',name:'Question Type'},
  {id:'qText',name:'Question'}
];
function valueOk(id){const el=$(id);if(!el)return true;const v=String(el.value??'').trim();if(id==='qMarks'){const n=Number(v);return v!==''&&Number.isFinite(n)&&n>0}return v!==''}
function markLabels(){for(const f of fields){const el=$(f.id);if(!el)continue;const label=el.closest('div')?.querySelector(':scope > label')||el.previousElementSibling;if(label&&label.tagName==='LABEL'&&!label.dataset.qbRequired){label.dataset.qbRequired='1';label.innerHTML=label.innerHTML+' <span aria-hidden="true" style="color:#a52f2f;font-weight:900">*</span>';label.title='Required for submission'}}}
function install(){const panel=$('add'),msg=$('editorMsg'),submit=$('submitQ');if(!panel||!msg||!submit||$('qbSubmissionReadiness'))return false;markLabels();const box=document.createElement('div');box.id='qbSubmissionReadiness';box.className='tip';box.style.cssText='margin-top:10px;padding:9px 11px';box.setAttribute('role','status');box.setAttribute('aria-live','polite');msg.parentNode.insertBefore(box,msg);
function refresh(){markLabels();const missing=fields.filter(f=>!valueOk(f.id));const complete=fields.length-missing.length,pct=Math.round(complete/fields.length*100);box.setAttribute('data-complete',String(complete));if(!missing.length){box.style.background='#e7f6ea';box.style.borderColor='#b8ddc0';box.style.color='#245c34';box.innerHTML='<b>✓ Ready to submit</b> <span class="small">5/5 required fields complete. Please review the question before submitting.</span>';return}box.style.background='#fff7df';box.style.borderColor='#e5cd8c';box.style.color='#745917';box.innerHTML='<b>'+complete+'/5 required fields complete ('+pct+'%).</b> <span class="small">Still needed: '+missing.map(f=>f.name).join(', ')+'. You can continue editing or save a draft.</span>'}
function focusFirstMissing(){const f=fields.find(x=>!valueOk(x.id)),el=f&&$(f.id);if(el){el.focus();try{el.scrollIntoView({behavior:'smooth',block:'center'})}catch(_){el.scrollIntoView()}}}
for(const f of fields){const el=$(f.id);if(el){el.setAttribute('aria-required','true');el.addEventListener('input',refresh);el.addEventListener('change',refresh)}}
submit.addEventListener('click',()=>{refresh();if(fields.some(f=>!valueOk(f.id)))setTimeout(focusFirstMissing,0)},true);
new MutationObserver(()=>{markLabels();refresh()}).observe(panel,{childList:true,subtree:true});refresh();return true}
let tries=0,t=setInterval(()=>{if(install()||++tries>40)clearInterval(t)},250);window.addEventListener('load',install);
})();
