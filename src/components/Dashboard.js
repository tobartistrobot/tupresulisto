import React from 'react';
import { QrCode, Plus } from 'lucide-react';

const Dashboard = ({ user, onNewQuote }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Hola, {user.displayName || user.email?.split('@')[0] || 'Usuario'}</h1>
                    <p className="text-slate-500">Resumen de actividad en tiempo real.</p>
                </div>
                <button onClick={onNewQuote} className="flex items-center justify-center px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-500/30 text-sm">
                    <Plus className="mr-2" size={18} /> Nuevo Presupuesto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 bg-sky-50 rounded-bl-2xl text-sky-600"><QrCode /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Verifactu</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span> CONECTADO
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">Último envío a AEAT: hace 2 min</p>
                </div>

                <div className="bg-gradient-to-br from-sky-600 to-sky-800 p-6 rounded-2xl shadow-xl text-white">
                    <p className="text-xs font-bold text-sky-200 uppercase tracking-wider">Facturación Mes</p>
                    <h3 className="text-4xl font-black mt-2">12.450 €</h3>
                    <p className="text-xs text-sky-100 mt-2">+15% vs mes anterior</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presupuestos Pendientes</p>
                    <h3 className="text-4xl font-black text-slate-800 mt-2">8</h3>
                    <p className="text-xs text-orange-500 mt-2 font-bold">Valor est: 4.200 €</p>
                </div>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Actividad Reciente</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">CP</div>
                                <div>
                                    <p className="font-bold text-slate-800">Cliente Prueba {i}</p>
                                    <p className="text-xs text-slate-500">Presupuesto #{2024000 + i}</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-700">1.250,00 €</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
