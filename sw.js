const CACHE_NAME = 'write-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/W/1.png',
  '/W/2.png',
  '/favicon-32.png',
  '/favicon-16.png'
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Return cached version or fetch from network
      const fetchPromise = fetch(e.request).then(response => {
        // Don't cache non-ok responses or non-same-origin
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
