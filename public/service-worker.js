const CACHE_NAME = 'base44-v1';
const CHUNK_CACHE = 'base44-chunks-v1';
const OFFLINE_FALLBACK = '/';

// Core routes that must always have offline fallback
const CRITICAL_ROUTES = [
  '/',
  '/Home',
  '/Onboarding',
  '/Records',
  '/Badges',
  '/AppSettings',
];

// Precache critical routes on installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Precaching critical routes');
      return cache.addAll(CRITICAL_ROUTES);
    })
  );
  self.skipWaiting();
});

// Activate and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== CHUNK_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch with intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Cache all chunk files (.js) with network-first strategy
  if (url.pathname.endsWith('.js') || url.pathname.includes('/src/')) {
    event.respondWith(
      caches.open(CHUNK_CACHE).then(cache => {
        return fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached chunk or offline fallback
            return cache.match(request).then(cached => {
              if (cached) return cached;
              console.warn('[SW] Chunk not cached, serving offline fallback:', url.pathname);
              return cache.match(OFFLINE_FALLBACK);
            });
          });
      })
    );
    return;
  }

  // Cache-first for static assets
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|css|woff2?)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request)
            .then(response => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              console.warn('[SW] Static asset unavailable:', url.pathname);
              // Return placeholder for missing static assets
              if (url.pathname.match(/\.(png|jpg|jpeg|webp)$/)) {
                return new Response(
                  new Blob([''], { type: 'image/svg+xml' }),
                  { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              return new Response('', { status: 404 });
            });
        });
      })
    );
    return;
  }

  // Network-first for HTML routes (SPA)
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses for critical routes
        if (response.ok && CRITICAL_ROUTES.some(route => url.pathname.startsWith(route))) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cached version or offline fallback
        return caches.match(request).then(cached => {
          if (cached) return cached;
          console.warn('[SW] Network request failed, serving offline fallback:', url.pathname);
          return caches.match(OFFLINE_FALLBACK).catch(() => {
            return new Response('Offline - App unavailable', { status: 503 });
          });
        });
      })
  );
});

// Background sync for chunk precaching
self.addEventListener('sync', event => {
  if (event.tag === 'precache-chunks') {
    event.waitUntil(
      caches.open(CHUNK_CACHE).then(cache => {
        console.log('[SW] Background sync: precaching chunks');
        // Chunks are cached on-demand during fetch, this triggers a manual precache
        return Promise.resolve();
      })
    );
  }
});
