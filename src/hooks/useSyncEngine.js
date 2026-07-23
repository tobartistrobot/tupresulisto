import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DEBUG = true;

const log = (msg, ...args) => {
    if (DEBUG) console.log(`%c[SYNC-DEBUG] ${msg}`, 'color: #0ea5e9; font-weight: bold;', ...args);
};

// --- DATA MARSHALLER (Firestore Compatibility) ---
// Firestore forbids: undefined, nested arrays (Array<Array>), and custom prototypes.
// We preserve Dates.

const marshal = (payload) => {
    if (payload === undefined) return null;
    if (payload === null) return null;
    if (typeof payload === 'function') return null;
    if (payload instanceof Date) return payload; // Dates are native to Firestore

    if (Array.isArray(payload)) {
        // CHECK NESTED ARRAYS
        // If an item in this array is ALSO an array, Firestore will explode.
        // We MUST convert the inner array to a Map/Object.
        return payload.map(item => {
            if (Array.isArray(item)) {
                // Detected Nested Array: Convert [a, b] -> { '0': a, '1': b, _isNested: true }
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

// UN-MARSHAL (Restore State)
// When loading, we look for { _isNested: true } and convert back to Array.
const unmarshal = (payload) => {
    if (payload === null || payload === undefined) return payload;
    if (payload instanceof Date) return payload;
    // Firestore Timestamps to Date (if needed, though usually SDK handles it if saved as Date)
    if (payload && typeof payload.toDate === 'function') return payload.toDate();

    if (Array.isArray(payload)) {
        return payload.map(item => unmarshal(item));
    }

    if (typeof payload === 'object') {
        if (payload._isNested === true) {
            // Convert back to array
            // Keys are "0", "1", "2"... 
            const arr = [];
            Object.keys(payload).forEach(key => {
                if (key !== '_isNested') {
                    arr[parseInt(key)] = unmarshal(payload[key]);
                }
            });
            // Filter out holes if any, though standard iteration usually matches
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
// ------------------------------------------------

export const useSyncEngine = (user) => {
    // STATE MACHINE: 'IDLE' | 'LOADING' | 'READY' | 'SAVING' | 'ERROR'
    const [status, setStatus] = useState('IDLE');
    const [error, setError] = useState(null);

    // DATA STORES
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['General', 'Cocinas', 'Armarios']);
    const [config, setConfig] = useState({
        name: 'Tu Carpintería',
        color: '#2563eb',
        logo: null,
        cif: '',
        phone: '',
        legalText: 'Presupuesto válido por 15 días.',
        iva: 21
    });
    const [history, setHistory] = useState([]);
    const [deletedHistory, setDeletedHistory] = useState([]);

    // Refs to track previous values for change detection
    const isFirstLoad = useRef(true);
    const saveTimeout = useRef(null);

    // Espejos del estado actual para que el listener en tiempo real pueda
    // compararlos sin re-suscribirse en cada render (evita closures obsoletos).
    const historyRef = useRef([]);
    const deletedRef = useRef([]);
    historyRef.current = history;
    deletedRef.current = deletedHistory;

    // 1. INITIAL LOAD
    useEffect(() => {
        if (!user) {
            setStatus('IDLE');
            return;
        }

        const loadData = async () => {
            log('Iniciando carga de datos...');
            setStatus('LOADING');
            isFirstLoad.current = true;

            try {
                // Fetch all docs in parallel
                const [userRoot, productsSub, configSub, historySub] = await Promise.all([
                    getDoc(doc(db, "users", user.uid)),
                    getDoc(doc(db, "users", user.uid, "data", "products")),
                    getDoc(doc(db, "users", user.uid, "data", "config")),
                    getDoc(doc(db, "users", user.uid, "data", "history"))
                ]);

                // 1. Products Strategy (Root > Subcollection)
                let productsLoaded = false;
                if (userRoot.exists()) {
                    const data = userRoot.data();
                    if (data.products) {
                        // UNMARSHAL HERE for modern schema
                        let rawProducts = data.products;

                        if (!Array.isArray(rawProducts) && rawProducts.list) {
                            rawProducts = rawProducts.list;
                        }

                        const unmarshaledProducts = unmarshal(rawProducts);

                        if (Array.isArray(unmarshaledProducts)) {
                            setProducts(unmarshaledProducts);
                            productsLoaded = true;
                        }
                    }
                    // Load Categories from Root if available
                    if (data.categories && Array.isArray(data.categories)) {
                        setCategories(data.categories);
                    }
                }

                if (!productsLoaded && productsSub.exists()) {
                    const data = productsSub.data();
                    const list = unmarshal(data.list || []);
                    setProducts(list);
                    setCategories(data.categories || ['General']);
                    log('Productos cargados desde subcolección antigua (Legacy).');
                } else if (productsLoaded) {
                    log('Productos cargados desde Root (Modern).');
                } else {
                    log('No se encontraron productos. Iniciando vacío.');
                }

                // 2. Config
                if (configSub.exists()) {
                    setConfig(prev => ({ ...prev, ...unmarshal(configSub.data()) }));
                    log('Configuración cargada.');
                }

                // 3. History
                if (historySub.exists()) {
                    setHistory(unmarshal(historySub.data().list || []));
                    setDeletedHistory(unmarshal(historySub.data().deleted || []));
                    log(`Historial cargado: ${historySub.data().list?.length || 0} items.`);
                }

                setStatus('READY');
                log('✅ Estado: READY. Auto-guardado activado.');

            } catch (err) {
                console.error("Critical Load Error:", err);
                setError(err.message);
                setStatus('ERROR');
            } finally {
                isFirstLoad.current = false;
            }
        };

        loadData();
    }, [user]); // user.uid is stable

    // 2. AUTO-SAVE ENGINE
    const saveData = useCallback(async () => {
        if (!user || status !== 'READY') return;

        setStatus('SAVING');
        log('💾 Auto-guardando cambios...');

        try {
            // MARSHALLING (Sanitize + Nested Array Fix)
            const cleanProducts = marshal(products);
            const cleanConfig = marshal(config);
            const cleanHistory = marshal({ list: history, deleted: deletedHistory });

            // BATCH OR PARALLEL WRITES?
            // Let's do parallel for speed, but unrelated errors imply partial success.
            // Critical: Products and Categories on Root
            await setDoc(doc(db, 'users', user.uid), {
                products: cleanProducts,
                categories: categories
            }, { merge: true });

            // Subcollections
            await setDoc(doc(db, 'users', user.uid, 'data', 'config'), cleanConfig);
            await setDoc(doc(db, 'users', user.uid, 'data', 'history'), cleanHistory);

            setStatus('READY'); // Return to ready
            log('✅ Guardado exitoso.');
        } catch (err) {
            console.error("Save Error:", err);
            setError(err.message);
            setStatus('ERROR'); // Stuck in error until reload or manual retry?
            // Actually, let's revert to ready to allow retry?
            // No, keep error visible. User might need to check net.
            // Auto-retry via SWR logic? For now, simple error state.
            setTimeout(() => setStatus('READY'), 5000); // Retry state after 5s
        }
    }, [user, status, products, config, history, deletedHistory]);

    // 3. TRIGGER LISTENERS (Debounce)
    useEffect(() => {
        // SKIP Initial Render/Load
        if (isFirstLoad.current || status === 'LOADING' || status === 'IDLE') return;
        if (status === 'ERROR') return;

        // Debounce
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            saveData();
        }, 2000); // 2s debounce

        return () => clearTimeout(saveTimeout.current);
    }, [products, categories, config, history, deletedHistory]); // Listen to ALL data changes

    // 4. REALTIME: ESCUCHA DEL HISTORIAL
    // El agente MCP (y otros dispositivos del mismo usuario) escriben presupuestos
    // directamente en Firestore. Este listener los refleja en el panel sin recargar.
    useEffect(() => {
        if (!user) return;

        const unsub = onSnapshot(doc(db, 'users', user.uid, 'data', 'history'), (snap) => {
            // La carga inicial aún no terminó: ella es la responsable del primer estado.
            if (isFirstLoad.current) return;
            // Eco de un guardado hecho por esta misma pestaña: ignorar.
            if (snap.metadata.hasPendingWrites) return;
            if (!snap.exists()) return;

            const remoteList = unmarshal(snap.data().list || []);
            const remoteDeleted = unmarshal(snap.data().deleted || []);

            // Si lo remoto coincide con lo que ya tenemos, no tocar el estado:
            // romper aquí el ciclo evita el bucle listener -> auto-guardado -> listener.
            if (JSON.stringify(remoteList) === JSON.stringify(historyRef.current) &&
                JSON.stringify(remoteDeleted) === JSON.stringify(deletedRef.current)) return;

            log('📡 Historial actualizado desde fuera (agente u otro dispositivo).');
            setHistory(Array.isArray(remoteList) ? remoteList : []);
            setDeletedHistory(Array.isArray(remoteDeleted) ? remoteDeleted : []);
        });

        return unsub;
    }, [user]);

    return {
        // State
        status, // IDLE, LOADING, READY, SAVING, ERROR
        error,

        // Data Getters
        products,
        categories,
        config,
        history,
        deletedHistory,

        // Data Setters
        setProducts,
        setCategories,
        setConfig,
        setHistory,
        setDeletedHistory
    };
};
