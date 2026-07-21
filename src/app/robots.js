/**
 * robots.txt para buscadores. Next lo sirve en /robots.txt.
 *
 * Se permite rastrear todo lo público, pero se bloquean las zonas privadas
 * (panel, admin, API): no deben aparecer en Google y evitan que el buscador
 * gaste tiempo en páginas que exigen sesión.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots() {
    const base = 'https://tupresulisto.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard', '/admin-stats-internal', '/api/'],
        },
        sitemap: `${base}/sitemap.xml`,
    };
}
