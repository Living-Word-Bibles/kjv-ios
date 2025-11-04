const CACHE = "lwb-kjv-v1";

// Precache core shell + essentials
const PRECACHE = [
  "/kjv-ios/",
  "/kjv-ios/index.html",
  "/kjv-ios/manifest.webmanifest",
  "/kjv-ios/sw.js",
  "/kjv-ios/icons/icon-192.png",
  "/kjv-ios/icons/icon-512.png",
  "/kjv-ios/Bible-kjv-master/Books.json"
];

// Cache-first for local Bible JSON; network-first for everything else (with cache fallback)
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Serve local Bible data from cache first
  if (url.pathname.startsWith("/kjv-ios/Bible-kjv-master/")) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ||
        fetch(e.request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return resp;
        })
      )
    );
    return;
  }

  // App shell: network-first with fallback to cache
  e.respondWith(
    fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
