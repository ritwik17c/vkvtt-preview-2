// VKVTT Question Bank — local dictation/text review helper
// Progressive enhancement only: no network/Firestore access; teacher explicitly applies every change.
(()=>{
  const FRAME='iframe[name="qbframe"]';
  const trimLines=s=>String(s||'').split('\n').map(x=>x.replace(/[\t ]{2,}/g,' ').replace(/[ \t]+$/,'')).join('\n').trim();
  function spacing(s){return trimLines(s).replace(/[ \t]+([,;:?!])/g,'$1').replace(/([,;:?!])([A-Za-z])/g,'$1 $2')}
  function capitaliseStart(s){return String(s||'').replace(/^([\s\"'“‘(\[]*)([a-z])/,(_,a,b)=>a+b.toUpperCase())}
  function spokenPunctuation(s){return String(s||'')
    .replace(/\s+question mark(?=\s|$)/gi,'?')
    .replace(/\s+full stop(?=\s|$)/gi,'.')
    .replace(/\s+comma(?=\s|$)/gi,',')
    .replace(/\s+colon(?=\s|$)/gi,':')
    .replace(/\s+semicolon(?=\s|$)/gi,';')
    .replace(/\s+exclamation mark(?=\s|$)/gi,'!');}
  function attach(frame){
    let doc;try{doc=frame.contentDocument}catch(_){return}
    const q=doc?.getElementById('qt');if(!q||doc.getElementById('qbDictationReview'))return;
    const lang=doc.getElementById('speechLang');
    const box=doc.createElement('div');box.id='qbDictationReview';box.className='tip';box.style.marginTop='8px';
    box.innerHTML='<b>✍️ Review dictated/typed text</b><div id="qbReviewMsg" style="margin:5px 0">Nothing is changed automatically. Review suggestions before applying them.</div><div class="actions"><button type="button" id="qbReviewText">Review text</button><button type="button" id="qbApplyCleanup" style="display:none">Apply safe cleanup</button><button type="button" id="qbApplySpoken" style="display:none">Convert spoken punctuation</button><button type="button" id="qbUndoReview" style="display:none">↶ Undo review change</button></div><div id="qbReviewDetails" style="margin-top:6px"></div>';
    const speechStatus=doc.getElementById('speechStatus');(speechStatus||q).insertAdjacentElement('afterend',box);
    const msg=box.querySelector('#qbReviewMsg'),details=box.querySelector('#qbReviewDetails'),apply=box.querySelector('#qbApplyCleanup'),spoken=box.querySelector('#qbApplySpoken'),undo=box.querySelector('#qbUndoReview');
    let before='';
    function analyse(){
      const raw=q.value,english=!lang||String(lang.value||'').toLowerCase().startsWith('en');let suggested=spacing(raw);if(english)suggested=capitaliseStart(suggested);
      const changes=[];
      if(trimLines(raw)!==raw)changes.push('extra spaces / line-edge spaces');
      if(spacing(raw)!==trimLines(raw))changes.push('spacing around punctuation');
      if(english&&capitaliseStart(spacing(raw))!==spacing(raw))changes.push('capital letter at the beginning');
      const hasSpoken=english&&/\b(question mark|full stop|comma|colon|semicolon|exclamation mark)\b/i.test(raw);
      const terminal=String(suggested).trim();const noEnd=english&&terminal&&!/[.?!…][\"'”’)]?$/.test(terminal);
      apply.style.display=changes.length?'inline-block':'none';spoken.style.display=hasSpoken?'inline-block':'none';
      msg.textContent=changes.length?changes.length+' safe formatting suggestion'+(changes.length===1?'':'s')+' found.':'No safe formatting change is currently suggested.';
      details.innerHTML=(changes.length?'<div><b>Suggested:</b> '+changes.join(' · ')+'</div>':'')+(hasSpoken?'<div>Spoken punctuation words detected. Convert them only if they were intended as punctuation.</div>':'')+(noEnd?'<div>Check the ending punctuation before submission; no punctuation is added automatically.</div>':'');
      return suggested;
    }
    box.querySelector('#qbReviewText').onclick=analyse;
    apply.onclick=()=>{const next=analyse();if(next===q.value)return;before=q.value;q.value=next;q.dispatchEvent(new Event('input',{bubbles:true}));undo.style.display='inline-block';msg.textContent='Safe cleanup applied. Please read the question once before submission.';analyse()};
    spoken.onclick=()=>{const next=spokenPunctuation(q.value);if(next===q.value)return;before=q.value;q.value=next;q.dispatchEvent(new Event('input',{bubbles:true}));undo.style.display='inline-block';msg.textContent='Spoken punctuation converted. Please verify the wording.';analyse()};
    undo.onclick=()=>{if(before==='')return;q.value=before;before='';q.dispatchEvent(new Event('input',{bubbles:true}));undo.style.display='none';msg.textContent='Review change undone.';analyse()};
    q.addEventListener('input',()=>{clearTimeout(q.__qbReviewTimer);q.__qbReviewTimer=setTimeout(analyse,650)});lang?.addEventListener('change',analyse);
  }
  function boot(){const f=document.querySelector(FRAME);if(!f)return;f.addEventListener('load',()=>setTimeout(()=>attach(f),300));setTimeout(()=>attach(f),800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();