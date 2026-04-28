import React from 'react';
import { Calculator, X, Menu } from 'lucide-react';

const Header = ({ scrolled, mobileMenu, setMobileMenu, onLogin, onRegister }) => {
    return (
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
    );
};

export default Header;
