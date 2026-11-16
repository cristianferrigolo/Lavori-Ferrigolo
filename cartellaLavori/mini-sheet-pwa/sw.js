// Service worker: precache all'installazione, poi cache-first con aggiornamento in background.
// Cambiare VERSION quando si modificano i file, per rinnovare la cache.
const VERSION = 'mini-sheet-v2';
const LOCAL = ['./', './index.html', './manifest.json', './css/style.css', './js/app.js', './js/engine.js',
  './js/coordinates.js', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
const CDN = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(LOCAL);
    try { await c.add(new Request(CDN, { mode: 'cors' })); } catch (err) { /* il foglio funziona anche senza Bootstrap */ }
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true, ignoreVary: true }).then(hit => {
    const net = fetch(e.request).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
    return hit || net;
  }));
});
