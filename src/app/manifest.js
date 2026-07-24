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
        // Destino de compartir: desde WhatsApp/Gmail → Compartir → TuPresuListo,
        // y la conversación aterriza en el agente IA, que extrae medidas, datos
        // del cliente y prepara el presupuesto. Es la alternativa deliberada a
        // "monitorizar" los canales: sin credenciales de terceros, sin APIs no
        // oficiales (Meta banea números por usarlas) y con el usuario eligiendo
        // qué comparte. GET con parámetros: el texto llega en la URL y el
        // dashboard lo recoge al abrirse.
        share_target: {
            action: '/dashboard',
            method: 'GET',
            params: {
                title: 'share_title',
                text: 'share_text',
                url: 'share_url',
            },
        },
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
