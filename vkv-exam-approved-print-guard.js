(()=>{
  'use strict';
  // Production freshness check. This does not cache VKVTT assets; it only detects
  // a newer central build and clears any stale Cache Storage/service-worker residue.
  if(!document.querySelector('script[data-vkv-cache-bootstrap]')){
    const c=document.createElement('script');
    c.src='vkv-cache-bootstrap.js?v=20260908-production-cache-1';
    c.dataset.vkvCacheBootstrap='1';
    document.head.appendChild(c);
  }
  // Compatibility shim only. The previously separate approved-print renderer was
  // retired because the Examination Module has one frozen official renderer:
  // vkv-exam-output-finalizer.js + vkv-exam-final-print-layout.js (c3fe9c21).
  if(document.querySelector('script[data-vkv-exam-shared-official-print]'))return;
  const s=document.createElement('script');
  s.src='vkv-exam-shared-official-print-adapter.js?v=20260908-approved-renderer-1';
  s.dataset.vkvExamSharedOfficialPrint='1';
  document.head.appendChild(s);
})();