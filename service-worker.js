/* ==========================================================================
   service-worker.js
   Masumcpex Hub — PWA অফলাইন ক্যাশিং।

   নিয়ম:
   - শুধু স্ট্যাটিক ফাইল (HTML/CSS/JS/ছবি/ফন্ট) ক্যাশ হবে।
   - Firebase Auth / Firestore / Google API / কোনো POST-ফর্ম রিকোয়েস্ট
     কখনো ক্যাশ বা ইন্টারসেপ্ট করা হবে না — ওগুলো সবসময় সরাসরি নেটওয়ার্কে যাবে।
   - HTML পেজ: "network-first" (আগে নেট, না পেলে ক্যাশ, একদমই না পেলে offline.html)।
   - স্ট্যাটিক অ্যাসেট: "cache-first, background-refresh" (দ্রুত লোড + আপডেট)।
   ========================================================================== */

const SW_VERSION   = "v1.0.0";
const STATIC_CACHE = `masumcpex-static-${SW_VERSION}`;
const PAGES_CACHE   = `masumcpex-pages-${SW_VERSION}`;
const OFFLINE_URL   = "offline.html";

/* ইনস্টলের সময় প্রি-ক্যাশ করার মতো মূল ফাইলগুলো (শুধু যেগুলো সব পেজে দরকার) */
const PRECACHE_URLS = [
  "index.html",
  "style.css",
  "script.js",
  "data.js",
  "contact.js",
  "manifest.json",
  "offline.html",
  "photo.png",
  "icon-192.png",
  "icon-512.png"
];

/* এই ডোমেইনগুলোর কোনো রিকোয়েস্ট কখনো ক্যাশ/ইন্টারসেপ্ট করা হবে না
   (Auth, Firestore, Analytics, Google API, ফন্ট CDN ইত্যাদি) */
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

  /* শুধু GET রিকোয়েস্ট হ্যান্ডেল করা হবে — ফর্ম সাবমিট, লগইন POST ইত্যাদি সবসময় নেটওয়ার্কে যাবে */
  if (request.method !== "GET") return;

  /* Auth/Firestore/Google/Facebook/Font-CDN — কখনোই টাচ করা হবে না, স্বাভাবিক নেটওয়ার্ক রিকোয়েস্ট হিসেবে যেতে দিন */
  if (isNeverCacheHost(url)) return;

  /* অন্য কোনো ভিন্ন-অরিজিন রিকোয়েস্ট থাকলেও নিরাপদ থাকতে সেগুলো ছুঁয়ে দেখা হবে না */
  if (url.origin !== self.location.origin) return;

  /* পেজ নেভিগেশন (HTML) — network-first */
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

  /* স্ট্যাটিক অ্যাসেট (CSS/JS/ছবি/ফন্ট) — cache-first + ব্যাকগ্রাউন্ডে আপডেট */
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
