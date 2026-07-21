import React from 'react';
import { Check, ArrowRight, Zap } from 'lucide-react';

const Features = ({ onShowTour }) => {
    return (
        <>
            {/* Libertad Creativa Section */}
            <section id="freedom" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-blue-600 dark:text-blue-400 font-black tracking-widest uppercase text-sm border-l-4 border-blue-600 dark:border-blue-400 pl-4 mb-6 block">Catálogo incluido</span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                                No empiezas con la<br />
                                <span className="text-slate-400 dark:text-slate-500">pantalla en blanco.</span>
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                Te damos un catálogo de tu gremio ya montado, para que puedas presupuestar el primer día.
                                Luego lo ajustas a tus precios y añades lo tuyo <span className="text-slate-900 dark:text-white font-bold">en menos de un minuto por producto.</span>
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 dark:text-white block">Catálogos ya preparados</strong>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">Cristalería, toldos y carpintería metálica, listos para usar.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 dark:text-white block">Con las fotos de tu taller</strong>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">El cliente ve el producto real que le vas a instalar, no un dibujo.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 dark:text-white block">Tus precios y tu margen</strong>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">Cobras como cobras tú: por medidas, por m², por metro o por unidad.</span>
                                    </div>
                                </li>
                            </ul>

                            <button onClick={onShowTour} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:gap-3 transition-all cursor-pointer">
                                Ver cómo se monta un producto <ArrowRight size={18} />
                            </button>
                        </div>

                        {/* Captura real del catálogo. Antes había aquí una maqueta hecha con
                            barras grises de relleno: parecía un boceto sin terminar y restaba
                            credibilidad justo donde hay que demostrar que el producto existe. */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-3xl transform rotate-3 -z-10"></div>
                            <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl bg-white">
                                <img
                                    src="/captura-catalogo.png"
                                    alt="Catálogo de productos de TuPresuListo con fichas de ventanas y mosquiteras"
                                    className="w-full h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURE SPOTLIGHT: AUTO CALCULATE */}
            <section id="features" className="py-24 bg-surface dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Column: Copy */}
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-500/20">
                                <Zap size={12} className="fill-indigo-700 dark:fill-indigo-400" />
                                <span>Ideal para cristalería, toldos y carpintería</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                                Monta tu tabla de precios sin rellenar casilla por casilla.
                            </h2>

                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                Una tabla de medidas puede tener cientos de casillas y llenarlas a mano con la calculadora
                                lleva una tarde entera. Aquí defines <strong className="text-slate-900 dark:text-white">las esquinas de tu tabla</strong> y
                                el resto se calcula solo, siguiendo tu propia escala de precios.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
                                    <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg shrink-0">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-lg font-bold">Puedes retocar a mano cualquier casilla</span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
                                    <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg shrink-0">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-lg font-bold">Los precios son los tuyos, no estimaciones</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Visual */}
                        <div className="order-1 lg:order-2 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-[3rem] transform rotate-2 group-hover:rotate-1 transition-transform -z-10"></div>
                            <img
                                src="/auto-calc-hero.png"
                                alt="Tabla de precios por medidas rellenándose automáticamente"
                                className="w-full h-auto rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 transform group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Features;
