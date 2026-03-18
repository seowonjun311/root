const CACHE_VERSION = 'v1';
const CACHE_NAME = `root-app-${CACHE_VERSION}`;

// Critical chunks identified from build analysis
const CRITICAL_ASSETS = [
  '/index.html',
  '/src/main.jsx',
  // Core fonts
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&family=Noto+Serif+KR:wght@400;600;700;900&display=swap',
  // Critical app routes (lazy-loaded chunks)
  '/src/pages/Home.jsx',
  '/src/pages/Records.jsx',
  '/src/components/layout/AppLayout.jsx',
  '/src/components/home/ActionGoalCard.jsx',
  '/src/components/home/CharacterBanner.jsx',
  '/src/components/home/CategoryTabs.jsx',
  // Base44 SDK
  '/node_modules/@base44/sdk/dist/index.js',
];

// Assets to precache on install (smaller set for faster install)
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
        self.skipWaiting(); // Activate immediately
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
 * Cache-first strategy for assets
 * Critical chunks cached immediately; other assets cached on first request
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (only handle same-origin)
  if (url.origin !== self.location.origin) {
    // For external resources (fonts, images), use cache-first with network fallback
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
                // Cache successful responses
                if (response.ok && !response.url.includes('.js')) {
                  const cache = caches.open(CACHE_NAME);
                  cache.then((c) => c.put(request, response.clone()));
                }
                return response;
              })
              .catch(() => {
                // Return offline placeholder for images
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

  // Routes requiring network-first strategy (dynamic content)
  const networkFirst = ['/api/', '/auth', '/entities', '/functions'];
  const shouldNetworkFirst = networkFirst.some((path) =>
    url.pathname.startsWith(path)
  );

  if (shouldNetworkFirst) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for network errors
          return (
            caches.match(request).then((response) => {
              return (
                response ||
                new Response(
                  JSON.stringify({
                    error: 'Offline - cached data unavailable',
                  }),
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
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          // Cache hit - return response
          return response;
        }

        return fetch(request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone response for caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});

/**
 * Background sync for critical chunk caching
 * Pre-cache critical assets in background when online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'precache-critical') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Precaching critical chunks...');
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

console.log('[Service Worker] Initialized');
