'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Mic, MicOff, Loader2, Sparkles, Paperclip, FileText } from 'lucide-react';
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

/* ── Adjuntos ────────────────────────────────────────────────────────────
 * El caso real: una foto de la hoja de medidas manuscrita, o el PDF que
 * manda un arquitecto, y que el agente saque de ahí las líneas del
 * presupuesto. Las fotos se comprimen AQUÍ, en el cliente, porque las
 * peticiones a Vercel tienen un tope de 4,5 MB y una foto de móvil sin
 * tocar ya lo revienta; 1600 px de lado mayor mantiene legible la letra
 * manuscrita. Los PDF van tal cual, con tope de tamaño.
 */
const MAX_ADJUNTOS = 3;
const MAX_PDF_BYTES = 2.5 * 1024 * 1024;      // 2,5 MB por PDF
const MAX_TOTAL_BASE64 = 3_500_000;           // presupuesto total de la petición

/** Comprime una imagen a JPEG ≤1600px y devuelve { mimeType, data, previewUrl }. */
const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    reader.onload = (ev) => {
        const image = new Image();
        image.onerror = () => reject(new Error(`${file.name} no parece una imagen válida`));
        image.onload = () => {
            const MAX = 1600;
            let { width: w, height: h } = image;
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
            else if (h > MAX) { w *= MAX / h; h = MAX; }
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(w); canvas.height = Math.round(h);
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ mimeType: 'image/jpeg', data: dataUrl.split(',')[1], previewUrl: dataUrl });
        };
        image.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

/** Lee un PDF a base64, sin tocarlo. */
const readPdf = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    reader.onload = (ev) => resolve({ mimeType: 'application/pdf', data: String(ev.target.result).split(',')[1], previewUrl: null });
    reader.readAsDataURL(file);
});

