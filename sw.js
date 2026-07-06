// ۱. با هر تغییر مهم در سایت، این عدد را به v5، v6 و... تغییر دهید تا کش مرورگر به‌روز شود
const CACHE_NAME = 'writer-notebook-v4';

// لیست فایل‌های اصلی که باید همیشه در کشِ گوشی ذخیره باشند
const ASSETS = [
    '/',
    '/index.html',
    '/nevisandegi.html',
    '/reader.html',
    '/manifest.json'
];

// نصب سرویس‌ورکر و کش کردن فایل‌های لیست بالا
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('فایل‌ها در کش بارگذاری شدند');
            return cache.addAll(ASSETS);
        })
    );
});

// مدیریت فعال‌سازی و پاک‌سازی کش‌های قدیمی (حذف نسخه‌های v3 و قبل‌تر)
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

// استراتژی واکشی: اول کش، اگر نبود شبکه
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
});