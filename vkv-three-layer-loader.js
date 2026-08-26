/* VKVTT Preview 2 — PHASE 1 ONLY: Common staff section. Sections 2 and 3 deliberately untouched until Phase 1 approval. */
(()=>{'use strict';
const LABELS=[
 'My Attendance','My Leave & Duty Leave','Teacher Wise','Class Wise','Day Wise','Free Teachers',
 "Today's Leave / Duty / Assignment Summary","Today’s Leave / Duty / Assignment Summary",
 "Today's Finalised Proxy Allotment","Today’s Finalised Proxy Allotment","Today's Proxy Allotment","Today’s Proxy Allotment",
 'Period Timings','Annual Calendar'
];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase().replace(/[’]/g,"'");
const wanted=new Set(LABELS.map(norm));
function css(){if(document.getElementById('vkv-phase1-css'))return;const s=document.createElement('style');s.id='vkv-phase1-css';s.textContent=`
#vkvCommonSection{margin:14px 0 20px}.vkvCommonHeading{font-size:1.13rem;font-weight:900;color:#17364f;margin:8px 0 10px}.vkvCommonSub{font-size:.88rem;color:#617384;margin:-5px 0 11px}.vkvCommonGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.vkvCommonGrid>.card,.vkvCommonGrid>button,.vkvCommonGrid>a{margin:0!important;width:auto!important;max-width:none!important}.vkvCommonUtility{min-height:74px;text-align:left;padding:14px;border:1px solid #cbdce5;border-radius:15px;background:#fff;color:#17364f;font:inherit;font-weight:800;cursor:pointer}.vkvCommonPanel{display:none;margin-top:10px;padding:14px;background:#fff;border:1px solid #cbdce5;border-radius:14px}.vkvCommonNotice{padding:10px 12px;margin:8px 0;border:1px solid #d9e4ea;border-radius:11px;background:#f8fafb}.vkvCommonNotice.important{border-left:5px solid #c58a18}`;document.head.appendChild(s)}
function rootCard(el){let x=el;while(x&&x.parentElement&&x.parentElement!==document.body){if(x.matches('button,a,.card,.tile,.navBtn,.opCard,.myAreaCard'))return x;if(x.parentElement.matches?.('#myAreaGrid,.nav,.opsGrid,.grid,.cards'))return x;x=x.parentElement}return el}
function exactElement(label){const n=norm(label),all=[...document.querySelectorAll('button,a,.card,.tile,.navBtn,.opCard,.myAreaCard,[role="button"]')];return all.find(e=>norm(e.textContent)===n)||all.find(e=>norm(e.textContent).startsWith(n+' '))||null}
function ensure(){css();let sec=document.getElementById('vkvCommonSection');if(!sec){sec=document.createElement('section');sec.id='vkvCommonSection';sec.innerHTML='<div class="vkvCommonHeading">My Area · Common to All Staff</div><div class="vkvCommonSub">Personal and school-wide information available irrespective of staff category or delegated responsibility.</div><div id="vkvCommonGrid" class="vkvCommonGrid"></div><div id="vkvCommonPanel" class="vkvCommonPanel"></div>';const anchor=document.getElementById('myAreaGrid')||document.querySelector('.nav')||document.querySelector('.opsGrid');if(anchor)anchor.before(sec);else{const main=document.querySelector('main,.wrap,.container')||document.body;main.appendChild(sec)}}return sec}
function utility(grid,id,label,handler){if(document.getElementById(id))return;const b=document.createElement('button');b.id=id;b.className='vkvCommonUtility';b.textContent=label;b.onclick=handler;grid.appendChild(b)}
function phase1(){const sec=ensure(),grid=document.getElementById('vkvCommonGrid'),panel=document.getElementById('vkvCommonPanel');if(!grid)return;
 // Move the EXISTING functional cards into the common section. Moving preserves their listeners and data behaviour.
 LABELS.forEach(l=>{const e=exactElement(l);if(e&&!sec.contains(e)){const card=rootCard(e);if(card&&!sec.contains(card))grid.appendChild(card)}});
 // Notice is common. Use the existing notice button if present; otherwise provide a common entry point without changing backend data.
 let notice=exactElement('Staff Notices')||exactElement('Notice')||exactElement('Important Notice');if(notice&&!sec.contains(notice)){grid.prepend(rootCard(notice))}
 // Active Schedule is a common top information block. Do not duplicate it; ensure any existing active-schedule block is not hidden by role CSS.
 [...document.querySelectorAll('[id*="activeSchedule" i],[class*="activeSchedule" i]')].forEach(e=>e.style.removeProperty('display'));
 // Period Timings and Annual Calendar must exist in Common even when older shell has no dedicated card.
 utility(grid,'vkvCommonPeriodTimings','🕐 Period Timings',()=>{const opts=[...document.querySelectorAll('#freePeriod option,select[id*="period" i] option')].map(o=>String(o.textContent||'').trim()).filter((x,i,a)=>x&&!/^select/i.test(x)&&a.indexOf(x)===i);panel.innerHTML='<b>Period Timings</b>'+(opts.length?opts.map(x=>'<div class="vkvCommonNotice">'+x.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>').join(''):'<div class="vkvCommonNotice">Period timings are available from the active school schedule.</div>');panel.style.display='block'});
 utility(grid,'vkvCommonCalendar','🗓 Annual Calendar',()=>location.href='annual-calendar-2026-27.html?v=66.0');
 // Common cards must never be suppressed by teaching/non-teaching role styling.
 [...grid.children].forEach(e=>e.style.setProperty('display','','important'));
}
let runs=0;const tick=()=>{phase1();if(++runs<50)setTimeout(tick,250)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();new MutationObserver(()=>phase1()).observe(document.documentElement,{childList:true,subtree:true});
})();