import React from 'react';
import { Calculator, ChevronRight, Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Column 1: Logo & Slogan */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center shadow-md">
                                <Calculator className="text-white" size={20} />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-slate-900">
                                tupresulisto<span className="text-blue-600">.com</span>
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                            Presupuestos profesionales en minutos. La herramienta definitiva para carpintería y reformas.
                        </p>
                    </div>

                    {/* Column 2: Legal Links */}
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors text-sm flex items-center gap-2">
                                    <ChevronRight size={14} className="opacity-50" />
                                    Términos y Condiciones
                                </a>
                            </li>
                            <li>
                                <a href="/privacy" className="text-slate-600 hover:text-blue-600 transition-colors text-sm flex items-center gap-2">
                                    <ChevronRight size={14} className="opacity-50" />
                                    Política de Privacidad
                                </a>
                            </li>
                            <li>
                                <a href="/legal" className="text-slate-600 hover:text-blue-600 transition-colors text-sm flex items-center gap-2">
                                    <ChevronRight size={14} className="opacity-50" />
                                    Aviso Legal
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Support */}
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">Soporte</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors text-sm flex items-center gap-2">
                                    <ChevronRight size={14} className="opacity-50" />
                                    Contacto
                                </a>
                            </li>
                            <li>
                                <button className="text-slate-600 hover:text-blue-600 transition-colors text-sm flex items-center gap-2">
                                    <ChevronRight size={14} className="opacity-50" />
                                    Centro de Ayuda
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar - Copyright */}
                <div className="pt-8 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm text-center md:text-left">
                            © 2026 TuPresuListo. Todos los derechos reservados.
                        </p>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Shield size={14} />
                            <span className="text-xs">Sitio seguro y protegido</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
