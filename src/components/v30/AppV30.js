'use client';
import React, { useState, useEffect } from 'react';
import { dbApi } from '../../lib/db';
import { ToastProvider, useToast } from '../../context/ToastContext';
import { LayoutDashboard, ShoppingCart, Archive, Settings, LogOut, Users } from 'lucide-react';

import Dashboard from './Dashboard';
import QuoteConfigurator from './QuoteConfigurator';
import ProductManager from './ProductManager';
import ClientManager from './ClientManager';
import SysConfig from './SysConfig';

import UpgradeModal from '../UpgradeModal';

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

const AppContent = ({ onLogout, isPro }) => {
    const [view, setView] = useState('dashboard'); // dashboard, quote, prods, clients, config
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['General', 'Cocinas', 'Armarios']);
    const [history, setHistory] = useState([]);
    const [deletedHistory, setDeletedHistory] = useState([]);
    const [clients, setClients] = useState([]); // This might be derived or separate, using history for now
    const [config, setConfig] = useState({
        name: 'Tu Carpintería',
        color: '#2563eb',
        logo: null,
        cif: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        bankAccount: '',
        legalText: 'Presupuesto válido por 15 días.',
        iva: 21
    });

    // Temp state for editing
    const [editQuoteData, setEditQuoteData] = useState(null);
    const [cart, setCart] = useState([]);

    const toast = useToast();

    // Data Loading from IndexedDB
    useEffect(() => {
        const load = async () => {
            try {
                const p = await dbApi.get('tpl_products') || [];
                const c = await dbApi.get('tpl_categories') || ['General', 'Cocinas', 'Armarios'];
                const h = await dbApi.get('tpl_history') || [];
                const d = await dbApi.get('tpl_deleted') || [];
                const cfg = await dbApi.get('tpl_config') || { name: 'Tu Carpintería', color: '#2563eb', iva: 21 };

                setProducts(p.length ? p : []);
                if (c.length) setCategories(c);
                if (h.length) setHistory(h);
                if (d.length) setDeletedHistory(d);
                setConfig(prev => ({ ...prev, ...cfg }));
            } catch (err) {
                console.error("Error loading from DB:", err);
                toast("Error cargando datos locales", "error");
            }
        };
        load();
    }, []);

    // Autosave effects (IndexedDB)
    useEffect(() => { if (products) dbApi.set('tpl_products', products); }, [products]);
    useEffect(() => { if (categories) dbApi.set('tpl_categories', categories); }, [categories]);
    useEffect(() => { if (history) dbApi.set('tpl_history', history); }, [history]);
    useEffect(() => { if (deletedHistory) dbApi.set('tpl_deleted', deletedHistory); }, [deletedHistory]);
    useEffect(() => { if (config) dbApi.set('tpl_config', config); }, [config]);

    const handleSaveQuote = (quote) => {
        const exists = history.find(q => q.id === quote.id);
        if (exists) {
            setHistory(history.map(q => q.id === quote.id ? quote : q));
        } else {
            setHistory([quote, ...history]);
        }
        setEditQuoteData(null);
        setCart([]);
        setView('dashboard');
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
        // Logic to merge imported client data if needed, or just notify user
        setEditQuoteData({ client: clientData, items: [], financials: { discountPercent: 0, deposit: 0 }, number: '', status: 'pending', date: new Date().toLocaleDateString() });
        setCart([]);
        setView('quote');
    };

    const canAddProduct = () => {
        if (isPro) return true;
        // Free tier limit: 3 products
        return products.length < 3;
    };

    const handleCreateProductAttempt = () => {
        if (canAddProduct()) {
            setView('prods'); // Or better, pass a signal to ProductManager to open create mode? 
            // ProductManager handles its own state, but we need to tell it to open the form if we are separate views.
            // Actually, in ProductManager, the "Nuevo Producto" button is INSIDE it.
            // So we need to pass strict limits or the handler DOWN to ProductManager.
            // Or simpler: We intercept the View change if 'prods' was solely for creation? No, 'prods' is the list.
            // So the 'Nuevo Producto' button is inside ProductManager. 
            // I need to update ProductManager to accept a 'canCreate' prop or handle it there.
        } else {
            setShowUpgradeModal(true);
        }
    };

    // We need to pass the limit logic to ProductManager
    // or wrap the ProductManager's create action.

    return (
        <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 overflow-hidden">
            {showUpgradeModal && (
                <UpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgrade={() => {
                        // User wants to upgrade. Redirect to a plans section?
                        // For now, since we are SPA, maybe just show a Toast or redirect to landing?
                        // Ideally, we have a function to "Buy".
                        window.open('https://tupresulisto.lemonsqueezy.com/buy', '_blank'); // Placeholder
                        setShowUpgradeModal(false);
                    }}
                />
            )}
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 text-slate-300 transition-all z-50 shadow-2xl shrink-0">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-800">
                    <div className="w-8 h-8 rounded bg-blue-600 shrink-0"></div>
                    <span className="font-black text-xl text-white hidden lg:block tracking-tight">tupresulisto.com</span>
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
                </div>
            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-[60] flex justify-around p-2 pb-safe shadow-2xl">
                <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={20} /><span className="text-[10px] font-bold mt-1">Panel</span></button>
                <button onClick={() => { setEditQuoteData(null); setCart([]); setView('quote') }} className={`p-2 rounded-lg flex flex-col items-center ${view === 'quote' ? 'text-blue-600' : 'text-slate-400'}`}><ShoppingCart size={20} /><span className="text-[10px] font-bold mt-1">Nuevo</span></button>
                <button onClick={() => setView('clients')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'clients' ? 'text-blue-600' : 'text-slate-400'}`}><Users size={20} /><span className="text-[10px] font-bold mt-1">Clientes</span></button>
                <button onClick={() => setView('prods')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'prods' ? 'text-blue-600' : 'text-slate-400'}`}><Archive size={20} /><span className="text-[10px] font-bold mt-1">Items</span></button>
                <button onClick={() => setView('config')} className={`p-2 rounded-lg flex flex-col items-center ${view === 'config' ? 'text-blue-600' : 'text-slate-400'}`}><Settings size={20} /><span className="text-[10px] font-bold mt-1">Config</span></button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col h-full bg-slate-100">
                {view === 'dashboard' && <Dashboard history={history} products={products} clients={clients} onNavigate={handleNavigate} config={config} />}
                {view === 'quote' && <QuoteConfigurator products={products} categories={categories} config={config} cart={cart} setCart={setCart} onSave={handleSaveQuote} onReset={() => { setCart([]); setEditQuoteData(null) }} initialData={editQuoteData} clientsDb={clients} className="h-full" />}
                {view === 'prods' && (
                    <ProductManager
                        products={products}
                        setProducts={setProducts}
                        categories={categories}
                        setCategories={setCategories}
                        className="h-full"
                        canCreate={isPro || products.length < 3}
                        onLimitReached={() => setShowUpgradeModal(true)}
                    />
                )}
                {view === 'clients' && <ClientManager quotesHistory={history} deletedHistory={deletedHistory} onLoadQuote={(q) => handleNavigate(q)} onDeleteClient={handleDeleteClient} onDeleteQuote={handleDeleteQuote} onRestoreItem={handleRestore} onNewQuoteForClient={(c) => { handleImportClient(c) }} onPermanentDelete={(it) => setDeletedHistory(d => d.filter(x => x.deletedAt !== it.deletedAt))} onUpdateStatus={(id, st) => setHistory(h => h.map(x => x.id === id ? { ...x, status: st } : x))} onImportClient={handleImportClient} className="h-full" />}
                {view === 'config' && <SysConfig config={config} setConfig={setConfig} className="h-full" />}
            </main>
        </div>
    );
};

export default function AppV30({ onLogout, isPro }) {
    return (
        <ToastProvider>
            <ErrorBoundary>
                <AppContent onLogout={onLogout} isPro={isPro} />
            </ErrorBoundary>
        </ToastProvider>
    );
}
