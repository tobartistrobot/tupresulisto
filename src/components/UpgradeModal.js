import React from 'react';
import { Crown, Check, X } from 'lucide-react';

const UpgradeModal = ({ onClose, onUpgrade, message }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all scale-100 ring-1 ring-slate-100">
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                        <Crown size={120} />
                    </div>
                    <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-lg">
                        <Crown size={32} className="text-yellow-300 fill-yellow-300" />
                    </div>
                    <h2 className="text-2xl font-black mb-1">Plan Gratuito</h2>
                    <p className="text-blue-100 text-sm font-medium">Límite alcanzado</p>

                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/30 rounded-full p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    <p className="text-center text-slate-600 mb-6 text-lg leading-relaxed">
                        {message || <>Has alcanzado el límite de <strong className="text-slate-900">3 productos</strong> de tu plan gratuito.</>}
                    </p>

                    <div className="bg-blue-50/50 rounded-xl p-5 mb-8 border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">Desbloquea con PRO:</h4>
                        <ul className="space-y-2.5">
                            <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                                <div className="bg-green-100 text-green-700 rounded-full p-0.5"><Check size={12} strokeWidth={3} /></div>
                                Productos ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                                <div className="bg-green-100 text-green-700 rounded-full p-0.5"><Check size={12} strokeWidth={3} /></div>
                                Categorías personalizadas
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                                <div className="bg-green-100 text-green-700 rounded-full p-0.5"><Check size={12} strokeWidth={3} /></div>
                                Cálculos avanzados
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={onUpgrade}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Crown size={20} className="fill-white/20" /> Actualizar a PRO
                    </button>

                    <button onClick={onClose} className="w-full mt-4 py-2 text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors">
                        Quizás más tarde
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
