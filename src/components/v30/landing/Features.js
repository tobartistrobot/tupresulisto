import React from 'react';
import { Check, ArrowRight, Zap, Settings, Box } from 'lucide-react';

const Features = ({ onShowTour }) => {
    return (
        <>
            {/* Libertad Creativa Section */}
            <section id="freedom" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-blue-600 dark:text-blue-400 font-black tracking-widest uppercase text-sm border-l-4 border-blue-600 dark:border-blue-400 pl-4 mb-6 block">Catálogo Regalo Incluido</span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                                Entra y vende,<br />
                                <span className="text-slate-400 dark:text-slate-500">desde el primer minuto.</span>
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                A diferencia de otros programas rígidos, te regalamos un catálogo base para tu gremio. Y si quieres añadir tus productos: <span className="text-slate-900 dark:text-white font-bold">Súbelo hoy en 30 segundos.</span>
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 dark:text-white block">Catálogos Pre-cargados</strong>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">Cristalería, Toldos, Carpintería Metálica. Listo para usar.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 dark:text-white block">Sube tus propias fotos</strong>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">Personaliza cada ficha de producto con imágenes reales de tu taller.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 dark:text-white block">Tipos de Cálculo Infinitos</strong>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">Motor Matricial, Lineal, por M2 o Unitario.</span>
                                    </div>
                                </li>
                            </ul>

                            <div onClick={onShowTour} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:gap-3 transition-all cursor-pointer group-hover:text-blue-500">
                                Ver cómo funciona el editor <ArrowRight size={18} />
                            </div>
                        </div>

                        {/* Visual Illustration of Customization */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-3xl transform rotate-3 -z-10"></div>
                            <div className="glass-panel rounded-3xl p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                                        <Settings className="text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-800 border text-center border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            <img src="/manilla-acero.png" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal dark:opacity-80" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-slate-700 dark:text-slate-200">Manilla de acero</span>
                                                <span className="text-green-600 dark:text-green-400 font-bold text-xs bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/20">Activo</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all cursor-pointer">
                                        <Box size={24} className="mb-2" />
                                        <span className="text-sm font-bold">Subir Nuevo Producto</span>
                                    </div>
                                </div>
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
                                Rellena tu tabla de precios en segundos.
                            </h2>

                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                Olvídate de usar la calculadora casilla por casilla. Con el nuevo <strong>Cálculo Automático Matricial</strong>, solo necesitas definir las esquinas de tu tabla. Nuestro motor predice y rellena matemáticamente el resto con precisión milimétrica.
                            </p>

                            <div className="flex items-center gap-4 text-slate-800 dark:text-slate-200 font-bold">
                                <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <span className="text-lg">Cierra ventas con PDFs imponentes.</span>
                            </div>
                        </div>

                        {/* Right Column: Visual */}
                        <div className="order-1 lg:order-2 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[3rem] transform rotate-2 group-hover:rotate-1 transition-transform -z-10"></div>
                            <img
                                src="/auto-calc-hero.png"
                                alt="Cálculo Automático de Precios"
                                className="w-full h-auto rounded-2xl shadow-2xl border border-slate-200/50 transform group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Features;
