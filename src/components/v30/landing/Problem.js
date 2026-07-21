import React from 'react';
import { Moon, FileWarning, Clock } from 'lucide-react';

/**
 * Sección "el problema": busca que el visitante se reconozca en 5 segundos.
 *
 * Va justo detrás del hero porque antes de contar qué hace el producto conviene
 * que el autónomo piense "esto me pasa a mí". Si no se reconoce en el problema,
 * la solución le da igual.
 */
const Problem = () => {
    const dolores = [
        {
            icon: FileWarning,
            titulo: 'Vuelves con las medidas en un papel',
            texto: 'Y luego toca pasarlas a limpio, buscar precios y montar el documento.',
        },
        {
            icon: Moon,
            titulo: 'Presupuestas de noche y los domingos',
            texto: 'El trabajo de oficina se come las horas que deberían ser para tu familia.',
        },
        {
            icon: Clock,
            titulo: 'Y cuando lo envías, ya es tarde',
            texto: 'El cliente lleva días esperando y otro llegó antes con su precio.',
        },
    ];

    return (
        <section className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                        El día a día del autónomo
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-3 mb-4 leading-tight">
                        ¿Te suena esto?
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {dolores.map(({ icon: Icon, titulo, texto }) => (
                        <div
                            key={titulo}
                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col gap-3"
                        >
                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                <Icon size={20} />
                            </div>
                            <h3 className="font-black text-lg text-slate-900 dark:text-white leading-snug">{titulo}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{texto}</p>
                        </div>
                    ))}
                </div>

                <p className="text-center text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-10 sm:mt-16 max-w-3xl mx-auto leading-snug">
                    Con TuPresuListo entregas el presupuesto{' '}
                    <span className="text-blue-600 dark:text-blue-400">antes de salir por la puerta</span>.
                </p>
            </div>
        </section>
    );
};

export default Problem;
