const CACHE_VERSION = 'v1';
const CACHE_NAME = `root-app-${CACHE_VERSION}`;

// Production route entry points for caching
const LAZY_LOADED_CHUNKS = [
  // Core routes
  '/',
  '/index.html',
  '/Home',
  '/Records', 
  '/CreateGoal',
  '/AppSettings',
  '/NotificationSettings',
  '/Badges',
  '/Onboarding',
];

// Critical assets for immediate precaching
const CRITICAL_ASSETS = [
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&family=Noto+Serif+KR:wght@400;600;700;900&display=swap',
];

// Minimal precache on install
const PRECACHE_ASSETS = [
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching critical assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Vite production-aware fetch strategy
 * - Cache-first for /assets/ (hashed chunks)
 * - Network-first for API calls
 * - Cache-first for external resources (fonts, images)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ── External resources: fonts, images (cache-first) ──
  if (url.origin !== self.location.origin) {
    if (
      request.destination === 'font' ||
      request.destination === 'image' ||
      url.hostname === 'fonts.googleapis.com'
    ) {
      event.respondWith(
        caches
          .match(request)
          .then((response) => {
            if (response) return response;
            return fetch(request)
              .then((response) => {
                if (response.ok && response.status === 200) {
                  const cache = caches.open(CACHE_NAME);
                  cache.then((c) => c.put(request, response.clone()));
                }
                return response;
              })
              .catch(() => {
                // Fallback for images when offline
                if (request.destination === 'image') {
                  return new Response(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="12" fill="#999">Offline</text></svg>',
                    {
                      headers: { 'Content-Type': 'image/svg+xml' },
                    }
                  );
                }
                return new Response('Offline', { status: 503 });
              });
          })
      );
    }
    return;
  }

  // ── Same-origin requests ──
  
  // API routes: network-first with cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth') || url.pathname.startsWith('/entities')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return (
            caches.match(request).then((response) => {
              return (
                response ||
                new Response(
                  JSON.stringify({ error: 'Offline - cached data unavailable' }),
                  {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                  }
                )
              );
            })
          );
        })
    );
    return;
  }

  // Vite production chunks in /assets/: cache-first strategy
  // These are immutable due to content hashing
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              console.log(`[Service Worker] Cached asset: ${request.url}`);
            });
            return response;
          });
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request).then((response) => {
            return response || new Response('Offline - chunk unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // HTML routes: network-first (allows cache busting with new SW)
  if (request.destination === '' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return (
              response ||
              caches.match('/index.html').then((indexResponse) => {
                return (
                  indexResponse ||
                  new Response('Offline - app shell unavailable', { status: 503 })
                );
              })
            );
          });
        })
    );
    return;
  }

  // Default: cache-first for other static assets
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        return new Response('Offline', { status: 503 });
      })
  );
});

/**
 * Background sync for lazy-loaded chunk caching
 * Pre-cache route entry points when online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'precache-chunks') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          console.log('[Service Worker] Precaching production routes...');
          
          for (const route of LAZY_LOADED_CHUNKS) {
            try {
              const response = await fetch(route);
              if (response.ok) {
                cache.put(route, response.clone());
                console.log(`[Service Worker] Cached route: ${route}`);
              }
            } catch (error) {
              console.warn(`[Service Worker] Failed to cache ${route}:`, error);
            }
          }
          
          console.log('[Service Worker] Production route caching complete');
        } catch (error) {
          console.error('[Service Worker] Background sync error:', error);
        }
      })()
    );
  }
  
  if (event.tag === 'precache-critical') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Precaching critical assets...');
        return Promise.allSettled(
          CRITICAL_ASSETS.map((asset) => {
            return cache.add(asset).catch((error) => {
              console.warn(`[Service Worker] Failed to cache ${asset}:`, error);
            });
          })
        );
      })
    );
  }
});

console.log('[Service Worker] Initialized with production-aware caching (Vite /assets/)');
