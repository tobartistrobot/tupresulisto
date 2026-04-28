import React from 'react';
import { Calculator, Layers, Ruler, MousePointerClick } from 'lucide-react';

const Pricing = ({ onRegister }) => {
    return (
        <>
            <section id="pricing" className="py-24 bg-slate-50 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Potencia de Cálculo</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 mb-6">Versatilidad en el Precio</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Soportamos todas las lógicas de cobro estándar de la industria. No cambies tu forma de trabajar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-6xl mx-auto">
                        {/* Tabla Matriz */}
                        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-blue-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 leading-none mb-2">Tabla Matriz</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 uppercase">Ancho × Alto</span>
                                </div>
                                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-900 group-hover:scale-110 transition-transform duration-500">
                                    <Calculator size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 backdrop-blur-md border border-slate-100 group-hover:border-blue-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-blue-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-matrix.png" alt="Matriz" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Cálculo exacto</strong> por cruce de medidas. La opción profesional para aluminio y PVC.
                            </p>
                        </div>

                        {/* Metro Cuadrado */}
                        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-600 to-emerald-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 leading-none mb-2">Metro Cuadrado</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 uppercase">Precio por m²</span>
                                </div>
                                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-blue-900 group-hover:scale-110 transition-transform duration-500">
                                    <Layers size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 backdrop-blur-md border border-slate-100 group-hover:border-emerald-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-emerald-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-area.png" alt="Area" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Superficie automática.</strong> Ideal para cerramientos, vidrios, suelos y techos.
                            </p>
                        </div>

                        {/* Metro Lineal */}
                        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-600 to-purple-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 leading-none mb-2">Metro Lineal</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 uppercase">Precio por ml</span>
                                </div>
                                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-blue-900 group-hover:scale-110 transition-transform duration-500">
                                    <Ruler size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 backdrop-blur-md border border-slate-100 group-hover:border-purple-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-purple-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-linear.png" alt="Lineal" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Venta rápida</strong> por longitud. Perfecto para perfiles, tubos, toldos y vallas.
                            </p>
                        </div>

                        {/* Unidad */}
                        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-105 md:hover:scale-110 active:scale-[1.02] hover:shadow-blue-900/40 z-10 hover:z-20">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-600 to-amber-900"></div>
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 leading-none mb-2">Unidad</h3>
                                    <span className="text-sm font-bold tracking-widest text-blue-900 uppercase">Precio Fijo</span>
                                </div>
                                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-blue-900 group-hover:scale-110 transition-transform duration-500">
                                    <MousePointerClick size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-8 bg-white/50 backdrop-blur-md border border-slate-100 group-hover:border-amber-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-amber-50/30"></div>
                                <div className="w-full h-full p-6 transform transition-transform duration-700 ease-out group-hover:scale-110">
                                    <img src="/pricing-unit.png" alt="Unitario" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                            </div>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Simple y directo.</strong> Para accesorios, herrajes, servicios y mano de obra.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 bg-blue-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 tracking-tight">Rompe los límites de tu catálogo.</h2>
                    <p className="text-lg sm:text-xl md:text-2xl text-blue-200 mb-10 sm:mb-12 max-w-2xl mx-auto font-light">
                        Una herramienta que crece contigo. Empieza hoy mismo.
                    </p>
                    <button onClick={onRegister} className="w-full sm:w-auto px-10 sm:px-12 py-5 sm:py-6 bg-white text-blue-900 text-lg sm:text-xl font-bold rounded-lg shadow-xl shadow-blue-950/50 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all">
                        Crear Cuenta Profesional
                    </button>
                    <p className="text-blue-300/60 text-sm mt-8 font-mono uppercase tracking-widest">Sin tarjeta de crédito</p>
                </div>
            </section>
        </>
    );
};

export default Pricing;
