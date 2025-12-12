const CACHE_NAME = 'china-travel-cache-v1';
const RUNTIME_CACHE = 'china-travel-runtime';

// 预缓存关键资源（如果使用构建工具，这里通常会自动注入）
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// 安装事件：预缓存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch事件：网络优先策略（Network First）
self.addEventListener('fetch', event => {
  // 忽略非 GET 请求
  if (event.request.method !== 'GET') return;

  // 忽略 API 请求（通常需要实时性，或者可以在这里实现 Stale-While-Revalidate）
  // 这里我们对 API 请求不缓存，或者使用不同的策略
  if (event.request.url.includes('/api/')) {
    return;
  }

  // 图片和静态资源：缓存优先 (Cache First)
  if (event.request.destination === 'image' || 
      event.request.destination === 'style' || 
      event.request.destination === 'script' || 
      event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
    return;
  }

  // 页面导航：网络优先，失败回退到缓存
  event.respondWith(
    fetch(event.request).then(response => {
      return caches.open(RUNTIME_CACHE).then(cache => {
        return cache.put(event.request, response.clone()).then(() => {
          return response;
        });
      });
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});