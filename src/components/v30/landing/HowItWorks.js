import React from 'react';
import { Ruler, Zap, Send } from 'lucide-react';

/**
 * Sección "cómo funciona": los tres pasos del camino crítico del producto
 * (medir → calcular → entregar), que es lo que lo diferencia de un programa
 * de escritorio.
 *
 * Usa iconos en lugar de capturas inventadas: solo se ilustra con imagen el
 * paso del que existe captura real del producto.
 */
const HowItWorks = ({ onRegister }) => {
    const pasos = [
        {
            icon: Ruler,
            numero: '1',
            titulo: 'Toma las medidas',
            texto: 'Elige el producto de tu catálogo y mete ancho y alto. En el móvil, delante del cliente.',
            color: 'text-blue-600 dark:text-blue-400',
            fondo: 'bg-blue-50 dark:bg-blue-500/10',
        },
        {
            icon: Zap,
            numero: '2',
            titulo: 'El precio sale solo',
            texto: 'Tu tabla de precios, tus extras y tu margen ya están dentro. Sin calculadora ni hojas de cálculo.',
            color: 'text-amber-600 dark:text-amber-400',
            fondo: 'bg-amber-50 dark:bg-amber-500/10',
        },
        {
            icon: Send,
            numero: '3',
            titulo: 'Lo envías por WhatsApp',
            texto: 'Un toque y el PDF con tu logo le llega al cliente. Sin volver a la oficina.',
            color: 'text-emerald-600 dark:text-emerald-400',
            fondo: 'bg-emerald-50 dark:bg-emerald-500/10',
        },
    ];

    return (
        <section id="como-funciona" className="py-16 sm:py-24 px-4 bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                        Así de simple
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-3 mb-4 leading-tight">
                        De la medida al cliente,<br className="hidden sm:block" /> en tres pasos
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
                        Todo desde el móvil. Funciona aunque no tengas cobertura.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 mb-12">
                    {pasos.map(({ icon: Icon, numero, titulo, texto, color, fondo }) => (
                        <div key={numero} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-2xl ${fondo} ${color} flex items-center justify-center shrink-0`}>
                                    <Icon size={26} strokeWidth={2.5} />
                                </div>
                                <span className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">
                                    {numero}
                                </span>
                            </div>
                            <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2 leading-snug">{titulo}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{texto}</p>
                        </div>
                    ))}
                </div>

                {/* Captura real del presupuesto que recibe el cliente */}
                <div className="max-w-3xl mx-auto">
                    <p className="text-center text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">
                        Esto es lo que recibe tu cliente
                    </p>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-white">
                        <img
                            src="/captura-presupuesto-nueva.png"
                            alt="Presupuesto en PDF generado por TuPresuListo, con logo y desglose de precios"
                            className="w-full h-auto"
                            loading="lazy"
                        />
                    </div>
                </div>

                <div className="text-center mt-10 sm:mt-14">
                    <button
                        onClick={onRegister}
                        className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-bold rounded-xl shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Probar gratis con mis productos
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
