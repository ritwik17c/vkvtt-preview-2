// VKVTT QB Paper Builder — safe subquestion drafting helper
// Progressive enhancement only. Uses existing question text fields; no schema or Firestore changes.
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function labels(n){return Array.from({length:n},(_,i)=>'('+String.fromCharCode(97+i)+') ')}
  function nextLabel(text){
    const ms=[...String(text||'').matchAll(/^\s*\(([a-z])\)\s+/gmi)];
    if(!ms.length)return '(a) ';
    const code=Math.min(122,ms[ms.length-1][1].toLowerCase().charCodeAt(0)+1);
    return '('+String.fromCharCode(code)+') ';
  }
  function insertAtCursor(t,value){
    const start=Number.isInteger(t.selectionStart)?t.selectionStart:t.value.length;
    const end=Number.isInteger(t.selectionEnd)?t.selectionEnd:start;
    const before=t.value.slice(0,start),after=t.value.slice(end);
    const prefix=before && !before.endsWith('\n')?'\n':'';
    t.value=before+prefix+value+after;
    const p=(before+prefix+value).length;t.focus();t.setSelectionRange(p,p);
    t.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function renumber(t){
    let i=0;
    const out=String(t.value||'').split('\n').map(line=>{
      if(/^\s*\([a-z]\)\s+/i.test(line)){
        const label='('+String.fromCharCode(97+Math.min(i,25))+') ';
        i++;return line.replace(/^\s*\([a-z]\)\s+/i,label);
      }
      return line;
    }).join('\n');
    if(out!==t.value){t.value=out;t.dispatchEvent(new Event('input',{bubbles:true}))}
    return i;
  }
  function enhance(){
    const panel=document.getElementById('paperBuilder');if(!panel)return;
    panel.querySelectorAll('textarea[data-q]').forEach(t=>{
      if(t.dataset.subqEnhanced==='1')return;t.dataset.subqEnhanced='1';
      const box=document.createElement('div');box.className='actions';box.style.cssText='gap:5px;margin-top:4px;align-items:center';
      box.innerHTML='<button type="button" data-subq-add title="Insert the next (a), (b), (c)… line inside this question">＋ Subquestion</button><button type="button" data-subq-two title="Insert two starter subquestion lines">(a) / (b)</button><button type="button" data-subq-renumber title="Renumber existing lettered subquestion lines in order">↻ Renumber</button><span class="small" data-subq-status></span>';
      t.insertAdjacentElement('afterend',box);
      const status=box.querySelector('[data-subq-status]');
      const refresh=()=>{const n=(String(t.value||'').match(/^\s*\([a-z]\)\s+/gmi)||[]).length;status.textContent=n?`${n} subquestion line${n===1?'':'s'} detected`:'Optional nested parts';};
      box.querySelector('[data-subq-add]').onclick=()=>{insertAtCursor(t,nextLabel(t.value));refresh()};
      box.querySelector('[data-subq-two]').onclick=()=>{if(String(t.value||'').match(/^\s*\([a-z]\)\s+/mi)){insertAtCursor(t,nextLabel(t.value));}else{insertAtCursor(t,labels(2).join('\n'));}refresh()};
      box.querySelector('[data-subq-renumber]').onclick=()=>{const n=renumber(t);status.textContent=n?`✓ Renumbered ${n} subquestion line${n===1?'':'s'}`:'No (a), (b)… lines found'};
      t.addEventListener('input',refresh);refresh();
    });
  }
  window.addEventListener('vkv-qb-paper-rendered',enhance);
  window.addEventListener('vkv-qb-paper-ready',enhance);
  const timer=setInterval(()=>{if(document.getElementById('paperBuilder'))enhance()},500);
  setTimeout(()=>clearInterval(timer),10000);
})();