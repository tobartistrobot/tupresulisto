import { getAdmin } from './firebaseAdmin';
import { marshal, unmarshal } from './firestoreMarshal';

/**
 * Acceso a datos de una cuenta para el servidor MCP (agentes).
 *
 * Lee y escribe EXACTAMENTE las mismas estructuras que la app (useSyncEngine):
 * productos en el documento raíz users/{uid} (con reserva del esquema legacy en
 * la subcolección data/products), configuración en data/config e historial en
 * data/history como { list, deleted } pasado por marshal/unmarshal.
 *
 * Historial: esquema moderno = un documento por presupuesto en la subcolección
 * users/{uid}/quotes (marca migratedToSubcollection en data/history). Crear un
 * documento nuevo no puede pisar nada. Para usuarios sin migrar se mantiene el
 * formato legacy (documento único data/history con list) con escritura doble
 * durante la transición.
 */

/** @returns {Promise<Array<object>>} Catálogo de productos del usuario, desmarshalizado. */
export async function loadProducts(uid) {
    const { adminDb } = getAdmin();
    const root = await adminDb.collection('users').doc(uid).get();

    if (root.exists && root.data().products) {
        let raw = root.data().products;
        if (!Array.isArray(raw) && raw.list) raw = raw.list;
        const products = unmarshal(raw);
        if (Array.isArray(products)) return products;
    }

    // Esquema antiguo: subcolección data/products
    const sub = await adminDb.collection('users').doc(uid).collection('data').doc('products').get();
    if (sub.exists) {
        const list = unmarshal(sub.data().list || []);
        if (Array.isArray(list)) return list;
    }

    return [];
}

/** @returns {Promise<number>} Tipo de IVA configurado por el usuario (21 por defecto). */
export async function loadIva(uid) {
    const { adminDb } = getAdmin();
    const doc = await adminDb.collection('users').doc(uid).collection('data').doc('config').get();
    if (!doc.exists) return 21;
    const iva = doc.data().iva;
    const parsed = parseFloat(iva);
    return iva !== undefined && iva !== '' && Number.isFinite(parsed) ? parsed : 21;
}

/** @returns {Promise<Array<object>>} Historial de presupuestos, desmarshalizado, tal como lo ve la app. */
export async function loadHistory(uid) {
    const { adminDb } = getAdmin();
    const userRef = adminDb.collection('users').doc(uid);
    const legacy = await userRef.collection('data').doc('history').get();

    // Usuario migrado: cada presupuesto es su propio documento en la
    // subcolección quotes; el doc legacy es solo una copia de seguridad.
    if (legacy.exists && legacy.data().migratedToSubcollection === true) {
        const snap = await userRef.collection('quotes').get();
        const list = snap.docs.map(d => unmarshal(d.data()));
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        return list;
    }

    // Usuario sin migrar: formato antiguo (documento único con list).
    if (!legacy.exists) return [];
    const list = unmarshal(legacy.data().list || []);
    return Array.isArray(list) ? list : [];
}

/**
 * Clientes derivados del historial, con la misma regla que la app (únicos por
 * teléfono; sin teléfono no hay ficha), más métricas útiles para un agente.
 */
export function deriveClients(history) {
    const unique = new Map();
    history.forEach(q => {
        if (q.client && q.client.phone) {
            const prev = unique.get(q.client.phone);
            unique.set(q.client.phone, {
                ...q.client,
                presupuestos: (prev?.presupuestos || 0) + 1,
                volumenTotal: (prev?.volumenTotal || 0) + (q.grandTotal || 0),
            });
        }
    });
    return Array.from(unique.values());
}

/**
 * Añade un presupuesto al historial. Con el esquema moderno, cada presupuesto
 * es su propio documento en la subcolección quotes: crearlo no puede pisar
 * nada de lo que haya escrito la app. Si el usuario aún no está migrado, se
 * escribe TAMBIÉN en el documento legacy (escritura doble) para que las apps
 * con código antiguo lo vean; la migración une ambos sin duplicar (mismo id).
 *
 * @param {string} uid
 * @param {object} quote - Presupuesto con el mismo esquema que crea la app.
 */
export async function appendQuote(uid, quote) {
    const { adminDb } = getAdmin();
    const userRef = adminDb.collection('users').doc(uid);
    const legacyRef = userRef.collection('data').doc('history');
    const quoteRef = userRef.collection('quotes').doc(String(quote.id));

    await adminDb.runTransaction(async tx => {
        const snap = await tx.get(legacyRef);
        const data = snap.exists ? snap.data() : {};
        const migrated = data.migratedToSubcollection === true;

        tx.set(quoteRef, marshal(quote));

        if (!migrated) {
            const list = Array.isArray(data.list) ? data.list : [];
            // Al principio, como hace la app (AppV30 usa [quote, ...history]):
            // varios sitios asumen que la lista va de más nuevo a más antiguo.
            list.unshift(marshal(quote));
            tx.set(legacyRef, { ...data, list });
        }
    });
}

/** Genera un número de presupuesto con el formato de la app, único dentro del historial dado. */
export function generateQuoteNumber(history) {
    const existing = new Set(history.map(q => q.number));
    let number;
    do {
        number = `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    } while (existing.has(number));
    return number;
}

/** Fecha de hoy con el formato y zona horaria que usa la app (es-ES, España). */
export function todayEs() {
    return new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
}
