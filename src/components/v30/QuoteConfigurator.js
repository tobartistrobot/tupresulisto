'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import {
    Calculator, Users, Box, Settings, Trash, Plus, Save, Edit, Printer, FileText, Search, RefreshCw,
    ChevronUp, ChevronDown, Download, Upload, X, Ban, List, Undo, ArrowLeft, ArrowRight, ZoomIn, ZoomOut,
    Wand, Sparkles, Home, Check, BarChart2, Share2, Target, Database, Percent, Lock, Loader2
} from 'lucide-react';
import MatrixEditor from './MatrixEditor';
import StatusSelector from './StatusSelector';
import { round2, sanitizeFloat } from '../../utils/mathUtils';

const formatCurrency = (amount) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);

const CartSummaryItem = React.memo(({ item, idx, onRemove, onUpdateQty, onMove }) => (
    <div className="p-4 border border-slate-200 rounded-2xl relative group bg-white shadow-sm hover:shadow-xl transition-all duration-300 mb-3 animate-fade-in">
        <div className="absolute top-2 right-2 flex gap-1">
            <div className="flex flex-col mr-2 bg-slate-50 rounded border border-slate-100">
                <button onClick={() => onMove(idx, -1)} className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-t"><ChevronUp size={12} /></button>
                <button onClick={() => onMove(idx, 1)} className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-b border-t border-slate-100"><ChevronDown size={12} /></button>
            </div>
            <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors h-fit"><X size={16} /></button>
        </div>
        <div className="flex gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">{item.product.image ? <img src={item.product.image} className="w-full h-full object-cover rounded-lg" /> : <Box className="text-slate-300" />}</div>
            <div className="flex-1 min-w-0">
                <p className="font-black text-base text-slate-900 truncate pr-16">{item.product.name}</p>
                <p className="text-xs text-slate-500 font-medium">{item.width}x{item.height} {item.locationLabel && `· ${item.locationLabel}`}</p>
                {item.selectedExtras?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{item.selectedExtras.map((e, i) => (<span key={i} className="inline-flex items-center text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{e.qty > 1 && <b className="text-blue-600 mr-1">{e.qty}x</b>}{e.name}</span>))}</div>}
                <div className="flex justify-between items-center mt-2"><div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200"><button onClick={() => onUpdateQty(item.id, -1)} className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-md transition-colors text-slate-600 font-bold touch-target-48">-</button><span className="text-xs font-bold w-8 text-center text-slate-700">{item.quantity}</span><button onClick={() => onUpdateQty(item.id, 1)} className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-md transition-colors text-slate-600 font-bold touch-target-48">+</button></div><b className="text-sm text-blue-900 font-mono">{formatCurrency(item.price)}</b></div>
            </div>
        </div>
    </div>
));

const QuoteConfigurator = ({ products, categories, config, cart, setCart, onSave, onReset, initialData, clientsDb, className, isPro, onUpgrade }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [dims, setDims] = useState({ w: 1000, h: 1000, q: 1 });
    const [locationLabel, setLocationLabel] = useState('');
    const [client, setClient] = useState(initialData?.client || { name: '', phone: '', email: '', address: '', city: '', source: '' });
    const [financials, setFinancials] = useState(initialData?.financials || { discountPercent: 0, deposit: 0 });
    const [quoteMeta, setQuoteMeta] = useState(initialData ? { number: initialData.number, date: initialData.date, status: initialData.status || 'pending' } : { number: `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString('es-ES'), status: 'pending' });
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [filterTerm, setFilterTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [viewMode, setViewMode] = useState('edit');
    const [mobileTab, setMobileTab] = useState('products');
    const [zoomLevel, setZoomLevel] = useState(0.8);
    const [docType, setDocType] = useState('quote');
    const [saveStatus, setSaveStatus] = useState('idle');
    const toast = useToast();

    // Configurable VAT
    const vatRate = config.iva !== undefined && config.iva !== "" ? parseFloat(config.iva) : 21;

    // ... (keep existing lines)


    useEffect(() => {
        if (initialData) {
            setClient(initialData.client || { name: '', phone: '', email: '', address: '', city: '', source: initialData.client?.source || '' });
            setFinancials(initialData.financials || { discountPercent: 0, deposit: 0 });
            setQuoteMeta({ number: initialData.number, date: initialData.date, status: initialData.status || 'pending' });
        } else {
            setClient({ name: '', phone: '', email: '', address: '', city: '', source: '' });
            setFinancials({ discountPercent: 0, deposit: 0 });
            setQuoteMeta({ number: `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString('es-ES'), status: 'pending' });
        }
    }, [initialData]);

    const [selectedExtras, setSelectedExtras] = useState([]);
    const [dropdownSelections, setDropdownSelections] = useState({});
    const [calculatedPrice, setCalculatedPrice] = useState(null);

    // Precios logic UPDATED for Margin

    // Precios logic UPDATED for Margin
    const calcPrice = (product, w, h, q, extras, dropdowns) => {
        let base = 0;
        if (product.priceType === 'matrix') {
            const ws = product.matrix.widths; const hs = product.matrix.heights; const ps = product.matrix.prices;
            let c = ws.findIndex(x => x >= w); if (c === -1) c = ws.length - 1;
            let r = hs.findIndex(x => x >= h); if (r === -1) r = hs.length - 1;
            base = sanitizeFloat(ps[r][c]);
        } else if (product.priceType === 'unit') {
            base = sanitizeFloat(product.unitPrice);
        } else if (product.priceType === 'simple_area') {
            base = (w * h / 1000000) * sanitizeFloat(product.unitPrice);
        } else if (product.priceType === 'simple_linear') {
            base = (Math.max(w, h) / 1000) * sanitizeFloat(product.unitPrice);
        }

        let extraTotal = 0;
        extras.forEach(e => {
            const val = sanitizeFloat(e.value);
            if (e.type === 'fixed') extraTotal += val * e.qty;
            else if (e.type === 'percent') extraTotal += base * (val / 100) * e.qty;
            else if (e.type === 'linear') extraTotal += (Math.max(w, h) / 1000) * val * e.qty;
            else if (e.type === 'area') extraTotal += (w * h / 1000000) * val * e.qty;
        });

        Object.keys(dropdowns).forEach(extraId => {
            const extra = product.extras.find(e => e.id.toString() === extraId);
            if (extra && extra.optionsList) {
                const optIndex = parseInt(dropdowns[extraId]);
                const opt = extra.optionsList[optIndex];
                if (opt) {
                    const val = sanitizeFloat(opt.value);
                    if (opt.type === 'fixed') extraTotal += val;
                    else if (opt.type === 'percent') extraTotal += base * (val / 100);
                    else if (opt.type === 'linear') extraTotal += (Math.max(w, h) / 1000) * val;
                    else if (opt.type === 'area') extraTotal += (w * h / 1000000) * val;
                }
            }
        });

        // Apply Margin Logic
        let priceBeforeMargin = base + extraTotal;
        let marginAmount = 0;
        if (product.marginType === 'percent' && product.marginValue) {
            marginAmount = priceBeforeMargin * (sanitizeFloat(product.marginValue) / 100);
        } else if (product.marginType === 'fixed' && product.marginValue) {
            marginAmount = sanitizeFloat(product.marginValue);
        }

        return round2((priceBeforeMargin + marginAmount) * q);
    };

    useEffect(() => { if (selectedProduct) { const total = calcPrice(selectedProduct, dims.w, dims.h, dims.q, selectedExtras, dropdownSelections); setCalculatedPrice(total); } }, [selectedProduct, dims, selectedExtras, dropdownSelections]);

    const toggleExtra = (extra) => { const exists = selectedExtras.find(e => e.id === extra.id); if (exists) setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id)); else setSelectedExtras([...selectedExtras, { ...extra, qty: 1 }]); };
    const updateExtraQty = (extraId, delta) => { setSelectedExtras(prev => prev.map(e => { if (e.id === extraId) return { ...e, qty: Math.max(1, e.qty + delta) }; return e; })); };
    const addToQuote = () => { const it = { id: Date.now(), product: selectedProduct, width: dims.w, height: dims.h, quantity: dims.q, locationLabel, selectedExtras: [...selectedExtras], dropdownSelections: { ...dropdownSelections }, price: calculatedPrice, unitPriceCalc: calculatedPrice / dims.q }; setCart(prev => [...prev, it]); setSelectedProduct(null); setLocationLabel(''); setSelectedExtras([]); setDropdownSelections({}); toast("Producto añadido", "success"); };
    const updateQuantity = useCallback((id, d) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + d), price: item.unitPriceCalc * Math.max(1, item.quantity + d) } : item)), []);
    const removeFromCart = useCallback((id) => setCart(prev => prev.filter(x => x.id !== id)), []);
    const moveCartItem = useCallback((idx, dir) => { if ((dir === -1 && idx === 0) || (dir === 1 && idx === cart.length - 1)) return; const newCart = [...cart];[newCart[idx], newCart[idx + dir]] = [newCart[idx + dir], newCart[idx]]; setCart(newCart); }, [cart]);

    const grossTotal = useMemo(() => cart.reduce((s, i) => s + i.price, 0), [cart]);
    const discountAmount = grossTotal * (financials.discountPercent / 100);
    const netTotal = grossTotal - discountAmount;
    const grandTotal = netTotal * (1 + vatRate / 100);
    const remainingBalance = grandTotal - financials.deposit;

    // Safety check for unmount - cleanup all timeouts
    const isMounted = React.useRef(true);
    const saveTimeoutRef = React.useRef(null);
    const idleTimeoutRef = React.useRef(null);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            // Clear any pending timeouts on unmount
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, []);

    const handleSave = () => {
        if (!client.name) {
            toast("Falta nombre cliente", "error");
            return;
        }
        if (cart.length === 0) {
            toast("Carrito vacío", "error");
            return;
        }

        try {
            // Clear any existing timeouts before starting new ones
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

            setSaveStatus('saving');

            onSave({
                id: initialData?.id || Date.now(),
                number: quoteMeta.number,
                date: quoteMeta.date,
                status: quoteMeta.status,
                client,
                financials,
                items: cart,
                grandTotal
            });

            // Show saving state for 800ms so user clearly sees it
            saveTimeoutRef.current = setTimeout(() => {
                if (isMounted.current) {
                    setSaveStatus('saved');
                    idleTimeoutRef.current = setTimeout(() => {
                        if (isMounted.current) {
                            setSaveStatus('idle');
                        }
                    }, 2000);
                }
            }, 800);
        } catch (error) {
            console.error("Error saving quote:", error);
            toast(`Error: ${error.message}`, "error");
            setSaveStatus('idle');
        }
    };
    const downloadWord = () => { try { const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>Presupuesto</title></head><body style="font-family:Arial;font-size:12px"><h1 style="color:${config.color}">${config.name}</h1><p>Cliente: ${client.name}</p><table>${cart.map(i => `<tr><td>${i.product.name}</td><td>${i.width}x${i.height}</td><td>${i.quantity}</td><td>${formatCurrency(i.price)}</td></tr>`).join('')}</table><h3>Total: ${formatCurrency(grandTotal)}</h3></body></html>`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff', html], { type: 'application/msword' })); link.download = `Presupuesto_${client.name}.doc`; document.body.appendChild(link); link.click(); document.body.removeChild(link); } catch (e) { console.error("Error downloadWord", e); toast("Error al descargar Word", "error"); } };
    const filteredClients = clientsDb.filter(c => (c.name || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) || (c.phone || '').includes(clientSearchTerm));

    if (viewMode === 'print') return (
        <div className={`fixed inset-0 z-[100] bg-slate-100 flex flex-col h-safe-screen w-full fixed-print-view smooth-scroll`}>
            <div className="absolute top-4 left-4 z-50 bg-white shadow-xl rounded-lg p-1 flex border border-slate-200 doc-type-switch"><button onClick={() => setDocType('quote')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${docType === 'quote' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>PRESUPUESTO</button><button onClick={() => setDocType('invoice')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${docType === 'invoice' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>FACTURA</button></div>
            <div className="zoom-controls absolute top-4 right-4 z-50 bg-white shadow-xl rounded-full p-2 flex gap-4 items-center border border-slate-200"><button onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))} className="p-2 text-slate-600 hover:text-blue-600"><ZoomOut size={20} /></button><span className="text-xs font-bold w-8 text-center">{Math.round(zoomLevel * 100)}%</span><button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-2 text-slate-600 hover:text-blue-600"><ZoomIn size={20} /></button></div>
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-8 flex justify-center items-start print:p-0 print:block">
                <div className="print-scale-wrapper origin-top transition-transform duration-200 md:scale-100 scale-75" style={{ transform: `scale(${zoomLevel})` }}>
                    <div className="w-[210mm] min-w-[210mm] min-h-[297mm] bg-white print-container shadow-2xl p-[15mm] mx-auto text-sm relative">
                        <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: config.color }}><div>{config.logo ? <img src={config.logo} className="h-16 mb-4 object-contain" /> : <h1 className="text-4xl font-black mb-2" style={{ color: config.color }}>{config.name}</h1>}<div className="text-xs text-slate-500 space-y-1"><p>{config.address}</p>{config.cif && <p>CIF/NIF: {config.cif}</p>}<p>{config.phone} • {config.email}</p><p>{config.website}</p></div></div><div className="text-right"><h2 className="text-4xl font-black tracking-tight text-slate-800 mb-2">{docType === 'invoice' ? 'FACTURA' : 'PRESUPUESTO'}</h2><div className="flex flex-col items-end my-2"><span className="text-lg font-bold text-slate-600">#{quoteMeta.number}</span><span className="text-sm text-slate-400">{quoteMeta.date}</span></div><div className="mt-4 text-left bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-[250px]"><p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Facturar a</p><p className="font-bold text-slate-800 text-lg leading-none mb-1">{client.name}</p><p className="text-sm text-slate-600">{client.phone}</p><p className="text-sm text-slate-600">{client.address}</p></div></div></div>
                        <table className="w-full mb-8"><thead><tr className="border-b-2 text-xs uppercase text-slate-500 font-bold tracking-wider"><th className="text-left py-3 pl-2">Concepto</th><th className="text-center py-3">Medidas</th><th className="text-center py-3">Cant.</th><th className="text-right py-3 pr-2">Total</th></tr></thead><tbody>{cart.map(i => (<tr key={i.id} className="avoid-break border-b border-slate-100 last:border-0"><td className="py-4 pl-2"><div className="flex items-start gap-4">{i.product.image && <img src={i.product.image} className="w-16 h-16 object-cover rounded-lg border border-slate-200 print-visible" />}<div><p className="font-bold text-slate-800 text-base">{i.product.name}</p><p className="text-xs text-slate-500 mt-1">{i.product.category} {i.locationLabel && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-1">{i.locationLabel}</span>}</p>{i.selectedExtras?.length > 0 && <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-1">{i.selectedExtras.map(e => <span className="bg-slate-50 px-1 border border-slate-200 rounded">+{e.qty > 1 ? e.qty + 'x ' : ''}{e.name}</span>)}</div>}</div></div></td><td className="text-center text-sm py-4 text-slate-600 font-medium">{i.width} x {i.height}</td><td className="text-center font-bold text-slate-800 py-4">{i.quantity}</td><td className="text-right font-bold text-slate-800 py-4 pr-2">{formatCurrency(i.price)}</td></tr>))}</tbody></table>
                        <div className="flex justify-end avoid-break"><div className="w-80 space-y-3"><div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(grossTotal)}</span></div>{financials.discountPercent > 0 && <div className="flex justify-between text-sm font-bold text-emerald-600"><span>Descuento ({financials.discountPercent}%)</span><span>-{formatCurrency(discountAmount)}</span></div>}<div className="flex justify-between text-sm text-slate-600 pb-3 border-b"><span>IVA ({vatRate}%)</span><span>{formatCurrency(netTotal * (vatRate / 100))}</span></div><div className="flex justify-between text-3xl font-black bg-slate-50 p-2 rounded-lg -mx-2" style={{ color: config.color }}><span>TOTAL</span><span>{formatCurrency(grandTotal)}</span></div>{financials.deposit > 0 && <div className="flex justify-between text-sm font-bold text-slate-500 pt-2"><span>Pagado a cuenta</span><span>-{formatCurrency(financials.deposit)}</span></div>}{financials.deposit > 0 && <div className="flex justify-between font-black text-lg border-t pt-2"><span>PENDIENTE</span><span>{formatCurrency(remainingBalance)}</span></div>}</div></div>
                        <div className="mt-12 pt-6 border-t-2 border-slate-100 text-[10px] text-slate-500 grid grid-cols-2 gap-12"><div><b className="block mb-2 text-slate-800 uppercase tracking-wider">Método de Pago</b><div className="p-3 bg-slate-50 rounded border">{config.bankAccount || 'Consultar'}</div></div><div><b className="block mb-2 text-slate-800 uppercase tracking-wider">Términos y Condiciones</b><p style={{ whiteSpace: 'pre-line' }} className="leading-relaxed">{config.legalText}</p></div></div>
                    </div>
                </div>
            </div>
            <div className="shrink-0 bg-white border-t flex gap-4 justify-center no-print z-50 p-4 shadow-2xl"><button onClick={() => setViewMode('edit')} className="px-4 py-2 rounded-lg border bg-white shadow-sm hover:bg-slate-50 font-bold text-slate-600"><span>Seguir Editando</span></button><button onClick={() => window.print()} style={{ backgroundColor: config.color }} className="px-8 py-2 rounded-lg text-white font-bold shadow-xl flex items-center gap-2"><Printer size={18} /> <span>Imprimir PDF</span></button><button onClick={downloadWord} className="px-4 py-2 rounded-lg border bg-white shadow-sm hover:bg-slate-50 font-bold text-slate-600 flex items-center gap-2"><FileText size={18} /> <span>Word</span></button></div>
        </div>
    );

    const handleLocalReset = () => {
        if (onReset) onReset();
        setClient({ name: '', phone: '', email: '', address: '', city: '', source: '' });
        setFinancials({ discountPercent: 0, deposit: 0 });
        setQuoteMeta({ number: `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString('es-ES'), status: 'pending' });
        setCart([]);
        // setEditQuoteData(null); // Removed: Not defined in this scope, handled by onReset()
        setSelectedProduct(null);
        setLocationLabel('');
        setSelectedExtras([]);
        setDropdownSelections({});
        toast("Formulario limpio", "success");
    };

    return (
        <div className={`flex flex-col md:flex-row h-full overflow-hidden ${className} app-tab`}>
            <div className="md:hidden flex bg-white border-b shadow-sm z-30 shrink-0"><button onClick={() => setMobileTab('products')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Catálogo</button><button onClick={() => setMobileTab('cart')} className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${mobileTab === 'cart' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Presupuesto <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-black">{cart.length}</span></button></div>
            <div className={`${mobileTab === 'products' ? 'block' : 'hidden'} md:block w-full md:w-2/3 p-4 md:p-6 overflow-y-auto bg-slate-50/50`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"><div><h2 className="text-2xl font-black text-slate-800">Confeccionar</h2><div className="flex gap-2 mt-2"><div className="flex items-center gap-2 bg-white px-2 py-1 rounded border shadow-sm"><span className="text-[10px] font-bold text-slate-400 uppercase">REF</span><input className="bg-transparent text-sm font-bold w-20 outline-none" value={quoteMeta.number} onChange={e => setQuoteMeta({ ...quoteMeta, number: e.target.value })} /></div><div className="flex items-center gap-2 bg-white px-2 py-1 rounded border shadow-sm"><span className="text-[10px] font-bold text-slate-400 uppercase">FECHA</span><input className="bg-transparent text-sm font-bold w-20 outline-none" value={quoteMeta.date} onChange={e => setQuoteMeta({ ...quoteMeta, date: e.target.value })} /></div></div></div><button onClick={handleLocalReset} className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm bg-white hover:bg-red-50 text-red-600 border border-red-100 font-bold"><RefreshCw size={14} /> Limpiar Todo</button></div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-0 mb-8 overflow-visible relative z-20">
                    <div className="bg-slate-50 p-3 border-b rounded-t-xl flex justify-between items-center"><span className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-2">Datos del Cliente</span><button onClick={() => setShowClientSearch(!showClientSearch)} className="py-1 px-3 text-xs h-8 flex items-center gap-2 bg-white border rounded hover:bg-slate-50 text-slate-600"><Search size={14} /> Buscar</button></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-blue-500">Nombre</label><input className="input-saas" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} /></div>
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400">Teléfono</label><input className="input-saas" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} /></div>
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400">Email</label><input className="input-saas" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} /></div>
                        <div className="relative group"><label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400">Origen</label><select className="input-saas bg-white" value={client.source} onChange={e => setClient({ ...client, source: e.target.value })}><option value="">¿Cómo nos conoció?</option><option value="Recomendación">Recomendación</option><option value="Web">Web / Buscador</option><option value="Google">Google Maps</option><option value="Publicidad">Publicidad / Redes</option><option value="Tienda">Pasaba por tienda</option><option value="Otro">Otro</option></select></div>
                        <div className="relative group md:col-span-2"><label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400">Dirección</label><input className="input-saas" value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} /></div>
                    </div>
                    {showClientSearch && <div className="absolute top-12 left-2 right-2 bg-white border shadow-2xl z-30 rounded-xl max-h-60 overflow-hidden flex flex-col animate-fade-in"><div className="p-2 border-b bg-slate-50"><input autoFocus placeholder="Filtrar por nombre o teléfono..." className="input-saas text-xs !p-2" value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} /></div><div className="overflow-y-auto">{filteredClients.length === 0 && <p className="text-xs p-4 text-center text-slate-400">No hay clientes recientes.</p>}{filteredClients.map((c, i) => (<div key={i} onClick={() => { setClient({ ...c }); setShowClientSearch(false); setClientSearchTerm(''); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm flex justify-between group"><span className="font-bold group-hover:text-blue-700">{c.name}</span><span className="text-slate-500">{c.phone}</span></div>))}</div></div>}
                </div>
                {!selectedProduct ? (
                    <div className="animate-fade-in">
                        <div className="mb-6 flex flex-col md:flex-row gap-4"><div className="relative flex-1 group"><Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} /><input className="input-saas pl-10" placeholder="Buscar producto..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} /></div><div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:flex-wrap">{['Todas', ...categories].map(c => <button key={c} onClick={() => setFilterCategory(c)} className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-bold transition-all ${filterCategory === c ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border hover:bg-slate-50 hover:text-blue-600'}`}>{c}</button>)}</div></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{products.filter(p => (filterCategory === 'Todas' || p.category === filterCategory) && p.name.toLowerCase().includes(filterTerm.toLowerCase())).map((p) => {
                            const originalIndex = products.findIndex(prod => prod.id === p.id);
                            const isLocked = !isPro && originalIndex >= 3;

                            return (
                                <div key={p.id} onClick={() => isLocked ? onUpgrade("Este producto es parte de tu historial PRO. Reactiva tu suscripción para desbloquearlo y usarlo.") : setSelectedProduct(p)} className={`group bg-white rounded-2xl border ${isLocked ? 'border-slate-200 opacity-50 cursor-pointer grayscale' : 'border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-2 cursor-pointer'} overflow-hidden transition-all duration-300 relative`}>
                                    <div className="aspect-square bg-slate-50 relative w-full overflow-hidden">
                                        {p.image ? <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <div className="flex h-full items-center justify-center text-slate-300"><Box size={40} /></div>}
                                        {isLocked ? (
                                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                                <div className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur-sm transform group-hover:scale-110 transition-transform">
                                                    <Lock size={24} className="text-slate-500" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                                <span className="text-white font-bold text-sm bg-white/20 backdrop-blur px-3 py-1 rounded-full">Seleccionar</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-black text-base text-slate-900 leading-tight mb-2">{p.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[11px] text-slate-600 uppercase tracking-wider font-extrabold bg-gradient-to-r from-slate-100 to-slate-50 w-fit px-2.5 py-1 rounded-lg border border-slate-200">{p.category}</p>
                                            {isLocked && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">PRO</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 animate-slide-up overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><button onClick={() => setSelectedProduct(null)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center transition-colors"><ArrowLeft className="mr-1" size={16} /> VOLVER</button><h3 className="font-bold text-lg">{selectedProduct.name}</h3><div className="w-20"></div></div>
                        <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/3 bg-slate-100 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">{selectedProduct.image ? <img src={selectedProduct.image} className="max-h-48 rounded-lg shadow-lg rotate-1 hover:rotate-0 transition-transform" /> : <Box size={64} className="text-slate-300" />}</div>
                            <div className="flex-1 p-6 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{['matrix', 'simple_area', 'simple_linear'].includes(selectedProduct.priceType) && <><div className="flex flex-col"><label className="text-[10px] font-bold text-slate-500 mb-1">ANCHO (mm)</label><input type="number" className="input-saas text-right font-bold" value={dims.w} onChange={e => setDims({ ...dims, w: parseInt(e.target.value) || 0 })} /></div><div className="flex flex-col"><label className="text-[10px] font-bold text-slate-500 mb-1">ALTO (mm)</label><input type="number" className="input-saas text-right font-bold" value={dims.h} onChange={e => setDims({ ...dims, h: parseInt(e.target.value) || 0 })} /></div></>}<div className="flex flex-col"><label className="text-[10px] font-bold text-slate-500 mb-1">CANTIDAD</label><input type="number" className="input-saas text-right font-bold" value={dims.q} onChange={e => setDims({ ...dims, q: parseInt(e.target.value) || 1 })} /></div><div className="col-span-2 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 mb-1">UBICACIÓN</label><input placeholder="Ej: Salón principal..." className="input-saas" value={locationLabel} onChange={e => setLocationLabel(e.target.value)} /></div></div>
                                <div className="space-y-3 pt-4 border-t"><h4 className="text-xs font-black uppercase text-slate-400">Personalización</h4>{selectedProduct.extras.map(e => e.type === 'selection' ? (<select key={e.id} className="input-saas bg-white" onChange={ev => setDropdownSelections({ ...dropdownSelections, [e.id]: ev.target.value })}><option>Seleccionar {e.name}</option>{e.optionsList.map((o, i) => <option key={i} value={i}>{o.name} (+{o.value}{o.type === 'percent' ? '%' : (o.type === 'linear' ? '€/ml' : (o.type === 'area' ? '€/m²' : '€'))})</option>)}</select>) : (<div key={e.id} onClick={() => toggleExtra(e)} className={`w-full p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${selectedExtras.find(x => x.id === e.id) ? 'bg-blue-50 border-blue-500 shadow-inner' : 'hover:bg-slate-50'}`}><div className="flex-1"><span className={`font-bold ${selectedExtras.find(x => x.id === e.id) ? 'text-blue-800' : 'text-slate-700'}`}>{e.name}</span><span className="text-xs ml-2 text-slate-500 bg-white px-1.5 py-0.5 rounded border">+{e.value}{e.type === 'percent' ? '%' : (e.type === 'linear' ? '€/ml' : (e.type === 'area' ? '€/m²' : '€'))}</span></div>{selectedExtras.find(x => x.id === e.id) ? <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 ml-2 bg-white rounded-lg border shadow-sm p-0.5"><button onClick={() => updateExtraQty(e.id, -1)} className="px-2 hover:bg-slate-100 font-bold">-</button><span className="text-xs w-4 text-center font-bold">{selectedExtras.find(x => x.id === e.id).qty}</span><button onClick={() => updateExtraQty(e.id, 1)} className="px-2 hover:bg-slate-100 font-bold">+</button></div> : <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}</div>))}</div>
                                <div className="flex justify-between items-center pt-4 border-t"><div className="flex flex-col"><span className="text-xs text-slate-400 font-bold uppercase">Precio Final</span><span className="text-3xl font-black text-slate-800 tracking-tight">{calculatedPrice !== null ? formatCurrency(calculatedPrice) : '--'}</span></div><button onClick={addToQuote} disabled={!calculatedPrice} style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)', boxShadow: '0 8px 24px -4px rgba(37,99,235,0.4)', border: 'none', cursor: calculatedPrice ? 'pointer' : 'not-allowed', opacity: calculatedPrice ? 1 : 0.5 }} className="px-8 py-3.5 text-lg font-black uppercase tracking-wide rounded-2xl text-white transition-all duration-300"><span className="flex items-center justify-center gap-2"><Plus size={20} />AÑADIR</span></button></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className={`${mobileTab === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 bg-white md:border-l shadow-2xl flex-col z-20 h-full`}>
                <div className="p-5 border-b font-bold flex justify-between items-center bg-white shrink-0">
                    <span className="text-lg">Tu Presupuesto</span>
                    <div className="flex gap-2">
                        <StatusSelector
                            currentStatus={quoteMeta.status || 'pending'}
                            onStatusChange={(status) => setQuoteMeta({ ...quoteMeta, status })}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2">{cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50"><Calculator size={64} strokeWidth={1} /><p className="mt-4 font-medium">Carrito vacío</p></div>}{cart.map((i, idx) => (<CartSummaryItem key={i.id} item={i} idx={idx} onRemove={removeFromCart} onUpdateQty={updateQuantity} onMove={moveCartItem} />))}</div>
                <div className="bg-white border-t p-6 space-y-4 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30"><div className="grid grid-cols-2 gap-4 text-xs"><div><label className="text-slate-400 font-bold block mb-1">Descuento %</label><input type="number" className="input-saas text-right font-bold" value={financials.discountPercent} onChange={e => setFinancials({ ...financials, discountPercent: parseFloat(e.target.value) || 0 })} /></div><div><label className="text-slate-400 font-bold block mb-1">Entrega €</label><input type="number" className="input-saas text-right font-bold" value={financials.deposit} onChange={e => setFinancials({ ...financials, deposit: parseFloat(e.target.value) || 0 })} /></div></div><div className="space-y-1 py-2 border-t border-dashed"><div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{formatCurrency(grossTotal)}</span></div>{discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Ahorro</span><span>-{formatCurrency(discountAmount)}</span></div>}<div className="flex justify-between text-3xl font-black text-slate-800 tracking-tight"><span>TOTAL</span><span>{formatCurrency(grandTotal)}</span></div>{financials.deposit > 0 && <div className="flex justify-between text-sm font-bold text-slate-400 pt-1"><span>Restante</span><span>{formatCurrency(remainingBalance)}</span></div>}</div>                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        style={
                            saveStatus === 'saved'
                                ? { background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)', borderColor: '#059669', color: '#ffffff', boxShadow: '0 8px 24px -4px rgba(16,185,129,0.5)', transform: 'scale(1.03)' }
                                : saveStatus === 'saving'
                                    ? { background: '#eff6ff', borderColor: '#60a5fa', color: '#2563eb' }
                                    : { background: '#ffffff', borderColor: '#cbd5e1', color: '#334155' }
                        }
                        className="flex-1 h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-500 ease-out border-2"
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
                    <button onClick={() => {
                        setSaveStatus('idle');
                        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
                        setViewMode('print');
                    }} style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)', boxShadow: '0 8px 24px -4px rgba(124,58,237,0.5)', border: 'none' }} className="flex-1 h-14 rounded-xl font-black text-base flex items-center justify-center gap-2 text-white transition-all duration-300"><Printer size={20} /><span className="tracking-wide">Finalizar</span></button>
                </div></div>
            </div>
        </div>
    );
};

export default QuoteConfigurator;
