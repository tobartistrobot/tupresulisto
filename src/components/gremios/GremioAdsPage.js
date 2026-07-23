'use client';
import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calculator, ArrowRight, CheckCircle2 } from 'lucide-react';
import { track, EVENTS } from '../../lib/analytics';

/**
 * Plantilla de la página de campaña de un gremio (p. ej. /lp/carpinteria).
 *
 * Es deliberadamente corta y sin navegación: quien llega aquí viene de un
 * anuncio y solo hay una decisión que tomar. Un titular, tres razones, un
 * botón. Cualquier enlace extra es una fuga del presupuesto de la campaña.
 *
 * La página va con noindex/nofollow (lo declara la ruta) para no competir ni
 * duplicarse con la versión SEO del mismo gremio.
 */
const GremioAdsPage = ({ gremio }) => {
    const router = useRouter();

    const irARegistro = useCallback(() => {
        track(EVENTS.REGISTRO_INICIADO, { origen: 'lp_cta', gremio: gremio.slug, tipo_pagina: 'ads' });
        router.push('/register');
    }, [router, gremio.slug]);

    const testimonio = gremio.testimonios?.[0];

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col overflow-x-hidden transition-colors">
            {/* Solo la marca. Ni menú ni login: una única acción posible. */}
            <header className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-900 rounded-lg flex items-center justify-center shadow-md">
                        <Calculator className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                        tupresulisto<span className="text-blue-600 dark:text-blue-400">.com</span>
                    </span>
                </div>
            </header>

            <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-12 sm:py-16">
                <div className="max-w-2xl mx-auto text-center w-full">
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                        {gremio.nombre}
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mt-4 mb-5">
                        {gremio.ads.titular}
                    </h1>
                    <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium">
                        {gremio.ads.subtitulo}
                    </p>

                    <ul className="space-y-3 text-left max-w-md mx-auto mb-10">
                        {gremio.ads.bullets.map(b => (
                            <li key={b} className="flex items-start gap-3">
                                <CheckCircle2 className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                                <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{b}</span>
                            </li>
                        ))}
                    </ul>

                    {/* EL único CTA de la página */}
                    <button
                        onClick={irARegistro}
                        className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white text-lg font-black rounded-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/25 inline-flex items-center justify-center gap-3 group"
                    >
                        {gremio.ads.cta}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-4">
                        Sin tarjeta · Sin permanencia · Listo en 5 minutos
                    </p>

                    {testimonio && (
                        <figure className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left max-w-md mx-auto">
                            <blockquote className="text-slate-700 dark:text-slate-200 leading-relaxed">
                                “{testimonio.texto}”
                            </blockquote>
                            <figcaption className="mt-3 text-sm">
                                <span className="font-bold text-slate-900 dark:text-white">{testimonio.nombre}</span>
                                <span className="text-slate-500 dark:text-slate-400"> · {testimonio.negocio}</span>
                            </figcaption>
                        </figure>
                    )}
                </div>
            </main>

            {/* Pie mínimo: lo legal obligatorio, en discreto */}
            <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    © 2026 TuPresuListo ·{' '}
                    <Link href="/privacy" className="hover:underline">Privacidad</Link> ·{' '}
                    <Link href="/terms" className="hover:underline">Términos</Link>
                </p>
            </footer>
        </div>
    );
};

export default GremioAdsPage;
