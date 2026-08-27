/* Offline application shell for the installable game. */
var CACHE_NAME = 'super-mario-v4';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app.js',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './assets/app-icon.svg',
  './js/font.js',
  './js/sprites.js',
  './js/tiles.js',
  './js/input.js',
  './js/audio.js',
  './js/levels.js',
  './js/world.js',
  './js/entities.js',
  './js/game.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE_NAME ? null : caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (!response || !response.ok || new URL(event.request.url).origin !== self.location.origin) return response;
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function () {
        return event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
      });
    })
  );
});
