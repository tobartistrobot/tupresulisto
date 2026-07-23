'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calculator, ArrowRight, ChevronDown, ChevronRight, FileWarning, Moon, Clock,
    CheckCircle2, Ruler, Quote,
} from 'lucide-react';
import { track, EVENTS } from '../../lib/analytics';
import { LISTA_GREMIOS } from '../../lib/gremios';
import Footer from '../v30/landing/Footer';
import Comparison from '../v30/landing/Comparison';

/**
 * Plantilla de la página SEO de un gremio (p. ej. /presupuestos-para-carpinteros).
 *
 * Todo el contenido sale de la entrada del gremio en src/lib/gremios.js; esta
 * plantilla solo pone la estructura. Reutiliza los patrones visuales de la
 * landing (v30/landing) para que las páginas se sientan parte del mismo sitio.
 *
 * El recorrido replica el embudo de la home, pero hablando el idioma del
 * oficio: reconocerse en el problema → ver SUS partidas presupuestadas →
 * beneficios → dudas → acción.
 */
const IconosDolor = [FileWarning, Moon, Clock];

const GremioSeoPage = ({ gremio }) => {
    const router = useRouter();
    const [faqAbierta, setFaqAbierta] = useState(0);

    // Mismo evento que el resto del embudo, etiquetado con el gremio y el tipo
    // de página para poder medir conversión por nicho en PostHog.
    const registrarDesde = useCallback((origen) => () => {
        track(EVENTS.REGISTRO_INICIADO, { origen, gremio: gremio.slug, tipo_pagina: 'seo' });
        router.push('/register');
    }, [router, gremio.slug]);

    const otrosGremios = LISTA_GREMIOS.filter(g => g.slug !== gremio.slug);

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 min-h-screen overflow-x-hidden transition-colors">
            {/* Cabecera ligera: logo a la home + un CTA. Sin menú completo para
                no competir con el recorrido de la página. */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-blue-900 rounded-lg flex items-center justify-center shadow-md">
                            <Calculator className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                            tupresulisto<span className="text-blue-600 dark:text-blue-400">.com</span>
                        </span>
                    </Link>
                    <button
                        onClick={registrarDesde('cabecera')}
                        className="px-4 sm:px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        Probar gratis
                    </button>
                </div>
            </header>

            <main>
                {/* HERO propio del gremio */}
                <section className="pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                        {gremio.nombre}
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mt-4 mb-5 sm:mb-7">
                        {gremio.seo.h1}
                    </h1>
                    <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
                        {gremio.seo.subtitulo}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 px-2 sm:px-0">
                        <button
                            onClick={registrarDesde('hero')}
                            className="px-8 sm:px-10 py-4 bg-blue-600 text-white text-base sm:text-lg font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
                        >
                            Probar gratis ahora
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <Link
                            href="/"
                            className="px-8 sm:px-10 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-base sm:text-lg font-bold rounded-xl hover:border-slate-400 dark:hover:border-slate-500 active:scale-95 transition-all flex items-center justify-center"
                        >
                            Ver cómo funciona
                        </Link>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-5">
                        Sin tarjeta · Sin permanencia · Empiezas con 3 productos gratis
                    </p>
                </section>

                {/* INTRO con recorrido para posicionar: el párrafo largo del gremio */}
                <section className="py-12 sm:py-16 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="max-w-3xl mx-auto">
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                            {gremio.seo.intro}
                        </p>
                    </div>
                </section>

                {/* DOLORES del oficio */}
                <section className="py-14 sm:py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-10 sm:mb-14">
                            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                                El día a día
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                                ¿Te suena esto?
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            {gremio.dolores.map(({ titulo, texto }, i) => {
                                const Icon = IconosDolor[i % IconosDolor.length];
                                return (
                                    <div key={titulo} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                            <Icon size={20} />
                                        </div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white leading-snug">{titulo}</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{texto}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* PARTIDAS TÍPICAS: la prueba de que la app habla su idioma */}
                <section className="py-14 sm:py-20 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10 sm:mb-14">
                            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                                Hecho para lo tuyo
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                                Así se presupuesta en tu oficio
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                                Cargas tus partidas una vez, con tus precios y tu margen. Después, presupuestar es elegir y poner cantidades.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {gremio.partidas.map(({ nombre, calculo }) => (
                                <div key={nombre} className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                        <Ruler size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white leading-snug">{nombre}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mt-1">{calculo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* BENEFICIOS */}
                <section className="py-14 sm:py-20 px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10 sm:mb-14">
                            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                                Lo que te llevas
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                                Pensado para {gremio.profesional}
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {gremio.beneficios.map(b => (
                                <li key={b} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                                    <CheckCircle2 className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={22} />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* COMPARATIVA por formas de trabajar (sin marcas: ver el
                    comentario de cabecera de Comparison.js). Va después de los
                    beneficios: primero entiende qué gana, y entonces por qué
                    esto y no lo que hace ahora. */}
                <Comparison
                    titulo="Comparado con lo que usas ahora"
                    claseSeccion="py-14 sm:py-20 bg-slate-50 dark:bg-slate-950"
                    claseFondoSticky="bg-slate-50 dark:bg-slate-950"
                    compacto
                />

                {/* TESTIMONIOS — hoy no se renderizan: están comentados en la
                    config hasta tener testimonios reales. Al rellenar el campo
                    `testimonios` del gremio, esta sección vuelve sola. */}
                {gremio.testimonios?.length > 0 && (
                    <section className="py-14 sm:py-20 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
                        <div className="max-w-3xl mx-auto">
                            {gremio.testimonios.map(t => (
                                <figure key={t.nombre} className="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8">
                                    <Quote className="text-blue-200 dark:text-blue-900 absolute top-6 right-6" size={40} />
                                    <blockquote className="text-lg sm:text-xl text-slate-700 dark:text-slate-200 font-medium leading-relaxed relative z-10">
                                        “{t.texto}”
                                    </blockquote>
                                    <figcaption className="mt-5 text-sm">
                                        <span className="font-bold text-slate-900 dark:text-white">{t.nombre}</span>
                                        <span className="text-slate-500 dark:text-slate-400"> · {t.negocio}</span>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </section>
                )}

                {/* FAQ del gremio (el JSON-LD lo emite la ruta de servidor).
                    Fondo blanco para alternar con Beneficios ahora que los
                    testimonios están desactivados y no separan ambas secciones. */}
                <section className="py-14 sm:py-20 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10 sm:mb-14">
                            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                                Dudas habituales
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                                Preguntas frecuentes de {gremio.profesional}
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {gremio.faq.map(({ p, r }, i) => {
                                const abierta = faqAbierta === i;
                                return (
                                    <div key={p} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
                                        <button
                                            onClick={() => setFaqAbierta(abierta ? -1 : i)}
                                            aria-expanded={abierta}
                                            className="w-full flex items-center justify-between gap-4 p-5 text-left min-h-[60px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <span className="font-bold text-slate-900 dark:text-white">{p}</span>
                                            <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform duration-200 ${abierta ? 'rotate-180' : ''}`} />
                                        </button>
                                        {abierta && (
                                            <p className="px-5 pb-5 -mt-1 text-slate-600 dark:text-slate-400 leading-relaxed animate-fade-in">{r}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ENLAZADO INTERNO: otros gremios + home (fondo plano, alterna con la FAQ) */}
                <section className="py-14 sm:py-20 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white text-center mb-8">
                            También para otros gremios
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {otrosGremios.map(g => (
                                <Link
                                    key={g.slug}
                                    href={`/${g.seoSlug}`}
                                    className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                                >
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-inherit">{g.nombre}</span>
                                    <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                </Link>
                            ))}
                        </div>
                        <p className="text-center mt-8">
                            <Link href="/" className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4">
                                Conoce TuPresuListo, la app de presupuestos para profesionales →
                            </Link>
                        </p>
                    </div>
                </section>

                {/* CTA FINAL, mismo patrón que la home */}
                <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-blue-800 to-blue-950 text-white relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 tracking-tight leading-tight">
                            El próximo presupuesto,<br className="hidden sm:block" /> entrégalo en el sitio
                        </h2>
                        <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
                            Monta tus partidas hoy y sal mañana a medir con el presupuesto ya resuelto.
                        </p>
                        <button
                            onClick={registrarDesde('cierre')}
                            className="w-full sm:w-auto px-10 py-5 bg-white text-blue-900 text-lg font-black rounded-xl shadow-2xl shadow-blue-950/50 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-3 group"
                        >
                            Empezar gratis
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-blue-200/80 text-sm mt-6">Sin tarjeta · Sin permanencia · Listo en 5 minutos</p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default GremioSeoPage;
