/**
 * Fuente única de verdad para decidir si una cuenta tiene acceso PRO.
 *
 * Existen dos formas de ser PRO y se comportan distinto:
 *
 *  - **Suscripción de pago** (Lemon Squeezy): el webhook mantiene
 *    `subscriptionStatus` al día. No lleva fecha de caducidad propia; mientras
 *    el webhook diga 'active', es PRO.
 *
 *  - **Cupón promocional** (una prueba regalada): además de poner
 *    `subscriptionStatus: 'active'` guarda `planExpiry`. Al pasar esa fecha la
 *    cuenta vuelve a gratis.
 *
 * Antes `planExpiry` se guardaba pero no lo leía nadie, así que las pruebas
 * regaladas no caducaban nunca: regalar un mes equivalía a regalar PRO de por
 * vida. Todo el que decida si alguien es PRO debe pasar por aquí.
 */

/** Valor de `planExpiry` para accesos que no caducan. */
export const LIFETIME = 'lifetime';

/**
 * @typedef {Object} SubscriptionState
 * @property {boolean} isPro        Si tiene acceso PRO ahora mismo.
 * @property {boolean} isTrial      Si su acceso viene de un cupón con caducidad.
 * @property {boolean} hasExpired   Si tenía una prueba y ya se le pasó.
 * @property {Date|null} expiresAt  Cuándo caduca (null si no caduca).
 * @property {number|null} daysLeft Días que le quedan (null si no caduca).
 */

/**
 * Calcula el estado de suscripción de un perfil de usuario.
 *
 * @param {Record<string, any> | null | undefined} profile - Documento del usuario en Firestore.
 * @param {Date} [now] - Momento de referencia; inyectable para poder probarlo.
 * @returns {SubscriptionState}
 */
export function getSubscriptionState(profile, now = new Date()) {
    const inactive = { isPro: false, isTrial: false, hasExpired: false, expiresAt: null, daysLeft: null };

    if (!profile) return inactive;

    // Compatibilidad con perfiles antiguos que usaban 'pro' o el booleano isPro.
    const status = profile.subscriptionStatus;
    const marcadoComoActivo = status === 'active' || status === 'pro' || profile.isPro === true;
    if (!marcadoComoActivo) return inactive;

    const expiry = profile.planExpiry;

    // Sin caducidad (suscripción de pago o acceso de por vida): PRO sin más.
    if (!expiry || expiry === LIFETIME) {
        return { isPro: true, isTrial: false, hasExpired: false, expiresAt: null, daysLeft: null };
    }

    const expiresAt = new Date(expiry);

    // Una fecha corrupta no debería bloquear a nadie: ante la duda, damos acceso
    // y que sea un humano quien lo revise. Es preferible a echar a un cliente.
    if (Number.isNaN(expiresAt.getTime())) {
        return { isPro: true, isTrial: false, hasExpired: false, expiresAt: null, daysLeft: null };
    }

    const quedaTiempo = expiresAt.getTime() > now.getTime();
    const msPorDia = 24 * 60 * 60 * 1000;
    const daysLeft = quedaTiempo ? Math.ceil((expiresAt.getTime() - now.getTime()) / msPorDia) : 0;

    return {
        isPro: quedaTiempo,
        isTrial: true,
        hasExpired: !quedaTiempo,
        expiresAt,
        daysLeft: quedaTiempo ? daysLeft : 0,
    };
}

/**
 * Atajo para cuando solo interesa el sí o el no.
 *
 * @param {Record<string, any> | null | undefined} profile
 * @returns {boolean}
 */
export function isProActive(profile) {
    return getSubscriptionState(profile).isPro;
}

/**
 * Convierte la duración declarada en un cupón a su fecha de caducidad.
 *
 * Acepta `lifetime` o un número de días (`30`, `90`, `365`). Antes cualquier
 * valor distinto de 'lifetime' se convertía en 30 días, así que un cupón
 * pensado para tres meses solo daba uno.
 *
 * @param {string | undefined} duration - Valor tal cual viene en COUPON_CODES.
 * @param {Date} [now]
 * @returns {string} 'lifetime' o una fecha ISO.
 */
export function resolveCouponExpiry(duration, now = new Date()) {
    const valor = String(duration ?? '').trim().toLowerCase();

    if (valor === LIFETIME) return LIFETIME;

    const dias = Number.parseInt(valor, 10);
    // Si el cupón no declara días válidos, 30 es el mínimo razonable para probar.
    const diasFinales = Number.isFinite(dias) && dias > 0 ? dias : 30;

    return new Date(now.getTime() + diasFinales * 24 * 60 * 60 * 1000).toISOString();
}
