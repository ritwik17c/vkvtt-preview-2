/* VKVTT QB quick-entry smart defaults. Local browser only; no Firestore reads/writes. */
(()=>{'use strict';
const KEY='vkvtt.qb.quickDefaults.v1',IDS=['qClass','qSubject','qMarks','qDifficulty','qType'];
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return{}}}
function write(){const out={};for(const id of IDS){const el=document.getElementById(id);if(el)out[id]=String(el.value??'')}try{localStorage.setItem(KEY,JSON.stringify(out))}catch{}}
function optionExists(el,value){return !el.options||[...el.options].some(o=>String(o.value||o.textContent)===String(value))}
function restore(){const saved=read();for(const id of IDS){const el=document.getElementById(id),value=saved[id];if(!el||value==null||value==='')continue;if(id==='qMarks'){const n=Number(value);if(Number.isFinite(n)&&n>=0)el.value=String(value);continue}if(optionExists(el,value))el.value=String(value)}
const host=document.getElementById('add');if(host&&!document.getElementById('qbSmartDefaultsHint')){const hint=document.createElement('div');hint.id='qbSmartDefaultsHint';hint.className='small';hint.style.cssText='margin-top:7px;color:#617685';hint.textContent='Class, Subject and Marks are remembered on this device for faster repeat entry.';const tip=host.querySelector('.tip');tip?.insertAdjacentElement('afterend',hint)}
for(const id of IDS){const el=document.getElementById(id);if(el&&!el.dataset.qbSmartDefaultBound){el.dataset.qbSmartDefaultBound='1';el.addEventListener('change',write);el.addEventListener('input',()=>{if(id==='qMarks')write()})}}
}
function install(){if(!document.getElementById('qClass')||!document.getElementById('qSubject'))return false;restore();return true}
let tries=0,t=setInterval(()=>{if(install()||++tries>60)clearInterval(t)},200);window.addEventListener('load',()=>setTimeout(install,250));
})();
