/*
VKV Nalbari Timetable — Cloud v64.4 proxy-navigation patch

Place in repository root and load after the existing index.html scripts:
<script src="v64-index-addon.js"></script>
*/
(() => {
  const style=document.createElement('style');
  style.textContent=`
    button:not(:disabled),a[href],[role="button"],summary,.tile,[onclick]{cursor:pointer!important}
    button:disabled{cursor:not-allowed!important}
    #publishedProxyBtn{display:block!important}
  `;
  document.head.appendChild(style);

  function apply(){
    const published=document.getElementById('publishedProxyBtn');
    if(published){
      published.innerHTML="✅ Today’s Proxy Allotment (All Teachers)";
      published.title="Complete school-wide proxy allotment for all teachers. The button remains available even before finalisation.";
    }

    const my=document.getElementById('myProxyTodayBtn');
    if(my)my.title="Only the proxy classes allotted to the signed-in teacher.";

    const allot=document.getElementById('proxyWorkBtn');
    if(allot)allot.title="Working screen for the Proxy Manager / Manager / Admin to allot proxies.";

    const heading=document.querySelector('#publishedProxy h2');
    if(heading){
      const dateSpan=document.getElementById('publishedProxyDate');
      heading.childNodes.forEach(n=>{
        if(n.nodeType===Node.TEXT_NODE && n.textContent.trim()) n.textContent="Today’s Proxy Classes ";
      });
      if(dateSpan && !heading.contains(dateSpan))heading.appendChild(dateSpan);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();