// dadpaid service worker — offline shell cache
const CACHE = 'dadpaid-v3';

const SHELL = [
  './',
  './index.html',
  './about.html',
  './lib/helpers.js',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/@supabase/supabase-js@2',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Funnel+Display:wght@600;700;800;900&family=Funnel+Sans:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        SHELL.map((url) =>
          fetch(url, { mode: 'no-cors' })
            .then((r) => cache.put(url, r))
            .catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first with network fallback. On success, refresh cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE).then((c) => c.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
