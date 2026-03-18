import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register Service Worker for offline support with strict error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/public/service-worker.js', {
          scope: '/',
        });
        
        console.log('[SW] Service Worker registered successfully:', registration.scope);

        // Verify Service Worker is active
        if (registration.active) {
          console.log('[SW] Service Worker is active and controlling the page');
        } else if (registration.installing) {
          console.log('[SW] Service Worker is installing...');
        }

        // Listen for updates to critical cached routes
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New Service Worker available, notifying app');
              // Notify app of update via message
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'SKIP_WAITING'
                });
              }
            }
          });
        });

        // Register background sync for lazy-loaded chunks
        if ('SyncManager' in window) {
          try {
            await registration.sync.register('precache-chunks');
            console.log('[SW] Background sync registered for critical chunk precaching');
          } catch (syncError) {
            console.warn('[SW] Background sync registration failed (may be unavailable on this browser):', syncError);
          }
        }

        // Periodically check for updates every 6 hours
        setInterval(async () => {
          try {
            await registration.update();
            console.log('[SW] Checked for updates');
          } catch (error) {
            console.warn('[SW] Failed to check for updates:', error);
          }
        }, 6 * 60 * 60 * 1000);

      } catch (error) {
        console.warn('[SW] Service Worker registration failed:', error);
        console.warn('[SW] App will continue without offline support');
      }
    };

    registerServiceWorker();
  });

  // Monitor Service Worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] Service Worker controller changed - new version is now active');
  });

  // Handle Service Worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_ACTIVATED') {
      console.log('[SW] New Service Worker activated, user should reload for latest version');
    }
  });
}

// Defer non-critical utility initialization until after first interaction
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Lazy-load performance monitoring and non-critical services
    import('@base44/sdk').then(() => {
      // Optional: warm up SDK cache
    }).catch(e => console.warn('Failed to warm SDK:', e));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)