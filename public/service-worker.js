/**
 * Service Worker for Android WebView Offline Support
 * Implements strict cache versioning and max-age policies for static assets
 * 
 * Cache Strategy:
 * - HTML: Network first, fallback to cache (short max-age: 1 day)
 * - JS/CSS: Cache first, fallback to network (long max-age: 30 days)
 * - Images: Cache first, fallback to network (long max-age: 30 days)
 * - API: Network first, fallback to cache (short max-age: 5 minutes)
 */

const CACHE_VERSION = 'v1.0.3';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const API_CACHE = `${CACHE_VERSION}-api`;

/**
 * Asset patterns with strict cache policies
 */
const CACHE_PATTERNS = {
  // HTML files: Network first, 1 day max-age
  html: {
    pattern: /\.html$/,
    cacheName: RUNTIME_CACHE,
    strategy: 'network-first',
    maxAge: 86400, // 1 day in seconds
  },
  // JS chunks: Cache first, 30 day max-age
  js: {
    pattern: /\.js$/,
    cacheName: ASSETS_CACHE,
    strategy: 'cache-first',
    maxAge: 2592000, // 30 days in seconds
  },
  // CSS files: Cache first, 30 day max-age
  css: {
    pattern: /\.css$/,
    cacheName: ASSETS_CACHE,
    strategy: 'cache-first',
    maxAge: 2592000, // 30 days in seconds
  },
  // Image assets: Cache first, 30 day max-age
  images: {
    pattern: /\.(png|jpg|jpeg|svg|webp|gif)$/i,
    cacheName: ASSETS_CACHE,
    strategy: 'cache-first',
    maxAge: 2592000, // 30 days in seconds
  },
  // API calls: Network first, 5 minute max-age
  api: {
    pattern: /^https:\/\/.*\/api\//,
    cacheName: API_CACHE,
    strategy: 'network-first',
    maxAge: 300, // 5 minutes in seconds
  },
};

/**
 * Install event: pre-cache critical assets
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing Service Worker ${CACHE_VERSION}`);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(ASSETS_CACHE);
        const criticalAssets = [
          '/',
          '/index.html',
          '/manifest.json',
        ];

        // Cache critical assets with version prefix
        await Promise.all(
          criticalAssets.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
            })
          )
        );

        console.log('[SW] Critical assets cached successfully');
        self.skipWaiting(); // Activate immediately
      } catch (error) {
        console.error('[SW] Install error:', error);
      }
    })()
  );
});

/**
 * Activate event: cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');

  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const currentCaches = [RUNTIME_CACHE, ASSETS_CACHE, API_CACHE];

        // Delete old cache versions
        await Promise.all(
          cacheNames.map((name) => {
            if (!currentCaches.includes(name)) {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            }
          })
        );

        console.log('[SW] Cache cleanup complete');
        self.clients.claim(); // Take control of existing pages
      } catch (error) {
        console.error('[SW] Activation error:', error);
      }
    })()
  );
});

/**
 * Fetch event: implement cache strategy based on URL pattern
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Determine cache strategy based on URL pattern
  let strategy = 'network-first';
  let cacheName = RUNTIME_CACHE;
  let maxAge = 86400;

  for (const [, config] of Object.entries(CACHE_PATTERNS)) {
    if (config.pattern.test(request.url)) {
      strategy = config.strategy;
      cacheName = config.cacheName;
      maxAge = config.maxAge;
      break;
    }
  }

  // Execute appropriate strategy
  if (strategy === 'cache-first') {
    event.respondWith(cacheFirstStrategy(request, cacheName, maxAge));
  } else {
    event.respondWith(networkFirstStrategy(request, cacheName, maxAge));
  }
});

/**
 * Cache-first strategy: use cache if available, fallback to network
 * @param {Request} request - Fetch request
 * @param {string} cacheName - Cache to use
 * @param {number} maxAge - Cache max age in seconds
 */
async function cacheFirstStrategy(request, cacheName, maxAge) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      const cacheTime = getCacheTime(cachedResponse);
      if (cacheTime && isExpired(cacheTime, maxAge)) {
        console.debug(`[SW] Cache expired for ${request.url}, fetching fresh`);
        return fetchAndCache(request, cacheName);
      }
      return cachedResponse;
    }

    // Cache miss: fetch from network
    return await fetchAndCache(request, cacheName);
  } catch (error) {
    console.warn(`[SW] Cache-first strategy failed for ${request.url}:`, error);
    return new Response('Offline - Resource unavailable', { status: 503 });
  }
}

/**
 * Network-first strategy: try network first, fallback to cache
 * @param {Request} request - Fetch request
 * @param {string} cacheName - Cache to use
 * @param {number} maxAge - Cache max age in seconds
 */
async function networkFirstStrategy(request, cacheName, maxAge) {
  try {
    // Try network first
    const response = await fetch(request.clone());

    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      const headersWithTime = new Headers(responseToCache.headers);
      headersWithTime.set('x-cache-time', Date.now().toString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headersWithTime,
      });

      cache.put(request, cachedResponse);
    }

    return response;
  } catch (error) {
    console.warn(`[SW] Network request failed for ${request.url}, using cache`);

    // Network failed: try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    return new Response('Offline - Network unavailable', { status: 503 });
  }
}

/**
 * Fetch from network and cache response
 */
async function fetchAndCache(request, cacheName) {
  const response = await fetch(request.clone());

  if (!response.ok) {
    return response;
  }

  // Cache successful responses with timestamp
  const cache = await caches.open(cacheName);
  const responseToCache = response.clone();
  const headersWithTime = new Headers(responseToCache.headers);
  headersWithTime.set('x-cache-time', Date.now().toString());

  const cachedResponse = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headersWithTime,
  });

  cache.put(request, cachedResponse);
  return response;
}

/**
 * Extract cache timestamp from response headers
 */
function getCacheTime(response) {
  const cacheTime = response.headers.get('x-cache-time');
  return cacheTime ? parseInt(cacheTime, 10) : null;
}

/**
 * Check if cached response has expired
 */
function isExpired(cacheTime, maxAge) {
  const now = Date.now();
  const ageSeconds = (now - cacheTime) / 1000;
  return ageSeconds > maxAge;
}

/**
 * Message handler for cache control
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[SW] All caches cleared');
    })();
  }

  if (event.data.type === 'CACHE_STATUS') {
    (async () => {
      const cacheNames = await caches.keys();
      const status = {
        activeCaches: cacheNames,
        currentVersion: CACHE_VERSION,
      };
      event.ports[0].postMessage(status);
    })();
  }
});

console.log(`[SW] Service Worker ${CACHE_VERSION} loaded`);
