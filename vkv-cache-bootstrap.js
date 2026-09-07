(()=>{
  'use strict';
  const KEY='vkvtt:build';
  const PARAM='vkv_build';
  const manifestUrl=new URL('vkv-build.json',document.baseURI);
  manifestUrl.searchParams.set('_',String(Date.now()));

  async function clearRuntimeCaches(){
    try{
      if('caches' in window){
        const names=await caches.keys();
        await Promise.all(names.map(name=>caches.delete(name)));
      }
    }catch(e){console.info('[VKVTT build] Cache Storage cleanup skipped:',e?.message||e)}
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg=>reg.unregister()));
      }
    }catch(e){console.info('[VKVTT build] Service-worker cleanup skipped:',e?.message||e)}
  }

  async function check(){
    try{
      const response=await fetch(manifestUrl.href,{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)throw new Error('Build manifest unavailable ('+response.status+')');
      const manifest=await response.json();
      const build=String(manifest?.build||'').trim();
      if(!build)return;
      window.VKVTT_BUILD=build;
      document.documentElement.dataset.vkvBuild=build;

      const known=localStorage.getItem(KEY)||'';
      const url=new URL(location.href);
      const pageBuild=url.searchParams.get(PARAM)||'';
      if(known===build&&pageBuild===build)return;

      localStorage.setItem(KEY,build);
      await clearRuntimeCaches();

      if(pageBuild!==build){
        url.searchParams.set(PARAM,build);
        location.replace(url.href);
      }
    }catch(e){
      console.info('[VKVTT build] Freshness check skipped:',e?.message||e);
    }
  }

  check();
})();
