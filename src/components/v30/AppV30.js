'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ToastProvider, useToast } from '../../context/ToastContext';
import { LayoutDashboard, ShoppingCart, Archive, Settings, LogOut, Users, Cloud, CloudOff, RefreshCw, Loader2, Calculator, Crown, Bot } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useSyncEngine } from '../../hooks/useSyncEngine';
import { clientKey } from '../../utils/clientKey';

import Dashboard from './Dashboard';
import QuoteConfigurator from './QuoteConfigurator';
import ProductManager from './ProductManager';
import ClientManager from './ClientManager';
import SysConfig from './SysConfig';
import AgentChat from './AgentChat';
import UpgradeModal from '../UpgradeModal';
import VerificationPending from '../VerificationPending';

/**
 * Momento desde el que cuenta la caducidad de un presupuesto pendiente.
 * Preferimos el último cambio de estado manual (statusChangedAt): si el
 * usuario devuelve un presupuesto viejo a "pendiente" a propósito, el
 * contador se reinicia en vez de re-rechazárselo al instante. Si no lo hay,
 * la creación: el id ES un timestamp; y como red de seguridad, la fecha
 * impresa (dd/mm/aaaa).
 */
const quoteClockStart = (q) => {
    if (q.statusChangedAt) return q.statusChangedAt;
    const fromId = Number(q.id);
    if (Number.isFinite(fromId) && fromId > 0) return fromId;
    const [d, m, y] = String(q.date || '').split('/').map(Number);
    const fromDate = new Date(y, (m || 1) - 1, d || 1).getTime();
    return Number.isFinite(fromDate) ? fromDate : Date.now();
};

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-center bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-black mb-4">¡Ups! Algo salió mal.</h1>
                    <p className="mb-4">Se ha producido un error inesperado en la aplicación.</p>
                    <pre className="text-xs bg-red-100 p-4 rounded text-left overflow-auto max-w-2xl mb-6 border border-red-200 shadow-inner">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold shadow-lg hover:bg-red-700 transition-colors">
                        Recargar Aplicación
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const AppContent = ({ onLogout, isPro, user, isImpersonating, subscription }) => {
    const toast = useToast();
    const [view, setView] = useState('dashboard'); // dashboard, quote, prods, clients, config
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState(null);
    const [showAgent, setShowAgent] = useState(false);

    // El chat del agente es función PRO: a los demás se les enseña el porqué.
    const handleOpenAgent = () => {
        if (isPro) setShowAgent(true);
        else {
            setUpgradeMessage('El Agente IA es una función del plan PRO: consulta, calcula y crea presupuestos por chat o dictando por voz.');
            setShowUpgradeModal(true);
        }
    };

    // GATE: Email Verification
    // Google Auth users usually have emailVerified: true automatically.
    // We bypass this check if isImpersonating (admin viewing user data).
    if (user && !user.emailVerified && !isImpersonating) {
        return <VerificationPending user={user} onVerified={() => window.location.reload()} onLogout={onLogout} />;
    }

    // 🚀 SYNC ENGINE INTEGRATION
    const {
        status, // IDLE, LOADING, READY, SAVING, ERROR
        error: syncError,
        products, setProducts,
        categories, setCategories,
        config, setConfig,
        history, setHistory,
        deletedHistory, setDeletedHistory,
        clients, setClients
    } = useSyncEngine(user);

    // Map Sync Engine Status to UI Cloud Status
    const cloudStatus = status === 'SAVING' ? 'syncing' : (status === 'READY' ? 'idle' : (status === 'ERROR' ? 'error' : 'idle'));
    const cloudError = syncError;

    /**
     * Guarda (o actualiza) la ficha de un cliente. Se llama al crear un
     * presupuesto y también al borrarlo: así la ficha sobrevive aunque se
     * quede sin presupuestos, y solo desaparece si se elimina a propósito.
     */
    const upsertClient = (cliente) => {
        if (!cliente || !clientKey(cliente)) return;
        setClients(prev => {
            const k = clientKey(cliente);
            const i = prev.findIndex(c => clientKey(c) === k);
            if (i === -1) return [...prev, cliente];
            // Datos de contacto más recientes, sin perder lo que ya hubiera.
            const next = [...prev];
            next[i] = { ...prev[i], ...cliente };
            return next;
        });
    };

    // Temp state for editing
    const [editQuoteData, setEditQuoteData] = useState(null);
    const [cart, setCart] = useState([]);

    // Scroll Reset on View Change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);

    // Caducidad automática: los pendientes que llevan demasiado tiempo sin
    // respuesta pasan a rechazado, si el usuario activó la opción en
    // Configuración. Corre al cargar y cuando cambian datos; el guardado lo
    // hace el motor de sincronización (solo escribe los que cambian).
    useEffect(() => {
        if (status !== 'READY' || config.autoRejectEnabled !== true) return;
        const days = Math.max(1, Number(config.autoRejectDays) || 30);
        const cutoff = Date.now() - days * 86400000;
        const isStalePending = (q) => (!q.status || q.status === 'pending') && quoteClockStart(q) < cutoff;

        const staleCount = history.filter(isStalePending).length;
        if (staleCount === 0) return;

        setHistory(h => h.map(q => isStalePending(q)
            ? {
                ...q,
                status: 'rejected',
                // Registrar la intención: esto lo hizo la caducidad automática,
                // no una decisión del usuario. Sin esta marca, un rechazo
                // automático y uno manual serían indistinguibles para siempre.
                autoRejected: true,
                autoRejectedAt: new Date().toISOString(),
                statusChangedAt: Date.now(),
            }
            : q));
        toast(
            staleCount === 1
                ? `1 presupuesto pendiente pasó a rechazado por llevar más de ${days} días sin respuesta`
                : `${staleCount} presupuestos pendientes pasaron a rechazado por llevar más de ${days} días sin respuesta`,
            'info'
        );
    }, [status, config.autoRejectEnabled, config.autoRejectDays, history, setHistory, toast]);

    // ✨ LOADING STATE (Full Screen)
    if (status === 'LOADING') {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
                <p className="font-bold text-lg animate-pulse">Sincronizando datos...</p>
                <p className="text-xs mt-2">Recuperando tu espacio de trabajo</p>
            </div>
        );
    }

    const handleSaveQuote = (rawQuote) => {
        // Guardar es actividad: reinicia el reloj de la caducidad automática.
        // Sin esto, editar un pendiente antiguo no impediría que se rechazara
        // solo justo después, con el usuario aún trabajando en él.
        const quote = { ...rawQuote, statusChangedAt: Date.now() };
        const exists = history.find(q => q.id === quote.id);
        if (exists) {
            setHistory(history.map(q => q.id === quote.id ? quote : q));
        } else {
            setHistory([quote, ...history]);
        }
        // La ficha del cliente se guarda aparte del presupuesto.
        upsertClient(quote.client);
        // Keep user in editor with updated data
        setEditQuoteData(quote);
        toast("Presupuesto guardado correctamente", "success");
    };

    const handleNavigate = (data, targetView) => {
        if (targetView) {
            setView(targetView);
            if (targetView === 'quote') {
                setEditQuoteData(null);
                setCart([]);
            }
        } else if (data) {
            // Assume it's a quote to edit
            setEditQuoteData(data);
            setCart(data.items);
            setView('quote');
        }
    };

    const handleDeleteQuote = (quote) => {
        // La ficha del cliente se conserva aunque este fuera su último
        // presupuesto: nos aseguramos de que esté guardada antes de quitarlo.
        upsertClient(quote.client);
        setHistory(history.filter(q => q.id !== quote.id));
        setDeletedHistory([{ type: 'quote', data: quote, deletedAt: new Date().toISOString() }, ...deletedHistory]);
        toast("Presupuesto movido a papelera", "info");
    };

    const handleDeleteClient = (client) => {
        const k = clientKey(client);
        // Remove all quotes for this client
        const clientQuotes = history.filter(q => clientKey(q.client) === k);
        setHistory(history.filter(q => clientKey(q.client) !== k));
        // Y la ficha en sí: este es el ÚNICO sitio donde se borra un cliente.
        setClients(prev => prev.filter(c => clientKey(c) !== k));

        // Add to deleted as a single client block or individual quotes? Let's do client block
        setDeletedHistory([{ type: 'client', data: { ...client, quotes: clientQuotes }, deletedAt: new Date().toISOString() }, ...deletedHistory]);
        toast("Cliente y sus pedidos movidos a papelera", "info");
    };

    const handleRestore = (item) => {
        setDeletedHistory(deletedHistory.filter(d => d.deletedAt !== item.deletedAt));
        if (item.type === 'quote') {
            setHistory([item.data, ...history]);
            upsertClient(item.data.client);
        } else if (item.type === 'client') {
            setHistory([...(item.data.quotes || []), ...history]);
            // Se recupera la ficha, no solo sus presupuestos.
            const { quotes: _quotes, ...ficha } = item.data;
            upsertClient(ficha);
        }
        toast("Elemento restaurado", "success");
    };

    const handleImportClient = (clientData) => {
        // Generate a new reference number if one isn't provided (which is the case for "New Quote")
        const newRef = clientData.number || `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        setEditQuoteData({
            client: clientData,
            items: [],
            financials: { discountPercent: 0, deposit: 0 },
            number: newRef,
            status: 'pending',
            date: new Date().toLocaleDateString('es-ES')
        });
        setCart([]);
        setView('quote');
    };

    const canAddProduct = () => {
        if (isPro) return true;
        // Free tier limit: 3 products
        return products.length < 3;
    };

    // We need to pass the limit logic to ProductManager
    // or wrap the ProductManager's create action.

    const handleUpgrade = (targetVariantId) => {
        // Redirigir al checkout de Lemon Squeezy con el ID del usuario para el webhook
        // Default Variant ID: 1268029/cb60ae4e... (Plan PRO Monthly)
        // If targetVariantId is passed (e.g., Annual), use that instead.
        const defaultMonthlyId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID || 'cb60ae4e-ad08-496f-8e56-46d803e43f19';
        const finalVariantId = targetVariantId || defaultMonthlyId;

        const checkoutUrl = `https://tupresulisto.lemonsqueezy.com/checkout/buy/${finalVariantId}?checkout[custom][user_id]=${user.uid}`;
        window.open(checkoutUrl, '_blank');
        setShowUpgradeModal(false);
    };

    return (
        <div className="flex h-[100dvh] w-full bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 overflow-hidden relative isolate">
            {showAgent && <AgentChat user={user} onClose={() => setShowAgent(false)} />}
            {showUpgradeModal && (
                <UpgradeModal
                    onClose={() => { setShowUpgradeModal(false); setUpgradeMessage(null); }}
                    onUpgrade={handleUpgrade}
                    message={upgradeMessage}
                />
            )}

            {/* IMPERSONATION MODE BANNER */}
            {isImpersonating && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-white px-4 py-2 flex justify-center items-center gap-4 shadow-xl">
                    <span className="font-bold uppercase tracking-wider text-xs md:text-sm">⚠️ MODO ADMIN: Viendo como usuario {user.uid.slice(0, 6)}...</span>
                    <button onClick={() => window.close()} className="bg-white text-orange-600 px-3 py-1 rounded text-xs font-bold hover:bg-orange-50">Cerrar Pestaña</button>
                </div>
            )}

            {/* Global Connection Error Alert */}
            {cloudStatus === 'error' && (
                <div className="fixed bottom-20 md:bottom-4 right-4 z-[100] bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce-in flex flex-col items-start max-w-sm">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <CloudOff size={20} />
                        <span>Problemas de Conexión</span>
                    </div>
                    <p className="text-xs opacity-90 mb-3">Es posible que los cambios no se guarden. Comprueba tu internet.</p>
                    <button onClick={() => window.location.reload()} className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-neutral-100 transition-colors w-full">Recargar Aplicación</button>
                </div>
            )}

            {/* Aviso de prueba a punto de caducar.
                Es también el mejor momento para convertir: el usuario ya conoce
                el valor de PRO y aún lo está disfrutando. */}
            {subscription?.isTrial && subscription.isPro && subscription.daysLeft <= 7 && (
                <button
                    onClick={() => { setUpgradeMessage(`Tu prueba PRO termina en ${subscription.daysLeft} ${subscription.daysLeft === 1 ? 'día' : 'días'}. Sigue con todo desbloqueado.`); setShowUpgradeModal(true); }}
                    className="fixed top-14 md:top-0 left-0 right-0 z-[80] bg-amber-500 hover:bg-amber-600 text-white text-xs md:text-sm font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                    <Crown size={14} className="shrink-0" />
                    <span className="truncate">
                        {subscription.daysLeft === 1
                            ? 'Tu prueba PRO termina mañana'
                            : `Te quedan ${subscription.daysLeft} días de prueba PRO`}
                    </span>
                    <span className="underline underline-offset-2 shrink-0">Seguir con PRO</span>
                </button>
            )}

            {/* Mobile Header - Grado Industrial */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl z-[70] flex items-center justify-between px-4 shadow-xl shadow-black/10 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Calculator className="text-white" size={16} />
                    </div>
                    <span className="font-black text-lg text-white tracking-tight">tupresulisto<span className="text-blue-400">.com</span></span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleOpenAgent} aria-label="Abrir el Agente IA" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors">
                        <Bot size={20} />
                    </button>
                    <ThemeToggle className="dark:hover:bg-slate-800" />
                    <button onClick={onLogout} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all z-50 shadow-2xl dark:shadow-black/40 shrink-0 border-r border-slate-200 dark:border-slate-800">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Calculator className="text-white" size={20} />
                    </div>
                    <div>
                        <span className="font-black text-xl text-slate-800 dark:text-slate-100 hidden lg:block tracking-tight">tupresulisto<span className="text-blue-500">.com</span></span>
                        {cloudStatus === 'error' && (
                            <div className="hidden lg:flex items-center gap-1.5 mt-1 animate-pulse">
                                <CloudOff size={10} className="text-red-400" />
                                <span className="text-[10px] text-red-400 font-bold uppercase">Sin Conexión</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                        <LayoutDashboard size={20} /> <span className="hidden lg:block font-bold text-sm">Panel Control</span>
                    </button>
                    <button onClick={() => setView('quote')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'quote' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                        <Calculator size={20} /> <span className="hidden lg:block font-bold text-sm">Presupuestador</span>
                    </button>
                    <button onClick={() => setView('prods')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'prods' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                        <Archive size={20} /> <span className="hidden lg:block font-bold text-sm">Productos</span>
                    </button>
                    <button onClick={() => setView('clients')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'clients' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                        <Users size={20} /> <span className="hidden lg:block font-bold text-sm">Clientes</span>
                    </button>
                </nav>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button onClick={() => setView('config')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'config' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                        <Settings size={20} /> <span className="hidden lg:block font-bold text-sm">Configuración</span>
                    </button>
                    <button onClick={handleOpenAgent} className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Bot size={20} /> <span className="hidden lg:block font-bold text-sm">Agente IA</span>
                    </button>
                    <div className="flex items-center justify-center lg:justify-between px-3 py-1">
                        <span className="hidden lg:block text-xs text-slate-400 dark:text-slate-500 font-medium">Tema</span>
                        <ThemeToggle />
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all text-slate-500 dark:text-slate-500">
                        <LogOut size={20} /> <span className="hidden lg:block font-bold text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Nav - Glassmorphism & 44px Touch Targets */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800 z-[70] flex justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,8px)+8px)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-black/80">
                <button onClick={() => setView('dashboard')} className={`p-2 rounded-xl flex flex-col items-center min-w-[56px] min-h-[56px] justify-center transition-all duration-300 ${view === 'dashboard' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/40 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:opacity-80'}`}><LayoutDashboard size={22} /><span className="text-[10px] font-black mt-1">Panel</span></button>
                <button onClick={() => setView('quote')} className={`p-2 rounded-xl flex flex-col items-center min-w-[56px] min-h-[56px] justify-center transition-all duration-300 ${view === 'quote' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/40 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:opacity-80'}`}><Calculator size={22} /><span className="text-[10px] font-black mt-1">Nuevo</span></button>
                <button onClick={() => setView('clients')} className={`p-2 rounded-xl flex flex-col items-center min-w-[56px] min-h-[56px] justify-center transition-all duration-300 ${view === 'clients' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/40 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:opacity-80'}`}><Users size={22} /><span className="text-[10px] font-black mt-1">Clientes</span></button>
                <button onClick={() => setView('prods')} className={`p-2 rounded-xl flex flex-col items-center min-w-[56px] min-h-[56px] justify-center transition-all duration-300 ${view === 'prods' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/40 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:opacity-80'}`}><Archive size={22} /><span className="text-[10px] font-black mt-1">Ítems</span></button>
                <button onClick={() => setView('config')} className={`p-2 rounded-xl flex flex-col items-center min-w-[56px] min-h-[56px] justify-center transition-all duration-300 ${view === 'config' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/40 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:opacity-80'}`}><Settings size={22} /><span className="text-[10px] font-black mt-1">Config</span></button>
            </div>

            {/* Main Content Area - Fixed height container to prevent double scrolling */}
            <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-100 dark:bg-slate-900 mt-14 mb-[84px] md:mt-0 md:mb-0">
                <div className={view === 'dashboard' ? 'h-full' : 'hidden h-full'}><Dashboard history={history} products={products} clients={clients} onNavigate={handleNavigate} config={config} /></div>
                <div className={view === 'quote' ? 'h-full' : 'hidden h-full'}><QuoteConfigurator products={products} categories={categories} config={config} cart={cart} setCart={setCart} onSave={handleSaveQuote} onReset={() => { setCart([]); setEditQuoteData(null) }} initialData={editQuoteData} clientsDb={clients} className="h-full" isPro={isPro} onUpgrade={(msg) => { setUpgradeMessage(msg); setShowUpgradeModal(true); }} /></div>
                <div className={view === 'prods' ? 'h-full' : 'hidden h-full'}>
                    <ProductManager
                        products={products}
                        setProducts={setProducts}
                        categories={categories}
                        setCategories={setCategories}
                        className="h-full"
                        canCreate={isPro || products.length < 3}
                        onLimitReached={() => { setUpgradeMessage(null); setShowUpgradeModal(true); }}
                    />
                </div>
                <div className={view === 'clients' ? 'h-full' : 'hidden h-full'}><ClientManager quotesHistory={history} savedClients={clients} deletedHistory={deletedHistory} onLoadQuote={(q) => handleNavigate(q)} onDeleteClient={handleDeleteClient} onDeleteQuote={handleDeleteQuote} onRestoreItem={handleRestore} onNewQuoteForClient={(c) => { handleImportClient(c) }} onPermanentDelete={(it) => setDeletedHistory(d => d.filter(x => x.deletedAt !== it.deletedAt))} onUpdateStatus={(id, st) => setHistory(h => h.map(x => x.id === id ? { ...x, status: st, statusChangedAt: Date.now(), autoRejected: false } : x))} onImportClient={handleImportClient} className="h-full" /></div>
                <div className={view === 'config' ? 'h-full' : 'hidden h-full'}><SysConfig config={config} setConfig={setConfig} className="h-full" user={user} isPro={isPro} products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} /></div>
            </main>
        </div>
    );
};

export default function AppV30({ onLogout, isPro, user, isImpersonating, subscription }) {
    return (
        <ErrorBoundary>
            <AppContent onLogout={onLogout} isPro={isPro} user={user} isImpersonating={isImpersonating} subscription={subscription} />
        </ErrorBoundary>
    );
}
