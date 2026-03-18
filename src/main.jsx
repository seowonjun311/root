import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register Service Worker for offline support with persistent fallback
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('[SW] Service Worker registered successfully');
        
        // Listen for updates to critical cached routes
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New Service Worker available, offline cache updated');
            }
          });
        });
        
        // Request background sync to cache all lazy-loaded chunks
        if ('SyncManager' in window) {
          registration.sync.register('precache-chunks').catch((error) => {
            console.warn('[SW] Background sync registration failed:', error);
          });
        }
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });

  // Handle Service Worker controlled state
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] Service Worker controller changed - offline fallback active');
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