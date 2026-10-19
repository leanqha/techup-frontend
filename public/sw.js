/* TechUp service worker.
 * Hand-rolled (no build-step dependency) so it is predictable with the
 * rolldown-vite build. Strategy:
 *   - /api/*            -> network only, never cached (auth + live data)
 *   - navigations       -> network-first, fall back to cached app shell offline
 *   - static same-origin-> stale-while-revalidate (fast repeat loads, offline)
 *   - cross-origin (CDN fonts) -> stale-while-revalidate
 * Bump CACHE_VERSION to invalidate every cache on the next deploy. */
const CACHE_VERSION = 'v1';
const RUNTIME_CACHE = `techup-runtime-${CACHE_VERSION}`;
const SHELL_CACHE = `techup-shell-${CACHE_VERSION}`;
const APP_SHELL = '/index.html';

// Precache the app shell so the first offline navigation has something to show.
const PRECACHE_URLS = ['/', APP_SHELL, '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .catch(() => {
                /* A failed precache must not block activation. */
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key !== RUNTIME_CACHE && key !== SHELL_CACHE)
                    .map((key) => caches.delete(key))
            );
            await self.clients.claim();
        })()
    );
});

// Let the page trigger an immediate update (used by the update prompt).
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isApiRequest(url) {
    return url.pathname.startsWith('/api/');
}

async function networkFirst(request) {
    const cache = await caches.open(SHELL_CACHE);
    try {
        const response = await fetch(request);
        // Keep the shell fresh for the next offline load.
        if (response && response.ok) cache.put(APP_SHELL, response.clone());
        return response;
    } catch {
        const cached = (await cache.match(request)) || (await cache.match(APP_SHELL));
        if (cached) return cached;
        throw new Error('offline and no cached shell');
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => undefined);
    return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    let url;
    try {
        url = new URL(request.url);
    } catch {
        return;
    }

    // Never intercept API traffic — always go straight to the network.
    if (url.origin === self.location.origin && isApiRequest(url)) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    // Same-origin static assets and whitelisted CDN (Google Fonts).
    const isStatic = url.origin === self.location.origin;
    const isFontCdn =
        url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

    if (isStatic || isFontCdn) {
        event.respondWith(staleWhileRevalidate(request));
    }
});
