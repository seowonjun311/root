import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register Service Worker for offline support and caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(() => {
      console.log('[SW] Service Worker registered successfully');
      
      // Request background sync to cache all lazy-loaded chunks
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('precache-chunks').catch((error) => {
            console.warn('[SW] Background sync registration failed:', error);
          });
        });
      }
    }).catch((error) => {
      console.warn('[SW] Service Worker registration failed:', error);
    });
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