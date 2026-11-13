// Game list offline helper (service worker).
// RELEASE: bump CACHE together with VERSION in version.js (this folder).
//
// This helper looks after the game list only. Each game has its own helper
// in its folder (e.g. euchre/sw.js), which takes over for that game's pages.
const CACHE = 'cardgames-v0.3.3';

const SHARED = '../../shared/';
const FILES = [
  './',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'main.js', 'version.js',
  'euchre/rules-text.js', 'pitch/rules-text.js', 'cribbage/rules-text.js',   // for the Rules links
  'euchre/learn/art/dot-sip.png',                                             // Dot on the Learn button
  SHARED + 'theme.css', SHARED + 'parts.css',
  SHARED + 'settings.js', SHARED + 'theme.js', SHARED + 'ui.js'
];

const HOME = new URL('./', self.location).pathname;           // e.g. /p/<slug>/
const MINE = new Set(FILES.map(f => new URL(f, self.location).pathname));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Delete this helper's caches from earlier versions (never a game's caches).
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cardgames-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(req, key) {
  return fetch(req, { cache: 'no-cache' })
    .then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key || req, copy)); }
      return res;
    })
    .catch(() => caches.match(key || req));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;

  // The game list page itself. Anything else (like a game's page) is left to
  // that game's own helper, or the network.
  if (req.mode === 'navigate') {
    if (sameSite && (url.pathname === HOME || url.pathname === HOME + 'index.html')) e.respondWith(networkFirst(req, './'));
    return;
  }

  // The game list's own files and the shared files it uses.
  if (sameSite && MINE.has(url.pathname)) {
    if (/\.(js|css)$/.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }

  // Google Fonts: keep a copy so the list's typefaces work offline too.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
