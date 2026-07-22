const CACHE_NAME = 'voicemail-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/splash.html',
  '/onboarding1.html',
  '/onboarding2.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/compose_email.html',
  '/contacts.html',
  '/calendar.html',
  '/css/style.css',
  '/js/app.js',
  '/js/voice-engine.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
