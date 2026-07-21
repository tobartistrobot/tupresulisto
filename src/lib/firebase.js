import { initializeApp, getApps } from "firebase/app";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Firestore con caché offline persistente (IndexedDB).
 *
 * Caso de uso: el autónomo presupuesta en casa del cliente, donde puede no haber
 * cobertura (sótanos, chalets, obra). Con la caché persistente la app sigue
 * funcionando sin conexión y sincroniza sola al recuperar red.
 *
 * Sólo aplica en navegador (IndexedDB no existe en SSR). initializeFirestore
 * lanza si Firestore ya se inició (p.ej. con Fast Refresh), de ahí el fallback.
 */
function createDb(firebaseApp) {
    if (typeof window === "undefined") return getFirestore(firebaseApp);
    try {
        return initializeFirestore(firebaseApp, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
    } catch (err) {
        // Ya inicializado (HMR o import duplicado): reutilizamos la instancia.
        return getFirestore(firebaseApp);
    }
}

const db = createDb(app);
const auth = getAuth(app);

// Forzar persistencia LOCAL para evitar desconexiones con el botón de "Atrás" (bfcache)
setPersistence(auth, browserLocalPersistence).catch(err => {
    console.error("Firebase persistence error:", err);
});

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { db, auth };
