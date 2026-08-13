const CACHE='ex-aljazira-rc1-20260813';
const CORE=['./','./index.html','./bootstrap.js','./game.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./version.json'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin===location.origin){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{
      const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res;
    }).catch(()=>caches.match('./index.html'))));
    return;
  }
  if(url.hostname==='cdn.jsdelivr.net'){
    event.respondWith(caches.open(CACHE).then(async c=>{
      const cached=await c.match(event.request);if(cached)return cached;
      const res=await fetch(event.request);if(res.ok)c.put(event.request,res.clone());return res;
    }));
  }
});