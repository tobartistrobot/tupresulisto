'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
                unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        let status = data.subscriptionStatus || 'inactive';
                        // Keep compatibility with 'pro' string or isPro boolean
                        if (status === 'pro' || data.isPro === true) status = 'active';
                        setUserProfile({ ...data, subscriptionStatus: status });
                    } else {
                        setUserProfile({ subscriptionStatus: 'inactive' });
                    }
                    // Release loading if we have a user and we just got the first profile snap
                    setLoading(false);
                }, (error) => {
                    console.error("Profile sync error:", error);
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

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            router.push('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
