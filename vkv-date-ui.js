/* VKVTT shared visible-date policy: show dd/mm/yyyy while preserving ISO yyyy-mm-dd values for existing app logic and Firestore keys. */
(()=>{'use strict';
if(window.__vkvDateUiLoaded)return;window.__vkvDateUiLoaded=true;
const pad=n=>String(n).padStart(2,'0');
const isoToDisplay=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'')};
const displayToIso=v=>{const m=String(v||'').trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(!m)return'';const d=Number(m[1]),mo=Number(m[2]),y=Number(m[3]),iso=`${y}-${pad(mo)}-${pad(d)}`,x=new Date(`${iso}T00:00:00`);return x.getFullYear()===y&&x.getMonth()+1===mo&&x.getDate()===d?iso:''};
function enhance(src){
  if(!src||src.dataset.vkvDateUi==='1'||src.type!=='date')return;
  src.dataset.vkvDateUi='1';
  const wrap=document.createElement('span');wrap.className='vkv-date-wrap';
  const view=document.createElement('input');view.type='text';view.inputMode='numeric';view.placeholder='dd/mm/yyyy';view.autocomplete='off';view.className=src.className;view.value=isoToDisplay(src.value);view.setAttribute('aria-label',src.getAttribute('aria-label')||src.name||src.id||'Date');
  const btn=document.createElement('button');btn.type='button';btn.className='vkv-date-picker-btn';btn.textContent='📅';btn.title='Choose date';btn.setAttribute('aria-label','Choose date');
  src.parentNode.insertBefore(wrap,src);wrap.append(view,btn,src);
  src.className='vkv-date-native';src.tabIndex=-1;
  const syncView=()=>{if(document.activeElement!==view){const x=isoToDisplay(src.value);if(view.value!==x)view.value=x}view.disabled=src.disabled;btn.disabled=src.disabled};
  const commit=(report=false)=>{const raw=view.value.trim();if(!raw){src.value='';view.setCustomValidity('');src.dispatchEvent(new Event('input',{bubbles:true}));src.dispatchEvent(new Event('change',{bubbles:true}));return true}const iso=displayToIso(raw);const inRange=iso&&(!src.min||iso>=src.min)&&(!src.max||iso<=src.max);if(!inRange){view.setCustomValidity('Use a valid date in dd/mm/yyyy format.');if(report)view.reportValidity();return false}view.setCustomValidity('');view.value=isoToDisplay(iso);if(src.value!==iso){src.value=iso;src.dispatchEvent(new Event('input',{bubbles:true}));src.dispatchEvent(new Event('change',{bubbles:true}))}return true};
  view.addEventListener('blur',()=>commit(true));
  view.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit(true);view.blur()}});
  src.addEventListener('input',syncView);src.addEventListener('change',syncView);
  btn.addEventListener('click',()=>{if(src.disabled)return;try{if(typeof src.showPicker==='function')src.showPicker();else src.click()}catch(_){src.click()}});
  syncView();
}
function normalizeText(el){if(!el||el.dataset.vkvDateText==='1'||el.type!=='text')return;const hint=`${el.placeholder||''} ${el.getAttribute('aria-label')||''}`.toLowerCase();if(!hint.includes('dd/mm/yyyy'))return;el.dataset.vkvDateText='1';el.addEventListener('blur',()=>{const iso=displayToIso(el.value);if(iso)el.value=isoToDisplay(iso)});
}
function scan(root=document){root.querySelectorAll?.('input[type="date"]').forEach(enhance);root.querySelectorAll?.('input[type="text"]').forEach(normalizeText)}
const css=document.createElement('style');css.id='vkvDateUiCss';css.textContent=`.vkv-date-wrap{display:flex;align-items:stretch;gap:6px;position:relative;width:100%}.vkv-date-wrap>input[type="text"]{min-width:0;flex:1}.vkv-date-picker-btn{width:auto!important;min-width:44px!important;padding:8px 10px!important;white-space:nowrap}.vkv-date-native{position:absolute!important;left:0!important;bottom:0!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;padding:0!important;border:0!important}.vkv-date-wrap input:invalid{border-color:#b74b4b!important}`;document.head.appendChild(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(),{once:true});else scan();
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('input[type="date"]'))enhance(n);else scan(n)}}))).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>document.querySelectorAll('input.vkv-date-native').forEach(src=>{const view=src.parentElement?.querySelector('input[type="text"]');if(view&&document.activeElement!==view){const x=isoToDisplay(src.value);if(view.value!==x)view.value=x}}),750);
window.VKVDateUI={isoToDisplay,displayToIso,scan};
})();