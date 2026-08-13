const CACHE='ex-aljazira-rc3-minimal-20260813';
const CORE=[
  './','./index.html','./bootstrap.js','./game.js','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png','./version.json',
  './menu-ui.js','./assets/menu-cover.webp','./assets/menu-cover.jpg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CORE.map(async url=>{
      const res=await fetch(url,{cache:'reload'});
      if(res.ok) await cache.put(url,res.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  if(url.origin===location.origin){
    event.respondWith((async()=>{
      try{
        const res=await fetch(event.request,{cache:'no-store'});
        if(res.ok){
          const cache=await caches.open(CACHE);
          cache.put(event.request,res.clone());
        }
        return res;
      }catch(err){
        return (await caches.match(event.request)) ||
               (event.request.mode==='navigate' ? await caches.match('./index.html') : Response.error());
      }
    })());
    return;
  }

  if(url.hostname==='cdn.jsdelivr.net'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(event.request);
      if(cached) return cached;
      const res=await fetch(event.request);
      if(res.ok) cache.put(event.request,res.clone());
      return res;
    })());
  }
});
