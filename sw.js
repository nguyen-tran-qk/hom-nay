/**
 * sw.js — Service Worker
 * Strategy: Cache-first for app shell assets; Network-first for Nager.Date API.
 */

const SHELL_CACHE = "shell-v1";
const API_CACHE   = "api-v1";

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/css/base.css",
  "/css/themes/minimal-clock.css",
  "/js/main.js",
  "/js/geo.js",
  "/js/holidays.js",
  "/js/countdown.js",
  "/js/themes/minimal-clock.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nager.Date API — Cache-first (holiday data doesn't change intraday)
  if (url.hostname === "date.nager.at") {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // App shell — Cache-first, fall back to network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
