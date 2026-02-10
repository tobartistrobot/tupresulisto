'use client';
import { Suspense } from 'react';
import LandingPage from '../components/LandingPage';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function HomeContent() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if logged in
  if (!loading && user) {
    router.push('/dashboard');
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return <LandingPage
    onLogin={() => router.push('/login')}
    onRegister={() => router.push('/register')}
    onShowTour={() => router.push('/feature-editor')} // Not yet implemented route, but for now safe
  />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}