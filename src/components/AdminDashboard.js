import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Box, ArrowLeft } from 'lucide-react';

const AdminDashboard = ({ user, onBack }) => {
    const ALLOWED_EMAILS = ['demo@tupresulisto.com', 'admin@tupresulisto.com'];
    if (!user || !ALLOWED_EMAILS.includes(user.email)) {
        return <div className="p-8 text-center text-red-500 font-bold">Acceso No Autorizado</div>;
    }

    const [stats, setStats] = useState({
        totalUsers: 0,
        verifiedUsers: 0,
        totalProducts: 42
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get Firebase ID token for authentication
                const token = await user.getIdToken();

                const response = await fetch('/api/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('No tienes permisos de administrador');
                    }
                    throw new Error('Error al cargar estadísticas');
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error('Admin stats error:', err);
                // Stats will remain at default values
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Cargando Panel...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 border-b border-slate-700 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                            Torre de Control
                        </h1>
                        <p className="text-slate-400 text-sm">Panel de Administración interna</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-mono text-slate-500 mb-1">{user.email}</p>
                        <button onClick={onBack} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 ml-auto bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
                            <ArrowLeft size={12} /> Volver a App
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden group hover:border-blue-500/50 transition-colors shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={64} />
                        </div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Usuarios</h3>
                        <p className="text-5xl font-black text-white">{stats.totalUsers}</p>
                        <div className="mt-4 text-xs text-slate-500">Registrados en Firestore</div>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden group hover:border-emerald-500/50 transition-colors shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck size={64} />
                        </div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Usuarios Verificados</h3>
                        <p className="text-5xl font-black text-emerald-400">{stats.verifiedUsers}</p>
                        <div className="mt-4 text-xs text-emerald-900/50 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                            {stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : 0}% Conversión
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden group hover:border-purple-500/50 transition-colors shadow-lg">
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
};

export default AdminDashboard;
