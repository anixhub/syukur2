const CACHE_NAME = 'attarokey-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './logo.svg',
  './manifest.json'
];

// Install Event: Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: Cache-First for static, Network-First for API
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip chrome-extension, supabase, or API routes from default static caching
  if (
    requestUrl.protocol !== 'http:' && 
    requestUrl.protocol !== 'https:'
  ) {
    return;
  }

  // Handle API requests (Network first, don't cache unless necessary)
  if (requestUrl.pathname.startsWith('/api') || requestUrl.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Dynamic offline response or offline JSON if needed
          return new Response(
            JSON.stringify({ success: false, error: 'Koneksi internet terputus.' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // For other requests (Static Assets, Pages, etc.) use Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network update failure when offline */});
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Don't cache partial content or error pages
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/')
            .then((r) => r || caches.match('./index.html'))
            .then((r) => r || caches.match('/index.html'));
        }
      });
    })
  );
});

// Push Event: Handle incoming push notification
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Pesan Masuk - SmartSantri';
  const options = {
    body: data.body || 'Anda menerima pesan masuk baru.',
    icon: data.icon || './logo.svg',
    badge: data.badge || './logo.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './',
      channel: data.channel || 'semua'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event: Focus or open the SmartSantri window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

