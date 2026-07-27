const CACHE_NAME = "paxpearl-v1";

const urlsToCache = [

"/",

"/index.html",

"/css/base.css",

"/css/layout.css",

"/css/components.css",

"/css/variables.css"

];

self.addEventListener("install", event => {

event.waitUntil(

caches.open(CACHE_NAME)

.then(cache => {

return cache.addAll(urlsToCache);

})

);

});

self.addEventListener("fetch", event => {

event.respondWith(

caches.match(event.request)

.then(response => {

return response || fetch(event.request);

})

);

});

self.addEventListener("activate", event => {

event.waitUntil(

caches.keys().then(keys => {

return Promise.all(

keys.map(key => {

if (key !== CACHE_NAME)

return caches.delete(key);

})

);

})

);

});
