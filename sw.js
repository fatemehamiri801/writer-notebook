const CACHE_NAME = 'writer-notebook-v2'; // با هر بار تغییرات، عدد v2 را به v3 تغییر دهید

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});