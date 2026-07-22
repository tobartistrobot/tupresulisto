'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/** @typedef {{ adminEmail: string, targetEmail: string, adminRedirectUrl: string }} ImpersonationInfo */

const IMPERSONATION_KEY = 'tupresulisto_impersonation';

const AuthContext = createContext(null);

/** Aplica a un snapshot de `users/{uid}` la misma normalización de estado
 * que usan tanto el listener en tiempo real como el refresco puntual, para
 * que ambos caminos calculen `subscriptionStatus` de forma idéntica. */
function normalizeProfile(docSnap) {
    if (!docSnap.exists()) return { subscriptionStatus: 'inactive' };
    const data = docSnap.data();
    let status = data.subscriptionStatus || 'inactive';
    // Keep compatibility with 'pro' string or isPro boolean
    if (status === 'pro' || data.isPro === true) status = 'active';
    return { ...data, subscriptionStatus: status };
}

/**
 * Global authentication provider. Manages user session, profile sync from
 * Firestore, and the admin impersonation mode (user switch).
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    /** @type {[ImpersonationInfo | null, Function]} */
    const [impersonationInfo, setImpersonationInfo] = useState(null);
    const router = useRouter();

    // Rehydrate impersonation state from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem(IMPERSONATION_KEY);
            if (stored) {
                setImpersonationInfo(JSON.parse(stored));
            }
        } catch (err) {
            console.error('Failed to read impersonation state:', err);
        }
    }, []);

    useEffect(() => {
        let unsubProfile = null;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // Cleanup previous profile listener if any
            if (unsubProfile) {
                unsubProfile();
                unsubProfile = null;
            }

            if (currentUser) {
                // Sync Profile reactively
                unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
                    setUserProfile(normalizeProfile(docSnap));
                    // Release loading if we have a user and we just got the first profile snap
                    setLoading(false);
                }, (error) => {
                    console.error('Profile sync error:', error);
                    setLoading(false); // Release anyway to prevent hang
                });
            } else {
                setUserProfile(null);
                setLoading(false); // No user, immediately ready (for landing/login)
            }
        });

        return () => {
            unsubscribe();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [router]);

    /**
     * Vuelve a leer el documento del usuario una sola vez y actualiza
     * `userProfile`. Sirve para forzar el estado justo tras una acción que lo
     * cambia en el servidor (p. ej. canjear un cupón) sin depender de que el
     * listener en tiempo real reciba el push a tiempo.
     */
    const refreshUserProfile = useCallback(async () => {
        if (!auth.currentUser) return;
        try {
            const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            setUserProfile(normalizeProfile(docSnap));
        } catch (error) {
            console.error('Profile refresh error:', error);
        }
    }, []);

    /**
     * Initiates an admin impersonation session for the given user.
     * Stores the impersonation metadata in localStorage for persistence,
     * then signs in using the provided custom token.
     *
     * @param {string} customToken - Firebase custom token for the target user.
     * @param {string} targetEmail - Email of the user being impersonated.
     * @param {string} adminEmail - Email of the admin initiating the session.
     */
    const startImpersonation = useCallback(async (customToken, targetEmail, adminEmail) => {
        const info = {
            adminEmail,
            targetEmail,
            adminRedirectUrl: '/admin-stats-internal',
        };

        try {
            // Store impersonation context before signing in to avoid losing it
            localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(info));
            setImpersonationInfo(info);

            // Sign in as the impersonated user
            await signInWithCustomToken(auth, customToken);
            router.push('/dashboard');
        } catch (error) {
            // Rollback impersonation state if sign-in fails
            localStorage.removeItem(IMPERSONATION_KEY);
            setImpersonationInfo(null);
            console.error('Impersonation sign-in failed:', error);
            throw error;
        }
    }, [router]);

    /**
     * Exits the impersonation session, signs out the impersonated user,
     * and redirects the admin back to the admin panel.
     */
    const exitImpersonation = useCallback(async () => {
        const redirectUrl = impersonationInfo?.adminRedirectUrl || '/admin-stats-internal';
        try {
            localStorage.removeItem(IMPERSONATION_KEY);
            setImpersonationInfo(null);
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            router.replace(redirectUrl);
        } catch (error) {
            console.error('Exit impersonation error:', error);
        }
    }, [impersonationInfo, router]);

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            loading,
            logout,
            refreshUserProfile,
            impersonationInfo,
            startImpersonation,
            exitImpersonation,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

/** @returns {{ user: import('firebase/auth').User | null, userProfile: object | null, loading: boolean, logout: Function, refreshUserProfile: Function, impersonationInfo: ImpersonationInfo | null, startImpersonation: Function, exitImpersonation: Function }} */
export function useAuth() {
    return useContext(AuthContext);
}
