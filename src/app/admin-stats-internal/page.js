'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { ShieldCheck, Users, Box, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AdminStats() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        verifiedUsers: 0,
        totalProducts: 42 // Example/Placeholder if collection doesn't exist
    });
    const [error, setError] = useState('');

    const ALLOWED_EMAILS = ['demo@tupresulisto.com', 'admin@tupresulisto.com'];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                if (ALLOWED_EMAILS.includes(u.email)) {
                    setUser(u);
                    fetchStats();
                } else {
                    setError("Acceso denegado. No tienes permisos de administrador.");
                    setLoading(false);
                }
            } else {
                setLoading(false); // Not logged in
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchStats = async () => {
        try {
            // Total Users
            const usersColl = collection(db, "users");
            const snapshotTotal = await getCountFromServer(usersColl);

            // Verified Users (Requires 'emailVerified' field in Firestore, we implement this in Verification logic)
            // If field doesn't exist, this returns 0, which is fine.
            const qVerified = query(usersColl, where("emailVerified", "==", true));
            const snapshotVerified = await getCountFromServer(qVerified);

            // Total Products (As requested, though app uses IndexedDB, maybe there's a global catalog?)
            const productsColl = collection(db, "products");
            let snapshotProducts = { data: () => ({ count: 0 }) };
            try {
                snapshotProducts = await getCountFromServer(productsColl);
            } catch (e) { console.log("Products collection likely empty or permission denied"); }

            setStats({
                totalUsers: snapshotTotal.data().count,
                verifiedUsers: snapshotVerified.data().count,
                totalProducts: snapshotProducts.data().count
            });
        } catch (err) {
            console.error(err);
            setError("Error cargando estadísticas. " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Cargando Torre de Control...</div>;

    if (!user) return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
            <Lock size={48} className="text-slate-300 mb-4" />
            <h1 className="text-xl font-bold text-slate-700">Acceso Restringido</h1>
            <p className="text-slate-500 mb-6">Esta área es solo para administradores.</p>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Volver al Inicio</Link>
        </div>
    );

    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-700">
            <p className="font-bold">{error}</p>
            <Link href="/" className="mt-4 underline">Salir</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 border-b border-slate-700 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                            Torre de Control
                        </h1>
                        <p className="text-slate-400 text-sm">Panel de Administración interna</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-mono text-slate-500">{user.email}</p>
                        <Link href="/" className="text-xs text-blue-400 hover:text-blue-300">Volver a App</Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={64} />
                        </div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Usuarios</h3>
                        <p className="text-5xl font-black text-white">{stats.totalUsers}</p>
                        <div className="mt-4 text-xs text-slate-500">Registrados en Firestore</div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck size={64} />
                        </div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Usuarios Verificados</h3>
                        <p className="text-5xl font-black text-emerald-400">{stats.verifiedUsers}</p>
                        <div className="mt-4 text-xs text-emerald-900/50 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                            {((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}% Conversión
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Box size={64} />
                        </div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Productos</h3>
                        <p className="text-5xl font-black text-purple-400">{stats.totalProducts}</p>
                        <div className="mt-4 text-xs text-slate-500">Global (Cloud)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
