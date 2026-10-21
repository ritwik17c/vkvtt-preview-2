import{getApps,getApp}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import{getFirestore,doc,getDoc,collection,getDocs,query,where,limit}from'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const text=v=>String(v??'').trim();
const lower=v=>text(v).toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));

function canonical(code,aliases){const seen=new Set();code=text(code);while(code&&aliases?.[code]&&!seen.has(code)){seen.add(code);code=text(aliases[code])}return code}
function normalQuestion(v){return lower(v).replace(/[^a-z0-9\u0980-\u09ff\u0900-\u097f]+/g,' ').replace(/\s+/g,' ').trim()}

const higher=['analyse','analyze','evaluate','justify','compare','contrast','examine','assess','critically','design','create','develop','derive','prove','interpret','infer','predict','explain','discuss','differentiate','distinguish','illustrate','apply','solve'];
const recall=['define','state','name','list','identify','mention','write','what','when','where','who'];
const directive=[...higher,...recall,'calculate','describe','give','find','show','complete','choose','select','match','draw','label','read'];

function hasWord(q,arr){const s=' '+lower(q)+' ';return arr.some(w=>s.includes(' '+w+' ')||s.startsWith(w+' ')||s.includes(w+' '))}
function grade(score){return score>=90?'Excellent':score>=80?'Very Good':score>=70?'Good':score>=60?'Developing':'Needs Review'}

function questionScore(q,duplicateCount){
  const qt=text(q.questionText),ans=text(q.answer),scheme=text(q.markingScheme),marks=Number(q.marks)||0;
  let clarity=0,completeness=0,cognitive=0,alignment=0,originality=0,review=0;

  const len=qt.length;
  clarity+=len>=20&&len<=320?8:len>=10&&len<=500?6:2;
  clarity+=(qt.includes('?')||hasWord(qt,directive))?5:2;
  clarity+=!/\?\?\?|!!|\.\.\.|\s{3,}/.test(qt)?4:1;
  clarity+=qt.split(/\s+/).filter(Boolean).length>=5?3:1;

  completeness+=ans?6:0;
  completeness+=scheme?5:0;
  completeness+=marks>0?3:0;
  completeness+=(text(q.chapter)||text(q.topic))?3:0;
  completeness+=text(q.learningOutcome)?3:0;

  if(hasWord(qt,higher))cognitive+=14;else if(hasWord(qt,recall))cognitive+=8;else cognitive+=6;
  cognitive+=text(q.difficulty)?3:1;
  cognitive+=text(q.questionType)?3:1;

  alignment+=text(q.className)?4:0;
  alignment+=text(q.subject)?4:0;
  if(marks>0&&marks<=20)alignment+=4;else if(marks>20)alignment+=2;
  if(ans&&marks){const words=ans.split(/\s+/).filter(Boolean).length;alignment+=(marks<=2&&words<=80)||(marks>2&&words>=8)?4:2}
  alignment+=scheme&&ans?4:scheme||ans?2:0;

  originality+=duplicateCount<=1?10:duplicateCount===2?5:2;

  const status=lower(q.status),wf=Array.isArray(q.workflow)?q.workflow:[];
  const hadReturn=status==='returned'||wf.some(x=>lower(x.action).includes('return'));
  review+=status==='approved'?6:status==='submitted'?3:1;
  review+=hadReturn?0:4;

  const total=clamp(clarity+completeness+cognitive+alignment+originality+review);
  return{total,clarity,completeness,cognitive,alignment,originality,review};
}

