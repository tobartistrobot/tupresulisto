import React from 'react';
import { ArrowRight, Calculator, AppWindow } from 'lucide-react';

const Hero = ({ onRegister, onLogin }) => {
    return (
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-8 mt-6 animate-fade-in-up">
                Inmediatez radical con<br />
                <span className="text-blue-600 dark:text-blue-400">acabado de gran empresa.</span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-4xl mx-auto mb-12 leading-relaxed font-medium animate-fade-in-up animation-delay-100">
                El software que elimina el secuestro de tiempo del autónomo.
                <span className="block mt-2 text-slate-700 dark:text-slate-300">Haz presupuestos de ventanas, toldos, carpintería y más en 30 segundos.</span>
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 sm:mb-24 animate-fade-in-up animation-delay-200 px-2 sm:px-0">
                <button onClick={onRegister} className="px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white text-base sm:text-lg font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-600/20 hover:scale-105 flex items-center justify-center gap-3 group">
                    Probar Gratis Ahora <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={onLogin} className="px-8 sm:px-10 py-4 sm:py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-base sm:text-lg font-bold rounded-xl hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all flex items-center justify-center gap-3">
                    Acceso Clientes
                </button>
            </div>

            {/* Míralo en Acción - Elegant Screenshot Container */}
            <div className="relative max-w-6xl mx-auto animate-fade-in-up animation-delay-300">
                <div className="absolute -inset-2 bg-blue-500/20 dark:bg-blue-500/10 rounded-[2.5rem] blur-2xl opacity-50 -z-10"></div>
                <div className="bg-slate-900 rounded-[2rem] p-3 shadow-2xl border border-slate-700 dark:border-slate-800 ring-1 ring-white/10">
                    {/* Browser Chrome */}
                    <div className="h-10 bg-slate-800/80 backdrop-blur-md rounded-t-xl flex items-center px-4 gap-2 border-b border-slate-700/50 mb-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-600/50"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-600/50"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-600/50"></div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="inline-block px-8 py-0.5 rounded-md bg-slate-900/50 text-[10px] text-slate-400 font-mono">
                                tupresulisto.com/dashboard
                            </div>
                        </div>
                    </div>

                    {/* Grid Dashboard */}
                    <div className="grid grid-cols-12 gap-2 aspect-[16/9] bg-slate-950 rounded-b-lg overflow-hidden relative">
                        {/* Main Dashboard */}
                        <div className="col-span-12 md:col-span-8 bg-slate-900 overflow-hidden relative group">
                            <img src="/captura-dashboard.png" alt="Panel de Control" className="w-full h-full object-cover object-left-top transition-transform duration-700 group-hover:scale-105 opacity-90" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-4">
                                <span className="text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm bg-black/30 px-2 py-1 rounded">Vista General</span>
                            </div>
                        </div>

                        {/* Side Column */}
                        <div className="hidden md:flex flex-col col-span-4 gap-2">
                            <div className="flex-1 bg-slate-900 overflow-hidden relative group rounded-md">
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 cursor-pointer group-hover:bg-slate-800 transition-colors z-10 transition-opacity group-hover:opacity-0">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mx-auto mb-2 border border-blue-500/30">
                                            <Calculator size={24} />
                                        </div>
                                        <span className="text-slate-200 font-bold text-sm block">Motor Matricial</span>
                                        <span className="text-slate-400 text-xs text-center block mt-1">Precisión milimétrica</span>
                                    </div>
                                </div>
                                <img src="/pricing-matrix.png" alt="Matriz" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity absolute inset-0 mix-blend-screen" />
                            </div>
                            <div className="flex-1 bg-slate-900 overflow-hidden relative group rounded-md">
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 cursor-pointer group-hover:bg-slate-800 transition-colors z-10 transition-opacity group-hover:opacity-0">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mx-auto mb-2 border border-emerald-500/30">
                                            <AppWindow size={24} />
                                        </div>
                                        <span className="text-slate-200 font-bold text-sm block">PDF Instantáneo</span>
                                        <span className="text-slate-400 text-xs text-center block mt-1">Listo para enviar</span>
                                    </div>
                                </div>
                                <img src="/captura-presupuesto-nueva.png" alt="Presupuesto" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity absolute inset-0 mix-blend-screen" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
