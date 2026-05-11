const CACHE_NAME = 'futbolx-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/main.css?v=26',
  '/assets/js/api.js',
  'https://i.postimg.cc/gkfNSFPv/lqo4nv.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.1/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install: Cache core UI assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Network-first for API, Cache-first for Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If it's an API call or a live page, always go to network
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/live')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
