/* Preview 2 — two-axis leave colour coding: day length + leave category. Presentation only; no leave data changes. */
(()=>{'use strict';
const css=`
:root{
 --vkv-full:#7fc8f8;--vkv-half:#f6ad55;
 --vkv-vl:#4fc3b3;--vkv-el:#a78bfa;--vkv-cl:#f4d35e;--vkv-sel:#1976a8;
 --vkv-eol:#9aa7b2;--vkv-maternity:#e78fb3;--vkv-od:#71c78a;--vkv-special:#8f7bd6;--vkv-other:#b7c3cc
}
.vkvLeaveVisual{display:grid;gap:6px;margin-top:7px;max-width:460px;min-width:250px}
.vkvLeaveAxis{display:grid;grid-template-columns:88px minmax(140px,1fr);gap:8px;align-items:center}
.vkvLeaveAxisLabel{font-size:.69rem;color:#4b6474;font-weight:800;white-space:nowrap}
.vkvLeaveBar{display:flex;height:14px;border-radius:7px;overflow:hidden;background:#eef3f5;border:1px solid #bfd0da;box-shadow:inset 0 0 0 1px #ffffff88}
.vkvLeaveSeg{min-width:12px;position:relative;border-right:1px solid #ffffffcc}.vkvLeaveSeg:last-child{border-right:0}
.vkvFull{background:var(--vkv-full)}.vkvHalf{background:var(--vkv-half)}.vkvVL{background:var(--vkv-vl)}.vkvEL{background:var(--vkv-el)}.vkvCL{background:var(--vkv-cl)}.vkvSEL{background:var(--vkv-sel)}.vkvEOL{background:var(--vkv-eol)}.vkvMATERNITY{background:var(--vkv-maternity)}.vkvOD{background:var(--vkv-od)}.vkvSPECIAL{background:var(--vkv-special)}.vkvOTHER{background:var(--vkv-other)}
.vkvLegendBox{display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:10px 12px;border:1px solid #c7d9e2;border-radius:12px;background:#fff;margin:10px 0;font-size:.76rem;color:#425d6d}.vkvLegendTitle{font-weight:900;color:#17364f;margin-right:2px}.vkvLeaveDot{width:12px;height:12px;border-radius:3px;display:inline-block;margin-right:4px;vertical-align:-2px;border:1px solid #17364f22}
@media(max-width:700px){.vkvLeaveVisual{min-width:210px}.vkvLeaveAxis{grid-template-columns:80px 1fr}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const CAT={VL:'vkvVL',EL:'vkvEL',CL:'vkvCL',SEL:'vkvSEL',EOL:'vkvEOL',MATERNITY:'vkvMATERNITY',OD:'vkvOD',SPECIAL:'vkvSPECIAL'};
const colourClass=c=>CAT[String(c||'').trim().toUpperCase()]||'vkvOTHER';
function parseRow(row){
 const cells=[...row.querySelectorAll('td')],text=String(row.innerText||'').toUpperCase();
 let category='';
 for(const c of ['MATERNITY','SPECIAL','SEL','EOL','VL','EL','CL','OD']){const re=new RegExp(`(?:^|[^A-Z])${c}(?:[^A-Z]|$)`);if(re.test(text)){category=c;break}}
 if(/SPECIAL ASSIGNMENT/.test(text))category='SPECIAL';else if(/ON DUTY/.test(text))category='OD';
 let units=0;
 if(cells.length>=4){const raw=String(cells[3].innerText||'').trim().match(/-?\d+(?:\.\d+)?/);if(raw)units=Number(raw[0])}
 if(!Number.isFinite(units)||units<0)units=0;
 let full=0,half=0;
 const fullText=text.match(/FULL\s*LEAVE[^0-9]{0,10}(\d+(?:\.\d+)?)/),halfText=text.match(/HALF\s*LEAVE[^0-9]{0,10}(\d+(?:\.\d+)?)/);
 if(fullText)full=Number(fullText[1]);if(halfText)half=Number(halfText[1]);
 if(!full&&!half&&units>0){full=Math.floor(units);half=Math.round((units-full)*2)/2;if(units===0.5){full=0;half=0.5}}
 if(!full&&!half){if(/HALF\s*LEAVE/.test(text))half=.5;else if(/FULL\s*LEAVE/.test(text))full=1}
 return{full,half,units,category};
}
function visual(d){if(!d.full&&!d.half&&!d.category)return null;const box=document.createElement('div');box.className='vkvLeaveVisual';
 const day=document.createElement('div');day.className='vkvLeaveAxis';day.innerHTML='<span class="vkvLeaveAxisLabel">Day length</span><span class="vkvLeaveBar"></span>';const db=day.querySelector('.vkvLeaveBar');
 if(d.full){const s=document.createElement('span');s.className='vkvLeaveSeg vkvFull';s.style.flex=String(d.full);s.title=`Full Leave · ${d.full} unit${d.full===1?'':'s'}`;db.appendChild(s)}
 if(d.half){const s=document.createElement('span');s.className='vkvLeaveSeg vkvHalf';s.style.flex=String(d.half);s.title=`Half Leave · ${d.half} unit${d.half===1?'':'s'}`;db.appendChild(s)}
 if(!db.children.length){const s=document.createElement('span');s.className='vkvLeaveSeg vkvOTHER';s.style.flex='1';s.title='Day length not identified';db.appendChild(s)}box.appendChild(day);
 const cat=document.createElement('div');cat.className='vkvLeaveAxis';cat.innerHTML='<span class="vkvLeaveAxisLabel">Leave category</span><span class="vkvLeaveBar"></span>';const cb=cat.querySelector('.vkvLeaveBar'),cs=document.createElement('span');cs.className=`vkvLeaveSeg ${colourClass(d.category)}`;cs.style.flex='1';cs.title=d.category||'Other';cb.appendChild(cs);box.appendChild(cat);return box}
function enhanceRow(row){const old=row.querySelector(':scope .vkvLeaveVisual');if(old)old.remove();const d=parseRow(row),v=visual(d);if(!v)return;const cells=row.querySelectorAll('td');const target=cells.length?cells[Math.min(cells.length-1,2)]:row;target.appendChild(v);row.dataset.vkvLeaveColour='2'}
function enhanceCards(root=document){root.querySelectorAll('.recordCard,.pendingCard,.teacherHistoryLine,#ulfRows tbody tr,#vkvVlRows tbody tr,#vkvVlAuditRows tbody tr,#vlBulkPreview tbody tr,#recordList tbody tr').forEach(enhanceRow)}
function legend(){let d=document.getElementById('vkvLeaveColourLegend');if(d)d.remove();const ref=document.getElementById('vkvUnifiedLeaveFinder')||document.querySelector('#pendingSection')?.nextElementSibling;if(!ref)return;d=document.createElement('div');d.id='vkvLeaveColourLegend';d.className='vkvLegendBox quick-hide';d.innerHTML='<span class="vkvLegendTitle">Colour guide</span><span><i class="vkvLeaveDot vkvFull"></i>Full Leave</span><span><i class="vkvLeaveDot vkvHalf"></i>Half Leave</span><span style="opacity:.55">|</span><span><i class="vkvLeaveDot vkvVL"></i>VL</span><span><i class="vkvLeaveDot vkvEL"></i>EL</span><span><i class="vkvLeaveDot vkvCL"></i>CL</span><span><i class="vkvLeaveDot vkvSEL"></i>SEL</span><span><i class="vkvLeaveDot vkvEOL"></i>EOL</span><span><i class="vkvLeaveDot vkvOD"></i>OD</span><span><i class="vkvLeaveDot vkvSPECIAL"></i>Special Assignment</span><span><i class="vkvLeaveDot vkvMATERNITY"></i>Maternity</span>';ref.parentNode.insertBefore(d,ref)}
let t=0,tm=setInterval(()=>{if(t===0)legend();enhanceCards();if(++t>50)clearInterval(tm)},300);new MutationObserver(m=>{for(const x of m)for(const n of x.addedNodes)if(n.nodeType===1){if(n.matches?.('tr,.recordCard,.pendingCard,.teacherHistoryLine'))enhanceRow(n);enhanceCards(n)}}).observe(document.documentElement,{childList:true,subtree:true});
})();
