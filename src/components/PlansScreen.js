'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import SubscriptionButton from './SubscriptionButton';

// ✅ AHORA SÍ: Ambos IDs tienen el mismo formato (UUIDs)
const MONTHLY_VARIANT_ID = 'cb60ae4e-ad08-496f-8e56-46d803e43f19';
const YEARLY_VARIANT_ID = 'd5e7b134-5fea-44b7-b636-2637448c89fe';

export default function PlansScreen({ user, onLogout }) {
    const [billing, setBilling] = useState('monthly'); // 'monthly' | 'yearly'

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header simple */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {/* Logo con fallback para evitar errores si no carga */}
                    <img
                        src="/logo.png"
                        alt="TuPresuListo"
                        className="h-8"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                    <span className="font-bold text-slate-700">TuPresuListo</span>
                </div>
                <button
                    onClick={onLogout}
                    className="text-sm text-slate-500 hover:text-slate-800"
                >
                    Cerrar Sesión
                </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">

                    {/* Columna Izquierda: Beneficios */}
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight">
                            Desbloquea todo el potencial de tu taller.
                        </h1>
                        <p className="text-lg text-slate-600">
                            Hola <strong>{user?.name}</strong>, estás a un paso de profesionalizar tus presupuestos. Actualiza a PRO para acceder al Dashboard y la Matriz v30.
                        </p>

                        <ul className="space-y-4">
                            {[
                                'Acceso ilimitado a la Matriz de Precios',
                                'Cálculo automático de cortes y despieces',
                                'Generación de PDF profesional con tu logo',
                                'Soporte técnico prioritario'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Columna Derecha: Tarjeta de Precios */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>

                        {/* INTERRUPTOR (TOGGLE) MENSUAL / ANUAL */}
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-full mb-8 relative">
                            <button
                                onClick={() => setBilling('monthly')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBilling('yearly')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billing === 'yearly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Anual
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">2 meses GRATIS</span>
                            </button>
                        </div>

                        {/* PRECIO GIGANTE */}
                        <div className="text-center mb-8">
                            <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">Plan Profesional</span>
                            <div className="mt-6 flex justify-center items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900">
                                    {billing === 'monthly' ? '9,99€' : '99€'}
                                </span>
                                <span className="text-slate-500 font-medium">
                                    /{billing === 'monthly' ? 'mes' : 'año'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">Sin permanencia. Cancela cuando quieras.</p>
                        </div>

                        {/* BOTÓN DE SUSCRIPCIÓN */}
                        <div className="flex justify-center w-full">
                            <SubscriptionButton
                                key={billing} /* 🪄 TRUCO DE MAGIA: Esto obliga al botón a actualizarse al cambiar el switch */
                                userId={user?.uid}
                                variantId={billing === 'monthly' ? MONTHLY_VARIANT_ID : YEARLY_VARIANT_ID}
                                className="w-full justify-center py-4 text-lg"
                            />
                        </div>

                        <p className="text-xs text-center text-slate-400 mt-6">
                            Pago seguro vía Lemon Squeezy. Factura automática.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}