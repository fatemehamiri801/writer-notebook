const CACHE_NAME = "my-notebook-v94";
// اپدیت های سرویس ورکر
const ASSETS = [
    "./",
    "./index.html",
    "./nevisandegi.html",
    "./reader.html",
    "./game.html",
    "./about.html",
    "./library.html",
    "./works.html",
    "./extras.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./fonts.css"
];

// فونت‌ها فایل‌های جدا هستن؛ اگه یکی‌شون هنوز روی سرور نباشه نصب سرویس‌ورکر نباید خراب بشه
const FONT_FILES = [
    "./fonts/Vazirmatn-Regular.woff2",
    "./fonts/Vazirmatn-Medium.woff2",
    "./fonts/Vazirmatn-Bold.woff2",
    "./fonts/Vazirmatn-Black.woff2"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(ASSETS).then(() =>
                Promise.all(FONT_FILES.map((u) => cache.add(u).catch(() => null)))
            )
        )
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

    // برای خودِ صفحات (HTML) اول از سرور تازه می‌گیریم؛ چون قبلاً
    // با استراتژی «اول کش» کاربرهای موبایل که یه بار سایت رو باز
    // کرده بودن، حتی بعد از رفع باگ‌ها هنوز نسخه‌ی قدیمی و خراب رو
    // می‌دیدن. اگه اینترنت نبود، همون کش قدیمی fallback می‌مونه.
    if (event.request.mode === "navigate" || event.request.destination === "script" || /\.js(\?|$)/.test(event.request.url)) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // برای فایل‌های استاتیک (CSS/JS/عکس) همون‌طور که بود: کش رو فوری
    // نشون بده و هم‌زمان نسخه‌ی جدید رو برای دفعه‌ی بعد آماده کن.
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