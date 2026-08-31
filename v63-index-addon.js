/*
VKV Nalbari Timetable — Cloud v63.0 UI retention patch
Load after the existing index.html scripts:
<script src="v63-index-addon.js"></script>
*/
(() => {
  const style=document.createElement('style');
  style.textContent=`
    button:not(:disabled),a[href],[role="button"],summary,.tile,[onclick]{cursor:pointer!important}
    button:disabled{cursor:not-allowed!important}
    #publishedProxyBtn{display:block!important}
  `;
  document.head.appendChild(style);

  function retain(){
    const btn=document.getElementById('publishedProxyBtn');
    if(btn){
      btn.style.display='block';
      btn.innerHTML="✅ Today’s Allotted Proxy";
      btn.title="Open today’s final proxy allotment. If it has not yet been finalised, the page will say so.";
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retain);else retain();
})();