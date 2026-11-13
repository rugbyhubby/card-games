// Euchre offline helper (service worker).
// RELEASE: bump CACHE together with VERSION in version.js. A new name makes
// phones fetch a fresh copy of the game and delete the old one.
const CACHE = 'euchre-v0.3.6';

const SHARED = '../../../shared/';
const HOME = new URL('./', self.location).pathname;          // this game's own page, e.g. /p/<slug>/euchre/
const FILES = [
  './',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  // Euchre's own code
  'main.js', 'game.js', 'rules.js', 'bots.js', 'bots-hard.js', 'view.js', 'rules-text.js', 'version.js',
  // Shared parts Euchre uses
  SHARED + 'theme.css', SHARED + 'parts.css',
  SHARED + 'deck.js', SHARED + 'cards.js', SHARED + 'table.js', SHARED + 'ui.js',
  SHARED + 'timing.js', SHARED + 'settings.js', SHARED + 'theme.js'
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

// Try the network first and save what comes back; use the saved copy when offline.
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

  // The game page: network first, so testers get the newest release. Other pages in
  // this folder (like the lessons in learn/) have their own helper, so leave them alone.
  if (req.mode === 'navigate') {
    if (url.pathname === HOME || url.pathname === HOME + 'index.html') e.respondWith(networkFirst(req, './'));
    return;
  }

  // Code and styles (this game's and shared/): network first too, so a new
  // page never runs with old code. Offline, the saved copy is used.
  const sameSite = url.origin === self.location.origin;
  if (sameSite && /\.(js|css)$/.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }

  // Google Fonts: keep a copy so the game's typefaces work offline too.
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  // Icons, manifest and fonts: use the saved copy, fetch and save if missing.
  if (sameSite || isFont) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
