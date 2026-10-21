/* Egypt Trip Guide: caches everything on first visit so it opens with no signal.
   Opens instantly from the cache, then refreshes it in the background when there is a signal,
   so updates appear the next time the app is opened. */
const CACHE = "egypt-guide-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;  // external links go to the network
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const refresh = fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => (hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())));
      if (hit) { refresh.catch(() => {}); return hit; }
      return refresh;
    })
  );
});
