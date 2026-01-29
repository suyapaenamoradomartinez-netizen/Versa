
// service-worker.js — Cache simple para PWA offline
const CACHE_NAME = 'emely-poemas-v1';
const ASSETS = [
  './',
  './index.html',
  './estilos.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Evita cachear peticiones POST o no-GET
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(resp => resp || fetch(request).then(netResp => {
      // Cache dinámico básico (opcional)
      const copy = netResp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return netResp;
    }).catch(() => caches.match('./index.html')))
  );
});
