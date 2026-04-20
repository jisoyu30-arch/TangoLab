// TangoLab PWA Service Worker — 오프라인 캐싱
const CACHE = 'tango-lab-v1';
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/owl-icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // YouTube / Firebase API 는 항상 네트워크
  if (req.url.includes('youtube.com') ||
      req.url.includes('googleapis.com') ||
      req.url.includes('firebaseio.com') ||
      req.url.includes('firestore.googleapis') ||
      req.url.includes('firebasestorage.googleapis')) {
    return;
  }

  // GET 이외는 건드리지 않음
  if (req.method !== 'GET') return;

  // Network first, cache fallback
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || new Response('오프라인', { status: 503 })))
  );
});
