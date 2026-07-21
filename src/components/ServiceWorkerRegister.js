'use client';
import { useEffect } from 'react';

/**
 * Registra el service worker (ver public/sw.js).
 *
 * Sólo en producción: en desarrollo interferiría con el Fast Refresh de Next,
 * sirviendo código cacheado en vez de los cambios recientes.
 *
 * No renderiza nada.
 */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        };

        // Esperamos a 'load' para no competir con la carga inicial de la app.
        if (document.readyState === 'complete') register();
        else window.addEventListener('load', register, { once: true });
    }, []);

    return null;
}
