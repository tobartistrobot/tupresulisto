'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

/**
 * Chat del agente IA (función PRO). Panel a pantalla completa en móvil y
 * lateral en escritorio, con dictado por voz para dar medidas con las manos
 * ocupadas: el caso real es el profesional midiendo en una obra.
 *
 * El dictado usa la Web Speech API del navegador (es-ES): gratis, sin
 * mandar audio a nuestro servidor. En Android/Chrome —el móvil de obra
 * típico— funciona de serie; en iOS Safari no existe, así que el botón se
 * oculta y queda el micrófono del teclado, que hace lo mismo.
 *
 * El historial vive solo en memoria de este componente, a propósito: es un
 * asistente de tarea ("calcula esto, crea aquello"), no una conversación que
 * merezca sincronizarse entre dispositivos.
 */

const SUGERENCIAS = [
    '¿Qué productos tengo?',
    'Calcula una corredera de 1200 por 1000',
    '¿Cuántos presupuestos tengo pendientes?',
];

const AgentChat = ({ user, onClose }) => {
    const toast = useToast();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const recogRef = useRef(null);

    // Web Speech API: solo donde exista (Chrome/Android/Edge; iOS Safari no).
    const SpeechRecognition = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null;

    useEffect(() => {
        // Autoscroll al último mensaje.
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, busy]);

    useEffect(() => () => recogRef.current?.abort?.(), []);

    const toggleMic = useCallback(() => {
        if (!SpeechRecognition) return;
        if (listening) {
            recogRef.current?.stop();
            return;
        }
        const recog = new SpeechRecognition();
        recogRef.current = recog;
        recog.lang = 'es-ES';
        recog.interimResults = true;
        recog.continuous = false;

        let final = '';
        recog.onresult = (e) => {
            let interim = '';
            for (const r of e.results) {
                if (r.isFinal) final += r[0].transcript;
                else interim += r[0].transcript;
            }
            // Se ve lo que va reconociendo; al terminar queda solo lo firme.
            setInput(prev => {
                const base = prev.replace(/….*$/, '');
                return final ? (base ? `${base} ${final}`.trim() : final.trim()) : `${base}…${interim}`;
            });
        };
        recog.onerror = (e) => {
            setListening(false);
            if (e.error === 'not-allowed') toast('Permite el acceso al micrófono para dictar', 'error');
        };
        recog.onend = () => {
            setListening(false);
            setInput(prev => prev.replace(/….*$/, '').trim());
            inputRef.current?.focus();
        };
        setListening(true);
        recog.start();
    }, [SpeechRecognition, listening, toast]);

    const send = useCallback(async (texto) => {
        const contenido = (texto ?? input).trim();
        if (!contenido || busy) return;

        const nuevos = [...messages, { role: 'user', text: contenido }];
        setMessages(nuevos);
        setInput('');
        setBusy(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ messages: nuevos.map(m => ({ role: m.role, text: m.text })) }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMessages(m => [...m, { role: 'model', text: data.error || 'Algo ha fallado. Inténtalo de nuevo.', isError: true }]);
                return;
            }
            setMessages(m => [...m, { role: 'model', text: data.text, acciones: data.acciones }]);
        } catch {
            setMessages(m => [...m, { role: 'model', text: 'No hay conexión con el agente. Comprueba tu internet e inténtalo de nuevo.', isError: true }]);
        } finally {
            setBusy(false);
        }
    }, [input, busy, messages, user]);

    return (
        <div className="fixed inset-0 z-[90] flex md:items-end md:justify-end md:p-4 md:pointer-events-none">
            {/* Fondo atenuado solo en escritorio; en móvil el panel llena todo */}
            <div className="hidden md:block absolute inset-0" onClick={onClose}></div>

            <div className="pointer-events-auto relative w-full h-full md:h-[calc(100%-2rem)] md:max-h-[720px] md:w-[420px] bg-white dark:bg-slate-900 md:rounded-2xl md:border md:border-slate-200 md:dark:border-slate-700 md:shadow-2xl flex flex-col overflow-hidden animate-slide-up">

                {/* Cabecera */}
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Bot size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-900 dark:text-white leading-tight">Agente IA</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Beta · Plan PRO</p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar el chat" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Mensajes */}
                <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Sparkles size={26} />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Pregúntame por tu catálogo, calcula precios o dicta un presupuesto mientras mides.
                            </p>
                            <div className="flex flex-col gap-2 w-full">
                                {SUGERENCIAS.map(s => (
                                    <button key={s} onClick={() => send(s)} className="text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl px-4 py-3 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : m.isError
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40 rounded-bl-md'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md'
                                }`}>
                                {m.text}
                                {m.acciones?.length > 0 && (
                                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide opacity-60">
                                        {[...new Set(m.acciones)].join(' · ').replaceAll('_', ' ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {busy && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                <Loader2 size={16} className="animate-spin" /> Consultando…
                            </div>
                        </div>
                    )}
                </div>

                {/* Entrada */}
                <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-white dark:bg-slate-900">
                    {listening && (
                        <p className="text-[11px] font-bold text-red-500 mb-2 flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Escuchando… habla ahora
                        </p>
                    )}
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            placeholder="Escribe o dicta tu consulta…"
                            className="flex-1 resize-none max-h-32 min-h-[48px] px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                        />
                        {SpeechRecognition && (
                            <button
                                onClick={toggleMic}
                                aria-label={listening ? 'Parar el dictado' : 'Dictar por voz'}
                                className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${listening
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}
                            >
                                {listening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        )}
                        <button
                            onClick={() => send()}
                            disabled={busy || !input.trim()}
                            aria-label="Enviar"
                            className="shrink-0 w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40 disabled:shadow-none transition-all"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentChat;
