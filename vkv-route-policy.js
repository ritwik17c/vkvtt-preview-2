/* VKVTT Preview 2 · single navigation policy.
   Purpose: inherited Preview1 pages may keep Preview1 <base>. This policy owns user-facing Home/Admin return routes.
   It is environment-derived so the same file can move to production later without hard-coding Preview2. */
(()=>{'use strict';
const seg=location.pathname.split('/').filter(Boolean)[0]||'vkvtt-preview-2';
const ROOT='/' + seg + '/';
const HOME=ROOT;
const ADMIN=ROOT+'admin-dashboard.html';
const norm=s=>String(s||'').replace(/[^A-Za-z0-9]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
function targetFor(el){
 const t=norm(el.textContent);
 if(/(^| )admin dashboard($| )/.test(t)||t==='return to admin dashboard')return ADMIN;
 if(t==='home'||t==='timetable home'||t==='return home'||t==='home reset view'||t==='back to home')return HOME;
 return '';
}
function fix(){
 document.querySelectorAll('a,button,[role="button"]').forEach(el=>{
   const target=targetFor(el);if(!target)return;
   if(el.tagName==='A')el.setAttribute('href',target);
   el.dataset.vkvRouteTarget=target;
 });
}
document.addEventListener('click',e=>{
 const el=e.target.closest('a,button,[role="button"]');if(!el)return;
 const target=el.dataset.vkvRouteTarget||targetFor(el);if(!target)return;
 e.preventDefault();e.stopImmediatePropagation();location.href=target;
},true);
fix();
new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
window.__vkvRoutePolicy={root:ROOT,home:HOME,admin:ADMIN,fix};
})();