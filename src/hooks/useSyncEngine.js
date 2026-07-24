import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { marshal, unmarshal } from '../lib/firestoreMarshal';
import { clientDocId } from '../utils/clientKey';

const DEBUG = true;

const log = (msg, ...args) => {
    if (DEBUG) console.log(`%c[SYNC-DEBUG] ${msg}`, 'color: #0ea5e9; font-weight: bold;', ...args);
};

// Códigos de error de Firestore que de verdad indican un problema de red.
// El resto (permission-denied, invalid-argument, resource-exhausted...) no
// tiene nada que ver con la conexión y no debe mostrarse como tal.
const NETWORK_ERROR_CODES = new Set(['unavailable', 'deadline-exceeded', 'cancelled']);

// El marshal/unmarshal de Firestore vive en src/lib/firestoreMarshal.js,
// compartido con el servidor MCP para que ambos escriban el mismo formato.

// --- HISTORIAL EN SUBCOLECCIÓN ---
// Cada presupuesto vive en users/{uid}/quotes/{id} y cada elemento de la
// papelera en users/{uid}/trash/{deletedAt}. Así la app y los agentes
// escriben documentos sueltos y nadie pisa el trabajo de nadie. El documento
// único legacy (data/history) queda congelado como copia de seguridad tras
// la migración, con la marca migratedToSubcollection.

const byNewest = (a, b) => (b.id || 0) - (a.id || 0);

/**
 * Id de documento seguro a partir del id de un objeto. Firestore prohíbe '/'
 * en los ids (de ahí el encode) y rechaza '.' y '..' como id COMPLETO: el
 * prefijo los desactiva de paso, sin necesidad de casos especiales.
 */
const safeDocId = (id) => `p_${encodeURIComponent(String(id ?? ''))}`;

// Huella estable del contenido de un objeto ya pasado por marshal, para
// detectar qué documentos cambiaron de verdad y escribir solo esos.
const contentKey = (marshaled) => JSON.stringify(marshaled);

/**
 * Ejecuta operaciones set/delete en lotes.
 *
 * Se corta por DOS motivos, no solo por número: Firestore admite 500
 * operaciones por lote, pero también limita el tamaño de la petición. Los
 * productos llevan la foto en base64 (~200 KB cada uno), así que contar solo
 * operaciones haría lotes de decenas de megas que el servidor rechaza.
 */
const MAX_OPS_POR_LOTE = 400;
const MAX_BYTES_POR_LOTE = 4 * 1024 * 1024; // margen amplio bajo el límite real

const commitOps = async (ops) => {
    let lote = writeBatch(db);
    let n = 0;
    let bytes = 0;

    const cerrar = async () => {
        if (n > 0) await lote.commit();
        lote = writeBatch(db);
        n = 0;
        bytes = 0;
    };

    for (const op of ops) {
        const peso = op.remove ? 0 : contentKey(op.data).length;
        if (n > 0 && (n >= MAX_OPS_POR_LOTE || bytes + peso > MAX_BYTES_POR_LOTE)) await cerrar();
        if (op.remove) lote.delete(op.ref); else lote.set(op.ref, op.data);
        n++;
        bytes += peso;
    }
    await cerrar();
};

