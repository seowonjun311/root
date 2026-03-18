import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

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