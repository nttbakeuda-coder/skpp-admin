/* Service Worker KATONG SKPP Dasbor — Web Push.
   Menampilkan notifikasi OS (taskbar/Action Center) walau tab ditutup, dan
   memfokuskan/membuka dashboard saat notifikasi diklik. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data && event.data.text() }; }
  const title = d.title || "KATONG SKPP Dasbor";
  const opts = {
    body: d.body || "",
    icon: d.icon || "/logo-sipasti.png",
    badge: "/logo-sipasti.png",
    tag: d.tag || undefined,          // tag sama -> notifikasi diganti, bukan menumpuk
    renotify: !!d.tag,
    data: { url: d.url || "/" },
    requireInteraction: !!d.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(target); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
