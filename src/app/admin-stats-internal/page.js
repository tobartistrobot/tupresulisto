'use client';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, getCountFromServer } from 'firebase/firestore';
import { ShieldCheck, Users, Box, Lock, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminStats() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        verifiedUsers: 0,
        activeSubs: 0,
        totalProducts: 0
    });
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const ALLOWED_EMAILS = ['demo@tupresulisto.com', 'admin@tupresulisto.com', 'tobartistrobot@gmail.com'];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                if (ALLOWED_EMAILS.includes(u.email)) {
                    setUser(u);
                    fetchStats();
                } else {
                    setUser(null);
                    setLoading(false);
                }
            } else {
                router.push('/');
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const usersColl = collection(db, "users");
            const snapshot = await getDocs(usersColl);

            const users = [];
            let verifiedCount = 0;
            let activeSubsCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const isPro = data.subscriptionStatus === 'active' || data.subscriptionStatus === 'pro' || data.isPro === true;
                if (data.emailVerified) verifiedCount++;
                if (isPro) activeSubsCount++;

                users.push({
                    id: doc.id,
                    ...data
                });
            });

            // Sort by creation time (handle both Firestore Timestamp and ISO String)
            users.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return dateB - dateA;
            });

            setUsersList(users);

            // Total Products (Optional, keep if needed)
            const productsColl = collection(db, "products");
            let productCount = 0;
            try {
                const snapP = await getCountFromServer(productsColl);
                productCount = snapP.data().count;
            } catch (e) { }

            setStats({
                totalUsers: users.length,
                verifiedUsers: verifiedCount,
                activeSubs: activeSubsCount,
                totalProducts: users.reduce((acc, u) => acc + (u.products?.length || 0), 0)
            });

        } catch (err) {
            console.error(err);
            setError("Error cargando datos: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleProStatus = async (userId, currentStatus) => {
        if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'DESACTIVAR' : 'ACTIVAR'} el Plan PRO para este usuario?`)) return;

        try {
            const userRef = doc(db, "users", userId);
            // We update both fields to be sure
            await updateDoc(userRef, {
                isPro: !currentStatus,
                subscriptionStatus: !currentStatus ? 'active' : 'inactive'
            });

            // Refresh local state to reflect change immediately
            setUsersList(prev => prev.map(u => {
                if (u.id === userId) {
                    return { ...u, isPro: !currentStatus, subscriptionStatus: !currentStatus ? 'active' : 'inactive' };
                }
                return u;
            }));

            // Re-calc stats locally
            setStats(prev => ({
                ...prev,
                activeSubs: !currentStatus ? prev.activeSubs + 1 : prev.activeSubs - 1
            }));

        } catch (err) {
            alert("Error al actualizar estado: " + err.message);
        }
    };

    const filteredUsers = usersList.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Cargando Torre de Control...</div>;

    if (!user) return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
            <Lock size={48} className="text-slate-300 mb-4" />
            <h1 className="text-xl font-bold text-slate-700">Acceso Restringido</h1>
            <p className="text-slate-500 mb-6">Esta área es solo para administradores.</p>
            <p className="text-xs text-slate-400 mb-4">Si crees que esto es un error, contacta con soporte.</p>
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {/* Card 1 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Usuarios</h3>
                        <p className="text-4xl font-black text-white">{stats.totalUsers}</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Verificados</h3>
                        <p className="text-4xl font-black text-emerald-400">{stats.verifiedUsers}</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Suscripciones PRO</h3>
                        <p className="text-4xl font-black text-blue-400">{stats.activeSubs}</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Productos</h3>
                        <p className="text-4xl font-black text-purple-400">{stats.totalProducts}</p>
                    </div>
                </div>

                {/* User List & Search */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-lg">Directorio de Usuarios</h3>
                        <input
                            type="text"
                            placeholder="Buscar por email..."
                            className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Registro</th>
                                    <th className="px-6 py-4 text-center">Verificado</th>
                                    <th className="px-6 py-4 text-center">Items</th>
                                    <th className="px-6 py-4 text-center">Plan</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredUsers.map((u) => {
                                    const isPro = u.subscriptionStatus === 'active' || u.subscriptionStatus === 'pro' || u.isPro === true;
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-200 flex items-center gap-2">
                                                    {u.email || (
                                                        <div className='flex flex-col'>
                                                            <span className="text-yellow-500 italic text-[10px] bg-yellow-900/20 px-1 py-0.5 rounded">Anónimo / Invitado</span>
                                                            <span className="text-[9px] text-slate-600 font-mono">uid: {u.id.slice(0, 8)}...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {u.email && <div className="text-[10px] font-mono opacity-50">{u.id}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-300" title={new Date(u.createdAt?.seconds ? u.createdAt.seconds * 1000 : u.createdAt).toLocaleString()}>
                                                        {u.createdAt ? formatDistanceToNow(u.createdAt?.seconds ? u.createdAt.seconds * 1000 : new Date(u.createdAt), { addSuffix: true, locale: es }) : '-'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {u.createdAt ? new Date(u.createdAt?.seconds ? u.createdAt.seconds * 1000 : u.createdAt).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className='flex flex-col items-center gap-1'>
                                                    {u.emailVerified ? (
                                                        <ShieldCheck className="mx-auto text-emerald-400" size={18} />
                                                    ) : (
                                                        <div className="mx-auto w-2 h-2 rounded-full bg-slate-600" />
                                                    )}
                                                </div>
                                            </td>
                                            {/* Nuevo: Items Column (Logic was requested but not column header yet? Added column header in my head, need to add it to code) */}
                                            {/* Wait, I need to add the TD for Items, but also the TH in the header row above. I will do 2 separate chunks for that. */}
                                            {/* This chunk is just replacing the TDs. I will add the Items TD here properly */}

                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-mono font-bold ${(!isPro && (u.products?.length || 0) > 3) ? 'text-red-400' : 'text-slate-400'}`}>
                                                    {u.products?.length || 0}
                                                    {!isPro && (u.products?.length || 0) > 3 && <span className="ml-1 text-xs">⚠️</span>}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {isPro ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="bg-blue-900/50 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-800">PRO</span>
                                                        {u.redeemCode && (
                                                            <div className="text-[9px] text-yellow-400/80 bg-yellow-900/20 px-1.5 py-0.5 rounded border border-yellow-900/30">
                                                                <div className="font-mono font-bold tracking-wider">{u.redeemCode}</div>
                                                            </div>
                                                        )}
                                                        <span className='text-[8px] uppercase tracking-wider text-slate-500'>{u.subscriptionStatus || 'manual'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="bg-slate-700/50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-600">FREE</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/?impersonate=${u.id}`}
                                                        target="_blank"
                                                        className="bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 p-1.5 rounded"
                                                        title="Ver como este usuario"
                                                    >
                                                        <Box size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleProStatus(u.id, isPro)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${isPro ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                                            }`}
                                                    >
                                                        {isPro ? 'Desactivar PRO' : 'Activar PRO'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">No se encontraron usuarios.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
