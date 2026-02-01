'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ToastProvider, useToast } from '../../context/ToastContext';
import { LayoutDashboard, ShoppingCart, Archive, Settings, LogOut, Users, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { useSyncEngine } from '../../hooks/useSyncEngine';

import Dashboard from './Dashboard';
import QuoteConfigurator from './QuoteConfigurator';
import ProductManager from './ProductManager';
import ClientManager from './ClientManager';
import SysConfig from './SysConfig';
import UpgradeModal from '../UpgradeModal';
import VerificationPending from '../VerificationPending';

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

const AppContent = ({ onLogout, isPro, user, isImpersonating }) => {
    const toast = useToast();
    const [view, setView] = useState('dashboard'); // dashboard, quote, prods, clients, config
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState(null);

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
        deletedHistory, setDeletedHistory
    } = useSyncEngine(user);

    // Map Sync Engine Status to UI Cloud Status
    const cloudStatus = status === 'SAVING' ? 'syncing' : (status === 'READY' ? 'idle' : (status === 'ERROR' ? 'error' : 'idle'));
    const cloudError = syncError;

    // Derived clients from history
    const clients = useMemo(() => {
        const unique = new Map();
        history.forEach(q => {
            if (q.client && q.client.phone) unique.set(q.client.phone, q.client);
        });
        return Array.from(unique.values());
    }, [history]);

    // Temp state for editing
    const [editQuoteData, setEditQuoteData] = useState(null);
    const [cart, setCart] = useState([]);

    // Scroll Reset on View Change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);

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

    const handleSaveQuote = (quote) => {
        const exists = history.find(q => q.id === quote.id);
        if (exists) {
            setHistory(history.map(q => q.id === quote.id ? quote : q));
        } else {
            setHistory([quote, ...history]);
        }
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
        setHistory(history.filter(q => q.id !== quote.id));
        setDeletedHistory([{ type: 'quote', data: quote, deletedAt: new Date().toISOString() }, ...deletedHistory]);
        toast("Presupuesto movido a papelera", "info");
    };

    const handleDeleteClient = (client) => {
        // Remove all quotes for this client
        const clientQuotes = history.filter(q => (q.client.name + q.client.phone) === (client.name + client.phone));
        setHistory(history.filter(q => (q.client.name + q.client.phone) !== (client.name + client.phone)));

        // Add to deleted as a single client block or individual quotes? Let's do client block
        setDeletedHistory([{ type: 'client', data: { ...client, quotes: clientQuotes }, deletedAt: new Date().toISOString() }, ...deletedHistory]);
        toast("Cliente y sus pedidos movidos a papelera", "info");
    };

    const handleRestore = (item) => {
        setDeletedHistory(deletedHistory.filter(d => d.deletedAt !== item.deletedAt));
        if (item.type === 'quote') {
            setHistory([item.data, ...history]);
        } else if (item.type === 'client') {
            setHistory([...item.data.quotes, ...history]);
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

    const handleUpgrade = () => {
        // Redirigir al checkout de Lemon Squeezy con el ID del usuario para el webhook
        // Variant ID: 1268029 (Plan PRO)
        // Variant ID: cb60ae4e-ad08-496f-8e56-46d803e43f19 (Plan PRO)
        const variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID || 'cb60ae4e-ad08-496f-8e56-46d803e43f19';
        const checkoutUrl = `https://tupresulisto.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${user.uid}`;
        window.open(checkoutUrl, '_blank');
        setShowUpgradeModal(false);
    };

    return (
        <div className="flex h-[100dvh] w-full bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
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
                <div className="fixed bottom-4 right-4 z-[100] bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce-in flex flex-col items-start max-w-sm">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <CloudOff size={20} />
                        <span>Problemas de Conexión</span>
                    </div>
                    <p className="text-xs opacity-90 mb-3">Es posible que los cambios no se guarden. Comprueba tu internet.</p>
                    <button onClick={() => window.location.reload()} className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-neutral-100 transition-colors w-full">Recargar Aplicación</button>
                </div>
            )}

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 z-[60] flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-600"></div>
                    <span className="font-black text-lg text-white tracking-tight">tupresulisto.com</span>
                </div>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <LogOut size={20} />
                </button>
            </header>

            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 text-slate-300 transition-all z-50 shadow-2xl shrink-0">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-800">
                    <div className="w-8 h-8 rounded bg-blue-600 shrink-0"></div>
                    <div>
                        <span className="font-black text-xl text-white hidden lg:block tracking-tight">tupresulisto.com</span>
                        {cloudStatus === 'error' && (
                            <div className="hidden lg:flex items-center gap-1.5 mt-1 animate-pulse">
                                <CloudOff size={10} className="text-red-400" />
                                <span className="text-[10px] text-red-400 font-bold uppercase">Sin Conexión</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} /> <span className="hidden lg:block font-bold text-sm">Panel Control</span>
                    </button>
                    <button onClick={() => { setEditQuoteData(null); setCart([]); setView('quote') }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'quote' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <ShoppingCart size={20} /> <span className="hidden lg:block font-bold text-sm">Presupuestador</span>
                    </button>
                    <button onClick={() => setView('prods')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'prods' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Archive size={20} /> <span className="hidden lg:block font-bold text-sm">Productos</span>
                    </button>
                    <button onClick={() => setView('clients')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'clients' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Users size={20} /> <span className="hidden lg:block font-bold text-sm">Clientes</span>
                    </button>
                </nav>

                <div className="p-3 border-t border-slate-800 space-y-2">
                    <button onClick={() => setView('config')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'config' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Settings size={20} /> <span className="hidden lg:block font-bold text-sm">Configuración</span>
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-900/30 hover:text-red-400 transition-all text-slate-400">
                        <LogOut size={20} /> <span className="hidden lg:block font-bold text-sm">Cerrar Sesión</span>
                    </button>

                    {/* Version & Sync Status - REMOVED as per user request */}
                    {/* Only showing error toast if needed (handled by ToastContext normally, but we can add a persistent alert in main view) */}
                </div>
            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-[60] flex justify-around p-2 pb-6 shadow-2xl safe-area-bottom">
                <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={20} /><span className="text-[10px] font-bold mt-1">Panel</span></button>
                <button onClick={() => { setEditQuoteData(null); setCart([]); setView('quote') }} className={`p-2 rounded-lg flex flex-col items-center ${view === 'quote' ? 'text-blue-600' : 'text-slate-400'}`}><ShoppingCart size={20} /><span className="text-[10px] font-bold mt-1">Nuevo</span></button>
                <button onClick={() => setView('clients')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'clients' ? 'text-blue-600' : 'text-slate-400'}`}><Users size={20} /><span className="text-[10px] font-bold mt-1">Clientes</span></button>
                <button onClick={() => setView('prods')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'prods' ? 'text-blue-600' : 'text-slate-400'}`}><Archive size={20} /><span className="text-[10px] font-bold mt-1">Items</span></button>
                <button onClick={() => setView('config')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'config' ? 'text-blue-600' : 'text-slate-400'}`}><Settings size={20} /><span className="text-[10px] font-bold mt-1">Config</span></button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative flex flex-col h-full bg-slate-100 pb-32 pt-14 md:pb-0 md:pt-0">
                {view === 'dashboard' && <Dashboard history={history} products={products} clients={clients} onNavigate={handleNavigate} config={config} />}
                {view === 'quote' && <QuoteConfigurator products={products} categories={categories} config={config} cart={cart} setCart={setCart} onSave={handleSaveQuote} onReset={() => { setCart([]); setEditQuoteData(null) }} initialData={editQuoteData} clientsDb={clients} className="h-full" isPro={isPro} onUpgrade={(msg) => { setUpgradeMessage(msg); setShowUpgradeModal(true); }} />}
                {view === 'prods' && (
                    <ProductManager
                        products={products}
                        setProducts={setProducts}
                        categories={categories}
                        setCategories={setCategories}
                        className="h-full"
                        canCreate={isPro || products.length < 3}
                        onLimitReached={() => { setUpgradeMessage(null); setShowUpgradeModal(true); }}
                    />
                )}
                {view === 'clients' && <ClientManager quotesHistory={history} deletedHistory={deletedHistory} onLoadQuote={(q) => handleNavigate(q)} onDeleteClient={handleDeleteClient} onDeleteQuote={handleDeleteQuote} onRestoreItem={handleRestore} onNewQuoteForClient={(c) => { handleImportClient(c) }} onPermanentDelete={(it) => setDeletedHistory(d => d.filter(x => x.deletedAt !== it.deletedAt))} onUpdateStatus={(id, st) => setHistory(h => h.map(x => x.id === id ? { ...x, status: st } : x))} onImportClient={handleImportClient} className="h-full" />}
                {view === 'config' && <SysConfig config={config} setConfig={setConfig} className="h-full" user={user} isPro={isPro} products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} />}
            </main>
        </div>
    );
};

export default function AppV30({ onLogout, isPro, user, isImpersonating }) {
    return (
        <ToastProvider>
            <ErrorBoundary>
                <AppContent onLogout={onLogout} isPro={isPro} user={user} isImpersonating={isImpersonating} />
            </ErrorBoundary>
        </ToastProvider>
    );
}
