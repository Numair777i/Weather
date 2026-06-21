const CACHE = "weather-v1";

// files to cache for offline use
const FILES = ["/", "/index.html", "/style.css", "/app.js"];

// install — cache all files
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

// activate — delete old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
});

// fetch — serve from cache, fall back to network
self.addEventListener("fetch", (e) => {
  // never cache API calls — always fetch live weather data
  if (e.request.url.includes("/api/")) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request)),
  );
});