function csvDownload(rows){
  const data=[['Rank','Teacher','Code','Quality Score','Assessed Questions','Approved','Returned','Provisional','Clarity','Completeness','Cognitive Depth','Assessment Alignment','Originality','Review Confidence'],...rows.map((r,i)=>[r.provisional?'Provisional':i+1,r.name,r.code,r.score.toFixed(1),r.count,r.approved,r.returned,r.provisional?'Yes':'No',r.parts.clarity.toFixed(1),r.parts.completeness.toFixed(1),r.parts.cognitive.toFixed(1),r.parts.alignment.toFixed(1),r.parts.originality.toFixed(1),r.parts.review.toFixed(1)])];
  const csv=data.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='VKV_QB_Qualitative_Leaderboard.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function loadMaster(db){
  const s=await getDoc(doc(db,'master','current')),raw=s.exists()?s.data()||{}:{},m=raw.data&&typeof raw.data==='object'?{...raw,...raw.data}:raw,aliases=m.teacherCodeAliases||{},mail=m.teacherEmailMap||{};
  const teachers=new Map();
  for(const t of(m.teachers||[])){
    if(!t||t.active===false||t.nonTeaching)continue;
    const rawCode=text(t.code||t.shortCode||t.teacherShortCode||t.timetableCode),code=canonical(rawCode,aliases)||rawCode;
    if(!code)continue;
    teachers.set(code,{code,name:text(t.name||t.fullName||code),email:lower(mail[rawCode]||mail[code]||t.email||t.gmail||t.googleEmail||'')});
  }
  return{m,aliases,teachers};
}

