// ۱. با هر تغییر مهم در سایت، فقط این عدد را به v4، v5 و... تغییر دهید
const CACHE_NAME = 'writer-notebook-v3'; 

// لیست فایل‌هایی که باید همیشه در حافظه باشند (فایل‌های اصلی سایتتان)
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// نصب سرویس‌ورکر و کش کردن فایل‌ها
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// مدیریت فعال‌سازی و پاک‌سازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('کش قدیمی پاک شد:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// واکشی فایل‌ها (اگر اینترنت نبود، از کش استفاده کن)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});