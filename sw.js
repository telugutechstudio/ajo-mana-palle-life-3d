// Service worker: lets Mana Palle Life 3D install as an app and run offline.
// Game files are network-first so updates show up right away; the cache is the offline fallback.
const CACHE = 'mana-palle-v2';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/main.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const save = (req, res) => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Icons, fonts and the pinned three.js version never change: cache first (fast, saves mobile data)
  if (url.pathname.startsWith('/icons/') || /fonts\.(gstatic|googleapis)\.com$/.test(url.hostname) || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => save(e.request, res))));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => save(e.request, res))
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
