// TangoLab PWA Service Worker — 자동 업데이트 지원
// BUILD_ID 는 빌드 시점에 scripts/stamp-sw.js 가 주입한다.
const BUILD_ID = '__BUILD_ID__';
const CACHE = `tango-lab-${BUILD_ID}`;
const CORE_ASSETS = [
  '/manifest.json',
  '/owl-icon.svg',
];

self.addEventListener('install', (e) => {
  // 설치 즉시 활성화 — 옛 SW 대기시간 제거
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  // 옛 캐시 모두 삭제 (BUILD_ID 가 다른 모든 캐시)
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 페이지에서 SKIP_WAITING 메시지 받으면 즉시 새 버전으로 교체
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 외부 API 는 항상 네트워크 (캐시 안 함)
  if (req.url.includes('youtube.com') ||
      req.url.includes('googleapis.com') ||
      req.url.includes('firebaseio.com') ||
      req.url.includes('firestore.googleapis') ||
      req.url.includes('firebasestorage.googleapis')) {
    return;
  }

  // GET 이외는 건드리지 않음
  if (req.method !== 'GET') return;

  // HTML 네비게이션은 항상 네트워크 우선 (옛 인덱스 캐시 방지)
  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // 정적 자산: hash 가 url 에 박힌 chunk 는 캐시 우선 (immutable)
  if (url.pathname.startsWith('/assets/') && /\.[a-f0-9]{6,}\./.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // 그 외: 네트워크 우선, 캐시 fallback
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