export const useSyncEngine = (user) => {
    // STATE MACHINE: 'IDLE' | 'LOADING' | 'READY' | 'SAVING' | 'ERROR'
    const [status, setStatus] = useState('IDLE');
    const [error, setError] = useState(null);

    // DATA STORES
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['General', 'Cocinas', 'Armarios']);
    // Todos los campos que edita Configuración DEBEN tener valor inicial:
    // un input cuyo value empieza en undefined es "no controlado" para React
    // y se vuelve controlado al llegar el dato — con aviso en consola y
    // parpadeo del valor. email/address/website/bankAccount faltaban.
    const [config, setConfig] = useState({
        name: 'Tu Carpintería',
        color: '#2563eb',
        logo: null,
        cif: '',
        phone: '',
        email: '',
        address: '',
        website: '',
        bankAccount: '',
        legalText: 'Presupuesto válido por 15 días.',
        iva: 21,
        // Caducidad automática de pendientes: apagada por defecto para no
        // cambiar el comportamiento a nadie que no la active a propósito.
        autoRejectEnabled: false,
        autoRejectDays: 30
    });
    const [history, setHistory] = useState([]);
    const [deletedHistory, setDeletedHistory] = useState([]);
    // Fichas de cliente guardadas: existen por sí mismas, no se deducen del
    // historial. Así borrar el último presupuesto de alguien no le borra la
    // ficha; solo desaparece si se elimina la ficha a propósito.
    const [clients, setClients] = useState([]);

    // Refs to track previous values for change detection
    const isFirstLoad = useRef(true);
    const saveTimeout = useRef(null);
    // Cuenta fallos de RED consecutivos; solo eso justifica el aviso de "sin conexión"
    const consecutiveNetworkErrors = useRef(0);

    // Espejo del estado actual para que el listener en tiempo real pueda
    // compararlo sin re-suscribirse en cada render (evita closures obsoletos).
    const historyRef = useRef([]);
    historyRef.current = history;

    // Última versión persistida de cada documento (clave -> huella del
    // contenido). El auto-guardado solo escribe los que difieren de esto.
    const persistedQuotes = useRef(new Map());
    const persistedTrash = useRef(new Map());
    const persistedClients = useRef(new Map());
    const persistedProducts = useRef(new Map());
    // Una vez migrados los productos a subcolección, el auto-guardado deja de
    // escribir el array en el documento raíz: si siguiera haciéndolo, el
    // documento volvería a crecer y el límite de 1 MB seguiría acechando.
    const productsMigrated = useRef(false);

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
                const [userRoot, productsSub, configSub, historySub, quotesSnap, trashSnap, clientsSnap, productsSnap] = await Promise.all([
                    getDoc(doc(db, "users", user.uid)),
                    getDoc(doc(db, "users", user.uid, "data", "products")),
                    getDoc(doc(db, "users", user.uid, "data", "config")),
                    getDoc(doc(db, "users", user.uid, "data", "history")),
                    getDocs(collection(db, "users", user.uid, "quotes")),
                    getDocs(collection(db, "users", user.uid, "trash")),
                    getDocs(collection(db, "users", user.uid, "clients")),
                    getDocs(collection(db, "users", user.uid, "products"))
                ]);

                const rootData = userRoot.exists() ? userRoot.data() : {};

                // Las categorías se quedan en el documento raíz: son cuatro
                // cadenas, no engordan nada.
                if (Array.isArray(rootData.categories)) setCategories(rootData.categories);

                // 1. PRODUCTOS: un documento por producto en la subcolección
                // users/{uid}/products.
                //
                // Antes vivían TODOS en un array del documento raíz, y como
                // cada uno lleva su foto en base64 (~150-200 KB), bastaban
                // cinco o seis para acercarse al límite de 1 MB por documento
                // de Firestore: a partir de ahí la cuenta dejaba de guardar.
                // Con un documento por producto, ese límite pasa a ser por
                // producto — inalcanzable — en vez de para el catálogo entero.
                if (rootData.productsMigratedAt) {
                    const lista = productsSnap.docs.map(d => unmarshal(d.data()));
                    setProducts(lista);
                    persistedProducts.current = new Map(lista.map(p => [safeDocId(p.id), contentKey(marshal(p))]));
                    productsMigrated.current = true;
                    log(`Productos cargados desde subcolección: ${lista.length}.`);
                } else {
                    // Origen legacy: array del raíz o, más antiguo aún, el
                    // documento data/products.
                    let legacy = [];
                    if (rootData.products) {
                        let raw = rootData.products;
                        if (!Array.isArray(raw) && raw.list) raw = raw.list;
                        const desmarshalado = unmarshal(raw);
                        if (Array.isArray(desmarshalado)) legacy = desmarshalado;
                    }
                    if (legacy.length === 0 && productsSub.exists()) {
                        const data = productsSub.data();
                        legacy = unmarshal(data.list || []) || [];
                        if (Array.isArray(data.categories)) setCategories(data.categories);
                        log('Productos encontrados en el esquema antiguo data/products.');
                    }

                    // Unión por id con lo que ya hubiera en la subcolección:
                    // idempotente si una migración anterior se quedó a medias.
                    const yaEnSub = productsSnap.docs.map(d => unmarshal(d.data()));
                    const vistos = new Set(yaEnSub.map(p => safeDocId(p.id)));
                    const lista = [...yaEnSub, ...legacy.filter(p => p && !vistos.has(safeDocId(p.id)))]
                        // Un producto sin id daría el mismo nombre de documento
                        // que otro igual de roto, y uno pisaría al otro sin
                        // avisar. Se le pone uno antes de escribir.
                        .map((p, i) => (p.id === undefined || p.id === null || String(p.id).trim() === '')
                            ? { ...p, id: `${Date.now()}-${i}` }
                            : p);

                    if (lista.length > 0) {
                        log(`⏫ Migrando ${lista.length} producto(s) a subcolección...`);
                        await commitOps(lista.map(p => ({
                            ref: doc(db, 'users', user.uid, 'products', safeDocId(p.id)),
                            data: marshal(p),
                        })));
                    }
                    // La marca va al final: si algo falla antes, la próxima
                    // carga reintenta la migración entera. El array del raíz NO
                    // se borra: queda congelado como copia de seguridad y, al
                    // dejar de escribirse, el documento deja de crecer.
                    await setDoc(doc(db, 'users', user.uid), { productsMigratedAt: Date.now() }, { merge: true });

                    setProducts(lista);
                    persistedProducts.current = new Map(lista.map(p => [safeDocId(p.id), contentKey(marshal(p))]));
                    productsMigrated.current = true;
                    log('✅ Productos migrados. El array del documento raíz queda como copia de seguridad.');
                }

                // 2. Config
                if (configSub.exists()) {
                    setConfig(prev => ({ ...prev, ...unmarshal(configSub.data()) }));
                    log('Configuración cargada.');
                }

                // 3. Historial: subcolección quotes/trash (moderno), con
                // migración automática desde el documento único (legacy).
                const legacyData = historySub.exists() ? historySub.data() : null;
                const migratedAt = legacyData?.migratedToSubcollection === true ? (legacyData.migratedAt || 0) : null;

                let quotes = quotesSnap.docs.map(d => unmarshal(d.data()));
                let trash = trashSnap.docs.map(d => unmarshal(d.data()));

                if (migratedAt === null && legacyData) {
                    // MIGRACIÓN: copiar cada presupuesto y cada elemento de
                    // papelera a su propio documento. El doc legacy NO se
                    // borra: queda congelado como copia de seguridad.
                    const legacyList = unmarshal(legacyData.list || []) || [];
                    const legacyDeleted = unmarshal(legacyData.deleted || []) || [];

                    // Unión por id (idempotente): si un agente ya escribió en
                    // la subcolección, no se duplica; si la migración anterior
                    // se cortó a medias, se completa.
                    const seen = new Set(quotes.map(q => String(q.id)));
                    quotes = [...quotes, ...legacyList.filter(q => q && !seen.has(String(q.id)))];
                    const seenTrash = new Set(trash.map(t => String(t.deletedAt)));
                    trash = [...trash, ...legacyDeleted.filter(t => t && !seenTrash.has(String(t.deletedAt)))];

                    // No resucitar lo que ya está en la papelera nueva.
                    const trashedIds = new Set();
                    trash.forEach(t => {
                        if (t.type === 'quote' && t.data) trashedIds.add(String(t.data.id));
                        if (t.type === 'client' && Array.isArray(t.data?.quotes)) t.data.quotes.forEach(q => trashedIds.add(String(q.id)));
                    });
                    quotes = quotes.filter(q => !trashedIds.has(String(q.id)));

                    log(`⏫ Migrando historial a subcolección: ${quotes.length} presupuestos, ${trash.length} en papelera...`);
                    await commitOps([
                        ...quotes.map(q => ({ ref: doc(db, 'users', user.uid, 'quotes', String(q.id)), data: marshal(q) })),
                        ...trash.map(t => ({ ref: doc(db, 'users', user.uid, 'trash', String(t.deletedAt)), data: marshal(t) })),
                    ]);
                    // La marca va al final: si algo falla antes, la próxima
                    // carga reintenta la migración completa.
                    await setDoc(doc(db, 'users', user.uid, 'data', 'history'), { migratedToSubcollection: true, migratedAt: Date.now(), legacyResolvedIds: [] }, { merge: true });
                    log('✅ Migración completada. El doc legacy queda como copia de seguridad.');
                } else if (migratedAt !== null && legacyData) {
                    // ADOPCIÓN DE HUÉRFANOS: un escritor con código antiguo
                    // (PWA cacheada, MCP sin redesplegar) puede seguir metiendo
                    // presupuestos NUEVOS en el doc legacy. Los detectamos por
                    // id (timestamp) posterior a la migración y los adoptamos.
                    //
                    // CADA CANDIDATO SE MIRA UNA SOLA VEZ y queda anotado en
                    // legacyResolvedIds. Sin ese registro, la condición "está en
                    // legacy y no en la subcolección" volvía a cumplirse en
                    // cuanto el usuario BORRABA el presupuesto, así que la
                    // siguiente carga lo resucitaba — y con él, su cliente.
                    //
                    // Se anotan TODOS los candidatos, estén o no en la
                    // subcolección: un candidato presente hoy también está
                    // resuelto, y si solo anotáramos los ausentes volvería a
                    // resucitar en cuanto lo borraran. (El campo se llama
                    // legacyResolvedIds y no adoptedIds justamente para que las
                    // cuentas que guardaron el registro incompleto anterior
                    // rehagan el censo entero y queden reparadas.)
                    const legacyList = unmarshal(legacyData.list || []) || [];
                    const historyRef = doc(db, 'users', user.uid, 'data', 'history');
                    // Lo que un escritor antiguo haya metido en el doc legacy
                    // DESPUÉS de migrar; lo anterior ya lo trajo la migración.
                    const candidatos = (Array.isArray(legacyList) ? legacyList : [])
                        .filter(q => q && (q.id || 0) > migratedAt);
                    const resueltos = Array.isArray(legacyData.legacyResolvedIds)
                        ? new Set(legacyData.legacyResolvedIds.map(String))
                        : null;

                    if (resueltos === null) {
                        // Primer censo: la subcolección YA es la verdad (el
                        // usuario ha podido borrar cosas a conciencia). Damos
                        // por resueltos todos los candidatos SIN resucitar
                        // ninguno, para no deshacerle borrados hechos aposta.
                        await setDoc(historyRef, { legacyResolvedIds: candidatos.map(q => String(q.id)) }, { merge: true });
                        if (candidatos.length > 0) log(`Censados ${candidatos.length} presupuesto(s) del doc legacy como ya resueltos: no se resucitan.`);
                    } else {
                        const subIds = new Set(quotes.map(q => String(q.id)));
                        const nuevos = candidatos.filter(q => !resueltos.has(String(q.id)));
                        const aAdoptar = nuevos.filter(q => !subIds.has(String(q.id)));
                        if (aAdoptar.length > 0) {
                            log(`🧹 Adoptando ${aAdoptar.length} presupuesto(s) huérfano(s) del doc legacy.`);
                            await commitOps(aAdoptar.map(q => ({ ref: doc(db, 'users', user.uid, 'quotes', String(q.id)), data: marshal(q) })));
                            quotes = [...quotes, ...aAdoptar];
                        }
                        if (nuevos.length > 0) {
                            await setDoc(historyRef, { legacyResolvedIds: [...resueltos, ...nuevos.map(q => String(q.id))] }, { merge: true });
                        }
                    }
                }

                quotes.sort(byNewest);
                setHistory(quotes);
                setDeletedHistory(trash);
                persistedQuotes.current = new Map(quotes.map(q => [String(q.id), contentKey(marshal(q))]));
                persistedTrash.current = new Map(trash.map(t => [String(t.deletedAt), contentKey(marshal(t))]));

                // 4. Fichas de cliente guardadas. No se siembran desde el
                // historial: la app las va guardando al crear o borrar
                // presupuestos, así que las de siempre se conservan sin
                // necesidad de una migración masiva.
                const fichas = clientsSnap.docs.map(d => unmarshal(d.data()));
                setClients(fichas);
                persistedClients.current = new Map(fichas.map(c => [clientDocId(c), contentKey(marshal(c))]));

                log(`Historial cargado: ${quotes.length} presupuestos, ${trash.length} en papelera, ${fichas.length} fichas de cliente.`);

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
            const cleanConfig = marshal(config);

            // En el documento raíz ya SOLO van las categorías. Los productos
            // viven en su subcolección desde la migración; volver a escribir
            // aquí el array entero (con las fotos en base64) es justo lo que
            // hacía crecer el documento hasta el límite de 1 MB.
            await setDoc(doc(db, 'users', user.uid), { categories }, { merge: true });

            // Subcollections
            await setDoc(doc(db, 'users', user.uid, 'data', 'config'), cleanConfig);

            // Historial: SOLO los documentos que cambiaron (nunca el
            // historial entero, para no pisar lo que escriban los agentes).
            const ops = [];
            const diffInto = (items, keyOf, persisted, colName) => {
                const next = new Map();
                items.forEach(item => {
                    const key = String(keyOf(item));
                    const clean = marshal(item);
                    const fingerprint = contentKey(clean);
                    next.set(key, fingerprint);
                    if (persisted.current.get(key) !== fingerprint) {
                        ops.push({ ref: doc(db, 'users', user.uid, colName, key), data: clean });
                    }
                });
                persisted.current.forEach((_, key) => {
                    if (!next.has(key)) ops.push({ ref: doc(db, 'users', user.uid, colName, key), remove: true });
                });
                return next;
            };
            const nextQuotes = diffInto(history, q => q.id, persistedQuotes, 'quotes');
            const nextTrash = diffInto(deletedHistory, t => t.deletedAt, persistedTrash, 'trash');
            const nextClients = diffInto(clients, c => clientDocId(c), persistedClients, 'clients');
            // Los productos solo se escriben en la subcolección una vez
            // migrados; si la migración aún no ha corrido, no tocarlos.
            const nextProducts = productsMigrated.current
                ? diffInto(products, p => safeDocId(p.id), persistedProducts, 'products')
                : persistedProducts.current;
            if (ops.length > 0) {
                await commitOps(ops);
                log(`${ops.length} documento(s) escritos/borrados.`);
            }
            persistedQuotes.current = nextQuotes;
            persistedTrash.current = nextTrash;
            persistedClients.current = nextClients;
            persistedProducts.current = nextProducts;

            setStatus('READY'); // Return to ready
            consecutiveNetworkErrors.current = 0;
            log('✅ Guardado exitoso.');
        } catch (err) {
            console.error("Save Error:", err);
            setError(err.message);

            // Con la caché offline persistente activada, una desconexión real
            // casi nunca rechaza el write (se encola y se resuelve solo). Un
            // solo fallo suele ser un blip transitorio o un error que no
            // tiene nada que ver con la red (permisos, datos inválidos...), y
            // avisar "comprueba tu internet" en esos casos es engañoso.
            const isNetworkError = NETWORK_ERROR_CODES.has(err.code);
            const reallyOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
            consecutiveNetworkErrors.current = isNetworkError ? consecutiveNetworkErrors.current + 1 : 0;

            if (isNetworkError && (reallyOffline || consecutiveNetworkErrors.current >= 2)) {
                setStatus('ERROR');
                setTimeout(() => setStatus('READY'), 5000); // Retry state after 5s
            } else {
                // No lo consideramos una desconexión: no interrumpimos con el
                // aviso. El próximo cambio disparará un nuevo intento normal.
                setStatus('READY');
            }
        }
    }, [user, status, products, config, history, deletedHistory, clients]);

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
    }, [products, categories, config, history, deletedHistory, clients]); // Listen to ALL data changes

    // 4. REALTIME: ESCUCHA DEL HISTORIAL
    // El agente MCP (y otros dispositivos del mismo usuario) escriben presupuestos
    // como documentos sueltos en la subcolección. Este listener los refleja
    // en el panel sin recargar.
    useEffect(() => {
        if (!user) return;

        const unsub = onSnapshot(collection(db, 'users', user.uid, 'quotes'), (snap) => {
            // La carga inicial aún no terminó: ella es la responsable del primer estado.
            if (isFirstLoad.current) return;
            // Eco de un guardado hecho por esta misma pestaña: ignorar.
            if (snap.metadata.hasPendingWrites) return;

            const remote = snap.docs.map(d => unmarshal(d.data()));
            remote.sort(byNewest);

            // Si lo remoto coincide con lo que ya tenemos, no tocar el estado:
            // romper aquí el ciclo evita el bucle listener -> auto-guardado -> listener.
            if (JSON.stringify(remote) === JSON.stringify(historyRef.current)) return;

            log('📡 Historial actualizado desde fuera (agente u otro dispositivo).');
            // Registrar lo recibido como "persistido" para que el próximo
            // auto-guardado no reescriba documentos que no han cambiado.
            persistedQuotes.current = new Map(remote.map(q => [String(q.id), contentKey(marshal(q))]));
            setHistory(remote);
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
        clients,

        // Data Setters
        setProducts,
        setCategories,
        setConfig,
        setHistory,
        setDeletedHistory,
        setClients
    };
};
