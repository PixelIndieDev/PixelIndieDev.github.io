const CACHE_VERSION = 'v4';
const STATIC_CACHE = `piggy-static-${CACHE_VERSION}`;
const PAGES_CACHE = `piggy-pages-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
    '/assets/images/Piggy_Full.svg',
    '/assets/images/socials/social_icons.svg',
    '/assets/images/ui/heart_ul.svg',
    '/assets/images/background/nature_combined.svg',
    '/assets/images/background/OtherBackgroundLayers.svg',
    '/assets/images/background/sims/plumbob.svg',
    '/assets/images/background/sims/backgroundImageSims.jpg',
    '/assets/css/loaderCSS.css',
    '/assets/css/mainCSS.css',
    '/assets/css/piggyCSS.css',
    '/assets/css/backgroundEffects.css',
    '/assets/javascript/MainScript.js',
    '/assets/javascript/Piggy.js',
    '/assets/javascript/GithubStats.js',
    '/assets/javascript/backgroundEffects.js',
    '/assets/favicon/favicon.svg',
    '/assets/favicon/favicon-96x96.png',
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== PAGES_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
 
    if (url.origin !== location.origin) return;
 
    if (request.destination === 'document') {
        event.respondWith(networkFirst(request, PAGES_CACHE));
    } else {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
});

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}
 
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached ?? new Response('Offline', { status: 503 });
    }
}