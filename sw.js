const CACHE_NAME = "my-notebook-v48";  //این بخش برای اپدیت و تغیرات ورژن رو اصلاح کن هر بار


const ASSETS = [
    "./",
    "./index.html",
    "./nevisandegi.html",
    "./reader.html",
    "./game.html",
    "./manifest.json"
];

const ASSETS = [
    "./",
    "./index.html",
    "./nevisandegi.html",
    "./reader.html",
    "./game.html",
    "./about.html",
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





// فعال شدن و حذف کش‌های قدیمی
self.addEventListener("activate", (event) => {


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







// مدیریت درخواست‌ها
self.addEventListener("fetch",(event)=>{


    const request = event.request;



    // صفحات HTML همیشه جدید باشند
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






    // فایل‌های JS CSS عکس و...
    event.respondWith(


        fetch(request)


        .then((response)=>{


            if(!response || response.status !== 200){

                return response;

            }


            const clone = response.clone();



            caches.open(CACHE_NAME)

            .then((cache)=>{


                cache.put(request,clone);


            });



            return response;



        })


        .catch(()=>{


            return caches.match(request);



        })



    );



});