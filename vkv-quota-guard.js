/* VKVTT Preview 2 — quota guard. Must load before cloud modules. */
(()=>{'use strict';
if(window.__vkvQuotaGuardInstalled)return;window.__vkvQuotaGuardInstalled=true;
const nativeSetInterval=window.setInterval.bind(window);
window.setInterval=function(fn,delay,...args){
  let d=Number(delay)||0;
  /* Firestore cloud loops in v66-home-cloud currently use 5s, 10s and 60s polling.
     Slow only those background-sized intervals. Fast UI timers (<5s) remain untouched. */
  if(d>=5000&&d<10000)d=300000;       // 5s -> 5 min
  else if(d>=10000&&d<60000)d=600000; // 10s -> 10 min
  else if(d>=60000&&d<=120000)d=900000; // 1-2 min -> 15 min
  return nativeSetInterval(fn,d,...args);
};
window.__vkvQuotaGuard={installed:true,policy:'5s→5m; 10s→10m; 60-120s→15m',installedAt:Date.now()};
})();
