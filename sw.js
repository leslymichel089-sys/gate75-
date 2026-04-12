// GATE 75 — Service Worker v1.0
// © 2026 Lesly Tech LLC

const CACHE_NAME = 'gate75-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap'
];

// INSTALL
self.addEventListener('install', event => {
  console.log('[GATE 75 SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { mode: 'no-cors' });
      })).catch(err => {
        console.warn('[GATE 75 SW] Cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('[GATE 75 SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// FETCH — Network first, cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API calls
  if (request.method !== 'GET') return;
  if (url.hostname.includes('groq.com')) return;
  if (url.hostname.includes('api.')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(request, clone); } catch(e) {}
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // Offline fallback for navigation
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// BACKGROUND SYNC (future)
self.addEventListener('sync', event => {
  if (event.tag === 'gate75-sync') {
    console.log('[GATE 75 SW] Background sync triggered');
  }
});

// PUSH NOTIFICATIONS (future)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || 'GATE 75', {
    body: data.body || 'Nouvelle mise à jour disponible',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'gate75-notif'
  });
});
