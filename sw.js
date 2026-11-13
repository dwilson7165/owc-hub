// OWC Crew Hub - offline support.
// Bump VERSION whenever you upload new app files so installed copies update.
const VERSION = "owc-hub-v3";
const SHELL = ["./", "index.html", "app.js", "data.js", "config.js", "manifest.webmanifest",
  "icons/emblem.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // never cache the Google Sheet backend, Drive images or music
  if (url.hostname.includes("script.google") || url.hostname.includes("googleusercontent") || url.hostname.includes("drive.google") || url.pathname.includes("/music/")) return;
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname.includes("fonts.g");
  if (!sameOrigin && !isFont) return;
  // network first for app files (so updates show up), cache fallback for offline
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match("index.html")))
  );
});
