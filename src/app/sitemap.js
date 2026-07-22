import { LISTA_GREMIOS } from '../lib/gremios';
import { SITE_URL } from '../lib/site';

/**
 * Mapa del sitio para buscadores. Next lo sirve en /sitemap.xml.
 *
 * Solo se listan páginas públicas indexables. El panel (/dashboard) y el admin
 * son privados y no deben aparecer: no aportan nada en Google y solo diluyen el
 * rastreo. Las páginas de campaña (/lp/...) tampoco: van con noindex y solo
 * existen como destino de anuncios.
 *
 * Las páginas SEO por gremio salen de src/lib/gremios.js: añadir un gremio
 * allí lo añade aquí automáticamente.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap() {
    const base = SITE_URL;
    const ahora = new Date();

    const paginasGremios = LISTA_GREMIOS.map(g => ({
        url: `${base}/${g.seoSlug}`,
        lastModified: ahora,
        changeFrequency: 'monthly',
        priority: 0.9,
    }));

    return [
        { url: base, lastModified: ahora, changeFrequency: 'weekly', priority: 1 },
        ...paginasGremios,
        { url: `${base}/register`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${base}/login`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${base}/contact`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${base}/privacy`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${base}/terms`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.2 },
    ];
}
