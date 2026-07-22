/**
 * Lista única de emails con acceso de administrador.
 *
 * Fuente de verdad centralizada — antes estaba duplicada en cada API route.
 * Se puede sobreescribir/ampliar con la variable de entorno ADMIN_EMAILS
 * (lista separada por comas), sin tocar el código.
 *
 * @type {string[]}
 */
// Solo cuentas que EXISTEN y controla el dueño. Un email listado aquí que no
// esté registrado es una puerta abierta: cualquiera podría crear la cuenta en
// Firebase y heredar el acceso admin (demo@ y admin@ se quitaron por eso).
const DEFAULT_ADMIN_EMAILS = [
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

/**
 * Comprueba si un ID token decodificado pertenece a un admin DE VERDAD:
 * email en la lista Y verificado. Firebase emite tokens con el email sin
 * verificar, así que sin este segundo check cualquiera que registrara un
 * email de la lista (si no existiera ya la cuenta) obtendría acceso admin.
 *
 * Todas las rutas de API de administración deben usar esta función, no
 * isAdminEmail a secas.
 *
 * @param {import('firebase-admin/auth').DecodedIdToken} decodedToken
 * @returns {boolean}
 */
export function isVerifiedAdmin(decodedToken) {
    return isAdminEmail(decodedToken?.email) && decodedToken?.email_verified === true;
}
