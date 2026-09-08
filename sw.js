const CACHE_NAME='vkvtt-shell-2026-09-08-production-candidate-21';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vkv-campus-header.jpg','./vkv-theme.js','./vkv-campus-header-fix.js','./vkv-light-screen.css','./vkv-black-gold-screen.css','./class-observation-admin-bridge.js','./class-observation-teacher-bridge.js','./v66-home.css','./v66-design-system.css','./v66-home.js','./v66-home-cloud.js','./v66-ui.js','./period-notifications.js','./v66-home-shell-v662.css','./v66-home-shell-v662.js','./v66-premium-unified.css','./qb-module-v2.html','./qb-module-v2.js','./qb-module-v3.js','./vkv-qb-paper-scoring.js','./vkv-qb-paper-subquestion-marks.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});

function injectControllers(html,url){
  const tags=[];
  if(!/vkv-theme\.js/i.test(html))tags.push('<script src="./vkv-theme.js?v=20260908-theme5"></script>');
  const path=new URL(url).pathname;
  const isHome=/\/index\.html$/i.test(path)||/\/vkvtt-preview-2\/?$/i.test(path);
  if(isHome&&!/vkv-campus-header-fix\.js/i.test(html))tags.push('<script src="./vkv-campus-header-fix.js?v=20260908-headerfix-1"></script>');
  if(/admin-dashboard\.html$/i.test(path)&&!/class-observation-admin-bridge\.js/i.test(html))tags.push('<script src="./class-observation-admin-bridge.js?v=20260908-observation-2"></script>');
  if(isHome&&!/class-observation-teacher-bridge\.js/i.test(html))tags.push('<script src="./class-observation-teacher-bridge.js?v=20260908-observation-2"></script>');
  if(!tags.length)return html;
  const tag=tags.join('');
  if(/<\/head>/i.test(html))return html.replace(/<\/head>/i,tag+'</head>');
  if(/<body/i.test(html))return html.replace(/<body/i,tag+'<body');
  return tag+html;
}

function isPresentationAsset(request){
  try{
    const p=new URL(request.url).pathname;
    return /\/(vkv-theme\.js|vkv-campus-header-fix\.js|vkv-light-screen\.css|vkv-black-gold-screen\.css|vkv-campus-header\.jpg|v66-home-shell-v662\.css)$/i.test(p);
  }catch(_){return false}
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const type=response.headers.get('content-type')||'';
        if(response.ok&&/text\/html/i.test(type)){
          const html=injectControllers(await response.text(),event.request.url);
          const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.delete('Content-Length');
          return new Response(html,{status:response.status,statusText:response.statusText,headers});
        }
        return response;
      }catch(_){const hit=await caches.match(event.request);return hit||caches.match('./index.html');}
    })());return;
  }
  if(isPresentationAsset(event.request)){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request,{ignoreSearch:true})));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});
self.addEventListener('message',event=>{const d=event.data||{};if(d.type!=='VKVTT_SHOW_NOTIFICATION'||!d.title)return;const icon=new URL('icon-192.png',self.registration.scope).href;event.waitUntil(self.registration.showNotification(d.title,{body:d.body||'',icon,badge:icon,tag:d.tag||'vkvtt-period-reminder',renotify:false,data:{url:d.url||self.registration.scope}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification.data?.url||self.registration.scope;event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c){c.navigate(url);return c.focus();}}return clients.openWindow?clients.openWindow(url):undefined;}));});
