/**
 * Lista única de emails con acceso de administrador.
 *
 * Fuente de verdad centralizada — antes estaba duplicada en cada API route.
 * Se puede sobreescribir/ampliar con la variable de entorno ADMIN_EMAILS
 * (lista separada por comas), sin tocar el código.
 *
 * @type {string[]}
 */
const DEFAULT_ADMIN_EMAILS = [
    'demo@tupresulisto.com',
    'admin@tupresulisto.com',
    'tobartistrobot@gmail.com',
];

const ENV_ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const ADMIN_EMAILS = Array.from(
    new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...ENV_ADMIN_EMAILS])
);

/**
 * Comprueba si un email pertenece a un administrador.
 * @param {string | undefined | null} email
 * @returns {boolean}
 */
export function isAdminEmail(email) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
}
