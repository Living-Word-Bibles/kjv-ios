// /sw.js  — LWB KJV PWA (network-first for HTML/JSON; cache-first for assets)
const VERSION = 'lwb-kjv-v6'; // bump when you deploy

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    self.skipWaiting(); // activate immediately
    try {
      const cache = await caches.open(VERSION);
      // Core is optional; keep minimal to avoid cache poisoning
      await cache.addAll([
        '/',            // if your index is at /
        '/manifest.webmanifest',
        '/icons/icon-192.png'
      ].filter(Boolean));
    } catch (_) {}
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // drop old caches
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Let PayPal and other third-party POSTs/redirects pass through untouched
  const thirdParty = /paypal\.com/i.test(url.hostname);
  if (thirdParty) return;

  // Network-first for HTML and JSON (prevents blank screen when JSON updates)
  const isHTML = req.destination === 'document' || req.headers.get('accept')?.includes('text/html');
  const isJSON = url.pathname.endsWith('.json');

  if (isHTML || isJSON) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const copy  = fresh.clone();
        (async () => { try { const c = await caches.open(VERSION); await c.put(req, copy); } catch(_){} })();
        return fresh;
      } catch (_) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Last-resort: show something instead of a blank screen
        if (isHTML) {
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline</title><body style="font-family:sans-serif;padding:24px">Offline or update in progress. Please retry.</body>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
        throw _;
      }
    })());
    return;
  }

  // Cache-first for static assets (png/css/js/fonts), with network fallback
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const resp = await fetch(req);
    try { const c = await caches.open(VERSION); c.put(req, resp.clone()); } catch (_) {}
    return resp;
  })());
});
