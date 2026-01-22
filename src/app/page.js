'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LoginScreen from '../components/LoginScreen';
import LandingPage from '../components/LandingPage';
import AppV30 from '../components/v30/AppV30';
import UpgradeModal from '../components/UpgradeModal';
import EditorTourPage from '../components/EditorTourPage';
import VerificationPending from '../components/VerificationPending';
import AdminDashboard from '../components/AdminDashboard';

export default function Home() {
  const [user, setUser] = useState(null); // Firebase Auth User Object
  const [userProfile, setUserProfile] = useState(null); // Firestore Data (subscription, etc.)
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'register' | 'feature-editor' | 'waiting-verification' | 'app' | 'plans'

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user profile from Firestore to check subscription
        let subscriptionStatus = 'inactive';
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            subscriptionStatus = data.subscriptionStatus || 'inactive';
            // Allow manual "isPro" override from Firebase profile
            if (data.isPro === true) subscriptionStatus = 'active';
          }
        } catch (error) {
          console.error("Error fetching user subscriptions:", error);
        }

        setUser(currentUser); // Keep the SDK object intact!
        setUserProfile({
          subscriptionStatus,
          // Add other profile fields if needed
        });

        // Determine Entrance Logic (Portero)
        // Check verification first
        // FIX: Do NOT auto-redirect from Landing Page. Only redirect from Login/Register/Waiting flows.
        // If on Landing, stay on Landing even if logged in.

        if (view === 'login' || view === 'register') {
          if (!currentUser.emailVerified) {
            setView('waiting-verification');
          } else {
            setView('app');
          }
        } else if (view === 'waiting-verification') {
          if (currentUser.emailVerified) {
            setView('app');
          }
          // else stay in waiting-verification
        } else if (view === 'app') {
          if (!currentUser.emailVerified) {
            setView('waiting-verification');
          }
        }
        // If view is 'landing', 'feature-editor', 'plans' -> Do nothing, let user browse.

      } else {
        setUser(null);
        setUserProfile(null);
        if (view === 'app' || view === 'plans' || view === 'waiting-verification') setView('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [view]); // Added 'view' dependency so the listener sees the current view state

  const handleLogout = async () => {
    await signOut(auth);
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Cargando...</div>;

  // View Routing
  // Allow access to app if logged in (Freemium)
  if (view === 'app' && user) {
    // PASS isPro from userProfile
    return <AppV30 onLogout={handleLogout} isPro={userProfile?.subscriptionStatus === 'active'} />;
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
        // Force reload user state and enter app
        window.location.reload(); // Simplest way to refresh auth state cleanly or we can just setUser
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