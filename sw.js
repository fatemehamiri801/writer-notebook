const CACHE_NAME = "my-notebook-v52"; //  تغییری در سایت دادی، فقط این ورژن را عوض کن (مثلاً 52)

const ASSETS = [
    "/",
    "/index.html",
    "/nevisandegi.html",
    "/reader.html",
    "/game.html",
    "/about.html",
    "/manifest.json"
];

// 1. نصب و فعال‌سازی فوری
self.addEventListener("install", (event) => {
    self.skipWaiting(); // سرویس‌ورکر جدید بلافاصله جایگزین قبلی می‌شود
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 2. پاکسازی کش‌های قدیمی به محض فعال شدن
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim()) // کنترل فوری تمام تب‌های باز
    );
});

// 3. استراتژی هوشمند برای نمایش تغییرات
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // اگر فایل در کش بود، آن را برگردان ولی در پس‌زمینه نسخه جدید را چک کن (Stale-while-revalidate)
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