async function init(){
  for(let i=0;i<50&&!document.getElementById('app');i++)await wait(100);
  for(let i=0;i<50&&!getApps().length;i++)await wait(100);
  if(!getApps().length)return;
  const tabs=document.querySelector('.tabs'),app=document.getElementById('app');
  if(!tabs||!app||document.getElementById('qualityLeaderboard'))return;
  const numeric=tabs.querySelector('[data-panel="leaderboard"]');
  const btn=document.createElement('button');btn.type='button';btn.dataset.panel='qualityLeaderboard';btn.textContent='✨ Qualitative';
  numeric?.insertAdjacentElement('afterend',btn);
  const sec=document.createElement('section');sec.id='qualityLeaderboard';sec.className='card panel';sec.innerHTML=`
    <h2>✨ Qualitative Question Leaderboard</h2>
    <div class="tip"><b>Separate from the numerical leaderboard.</b> This score does not count how many questions a teacher has submitted. It automatically assesses the quality signals already stored in each question: clarity, completeness, cognitive depth, assessment alignment, originality/duplication risk and review confidence. A minimum of <b>5 assessed questions</b> is required for an official rank; smaller samples are shown as provisional.</div>
    <div class="grid2" style="margin-top:10px"><div><label>Subject</label><select id="qLSubject"><option value="">All</option></select></div><div><label>Class</label><select id="qLClass"><option value="">All</option></select></div></div>
    <div class="actions"><button id="loadQualityLeaderboard" type="button" class="primary">Calculate Qualitative Leaderboard</button><button id="exportQualityLeaderboard" type="button">Export CSV</button></div>
    <div id="qualityLeaderList"><div class="empty">Click “Calculate Qualitative Leaderboard”. Question documents are read only when requested.</div></div>`;
  const leaderPanel=document.getElementById('leaderboard');leaderPanel?.insertAdjacentElement('afterend',sec);

  const sync=()=>{for(const[target,source]of[['qLSubject','lSubject'],['qLClass','lClass']]){const t=document.getElementById(target),s=document.getElementById(source);if(t&&s){const old=t.value;t.innerHTML=s.innerHTML;if([...t.options].some(o=>o.value===old))t.value=old}}};sync();
  btn.onclick=e=>{e.preventDefault();sync();document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x===sec))};

  const db=getFirestore(getApp());let last=[];
  document.getElementById('loadQualityLeaderboard').onclick=async()=>{
    const b=document.getElementById('loadQualityLeaderboard'),out=document.getElementById('qualityLeaderList'),sub=document.getElementById('qLSubject').value,cls=document.getElementById('qLClass').value;const old=b.textContent;b.disabled=true;b.textContent='Assessing…';out.innerHTML='<div class="empty">Reading submitted / approved / returned questions…</div>';
    try{
      const[{aliases,teachers},snap]=await Promise.all([loadMaster(db),getDocs(query(collection(db,'qbQuestions'),where('status','in',['submitted','approved','returned']),limit(1000)))]);
      let qs=snap.docs.map(d=>({id:d.id,...d.data()}));if(sub)qs=qs.filter(q=>q.subject===sub);if(cls)qs=qs.filter(q=>q.className===cls);
      const dup=new Map();for(const q of qs){const k=normalQuestion(q.questionText);if(k)dup.set(k,(dup.get(k)||0)+1)}
      const groups=new Map();
      for(const q of qs){let code=canonical(q.teacherCode,aliases)||text(q.teacherCode),t=teachers.get(code);if(!t&&q.teacherEmail){const em=lower(q.teacherEmail);t=[...teachers.values()].find(x=>x.email&&x.email===em);if(t)code=t.code}if(!code)continue;if(!groups.has(code))groups.set(code,{code,name:t?.name||text(q.teacherName||code),items:[]});groups.get(code).items.push(q)}
      const rows=[];for(const g of groups.values()){
        const scored=g.items.map(q=>({q,s:questionScore(q,dup.get(normalQuestion(q.questionText))||1)})),count=scored.length;if(!count)continue;
        const avg=k=>scored.reduce((n,x)=>n+x.s[k],0)/count,approved=g.items.filter(q=>q.status==='approved').length,returned=g.items.filter(q=>q.status==='returned').length;
        rows.push({code:g.code,name:g.name,count,approved,returned,score:avg('total'),parts:{clarity:avg('clarity'),completeness:avg('completeness'),cognitive:avg('cognitive'),alignment:avg('alignment'),originality:avg('originality'),review:avg('review')},provisional:count<5});
      }
      rows.sort((a,b)=>Number(a.provisional)-Number(b.provisional)||b.score-a.score||b.count-a.count||a.name.localeCompare(b.name));last=rows;
      let officialRank=0;out.innerHTML=rows.length?rows.map(r=>{const rank=r.provisional?'P':++officialRank;return`<div class="leader"><div class="rank">${r.provisional?'P':rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'#'+rank}</div><div class="grow"><b>${esc(r.name)}</b> <span class="badge">${esc(grade(r.score))}</span>${r.provisional?'<span class="badge">Provisional sample</span>':''}<div class="small">Quality score: <b>${r.score.toFixed(1)}/100</b> · Assessed: <b>${r.count}</b> · Approved: ${r.approved} · Returned: ${r.returned}</div><div class="small">Clarity ${r.parts.clarity.toFixed(1)}/20 · Completeness ${r.parts.completeness.toFixed(1)}/20 · Cognitive depth ${r.parts.cognitive.toFixed(1)}/20 · Alignment ${r.parts.alignment.toFixed(1)}/20 · Originality ${r.parts.originality.toFixed(1)}/10 · Review confidence ${r.parts.review.toFixed(1)}/10</div></div></div>`}).join(''):'<div class="empty">No eligible submitted/approved/returned questions were found for this selection.</div>';
      if(snap.size===1000)out.insertAdjacentHTML('afterbegin','<div class="warn">The first 1000 workflow questions were assessed. A later server-side quality index can remove this safety cap if the bank grows beyond it.</div>');
    }catch(e){console.error('Qualitative QB leaderboard:',e);out.innerHTML='<div class="empty" style="color:#8b2d2d">Qualitative leaderboard could not be calculated: '+esc(e.message||e)+'</div>'}finally{b.disabled=false;b.textContent=old}
  };
  document.getElementById('exportQualityLeaderboard').onclick=()=>{if(!last.length)return alert('Calculate the Qualitative Leaderboard first.');csvDownload(last)};
}

init().catch(e=>console.error('Qualitative leaderboard init:',e));
