const CACHE_NAME = 'flappy-v1';

// Everything the game needs to run offline
const ASSETS_TO_CACHE = [
  '/',
  '/static/css/reset.css',
  '/static/css/game.css',
  '/static/js/main.js',
  '/static/js/game.js',
  '/static/js/api.js',
  '/static/js/entities/bird.js',
  '/static/js/entities/pipe.js',
  '/static/js/entities/background.js',
  '/static/manifest.json',
];

// Install: pre-cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())  // activate immediately, don't wait for tab refresh
  );
});

// Activate: delete any caches from older versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  // API calls always go to the network — scores must be real-time
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});