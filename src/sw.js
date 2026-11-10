/* Service worker: keeps the app working offline. The build fills in VERSION and ASSETS. */
const VERSION = '__VERSION__';
const CACHE = 'dswi-' + VERSION;
const FONTS = 'dswi-fonts';
const ASSETS = __ASSETS__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('dswi-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }

  // Google Fonts: serve from cache, refresh in the background.
  // (Requests to the reminder server are POSTs, so they never reach this handler.)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});

/* Reminders: the server sends an encrypted push, we show it. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Your future self is sending this', {
    body: d.body || '',
    tag: d.tag || 'dswi',
    renotify: true,
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    vibrate: [70, 50, 70],
    data: { hid: d.hid || null, tab: d.tab || null },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const scope = self.registration.scope;
    const tab = e.notification.data && e.notification.data.tab;
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const w = wins.find(c => c.url.startsWith(scope));
    if (w) { await w.focus(); if (tab) w.postMessage({ tab }); return; }
    return self.clients.openWindow(scope + (tab ? '#' + tab : ''));
  })());
});
