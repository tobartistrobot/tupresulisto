'use client';
import React, { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { Search, Upload, Trash, ArrowLeft, Download, Plus, Edit, Users, Undo } from 'lucide-react';

import StatusSelector from './StatusSelector';

const formatCurrency = (amount) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
const safeStr = (s) => String(s || '').trim().toLowerCase();

const ClientManager = ({ quotesHistory, deletedHistory, onLoadQuote, onDeleteClient, onDeleteQuote, onRestoreItem, onNewQuoteForClient, onPermanentDelete, onUpdateStatus, onImportClient, className }) => {
    const [search, setSearch] = useState('');
    const [selKey, setSelKey] = useState(null);
    const [showTrash, setShowTrash] = useState(false);
    const toast = useToast();

    const clients = useMemo(() => {
        const map = {};
        quotesHistory.forEach(q => {
            const k = (q.client.name + q.client.phone).trim();
            if (!map[k]) map[k] = { ...q.client, key: k, quotes: [], total: 0 };
            map[k].quotes.push(q);
            map[k].total += q.grandTotal;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [quotesHistory]);

    const activeClient = useMemo(() => clients.find(c => c.key === selKey), [clients, selKey]);
    const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

    const handleExportClient = (c) => {
        const dataToExport = { version: "1.0", type: "client_card", exported_at: new Date().toISOString(), client: { name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city, source: c.source, measurements: c.measurements || [] } };
        const b = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `Cliente_${c.name.replace(/[^a-z0-9]/gi, '_')}.json`; a.click();
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if ((data.type === "client_card" || data.type === "gova_client_card") && data.client) { onImportClient(data.client); toast("Cliente importado correctamente", "success"); } else { toast("Formato de archivo no válido", "error"); }
            } catch (err) { toast("Error al leer archivo", "error"); }
        }; reader.readAsText(file);
    };

    if (showTrash) return (
        <div className={`p-6 md:p-10 h-full overflow-hidden flex flex-col ${className} animate-fade-in`}>
            <div className="flex justify-between mb-6 items-center"><h2 className="text-2xl font-black flex gap-2 text-slate-800 dark:text-slate-100"><Trash className="text-red-500" /> Papelera</h2><button onClick={() => setShowTrash(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-slate-600 dark:text-slate-300">Volver</button></div>
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex-1 overflow-y-auto shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-left border-b dark:border-slate-700 sticky top-0"><tr><th className="p-4 font-bold text-slate-500 dark:text-slate-400">Elemento</th><th className="p-4 text-right font-bold text-slate-500 dark:text-slate-400">Acciones</th></tr></thead>
                    <tbody>
                        {deletedHistory.map((it, i) => (
                            <tr key={i} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-xs uppercase bg-slate-200 dark:bg-slate-700 dark:text-slate-300 w-fit px-1 rounded mb-1">{it.type === 'client' ? 'Cliente' : 'Presupuesto'}</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{it.type === 'client' ? it.data.name : `#${it.data.number} (${formatCurrency(it.data.grandTotal)})`}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Borrado: {new Date(it.deletedAt).toLocaleString()}</p>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => onRestoreItem(it)} className="py-1 px-3 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1"><Undo size={14} /> Recuperar</button>
                                        <button onClick={() => { if (confirm("Irreversible")) onPermanentDelete(it) }} className="py-1 px-3 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-1"><Trash size={14} /> Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className={`flex h-full p-4 md:p-6 gap-6 ${className} app-tab`}>
            {/* Panel izquierdo — lista de clientes */}
            <div className={`${selKey ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex-col h-full shadow-lg overflow-hidden`}>
                <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-2 items-center">
                    <div className="relative flex-1 group"><Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500" size={16} /><input className="w-full pl-9 p-2 border dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all bg-white dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <label className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors" title="Importar Cliente"><Upload size={20} /><input type="file" className="hidden" onChange={handleImportFile} /></label>
                    <button onClick={() => setShowTrash(true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto">{filtered.map((c) => <div key={c.key} onClick={() => setSelKey(c.key)} className={`p-4 border-b dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selKey === c.key ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600 shadow-inner' : ''}`}><div className="flex justify-between items-center"><h4 className="font-bold text-slate-800 dark:text-slate-100">{c.name}</h4><span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-slate-500 dark:text-slate-400">{c.quotes.length} pres.</span></div><div className="flex justify-between text-xs mt-1 text-slate-500 dark:text-slate-400"><span>{c.phone}</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.total)}</span></div></div>)}</div>
            </div>

            {/* Panel derecho — detalle del cliente */}
            <div className={`${!selKey ? 'hidden md:flex' : 'flex'} w-full md:flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex-col relative h-full shadow-lg overflow-hidden`}>
                {activeClient ? (
                    <>
                        <div className="p-4 md:p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
                            <button onClick={() => setSelKey(null)} className="md:hidden text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit px-3 py-1.5 rounded-full shadow-sm"><ArrowLeft className="mr-1" size={14} /> VOLVER</button>

                            <div className="flex flex-col xl:flex-row justify-between items-start gap-6 relative z-10 w-full min-w-0">
                                {/* Datos de Cliente (Protegidos contra Overflow) */}
                                <div className="flex-1 w-full min-w-0">
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 break-words w-full">{activeClient.name}</h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                                        {activeClient.phone && <span className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700 font-mono shadow-sm flex items-center shrink-0">{activeClient.phone}</span>}
                                        {activeClient.email && <span className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700 truncate shadow-sm max-w-full inline-block">{activeClient.email}</span>}
                                    </div>
                                    {activeClient.address && <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 flex gap-1 items-start bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50"><span className="shrink-0 mt-0.5 opacity-50">📍</span> <span className="break-words w-full">{activeClient.address}</span></p>}
                                </div>

                                {/* Métricas y Acciones (Alineación Responsiva) */}
                                <div className="flex flex-col items-start xl:items-end w-full xl:w-auto shrink-0 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Volumen de Negocio</div>
                                    <div className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 mb-3">{formatCurrency(activeClient.total)}</div>

                                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                        <button onClick={() => handleExportClient(activeClient)} className="flex-1 xl:flex-none py-2 px-4 text-xs bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-colors"><Download size={14} /> Exportar</button>
                                        <button onClick={() => { if (confirm("¿Eliminar toda la ficha de cliente y sus presupuestos?")) { onDeleteClient(activeClient); setSelKey(null); } }} className="flex-1 xl:flex-none py-2 px-4 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 font-bold flex items-center justify-center gap-1.5 transition-colors"><Trash size={14} /> Eliminar Ficha</button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 relative z-10 w-full min-w-0">
                                <button onClick={() => onNewQuoteForClient(activeClient)} className="btn-primary w-full shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 py-3.5"><Plus size={20} /> Crear Nuevo Presupuesto</button>
                            </div>

                            {/* Decorative Blur Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                            {activeClient.quotes.map(q => (
                                <div key={q.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:justify-between md:items-center hover:shadow-md dark:hover:shadow-black/20 bg-white dark:bg-slate-800 transition-shadow group gap-4">
                                    <div className="flex justify-between md:justify-start items-center md:gap-4 w-full md:w-auto">
                                        <div>
                                            <span className="font-black text-lg text-slate-700 dark:text-slate-200">#{q.number}</span>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{q.date}</p>
                                        </div>
                                        <div className="md:hidden font-bold text-slate-800 dark:text-slate-100">
                                            {formatCurrency(q.grandTotal)}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700 md:border-none">
                                        <StatusSelector currentStatus={q.status || 'pending'} onStatusChange={(val) => onUpdateStatus(q.id, val)} />
                                        <div className="flex items-center gap-1 md:gap-4">
                                            <span className="hidden md:block font-bold text-slate-800 dark:text-slate-100">
                                                {formatCurrency(q.grandTotal)}
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => onLoadQuote(q)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2" title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Borrar presupuesto?")) onDeleteQuote(q); }} className="text-slate-300 dark:text-slate-500 hover:text-red-600 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-10 text-center"><div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-full mb-4"><Users size={48} className="opacity-50" /></div><p className="font-medium dark:text-slate-500">Selecciona un cliente para ver su historial</p></div>
                )}
            </div>
        </div>
    );
};

export default ClientManager;
