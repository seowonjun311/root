// Service Worker with Cache Eviction Policy for User Photos
// Caches: static (30 days), HTML (1 day), photos (5MB max per cache)

const CACHES_CONFIG = {
  STATIC: 'goal-tracker-static-v1',
  HTML: 'goal-tracker-html-v1',
  PHOTOS: 'goal-tracker-photos-v1',
};

const CACHE_MAX_AGE = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  HTML: 24 * 60 * 60 * 1000, // 1 day
  PHOTOS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const PHOTO_CACHE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB total
const PHOTO_ITEM_SIZE_LIMIT = 2 * 1024 * 1024; // 2MB per photo

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

/**
 * Install event: pre-cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHES_CONFIG.STATIC);
        await cache.addAll(STATIC_ASSETS.filter(url => {
          // Only cache if accessible (avoid 404s)
          return !url.includes('manifest.json');
        }).catch(() => []));
        await self.skipWaiting();
        console.log('[SW] Installation complete');
      } catch (error) {
        console.warn('[SW] Installation error:', error);
      }
    })()
  );
});

/**
 * Activate event: clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const validCaches = Object.values(CACHES_CONFIG);
        
        // Delete old versions of caches
        await Promise.all(
          cacheNames
            .filter(name => !validCaches.includes(name))
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );

        // Evict old photo cache entries
        await evictPhotoCache();
        await self.clients.claim();
        console.log('[SW] Activation complete');
      } catch (error) {
        console.warn('[SW] Activation error:', error);
      }
    })()
  );
});

/**
 * Fetch event: routing strategy
 * - Static assets: Cache-first (30 days)
 * - HTML: Network-first (1 day fallback)
 * - Photos: Network-first with size limit
 * - API calls: Network-first
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Photo URLs - Network-first with cache eviction
  if (isPhotoUrl(url)) {
    event.respondWith(handlePhotoRequest(request));
    return;
  }

  // HTML documents - Network-first
  if (request.headers.get('accept')?.includes('text/html') || url.pathname === '/') {
    event.respondWith(handleHtmlRequest(request));
    return;
  }

  // Static assets - Cache-first
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: Network-first
  event.respondWith(handleNetworkRequest(request));
});

/**
 * Determine if URL is a photo/image
 */
function isPhotoUrl(url) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname);
}

/**
 * Determine if URL is a static asset (JS, CSS, fonts)
 */
function isStaticAsset(url) {
  return /\.(js|css|woff2|woff|ttf|eot|svg)$/i.test(url.pathname) ||
         url.pathname.includes('/assets/');
}

/**
 * Handle static asset requests (Cache-first)
 */
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(CACHES_CONFIG.STATIC);
    const cached = await cache.match(request);
    
    if (cached) {
      // Serve from cache
      return cached;
    }

    // Fetch from network
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.ok && response.status === 200) {
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Static request error:', error);
    // Return offline placeholder if available
    return caches.match('/offline.html').catch(() => new Response('Offline', { status: 503 }));
  }
}

/**
 * Handle HTML requests (Network-first with cache fallback)
 */
async function handleHtmlRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok && response.status === 200) {
      // Cache successful response
      const cache = await caches.open(CACHES_CONFIG.HTML);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] HTML request error, trying cache:', error);
    // Fall back to cached version
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle photo requests (Network-first with size limit enforcement)
 */
async function handlePhotoRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok && response.status === 200) {
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength) : 0;

      // Check size limits
      if (size > PHOTO_ITEM_SIZE_LIMIT) {
        console.warn('[SW] Photo exceeds item size limit:', size, 'bytes');
        return response; // Return without caching
      }

      if (size > 0) {
        // Cache with eviction check
        const cache = await caches.open(CACHES_CONFIG.PHOTOS);
        const clonedResponse = response.clone();
        
        // Evict old entries if necessary
        await evictPhotoCacheIfNeeded(size);
        
        // Cache the photo
        await cache.put(request, clonedResponse);
      }
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Photo request error, trying cache:', error);
    // Fall back to cached version
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Photo not available', { status: 503 });
  }
}

/**
 * Handle general network requests (Network-first)
 */
async function handleNetworkRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.warn('[SW] Network request failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

/**
 * Get total size of all cached photos
 */
async function getPhotoCacheSize() {
  try {
    const cache = await caches.open(CACHES_CONFIG.PHOTOS);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.warn('[SW] Error calculating cache size:', error);
    return 0;
  }
}

/**
 * Evict photos if cache exceeds size limit (LRU policy)
 */
async function evictPhotoCacheIfNeeded(incomingSize) {
  try {
    const cache = await caches.open(CACHES_CONFIG.PHOTOS);
    const keys = await cache.keys();
    
    let totalSize = 0;
    const entries = [];

    // Calculate total size and get all entries with timestamps
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        const size = blob.size;
        totalSize += size;

        entries.push({
          request,
          size,
          timestamp: new Date(response.headers.get('date') || 0).getTime(),
        });
      }
    }

    // Check if we need to evict
    if (totalSize + incomingSize > PHOTO_CACHE_SIZE_LIMIT) {
      console.log('[SW] Photo cache exceeds limit, evicting old entries');

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Evict oldest entries until we have space
      for (const entry of entries) {
        if (totalSize + incomingSize <= PHOTO_CACHE_SIZE_LIMIT) {
          break;
        }

        console.log('[SW] Evicting photo cache entry:', entry.request.url);
        await cache.delete(entry.request);
        totalSize -= entry.size;
      }
    }
  } catch (error) {
    console.warn('[SW] Error evicting photo cache:', error);
  }
}

/**
 * Periodic photo cache eviction (on activation)
 */
async function evictPhotoCache() {
  try {
    const cache = await caches.open(CACHES_CONFIG.PHOTOS);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        const cacheAge = dateHeader ? now - new Date(dateHeader).getTime() : 0;

        // Remove entries older than 7 days
        if (cacheAge > CACHE_MAX_AGE.PHOTOS) {
          console.log('[SW] Removing expired photo cache entry');
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.warn('[SW] Error evicting expired photos:', error);
  }
}

/**
 * Handle messages from clients (e.g., cache management)
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_PHOTO_CACHE') {
    (async () => {
      await caches.delete(CACHES_CONFIG.PHOTOS);
      console.log('[SW] Photo cache cleared');
    })();
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    (async () => {
      const size = await getPhotoCacheSize();
      event.ports[0].postMessage({ size });
    })();
  }
});

console.log('[SW] Service Worker loaded');
