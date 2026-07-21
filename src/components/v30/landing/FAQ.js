import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Preguntas frecuentes.
 *
 * No son preguntas de relleno: cada una responde a una objeción concreta que
 * frena a un autónomo de gremio ante un software por suscripción (no me apaño
 * con la informática, no quiero quedar atado, ¿y si no tengo cobertura?, ¿me
 * sirve para lo mío?). Responderlas aquí evita que abandonen la página.
 *
 * Solo se afirma lo que el producto hace de verdad hoy.
 */
const FAQ = () => {
    const [abierta, setAbierta] = useState(0);

    const preguntas = [
        {
            p: '¿Necesito saber de informática?',
            r: 'No. Si sabes usar WhatsApp, sabes usar esto. Cargas tus productos una vez y a partir de ahí solo eliges, metes las medidas y envías. Además te damos un catálogo base de tu gremio ya montado, para que no empieces de cero.',
        },
        {
            p: '¿Funciona en el móvil de verdad?',
            r: 'Está pensada para el móvil antes que para el ordenador. Puedes instalarla en la pantalla de inicio como una app normal y se abre a pantalla completa. También funciona en tablet y ordenador con la misma cuenta.',
        },
        {
            p: '¿Y si en casa del cliente no tengo cobertura?',
            r: 'Sigue funcionando. La app guarda tu catálogo y tus presupuestos en el propio teléfono, así que puedes trabajar en un sótano o en una obra sin señal. Cuando recuperas la conexión, se sincroniza sola.',
        },
        {
            p: '¿Sirve para mi oficio?',
            r: 'Si presupuestas por medidas, sí. Soportamos precio por tabla de medidas (ancho × alto), por metro cuadrado, por metro lineal y por unidad. Es lo que usan carpintería, cristalería, toldos, aluminio y PVC, entre otros.',
        },
        {
            p: '¿Puedo usar mis precios y mi margen?',
            r: 'Sí, son tuyos. Defines tu propia tabla de precios, tus extras y acabados, y tu margen comercial. La app calcula con tus números, no con precios de mercado inventados.',
        },
        {
            p: '¿Me quedo atado si me suscribo?',
            r: 'No hay permanencia: cancelas cuando quieras desde tu cuenta. Si dejas PRO, no pierdes nada de lo que hayas hecho: tus presupuestos y clientes siguen ahí, solo vuelve el límite de 3 productos activos.',
        },
        {
            p: '¿El presupuesto lleva mi marca?',
            r: 'Sí. Subes tu logo, tus datos fiscales, tu color y tus condiciones, y el PDF sale con tu imagen. El cliente recibe un documento tuyo, no uno con nuestra marca.',
        },
    ];

    return (
        <section className="py-16 sm:py-24 px-4 bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10 sm:mb-14">
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                        Dudas habituales
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                        Preguntas frecuentes
                    </h2>
                </div>

                <div className="space-y-3">
                    {preguntas.map(({ p, r }, i) => {
                        const estaAbierta = abierta === i;
                        return (
                            <div
                                key={p}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => setAbierta(estaAbierta ? -1 : i)}
                                    aria-expanded={estaAbierta}
                                    className="w-full flex items-center justify-between gap-4 p-5 text-left min-h-[60px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <span className="font-bold text-slate-900 dark:text-white">{p}</span>
                                    <ChevronDown
                                        size={20}
                                        className={`shrink-0 text-slate-400 transition-transform duration-200 ${estaAbierta ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {estaAbierta && (
                                    <p className="px-5 pb-5 -mt-1 text-slate-600 dark:text-slate-400 leading-relaxed animate-fade-in">
                                        {r}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
