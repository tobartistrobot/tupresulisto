/**
 * robots.txt para buscadores. Next lo sirve en /robots.txt.
 *
 * Se permite rastrear todo lo público, pero se bloquean las zonas privadas
 * (panel, admin, API): no deben aparecer en Google y evitan que el buscador
 * gaste tiempo en páginas que exigen sesión.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
import { SITE_URL } from '../lib/site';

export default function robots() {
    const base = SITE_URL;

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard', '/admin-stats-internal', '/api/'],
        },
        sitemap: `${base}/sitemap.xml`,
    };
}
