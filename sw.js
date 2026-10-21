const CACHE_NAME='vkvtt-shell-2026-10-16-quarter-runtime-visible-3';
const REMOVED_THEME_ASSET='./vkv-theme-contrast-hardening.css';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vkv-campus-header.jpg','./vkv-theme.js','./vkv-theme-contrast-fixes.css','./vkv-theme-contrast-hardening.css','./vkv-home-header-typography.css','./vkv-home-card-cleanup.js','./vkv-annual-calendar-theme.js','./vkv-light-screen.css','./vkv-black-gold-screen.css','./class-observation-admin-bridge.js','./class-observation-teacher-bridge.js','./v66-home.css','./v66-design-system.css','./v66-home.js','./v66-home-cloud.js','./v66-ui.js','./period-notifications.js','./v66-home-shell-v662.css','./v66-home-shell-v662.js','./v66-premium-unified.css','./qb-module-v2.html','./qb-module-v2.js','./qb-module-v3.js','./vkv-qb-paper-scoring.js','./vkv-qb-paper-subquestion-marks.js','./vkv-qb-admin-production-tools.js','./admin-qb-live-teacher-audit.html','./admin-qb-source-reconcile.html','./admin-qb-submission-integrity-summary.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL.filter(path=>path!==REMOVED_THEME_ASSET))));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
function injectControllers(html,url){
  html=html.replace(/v66-ui\.js(?:\?v=[^\"']*)?/gi,'v66-ui.js?v=20261016-motif-restored-compact-balls-1');
  const tags=[];const path=new URL(url).pathname;const isHome=/\/index\.html$/i.test(path)||/\/(?:vkvtt-preview-2|vkvtt)\/?$/i.test(path);const isAdmin=/admin-dashboard\.html$/i.test(path);
  if(isAdmin){
    html=html
      .replace("const CURRENT_APP_VERSION = '66.0';","const CURRENT_APP_VERSION = '66.4';")
      .replace(/Cloud v66\.0/g,'Cloud v66.4')
      .replace(/v66-admin-reference-polish\.js\?v=[^\"']+/g,'v66-admin-reference-polish.js?v=20260916-disabled-stable-1')
      .replace(/vkv-admin-dashboard-runtime\.js\?v=[^\"']+/g,'vkv-admin-dashboard-runtime.js?v=20261016-quarter-allotment-visible-1')
      .replace(/vkv-theme\.js\?v=[^\"']+/g,'vkv-theme.js?v=20260916-header-safe-1');
  }
  if(!/vkv-theme\.js/i.test(html))tags.push('<script src="./vkv-theme.js?v=20260916-header-safe-1"></script>');
  if(!/vkv-theme-contrast-fixes\.css/i.test(html))tags.push('<link rel="stylesheet" href="./vkv-theme-contrast-fixes.css?v=20260909-contrast2">');
  if(isHome&&!/vkv-home-header-typography\.css/i.test(html))tags.push('<link rel="stylesheet" href="./vkv-home-header-typography.css?v=20260916-theme-zone-1">');
  if(isHome&&!/vkv-home-card-cleanup\.js/i.test(html))tags.push('<script src="./vkv-home-card-cleanup.js?v=20260909-homecards2"></script>');
  if(/annual-calendar-2026-27\.html$/i.test(path)&&!/vkv-annual-calendar-theme\.js/i.test(html))tags.push('<script src="./vkv-annual-calendar-theme.js?v=20260920-calendar-selected-states-1"></script>');
  if(isAdmin&&!/class-observation-admin-bridge\.js/i.test(html))tags.push('<script src="./class-observation-admin-bridge.js?v=20260908-observation-2"></script>');
  if(isHome&&!/class-observation-teacher-bridge\.js/i.test(html))tags.push('<script src="./class-observation-teacher-bridge.js?v=20260908-observation-2"></script>');
  if(/admin-question-bank-v2\.html$/i.test(path)&&!/vkv-qb-admin-production-tools\.js/i.test(html))tags.push('<script src="./vkv-qb-admin-production-tools.js?v=20260908-qb-audit-1"></script>');
  if(!tags.length)return html;const tag=tags.join('');if(/<\/head>/i.test(html))return html.replace(/<\/head>/i,tag+'</head>');if(/<body/i.test(html))return html.replace(/<body/i,tag+'<body');return tag+html;
}
function isPresentationAsset(request){try{const p=new URL(request.url).pathname;return /\/(vkv-theme\.js|vkv-theme-contrast-fixes\.css|vkv-home-header-typography\.css|vkv-home-card-cleanup\.js|vkv-annual-calendar-theme\.js|vkv-light-screen\.css|vkv-black-gold-screen\.css|vkv-campus-header\.jpg|v66-home-shell-v662\.css|v66-ui\.js)$/i.test(p)}catch(_){return false}}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){event.respondWith((async()=>{try{const response=await fetch(event.request,{cache:'no-store'}),type=response.headers.get('content-type')||'';if(response.ok&&/text\/html/i.test(type)){const html=injectControllers(await response.text(),event.request.url),headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.delete('Content-Length');return new Response(html,{status:response.status,statusText:response.statusText,headers})}return response}catch(_){const hit=await caches.match(event.request);const fallback=hit||await caches.match('./index.html');return fallback||new Response('<!doctype html><title>Temporarily unavailable</title><p>VKVTT could not load this page. Please check your connection and reload.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}})());return}
  if(isPresentationAsset(event.request)){event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response}).catch(async()=> (await caches.match(event.request,{ignoreSearch:true}))||new Response('Resource temporarily unavailable',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}})));return}
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response}).catch(async()=> (await caches.match(event.request))||new Response('Resource temporarily unavailable',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}})));
});
self.addEventListener('message',event=>{const d=event.data||{};if(d.type!=='VKVTT_SHOW_NOTIFICATION'||!d.title)return;const icon=new URL('icon-192.png',self.registration.scope).href;event.waitUntil(self.registration.showNotification(d.title,{body:d.body||'',icon,badge:icon,tag:d.tag||'vkvtt-period-reminder',renotify:false,data:{url:d.url||self.registration.scope}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification.data?.url||self.registration.scope;event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c){c.navigate(url);return c.focus()}}return clients.openWindow?clients.openWindow(url):undefined}))});
