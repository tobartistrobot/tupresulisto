'use client';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

/**
 * Sticky banner displayed at the top of the application when an admin is
 * currently impersonating another user. Provides a clear visual indicator
 * and a one-click exit button to return to the admin panel.
 */
export default function ImpersonationBanner() {
    const { impersonationInfo, exitImpersonation } = useAuth();

    if (!impersonationInfo) return null;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-4 py-3 shadow-lg"
            style={{
                background: 'linear-gradient(90deg, #ea580c 0%, #dc2626 100%)',
            }}
        >
            {/* Left: icon + message */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                    <ShieldAlert size={18} className="text-white" />
                </div>
                <p className="text-white text-sm font-bold leading-tight truncate">
                    <span className="hidden sm:inline">👁️ </span>
                    Estás visualizando la cuenta de{' '}
                    <span className="underline underline-offset-2 font-black">
                        {impersonationInfo.targetEmail}
                    </span>{' '}
                    <span className="font-medium opacity-90">en Modo Administrador</span>
                </p>
            </div>

            {/* Right: exit button */}
            <button
                onClick={exitImpersonation}
                className="shrink-0 flex items-center gap-2 bg-white text-red-700 font-black text-xs px-4 py-2 rounded-lg shadow-md hover:bg-red-50 active:scale-95 transition-all duration-150 whitespace-nowrap"
                aria-label="Salir del modo administrador y volver al panel"
            >
                <LogOut size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Salir y volver al Panel Admin</span>
                <span className="sm:hidden">Salir</span>
            </button>
        </div>
    );
}
