import React from 'react';
import { QrCode, Plus } from 'lucide-react';

const Dashboard = ({ user, onNewQuote }) => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Hola, {user.displayName || user.email?.split('@')[0] || 'Usuario'}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 transition-colors mt-1">Resumen de actividad en tiempo real.</p>
                </div>
                <button onClick={onNewQuote} className="btn-primary flex items-center justify-center text-sm px-5 py-2.5">
                    <Plus className="mr-2" size={18} /> Nuevo Presupuesto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Facturación (Teal Vibe) */}
                <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-6 rounded-2xl shadow-lg shadow-teal-500/30 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute -bottom-6 -right-6 text-white/10 opacity-50 group-hover:scale-110 transition-transform duration-500"><QrCode size={120} /></div>
                    <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest relative z-10 flex items-center gap-2">
                        Facturación Mes <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">+15%</span>
                    </p>
                    <h3 className="text-4xl font-black mt-2 tracking-tight relative z-10">12.450 €</h3>
                    <p className="text-xs text-teal-100 font-medium mt-3 relative z-10 flex items-center gap-1.5 opacity-90"><span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Actualizado hoy</p>
                </div>

                {/* Card 2: Presupuestos Pendientes (Purple Vibe) */}
                <div className="bg-gradient-to-br from-violet-500 to-violet-700 p-6 rounded-2xl shadow-lg shadow-violet-500/30 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute -bottom-6 -right-6 text-white/10 opacity-50"><QrCode size={120} /></div>
                    <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest relative z-10">Presupuestos Pendientes</p>
                    <h3 className="text-4xl font-black mt-2 tracking-tight relative z-10">8 <span className="text-lg font-medium opacity-80">docs</span></h3>
                    <p className="text-xs text-violet-200 mt-3 font-medium relative z-10">Valor est: 4.200 €</p>
                </div>

                {/* Card 3: Estado Verifactu (Emerald Vibe) */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-500/30 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute -bottom-6 -right-6 text-white/10 opacity-50"><QrCode size={120} /></div>
                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest relative z-10">Estado Sistema Verifactu</p>
                    <h3 className="text-3xl font-black mt-2 flex items-center gap-2 relative z-10">
                        <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></span> CONECTADO
                    </h3>
                    <p className="text-xs text-emerald-100 mt-3 relative z-10">Último envío a AEAT: hace 2 min</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm overflow-hidden">
                <h3 className="font-bold text-lg mb-6 text-zinc-900 dark:text-zinc-100">Actividad Reciente</h3>
                <div className="space-y-2">
                    {[1, 2, 3].map((i, index) => (
                        <div key={i} className={`flex justify-between items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors group cursor-pointer animate-fade-in border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50`} style={{ animationDelay: `${index * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 transition-colors">CP</div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Cliente Prueba {i}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Presupuesto #{2024000 + i}</p>
                                </div>
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">1.250,00 €</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
