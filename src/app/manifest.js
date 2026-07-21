/**
 * Manifest de la PWA — permite instalar TuPresuListo en el móvil
 * ("Añadir a pantalla de inicio") y abrirla a pantalla completa, sin barra
 * del navegador.
 *
 * Caso de uso: el autónomo abre la app como una app nativa desde el icono,
 * en casa del cliente, y presupuesta al momento.
 *
 * Next.js sirve esto automáticamente en /manifest.webmanifest
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest() {
    return {
        name: 'TuPresuListo — Presupuestos para profesionales',
        short_name: 'TuPresuListo',
        description:
            'Haz presupuestos de ventanas, toldos, carpintería y más en 30 segundos, desde el móvil.',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0f172a',
        theme_color: '#2563eb',
        lang: 'es-ES',
        categories: ['business', 'productivity'],
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
