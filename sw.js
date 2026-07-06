const CACHE_NAME = 'writer-notebook-v6';

const ASSETS = [
    '/',
    '/index.html',
    '/nevisandegi.html',
    '/reader.html',
    '/manifest.json'
];

// نصب: کش اولیه + جلوگیری از گیر کردن نسخه قدیمی
self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// فعال‌سازی: حذف کش‌های قدیمی + گرفتن کنترل فوری
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// fetch: شبکه اول برای HTML، کش برای بقیه
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // فقط برای صفحات HTML (حل مشکل آپدیت نشدن UI)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // برای فایل‌های دیگر (CSS/JS/images)
    event.respondWith(
        caches.match(request).then((cached) => {
            return cached || fetch(request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, response.clone());
                    return response;
                });
            });
        })
    );
});