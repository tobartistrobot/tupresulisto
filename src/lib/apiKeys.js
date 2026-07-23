import { createHash, randomBytes } from 'node:crypto';
import { getAdmin } from './firebaseAdmin';

/**
 * Claves de API para agentes (servidor MCP).
 *
 * Diseño:
 *  - La clave en claro (`tpl_...`) solo existe en el momento de crearla: se
 *    muestra una vez al usuario y no se guarda. En Firestore se almacena su
 *    hash SHA-256 como ID del documento en la colección `api_keys`, así que
 *    verificar una clave es una lectura directa por ID (sin índices) y un
 *    volcado de la base de datos no revela ninguna clave utilizable.
 *  - Cada clave pertenece a un uid y solo da acceso a los datos de ese uid.
 *    Es la lección del agente de Telegram que hubo que apagar en mayo: el
 *    ámbito de permisos se define el primer día, no se parchea después.
 *  - Revocar no borra el documento: deja `revoked: true` como rastro.
 *
 * La colección `api_keys` no aparece en firestore.rules a propósito: las
 * reglas deniegan por defecto, y solo el Admin SDK (que las ignora) la toca.
 */

const KEY_PREFIX = 'tpl_';
/** Máximo de claves activas por usuario; suficiente para varios agentes. */
export const MAX_ACTIVE_KEYS = 5;
/** lastUsedAt se actualiza como mucho una vez por hora para no pagar una escritura por llamada. */
const LAST_USED_THROTTLE_MS = 60 * 60 * 1000;

/** @returns {string} Una clave nueva en claro, p. ej. "tpl_9f2c...". */
export function generateApiKey() {
    return KEY_PREFIX + randomBytes(28).toString('hex');
}

/** @param {string} key @returns {string} SHA-256 en hex, usado como ID de documento. */
export function hashApiKey(key) {
    return createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * Verifica una cabecera Authorization de tipo Bearer con clave de API.
 *
 * @param {string | null | undefined} authHeader - Valor de la cabecera Authorization.
 * @returns {Promise<{ uid: string, keyId: string, label: string } | null>}
 *   Identidad del dueño de la clave, o null si la clave falta, no existe o está revocada.
 */
export async function verifyApiKey(authHeader) {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const key = authHeader.substring(7).trim();
    if (!key.startsWith(KEY_PREFIX)) return null;

    const { adminDb } = getAdmin();
    const keyId = hashApiKey(key);
    const doc = await adminDb.collection('api_keys').doc(keyId).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (data.revoked) return null;

    // Marca de último uso, con acelerador para no escribir en cada llamada.
    const last = data.lastUsedAt?.toMillis ? data.lastUsedAt.toMillis() : 0;
    if (Date.now() - last > LAST_USED_THROTTLE_MS) {
        doc.ref.update({ lastUsedAt: new Date() }).catch(() => { /* no bloquea la petición */ });
    }

    return { uid: data.uid, keyId, label: data.label || '' };
}
