// Learn Euchre with Grandma Dot: offline helper (service worker).
// RELEASE: bump CACHE together with VERSION in version.js (this folder).
// It looks after the lessons page only; Euchre itself has its own helper one folder up.
const CACHE = 'dotlearn-v0.1.6';

const SHARED = '../../../../shared/';
const POSES = ['sip', 'lean', 'nod', 'brow', 'palm', 'pin', 'clap', 'smug', 'tap'];
const FILES = [
  './',
  'main.js', 'view.js', 'parts.js', 'coach.js', 'lessons.js', 'version.js',
  ...POSES.map(p => `art/dot-${p}.png`),
  // Euchre's game code that the lessons run on
  '../game.js', '../rules.js', '../bots.js', '../bots-hard.js', '../view.js',
  // Shared parts
  SHARED + 'theme.css', SHARED + 'parts.css',
  SHARED + 'deck.js', SHARED + 'cards.js', SHARED + 'table.js', SHARED + 'ui.js',
  SHARED + 'timing.js', SHARED + 'settings.js', SHARED + 'theme.js'
];
const HOME = new URL('./', self.location).pathname;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('dotlearn-') && k !== CACHE).map(k => caches.delete(k))))
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
  if (req.mode === 'navigate') {
    if (sameSite && (url.pathname === HOME || url.pathname === HOME + 'index.html')) e.respondWith(networkFirst(req, './'));
    return;
  }
  if (sameSite && /\.(js|css)$/.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (sameSite || isFont) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
