/**
 * Identidad de un cliente, compartida por la app y el almacenamiento.
 *
 * La ficha se identifica por nombre + teléfono, que es como venían
 * agrupándose los presupuestos en la pantalla de Clientes. Vive aquí para
 * que no haya dos criterios distintos por el código: antes AppV30 agrupaba
 * solo por teléfono y ClientManager por nombre+teléfono, así que dos
 * clientes con el mismo teléfono se contaban distinto según la pantalla.
 */

/** Clave lógica de la ficha (la que se ve en el estado de la app). */
export const clientKey = (c) => String(`${c?.name || ''}${c?.phone || ''}`).trim();

/**
 * Id de documento en Firestore para esa ficha. Va codificado porque un
 * nombre puede llevar '/' —prohibido en un id— y porque '.' o '..' a solas
 * tampoco son ids válidos.
 */
export const clientDocId = (c) => {
    const codificado = encodeURIComponent(clientKey(c));
    if (!codificado || codificado === '.' || codificado === '..') return '_sin_nombre_';
    return codificado;
};
