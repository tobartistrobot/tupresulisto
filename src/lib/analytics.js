'use client';
import posthog from 'posthog-js';

/**
 * Envoltorio fino sobre PostHog para medir el embudo del negocio.
 *
 * Por qué existe:
 *  - PostHog estaba instalado pero no se registraba ni un solo evento propio, así
 *    que no se podía saber cuánta gente pulsa "probar gratis", cuántos se
 *    registran o cuántos llegan a enviar su primer presupuesto. Sin eso, cualquier
 *    promoción es a ciegas.
 *  - Centralizar aquí los nombres de evento evita que se escriban distinto en cada
 *    sitio ('registro' vs 'signup' vs 'sign_up'), que es lo que luego hace
 *    imposible leer los datos.
 *
 * Es seguro llamarlo siempre: si PostHog no está configurado (falta la clave) o
 * estamos en el servidor, no hace nada y nunca lanza. Medir no debe poder romper
 * la app.
 */

/** Nombres de evento del embudo, en un solo sitio para no escribirlos a mano. */
export const EVENTS = {
    // Captación
    REGISTRO_INICIADO: 'registro_iniciado',   // pulsa un CTA de "probar/crear cuenta"
    REGISTRO_COMPLETADO: 'registro_completado', // crea la cuenta de verdad
    // Activación (el momento en que el producto demuestra su valor)
    PRESUPUESTO_GUARDADO: 'presupuesto_guardado',
    PRESUPUESTO_ENVIADO: 'presupuesto_enviado', // se entrega al cliente: el "momento aha"
    // Conversión
    UPGRADE_ABIERTO: 'upgrade_abierto',        // ve la pantalla de mejora a PRO
    CUPON_CANJEADO: 'cupon_canjeado',
};

/**
 * Registra un evento.
 * @param {string} evento - Preferiblemente de EVENTS.
 * @param {Record<string, any>} [propiedades] - Contexto (origen, plan, etc.).
 */
export function track(evento, propiedades = {}) {
    if (typeof window === 'undefined') return;
    try {
        if (posthog.__loaded) posthog.capture(evento, propiedades);
    } catch {
        // La analítica nunca debe interrumpir al usuario.
    }
}

/**
 * Asocia los eventos a un usuario concreto tras identificarse, para poder seguir
 * su recorrido completo. Se llama al entrar con sesión.
 * @param {string} userId
 * @param {Record<string, any>} [rasgos]
 */
export function identify(userId, rasgos = {}) {
    if (typeof window === 'undefined' || !userId) return;
    try {
        if (posthog.__loaded) posthog.identify(userId, rasgos);
    } catch {
        /* noop */
    }
}
