(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base=v=>String(v||'').trim().replace(/\s+/g,' ').replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?[A-DV]$/i,'').replace(/\s*\((?:A|B|C|D|V)\)$/i,'').trim();
  const norm=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
  const isScience=n=>['phy','physics','chem','chemistry','bio','biology'].includes(n);
  const isSocial=n=>['hist','history','geo','geography','eco','economics','polsci','politicalscience'].includes(n);

  function subjectMap(){
    const out=new Map();
    for(const g of document.querySelectorAll('#majorSubjectGrid .majorGroup')){
      const cls=base(g.querySelector('h4')?.textContent||'');if(!cls)continue;
      const regular=[...g.querySelectorAll('[data-major-subject]:checked')].map(b=>String(b.dataset.majorSubject||'').trim()).filter(Boolean);
      const custom=[...g.querySelectorAll('[data-exam-only-subject]:checked')].map(b=>String(b.dataset.examOnlySubject||'').trim()).filter(Boolean);
      let items=[...regular,...custom];
      if(/^(IX|X)$/i.test(cls)){
        const hasScience=custom.some(s=>norm(s)==='science');
        const hasSocial=custom.some(s=>['socialscience','ssc'].includes(norm(s)));
        if(hasScience)items=items.filter(s=>!isScience(norm(s)));
        if(hasSocial)items=items.filter(s=>!isSocial(norm(s)));
      }
      const seen=new Set();items=items.filter(s=>{const k=norm(s);if(!k||seen.has(k))return false;seen.add(k);return true});
      out.set(cls,items);
    }
    return out;
  }

  function updateMetric(){
    const map=subjectMap();let count=0;for(const arr of map.values())count+=arr.length;
    const cards=[...($('timetableMetrics')?.children||[])],strong=cards[1]?.querySelector('strong'),label=cards[1]?.querySelector('span');
    if(strong)strong.textContent=String(count);if(label)label.textContent='Selected exam subjects';
    return count;
  }

  function buildFallback(){
    const box=$('templatePatternQuickEdit');if(!box)return false;
    const noPattern=/no saved timetable pattern/i.test(box.textContent||'');if(!noPattern)return false;
    const map=subjectMap(),classes=[...map.keys()].filter(c=>(map.get(c)||[]).length);if(!classes.length)return false;
    const rows=Math.max(...classes.map(c=>map.get(c).length),1),count=[...map.values()].reduce((n,a)=>n+a.length,0);
    box.innerHTML=`<div class="sectionTitle"><div><h3>Imported Template · Quick Arrange</h3><p>This older template did not store its original date pattern. Its imported examination subjects are shown below so you can arrange them quickly and choose fresh dates.</p></div></div><div class="tableWrap"><table class="majorMatrix"><thead><tr><th>New Date</th><th>Day</th>${classes.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${Array.from({length:rows},(_,i)=>`<tr><td><input type="date" data-fallback-day-date="${i+1}"></td><td><b>Day ${i+1}</b></td>${classes.map(c=>{const items=map.get(c)||[],current=items[i]||'';return `<td><select data-fallback-class="${esc(c)}" data-fallback-row="${i+1}"><option value="">— No exam —</option>${items.map(s=>`<option value="${esc(s)}" ${s===current?'selected':''}>${esc(s)}</option>`).join('')}</select></td>`}).join('')}</tr>`).join('')}</tbody></table></div><div class="notice info" style="margin-top:12px"><b>${count} logical examination subject(s) imported.</b> Because this is a legacy template without a stored pattern, the row order is editable rather than claimed as the original timetable.</div>`;
    updateMetric();return true;
  }

  function refresh(){updateMetric();buildFallback()}
  document.addEventListener('vkv-exam-custom-subjects-changed',()=>setTimeout(refresh,80));
  document.addEventListener('vkv-exam-custom-subjects-rendered',()=>setTimeout(refresh,40));
  document.addEventListener('click',e=>{if(e.target.closest('[data-pane-target="timetable"],[data-real-use-template],#majorLoadTemplate,[data-add-exam-subject]')){setTimeout(refresh,250);setTimeout(refresh,900)}},true);
  window.addEventListener('load',()=>{setTimeout(refresh,700);setTimeout(refresh,1600)});
})();