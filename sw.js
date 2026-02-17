const CACHE_NAME = 'rt-cakap-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Special-case tessdata: try cache first, then network and cache
  if (url.pathname.startsWith('/tessdata/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const resp = await fetch(event.request);
          if (resp && resp.ok) {
            cache.put(event.request, resp.clone());
          }
          return resp;
        } catch (err) {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Default: cache-first for known assets, fallback to network
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).catch(() => caches.match('/')))
  );
});
