import React, { useState } from 'react';
import { Check, Crown } from 'lucide-react';

/**
 * Planes y precios reales.
 *
 * Antes la sección con id="pricing" mostraba los tipos de cálculo, no precios:
 * quien quería pagar no encontraba cuánto costaba. Esta sección ocupa ese ancla.
 *
 * Los precios coinciden con los del modal de mejora dentro de la app (9,99 €/mes
 * y 99 €/año) y con el límite real del plan gratuito, que es de 3 productos:
 * todo lo demás está incluido. Si cambian ahí, hay que cambiarlos aquí.
 *
 * "Precio de lanzamiento" no es un truco de urgencia: permite subir el precio
 * más adelante respetando a quien confió al principio.
 */
const Plans = ({ onRegister }) => {
    const [anual, setAnual] = useState(false);

    const incluidoEnAmbos = [
        'Presupuestos y clientes ilimitados',
        'PDF con tu logo y tus datos',
        'Envío por WhatsApp desde el móvil',
        'Cálculo por matriz, m², metro lineal o unidad',
        'Funciona sin cobertura',
    ];

    return (
        <section id="pricing" className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                        Precios
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-3 mb-4 leading-tight">
                        Empieza gratis. Sin tarjeta.
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
                        Prueba la herramienta con tus propios productos y decide después.
                    </p>
                </div>

                {/* Conmutador mensual / anual */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setAnual(false)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${!anual ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setAnual(true)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${anual ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Anual
                            <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                2 meses gratis
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-start">
                    {/* Gratis */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col h-full">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Gratis</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Para empezar y probarlo de verdad</p>

                        <div className="mb-6">
                            <span className="text-5xl font-black text-slate-900 dark:text-white">0 €</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium"> para siempre</span>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex gap-3 text-sm">
                                <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Hasta 3 productos</strong> en tu catálogo</span>
                            </li>
                            {incluidoEnAmbos.map((t) => (
                                <li key={t} className="flex gap-3 text-sm">
                                    <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 dark:text-slate-300">{t}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={onRegister}
                            className="w-full py-4 rounded-xl font-bold bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                        >
                            Crear cuenta gratis
                        </button>
                    </div>

                    {/* PRO */}
                    <div className="relative bg-white dark:bg-slate-900 border-2 border-blue-600 rounded-3xl p-6 sm:p-8 flex flex-col h-full shadow-2xl shadow-blue-600/10">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap">
                            Precio de lanzamiento
                        </span>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <Crown size={22} className="text-amber-500" /> PRO
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Cuando tu catálogo crece</p>

                        <div className="mb-2">
                            <span className="text-5xl font-black text-slate-900 dark:text-white">
                                {anual ? '99 €' : '9,99 €'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{anual ? ' / año' : ' / mes'}</span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-6">
                            Si te suscribes ahora, mantienes este precio siempre.
                        </p>

                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex gap-3 text-sm">
                                <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Productos ilimitados</strong> en tu catálogo</span>
                            </li>
                            {incluidoEnAmbos.map((t) => (
                                <li key={t} className="flex gap-3 text-sm">
                                    <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 dark:text-slate-300">{t}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={onRegister}
                            className="w-full py-4 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Empezar ahora
                        </button>
                        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
                            Cancela cuando quieras, sin permanencia
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Plans;
