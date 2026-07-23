// SERVICE WORKER — Self-Destruct Mode
// The previous v1 cache-first SW was causing a critical bug where stale app.js
// was served from cache, making all code fixes invisible to the browser.
// This version deletes all caches and unregisters itself so pages load
// purely from the network (protected by the server's no-cache headers).

self.addEventListener('install', () => {
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

self.addEventListener('activate', async () => {
  // 1. Delete every cache that exists
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => {
    console.log('[SW] Deleting cache:', key);
    return caches.delete(key);
  }));

  // 2. Take control of all open tabs
  await self.clients.claim();

  // 3. Unregister this Service Worker so pages load fresh from network
  await self.registration.unregister();

  console.log('[SW] All caches cleared. Service Worker unregistered. Pages will now load from network.');

  // 4. Reload all open tabs so they immediately pick up fresh JS
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  allClients.forEach((client) => {
    client.navigate(client.url);
  });
});

// While active, pass all requests straight through to the network (no caching)
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
