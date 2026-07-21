'use client';
import React, { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { Search, Upload, Trash, ArrowLeft, Download, Plus, Edit, Users, Undo, Phone, Mail } from 'lucide-react';

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
        <div className={`flex h-full p-2 md:p-6 gap-2 md:gap-6 ${className} app-tab`}>
            {/* Panel izquierdo — lista de clientes */}
            <div className={`${selKey ? 'hidden md:flex' : 'flex'} w-full md:w-[35%] lg:w-1/3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex-col h-full shadow-lg overflow-hidden`}>
                <div className="p-3 md:p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-2 items-center shrink-0">
                    <div className="relative flex-1 group min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
                        <input className="w-full pl-9 pr-3 py-2.5 md:p-2 md:pl-9 border dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all bg-white dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <label className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl cursor-pointer transition-colors" title="Importar Cliente">
                        <Upload size={20} />
                        <input type="file" className="hidden" onChange={handleImportFile} />
                    </label>
                    <button onClick={() => setShowTrash(true)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filtered.map((c) => (
                        <div key={c.key} onClick={() => setSelKey(c.key)} className={`p-4 border-b dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selKey === c.key ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600 shadow-inner' : ''}`}>
                            <div className="flex justify-between items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 w-full flex-1">{c.name}</h4>
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 shrink-0">{c.quotes.length} pres.</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-1 text-slate-500 dark:text-slate-400">
                                <span className="truncate">{c.phone}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">{formatCurrency(c.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel derecho — detalle del cliente */}
            <div className={`${!selKey ? 'hidden md:flex' : 'flex'} w-full md:flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex-col relative h-full shadow-lg overflow-hidden`}>
                {activeClient ? (
                    <>
                        <div className="p-3 md:p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden shrink-0">
                            <button onClick={() => setSelKey(null)} className="md:hidden text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit px-3 py-1.5 rounded-full shadow-sm"><ArrowLeft className="mr-1" size={14} /> VOLVER</button>

                            {/* Nombre + Volumen (compacto en móvil) */}
                            <div className="flex items-start justify-between gap-3 relative z-10 w-full min-w-0">
                                <h2 className="text-2xl md:text-3xl xl:text-4xl font-black text-slate-800 dark:text-slate-100 break-words leading-tight min-w-0">{activeClient.name}</h2>
                                <div className="text-right shrink-0">
                                    <div className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Volumen</div>
                                    <div className="text-lg md:text-2xl xl:text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">{formatCurrency(activeClient.total)}</div>
                                </div>
                            </div>

                            {/* Contacto compacto (chips que envuelven) */}
                            {(activeClient.phone || activeClient.email || activeClient.address) && (
                                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300 relative z-10 min-w-0">
                                    {activeClient.phone && <a href={`tel:${activeClient.phone}`} className="bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border dark:border-slate-700 font-mono shadow-sm flex items-center gap-1.5 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"><Phone size={12} className="text-blue-500 shrink-0" /> {activeClient.phone}</a>}
                                    {activeClient.email && <a href={`mailto:${activeClient.email}`} className="bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border dark:border-slate-700 shadow-sm flex items-center gap-1.5 break-all max-w-full hover:border-blue-400 dark:hover:border-blue-500 transition-colors"><Mail size={12} className="text-slate-400 shrink-0" /> <span className="truncate">{activeClient.email}</span></a>}
                                    {activeClient.address && <span className="bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border dark:border-slate-700 shadow-sm flex items-center gap-1.5 min-w-0"><span className="shrink-0 opacity-60">📍</span> <span className="truncate">{activeClient.address}</span></span>}
                                </div>
                            )}

                            {/* Acciones: CTA principal + iconos compactos */}
                            <div className="mt-3 flex gap-2 relative z-10 w-full min-w-0">
                                <button onClick={() => onNewQuoteForClient(activeClient)} className="btn-primary flex-1 !px-3 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 py-3"><Plus size={20} className="shrink-0" /> <span className="truncate">Nuevo Presupuesto</span></button>
                                <button onClick={() => handleExportClient(activeClient)} title="Exportar ficha" className="shrink-0 w-12 min-h-[48px] flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Download size={18} /></button>
                                <button onClick={() => { if (confirm('¿Eliminar toda la ficha de cliente y sus presupuestos?')) { onDeleteClient(activeClient); setSelKey(null); } }} title="Eliminar ficha" className="shrink-0 w-12 min-h-[48px] flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Trash size={18} /></button>
                            </div>

                            {/* Decorative Blur Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-slate-50/50 dark:bg-slate-900/30 pb-24">
                            {activeClient.quotes.map(q => (
                                <div key={q.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5 flex flex-col xl:flex-row xl:justify-between xl:items-center hover:shadow-md dark:hover:shadow-black/20 bg-white dark:bg-slate-800 transition-all group gap-4">
                                    <div className="flex justify-between xl:justify-start items-center gap-4 w-full xl:w-auto">
                                        <div className="flex flex-col">
                                            <span className="font-black text-xl text-slate-800 dark:text-slate-100">#{q.number}</span>
                                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">{q.date}</p>
                                        </div>
                                        <div className="xl:hidden font-black text-lg text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            {formatCurrency(q.grandTotal)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between xl:justify-end gap-3 w-full xl:w-auto pt-4 xl:pt-0 border-t border-slate-100 dark:border-slate-700/50 xl:border-none">
                                        <div className="min-w-0 flex-1 xl:flex-none">
                                            <StatusSelector currentStatus={q.status || 'pending'} onStatusChange={(val) => onUpdateStatus(q.id, val)} className="h-[44px] !w-full xl:w-auto flex items-center" />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="hidden xl:flex font-black text-lg text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 px-4 h-[44px] rounded-xl border border-slate-100 dark:border-slate-700/50 items-center justify-center">
                                                {formatCurrency(q.grandTotal)}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => onLoadQuote(q)} className="h-[44px] w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors shrink-0" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Borrar presupuesto definitivo?")) onDeleteQuote(q); }} className="h-[44px] w-[44px] flex items-center justify-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors shrink-0" title="Borrar">
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-10 text-center">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-3xl md:rounded-full mb-4 shadow-sm"><Users size={48} className="opacity-50" /></div>
                        <p className="font-medium dark:text-slate-500">Selecciona un cliente para ver su historial</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientManager;
