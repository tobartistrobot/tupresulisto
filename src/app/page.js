'use client';
import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import LoginScreen from '../components/LoginScreen';
import LandingPage from '../components/LandingPage';
import AppV30 from '../components/v30/AppV30';
import UpgradeModal from '../components/UpgradeModal';
import EditorTourPage from '../components/EditorTourPage';
import VerificationPending from '../components/VerificationPending';
import AdminDashboard from '../components/AdminDashboard';

import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const [user, setUser] = useState(null); // Firebase Auth User Object
  const [userProfile, setUserProfile] = useState(null); // Firestore Data
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing');
  const [impersonatedUser, setImpersonatedUser] = useState(null); // For admin impersonation

  const searchParams = useSearchParams();
  const impersonateTarget = searchParams.get('impersonate');

  const ALLOWED_ADMINS = ['demo@tupresulisto.com', 'admin@tupresulisto.com', 'tobartistrobot@gmail.com'];

  // Global Scroll Reset
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // CHECK IMPERSONATION
        if (impersonateTarget && ALLOWED_ADMINS.includes(currentUser.email)) {
          console.log(`ADMIN MODE: Impersonating ${impersonateTarget}`);
          setImpersonatedUser({
            uid: impersonateTarget,
            email: 'impersonated@user.com',
            emailVerified: true
          });
          // We skip normal profile sync for the ADMIN user, and instead rely on the impersonated user logic downstream
          // BUT we still need to set 'view' to 'app'
          setView('app');
          setLoading(false);
          return;
        } else {
          setImpersonatedUser(null);
        }

        // Start listening to user profile changes (Real-time PRO status)
        const unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let status = data.subscriptionStatus || 'inactive';
            // Normalize status: 'pro' (from coupon) or 'active' (stripe/lemon) -> 'active'
            if (status === 'pro') status = 'active';
            if (data.isPro === true) status = 'active'; // Manual override
            setUserProfile({ subscriptionStatus: status });
          } else {
            setUserProfile({ subscriptionStatus: 'inactive' });
          }
        }, (error) => {
          console.error("Profile sync error:", error);
        });

        // Determine Entrance Logic (Portero)
        const isPublicView = ['landing', 'login', 'register'].includes(view);
        const isVerified = currentUser.emailVerified || sessionStorage.getItem('dev_bypass');

        if (isPublicView) {
          setView(isVerified ? 'app' : 'waiting-verification');
        } else if (view === 'waiting-verification' && isVerified) {
          setView('app');
        } else if (view === 'app' && !isVerified) {
          setView('waiting-verification');
        }

      } else {
        setUser(null);
        setUserProfile(null);
        if (view === 'app' || view === 'plans' || view === 'waiting-verification') setView('login');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [view, impersonateTarget]); // Added impersonateTarget dependency

  // Separate Effect for Profile Sync
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let status = data.subscriptionStatus || 'inactive';
        if (status === 'pro') status = 'active';
        if (data.isPro === true) status = 'active';
        setUserProfile({ subscriptionStatus: status });
      }
    });
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('dev_bypass');
    setUser(null);
    setUserProfile(null);
    setView('landing');
  };

  // "Portero" Logic - The Guard
  const handleEntranceRules = (targetUser) => {
    if (!targetUser) {
      setView('login');
      return;
    }

    // Check Subscription - NOW REMOVED for Freemium
    // Always allow entry to app, limits will be handled inside AppV30
    setView('app');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p className="font-bold text-lg animate-pulse">Cargando aplicación...</p>
      </div>
    );
  }

  // View Routing
  // Allow access to app if logged in (Freemium)
  if (view === 'app' && (user || impersonatedUser)) {
    const appUser = impersonatedUser || user;
    return <AppV30 user={appUser} onLogout={handleLogout} isPro={userProfile?.subscriptionStatus === 'active'} isImpersonating={!!impersonatedUser} />;
  }

  if (view === 'plans' && user) {
    return <PlansScreen user={user} onLogout={handleLogout} />;
  }

  if (view === 'feature-editor') {
    return <EditorTourPage
      onRegister={() => setView('register')}
      onBack={() => setView('landing')}
    />;
  }

  if (view === 'login' || view === 'register') {
    return <LoginScreen
      mode={view}
      onLoginSuccess={(u) => {
        handleEntranceRules(u);
      }}
      onSwitchToRegister={() => setView('register')}
      onSwitchToLogin={() => setView('login')}
    />;
  }

  // Default to Landing
  if (view === 'waiting-verification' && user) {
    return <VerificationPending
      user={user}
      onLogout={handleLogout}
      onVerified={() => {
        // Dev Bypass logic
        sessionStorage.setItem('dev_bypass', 'true');
        setView('app');
      }}
    />;
  }


  // Admin Internal View
  if (view === 'admin-internal' && user) {
    const ALLOWED_ADMINS = ['demo@tupresulisto.com', 'admin@tupresulisto.com', 'tobartistrobot@gmail.com'];
    if (!ALLOWED_ADMINS.includes(user.email)) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
          <h1 className="text-xl font-bold text-slate-700">Acceso Denegado</h1>
          <p className="text-sm text-slate-500 mt-2">Usuario actual: <span className="font-mono bg-slate-200 px-2 py-1 rounded">{user.email}</span></p>
          <p className="text-xs text-red-400 mt-1">Este email no tiene permisos de administrador.</p>
          <button onClick={() => setView('app')} className="mt-4 text-blue-600 underline">Volver</button>
        </div>
      );
    }
    return <AdminDashboard user={user} onBack={() => setView('app')} />;
  }

  return <LandingPage
    onLogin={() => setView('login')}
    onRegister={() => setView('register')}
    onShowTour={() => setView('feature-editor')}
  />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}