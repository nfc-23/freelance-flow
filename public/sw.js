// Basic service worker for PWA installation
const CACHE_NAME = 'freelance-flow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let the browser do its default thing
  // for non-GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // We don't cache anything aggressively right now, just providing the worker 
  // so the PWA install prompt criteria is met.
  event.respondWith(fetch(event.request));
});
