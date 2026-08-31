import{getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getFirestore,collection,query,where,getCountFromServer}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(n,d)=>d?Math.round(n*1000/d)/10:0;
function teachersFromPage(){const e=document.getElementById('aTeacher');if(!e)return[];return[...e.options].map(o=>{const code=String(o.value||'').trim(),text=String(o.textContent||'').trim(),m=text.match(/^(.*?)\s*\(([^()]*)\)\s*$/);return{code,name:(m?.[1]||text||code).trim()}}).filter(x=>x.code)}
function syncFilters(){const ss=document.getElementById('lSubject'),sc=document.getElementById('lClass'),vs=document.getElementById('vCSubject'),vc=document.getElementById('vCClass');if(ss&&vs){const old=vs.value;vs.innerHTML=ss.innerHTML;if([...vs.options].some(o=>o.value===old))vs.value=old}if(sc&&vc){const old=vc.value;vc.innerHTML=sc.innerHTML;if([...vc.options].some(o=>o.value===old))vc.value=old}}
async function init(){
  for(let i=0;i<40&&!document.getElementById('app');i++)await wait(100);
  const app=document.getElementById('app');if(!app)return;
  for(let i=0;i<40&&!getApps().length;i++)await wait(100);if(!getApps().length)return;
  const tabs=document.querySelector('.tabs');if(!tabs||document.getElementById('verifiedContribution'))return;
  const db=getFirestore(getApp());
  const btn=document.createElement('button');btn.dataset.panel='verifiedContribution';btn.textContent='🏅 Verified Contribution';tabs.insertBefore(btn,tabs.querySelector('[data-panel="questions"]'));
  const sec=document.createElement('section');sec.id='verifiedContribution';sec.className='card panel';
  sec.innerHTML=`<h2>🏅 Verified Contribution & Revision Context</h2>
  <div class="tip">Academic workflow view: ranks teachers by verified questions and also shows verification and return-for-revision rates. These are workflow indicators only and are <b>not</b> academic quality scores. Rates based on fewer than 5 submitted questions are marked as a small sample. Firestore aggregate counts are used; question documents are not downloaded.</div>
  <div class="grid2" style="margin-top:10px"><div><label>Subject</label><select id="vCSubject"><option value="">All</option></select></div><div><label>Class</label><select id="vCClass"><option value="">All</option></select></div></div>
  <div class="actions"><button id="loadVerifiedContribution" class="primary">Calculate Verified Contribution</button><button id="exportVerifiedContribution">Export CSV</button></div>
  <div id="verifiedContributionSummary" style="display:none;margin:12px 0"></div>
  <div id="verifiedContributionList"><div class="empty">Click “Calculate Verified Contribution”. Nothing is counted on page startup.</div></div>`;
  document.querySelector('main .wrap #app')?.appendChild(sec);syncFilters();
  btn.onclick=()=>{syncFilters();document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x===sec))};
  let lastRows=[];
  document.getElementById('loadVerifiedContribution').onclick=async()=>{
    const button=document.getElementById('loadVerifiedContribution'),out=document.getElementById('verifiedContributionList'),summary=document.getElementById('verifiedContributionSummary'),sub=document.getElementById('vCSubject').value,cls=document.getElementById('vCClass').value,teachers=teachersFromPage();
    summary.style.display='none';summary.innerHTML='';if(!teachers.length){out.innerHTML='<div class="empty">Teacher list is not ready yet. Reopen this tab after the Admin page finishes loading.</div>';return}button.disabled=true;const old=button.textContent;button.textContent='Calculating…';out.innerHTML='<div class="empty">Calculating quota-safe aggregate counts…</div>';
    try{const rows=[];
    for(const t of teachers){
      const base=[collection(db,'qbQuestions'),where('teacherCode','==',t.code)],filters=[];
      if(sub)filters.push(where('subject','==',sub));if(cls)filters.push(where('className','==',cls));
      try{
        const [submitted,verified,returned]=await Promise.all([
          getCountFromServer(query(...base,where('status','in',['submitted','approved','returned']),...filters)),
          getCountFromServer(query(...base,where('status','==','approved'),...filters)),
          getCountFromServer(query(...base,where('status','==','returned'),...filters))
        ]);
        const total=submitted.data().count,ok=verified.data().count,ret=returned.data().count;
        if(total)rows.push({name:t.name||t.code,code:t.code,total,ok,returned:ret,rate:pct(ok,total),returnRate:pct(ret,total),smallSample:total<5});
      }catch(e){console.warn('Verified contribution count',t.code,e)}
    }
    rows.sort((a,b)=>b.ok-a.ok||b.rate-a.rate||a.name.localeCompare(b.name));lastRows=rows;
    if(rows.length){
      const totals=rows.reduce((a,x)=>({submitted:a.submitted+x.total,verified:a.verified+x.ok,returned:a.returned+x.returned}),{submitted:0,verified:0,returned:0});
      summary.style.display='block';
      summary.innerHTML=`<div class="grid2"><div class="tip"><b>${rows.length}</b> contributing teacher${rows.length===1?'':'s'}<br><span class="small">for the current Subject/Class filter</span></div><div class="tip"><b>${totals.submitted}</b> submitted · <b>${totals.verified}</b> verified (${pct(totals.verified,totals.submitted)}%) · <b>${totals.returned}</b> currently returned (${pct(totals.returned,totals.submitted)}%)</div></div>`;
      out.innerHTML=rows.map((x,i)=>`<div class="leader"><div class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div><div class="grow"><b>${esc(x.name)}</b>${x.smallSample?' <span class="pill">Small sample</span>':''}<div class="small">${esc(x.code)} · Verified: <b>${x.ok}</b> of ${x.total} submitted · Verification rate: <b>${x.rate}%</b> · Returned for revision: <b>${x.returned}</b> (${x.returnRate}%)</div></div></div>`).join('');
    }else out.innerHTML='<div class="empty">No submitted questions for this selection.</div>';}catch(e){out.innerHTML='<div class="empty">Could not calculate verified contribution: '+esc(e.message||e)+'</div>'}finally{button.disabled=false;button.textContent=old}
  };
  document.getElementById('exportVerifiedContribution').onclick=()=>{
    if(!lastRows.length)return alert('Calculate the Verified Contribution view first.');
    const subject=document.getElementById('vCSubject').value||'All',cls=document.getElementById('vCClass').value||'All',rows=[['Rank','Teacher','Code','Submitted','Verified','Verification Rate %','Returned for Revision','Return Rate %','Sample Context','Subject','Class'],...lastRows.map((x,i)=>[i+1,x.name,x.code,x.total,x.ok,x.rate,x.returned,x.returnRate,x.smallSample?'Small sample (<5 submitted)':'5+ submitted',subject,cls])],csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='VKV_QB_Verified_Contribution.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  };
}
init();