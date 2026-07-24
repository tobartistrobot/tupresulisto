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

    // Texto compartido desde otra app (share_target del manifest): WhatsApp o
    // el correo abren /dashboard?share_text=... Lo apartamos a sessionStorage
    // ANTES de cualquier redirección (si hace falta pasar por el login, la URL
    // con los parámetros se pierde) y limpiamos la URL; AppV30 lo consume y
    // abre el agente con la conversación cargada.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const compartido = [params.get('share_title'), params.get('share_text'), params.get('share_url')]
            .filter(Boolean).join('\n').trim();
        if (!compartido) return;
        try { sessionStorage.setItem('tpl-shared-text', compartido); } catch { /* modo privado sin cuota */ }
        window.history.replaceState(null, '', window.location.pathname);
    }, []);

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
