/**
 * Service Worker for offline support and performance caching
 * Caches primary application chunks and assets for WebView resilience
 */

const CACHE_VERSION = 'app-v1';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Critical chunks to cache on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache critical assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE && !cacheName.startsWith(CACHE_VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: network-first for dynamic content, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests: network-first with cache fallback
  if (url.pathname.includes('/api/') || url.pathname.includes('/base44')) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cacheCopy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline: Unable to fetch', { status: 503 });
          });
        })
    );
  }

  // Static assets (JS chunks, CSS, fonts): cache-first
  if (
    request.url.includes('.js') ||
    request.url.includes('.css') ||
    request.url.includes('.woff') ||
    request.url.includes('.woff2') ||
    request.url.includes('.ttf') ||
    request.url.includes('.eot')
  ) {
    return event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cacheCopy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return response;
        });
      })
    );
  }

  // HTML and other assets: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful HTML responses
        if (response.ok && (request.url.includes('.html') || request.url === self.location.origin + '/')) {
          const cacheCopy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, cacheCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});
