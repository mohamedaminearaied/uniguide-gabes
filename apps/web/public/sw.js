/* UniGuide Gabès service worker.
 * - App files (/_next/static, icons): cache-first (they are versioned).
 * - Pages: network-first, falls back to the last visited copy, then to /offline.html.
 * - GET /api/v1/places (public list): network-first, falls back to the last saved list when offline.
 * Never cached: anything with login (/me, /admin, submissions), map tiles, other sites.
 */
const VERSION = 'v1';
const STATIC_CACHE = `uniguide-static-${VERSION}`;
const PAGES_CACHE = `uniguide-pages-${VERSION}`;
const DATA_CACHE = `uniguide-data-${VERSION}`;
const KEEP = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((c) => c.addAll(['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isPublicPlacesRequest(url) {
  return /\/api\/v1\/places\/?$/.test(url.pathname) && !url.search.includes('token');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Requests carrying a login token are personal data: never touch them.
  if (req.headers.has('Authorization')) return;

  const url = new URL(req.url);

  // 1) Public places list (any origin: your API)
  if (isPublicPlacesRequest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || Response.error()))
    );
    return;
  }

  // Everything below: same-origin only
  if (url.origin !== self.location.origin) return;

  // 2) Versioned app files
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // 3) Page navigations
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !url.pathname.startsWith('/admin')) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/offline.html'))
        )
    );
  }
});
