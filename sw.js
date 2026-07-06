const CACHE_NAME = "writer-notebook-v8";

const ASSETS = [
    "/",
    "/index.html",
    "/nevisandegi.html",
    "/reader.html",
    "/manifest.json"
];


// نصب سرویس‌ورکر
self.addEventListener("install", (event) => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS);
            })
    );

});



// فعال شدن و حذف نسخه‌های قبلی
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




// دریافت فایل‌ها
self.addEventListener("fetch", (event) => {

    const request = event.request;


    // صفحات HTML همیشه از اینترنت گرفته شوند
    // تا تغییرات سریع دیده شوند
    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)
            .then((response) => {

                return response;

            })
            .catch(() => {

                return caches.match("/index.html");

            })

        );

        return;
    }



    // فایل‌های CSS / JS / عکس‌ها
    event.respondWith(

        fetch(request)

        .then((response) => {


            if (
                !response ||
                response.status !== 200 ||
                response.type === "opaque"
            ) {

                return response;

            }


            const clone = response.clone();


            caches.open(CACHE_NAME)
            .then((cache) => {

                cache.put(request, clone);

            });


            return response;


        })


        .catch(() => {

            return caches.match(request);

        })

    );

});