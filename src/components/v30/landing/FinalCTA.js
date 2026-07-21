import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Cierre de la página.
 *
 * Va después de las preguntas frecuentes a propósito: se pide la acción cuando
 * ya se han resuelto las dudas, no antes. Estaba pegado a la sección de tipos
 * de cálculo, donde competía con la de precios que viene justo detrás.
 *
 * El fondo es un degradado propio. Antes se cargaba una textura desde un
 * dominio externo, lo que ataba el aspecto de la página a que un tercero
 * siguiera disponible y añadía una petición a otro servidor sin necesidad.
 */
const FinalCTA = ({ onRegister }) => {
    return (
        <section className="py-20 sm:py-28 px-4 bg-gradient-to-br from-blue-800 to-blue-950 text-white relative overflow-hidden">
            {/* Halo decorativo, contenido dentro de la sección */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-3xl mx-auto text-center relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 tracking-tight leading-tight">
                    El próximo presupuesto,<br className="hidden sm:block" /> entrégalo en el sitio
                </h2>
                <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
                    Monta tu catálogo hoy y sal mañana a medir con el presupuesto ya resuelto.
                </p>

                <button
                    onClick={onRegister}
                    className="w-full sm:w-auto px-10 py-5 bg-white text-blue-900 text-lg font-black rounded-xl shadow-2xl shadow-blue-950/50 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-3 group"
                >
                    Empezar gratis
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-blue-200/80 text-sm mt-6">
                    Sin tarjeta · Sin permanencia · Listo en 5 minutos
                </p>
            </div>
        </section>
    );
};

export default FinalCTA;
