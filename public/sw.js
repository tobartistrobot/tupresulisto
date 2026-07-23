/**
 * Service Worker de TuPresuListo.
 *
 * Objetivo: que la app arranque aunque el autónomo no tenga cobertura en casa
 * del cliente. La caché de Firestore (IndexedDB) guarda los DATOS, pero sin
 * esto el "cascarón" de la app (HTML/JS/CSS) no cargaría sin red.
 *
 * También es requisito de Chrome en Android para ofrecer "Instalar app".
 *
 * Estrategias:
 *  - Navegación (páginas): red primero, caché como respaldo → siempre lo más
 *    fresco posible, pero nunca una pantalla en blanco sin conexión.
 *  - Estáticos (/_next/static, imágenes, fuentes): caché primero → arranque
 *    instantáneo. Son inmutables (llevan hash en el nombre).
 */
// v2: historial migrado a subcolección — conviene que los clientes instalados
// recojan el código nuevo cuanto antes para no escribir en el formato antiguo.
const CACHE = 'tupresulisto-v2';
const FALLBACK_PAGE = '/dashboard';

self.addEventListener('install', () => {
    // Activa esta versión sin esperar a que se cierren las pestañas antiguas.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

const isStaticAsset = (pathname) =>
    pathname.startsWith('/_next/static/') ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/i.test(pathname);

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Sólo GET y sólo nuestro propio origen (nunca Firebase/PostHog/Lemon).
    if (request.method !== 'GET') return;

    let url;
    try {
        url = new URL(request.url);
    } catch {
        return;
    }
    if (url.origin !== self.location.origin) return;

    // Páginas: red primero, caché de respaldo.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    return cached || (await caches.match(FALLBACK_PAGE)) || Response.error();
                })
        );
        return;
    }

    // Estáticos: caché primero.
    if (isStaticAsset(url.pathname)) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put(request, copy));
                        return response;
                    })
            )
        );
    }
});
