'use client';
import React, { useState } from 'react';
import { Wrench, CreditCard, MessageCircle, HelpCircle, Mail, ArrowLeft, X, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText("contacto@tupresulisto.com");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openModal = () => setShowModal(true);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header / Nav simplified */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-bold group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Volver a la App</span>
                    </Link>
                    <span className="font-black text-xl tracking-tight hidden md:block">tupresulisto<span className="text-blue-600">.com</span></span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-12 md:py-20 animate-fade-in-up">
                {/* Encabezado */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">¿En qué podemos ayudarte?</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">Estamos aquí para resolver tus dudas sobre presupuestos, facturación o cualquier problema técnico.</p>
                </div>

                {/* Tarjetas de Contacto */}
                <div className="grid md:grid-cols-3 gap-6 mb-20 max-w-4xl mx-auto">
                    {/* Soporte */}
                    <div onClick={openModal} className="cursor-pointer group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-blue-200 transition-all hover:-translate-y-2 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <Wrench size={32} />
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-slate-800">Soporte Técnico</h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1 leading-relaxed">¿Algo no funciona como esperabas? Te ayudamos a solucionarlo rápidamente.</p>
                        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider bg-blue-50 px-4 py-2.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors w-full">Contactar Soporte</span>
                    </div>

                    {/* Facturación */}
                    <div onClick={openModal} className="cursor-pointer group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-emerald-200 transition-all hover:-translate-y-2 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <CreditCard size={32} />
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-slate-800">Facturación</h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1 leading-relaxed">Dudas sobre tu plan, recibos o si necesitas cambiar tu suscripción.</p>
                        <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider bg-emerald-50 px-4 py-2.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors w-full">Consultar Facturación</span>
                    </div>

                    {/* Feedback */}
                    <div onClick={openModal} className="cursor-pointer group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-purple-200 transition-all hover:-translate-y-2 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <MessageCircle size={32} />
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-slate-800">Feedback</h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1 leading-relaxed">¿Ideas para mejorar? Nos encanta escuchar tus sugerencias para crecer.</p>
                        <span className="text-purple-600 font-bold text-xs uppercase tracking-wider bg-purple-50 px-4 py-2.5 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors w-full">Enviar Sugerencia</span>
                    </div>
                </div>

                {/* FAQ Rápida */}
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-black text-center mb-8 flex items-center justify-center gap-2 text-slate-800">
                        <HelpCircle className="text-slate-400" /> Preguntas Frecuentes
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-200 transition-colors">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">¿Puedo cancelar cuando quiera?</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">Sí, desde tu perfil en cualquier momento. Sin permanencia ni letras pequeñas. Eres libre de irte cuando quieras, aunque nos encantaría que te quedaras.</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-200 transition-colors">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">¿Cómo recupero mi contraseña?</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">Desde la pantalla de inicio de sesión pulsa en <span className="font-bold text-slate-800">"¿Olvidaste tu contraseña?"</span>. Recibirás un enlace seguro en tu email para restablecerla al instante.</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-200 transition-colors">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">¿Emitís factura?</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">Sí, recibirás una factura automática y legal de <span className="font-bold text-slate-800">Lemon Squeezy</span> (nuestro procesador de pagos) por cada pago realizado. Puedes descargarla desde tu email.</p>
                        </div>
                    </div>
                </div>

                {/* Footer info extra */}
                <div className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
                    <div onClick={openModal} className="flex items-center justify-center gap-2 mb-2 font-medium cursor-pointer hover:text-blue-600"><Mail size={16} /> contacto@tupresulisto.com</div>
                    <p>Málaga, Andalucía, España ☀️</p>
                </div>
            </main>

            {/* MODAL EMAIL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-scale-up border border-slate-100">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Contáctanos</h3>
                            <p className="text-slate-500 mb-8">
                                Envíanos un email y te responderemos en menos de 24h.
                            </p>

                            <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-3 group hover:border-blue-300 transition-colors">
                                <span className="font-mono text-sm sm:text-base font-bold text-slate-700 select-all">contacto@tupresulisto.com</span>
                                <button
                                    onClick={handleCopy}
                                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 shadow-sm border'}`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            {copied && <p className="text-xs font-bold text-green-600 mt-2 animate-fade-in">¡Email copiado!</p>}

                            <div className="mt-8 text-xs text-slate-400">
                                Horario: Lunes a Viernes de 9:00 a 18:00
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
