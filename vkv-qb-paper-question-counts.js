/* VKVTT QB Paper Builder — live question-count context.
   UI-only progressive enhancement. Reads local builder state; no Firestore reads/writes. */
(()=>{'use strict';
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(){
 const api=window.__vkvQbPaperBuilder,panel=$('paperBuilder'),balance=$('pbBalance');
 if(!api||!panel||!balance)return false;
 let box=$('pbQuestionCounts');
 if(!box){box=document.createElement('div');box.id='pbQuestionCounts';box.className='tip';box.style.marginTop='8px';box.setAttribute('role','status');box.setAttribute('aria-live','polite');balance.insertAdjacentElement('afterend',box)}
 const render=()=>{const st=api.getState(),sections=Array.isArray(st.sections)?st.sections:[],qs=sections.flatMap(s=>Array.isArray(s.questions)?s.questions:[]),total=qs.length,choice=qs.filter(q=>String(q.choice||'').trim()).length,verified=qs.filter(q=>q.sourceQuestionId||q.source==='verified_bank').length,blank=qs.filter(q=>!String(q.text||'').trim()).length,breakdown=sections.map((s,i)=>{const sq=Array.isArray(s.questions)?s.questions:[],n=sq.length,marks=sq.reduce((sum,q)=>{const m=Number(q.marks);return sum+(Number.isFinite(m)&&m>0?m:0)},0),target=Number(s.targetMarks),hasTarget=Number.isFinite(target)&&target>0,diff=hasTarget?target-marks:0,targetText=hasTarget?(diff===0?' · <span style="color:#245c34">target met</span>':diff>0?' · <span style="color:#8b5b12">'+diff+' short of '+target+'</span>':' · <span style="color:#8b5b12">'+Math.abs(diff)+' over '+target+'</span>'):'',label=String(s.title||'').trim()||('Section '+(i+1));return safe(label)+': <b>'+n+'</b> question'+(n===1?'':'s')+' · <b>'+marks+'</b> mark'+(marks===1?'':'s')+targetText}).join(' · ');box.innerHTML='<b>'+total+' question'+(total===1?'':'s')+'</b> in '+sections.length+' section'+(sections.length===1?'':'s')+' · '+choice+' with internal choice · '+verified+' from Verified Bank'+(blank?' · <span style="color:#8b5b12">'+blank+' blank question'+(blank===1?'':'s')+'</span>':' · <span style="color:#245c34">no blank questions</span>')+(sections.length?'<div class="small" style="margin-top:5px"><b>Section spread:</b> '+breakdown+'</div>':'')};
 window.addEventListener('vkv-qb-paper-rendered',render);render();return true
}
let tries=0,t=setInterval(()=>{if(install()||++tries>40)clearInterval(t)},250);window.addEventListener('vkv-qb-paper-ready',install);window.addEventListener('load',install);
})();
