const CACHE_NAME = "mamihandball-v1";

const APP_SHELL = [
  "/",
  "/dashboard",
  "/players",
  "/reports",
  "/sessions",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET o de otros orígenes (Firebase, etc.)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Cache-first para chunks estáticos de Next.js (tienen hash en el nombre)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, response.clone()));
          return response;
        });
      }),
    );
    return;
  }

  // Cache-first para imágenes y fuentes
  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, response.clone()));
          return response;
        });
      }),
    );
    return;
  }

  // Network-first para navegación (páginas HTML): intenta red, cae a caché si está offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/dashboard")),
        ),
    );
    return;
  }
});
