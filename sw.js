// Stale-while-revalidate app shell. Bump VERSION in js/config.js AND here on every release.
const V = 'planting-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'app.css', 'main.js', 'ui.js', 'store.js', 'api.js', 'demo.js', 'forms.js', 'views.js', 'format.js', 'config.js',
  'figtree-latin-wght-normal.woff2', 'bricolage-grotesque-latin-wght-normal.woff2', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
