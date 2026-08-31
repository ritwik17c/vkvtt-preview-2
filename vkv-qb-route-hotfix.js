/* Temporary production route hotfix: bypass cached/broken QB launcher and open safe core directly. */
(()=>{
  'use strict';
  const target='./qb-safe.html?v=20260831-safe-direct-1';
  function apply(){
    document.querySelectorAll('a').forEach(a=>{
      const text=(a.textContent||'').toLowerCase();
      const href=a.getAttribute('href')||'';
      if(text.includes('question bank')||href.includes('qb-module')){
        a.setAttribute('href',target);
      }
    });
  }
  apply();
  const mo=new MutationObserver(apply);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>mo.disconnect(),15000);
})();
