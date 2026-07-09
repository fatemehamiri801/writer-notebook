const CACHE_NAME = "my-notebook-v51"; //بعد تغییرات این جا ورژن عوض کن


// =========================
// فایل‌های اصلی برنامه
// =========================

const ASSETS = [

    "./",

    "./index.html",

    "./nevisandegi.html",

    "./reader.html",

    "./game.html",

    "./about.html",

    "./manifest.json"

];




// =========================
// نصب سرویس ورکر
// =========================

self.addEventListener("install", (event)=>{


    // فعال شدن سریع نسخه جدید

    self.skipWaiting();



    event.waitUntil(


        caches.open(CACHE_NAME)

        .then((cache)=>{


            return cache.addAll(ASSETS);


        })


    );


});








// =========================
// فعال شدن سرویس ورکر
// پاک کردن کش‌های قدیمی
// =========================


self.addEventListener("activate",(event)=>{


    event.waitUntil(


        caches.keys()

        .then((keys)=>{


            return Promise.all(


                keys.map((key)=>{


                    if(key !== CACHE_NAME){


                        return caches.delete(key);


                    }


                })


            );


        })


        .then(()=>{


            return self.clients.claim();


        })


    );


});








// =========================
// دریافت درخواست‌ها
// مدیریت صفحات و فایل‌ها
// =========================


self.addEventListener("fetch",(event)=>{


    const request = event.request;




    // =====================
    // صفحات HTML
    // همیشه نسخه تازه
    // =====================


    if(request.mode === "navigate"){


        event.respondWith(


            fetch(request)


            .then((response)=>{


                const clone = response.clone();



                caches.open(CACHE_NAME)

                .then((cache)=>{


                    cache.put(request,clone);


                });



                return response;



            })


            .catch(()=>{


                return caches.match(request)

                .then((cached)=>{


                    return cached || caches.match("./index.html");


                });



            })


        );


        return;


    }








    // =====================
    // فایل‌های CSS
    // JS
    // تصاویر
    // آیکون‌ها
    // =====================


    event.respondWith(


        caches.match(request)

        .then((cached)=>{


            if(cached){


                // اول نسخه کش شده را بده

                // بعد نسخه جدید را ذخیره کن


                fetch(request)

                .then((response)=>{


                    if(
                        response &&
                        response.status === 200
                    ){


                        caches.open(CACHE_NAME)

                        .then((cache)=>{


                            cache.put(
                                request,
                                response.clone()
                            );


                        });


                    }


                })

                .catch(()=>{});



                return cached;


            }




            return fetch(request)


            .then((response)=>{


                if(
                    !response ||
                    response.status !== 200
                ){


                    return response;


                }




                const clone = response.clone();



                caches.open(CACHE_NAME)

                .then((cache)=>{


                    cache.put(
                        request,
                        clone
                    );


                });



                return response;



            });



        })


        .catch(()=>{


            return caches.match("./index.html");


        })


    );


});