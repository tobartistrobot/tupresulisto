'use client';
import { Check } from 'lucide-react';
import SubscriptionButton from './SubscriptionButton';

export default function PlansScreen({ user, onLogout }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header simple */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="TuPresuListo" className="h-8" onError={(e) => e.target.style.display = 'none'} />
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

                    {/* Copy */}
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

                    {/* Card Plan */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>

                        <div className="text-center mb-8">
                            <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">Plan Profesional</span>
                            <div className="mt-6 flex justify-center items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900">29€</span>
                                <span className="text-slate-500 font-medium">/mes</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">Sin permanencia. Cancela cuando quieras.</p>
                        </div>

                        <div className="flex justify-center">
                            <SubscriptionButton userId={user?.uid} className="w-full justify-center py-4 text-lg" />
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
