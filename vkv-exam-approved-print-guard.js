(()=>{
  'use strict';
  // Compatibility shim only. The previously separate approved-print renderer was
  // retired because the Examination Module has one frozen official renderer:
  // vkv-exam-output-finalizer.js + vkv-exam-final-print-layout.js (c3fe9c21).
  if(document.querySelector('script[data-vkv-exam-shared-official-print]'))return;
  const s=document.createElement('script');
  s.src='vkv-exam-shared-official-print-adapter.js?v=20260908-approved-renderer-1';
  s.dataset.vkvExamSharedOfficialPrint='1';
  document.head.appendChild(s);
})();