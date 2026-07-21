/**
 * Mapa del sitio para buscadores. Next lo sirve en /sitemap.xml.
 *
 * Solo se listan páginas públicas indexables. El panel (/dashboard) y el admin
 * son privados y no deben aparecer: no aportan nada en Google y solo diluyen el
 * rastreo. Cuando existan las páginas por oficio (/para/...), se añaden aquí.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap() {
    const base = 'https://tupresulisto.com';
    const ahora = new Date();

    return [
        { url: base, lastModified: ahora, changeFrequency: 'weekly', priority: 1 },
        { url: `${base}/register`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${base}/login`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${base}/contact`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${base}/privacy`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${base}/terms`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.2 },
    ];
}
