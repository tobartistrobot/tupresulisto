'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Diálogo de confirmación propio, en sustitución del confirm() nativo.
 *
 * El confirm() del navegador no es fiable en móvil: en una PWA instalada
 * (display standalone) puede ignorarse sin avisar, de modo que el botón
 * "no hace nada" y el usuario cree que la app está rota. Además bloquea el
 * hilo y se ve como un cuadro del sistema, ajeno a la app.
 *
 * Uso (devuelve una promesa, igual de cómodo que el nativo):
 *
 *   const confirmar = useConfirm();
 *   if (await confirmar({ mensaje: '¿Borrar el presupuesto?' })) { ... }
 */

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
    const [dialogo, setDialogo] = useState(null);
    // El resolve de la promesa en curso: lo llama el botón que se pulse.
    const resolver = useRef(null);

    const confirmar = useCallback((opciones) => {
        const cfg = typeof opciones === 'string' ? { mensaje: opciones } : (opciones || {});
        setDialogo({
            titulo: cfg.titulo || '¿Seguro?',
            mensaje: cfg.mensaje || '',
            textoConfirmar: cfg.textoConfirmar || 'Eliminar',
            textoCancelar: cfg.textoCancelar || 'Cancelar',
        });
        return new Promise(resolve => { resolver.current = resolve; });
    }, []);

    const cerrar = (valor) => {
        setDialogo(null);
        if (resolver.current) {
            resolver.current(valor);
            resolver.current = null;
        }
    };

    return (
        <ConfirmContext.Provider value={confirmar}>
            {children}
            {dialogo && (
                <div
                    className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-titulo"
                    onClick={() => cerrar(false)}
                >
                    <div
                        // stopPropagation: pulsar dentro del cuadro no debe cerrarlo.
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 animate-slide-up mb-[max(0px,env(safe-area-inset-bottom,0px))]"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 shrink-0 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="min-w-0">
                                <h2 id="confirm-titulo" className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                                    {dialogo.titulo}
                                </h2>
                                {dialogo.mensaje && (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                        {dialogo.mensaje}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Cancelar primero y a la izquierda: en una acción
                            destructiva, la salida segura debe ser la fácil. */}
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => cerrar(false)}
                                className="flex-1 min-h-[48px] rounded-xl font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                {dialogo.textoCancelar}
                            </button>
                            <button
                                autoFocus
                                onClick={() => cerrar(true)}
                                className="flex-1 min-h-[48px] rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20"
                            >
                                {dialogo.textoConfirmar}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => useContext(ConfirmContext);
