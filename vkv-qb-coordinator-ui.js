// Read-only UI enhancement for the Subject Coordinator review queue, plus local feedback composer.
(function(){
  'use strict';
  let selected='all';
  const DAY=86400000;
  function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function parseDate(card){
    const t=card.textContent||'';
    let m=t.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
    if(m){const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));if(!Number.isNaN(d.getTime()))return d}
    m=t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));if(!Number.isNaN(d.getTime()))return d}
    return null;
  }
  function ageDays(card){const d=parseDate(card);if(!d)return null;return Math.max(0,Math.floor((startOfDay(new Date())-startOfDay(d))/DAY))}
  function bucket(card){const a=ageDays(card);if(a==null)return'unknown';if(a===0)return'today';if(a<=2)return'0-2';if(a<=7)return'3-7';return'8plus'}
  function enhance(){
    const panel=document.getElementById('review');
    const list=document.getElementById('reviewList');
    if(!panel||!list)return;
    if(!document.getElementById('qbReviewTools')){
      const box=document.createElement('div');
      box.id='qbReviewTools';box.className='tip';box.style.margin='10px 0';
      box.innerHTML='<b>Coordinator Inbox</b><div class="small" style="margin-top:4px">Check correctness, wording, marks, difficulty, learning outcome and answer or marking scheme before accepting. Age filters help older pending questions receive attention first. When returning a question, use the guided feedback composer so the teacher receives a clear correction request.</div><div class="actions" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" data-rf="all" class="primary">All Pending</button><button type="button" data-rf="today">Today</button><button type="button" data-rf="0-2">0–2 days</button><button type="button" data-rf="3-7">3–7 days</button><button type="button" data-rf="8plus">&gt;7 days</button><input id="qbReviewSearch" placeholder="Search question, class, subject or teacher" style="max-width:390px"><span id="qbReviewCount" class="badge"></span></div><div id="qbReviewAgeSummary" class="small" style="margin-top:7px"></div>';
      panel.querySelector('h2')?.insertAdjacentElement('afterend',box);
      box.querySelector('#qbReviewSearch')?.addEventListener('input',filter);
      box.addEventListener('click',e=>{const b=e.target.closest('[data-rf]');if(!b)return;selected=b.dataset.rf;box.querySelectorAll('[data-rf]').forEach(x=>x.classList.toggle('primary',x===b));filter()});
    }
    list.querySelectorAll('.qcard').forEach(card=>{
      card.querySelectorAll('.badge').forEach(b=>{if((b.textContent||'').trim()==='submitted')b.textContent='Unverified · Awaiting Verification'});
      card.dataset.qbAgeBucket=bucket(card);
      const actions=card.querySelector('.actions');
      if(actions&&!actions.querySelector('.qbChecklist')){const note=document.createElement('span');note.className='small qbChecklist';note.textContent='Accept only after academic verification.';actions.appendChild(note)}
      if(!card.querySelector('.qbAgeBadge')){const a=ageDays(card);if(a!=null){const tag=document.createElement('span');tag.className='badge qbAgeBadge';tag.textContent=a===0?'Submitted today':a===1?'Pending 1 day':`Pending ${a} days`;if(a>7){tag.style.background='#fdeaea';tag.style.color='#8b2d2d'}else if(a>=3){tag.style.background='#fff4d6';tag.style.color='#755710'}card.querySelector('.qtext')?.insertAdjacentElement('afterend',tag)}}
    });
    filter();
  }
  function filter(){
    const list=document.getElementById('reviewList');if(!list)return;
    const term=(document.getElementById('qbReviewSearch')?.value||'').trim().toLowerCase();let shown=0,total=0;
    const counts={today:0,'0-2':0,'3-7':0,'8plus':0,unknown:0};
    list.querySelectorAll('.qcard').forEach(card=>{total++;const b=card.dataset.qbAgeBucket||bucket(card);counts[b]=(counts[b]||0)+1;const textOk=!term||(card.textContent||'').toLowerCase().includes(term),ageOk=selected==='all'||b===selected,ok=textOk&&ageOk;card.style.display=ok?'':'none';if(ok)shown++});
    const count=document.getElementById('qbReviewCount');if(count)count.textContent=shown+' of '+total+' pending';
    const summary=document.getElementById('qbReviewAgeSummary');if(summary)summary.textContent=`Ageing: ${counts.today} today · ${counts['0-2']} within 2 days · ${counts['3-7']} 3–7 days · ${counts['8plus']} over 7 days${counts.unknown?` · ${counts.unknown} date unavailable`:''}`;
  }
  const feedbackTemplates=[
    ['Wording / clarity','Please revise the wording for greater clarity and precision.'],
    ['Answer / marking scheme','Please review the expected answer or marking scheme and make it complete and consistent with the marks allotted.'],
    ['Marks / difficulty','Please review the marks or difficulty level so that they match the demand of the question.'],
    ['Learning outcome','Please review the stated learning outcome or competency so that it matches what the question actually assesses.'],
    ['Academic accuracy','Please recheck the academic accuracy of the question and answer before resubmitting.']
  ];
  window.qbGetCoordinatorReturnNote=function(){return new Promise(resolve=>{
    document.getElementById('qbFeedbackComposer')?.remove();
    const shade=document.createElement('div');shade.id='qbFeedbackComposer';shade.style.cssText='position:fixed;inset:0;background:#17364f66;z-index:9999;display:grid;place-items:center;padding:16px';
    const box=document.createElement('div');box.style.cssText='width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:18px;box-shadow:0 18px 60px #17364f44';
    box.innerHTML='<h3 style="margin:0 0 5px">Return for correction</h3><div class="small">Choose a common reason to start the note, then edit it so the teacher knows exactly what to correct. No return is recorded until you confirm.</div><div id="qbFeedbackTemplates" class="actions" style="margin-top:12px"></div><label style="margin-top:12px">Correction note to teacher</label><textarea id="qbFeedbackText" style="min-height:120px" placeholder="State the specific correction required…"></textarea><div class="actions" style="margin-top:12px"><button id="qbFeedbackCancel" type="button">Cancel</button><button id="qbFeedbackConfirm" type="button" class="primary">Return with this note</button></div><div id="qbFeedbackMsg" class="small" style="margin-top:7px"></div>';
    shade.appendChild(box);document.body.appendChild(shade);
    const area=box.querySelector('#qbFeedbackText'),templates=box.querySelector('#qbFeedbackTemplates');
    feedbackTemplates.forEach(([label,text])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{area.value=(area.value.trim()?area.value.trim()+' ':'')+text;area.focus()};templates.appendChild(b)});
    const done=v=>{shade.remove();resolve(v)};
    box.querySelector('#qbFeedbackCancel').onclick=()=>done('');shade.onclick=e=>{if(e.target===shade)done('')};
    box.querySelector('#qbFeedbackConfirm').onclick=()=>{const note=area.value.trim();if(note.length<8){box.querySelector('#qbFeedbackMsg').textContent='Please give a specific correction note before returning the question.';area.focus();return}done(note)};
    area.focus();
  })};
  function start(){const list=document.getElementById('reviewList');if(list)new MutationObserver(enhance).observe(list,{childList:true,subtree:true});enhance()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();