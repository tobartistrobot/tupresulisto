'use client';
import { useAuth } from '../../context/AuthContext';
import AppV30 from '../../components/v30/AppV30';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getSubscriptionState } from '../../lib/subscription';

export default function DashboardPage() {
    const { user, userProfile, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
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

    // Una prueba regalada caduca; una suscripción de pago, no. Lo decide
    // getSubscriptionState para que no haya dos criterios distintos por el código.
    const subscription = getSubscriptionState(userProfile);

    return (
        <AppV30
            user={user}
            onLogout={logout}
            isPro={subscription.isPro}
            subscription={subscription}
            isImpersonating={false} // Todo: Add impersonation logic if needed
        />
    );
}
