/**
 * URL pública canónica del sitio, en un solo lugar.
 *
 * Producción se sirve en el dominio CON www (tupresulisto.com redirige a
 * www.tupresulisto.com), así que canonical, Open Graph, sitemap y robots
 * deben usar esta misma base. Tenerla repetida por archivos es lo que causó
 * que los canonical apuntaran al dominio sin www mientras las páginas se
 * servían con él.
 */
export const SITE_URL = 'https://www.tupresulisto.com';
