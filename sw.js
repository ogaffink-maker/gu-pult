/* Service worker: офлайн-кэш оболочки и показ уведомлений.
   В рабочей версии сюда же приходит событие push от сервера (Web Push, VAPID). */
const CACHE = "pult-v4";
const SHELL = ["./", "index.html", "app.css", "app.js", "auth.js", "data.enc.json", "manifest.webmanifest", "fonts/manrope.css", "icons/icon-192.png", "icons/badge-72.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// сначала сеть (свежие данные), при её отсутствии — кэш
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

self.addEventListener("push", (e) => {
  const p = e.data ? e.data.json() : { title: "Пульт", body: "Новый отчёт смены" };
  e.waitUntil(self.registration.showNotification(p.title, { body: p.body, icon: "icons/icon-192.png", badge: "icons/badge-72.png", tag: p.tag, data: { url: p.url || "#/" } }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url ? e.notification.data.url : "#/", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) { if (c.url.startsWith(self.registration.scope)) { c.focus(); return c.navigate(url); } }
      return self.clients.openWindow(url);
    })
  );
});
