'use client';
import React, { useState, useMemo } from 'react';
import {
    Users, Box, BarChart2, Check, List, Target, X
} from 'lucide-react';

const formatCurrency = (amount) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);

const SimpleBarChart = ({ data, color }) => {
    if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-300 text-xs">Sin datos</div>;
    const max = Math.max(...data.map(d => d.value)) || 1; // Prevent div by zero
    return (<div className="h-48 flex items-end gap-2 p-2 border-b border-l border-slate-200">{data.map((d, i) => (<div key={i} className="flex-1 flex flex-col items-center group relative"> <div className="w-full bg-blue-100 rounded-t hover:bg-blue-200 transition-all relative group-hover:shadow-lg" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color }}> <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 transition-opacity z-10 whitespace-nowrap">{d.value}</span> </div> <span className="text-[10px] text-slate-500 mt-1 rotate-0 truncate w-full text-center">{d.label}</span> </div>))} </div>);
};
const SimplePieChart = ({ data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="flex items-center gap-6"><div className="w-32 h-32 rounded-full bg-slate-100 border flex items-center justify-center text-[10px] text-slate-400">Sin datos</div></div>;
    let currentAngle = 0;
    const gradientParts = data.map(d => { const percentage = (d.value / total) * 100; const start = currentAngle; currentAngle += percentage; return `${d.color} ${start}% ${currentAngle}%`; });
    const style = { background: `conic-gradient(${gradientParts.join(', ')})` };
    return (<div className="flex items-center gap-6"> <div className="w-32 h-32 rounded-full shadow-inner shrink-0" style={style}></div> <div className="flex-1 space-y-1"> {data.map((d, i) => (<div key={i} className="flex justify-between items-center text-xs"> <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div><span className="truncate max-w-[100px]">{d.label}</span></div> <span className="font-bold">{Math.round((d.value / total) * 100)}%</span> </div>))} </div> </div>);
};

const Dashboard = ({ history, products, clients, onNavigate, config }) => {
    const [salesPeriod, setSalesPeriod] = useState('all');
    const [quotesPeriod, setQuotesPeriod] = useState('all');
    const [activeModal, setActiveModal] = useState(null); // 'sales', 'pending', 'ranking', 'charts'
    const [recentLimit, setRecentLimit] = useState(5);

    // Helper for period check
    const isInPeriod = (dateStr, period) => {
        if (!dateStr || period === 'all') return true;
        const [d, m, y] = dateStr.split('/').map(Number);
        const date = new Date(y, m - 1, d);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (period === 'day') return diffDays <= 1;
        if (period === 'week') return diffDays <= 7;
        if (period === 'month') return now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
        if (period === 'year') return now.getFullYear() === date.getFullYear();
        return true;
    };

    const filteredSales = useMemo(() => history.filter(q => q.status === 'accepted' && isInPeriod(q.date, salesPeriod)), [history, salesPeriod]);
    const filteredQuotes = useMemo(() => history.filter(q => isInPeriod(q.date, quotesPeriod)), [history, quotesPeriod]);
    const pendingQuotes = useMemo(() => history.filter(q => (!q.status || q.status === 'pending')), [history]);

    const stats = useMemo(() => {
        const totalSales = filteredSales.reduce((acc, q) => acc + q.grandTotal, 0);
        const pendingAmount = pendingQuotes.reduce((acc, q) => acc + q.grandTotal, 0);
        const topProducts = {};
        history.forEach(q => q.items.forEach(i => { topProducts[i.product.name] = (topProducts[i.product.name] || 0) + i.quantity; }));
        const ranking = Object.entries(topProducts).sort((a, b) => b[1] - a[1]);
        const bestSeller = ranking[0];

        const statusCounts = { accepted: 0, rejected: 0, pending: 0 };
        history.forEach(q => { if (q.status === 'accepted') statusCounts.accepted++; else if (q.status === 'rejected') statusCounts.rejected++; else statusCounts.pending++; });

        const months = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months[d.toLocaleString('default', { month: 'short' })] = 0; }
        history.forEach(q => { if (q.status === 'accepted') { const [d, m, y] = q.date.split('/'); const date = new Date(y, m - 1, d); const key = date.toLocaleString('default', { month: 'short' }); if (months[key] !== undefined) months[key] += q.grandTotal; } });
        const chartData = Object.entries(months).map(([k, v]) => ({ label: k, value: Math.round(v) }));

        const sourceCounts = {};
        let totalSources = 0;
        history.forEach(q => {
            if (q.status === 'accepted') {
                const src = q.client.source || 'Desconocido';
                sourceCounts[src] = (sourceCounts[src] || 0) + 1;
                totalSources++;
            }
        });
        const sourceColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
        const sourceChartData = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value], index) => ({
                label,
                value,
                color: sourceColors[index % sourceColors.length]
            }));

        return { totalSales, pendingAmount, ranking, bestSeller, totalQuotes: filteredQuotes.length, statusCounts, chartData, sourceChartData, totalSources };
    }, [history, filteredSales, filteredQuotes, pendingQuotes]);

    // Modal Component
    const ModalList = ({ title, onClose, children, maxWidth = 'max-w-2xl' }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm modal-overlay animate-fade-in" onClick={onClose}>
            <div className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-pop`} onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X /></button></div>
                <div className="overflow-y-auto p-0">{children}</div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div><h1 className="text-3xl font-black text-slate-800">Hola, {config.name}</h1><p className="text-slate-500 text-sm mt-1">Resumen de actividad.</p></div>
                <div className="hidden md:block text-right"><p className="text-sm font-bold text-slate-400 uppercase">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Ventas Aceptadas */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-36 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-blue-200 shadow-xl relative overflow-visible cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setActiveModal('sales')}>
                    <div className="flex justify-between items-start z-10">
                        <span className="text-blue-200 font-bold text-xs uppercase">Ventas Aceptadas</span>
                        <select className="bg-white/20 text-white text-[10px] rounded border-none outline-none p-1 cursor-pointer hover:bg-white/30" value={salesPeriod} onClick={e => e.stopPropagation()} onChange={e => setSalesPeriod(e.target.value)}>
                            <option className="text-black" value="all">Total</option><option className="text-black" value="day">Hoy</option><option className="text-black" value="week">Semana</option><option className="text-black" value="month">Mes</option><option className="text-black" value="year">Año</option>
                        </select>
                    </div>
                    <div className="z-10"><span className="text-3xl font-black">{formatCurrency(stats.totalSales)}</span><p className="text-xs text-blue-200 mt-1">{filteredSales.length} pedidos</p></div>
                    <Check className="absolute -bottom-4 -right-4 text-white opacity-10 w-24 h-24 rotate-12" />
                </div>

                {/* Pendiente */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-36 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setActiveModal('pending')}>
                    <div className="flex justify-between items-start"><span className="text-slate-400 font-bold text-xs uppercase">Pendiente</span><div className="p-1 bg-orange-100 rounded text-orange-600"><List size={14} /></div></div>
                    <div><span className="text-3xl font-black text-slate-800">{formatCurrency(stats.pendingAmount)}</span><p className="text-xs text-slate-400 mt-1">{pendingQuotes.length} presupuestos</p></div>
                </div>

                {/* Presupuestos Totales / Graficas */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-36 cursor-pointer hover:border-purple-300 transition-colors" onClick={() => setActiveModal('charts')}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-400 font-bold text-xs uppercase">Presupuestos</span>
                        <div className="p-1 bg-purple-100 rounded text-purple-600"><BarChart2 size={14} /></div>
                    </div>
                    <div><span className="text-3xl font-black text-slate-800">{stats.totalQuotes}</span><p className="text-xs text-slate-400 mt-1">Ver Análisis Gráfico</p></div>
                </div>

                {/* Top Producto */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-36 cursor-pointer hover:border-green-300 transition-colors" onClick={() => setActiveModal('ranking')}>
                    <div className="flex justify-between items-start"><span className="text-slate-400 font-bold text-xs uppercase">Top Producto</span><div className="p-1 bg-green-100 rounded text-green-600"><Box size={14} /></div></div>
                    <div className="truncate"><span className="text-lg font-bold text-slate-800 leading-tight block truncate">{stats.bestSeller ? stats.bestSeller[0] : '---'}</span><span className="text-xs text-slate-400">{stats.bestSeller ? `${stats.bestSeller[1]} uds vendidas` : 'Sin datos'}</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-lg text-slate-700">Recientes</h3>
                    {history.length === 0 ? <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">No hay actividad reciente.</div> : history.slice(0, recentLimit).map(q => (
                        <div key={q.id} onClick={() => onNavigate(q)} className="bg-white p-4 rounded-xl border hover:shadow-md cursor-pointer transition-all flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${q.status === 'accepted' ? 'bg-emerald-500' : q.status === 'rejected' ? 'bg-red-400' : 'bg-slate-400'}`}>{q.client.name.charAt(0)}</div>
                                <div><p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{q.client.name}</p><p className="text-xs text-slate-500">#{q.number} · {q.date}</p></div>
                            </div>
                            <div className="text-right"><p className="font-bold text-slate-700">{formatCurrency(q.grandTotal)}</p><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${q.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{q.status === 'accepted' ? 'Aceptado' : q.status === 'rejected' ? 'Rechazado' : 'Pendiente'}</span></div>
                        </div>
                    ))}
                    {history.length > recentLimit && <button onClick={() => setRecentLimit(prev => prev + 5)} className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 rounded border border-blue-100 dashed">VER MÁS ANTIGUOS</button>}
                </div>
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-700">Acciones</h3>
                    <button onClick={() => onNavigate(null, 'quote')} className="w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-800 transition-colors"><div className="bg-white p-2 rounded-full shadow-sm text-blue-600"><div style={{ fontSize: 18, fontWeight: 'bold' }}>+</div></div><div className="text-left"><span className="block font-bold">Nuevo Presupuesto</span></div></button>
                    <button onClick={() => onNavigate(null, 'prods')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-700 transition-colors"><div className="bg-white p-2 rounded-full shadow-sm text-slate-500"><Box size={18} /></div><div className="text-left"><span className="block font-bold">Gestionar Productos</span></div></button>
                    <button onClick={() => onNavigate(null, 'clients')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-700 transition-colors"><div className="bg-white p-2 rounded-full shadow-sm text-slate-500"><Users size={18} /></div><div className="text-left"><span className="block font-bold">Base de Clientes</span></div></button>
                </div>
            </div>

            {/* MODALES */}
            {activeModal === 'sales' && <ModalList title={`Ventas Aceptadas (${salesPeriod === 'all' ? 'Total' : salesPeriod})`} onClose={() => setActiveModal(null)}>
                {filteredSales.length === 0 && <p className="p-4 text-center text-slate-500">No hay ventas en este periodo.</p>}
                {filteredSales.map(q => <div key={q.id} onClick={() => { setActiveModal(null); onNavigate(q) }} className="p-4 border-b hover:bg-slate-50 cursor-pointer flex justify-between"><div><p className="font-bold">{q.client.name}</p><p className="text-xs text-slate-500">{q.date}</p></div><span className="font-bold text-green-600">{formatCurrency(q.grandTotal)}</span></div>)}
            </ModalList>}

            {activeModal === 'pending' && <ModalList title="Presupuestos Pendientes" onClose={() => setActiveModal(null)}>
                {pendingQuotes.map(q => <div key={q.id} onClick={() => { setActiveModal(null); onNavigate(q) }} className="p-4 border-b hover:bg-slate-50 cursor-pointer flex justify-between"><div><p className="font-bold">{q.client.name}</p><p className="text-xs text-slate-500">{q.date}</p></div><span className="font-bold text-orange-600">{formatCurrency(q.grandTotal)}</span></div>)}
            </ModalList>}

            {activeModal === 'ranking' && <ModalList title="Ranking de Productos" onClose={() => setActiveModal(null)}>
                <table className="w-full text-sm"><thead className="bg-slate-100"><tr className="text-left"><th className="p-3">Producto</th><th className="p-3 text-right">Unidades</th></tr></thead><tbody>{stats.ranking.map(([name, qty], i) => <tr key={i} className="border-b"><td className="p-3 font-medium flex items-center gap-2"><span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold text-white ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>{name}</td><td className="p-3 text-right font-bold">{qty}</td></tr>)}</tbody></table>
            </ModalList>}

            {activeModal === 'charts' && <ModalList title="Análisis Gráfico Avanzado" onClose={() => setActiveModal(null)} maxWidth="max-w-5xl">
                <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart2 size={18} /> Ventas últimos 6 meses</h4>
                        <SimpleBarChart data={stats.chartData} color={config.color} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 mb-4">Estado Presupuestos</h4>
                        <SimplePieChart data={[
                            { label: 'Aceptado', value: stats.statusCounts.accepted, color: '#10b981' },
                            { label: 'Rechazado', value: stats.statusCounts.rejected, color: '#ef4444' },
                            { label: 'Pendiente', value: stats.statusCounts.pending, color: '#f59e0b' }
                        ]} />
                    </div>

                    <div className="md:col-span-3 border-t pt-6">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Target size={18} className="text-blue-500" /> Fuentes de Adquisición (Clientes Aceptados)</h4>
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            {stats.sourceChartData.length > 0 ? (
                                <>
                                    <SimplePieChart data={stats.sourceChartData} />
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-500 mb-2">Desglose detallado:</p>
                                        {stats.sourceChartData.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                    <span className="font-bold text-sm text-slate-700">{d.label}</span>
                                                </div>
                                                <div className="text-xs">
                                                    <span className="font-bold mr-2">{d.value} clientes</span>
                                                    <span className="text-slate-400">({Math.round((d.value / stats.totalSources) * 100)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2 text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                                    Aún no hay datos de origen registrados en ventas aceptadas.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-3 grid grid-cols-3 gap-4 border-t pt-6">
                        <div className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-xs text-slate-500 font-bold uppercase">Total Generado</p><p className="text-xl font-black text-slate-800">{formatCurrency(stats.totalSales)}</p></div>
                        <div className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-xs text-slate-500 font-bold uppercase">Ticket Medio</p><p className="text-xl font-black text-slate-800">{stats.statusCounts.accepted > 0 ? formatCurrency(stats.totalSales / stats.statusCounts.accepted) : '0 €'}</p></div>
                        <div className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-xs text-slate-500 font-bold uppercase">Tasa Conversión</p><p className="text-xl font-black text-slate-800">{history.length > 0 ? Math.round((stats.statusCounts.accepted / history.length) * 100) : 0}%</p></div>
                    </div>
                </div>
            </ModalList>}
        </div>
    );
};

export default Dashboard;
