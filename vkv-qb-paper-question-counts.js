/* VKVTT QB Paper Builder — live question-count context.
   UI-only progressive enhancement. Reads local builder state; no Firestore reads/writes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function install(){
 const api=window.__vkvQbPaperBuilder,panel=$('paperBuilder'),balance=$('pbBalance');
 if(!api||!panel||!balance)return false;
 let box=$('pbQuestionCounts');
 if(!box){box=document.createElement('div');box.id='pbQuestionCounts';box.className='tip';box.style.marginTop='8px';box.setAttribute('role','status');box.setAttribute('aria-live','polite');balance.insertAdjacentElement('afterend',box)}
 const render=()=>{const st=api.getState(),sections=Array.isArray(st.sections)?st.sections:[],qs=sections.flatMap(s=>Array.isArray(s.questions)?s.questions:[]),total=qs.length,choice=qs.filter(q=>String(q.choice||'').trim()).length,verified=qs.filter(q=>q.sourceQuestionId||q.source==='verified_bank').length,blank=qs.filter(q=>!String(q.text||'').trim()).length;box.innerHTML='<b>'+total+' question'+(total===1?'':'s')+'</b> in '+sections.length+' section'+(sections.length===1?'':'s')+' · '+choice+' with internal choice · '+verified+' from Verified Bank'+(blank?' · <span style="color:#8b5b12">'+blank+' blank question'+(blank===1?'':'s')+'</span>':' · <span style="color:#245c34">no blank questions</span>')};
 window.addEventListener('vkv-qb-paper-rendered',render);render();return true
}
let tries=0,t=setInterval(()=>{if(install()||++tries>40)clearInterval(t)},250);window.addEventListener('vkv-qb-paper-ready',install);window.addEventListener('load',install);
})();
