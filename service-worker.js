const NEXUS_CACHE = "nexus-pwa-v1-supabase-20260703";
const ASSETS = ["./","./index.html","./supabase-config.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install", e => {e.waitUntil(caches.open(NEXUS_CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));});
self.addEventListener("activate", e => {e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== NEXUS_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));});
self.addEventListener("fetch", e => {
  const req=e.request, url=new URL(req.url);
  if(url.hostname.includes("supabase.co") || url.hostname.includes("jsdelivr.net")) return;
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(NEXUS_CACHE).then(c=>c.put("./index.html",copy));return res;}).catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(cached=>cached || fetch(req).then(res=>{const copy=res.clone();caches.open(NEXUS_CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>cached)));
});
