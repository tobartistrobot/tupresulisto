export const DB_CONFIG = { name: 'TuPresuListoDB', version: 1, store: 'app_data' };

export const dbApi = {
    open: () => new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return resolve(null); // SSR check
        const req = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
        req.onupgradeneeded = (e) => { e.target.result.createObjectStore(DB_CONFIG.store); };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    }),
    get: async (key) => {
        const db = await dbApi.open();
        if (!db) return null;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_CONFIG.store, 'readonly');
            const req = tx.objectStore(DB_CONFIG.store).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },
    set: async (key, val) => {
        const db = await dbApi.open();
        if (!db) return;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_CONFIG.store, 'readwrite');
            const req = tx.objectStore(DB_CONFIG.store).put(val, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
};
