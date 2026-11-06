// Caché exclusivamente de archivos visuales de JOTAPE; las llamadas a Gemini nunca se almacenan.
const CACHE='jotape-static-a26-v1';
const CORE=['/','/manifest.webmanifest','/icons/jotape-192.png','/icons/jotape-512.png','/sprites/jotape_turn_05.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin||new URL(r.url).pathname.startsWith('/api/')||new URL(r.url).pathname.startsWith('/.netlify/'))return;
  event.respondWith(fetch(r).then(resp=>{if(resp.ok){const clone=resp.clone();caches.open(CACHE).then(cache=>cache.put(r,clone)).catch(()=>{})}return resp}).catch(()=>caches.match(r).then(cached=>cached||Response.error())));
});
