import React from 'react';
import { Calculator, Layers, Ruler, MousePointerClick } from 'lucide-react';

const Pricing = ({ onRegister }) => {
    return (
        <>
            {/* Esta sección explica los TIPOS DE CÁLCULO, no los precios.
                El ancla #pricing la ocupa ahora Plans.js, que sí muestra planes. */}
            <section id="tipos-de-calculo" className="py-24 bg-white dark:bg-slate-900 px-4 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">Formas de cobrar</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 mb-6">Cobra como cobras tú</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                            Cada gremio tiene su forma de poner precio. Aquí caben las cuatro habituales,
                            así que no tienes que cambiar tu manera de trabajar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-6xl mx-auto">
                        {/* Tabla Matriz */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-blue-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-2">Tabla Matriz</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 dark:text-blue-400 uppercase">Ancho × Alto</span>
                                </div>
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/15 rounded-2xl flex items-center justify-center text-blue-900 dark:text-blue-300 group-hover:scale-110 transition-transform duration-500">
                                    <Calculator size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-100 dark:border-slate-700 group-hover:border-blue-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-blue-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-matrix.png" alt="Matriz" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                <strong className="text-slate-900 dark:text-white">Tu tabla de ancho por alto.</strong> Es como se presupuesta el aluminio y el PVC.
                            </p>
                        </div>

                        {/* Metro Cuadrado */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-600 to-emerald-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-2">Metro Cuadrado</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 dark:text-blue-400 uppercase">Precio por m²</span>
                                </div>
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/15 rounded-2xl flex items-center justify-center text-blue-900 dark:text-emerald-300 group-hover:scale-110 transition-transform duration-500">
                                    <Layers size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-100 dark:border-slate-700 group-hover:border-emerald-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-emerald-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-area.png" alt="Area" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                <strong className="text-slate-900 dark:text-white">Calcula la superficie sola.</strong> Para cerramientos, vidrios, suelos y techos.
                            </p>
                        </div>

                        {/* Metro Lineal */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-600 to-purple-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-2">Metro Lineal</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 dark:text-blue-400 uppercase">Precio por ml</span>
                                </div>
                                <div className="w-20 h-20 bg-purple-50 dark:bg-purple-500/15 rounded-2xl flex items-center justify-center text-blue-900 dark:text-purple-300 group-hover:scale-110 transition-transform duration-500">
                                    <Ruler size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-100 dark:border-slate-700 group-hover:border-purple-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-purple-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-linear.png" alt="Lineal" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                <strong className="text-slate-900 dark:text-white">Cobras por metros de largo.</strong> Para perfiles, tubos, toldos y vallas.
                            </p>
                        </div>

                        {/* Unidad */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-600 to-amber-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-2">Unidad</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 dark:text-blue-400 uppercase">Precio Fijo</span>
                                </div>
                                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/15 rounded-2xl flex items-center justify-center text-blue-900 dark:text-amber-300 group-hover:scale-110 transition-transform duration-500">
                                    <MousePointerClick size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-100 dark:border-slate-700 group-hover:border-amber-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-amber-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-unit.png" alt="Unitario" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                <strong className="text-slate-900 dark:text-white">Precio cerrado por pieza.</strong> Para herrajes, accesorios y mano de obra.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Pricing;
