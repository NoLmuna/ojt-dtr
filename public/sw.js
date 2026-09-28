const CACHE_VERSION = "ojt-dtr-v3";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const APP_SHELL_FILES = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/DTR-ICON.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestURL = new URL(event.request.url);

  if (requestURL.protocol !== "http:" && requestURL.protocol !== "https:") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(async () => {
          const offlinePage = await caches.match("/offline");
          if (offlinePage) {
            return offlinePage;
          }

          return caches.match("/");
        })
    );
    return;
  }

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  if (
    requestURL.pathname.startsWith("/api/") ||
    requestURL.pathname.startsWith("/dashboard") ||
    requestURL.pathname.startsWith("/dtr") ||
    requestURL.pathname.startsWith("/profile") ||
    requestURL.pathname.startsWith("/supervisor")
  ) {
    return;
  }

  const isStaticAsset =
    requestURL.pathname.startsWith("/_next/static/") ||
    requestURL.pathname.startsWith("/icons/") ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(requestURL.pathname);

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
