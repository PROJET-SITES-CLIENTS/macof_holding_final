/* Service Worker MACOF Holding — PWA
 * Stratégies :
 *  - Navigations : network-first avec repli sur le shell en cache (mode hors-ligne)
 *  - Assets statiques same-origin (/assets/...) : cache-first (fichiers hashés immuables)
 *  - API (/api/) : toujours réseau, jamais mise en cache (données sensibles/temps réel)
 *  - Images distantes (Vercel Blob) : stale-while-revalidate
 */
const VERSION = 'macof-v2';
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

/* ─── Notifications push (campagnes publicitaires) ────────────────────────── */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'MACOF Holding', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'MACOF Holding';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.campaignId ? `macof-campaign-${data.campaignId}` : undefined,
    data: { url: data.url || '/' },
    vibrate: [80, 40, 80],
  };
  // Affiche l'affiche/GIF directement dans la notification (Android)
  if (data.image && typeof data.image === 'string' && data.image.startsWith('http')) {
    options.image = data.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Réutilise un onglet/une fenêtre déjà ouvert si possible
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) return client.navigate(targetUrl).catch(() => {});
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Abonnement expiré/renouvelé par le service push → on ré-enregistre côté API
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : {})
      .then((subscription) =>
        fetch('https://macof-holding-backend.vercel.app/api/v1/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        })
      )
      .catch(() => {})
  );
});
