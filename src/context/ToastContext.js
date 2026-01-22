'use client';
import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (msg, type = 'info') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto min-w-[250px] p-3 rounded-lg shadow-xl border flex items-center gap-3 animate-slide-up bg-white ${t.type === 'error' ? 'border-red-500 text-red-600' : t.type === 'success' ? 'border-green-500 text-green-700' : 'border-blue-500 text-blue-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <span className="text-sm font-bold">{t.msg}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
