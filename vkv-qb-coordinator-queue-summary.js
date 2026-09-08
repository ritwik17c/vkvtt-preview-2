// Read-only Coordinator Inbox helper: copies an aggregate workload summary and shows live ageing focus.
// No Firestore/network access, no question text or teacher identity is copied, and no workflow state is changed.
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

  function waitingAge(card){
    const text=norm(card.textContent);
    if(/Submitted today/i.test(text))return 0;
    const m=text.match(/Waiting\s+(\d+)\s+day/i);
    return m?Number(m[1]):null;
  }

  function snapshot(){
    const cards=[...document.querySelectorAll('#list .q')];
    const buckets={today:0,within2:0,three7:0,over7:0,unknown:0};
    const knownAges=[];
    cards.forEach(card=>{
      const n=waitingAge(card);
      if(n==null)buckets.unknown++;
      else{
        knownAges.push(n);
        if(n===0)buckets.today++;
        else if(n<=2)buckets.within2++;
        else if(n<=7)buckets.three7++;
        else buckets.over7++;
      }
    });

    const status=norm($('status')?.textContent);
    const loadedMatch=status.match(/(\d+)\s+pending question\(s\) shown\s*[·•]\s*(\d+)\s+loaded/i);
    const totalLoaded=loadedMatch?Number(loadedMatch[2]):cards.length;
    const subject=$('subjectFilter');
    const order=$('sortOrder');
    const search=norm($('search')?.value);

    return {
      visible:cards.length,
      totalLoaded,
      buckets,
      oldest:knownAges.length?Math.max(...knownAges):null,
      subject:norm(subject?.selectedOptions?.[0]?.textContent)||'All assigned subjects',
      order:norm(order?.selectedOptions?.[0]?.textContent)||'Current order',
      searchActive:Boolean(search)
    };
  }

  function priorityText(s){
    const b=s.buckets;
    if(b.over7)return `Review priority: ${b.over7} question${b.over7===1?'':'s'} waiting over 7 days first${b.three7?`, then ${b.three7} waiting 3–7 days`:''}.`;
    if(b.three7)return `Review priority: ${b.three7} question${b.three7===1?'':'s'} waiting 3–7 days first.`;
    if(b.unknown)return 'Review priority: no older known-age queue; check age-unavailable records when practical.';
    return 'Review priority: no older waiting questions in the current view.';
  }

  function summaryText(){
    const s=snapshot(),b=s.buckets;
    return [
      'VKVTT Question Bank — Coordinator Inbox',
      `Current view: ${s.visible} of ${s.totalLoaded} loaded pending question(s)`,
      `Ageing in current view: ${b.today} today · ${b.within2} within 2 days · ${b.three7} 3–7 days · ${b.over7} over 7 days${b.unknown?` · ${b.unknown} age unavailable`:''}`,
      `Oldest visible wait: ${s.oldest==null?'age unavailable':s.oldest===0?'submitted today':s.oldest+' day'+(s.oldest===1?'':'s')}`,
      priorityText(s),
      `Subject view: ${s.subject}`,
      `Order: ${s.order}${s.searchActive?' · Search/filter text active':''}`,
      'Operational workload summary only; no verification decision or question record is changed.'
    ].join('\n');
  }

  async function copyText(text){
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return;
    }
    const area=document.createElement('textarea');
    area.value=text;area.setAttribute('readonly','');area.style.cssText='position:fixed;left:-9999px;top:0';
    document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();
    if(!ok)throw Error('Clipboard unavailable');
  }

  function setMessage(text){
    const el=$('qbQueueSummaryMsg');if(!el)return;
    el.textContent=text;
    clearTimeout(setMessage.timer);
    setMessage.timer=setTimeout(()=>{if(el)el.textContent=''},2600);
  }

  function refresh(){
    const s=snapshot(),btn=$('qbCopyQueueSummary'),focus=$('qbQueueAgeFocus');
    if(btn)btn.textContent=`Copy Queue Summary (${s.visible})`;
    if(!focus)return;
    if(!s.visible){focus.textContent='Ageing focus will appear here after pending questions are loaded.';return}
    const old=s.buckets.over7;
    const oldest=s.oldest==null?'oldest age unavailable':s.oldest===0?'all known visible questions were submitted today':`oldest visible wait ${s.oldest} day${s.oldest===1?'':'s'}`;
    focus.innerHTML=`<b>Ageing focus:</b> ${old?`<b>${old}</b> waiting over 7 days · `:''}${oldest}. <b>${priorityText(s)}</b>${s.buckets.unknown?` ${s.buckets.unknown} visible question${s.buckets.unknown===1?' has':'s have'} no usable age.`:''} <span style="font-weight:400">Current filtered view only; priority guidance does not change verification order or status.</span>`;
  }

  function install(){
    const work=$('work'),load=$('load');if(!work||!load)return;
    const actions=load.closest('.actions');if(!actions)return;
    if(!$('qbCopyQueueSummary')){
      const btn=document.createElement('button');
      btn.id='qbCopyQueueSummary';btn.type='button';btn.title='Copies counts and ageing only — not question text or teacher names';
      btn.addEventListener('click',async()=>{
        try{await copyText(summaryText());setMessage('Queue summary copied.')}catch(e){setMessage('Could not copy the summary on this browser.')}
      });
      const msg=document.createElement('span');msg.id='qbQueueSummaryMsg';msg.className='small';msg.setAttribute('aria-live','polite');
      actions.append(btn,msg);
    }
    if(!$('qbQueueAgeFocus')){
      const focus=document.createElement('div');focus.id='qbQueueAgeFocus';focus.className='small';focus.style.marginTop='7px';focus.setAttribute('role','status');focus.setAttribute('aria-live','polite');
      actions.insertAdjacentElement('afterend',focus);
    }
    const list=$('list');
    if(list&&!list.dataset.qbQueueSummaryObserved){
      list.dataset.qbQueueSummaryObserved='1';
      new MutationObserver(refresh).observe(list,{childList:true,subtree:true});
    }
    ['subjectFilter','sortOrder','search'].forEach(id=>$(id)?.addEventListener(id==='search'?'input':'change',refresh));
    refresh();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
