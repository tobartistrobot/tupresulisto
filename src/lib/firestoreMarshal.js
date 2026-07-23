/**
 * Conversión de datos de la app ⇄ Firestore, compartida por el cliente
 * (useSyncEngine) y el servidor (MCP / API). Extraída de useSyncEngine para
 * que cualquier código que escriba presupuestos o productos use EXACTAMENTE
 * el mismo formato: si el servidor escribiera arrays anidados a pelo,
 * Firestore rechazaría el documento (no los admite), y si escribiera otro
 * envoltorio, la app no sabría leerlo.
 *
 * Firestore prohíbe: undefined, arrays anidados (Array<Array>) y prototipos
 * a medida. Las fechas (Date) se conservan tal cual.
 */

/** Prepara un valor de la app para escribirse en Firestore. */
export const marshal = (payload) => {
    if (payload === undefined) return null;
    if (payload === null) return null;
    if (typeof payload === 'function') return null;
    if (payload instanceof Date) return payload; // Dates are native to Firestore

    if (Array.isArray(payload)) {
        // Un array dentro de otro array revienta en Firestore: el interior se
        // convierte en objeto { '0': a, '1': b, _isNested: true } y unmarshal
        // lo restaura al leer.
        return payload.map(item => {
            if (Array.isArray(item)) {
                const objWrapper = { _isNested: true };
                item.forEach((subItem, idx) => {
                    objWrapper[idx.toString()] = marshal(subItem);
                });
                return objWrapper;
            }
            return marshal(item);
        });
    }

    if (typeof payload === 'object') {
        const cleanObj = {};
        Object.keys(payload).forEach(key => {
            cleanObj[key] = marshal(payload[key]);
        });
        return cleanObj;
    }

    return payload;
};

/** Restaura un valor leído de Firestore al formato que espera la app. */
export const unmarshal = (payload) => {
    if (payload === null || payload === undefined) return payload;
    if (payload instanceof Date) return payload;
    // Firestore Timestamps to Date (if needed, though usually SDK handles it if saved as Date)
    if (payload && typeof payload.toDate === 'function') return payload.toDate();

    if (Array.isArray(payload)) {
        return payload.map(item => unmarshal(item));
    }

    if (typeof payload === 'object') {
        if (payload._isNested === true) {
            // Convert back to array — keys are "0", "1", "2"...
            const arr = [];
            Object.keys(payload).forEach(key => {
                if (key !== '_isNested') {
                    arr[parseInt(key)] = unmarshal(payload[key]);
                }
            });
            return Array.from(arr);
        }

        const cleanObj = {};
        Object.keys(payload).forEach(key => {
            cleanObj[key] = unmarshal(payload[key]);
        });
        return cleanObj;
    }

    return payload;
};
