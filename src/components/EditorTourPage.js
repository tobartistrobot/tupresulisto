import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Calculator, Check, Zap } from 'lucide-react';

const EditorTourPage = ({ onBack, onRegister }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const steps = [
        {
            number: "01",
            title: "1. Define el producto",
            description: "Sube tu foto y clasifica tu catálogo fácilmente.",
            image: "/captura-editor-paso1.png",
            align: "left"
        },
        {
            number: "02",
            title: "2. Configura tu regla de precio",
            description: "Elige entre Matriz v30, m², ml o Unidad. Precisión absoluta en cada presupuesto.",
            image: "/captura-editor-paso2-precios.png",
            align: "right"
        },
        {
            number: "03",
            title: "3. Personaliza y finaliza",
            description: "Añade extras, acabados y márgenes comerciales en segundos.",
            image: "/captura-editor-paso3.png",
            align: "left"
        }
    ];

    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden pb-20">

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={onBack}>
                        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                            <Calculator className="text-white" size={20} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">
                            tupresulisto<span className="text-blue-600">.com</span>
                        </span>
                    </div>
                    <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Volver
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-40 pb-20 px-4 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-blue-100/50 border border-blue-200 text-blue-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
                    <Zap size={14} className="fill-blue-800" /> Editor de Producto v3.0
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight animate-fade-in-up">
                    Tu taller, digitalizado en <br /><span className="text-blue-600">3 sencillos pasos</span>
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
                    Descubre por qué cientos de profesionales ya no usan hojas de cálculo.
                </p>
            </section>

            {/* Steps */}
            <section className="px-4 max-w-7xl mx-auto space-y-24 md:space-y-32">
                {steps.map((step, index) => (
                    <div key={index} className={`flex flex-col ${step.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24 animate-fade-in-up`}>
                        <div className="flex-1 space-y-6">
                            <span className="text-8xl font-black text-slate-200/50 block leading-none select-none">{step.number}</span>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900">{step.title}</h2>
                            <p className="text-lg text-slate-600 leading-relaxed font-medium">{step.description}</p>
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                <div className="p-1 bg-blue-100 rounded-full"><Check size={14} strokeWidth={3} /></div> Paso completado
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="relative group perspective-1000">
                                <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity rounded-3xl"></div>
                                <div className="relative bg-white border border-slate-200 p-2 rounded-3xl shadow-2xl transform transition-transform duration-500 group-hover:rotate-1 group-hover:scale-[1.02]">
                                    <div className="bg-slate-100 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
                                        <img src={step.image} alt={step.title} className="w-full h-full object-cover" onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                            e.target.parentNode.innerHTML += `<div class="text-slate-400 font-medium flex flex-col items-center"><span class="text-4xl mb-2">📷</span><span>${step.title}</span></div>`;
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* CTA */}
            <section className="mt-32 px-4 pb-20">
                <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center text-white max-w-5xl mx-auto relative overflow-hidden shadow-2xl shadow-slate-900/50">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-8">¿Listo para probarlo?</h2>
                        <button onClick={onRegister} className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mx-auto group">
                            Empezar mi prueba gratuita (3 productos) <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="mt-8 text-slate-400 text-sm font-medium">Sin tarjeta de crédito · 3 productos incluidos en el plan gratuito</p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default EditorTourPage;
