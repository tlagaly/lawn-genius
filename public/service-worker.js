// Service Worker for handling push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: data.data,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Navigate to the URL provided in the notification data
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Cache static assets
const CACHE_NAME = 'lawn-genius-v1';
const urlsToCache = [
  '/',
  '/weather-alert-icon.png',
  '/styles/main.css',
  '/scripts/main.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});