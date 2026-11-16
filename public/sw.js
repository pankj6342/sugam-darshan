/*
 * Sugam Darshan service worker (prototype).
 * - Makes the app installable everywhere and usable offline after the first visit
 *   (devotees at the gate and the gate scanner itself may lose network — BRD NFR-05).
 * - /_next/static/* is content-hashed → cache-first.
 * - Pages / RSC payloads → network-first, falling back to cache (ignoring ?id=… query).
 * Paths are resolved from the registration scope, so it works at / and at /sugam-darshan/.
 */
const CACHE = "sugam-darshan-v1";
const SCOPE = new URL(self.registration.scope).pathname; // e.g. "/sugam-darshan/"
const PAGES = ["", "darshan/", "darshan/book/", "darshan/pass/", "whatsapp/", "kendra/", "gate/", "control/", "yatra/", "kpi/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set([SCOPE + "manifest.webmanifest", SCOPE + "icons/icon-192.png"]);
      for (const p of PAGES) {
        try {
          const res = await fetch(SCOPE + p, { cache: "no-cache" });
          if (!res.ok) continue;
          const html = await res.clone().text();
          await cache.put(SCOPE + p, res);
          for (const m of html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
        } catch {
          /* offline during install — runtime caching will fill in later */
        }
      }
      await Promise.allSettled([...assets].map((a) => cache.add(a)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req.mode === "navigate" ? url.origin + url.pathname : req, copy));
        }
        return res;
      } catch (err) {
        const hit = (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true }));
        if (hit) return hit;
        if (req.mode === "navigate") {
          const shell = await caches.match(SCOPE + "darshan/");
          if (shell) return shell;
        }
        throw err;
      }
    })(),
  );
});
