/* Service Worker MACOF Holding — PWA
 * Stratégies :
 *  - Navigations : network-first avec repli sur le shell en cache (mode hors-ligne)
 *  - Assets statiques same-origin (/assets/...) : cache-first (fichiers hashés immuables)
 *  - API (/api/) : toujours réseau, jamais mise en cache (données sensibles/temps réel)
 *  - Images distantes (Vercel Blob) : stale-while-revalidate
 */
const VERSION = 'macof-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API : réseau uniquement (jamais de cache pour les données)
  if (url.pathname.startsWith('/api/')) return;

  // Navigations : network-first, repli shell hors-ligne
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() =>
          caches
            .match('/index.html')
            .then(
              (cached) =>
                cached ||
                new Response(
                  '<!doctype html><meta charset="utf-8"><title>Hors ligne</title><style>body{background:#0b1220;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}</style><div><h1 style="color:#cda434">MACOF Holding</h1><p>Vous êtes hors ligne. Reconnectez-vous pour accéder au site.</p></div>',
                  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                )
            )
        )
    );
    return;
  }

  // Assets statiques locaux (hashés) : cache-first
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Images et médias distants : stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
