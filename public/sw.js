const CACHE_NAME = 'abkharido-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  // Don't cache API calls
  if (event.request.url.includes('/api/')) return;

  // Network-First strategy: Always try to fetch from network to get latest updates.
  // If network fails (offline), fallback to cache.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response and cache it
        var responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response; // Return fresh network response
      })
      .catch(() => {
        // If network fails, try to return cached version
        return caches.match(event.request);
      })
  );
});
