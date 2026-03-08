// Минимальный сервис-воркер для поддержки PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Просто пропускаем запросы, этого достаточно для соответствия критериям установки
  event.respondWith(fetch(event.request));
});
