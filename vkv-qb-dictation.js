/* VKVTT Question Bank dictation + quick submission helper. */
(()=>{'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(){
 const ta=$('qText'); if(!ta||document.getElementById('qbDictationBar')) return !!ta;
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 const wrap=document.createElement('div');wrap.id='qbDictationBar';wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:7px 0 9px';
 wrap.innerHTML=`<button type="button" id="qbMicBtn" title="Dictate question">🎙 Dictate Question</button><button type="button" id="qbStopMic" style="display:none">■ Stop</button><select id="qbSpeechLang" title="Dictation language" style="width:auto;min-width:145px"><option value="en-IN">English (India)</option><option value="as-IN">Assamese</option><option value="hi-IN">Hindi</option><option value="bn-IN">Bengali</option></select><span id="qbSpeechState" class="small">${SR?'Ready for dictation':'Speech recognition is not supported in this browser.'}</span>`;
 ta.parentNode.insertBefore(wrap,ta);
 const mic=$('qbMicBtn'),stop=$('qbStopMic'),state=$('qbSpeechState'),lang=$('qbSpeechLang');
 if(!SR){mic.disabled=true}else{
 let rec=null,base='',interim='';
 const cleanJoin=(a,b)=>{a=String(a||'');b=String(b||'').trim();return b?a+(a&&!/\s$/.test(a)?' ':'')+b:a};
 mic.onclick=()=>{try{base=ta.value;interim='';rec=new SR();rec.lang=lang.value;rec.continuous=true;rec.interimResults=true;rec.onstart=()=>{state.textContent='Listening… speak naturally.';mic.disabled=true;stop.style.display='inline-block'};rec.onresult=e=>{let f='',tmp='';for(let i=e.resultIndex;i<e.results.length;i++){const s=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)f+=s+' ';else tmp+=s}if(f){base=cleanJoin(base,f);interim=''}else interim=tmp;ta.value=cleanJoin(base,interim);ta.dispatchEvent(new Event('input',{bubbles:true}))};rec.onerror=e=>{state.textContent=e.error==='not-allowed'?'Microphone permission was not allowed. Please allow microphone access and try again.':'Dictation error: '+e.error};rec.onend=()=>{if(interim){base=cleanJoin(base,interim);ta.value=base;interim=''}state.textContent='Dictation stopped. Please review the text before submitting.';mic.disabled=false;stop.style.display='none';rec=null};rec.start()}catch(e){state.textContent='Could not start dictation: '+(e.message||e);mic.disabled=false;stop.style.display='none'}};
 stop.onclick=()=>{if(rec)try{rec.stop()}catch(_){}};
 }
 const improve=document.createElement('div');improve.id='qbImproveBar';improve.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:-2px 0 10px';improve.innerHTML='<span class="small" style="align-self:center">After dictation:</span><button type="button" data-qb-clean="all">✨ Review safe fixes</button><button type="button" data-qb-clean="punct">✓ Tidy punctuation</button><button type="button" data-qb-clean="capital">Aa Capitalise start</button><button type="button" data-qb-clean="trim">✂ Clean spacing</button><button type="button" id="qbUndoCorrection" style="display:none">↶ Undo last change</button><span class="small">Suggestions are previewed and never applied or submitted automatically.</span>';wrap.parentNode.insertBefore(improve,ta.nextSibling);
 const preview=document.createElement('div');preview.id='qbCorrectionPreview';preview.style.display='none';improve.insertAdjacentElement('afterend',preview);
 const attention=document.createElement('div');attention.id='qbTextAttention';attention.className='tip';attention.style.cssText='display:none;margin-top:7px';preview.insertAdjacentElement('afterend',attention);
 const undoCorrection=$('qbUndoCorrection'),capitalBtn=improve.querySelector('[data-qb-clean="capital"]');let proposed='',undoValue='',appliedValue='';
 const isEnglish=()=>!lang||String(lang.value||'').toLowerCase().startsWith('en');
 const clearEnglishQuestion=s=>/^(who|what|when|where|why|how|which|whose|whom|is|are|am|was|were|do|does|did|can|could|will|would|shall|should|may|might|has|have|had)\b/i.test(String(s||'').trim());
 const cleanSpacing=s=>String(s||'').replace(/[ \t]+/g,' ').replace(/\s+([,.?!:;])/g,'$1').trim();
 let repeatedWordRe;try{repeatedWordRe=new RegExp('(?:^|\\s)([\\p{L}\\p{M}][\\p{L}\\p{M}\'’\\-]*)\\s+\\1(?=$|\\s|[.,!?;:।])','iu')}catch(_){repeatedWordRe=/\b([A-Za-z][A-Za-z'-]{1,})\s+\1\b/i}
 function syncLanguageHelp(){const en=isEnglish();if(capitalBtn){capitalBtn.disabled=!en;capitalBtn.title=en?'Preview English sentence-start capitalisation.':'Capitalisation inference is disabled for Assamese, Hindi and Bengali.'}}
 function suggest(kind){let v=ta.value;if(kind==='trim')v=cleanSpacing(v);if(kind==='capital'){v=v.trim();if(isEnglish()&&v)v=v[0].toUpperCase()+v.slice(1)}if(kind==='punct'||kind==='all'){v=cleanSpacing(v);if(isEnglish()){if(v)v=v[0].toUpperCase()+v.slice(1);if(v&&!/[.?!]$/.test(v))v+=clearEnglishQuestion(v)?'?':'.'}}return v}
 function closePreview(){preview.style.display='none';preview.innerHTML='';proposed=''}
 function scanAttention(){
  const text=String(ta.value||''),notes=[];
  const dup=text.match(repeatedWordRe);
  const punct=text.match(/(?:\?\?|!!|,,|;;|::)/);
  if(dup){const word=dup[1];if(word)notes.push('Possible repeated word: “'+word+' '+word+'”')}
  if(punct)notes.push('Repeated punctuation found: “'+punct[0]+'”');
  if(!notes.length){attention.style.display='none';attention.innerHTML='';return}
  attention.style.display='block';attention.innerHTML='<b>👀 Please review before submission</b><div class="small" style="margin-top:4px">'+notes.map(esc).join(' · ')+'</div><div class="small" style="margin-top:3px">These are warning-only checks. Nothing is changed automatically.</div>';
 }
 improve.onclick=e=>{const b=e.target.closest('[data-qb-clean]');if(!b)return;const current=ta.value,next=suggest(b.dataset.qbClean);if(next===current){preview.className='tip';preview.style.display='block';preview.innerHTML='<b>No change suggested.</b> The question already matches this cleanup.';proposed='';return}proposed=next;preview.className='tip';preview.style.display='block';preview.innerHTML=`<b>Review suggested wording change</b><div class="small" style="margin-top:5px">Current</div><div style="padding:7px 9px;background:#fff;border:1px solid #dbe6eb;border-radius:8px">${esc(current)||'<i>(blank)</i>'}</div><div class="small" style="margin-top:7px">Suggested</div><div style="padding:7px 9px;background:#fff;border:1px solid #dbe6eb;border-radius:8px">${esc(next)||'<i>(blank)</i>'}</div><div class="actions" style="margin-top:8px"><button type="button" id="qbApplyCorrection" class="primary">Apply Suggestion</button><button type="button" id="qbCancelCorrection">Keep Original</button></div>`;$('qbApplyCorrection').onclick=()=>{undoValue=ta.value;appliedValue=proposed;ta.value=proposed;ta.dispatchEvent(new Event('input',{bubbles:true}));undoCorrection.style.display='inline-block';ta.focus();closePreview()};$('qbCancelCorrection').onclick=()=>{ta.focus();closePreview()}};
 undoCorrection.onclick=()=>{if(!undoValue||ta.value!==appliedValue){undoValue='';appliedValue='';undoCorrection.style.display='none';return}const old=undoValue;undoValue='';appliedValue='';ta.value=old;ta.dispatchEvent(new Event('input',{bubbles:true}));undoCorrection.style.display='none';ta.focus();closePreview()};
 ta.addEventListener('input',()=>{if(undoValue&&ta.value!==appliedValue){undoValue='';appliedValue='';undoCorrection.style.display='none'}clearTimeout(ta.__qbAttentionTimer);ta.__qbAttentionTimer=setTimeout(scanAttention,450)});lang?.addEventListener('change',()=>{syncLanguageHelp();closePreview()});syncLanguageHelp();scanAttention();
 // Submission cues: drafts remain permissive; submitted questions require the academic minimum.
 const req=['qClass','qSubject','qMarks','qType','qText'];req.forEach(id=>{const e=$(id),lab=e?.previousElementSibling;if(lab?.tagName==='LABEL'&&!lab.dataset.required){lab.dataset.required='1';lab.insertAdjacentHTML('beforeend',' <span title="Required for submission" style="color:#a32626;font-weight:900">*</span>')}});
 const submit=$('submitQ');if(submit&&!submit.dataset.checked){submit.dataset.checked='1';submit.addEventListener('click',e=>{const p=[];if(!$('qClass')?.value)p.push('Class');if(!$('qSubject')?.value)p.push('Subject');if(!ta.value.trim())p.push('Question');if(!(Number($('qMarks')?.value)>0))p.push('Marks greater than 0');if(!$('qType')?.value)p.push('Question Type');if(p.length){e.preventDefault();e.stopImmediatePropagation();$('editorMsg').innerHTML='<div class="warning"><b>Please complete:</b> '+p.join(', ')+'.</div>'}},true)}
 return true;
}
let n=0;const t=setInterval(()=>{if(install()||++n>40)clearInterval(t)},250);window.addEventListener('load',install);
})();