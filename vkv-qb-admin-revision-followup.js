// Read-only Principal follow-up context derived from the already rendered Verified Contribution rows.
// No Firestore access: this module only summarizes counts already present in the page.
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readRows(){
    const list=document.getElementById('verifiedContributionList');if(!list)return[];
    return [...list.querySelectorAll('.leader')].map(card=>{
      const name=(card.querySelector('.grow > b')?.textContent||'').trim();
      const text=card.querySelector('.small')?.textContent||'';
      const m=text.match(/Returned for revision:\s*(\d+)/i);
      return{name,returned:m?Number(m[1]):0};
    }).filter(x=>x.name&&x.returned>0).sort((a,b)=>b.returned-a.returned||a.name.localeCompare(b.name));
  }
  function render(){
    const summary=document.getElementById('verifiedContributionSummary'),list=document.getElementById('verifiedContributionList');
    if(!summary||!list)return;
    let box=document.getElementById('qbRevisionFollowup');
    if(!box){box=document.createElement('div');box.id='qbRevisionFollowup';box.className='tip';box.style.margin='8px 0 12px';summary.insertAdjacentElement('afterend',box)}
    const rows=readRows();
    if(!rows.length){box.style.display='none';box.innerHTML='';return}
    const top=rows.slice(0,5),total=rows.reduce((n,x)=>n+x.returned,0),extra=rows.length-top.length;
    box.style.display='block';
    box.innerHTML=`<b>Revision follow-up</b><div class="small" style="margin-top:4px"><b>${rows.length}</b> contributor${rows.length===1?' currently has':'s currently have'} <b>${total}</b> returned question${total===1?'':'s'} awaiting correction/resubmission in this view. Highest current queues: ${top.map(x=>`${esc(x.name)} — ${x.returned}`).join(' · ')}${extra?` · +${extra} more`:''}. This is a coordination follow-up aid, not a performance ranking.</div>`;
  }
  function start(){
    const ready=()=>{const list=document.getElementById('verifiedContributionList');if(!list)return false;new MutationObserver(render).observe(list,{childList:true,subtree:true,characterData:true});render();return true};
    if(ready())return;let tries=0;const timer=setInterval(()=>{if(ready()||++tries>=40)clearInterval(timer)},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
