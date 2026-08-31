// VKVTT QB Paper Builder — Phase E4.3 local-only Paper Health checks
// Surgical enhancement: no Firestore reads/writes; works only with the existing local draft UI.
(function(){
 const $=id=>document.getElementById(id), num=v=>Number(v)||0;
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\u0900-\u097f\u0980-\u09ff]+/g,' ').trim().replace(/\s+/g,' ');
 function analyse(){
  const panel=$('paperBuilder'), host=$('pbStructure'); if(!panel||!host)return;
  const target=num($('pbTarget')?.value), sections=[...panel.querySelectorAll('#pbSections > .qcard')];
  let questions=0, blank=0, zero=0, choices=0, used=0, verifiedBank=0, largestMark=0; const sectionTotals=[], seen=new Map(), duplicateGroups=[];
  sections.forEach((s,si)=>{let st=0;const texts=[...s.querySelectorAll('[data-q]')],marks=[...s.querySelectorAll('[data-m]')],ors=[...s.querySelectorAll('[data-c]')],sectionTarget=num(s.querySelector('[data-st]')?.value);questions+=texts.length;
   texts.forEach((x,qi)=>{const raw=x.value.trim();if(!raw){blank++;return}const key=norm(raw);if(key.length>=12){const label=`${String.fromCharCode(65+si)}${qi+1}`;if(seen.has(key)){const first=seen.get(key);let g=duplicateGroups.find(a=>a.key===key);if(!g){g={key,items:[first]};duplicateGroups.push(g)}g.items.push(label)}else seen.set(key,label)}if((x.parentElement?.textContent||'').includes('From Verified Bank'))verifiedBank++});
   marks.forEach(x=>{const m=num(x.value);st+=m;used+=m;largestMark=Math.max(largestMark,m);if(m<=0)zero++});ors.forEach(x=>{if(x.value.trim())choices++});sectionTotals.push({name:String.fromCharCode(65+si),marks:st,target:sectionTarget})});
  const remain=target-used, issues=[];
  if(target&&remain!==0)issues.push(remain>0?`${remain} mark(s) still need to be allocated.`:`Paper is ${Math.abs(remain)} mark(s) over target.`);
  if(blank)issues.push(`${blank} blank question slot(s) remain.`); if(zero)issues.push(`${zero} question(s) have zero marks.`);
  const emptySections=sectionTotals.filter(x=>x.marks===0).map(x=>x.name);if(emptySections.length)issues.push(`Section ${emptySections.join(', ')} currently has no marks.`);
  sectionTotals.filter(x=>x.target&&x.marks!==x.target).forEach(x=>{const d=x.target-x.marks;issues.push(d>0?`Section ${x.name} is ${d} mark(s) short of its ${x.target}-mark target.`:`Section ${x.name} is ${Math.abs(d)} mark(s) over its ${x.target}-mark target.`)});
  const sectionTargets=sectionTotals.filter(x=>x.target).reduce((a,x)=>a+x.target,0);if(target&&sectionTargets&&sectionTargets!==target)issues.push(`Section targets total ${sectionTargets} marks, while the paper target is ${target}.`);
  duplicateGroups.forEach(g=>issues.push(`Repeated question text detected at ${g.items.join(', ')}. Review before finalising.`));

  // Advisory-only marks balance checks. These never block or modify a paper.
  const effectiveTotal=target||used;
  const nonEmptySections=sectionTotals.filter(x=>x.marks>0);
  if(effectiveTotal>0&&nonEmptySections.length>1){
   const heaviest=nonEmptySections.reduce((a,b)=>b.marks>a.marks?b:a,nonEmptySections[0]);
   const pct=Math.round(heaviest.marks*100/effectiveTotal);
   if(pct>=75)issues.push(`Marks balance: Section ${heaviest.name} carries ${pct}% of the paper (${heaviest.marks}/${effectiveTotal} marks). Review whether this concentration is intentional.`);
  }
  if(effectiveTotal>=20&&largestMark>0){
   const pct=Math.round(largestMark*100/effectiveTotal);
   if(pct>=40)issues.push(`Marks balance: the largest single question carries ${largestMark} marks (${pct}% of the paper). Review whether this weighting is intentional.`);
  }

  const verifiedPct=questions?Math.round((verifiedBank/questions)*100):0;
  const avgMark=questions&&used?Math.round((used/questions)*10)/10:0;
  host.innerHTML=`<div class="grid3"><div class="metric"><div class="num">${questions}</div><div class="lab">Questions · Avg ${avgMark} mark(s)</div></div><div class="metric"><div class="num">${choices}</div><div class="lab">Internal Choices · Largest Q ${largestMark}</div></div><div class="metric"><div class="num">${verifiedBank}/${questions||0}</div><div class="lab">From Verified Bank · ${verifiedPct}%</div></div></div><div class="${issues.length?'warning':'tip'}" style="margin-top:9px"><b>${issues.length?'Paper Health':'✓ Basic structure check passed'}</b>${issues.length?'<br>'+issues.map(x=>'• '+x).join('<br>'):'<br>Paper target, section targets, blank slots, zero-mark questions, repeated text and marks balance are clear.'}</div>${duplicateGroups.length?'<div class="small" style="margin-top:6px">Duplicate check is deliberately conservative: it flags only matching normalised text, not semantic similarity.</div>':''}<div class="small" style="margin-top:6px">Marks-balance notices are advisory only. They do not judge academic suitability or prevent finalisation.</div>`;
 }
 function init(){const panel=$('paperBuilder');if(!panel||$('pbStructure'))return false;const balance=$('pbBalance');if(!balance)return false;const box=document.createElement('div');box.id='pbStructure';box.style.marginTop='10px';balance.insertAdjacentElement('afterend',box);panel.addEventListener('input',()=>setTimeout(analyse,0));panel.addEventListener('click',()=>setTimeout(analyse,0));panel.addEventListener('change',()=>setTimeout(analyse,0));analyse();return true}
 let n=0,t=setInterval(()=>{if(init()||++n>40)clearInterval(t)},300);window.addEventListener('load',()=>setTimeout(init,700));
})();
