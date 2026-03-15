self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))  // Clear any old caches
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));  // Explicitly fetch from network
});
