const CACHE_NAME = "my-notebook-v57";
// استفاده از مسیرهای نسبی برای هماهنگی با ساختار گیت‌هاب
const ASSETS = [
    "./",
    "./index.html",
    "./nevisandegi.html",
    "./reader.html",
    "./game.html",
    "./about.html",
    "./manifest.json"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    // جلوگیری از کش کردن درخواست‌های غیر ضروری (مانند اکستنشن‌ها)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                }
                return networkResponse;
            });
            return cachedResponse || fetchPromise;
        })
    );
});