const AgentChat = ({ user, onClose }) => {
    const toast = useToast();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);
    const [attachments, setAttachments] = useState([]); // { name, mimeType, data, previewUrl }
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const recogRef = useRef(null);
    // Dictado continuo: el navegador corta la sesión con los silencios (y en
    // Android incluso en modo continuo); estos refs permiten re-arrancar sin
    // perder lo ya dictado hasta que el USUARIO pare con el botón.
    const keepListeningRef = useRef(false);
    const baseTextRef = useRef('');      // lo que había escrito al arrancar el mic
    const sessionFinalRef = useRef('');  // dictado firme acumulado entre reinicios
    const currentFinalRef = useRef('');  // dictado firme de la sesión en curso

    // Web Speech API: solo donde exista (Chrome/Android/Edge; iOS Safari no).
    const SpeechRecognition = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null;

    useEffect(() => {
        // Autoscroll al último mensaje.
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, busy]);

    useEffect(() => () => { keepListeningRef.current = false; recogRef.current?.abort?.(); }, []);

    /** Compone lo que se ve en el cuadro: base + dictado firme + …provisional. */
    const composeDictation = (interim) => {
        const base = baseTextRef.current;
        const firme = `${sessionFinalRef.current}${currentFinalRef.current}`.trim();
        const solid = [base, firme].filter(Boolean).join(' ').trim();
        return interim ? `${solid}…${interim}` : solid;
    };

    /**
     * Una sesión de reconocimiento. El navegador las corta cuando quiere
     * (silencios largos, límites internos), así que si el usuario no ha
     * parado el micrófono, al acabar una se abre otra y el texto firme se
     * acumula: los silencios de estar midiendo ya no cortan el dictado.
     */
    const spawnRecognizer = useCallback(() => {
        const recog = new SpeechRecognition();
        recogRef.current = recog;
        recog.lang = 'es-ES';
        recog.interimResults = true;
        recog.continuous = true; // que un silencio no cierre la sesión

        currentFinalRef.current = '';
        recog.onresult = (e) => {
            // Reconstruir SIEMPRE desde cero: e.results trae la lista completa
            // de la sesión, y acumular con += duplicaba texto en modo continuo.
            let final = '';
            let interim = '';
            for (const r of e.results) {
                if (r.isFinal) final += r[0].transcript;
                else interim += r[0].transcript;
            }
            currentFinalRef.current = final ? `${final} ` : '';
            setInput(composeDictation(interim));
        };
        recog.onerror = (e) => {
            // 'no-speech' y 'aborted' son ruido del ciclo normal; el resto sí para.
            if (e.error === 'not-allowed') {
                keepListeningRef.current = false;
                toast('Permite el acceso al micrófono para dictar', 'error');
            }
        };
        recog.onend = () => {
            // Consolidar lo firme de esta sesión antes de decidir si seguimos.
            sessionFinalRef.current = `${sessionFinalRef.current}${currentFinalRef.current}`;
            currentFinalRef.current = '';
            if (keepListeningRef.current) {
                // El navegador cortó solo (silencio, límite interno): seguimos.
                try { spawnRecognizer(); } catch { keepListeningRef.current = false; setListening(false); }
                return;
            }
            setListening(false);
            setInput(composeDictation('').trim());
            inputRef.current?.focus();
        };
        recog.start();
    }, [SpeechRecognition, toast]);

    const toggleMic = useCallback(() => {
        if (!SpeechRecognition) return;
        if (listening) {
            // Parar es decisión del usuario: solo entonces dejamos de re-arrancar.
            keepListeningRef.current = false;
            recogRef.current?.stop();
            return;
        }
        baseTextRef.current = input.trim();
        sessionFinalRef.current = '';
        currentFinalRef.current = '';
        keepListeningRef.current = true;
        setListening(true);
        try { spawnRecognizer(); } catch { keepListeningRef.current = false; setListening(false); }
    }, [SpeechRecognition, listening, input, spawnRecognizer]);

    /** Añade archivos (fotos de notas, PDF) como adjuntos del próximo mensaje. */
    const handleFiles = useCallback(async (e) => {
        const files = [...(e.target.files || [])];
        e.target.value = null; // permitir volver a elegir el mismo archivo
        if (!files.length) return;

        const nuevos = [];
        for (const file of files) {
            if (attachments.length + nuevos.length >= MAX_ADJUNTOS) {
                toast(`Máximo ${MAX_ADJUNTOS} archivos por mensaje`, 'error');
                break;
            }
            try {
                if (file.type.startsWith('image/')) {
                    nuevos.push({ name: file.name, ...(await compressImage(file)) });
                } else if (file.type === 'application/pdf') {
                    if (file.size > MAX_PDF_BYTES) {
                        toast(`${file.name} pesa demasiado (máx. 2,5 MB por PDF)`, 'error');
                        continue;
                    }
                    nuevos.push({ name: file.name, ...(await readPdf(file)) });
                } else {
                    toast(`${file.name}: solo se admiten fotos y PDF`, 'error');
                }
            } catch (err) {
                toast(err.message, 'error');
            }
        }
        if (!nuevos.length) return;

        const total = [...attachments, ...nuevos].reduce((s, a) => s + a.data.length, 0);
        if (total > MAX_TOTAL_BASE64) {
            toast('Los archivos juntos pesan demasiado para un solo mensaje. Envíalos por separado.', 'error');
            return;
        }
        setAttachments(prev => [...prev, ...nuevos]);
    }, [attachments, toast]);

    const send = useCallback(async (texto) => {
        let contenido = (texto ?? input).trim();
        const adjuntos = texto === undefined ? attachments : [];
        if ((!contenido && adjuntos.length === 0) || busy) return;
        // Solo archivos, sin texto: se pide lo obvio en su nombre.
        if (!contenido) contenido = 'Extrae la información de estos archivos para preparar un presupuesto.';

        const nuevos = [...messages, { role: 'user', text: contenido, attachments: adjuntos }];
        setMessages(nuevos);
        setInput('');
        setAttachments([]);
        setBusy(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                    // Los adjuntos en sí solo viajan con el turno actual (tope de
                    // 4,5 MB por petición); los turnos viejos llevan una marca de
                    // texto para que el modelo no pierda el hilo de qué se adjuntó.
                    messages: nuevos.map((m, i) => ({
                        role: m.role,
                        text: m.attachments?.length && i < nuevos.length - 1
                            ? `${m.text}\n[Archivos adjuntados: ${m.attachments.map(a => a.name).join(', ')}]`
                            : m.text,
                    })),
                    attachments: adjuntos.map(a => ({ name: a.name, mimeType: a.mimeType, data: a.data })),
                }),
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
    }, [input, attachments, busy, messages, user]);

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
                                También puedes adjuntarme una foto de tus anotaciones o un PDF y saco de ahí las medidas.
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
                                {m.attachments?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {m.attachments.map((a, k) => a.previewUrl
                                            ? <img key={k} src={a.previewUrl} alt={a.name} className="w-16 h-16 object-cover rounded-lg border border-white/30" />
                                            : (
                                                <span key={k} className="flex items-center gap-1.5 text-[11px] font-bold bg-white/15 rounded-lg px-2 py-1.5 max-w-[160px]">
                                                    <FileText size={13} className="shrink-0" /><span className="truncate">{a.name}</span>
                                                </span>
                                            ))}
                                    </div>
                                )}
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
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Escuchando… tómate tu tiempo; pulsa el micro otra vez para terminar
                        </p>
                    )}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {attachments.map((a, i) => (
                                <div key={i} className="relative group">
                                    {a.previewUrl
                                        ? <img src={a.previewUrl} alt={a.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                        : (
                                            <div className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center gap-0.5 px-1">
                                                <FileText size={16} className="text-red-500" />
                                                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 truncate w-full text-center">{a.name}</span>
                                            </div>
                                        )}
                                    <button
                                        onClick={() => setAttachments(prev => prev.filter((_, k) => k !== i))}
                                        aria-label={`Quitar ${a.name}`}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center shadow touch-sm"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                            onChange={handleFiles}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Adjuntar fotos o PDF"
                            title="Adjuntar fotos de anotaciones o PDF"
                            className="shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all"
                        >
                            <Paperclip size={20} />
                        </button>
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
                            disabled={busy || (!input.trim() && attachments.length === 0)}
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
