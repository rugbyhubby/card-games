// Euchre offline helper (service worker).
// RELEASE: bump CACHE together with VERSION in index.html. A new name makes
// phones fetch a fresh copy of the game and delete the old one.
const CACHE = 'euchre-v0.1.0';

const FILES = [
  './',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png'
];

// Save the game's files when this version is first installed.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Delete caches left over from earlier versions.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('euchre-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The game page: try the network first so testers get the newest release,
  // fall back to the saved copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); }
          return res;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  // Google Fonts: keep a copy so the game's typefaces work offline too.
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  // Icons, manifest and fonts: use the saved copy, fetch and save if missing.
  if (url.origin === self.location.origin || isFont) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
