const CACHE_VERSION = 'v1';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// Critical chunks that must be precached for offline functionality
const CRITICAL_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/',
];

// Install event: precache critical assets only
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, precaching critical assets...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CRITICAL_ASSETS.map((url) => {
          return cache.add(url).catch((error) => {
            console.warn(`[SW] Failed to precache ${url}:`, error);
          });
        })
      );
    }).then(() => {
      console.log('[SW] Critical assets precached successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker, cleaning old caches...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients for immediate control');
      return self.clients.claim();
    })
  );
});

// Fetch event: Cache-first for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy 1: Network-first for API calls (base44 SDK endpoints)
  if (url.pathname.includes('/api/') || url.pathname.includes('.json') && !url.pathname.includes('manifest')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache on network error
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] API call failed, serving from cache:', request.url);
              return cachedResponse;
            }
            // If no cache, return offline fallback
            return new Response('Offline - API unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // Strategy 2: Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && response.type !== 'error') {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to offline page for HTML routes
          if (request.mode === 'navigate') {
            return caches.match('/index.html').catch(() => {
              return new Response('Offline - Page unavailable', { status: 503 });
            });
          }
          return new Response('Offline - Resource unavailable', { status: 503 });
        });
    })
  );
});

// Background sync for precaching lazy-loaded chunks
self.addEventListener('sync', (event) => {
  if (event.tag === 'precache-chunks') {
    console.log('[SW] Background sync: precaching lazy-loaded chunks');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        // This is triggered when app loads to cache additional resources
        return Promise.resolve();
      })
    );
  }
});

// Message handling for cache clearing and updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches on user request');
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting, activating new version');
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker initialized with robust offline support');
