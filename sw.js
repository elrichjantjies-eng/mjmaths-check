/* Maths Check offline cache. VERSION is stamped by publish_learner_app.py, so
   every publish installs a fresh copy; the app then offers "tap to update". */
var VERSION = "mc-6176281efa";
var FILES = ["./", "index.html", "app.css", "app.js", "core.js", "vendor/inflate.js", "vendor/qrscan.js",
             "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png",
             "icons/apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;   // nothing else is ever touched
  if (req.mode === "navigate") {                    // the worksheet is in the #fragment, so any page = the app
    e.respondWith(caches.match("index.html").then(function (r) { return r || fetch(req); }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (r) { return r || fetch(req); }));
});
