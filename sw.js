const CACHE_NAME='vkvtt-shell-2026-09-08-theme4';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vkv-campus-header.jpg','./vkv-theme.js','./vkv-light-screen.css','./vkv-black-gold-screen.css','./v66-home.css','./v66-design-system.css','./v66-home.js','./v66-home-cloud.js','./v66-ui.js','./period-notifications.js','./v66-home-shell-v662.css','./v66-home-shell-v662.js','./v66-premium-unified.css'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});

function injectThemeController(html){
  if(/vkv-theme\.js/i.test(html))return html;
  const tag='<script src="./vkv-theme.js?v=20260908-theme4"></script>';
  if(/<\/head>/i.test(html))return html.replace(/<\/head>/i,tag+'</head>');
  if(/<body/i.test(html))return html.replace(/<body/i,tag+'<body');
  return tag+html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const type=response.headers.get('content-type')||'';
        if(response.ok&&/text\/html/i.test(type)){
          const html=injectThemeController(await response.text());
          const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.delete('Content-Length');
          return new Response(html,{status:response.status,statusText:response.statusText,headers});
        }
        return response;
      }catch(_){
        const hit=await caches.match(event.request);return hit||caches.match('./index.html');
      }
    })());
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});

self.addEventListener('message',event=>{const d=event.data||{};if(d.type!=='VKVTT_SHOW_NOTIFICATION'||!d.title)return;const icon=new URL('icon-192.png',self.registration.scope).href;event.waitUntil(self.registration.showNotification(d.title,{body:d.body||'',icon,badge:icon,tag:d.tag||'vkvtt-period-reminder',renotify:false,data:{url:d.url||self.registration.scope}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification.data?.url||self.registration.scope;event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c){c.navigate(url);return c.focus();}}return clients.openWindow?clients.openWindow(url):undefined;}));});
