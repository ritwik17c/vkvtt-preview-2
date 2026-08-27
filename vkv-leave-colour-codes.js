/* Preview 2 — Option 4 leave colours. Day length shades the whole row; category uses a strong compact ribbon marker. Presentation only. */
(()=>{'use strict';
const css=`
:root{
 --vkv-row-full:#e5f2ff;--vkv-row-half:#fff0e2;
 --vkv-vl:#0f766e;--vkv-el:#6b21a8;--vkv-cl:#d99a00;--vkv-sel:#155cb0;
 --vkv-eol:#64748b;--vkv-maternity:#c92a5d;--vkv-od:#15803d;--vkv-special:#123b63;--vkv-other:#52606d
}
/* Day length = whole row/card background. Existing table-cell backgrounds are deliberately overridden. */
tr.vkvDayFull>td{background:var(--vkv-row-full)!important}
tr.vkvDayHalf>td{background:var(--vkv-row-half)!important}
tr.vkvDayMixed>td{background:linear-gradient(90deg,var(--vkv-row-full) 0 var(--vkv-day-split,67%),var(--vkv-row-half) var(--vkv-day-split,67%) 100%)!important}
.recordCard.vkvDayFull,.pendingCard.vkvDayFull,.teacherHistoryLine.vkvDayFull{background:var(--vkv-row-full)!important}
.recordCard.vkvDayHalf,.pendingCard.vkvDayHalf,.teacherHistoryLine.vkvDayHalf{background:var(--vkv-row-half)!important}
.recordCard.vkvDayMixed,.pendingCard.vkvDayMixed,.teacherHistoryLine.vkvDayMixed{background:linear-gradient(90deg,var(--vkv-row-full) 0 var(--vkv-day-split,67%),var(--vkv-row-half) var(--vkv-day-split,67%) 100%)!important}
.vkvCategoryRibbon{display:inline-flex;align-items:center;gap:6px;margin:4px 0 0;padding:3px 8px 3px 5px;border-radius:999px;color:#fff;font-size:.69rem;font-weight:850;letter-spacing:.01em;box-shadow:0 1px 3px #17364f22;white-space:nowrap}
.vkvCategoryBall{width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid #ffffffcc;box-shadow:0 0 0 1px #17364f22}
.vkvVL{background:var(--vkv-vl)}.vkvEL{background:var(--vkv-el)}.vkvCL{background:var(--vkv-cl)}.vkvSEL{background:var(--vkv-sel)}.vkvEOL{background:var(--vkv-eol)}.vkvMATERNITY{background:var(--vkv-maternity)}.vkvOD{background:var(--vkv-od)}.vkvSPECIAL{background:var(--vkv-special)}.vkvOTHER{background:var(--vkv-other)}
.vkvLegendBox{display:flex;gap:11px;flex-wrap:wrap;align-items:center;padding:10px 12px;border:1px solid #c7d9e2;border-radius:12px;background:#fff;margin:10px 0;font-size:.76rem;color:#425d6d}.vkvLegendTitle{font-weight:900;color:#17364f;margin-right:2px}.vkvLeaveDot{width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:4px;vertical-align:-2px;border:1px solid #17364f22}.vkvFullDot{background:var(--vkv-row-full);border-color:#8bbce9}.vkvHalfDot{background:var(--vkv-row-half);border-color:#e6ad75}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const CAT={VL:'vkvVL',EL:'vkvEL',CL:'vkvCL',SEL:'vkvSEL',EOL:'vkvEOL',MATERNITY:'vkvMATERNITY',OD:'vkvOD',SPECIAL:'vkvSPECIAL'};
const LABEL={VL:'VL',EL:'EL',CL:'CL',SEL:'SEL',EOL:'EOL',MATERNITY:'Maternity',OD:'OD',SPECIAL:'Special Assignment'};
const colourClass=c=>CAT[String(c||'').trim().toUpperCase()]||'vkvOTHER';
function parseRow(row){
 const cells=[...row.querySelectorAll('td')],text=String(row.innerText||'').toUpperCase();let category='';
 for(const c of ['MATERNITY','SPECIAL','SEL','EOL','VL','EL','CL','OD']){const re=new RegExp(`(?:^|[^A-Z])${c}(?:[^A-Z]|$)`);if(re.test(text)){category=c;break}}
 if(/SPECIAL ASSIGNMENT/.test(text))category='SPECIAL';else if(/ON DUTY/.test(text))category='OD';
 let units=0;if(cells.length>=4){const m=String(cells[3].innerText||'').trim().match(/-?\d+(?:\.\d+)?/);if(m)units=Number(m[0])}
 if(!Number.isFinite(units)||units<0)units=0;
 let full=0,half=0;const fm=text.match(/FULL\s*LEAVE[^0-9]{0,10}(\d+(?:\.\d+)?)/),hm=text.match(/HALF\s*LEAVE[^0-9]{0,10}(\d+(?:\.\d+)?)/);if(fm)full=Number(fm[1]);if(hm)half=Number(hm[1]);
 if(!full&&!half&&units>0){full=Math.floor(units);half=Math.round((units-full)*2)/2;if(units===0.5){full=0;half=.5}}
 if(!full&&!half){if(/HALF\s*LEAVE/.test(text))half=.5;else if(/FULL\s*LEAVE/.test(text))full=1}
 return{full,half,units,category};
}
function clear(row){row.classList.remove('vkvDayFull','vkvDayHalf','vkvDayMixed');row.style.removeProperty('--vkv-day-split');row.querySelectorAll(':scope .vkvCategoryRibbon').forEach(x=>x.remove())}
function enhanceRow(row){clear(row);const d=parseRow(row);if(!d.full&&!d.half&&!d.category)return;
 if(d.full&&d.half){row.classList.add('vkvDayMixed');const pct=Math.max(8,Math.min(92,100*d.full/(d.full+d.half)));row.style.setProperty('--vkv-day-split',pct+'%')}
 else if(d.half)row.classList.add('vkvDayHalf');else if(d.full)row.classList.add('vkvDayFull');
 if(d.category){const ribbon=document.createElement('span');ribbon.className=`vkvCategoryRibbon ${colourClass(d.category)}`;ribbon.innerHTML=`<i class="vkvCategoryBall"></i>${LABEL[d.category]||d.category}`;ribbon.title=`Leave category: ${LABEL[d.category]||d.category}`;const cells=row.querySelectorAll('td');let target=null;if(cells.length>=2){for(const c of cells){if(String(c.innerText||'').trim().toUpperCase()===d.category){target=c;break}}target=target||cells[1]}else target=row;target.appendChild(ribbon)}
 row.dataset.vkvLeaveColour='4'}
function enhanceCards(root=document){root.querySelectorAll('.recordCard,.pendingCard,.teacherHistoryLine,#ulfRows tbody tr,#vkvVlRows tbody tr,#vkvVlAuditRows tbody tr,#vlBulkPreview tbody tr,#recordList tbody tr').forEach(enhanceRow)}
function legend(){let d=document.getElementById('vkvLeaveColourLegend');if(d)d.remove();const ref=document.getElementById('vkvUnifiedLeaveFinder')||document.querySelector('#pendingSection')?.nextElementSibling;if(!ref)return;d=document.createElement('div');d.id='vkvLeaveColourLegend';d.className='vkvLegendBox quick-hide';d.innerHTML='<span class="vkvLegendTitle">Colour guide · Option 4</span><span><i class="vkvLeaveDot vkvFullDot"></i>Full Leave row</span><span><i class="vkvLeaveDot vkvHalfDot"></i>Half Leave row</span><span style="opacity:.5">|</span><span><i class="vkvLeaveDot vkvVL"></i>VL</span><span><i class="vkvLeaveDot vkvEL"></i>EL</span><span><i class="vkvLeaveDot vkvCL"></i>CL</span><span><i class="vkvLeaveDot vkvSEL"></i>SEL</span><span><i class="vkvLeaveDot vkvEOL"></i>EOL</span><span><i class="vkvLeaveDot vkvOD"></i>OD</span><span><i class="vkvLeaveDot vkvSPECIAL"></i>Special Assignment · Navy</span><span><i class="vkvLeaveDot vkvMATERNITY"></i>Maternity</span>';ref.parentNode.insertBefore(d,ref)}
let t=0,tm=setInterval(()=>{if(t===0)legend();enhanceCards();if(++t>50)clearInterval(tm)},300);new MutationObserver(m=>{for(const x of m)for(const n of x.addedNodes)if(n.nodeType===1){if(n.matches?.('tr,.recordCard,.pendingCard,.teacherHistoryLine'))enhanceRow(n);enhanceCards(n)}}).observe(document.documentElement,{childList:true,subtree:true});
})();
