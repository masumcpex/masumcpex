const SW_VERSION   = "v1.0.2";
const STATIC_CACHE = `masumcpex-static-${SW_VERSION}`;
const PAGES_CACHE   = `masumcpex-pages-${SW_VERSION}`;
const OFFLINE_URL   = "offline.html";

const PRECACHE_URLS = [
  "index.html",
  "style.css",
  "script.js",
  "data.js",
  "contact.js",
  "manifest.json",
  "offline.html",
  "photo.png",
  "bdflag.webp"
];

const NEVER_CACHE_HOSTS = [
  "googleapis.com",
  "gstatic.com",
  "firebaseapp.com",
  "firebaseio.com",
  "firebasestorage.app",
  "google.com",
  "accounts.google.com",
  "facebook.com",
  "fbcdn.net",
  "google-analytics.com",
  "googletagmanager.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn("[SW] precache স্কিপ করা হলো:", err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("masumcpex-") && key !== STATIC_CACHE && key !== PAGES_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isNeverCacheHost(url) {
  return NEVER_CACHE_HOSTS.some((host) => url.hostname.endsWith(host));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (isNeverCacheHost(url)) return;

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
