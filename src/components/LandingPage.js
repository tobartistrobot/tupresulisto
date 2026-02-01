import React, { useState, useEffect } from 'react';
import {
    Calculator, Check, ChevronRight, Menu, X, ArrowRight, Zap,
    LayoutDashboard, Layers, Ruler, MousePointerClick, AppWindow,
    DoorOpen, Shield, Box, Settings
} from 'lucide-react';

const LandingPage = ({ onLogin, onRegister, onShowTour }) => {
    const [mobileMenu, setMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="font-sans text-slate-800 bg-slate-50 min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

            {/* Header - Professional & Clean */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 backdrop-blur-md border-slate-200 shadow-sm py-3' : 'bg-transparent border-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <Calculator className="text-white" size={20} />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                                tupresulisto<span className="text-blue-600">.com</span>
                            </span>
                        </div>

                        <nav className="hidden md:flex items-center gap-8 bg-white/50 px-6 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors">Sistema</a>
                            <a href="#freedom" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors">Libertad Creativa</a>
                            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors">Precios</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-blue-900 transition-colors">
                                Acceso Clientes
                            </button>
                            <button onClick={onRegister} className="px-6 py-2.5 bg-blue-900 text-white text-sm font-bold rounded-lg hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                Probar Gratis Ahora
                            </button>
                        </div>

                        <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setMobileMenu(!mobileMenu)}>
                            {mobileMenu ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
                {/* Mobile Menu */}
                {mobileMenu && (
                    <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl absolute w-full z-40">
                        <button onClick={onLogin} className="block w-full text-center font-bold text-slate-600 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Acceso Clientes</button>
                        <button onClick={onRegister} className="block w-full bg-blue-900 text-white font-bold py-3 rounded-lg text-center shadow-md hover:bg-blue-800 transition-colors">Probar Gratis Ahora</button>
                    </div>
                )}
            </header>

            {/* Hero Section - Industrial Premium */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">


                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-8 mt-6 animate-fade-in-up">
                    Si se puede medir,<br />
                    <span className="text-blue-900">se puede presupuestar.</span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-500 max-w-4xl mx-auto mb-12 leading-relaxed font-medium animate-fade-in-up animation-delay-100">
                    La herramienta definitiva para carpintería y reformas.
                    <span className="block mt-2 text-slate-700">Ventanas, puertas, toldos, mamparas, mosquiteras y cualquier producto que imagines.</span>
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-5 mb-24 animate-fade-in-up animation-delay-200">
                    <button onClick={onRegister} className="px-10 py-5 bg-blue-900 text-white text-lg font-bold rounded-xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 hover:scale-105 flex items-center justify-center gap-3 group">
                        Probar Gratis Ahora <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={onLogin} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 text-lg font-bold rounded-xl hover:border-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                        Acceso Clientes
                    </button>
                </div>

                {/* Míralo en Acción - Elegant Screenshot Container */}
                <div className="relative max-w-6xl mx-auto animate-fade-in-up animation-delay-300">
                    <div className="absolute -inset-2 bg-slate-200/50 rounded-[2.5rem] blur-xl opacity-50 -z-10"></div>
                    <div className="bg-slate-900 rounded-[2rem] p-3 shadow-2xl border border-slate-700">
                        {/* Browser Chrome */}
                        <div className="h-10 bg-slate-800 rounded-t-xl flex items-center px-4 gap-2 border-b border-slate-700 mb-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="inline-block px-8 py-0.5 rounded-md bg-slate-900 text-[10px] text-slate-500 font-mono">
                                    tupresulisto.com/dashboard
                                </div>
                            </div>
                        </div>

                        {/* Grid Dashboard */}
                        <div className="grid grid-cols-12 gap-2 aspect-[16/9] bg-slate-100 rounded-b-lg overflow-hidden relative">
                            {/* Main Dashboard */}
                            <div className="col-span-12 md:col-span-8 bg-white overflow-hidden relative group">
                                <img src="/captura-dashboard.png" alt="Panel de Control" className="w-full h-full object-cover object-left-top transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">Vista General</span>
                                </div>
                            </div>

                            {/* Side Column */}
                            <div className="hidden md:flex flex-col col-span-4 gap-2">
                                <div className="flex-1 bg-white overflow-hidden relative group">
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 cursor-pointer group-hover:bg-slate-100 transition-colors">
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-900 mx-auto mb-2">
                                                <Calculator size={24} />
                                            </div>
                                            <span className="text-slate-900 font-bold text-sm block">Motor Matricial</span>
                                            <span className="text-slate-500 text-xs text-center block mt-1">Precisión milimétrica</span>
                                        </div>
                                    </div>
                                    <img src="/pricing-matrix.png" alt="Matriz" className="w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 p-4 bg-white" />
                                </div>
                                <div className="flex-1 bg-white overflow-hidden relative group">
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 cursor-pointer group-hover:bg-slate-100 transition-colors">
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-900 mx-auto mb-2">
                                                <AppWindow size={24} />
                                            </div>
                                            <span className="text-slate-900 font-bold text-sm block">PDF Instantáneo</span>
                                            <span className="text-slate-500 text-xs text-center block mt-1">Listo para enviar</span>
                                        </div>
                                    </div>
                                    <img src="/captura-presupuesto-nueva.png" alt="Presupuesto" className="w-full h-full object-contain bg-white opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Libertad Creativa Section - EL PUNTO CLAVE */}
            <section id="freedom" className="py-24 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-blue-600 font-black tracking-widest uppercase text-sm border-l-4 border-blue-600 pl-4 mb-6 block">Libertad Creativa</span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Tu catálogo,<br />
                                <span className="text-slate-400">tus reglas.</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                A diferencia de otros programas rígidos, aquí no estás limitado a una base de datos preinstalada.
                                ¿Vendes un producto nuevo mañana? <span className="text-slate-900 font-bold">Súbelo hoy en 30 segundos.</span>
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 text-green-700 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 block">Sube tus propias fotos</strong>
                                        <span className="text-slate-500 text-sm">Personaliza cada ficha de producto con imágenes reales de tu taller.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 text-green-700 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 block">Nombres y códigos personalizados</strong>
                                        <span className="text-slate-500 text-sm">Usa la nomenclatura que tus clientes y empleados ya conocen.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-green-100 text-green-700 rounded-full mt-1"><Check size={16} strokeWidth={3} /></div>
                                    <div>
                                        <strong className="text-slate-900 block">Adaptabilidad total</strong>
                                        <span className="text-slate-500 text-sm">Desde una simple manilla hasta una pérgola bioclimática motorizada.</span>
                                    </div>
                                </li>
                            </ul>

                            <div onClick={onShowTour} className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all cursor-pointer group-hover:text-blue-700">
                                Ver cómo funciona el editor <ArrowRight size={18} />
                            </div>
                        </div>

                        {/* Visual Illustration of Customization */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-100 rounded-3xl transform rotate-3 -z-10"></div>
                            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                        <Settings className="text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white border text-center border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-blue-400 cursor-pointer transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            <img src="/manilla-acero.png" className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-slate-700">Manilla de acero</span>
                                                <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded-full">Activo</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-blue-500 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
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
            <section className="py-24 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Column: Copy */}
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                <Zap size={12} className="fill-indigo-700" />
                                <span>Ideal para cristalería, toldos y carpintería</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Rellena tu tabla de precios en segundos.
                            </h2>

                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                Olvídate de usar la calculadora casilla por casilla. Con el nuevo <strong>Cálculo Automático</strong>, solo necesitas definir el precio de las 4 esquinas. Nuestro sistema calcula y rellena matemáticamente el resto de la tabla.
                            </p>

                            <div className="flex items-center gap-4 text-slate-800 font-bold">
                                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <span className="text-lg">Cierra ventas en segundos, sin errores.</span>
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

            {/* Versatilidad en el Precio Section - Lógica de Negocio */}
            <section id="pricing" className="py-24 bg-slate-50 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Potencia de Cálculo</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 mb-6">Versatilidad en el Precio</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Soportamos todas las lógicas de cobro estándar de la industria. No cambies tu forma de trabajar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
                        {/* Tabla Matriz */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-blue-900/40 z-10 hover:z-20">
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
                                    <img
                                        src="/pricing-matrix.png"
                                        alt="Matriz"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                    />
                                </div>
                            </div>

                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Cálculo exacto</strong> por cruce de medidas. La opción profesional para aluminio y PVC.
                            </p>
                        </div>

                        {/* Metro Cuadrado */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-blue-900/40 z-10 hover:z-20">
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
                                    <img
                                        src="/pricing-area.png"
                                        alt="Area"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                    />
                                </div>
                            </div>

                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Superficie automática.</strong> Ideal para cerramientos, vidrios, suelos y techos.
                            </p>
                        </div>

                        {/* Metro Lineal */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-blue-900/40 z-10 hover:z-20">
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
                                    <img
                                        src="/pricing-linear.png"
                                        alt="Lineal"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                    />
                                </div>
                            </div>

                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                <strong className="text-slate-900">Venta rápida</strong> por longitud. Perfecto para perfiles, tubos, toldos y vallas.
                            </p>
                        </div>

                        {/* Unidad */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-blue-900/40 z-10 hover:z-20">
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
                                    <img
                                        src="/pricing-unit.png"
                                        alt="Unitario"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                    />
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
                    <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Rompe los límites de tu catálogo.</h2>
                    <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-2xl mx-auto font-light">
                        Una herramienta que crece contigo. Empieza hoy mismo.
                    </p>
                    <button onClick={onRegister} className="px-12 py-6 bg-white text-blue-900 text-xl font-bold rounded-lg shadow-xl shadow-blue-950/50 hover:bg-blue-50 hover:scale-105 transition-all">
                        Crear Cuenta Profesional
                    </button>
                    <p className="text-blue-300/60 text-sm mt-8 font-mono uppercase tracking-widest">Sin tarjeta de crédito</p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
