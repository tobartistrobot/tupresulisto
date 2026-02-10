'use client';
import { useAuth } from '../../context/AuthContext';
import AppV30 from '../../components/v30/AppV30';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { user, userProfile, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (!user) return null; // Prevent flash

    return (
        <AppV30
            user={user}
            onLogout={logout}
            isPro={userProfile?.subscriptionStatus === 'active'}
            isImpersonating={false} // Todo: Add impersonation logic if needed
        />
    );
}
