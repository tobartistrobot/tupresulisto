'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useReactToPrint } from 'react-to-print';
import {
    Calculator, Users, Box, Settings, Trash, Plus, Save, Edit, Printer, FileText, Search, RefreshCw,
    ChevronUp, ChevronDown, Download, Upload, X, Ban, List, Undo, ArrowLeft, ArrowRight, ZoomIn, ZoomOut,
    Wand, Sparkles, Home, Check, BarChart2, Share2, Target, Database, Percent, Lock, Loader2
} from 'lucide-react';
import MatrixEditor from './MatrixEditor';
import StatusSelector from './StatusSelector';
import { round2, sanitizeFloat } from '../../utils/mathUtils';
import { useQuoteLogic } from '../../hooks/useQuoteLogic';
import { track, EVENTS } from '../../lib/analytics';

const formatCurrency = (amount) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);

// Medidas del folio A4 y límites del zoom de la vista previa (ver más abajo).
const A4_WIDTH_PX = 794;   // 210mm en píxeles CSS
const A4_HEIGHT_PX = 1123; // 297mm
const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
const EDGE_MARGIN = 16;    // aire entre el folio y el borde de la pantalla

const CartSummaryItem = React.memo(({ item, idx, onRemove, onUpdateQty, onMove }) => (
    <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-300 mb-2 animate-fade-in flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
            {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover rounded-lg" /> : <Box className="text-slate-300 dark:text-slate-500" size={20} />}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 leading-tight truncate">{item.product.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{item.width}x{item.height} {item.locationLabel && `· ${item.locationLabel}`}</p>
            <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600 shrink-0">
                    <button onClick={() => onUpdateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md transition-colors text-slate-600 dark:text-slate-300 font-bold shadow-sm touch-sm">-</button>
                    <span className="text-sm font-bold w-6 text-center text-slate-700 dark:text-slate-200">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md transition-colors text-slate-600 dark:text-slate-300 font-bold shadow-sm touch-sm">+</button>
                </div>
                {item.selectedExtras?.length > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.selectedExtras.length} extra{item.selectedExtras.length > 1 ? 's' : ''}</span>
                )}
            </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1.5">
            <button onClick={() => onRemove(item.id)} className="w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-100 dark:border-red-900/30 touch-sm">
                <Trash size={13} />
            </button>
            <b className="text-base text-blue-900 dark:text-blue-300 font-black tracking-tight whitespace-nowrap">{formatCurrency(item.price)}</b>
        </div>
    </div>
));

const QuoteConfigurator = ({ products, categories, config, cart, setCart, onSave, onReset, initialData, clientsDb, className, isPro, onUpgrade }) => {
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [filterTerm, setFilterTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [viewMode, setViewMode] = useState('edit');
    const [mobileTab, setMobileTab] = useState('products');
    const [docType, setDocType] = useState('quote');
    const [showAdjustments, setShowAdjustments] = useState(false);
    const [showClientForm, setShowClientForm] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const toast = useToast();

    // Delegate business logic to custom hook
    const {
        selectedProduct, setSelectedProduct,
        dims, setDims,
        locationLabel, setLocationLabel,
        client, setClient,
        financials, setFinancials,
        quoteMeta, setQuoteMeta,
        selectedExtras, toggleExtra, updateExtraQty,
        dropdownSelections, setDropdownSelections,
        calculatedPrice, addToQuote, validationError,
        updateQuantity, removeFromCart, moveCartItem,
        grossTotal, discountAmount, netTotal, grandTotal, remainingBalance,
        vatRate,
        saveStatus, setSaveStatus,
        handleSave,
        printableDocRef, handlePrintPDF,
        handleLocalReset, saveTimeoutRef, idleTimeoutRef
    } = useQuoteLogic({
        initialData,
        onSave,
        onReset,
        config,
        cart,
        setCart,
        toast
    });
    const filteredClients = clientsDb.filter(c => (c.name || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) || (c.phone || '').includes(clientSearchTerm));

    /* ──────────────────────────────────────────────────────────────────────
     * Vista previa: arrastrar para mover, pellizcar para ampliar.
     *
     * Antes el documento se escalaba con transform y se dejaba el
     * desplazamiento al scroll del navegador. No funcionaba en móvil: la caja
     * de maquetación sigue midiendo 794x1123 px aunque se vea al 40%, así que
     * el contenedor daba scroll a espacio vacío, y con justify-center no había
     * forma de llegar al borde izquierdo del folio.
     *
     * Ahora el documento se coloca a mano (translate + scale desde la esquina
     * superior izquierda) y los gestos los llevamos nosotros con Pointer
     * Events: valen igual para dedo y para ratón, así que el escritorio sigue
     * funcionando sin código aparte. No se añade librería de pan/zoom: son
     * cuatro operaciones y el proyecto ya arrastra bastantes dependencias.
     * ────────────────────────────────────────────────────────────────────── */
    const previewRef = useRef(null);
    const [view, setView] = useState({ scale: 0.8, x: 0, y: 0 });
    // Espejo del estado para que los gestos calculen sobre el valor actual sin
    // depender de que React haya vuelto a renderizar entre dos "pointermove".
    const viewRef = useRef(view);
    const gestureRef = useRef({ pointers: new Map(), pinch: null, last: null });

    const clampScale = useCallback((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s)), []);

    /** Ajusta la posición para que el folio no se pueda perder fuera de la pantalla. */
    const clampView = useCallback((next) => {
        const scale = clampScale(next.scale);
        const el = previewRef.current;
        if (!el) return { scale, x: next.x, y: next.y };
        const docWidth = A4_WIDTH_PX * scale;
        const docHeight = (printableDocRef.current?.offsetHeight || A4_HEIGHT_PX) * scale;
        // Si cabe entero en un eje lo centramos; si no, no dejamos que su borde
        // se despegue del borde de la pantalla.
        const axis = (pos, docSize, viewSize) => (
            docSize + EDGE_MARGIN * 2 <= viewSize
                ? (viewSize - docSize) / 2
                : Math.min(EDGE_MARGIN, Math.max(viewSize - docSize - EDGE_MARGIN, pos))
        );
        return {
            scale,
            x: axis(next.x, docWidth, el.clientWidth),
            y: axis(next.y, docHeight, el.clientHeight),
        };
    }, [clampScale, printableDocRef]);

    const applyView = useCallback((next) => {
        const clamped = clampView(next);
        viewRef.current = clamped;
        setView(clamped);
    }, [clampView]);

    /** Deja el folio entero a la vista, centrado. */
    const fitToScreen = useCallback(() => {
        const el = previewRef.current;
        if (!el) return;
        const scale = Math.min(1, (el.clientWidth - EDGE_MARGIN * 2) / A4_WIDTH_PX);
        applyView({ scale, x: 0, y: EDGE_MARGIN });
    }, [applyView]);

    /** Zoom desde los botones: se amplía por el centro de lo que se está viendo. */
    const zoomBy = useCallback((factor) => {
        const el = previewRef.current;
        if (!el) return;
        const v = viewRef.current;
        const cx = el.clientWidth / 2;
        const cy = el.clientHeight / 2;
        const scale = clampScale(v.scale * factor);
        applyView({
            scale,
            x: cx - ((cx - v.x) / v.scale) * scale,
            y: cy - ((cy - v.y) / v.scale) * scale,
        });
    }, [applyView, clampScale]);

    // Al entrar en la vista previa, encuadrar. Y si la ventana cambia de tamaño
    // (girar el móvil, barra de direcciones que aparece) solo recolocamos: sería
    // molesto perder el zoom que el usuario acaba de hacer.
    useEffect(() => {
        if (viewMode !== 'print') return;
        // Si se salió de la vista con el dedo apoyado, no heredamos ese gesto.
        gestureRef.current = { pointers: new Map(), pinch: null, last: null };
        const frame = requestAnimationFrame(fitToScreen);
        const onResize = () => applyView(viewRef.current);
        window.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', onResize);
        };
    }, [viewMode, fitToScreen, applyView]);

    // La rueda hay que escucharla a mano: React registra onWheel como pasivo y
    // preventDefault() no surtiría efecto, así que la página entera haría scroll.
    useEffect(() => {
        if (viewMode !== 'print') return;
        const el = previewRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            const v = viewRef.current;
            if (e.ctrlKey) { // pellizco del trackpad o Ctrl+rueda
                const rect = el.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                const scale = clampScale(v.scale * (1 - e.deltaY / 300));
                applyView({
                    scale,
                    x: px - ((px - v.x) / v.scale) * scale,
                    y: py - ((py - v.y) / v.scale) * scale,
                });
            } else {
                applyView({ scale: v.scale, x: v.x - e.deltaX, y: v.y - e.deltaY });
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [viewMode, applyView, clampScale]);

    /** Fija el punto del documento que hay bajo los dos dedos: es el que no se moverá. */
    const startPinch = useCallback(() => {
        const g = gestureRef.current;
        const el = previewRef.current;
        if (!el || g.pointers.size < 2) return;
        const [a, b] = [...g.pointers.values()];
        const rect = el.getBoundingClientRect();
        const midX = (a.x + b.x) / 2 - rect.left;
        const midY = (a.y + b.y) / 2 - rect.top;
        const v = viewRef.current;
        g.pinch = {
            dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
            scale: v.scale,
            docX: (midX - v.x) / v.scale,
            docY: (midY - v.y) / v.scale,
        };
        g.last = null;
    }, []);

    const handlePointerDown = useCallback((e) => {
        const g = gestureRef.current;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (g.pointers.size >= 2) startPinch();
        else g.last = { x: e.clientX, y: e.clientY };
    }, [startPinch]);

    const handlePointerMove = useCallback((e) => {
        const g = gestureRef.current;
        if (!g.pointers.has(e.pointerId)) return;
        g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const v = viewRef.current;

        if (g.pinch && g.pointers.size >= 2) {
            const el = previewRef.current;
            const [a, b] = [...g.pointers.values()];
            const rect = el.getBoundingClientRect();
            const midX = (a.x + b.x) / 2 - rect.left;
            const midY = (a.y + b.y) / 2 - rect.top;
            const scale = clampScale(g.pinch.scale * (Math.hypot(b.x - a.x, b.y - a.y) / g.pinch.dist));
            // Mover los dos dedos a la vez también desplaza: el punto anclado
            // sigue al punto medio.
            applyView({ scale, x: midX - g.pinch.docX * scale, y: midY - g.pinch.docY * scale });
        } else if (g.last) {
            applyView({ scale: v.scale, x: v.x + (e.clientX - g.last.x), y: v.y + (e.clientY - g.last.y) });
            g.last = { x: e.clientX, y: e.clientY };
        }
    }, [applyView, clampScale]);

    const handlePointerUp = useCallback((e) => {
        const g = gestureRef.current;
        g.pointers.delete(e.pointerId);
        g.pinch = null;
        // Si levantar un dedo deja otro apoyado, se sigue arrastrando con ese.
        const remaining = [...g.pointers.values()][0];
        g.last = remaining ? { x: remaining.x, y: remaining.y } : null;
        if (g.pointers.size >= 2) startPinch();
    }, [startPinch]);

    /**
     * Genera el PDF del presupuesto y lo entrega al cliente en un solo paso:
     * en móvil abre el menú nativo (WhatsApp, email...), y en escritorio
     * descarga el PDF y abre WhatsApp con el mensaje ya escrito.
     */
    const handleSendQuote = useCallback(async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const { generateQuotePdfBlob, shareQuotePdf, buildQuoteFilename, buildQuoteMessage } =
                await import('../../utils/quoteSharing');

            const blob = await generateQuotePdfBlob(printableDocRef.current);
            const filename = buildQuoteFilename({
                docType,
                number: quoteMeta.number,
                clientName: client.name,
            });
            const message = buildQuoteMessage({
                docType,
                number: quoteMeta.number,
                clientName: client.name,
                total: formatCurrency(grandTotal),
                businessName: config.name,
            });

            const result = await shareQuotePdf({ blob, filename, message, phone: client.phone });

            if (result.cancelled) return;
            // El "momento aha": el presupuesto llega al cliente. Es el evento que de
            // verdad indica que el producto cumple su promesa.
            track(EVENTS.PRESUPUESTO_ENVIADO, { via: result.method });
            toast(
                result.method === 'share'
                    ? '¡Presupuesto enviado!'
                    : 'PDF descargado. Adjúntalo en WhatsApp para enviarlo.',
                'success'
            );
        } catch (err) {
            console.error('Error al enviar el presupuesto:', err);
            toast('No se pudo generar el PDF. Inténtalo de nuevo.', 'error');
        } finally {
            setIsSharing(false);
        }
    }, [isSharing, printableDocRef, docType, quoteMeta.number, client.name, client.phone, grandTotal, config.name, toast]);

    /**
     * "Finalizar" lleva al documento imprimible, que es el paso previo a
     * entregarlo. Como el carrito solo vive en memoria, salir de aquí sin
     * guardar perdía el presupuesto entero; por eso se guarda solo, salvo que
     * el usuario lo desactive en Configuración.
     *
     * Si falta el cliente o el carrito está vacío NO se guarda ni se avisa de
     * nada: en ese caso solo se está echando un vistazo al documento, y saltar
     * con un error sería ruido.
     */
    const handleFinalize = useCallback(() => {
        if (config.autoSaveOnFinish !== false && client.name && cart.length > 0) {
            handleSave();
        }
        // El guardado ya ha ocurrido (onSave es síncrono); estos temporizadores
        // solo animaban el botón, que dejamos limpio para cuando se vuelva.
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        setSaveStatus('idle');
        setViewMode('print');
    }, [config.autoSaveOnFinish, client.name, cart.length, handleSave, saveTimeoutRef, idleTimeoutRef, setSaveStatus]);

    if (viewMode === 'print') return (
        <div className={`fixed inset-0 z-[100] bg-slate-100 flex flex-col h-safe-screen w-full fixed-print-view smooth-scroll`}>
            {/* Barra superior REAL, no flotante: cuando las pestañas y el zoom
                iban en absolute tapaban la cabecera del documento en móvil, que
                es justo la parte que el usuario quiere enseñar al cliente. */}
            <div className="shrink-0 z-50 bg-white border-b border-slate-200 px-2 py-1.5 flex items-center justify-between gap-2 no-print">
                <div className="flex bg-slate-100 rounded-lg p-1 doc-type-switch">
                    <button onClick={() => setDocType('quote')} className={`px-3 md:px-4 py-2 text-[11px] md:text-xs font-bold rounded-md transition-all ${docType === 'quote' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}>PRESUPUESTO</button>
                    <button onClick={() => setDocType('invoice')} className={`px-3 md:px-4 py-2 text-[11px] md:text-xs font-bold rounded-md transition-all ${docType === 'invoice' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}>FACTURA</button>
                </div>
                <div className="zoom-controls flex items-center gap-1 bg-slate-100 rounded-full p-1">
                    <button onClick={() => zoomBy(1 / 1.2)} title="Alejar" className="p-2 text-slate-600 hover:text-blue-600 touch-sm w-10 h-10 flex items-center justify-center"><ZoomOut size={20} /></button>
                    <button onClick={fitToScreen} title="Ajustar a la pantalla" className="text-xs font-bold w-11 text-center text-slate-600 hover:text-blue-600 touch-sm h-10">{Math.round(view.scale * 100)}%</button>
                    <button onClick={() => zoomBy(1.2)} title="Acercar" className="p-2 text-slate-600 hover:text-blue-600 touch-sm w-10 h-10 flex items-center justify-center"><ZoomIn size={20} /></button>
                </div>
            </div>
            {/* touch-action:none es imprescindible: sin él el navegador se queda
                el gesto para hacer scroll y nunca llegan los "pointermove". */}
            <div
                ref={previewRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'none' }}
                className="relative flex-1 min-h-0 overflow-hidden select-none bg-slate-200 cursor-grab active:cursor-grabbing print:overflow-visible print:bg-white"
            >
                <div className="print-scale-wrapper absolute top-0 left-0 origin-top-left will-change-transform" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}>
                    <div ref={printableDocRef} className="w-[210mm] min-w-[210mm] min-h-[297mm] bg-white print-container shadow-2xl p-[15mm] text-sm relative">
                        <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: config.color }}><div>{config.logo ? <img src={config.logo} className="h-16 mb-4 object-contain" /> : <h1 className="text-4xl font-black mb-2" style={{ color: config.color }}>{config.name}</h1>}<div className="text-xs text-slate-500 space-y-1"><p>{config.address}</p>{config.cif && <p>CIF/NIF: {config.cif}</p>}<p>{config.phone} • {config.email}</p><p>{config.website}</p></div></div><div className="text-right"><h2 className="text-4xl font-black tracking-tight text-slate-800 mb-2">{docType === 'invoice' ? 'FACTURA' : 'PRESUPUESTO'}</h2><div className="flex flex-col items-end my-2"><span className="text-lg font-bold text-slate-600">#{quoteMeta.number}</span><span className="text-sm text-slate-400">{quoteMeta.date}</span></div><div className="mt-4 text-left bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-[250px]"><p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Facturar a</p><p className="font-bold text-slate-800 text-lg leading-none mb-1">{client.name}</p><p className="text-sm text-slate-600">{client.phone}</p><p className="text-sm text-slate-600">{client.address}</p></div></div></div>
                        <table className="w-full mb-8"><thead><tr className="border-b-2 text-xs uppercase text-slate-500 font-bold tracking-wider"><th className="text-left py-3 pl-2">Concepto</th><th className="text-center py-3">Medidas</th><th className="text-center py-3">Cant.</th><th className="text-right py-3 pr-2">Total</th></tr></thead><tbody>{cart.map(i => (<tr key={i.id} className="avoid-break border-b border-slate-100 last:border-0"><td className="py-4 pl-2"><div className="flex items-start gap-4">{i.product.image && <img src={i.product.image} className="w-16 h-16 object-cover rounded-lg border border-slate-200 print-visible" />}<div><p className="font-bold text-slate-800 text-base">{i.product.name}</p><p className="text-xs text-slate-500 mt-1">{i.product.category} {i.locationLabel && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-1">{i.locationLabel}</span>}</p>{i.selectedExtras?.length > 0 && <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-1">{i.selectedExtras.map(e => <span className="bg-slate-50 px-1 border border-slate-200 rounded">+{e.qty > 1 ? e.qty + 'x ' : ''}{e.name}</span>)}</div>}</div></div></td><td className="text-center text-sm py-4 text-slate-600 font-medium">{i.width} x {i.height}</td><td className="text-center font-bold text-slate-800 py-4">{i.quantity}</td><td className="text-right font-bold text-slate-800 py-4 pr-2">{formatCurrency(i.price)}</td></tr>))}</tbody></table>
                        <div className="flex justify-end avoid-break"><div className="w-80 space-y-2">
                            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-medium">{formatCurrency(grossTotal)}</span></div>
                            {financials.discountPercent > 0 && <div className="flex justify-between text-sm font-bold text-emerald-600"><span>Descuento ({financials.discountPercent}%)</span><span>-{formatCurrency(discountAmount)}</span></div>}
                            {financials.discountPercent > 0 && <div className="flex justify-between text-sm text-slate-600 pb-2 border-b border-dashed"><span>Base imponible</span><span className="font-medium">{formatCurrency(netTotal)}</span></div>}
                            <div className="flex justify-between text-sm text-slate-600 pb-3 border-b"><span>IVA ({vatRate}%)</span><span className="font-medium">{formatCurrency(netTotal * (vatRate / 100))}</span></div>
                            <div className="flex justify-between text-3xl font-black bg-slate-50 p-2 rounded-lg -mx-2" style={{ color: config.color }}><span>TOTAL</span><span>{formatCurrency(grandTotal)}</span></div>
                            {financials.deposit > 0 && <div className="flex justify-between text-sm font-bold text-slate-500 pt-2 border-t border-dashed mt-1"><span>Entrega a cuenta</span><span>-{formatCurrency(financials.deposit)}</span></div>}
                            {financials.deposit > 0 && <div className="flex justify-between font-black text-lg border-t pt-2"><span>PENDIENTE</span><span>{formatCurrency(remainingBalance)}</span></div>}
                        </div></div>
                        <div className="mt-12 pt-6 border-t-2 border-slate-100 text-[10px] text-slate-500 grid grid-cols-2 gap-12"><div><b className="block mb-2 text-slate-800 uppercase tracking-wider">Método de Pago</b><div className="p-3 bg-slate-50 rounded border">{config.bankAccount || 'Consultar'}</div></div><div><b className="block mb-2 text-slate-800 uppercase tracking-wider">Términos y Condiciones</b><p style={{ whiteSpace: 'pre-line' }} className="leading-relaxed">{config.legalText}</p></div></div>
                    </div>
                </div>
            </div>
            <div className="shrink-0 bg-white border-t no-print z-50 p-3 md:p-4 shadow-2xl pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
                <div className="flex gap-2 md:gap-3 items-center max-w-2xl mx-auto">
                    <button onClick={() => setViewMode('edit')} title="Seguir editando" className="shrink-0 h-12 w-12 md:w-auto md:px-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 font-bold text-slate-600 flex items-center justify-center gap-2">
                        <ArrowLeft size={18} /><span className="hidden md:inline">Editar</span>
                    </button>
                    <button onClick={handlePrintPDF} title="Imprimir" className="shrink-0 h-12 w-12 md:w-auto md:px-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 font-bold text-slate-600 flex items-center justify-center gap-2">
                        <Printer size={18} /><span className="hidden md:inline">Imprimir</span>
                    </button>
                    {/* Acción principal: entregar el presupuesto al cliente en el momento */}
                    <button onClick={handleSendQuote} disabled={isSharing} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white font-black shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors">
                        {isSharing
                            ? <><Loader2 size={20} className="animate-spin" /> <span>Generando PDF...</span></>
                            : <><Share2 size={20} /> <span>Enviar al cliente</span></>}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col md:flex-row h-full overflow-hidden ${className} app-tab`}>
            <div className="md:hidden flex bg-slate-100 dark:bg-slate-950 border-b dark:border-slate-800 shadow-md z-30 shrink-0 relative"><div className="absolute bottom-0 left-0 w-1/2 h-1 bg-blue-600 transition-transform duration-300" style={{ transform: mobileTab === 'cart' ? 'translateX(100%)' : 'translateX(0)' }}></div><button onClick={() => setMobileTab('products')} className={`flex-1 py-4 text-sm font-black transition-colors min-h-[56px] ${mobileTab === 'products' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>CATÁLOGO</button><button onClick={() => setMobileTab('cart')} className={`flex-1 py-4 text-sm font-black flex items-center justify-center gap-2 transition-colors min-h-[56px] ${mobileTab === 'cart' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>PRESUPUESTO <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${mobileTab === 'cart' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{cart.length}</span></button></div>
            <div className={`${mobileTab === 'products' ? 'block' : 'hidden'} md:block w-full md:w-2/3 p-3 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3 md:gap-4">
                    <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">Confeccionar</h2>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex-1 md:flex-none flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border dark:border-slate-700 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">REF</span>
                                <input className="bg-transparent text-sm font-bold w-full md:w-20 outline-none dark:text-slate-100" value={quoteMeta.number} onChange={e => setQuoteMeta({ ...quoteMeta, number: e.target.value })} />
                            </div>
                            <div className="flex-1 md:flex-none flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border dark:border-slate-700 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">FECHA</span>
                                <input className="bg-transparent text-sm font-bold w-full md:w-24 outline-none dark:text-slate-100" value={quoteMeta.date} onChange={e => setQuoteMeta({ ...quoteMeta, date: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLocalReset} className="w-full md:w-auto justify-center text-xs flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900/40 font-bold">
                        <RefreshCw size={14} /> Limpiar Todo
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-0 mb-4 md:mb-6 overflow-hidden relative z-20 w-full">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-b dark:border-slate-700 rounded-t-xl flex justify-between items-center gap-2">
                        <div onClick={() => setShowClientForm(v => !v)} className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                            <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform duration-200 ${showClientForm ? 'rotate-180' : ''}`} />
                            <div className="min-w-0">
                                <span className="block text-[10px] md:text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Datos del Cliente</span>
                                {!showClientForm && (client.name || client.phone) && <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{client.name || 'Sin nombre'}{client.phone ? ` · ${client.phone}` : ''}</span>}
                                {!showClientForm && !client.name && !client.phone && <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-medium">Toca para añadir (opcional)</span>}
                            </div>
                        </div>
                        <button onClick={() => { setShowClientSearch(!showClientSearch); setShowClientForm(true); }} className="shrink-0 py-1.5 px-3 text-xs flex items-center gap-2 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold"><Search size={14} /> Buscar</button>
                    </div>
                    {showClientForm && <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 animate-fade-in">
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1 text-[10px] font-bold text-blue-500">Nombre</label><input className="input-saas w-full" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} /></div>
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1 text-[10px] font-bold text-slate-400">Teléfono</label><input className="input-saas w-full" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} /></div>
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1 text-[10px] font-bold text-slate-400">Email</label><input className="input-saas w-full" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} /></div>
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1 text-[10px] font-bold text-slate-400">Origen</label><select className="input-saas w-full bg-white dark:bg-slate-900" value={client.source} onChange={e => setClient({ ...client, source: e.target.value })}><option value="">¿Cómo nos conoció?</option><option value="Recomendación">Recomendación</option><option value="Web">Web / Buscador</option><option value="Google">Google Maps</option><option value="Publicidad">Publicidad / Redes</option><option value="Tienda">Pasaba por tienda</option><option value="Otro">Otro</option></select></div>
                        <div className="relative group sm:col-span-2"><label className="absolute -top-2 left-2 bg-white dark:bg-slate-800 px-1 text-[10px] font-bold text-slate-400">Dirección</label><input className="input-saas w-full" value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} /></div>
                    </div>}
                    {showClientSearch && <div className="absolute top-12 left-2 right-2 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl dark:shadow-black/60 z-[100] rounded-xl max-h-60 overflow-hidden flex flex-col animate-fade-in"><div className="p-2 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><input autoFocus placeholder="Filtrar por nombre o teléfono..." className="input-saas text-xs !p-2 w-full" value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} /></div><div className="overflow-y-auto">{filteredClients.length === 0 && <p className="text-xs p-4 text-center text-slate-400">No hay clientes recientes.</p>}{filteredClients.map((c, i) => (<div key={i} onClick={() => { setClient({ ...c }); setShowClientSearch(false); setClientSearchTerm(''); setShowClientForm(true); }} className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b dark:border-slate-700 last:border-0 text-sm flex justify-between group"><span className="font-bold group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-400">{c.name}</span><span className="text-slate-500 dark:text-slate-400">{c.phone}</span></div>))}</div></div>}
                </div>
                {!selectedProduct ? (
                    <div className="animate-fade-in">
                        <div className="mb-4 md:mb-6 flex flex-col gap-3 md:gap-4">
                            <div className="relative group w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} /><input className="input-saas pl-10 w-full h-12" placeholder="Buscar producto..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} /></div>
                            <div className="flex flex-wrap gap-2 pb-2 w-full">
                                {['Todas', ...categories].map(c => <button key={c} onClick={() => setFilterCategory(c)} className={`px-4 py-2 rounded-lg whitespace-nowrap text-[13px] md:text-sm font-bold transition-all border ${filterCategory === c ? 'bg-slate-800 dark:bg-slate-600 text-white shadow-md border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600'}`}>{c}</button>)}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">{products.filter(p => (filterCategory === 'Todas' || p.category === filterCategory) && p.name.toLowerCase().includes(filterTerm.toLowerCase())).map((p) => {
                            const originalIndex = products.findIndex(prod => prod.id === p.id);
                            const isLocked = !isPro && originalIndex >= 3;

                            return (
                                <div key={p.id} onClick={() => isLocked ? onUpgrade("Este producto es parte de tu historial PRO. Reactiva tu suscripción para desbloquearlo y usarlo.") : setSelectedProduct(p)} className={`group bg-white dark:bg-slate-900 rounded-2xl border ${isLocked ? 'border-slate-200 dark:border-slate-800 opacity-60 cursor-pointer grayscale' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-black/60 hover:-translate-y-1 cursor-pointer'} overflow-hidden transition-all duration-300 relative`}>
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative w-full overflow-hidden">
                                        {p.image ? <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600"><Box size={48} strokeWidth={1.5} /></div>}
                                        {isLocked ? (
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                <div className="bg-white/95 dark:bg-slate-900/95 p-4 rounded-full shadow-2xl backdrop-blur-md transform group-hover:scale-110 transition-transform">
                                                    <Lock size={24} className="text-slate-400 dark:text-slate-500" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                                <span className="text-white font-black text-sm uppercase tracking-widest bg-blue-600/90 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center gap-2"><Plus size={16} strokeWidth={3} /> SELECCIONAR</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 md:p-5 bg-white dark:bg-slate-900">
                                        <h3 className="font-black text-[15px] text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{p.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">{p.category}</p>
                                            {isLocked && <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 shadow-inner">PRO</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}</div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-0 animate-slide-up overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b dark:border-slate-700 flex justify-between items-center"><button onClick={() => setSelectedProduct(null)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"><ArrowLeft className="mr-1" size={16} /> VOLVER</button><h3 className="font-bold text-lg dark:text-slate-100">{selectedProduct.name}</h3><div className="w-20"></div></div>
                        <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-700/50 p-4 md:p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">{selectedProduct.image ? <img src={selectedProduct.image} className="max-h-32 md:max-h-48 rounded-lg shadow-lg rotate-1 hover:rotate-0 transition-transform" /> : <Box size={48} className="text-slate-300 dark:text-slate-500" />}</div>
                            <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">{['matrix', 'simple_area', 'simple_linear'].includes(selectedProduct.priceType) && <><div className="flex flex-col"><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ANCHO (mm)</label><input type="number" className="input-saas h-11 md:h-12 text-base md:text-lg text-right font-bold w-full" value={dims.w || ''} onChange={e => setDims({ ...dims, w: parseInt(e.target.value) || 0 })} /></div><div className="flex flex-col"><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ALTO (mm)</label><input type="number" className="input-saas h-11 md:h-12 text-base md:text-lg text-right font-bold w-full" value={dims.h || ''} onChange={e => setDims({ ...dims, h: parseInt(e.target.value) || 0 })} /></div></>}<div className="flex flex-col"><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">CANTIDAD</label><input type="number" className="input-saas h-11 md:h-12 text-base md:text-lg text-right font-bold w-full" value={dims.q || ''} onChange={e => setDims({ ...dims, q: parseInt(e.target.value) || 1 })} /></div><div className="col-span-2 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">UBICACIÓN</label><input placeholder="Ej: Salón principal..." className="input-saas h-11 md:h-12 w-full" value={locationLabel} onChange={e => setLocationLabel(e.target.value)} /></div></div>
                                <div className="space-y-3 pt-4 border-t dark:border-slate-700"><h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Personalización</h4>{selectedProduct.extras.map(e => e.type === 'selection' ? (<select key={e.id} className="input-saas h-12 bg-white dark:bg-slate-900" onChange={ev => setDropdownSelections({ ...dropdownSelections, [e.id]: ev.target.value })}><option>Seleccionar {e.name}</option>{e.optionsList.map((o, i) => <option key={i} value={i}>{o.name} (+{o.value}{o.type === 'percent' ? '%' : (o.type === 'linear' ? '€/ml' : (o.type === 'area' ? '€/m²' : '€'))})</option>)}</select>) : (<div key={e.id} onClick={() => toggleExtra(e)} className={`w-full p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${selectedExtras.find(x => x.id === e.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-700'}`}><div className="flex-1"><span className={`font-bold ${selectedExtras.find(x => x.id === e.id) ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{e.name}</span><span className="text-xs ml-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border dark:border-slate-600">+{e.value}{e.type === 'percent' ? '%' : (e.type === 'linear' ? '€/ml' : (e.type === 'area' ? '€/m²' : '€'))}</span></div>{selectedExtras.find(x => x.id === e.id) ? <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 ml-2 bg-white dark:bg-slate-700 rounded-lg border dark:border-slate-600 shadow-sm p-1"><button onClick={() => updateExtraQty(e.id, -1)} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-600 font-bold">-</button><span className="text-sm w-6 text-center font-bold dark:text-slate-200">{selectedExtras.find(x => x.id === e.id).qty}</span><button onClick={() => updateExtraQty(e.id, 1)} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-600 font-bold">+</button></div> : <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>}</div>))}</div>
                                {validationError && (
                                    <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800 text-sm font-bold mt-4 flex items-center justify-center gap-2">
                                        <Ban size={18} /> {validationError}
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row justify-between md:items-center pt-5 md:pt-6 border-t dark:border-slate-700/50 gap-4 mt-auto">
                                    <div className="flex flex-col items-center md:items-start bg-slate-50 dark:bg-slate-900/50 p-3 md:p-0 rounded-xl md:bg-transparent">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Precio Final</span>
                                        <span className="text-3xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">{calculatedPrice !== null ? formatCurrency(calculatedPrice) : '--'}</span>
                                    </div>
                                    <button onClick={addToQuote} disabled={!calculatedPrice || validationError} className={`btn-primary w-full md:w-auto px-6 md:px-8 py-3.5 md:py-4 text-base md:text-lg font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 min-h-[50px] md:min-h-[56px] ${calculatedPrice && !validationError ? 'opacity-100 hover:scale-[1.02]' : 'opacity-50 grayscale cursor-not-allowed'}`}>
                                        <span className="flex items-center justify-center gap-2"><Plus size={20} strokeWidth={3} />AÑADIR</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* flex-1 min-h-0 (no h-full): en móvil este panel es hermano de la barra
                CATÁLOGO/PRESUPUESTO, que también ocupa alto real. h-full forzaba el 100%
                del contenedor entero por encima de esa barra, desbordando por debajo y
                tapando "Guardar" bajo la nav inferior. flex-1 min-h-0 hace que ocupe
                exactamente el espacio que sobra, sin ambigüedad. */}
            <div className={`${mobileTab === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 bg-white dark:bg-slate-900 md:border-l dark:border-slate-700 shadow-2xl flex-col z-20 flex-1 min-h-0 md:h-full`}>
                <div className="p-5 border-b dark:border-slate-700 font-bold flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <span className="text-lg dark:text-slate-100">Tu Presupuesto</span>
                    <div className="flex gap-2">
                        <StatusSelector
                            currentStatus={quoteMeta.status || 'pending'}
                            onStatusChange={(status) => setQuoteMeta({ ...quoteMeta, status })}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/80 space-y-2">
                    {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 opacity-50"><Calculator size={64} strokeWidth={1} /><p className="mt-4 font-medium">Carrito vacío</p></div>}
                    {cart.map((i, idx) => (<CartSummaryItem key={i.id} item={i} idx={idx} onRemove={removeFromCart} onUpdateQty={updateQuantity} onMove={moveCartItem} />))}
                    {/* Desglose de precios: vive en la zona con scroll (junto a los productos) para que
                        los botones de acción de abajo queden siempre visibles, aunque haya muchos ítems
                        o el desglose se despliegue entero. Antes competían por el mismo espacio fijo y
                        "Guardar" quedaba tapado por la barra de navegación inferior. */}
                    {cart.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mt-2">
                            <button
                                onClick={() => setShowAdjustments(v => !v)}
                                className="w-full flex items-center justify-between gap-2 py-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                                    <Percent size={14} /> Descuento y entrega
                                    {(financials.discountPercent > 0 || financials.deposit > 0) && (
                                        <span className="normal-case tracking-normal text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                            {financials.discountPercent > 0 && `-${financials.discountPercent}%`}
                                            {financials.discountPercent > 0 && financials.deposit > 0 && ' · '}
                                            {financials.deposit > 0 && `${formatCurrency(financials.deposit)}`}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${showAdjustments ? 'rotate-180' : ''}`} />
                            </button>
                            {showAdjustments && (
                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-xs animate-fade-in pb-1">
                                    <div>
                                        <label className="text-slate-400 dark:text-slate-500 font-bold block mb-1 uppercase tracking-tighter">Descuento %</label>
                                        <input type="number" className="input-saas text-right font-bold" value={financials.discountPercent} onChange={e => setFinancials({ ...financials, discountPercent: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <label className="text-slate-400 dark:text-slate-500 font-bold block mb-1 uppercase tracking-tighter">Entrega €</label>
                                        <input type="number" className="input-saas text-right font-bold" value={financials.deposit} onChange={e => setFinancials({ ...financials, deposit: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5 py-3 border-t border-dashed dark:border-slate-700">
                                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                    <span>Subtotal</span><span className="font-medium">{formatCurrency(grossTotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <span>Descuento ({financials.discountPercent}%)</span><span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 pb-1 border-b border-dashed dark:border-slate-700">
                                        <span>Base imponible</span><span className="font-medium">{formatCurrency(netTotal)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 pb-2 border-b dark:border-slate-700">
                                    <span className="flex items-center gap-1">IVA <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">{vatRate}%</span></span>
                                    <span className="font-medium">{formatCurrency(netTotal * (vatRate / 100))}</span>
                                </div>
                                <div className="flex justify-between text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight pt-1">
                                    <span>TOTAL</span><span>{formatCurrency(grandTotal)}</span>
                                </div>
                                {financials.deposit > 0 && (
                                    <div className="flex justify-between text-sm font-semibold text-slate-400 dark:text-slate-500 pt-2 border-t border-dashed dark:border-slate-700 mt-1">
                                        <span>Entrega a cuenta</span><span>-{formatCurrency(financials.deposit)}</span>
                                    </div>
                                )}
                                {financials.deposit > 0 && (
                                    <div className="flex justify-between font-black text-base text-blue-600 dark:text-blue-400">
                                        <span>RESTANTE</span><span>{formatCurrency(remainingBalance)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-900 border-t dark:border-slate-700 p-3 md:p-4 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-30 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
                {/* Fila siempre en horizontal (nunca apilada): en móvil, dos botones altos
                    apilados hacían que este pie no cupiera en el espacio disponible y
                    "Guardar" quedaba tapado por la barra de navegación inferior. */}
                <div className="flex gap-2 md:gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            style={
                                saveStatus === 'saved'
                                    ? { backgroundColor: '#10b981', color: '#ffffff' }
                                    : saveStatus === 'saving'
                                        ? { backgroundColor: '#93c5fd', color: '#1e40af' }
                                        : { backgroundColor: '#ffffff', color: '#1f2937', border: '2px solid #e5e7eb' }
                            }
                            className="flex-1 h-12 md:h-14 rounded-lg font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-md"
                        >
                            {saveStatus === 'saving' ? (
                                <React.Fragment key="btn-saving">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Guardando...</span>
                                </React.Fragment>
                            ) : saveStatus === 'saved' ? (
                                <React.Fragment key="btn-saved">
                                    <Check size={22} strokeWidth={3} />
                                    <span className="font-black tracking-wide">¡GUARDADO!</span>
                                </React.Fragment>
                            ) : (
                                <React.Fragment key="btn-idle">
                                    <Save size={20} />
                                    <span>Guardar</span>
                                </React.Fragment>
                            )}
                        </button>
                        <button onClick={handleFinalize} style={{ backgroundColor: '#3b82f6', color: '#ffffff' }} className="flex-1 h-12 md:h-14 rounded-lg font-black text-sm md:text-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl shadow-md"><Printer size={20} className="shrink-0" /> <span>FINALIZAR</span></button>
                    </div></div>
            </div>
        </div>
    );
};

export default QuoteConfigurator;
