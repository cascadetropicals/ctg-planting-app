// Network-first app shell. Bump VERSION in js/config.js AND here on every release.
const V = 'planting-v16';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'app.css', 'main.js', 'ui.js', 'store.js', 'api.js', 'demo.js', 'forms.js', 'views.js', 'format.js', 'config.js',
  'figtree-latin-wght-normal.woff2', 'bricolage-grotesque-latin-wght-normal.woff2', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// NETWORK-FIRST: always try the server first (bypassing the browser/GitHub cache) so a new release shows on the very next open.
// The cache is only the offline fallback (and used if the network is slower than 4 s).
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const fresh = fetch(new Request(e.request, { cache: 'no-store' })).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    try {
      return await Promise.race([fresh, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]);
    } catch (err) {
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      return fresh; // nothing cached: wait for the network
    }
  })());
});
