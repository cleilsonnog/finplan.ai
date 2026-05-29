const CACHE_NAME = "finplan-shell-v4";
const OFFLINE_URL = "/offline";

const SHELL_ASSETS = ["/offline", "/icon-192x192.png", "/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // Cache static assets (JS, CSS, images, fonts)
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || fetched;
        }),
      ),
    );
    return;
  }

  // Navigation requests: network first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "FinPlan.ai";
  const options = {
    body: data.body || "",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/";
  const fullUrl = new URL(path, self.registration.scope).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Reuse any existing PWA window to keep the auth session
        for (const client of clients) {
          if ("navigate" in client) {
            return client.navigate(fullUrl).then(() => client.focus());
          }
          if ("focus" in client) {
            return client.focus();
          }
        }
        // No existing window — open with full URL to stay in PWA scope
        return self.clients.openWindow(fullUrl);
      }),
  );
});
