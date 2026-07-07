const CACHE_NAME = "writer-notebook-v18"; //عدد ورژن را تغییر بده تا کش قدیمی پاک شود

const ASSETS = [
    "./",
    "./index.html",
    "./nevisandegi.html",
    "./reader.html",
    "./game.html",    
    "./manifest.json"
];


// نصب سرویس ورکر
self.addEventListener("install", (event) => {

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)
        .then((cache) => {

            return cache.addAll(ASSETS);

        })

    );

});



// فعال شدن و پاک کردن کش‌های قدیمی
self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys()
        .then((keys) => {

            return Promise.all(

                keys.map((key) => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            );

        })
        .then(() => self.clients.claim())

    );

});



// مدیریت فایل‌ها
self.addEventListener("fetch", (event) => {

    const request = event.request;


    // صفحات HTML همیشه نسخه جدید را بگیرند
    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)
            .catch(() => {

                return caches.match("./index.html");

            })

        );

        return;

    }



    // بقیه فایل‌ها از کش استفاده کنند
    event.respondWith(

        caches.match(request)
        .then((cached) => {

            return cached || fetch(request)
            .then((response) => {

                if (!response || response.status !== 200) {

                    return response;

                }


                const clone = response.clone();


                caches.open(CACHE_NAME)
                .then((cache) => {

                    cache.put(request, clone);

                });


                return response;

            });

        })

    );

});