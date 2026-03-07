'use client';
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Trash, Plus, Ban, Wand, Sparkles, HelpCircle, X } from 'lucide-react';
import { round2, sanitizeFloat } from '../../utils/mathUtils';

const MatrixEditor = ({ matrix, onChange }) => {
    const safe = { widths: matrix?.widths || [1000], heights: matrix?.heights || [1000], prices: matrix?.prices || [[0]] };
    const [step, setStep] = useState(100);
    const [showAuto, setShowAuto] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const toast = useToast();
    const [autoCfg, setAutoCfg] = useState({ wMin: 600, wMax: 2000, wStep: 200, hMin: 600, hMax: 2000, hStep: 200 });

    const updateDim = (axis, idx, val) => { const n = [...safe[axis]]; n[idx] = parseInt(val) || 0; onChange({ ...safe, [axis]: n }); };
    const addDim = (axis) => { const last = safe[axis][safe[axis].length - 1] || 0; const next = last + parseInt(step); const n = [...safe[axis], next]; const p = axis === 'heights' ? [...safe.prices, Array(safe.widths.length).fill(0)] : safe.prices.map(r => [...r, 0]); onChange({ ...safe, [axis]: n, prices: p }); };
    const removeDim = (axis, idx) => { if (safe[axis].length <= 1) return toast("Mínimo 1 fila/columna", "error"); const n = safe[axis].filter((_, i) => i !== idx); let p = axis === 'heights' ? safe.prices.filter((_, i) => i !== idx) : safe.prices.map(row => row.filter((_, i) => i !== idx)); onChange({ ...safe, [axis]: n, prices: p }); };
    const updatePrice = (r, c, val) => { const p = [...safe.prices]; p[r] = [...p[r]]; p[r][c] = (val === null || val === '' || isNaN(val)) ? 0 : parseFloat(val); onChange({ ...safe, prices: p }); };
    const autoFillPrices = () => { const rMax = safe.heights.length - 1; const cMax = safe.widths.length - 1; const pTL = sanitizeFloat(safe.prices[0][0]); const pTR = sanitizeFloat(safe.prices[0][cMax]); const pBL = sanitizeFloat(safe.prices[rMax][0]); const pBR = sanitizeFloat(safe.prices[rMax][cMax]); if (!pTL || !pTR || !pBL || !pBR) return toast("Rellena las 4 esquinas", "error"); const newPrices = safe.prices.map((row, r) => row.map((val, c) => { const u = (safe.widths[c] - safe.widths[0]) / (safe.widths[cMax] - safe.widths[0]); const v = (safe.heights[r] - safe.heights[0]) / (safe.heights[rMax] - safe.heights[0]); return round2(pTL * (1 - u) * (1 - v) + pTR * u * (1 - v) + pBL * (1 - u) * v + pBR * u * v); })); onChange({ ...safe, prices: newPrices }); toast("Precios calculados", "success"); };
    const generateMatrixStructure = () => { const ws = []; for (let i = parseInt(autoCfg.wMin); i <= parseInt(autoCfg.wMax); i += parseInt(autoCfg.wStep)) ws.push(i); const hs = []; for (let i = parseInt(autoCfg.hMin); i <= parseInt(autoCfg.hMax); i += parseInt(autoCfg.hStep)) hs.push(i); if (ws.length === 0 || hs.length === 0) return toast("Rango inválido", "error"); onChange({ widths: ws, heights: hs, prices: Array(hs.length).fill().map(() => Array(ws.length).fill(0)) }); setShowAuto(false); toast("Tabla regenerada", "success"); };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 justify-between flex-wrap">
                <div className="flex gap-2 items-center"><span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Paso:</span><input type="number" className="w-16 p-1 border dark:border-slate-700 rounded text-sm text-center font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800" value={step} onChange={e => setStep(e.target.value)} /></div>
                <div className="flex gap-2">
                    <button onClick={autoFillPrices} className="flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                        <Sparkles size={14} /> Cálculo Automático
                    </button>
                    <button onClick={() => setShowHelpModal(true)} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                        <HelpCircle size={16} />
                    </button>
                    <button onClick={() => setShowAuto(!showAuto)} className="flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Wand size={14} /> Configurar tabla
                    </button>
                </div>
            </div>
            {showAuto && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/40 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in mb-4 shadow-inner">
                    <div className="col-span-1 md:col-span-2 text-sm text-blue-800 dark:text-blue-300 font-extrabold flex items-center gap-2">
                        <Wand size={16} /> Configuración Rápida
                    </div>

                    {/* SECTION WIDTH */}
                    <div>
                        <h4 className="font-bold text-[10px] uppercase text-blue-400 dark:text-blue-500 mb-2 border-b border-blue-200 dark:border-blue-800/60 pb-1">Ancho (X)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Min Ancho (mm)</label>
                                <input
                                    placeholder="600"
                                    className="w-full p-2 text-xs border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
                                    value={autoCfg.wMin}
                                    onChange={e => setAutoCfg({ ...autoCfg, wMin: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Max Ancho (mm)</label>
                                <input
                                    placeholder="2000"
                                    className="w-full p-2 text-xs border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
                                    value={autoCfg.wMax}
                                    onChange={e => setAutoCfg({ ...autoCfg, wMax: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Intervalo (mm)</label>
                                <input
                                    placeholder="200"
                                    className="w-full p-2 text-xs border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
                                    value={autoCfg.wStep}
                                    onChange={e => setAutoCfg({ ...autoCfg, wStep: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION HEIGHT */}
                    <div>
                        <h4 className="font-bold text-[10px] uppercase text-blue-400 dark:text-blue-500 mb-2 border-b border-blue-200 dark:border-blue-800/60 pb-1">Alto (Y)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Min Alto (mm)</label>
                                <input
                                    placeholder="600"
                                    className="w-full p-2 text-xs border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
                                    value={autoCfg.hMin}
                                    onChange={e => setAutoCfg({ ...autoCfg, hMin: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Max Alto (mm)</label>
                                <input
                                    placeholder="2000"
                                    className="w-full p-2 text-xs border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
                                    value={autoCfg.hMax}
                                    onChange={e => setAutoCfg({ ...autoCfg, hMax: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Intervalo (mm)</label>
                                <input
                                    placeholder="200"
                                    className="w-full p-2 text-xs border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
                                    value={autoCfg.hStep}
                                    onChange={e => setAutoCfg({ ...autoCfg, hStep: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={generateMatrixStructure}
                        className="col-span-1 md:col-span-2 py-3 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                    >
                        <Sparkles size={16} /> Generar Estructura de Tabla
                    </button>
                </div>
            )}

            {/* MATRIX TABLE WRAPPER CON SCROLL Y STICKY */}
            <div className="overflow-x-auto overflow-y-auto border dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800 max-h-[600px] relative custom-scrollbar">
                <table className="min-w-full text-xs border-collapse">
                    <thead>
                        <tr>
                            {/* Esquina Sticky Z-30 */}
                            <th className="sticky-corner bg-slate-200 dark:bg-slate-900 p-2 border-b dark:border-slate-700 border-r dark:border-r-slate-700 text-slate-500 dark:text-slate-400 font-black tracking-tighter text-[10px] min-w-[80px] shadow-[2px_2px_5px_rgba(0,0,0,0.05)]">
                                ALTO \ ANCHO
                            </th>
                            {safe.widths.map((w, i) =>
                                <th key={`w${i}`} className="sticky-row-header bg-slate-50 dark:bg-slate-900/60 p-1 min-w-[70px] border-b dark:border-slate-700 border-r border-slate-100 dark:border-r-slate-700 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex flex-col items-center">
                                        <input type="number" className="w-full bg-transparent text-center font-bold text-slate-700 dark:text-slate-200 outline-none mb-1 text-sm" value={w} onChange={e => updateDim('widths', i, e.target.value)} />
                                        <button onClick={() => removeDim('widths', i)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={10} /></button>
                                    </div>
                                </th>
                            )}
                            <th className="sticky-row-header p-1 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 min-w-[40px]">
                                <button onClick={() => addDim('widths')} className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 p-1 rounded w-full flex justify-center"><Plus size={14} /></button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {safe.heights.map((h, r) =>
                            <tr key={`r${r}`}>
                                {/* Primera columna Sticky Z-10 */}
                                <td className="sticky-col bg-slate-50 dark:bg-slate-900/60 p-1 border-r border-b border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[80px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    <div className="flex flex-col items-center">
                                        <input type="number" className="w-full bg-transparent text-center outline-none text-sm dark:text-slate-200" value={h} onChange={e => updateDim('heights', r, e.target.value)} />
                                        <button onClick={() => removeDim('heights', r)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={10} /></button>
                                    </div>
                                </td>
                                {safe.widths.map((_, c) => {
                                    const val = safe.prices[r]?.[c] ?? 0;
                                    return <td key={`c${c}`} className="p-0 border-r border-b border-slate-100 dark:border-slate-700 relative group transition-colors hover:z-0 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                        <input type="number" className="w-full h-12 text-center outline-none bg-transparent font-medium text-slate-600 dark:text-slate-300 focus:text-blue-700 dark:focus:text-blue-300 focus:font-bold" value={val} onChange={e => updatePrice(r, c, e.target.value)} />
                                        <button onClick={() => updatePrice(r, c, 0)} className="absolute top-0 right-0 text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Ban size={14} /></button>
                                    </td>;
                                })}
                            </tr>
                        )}
                        <tr>
                            <td className="sticky-col text-center p-1 border-r dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 min-w-[80px]">
                                <button onClick={() => addDim('heights')} className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 p-1 rounded w-full flex justify-center"><Plus size={14} /></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* HELP MODAL */}
            {
                showHelpModal && (
                    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative border border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-sm transform -rotate-3">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">¿Cómo funciona el<br /><span className="text-indigo-600 dark:text-indigo-400">Cálculo Automático</span>?</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    No necesitas rellenar todas las celdas. El sistema utiliza interpolación matemática para calcular los precios intermedios.
                                </p>

                                <ol className="space-y-4">
                                    <li className="flex gap-4">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                                        <div className="text-sm">
                                            <b className="block text-slate-800 dark:text-slate-100 mb-0.5">Define los rangos</b>
                                            <span className="text-slate-500 dark:text-slate-400">Configura el ancho y alto de tu tabla con el botón "Configurar tabla".</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                                        <div className="text-sm">
                                            <b className="block text-slate-800 dark:text-slate-100 mb-0.5">Rellena las 4 Esquinas</b>
                                            <span className="text-slate-500 dark:text-slate-400">Escribe el precio <b>solo</b> en la primera y última celda de cada eje.</span>
                                            <div className="mt-2 grid grid-cols-2 gap-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-24 opacity-75">
                                                <div className="h-4 bg-green-400 rounded-sm"></div>
                                                <div className="h-4 bg-green-400 rounded-sm"></div>
                                                <div className="h-4 bg-green-400 rounded-sm"></div>
                                                <div className="h-4 bg-green-400 rounded-sm"></div>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                                        <div className="text-sm">
                                            <b className="block text-indigo-600 dark:text-indigo-400 mb-0.5">Pulsa el botón Mágico</b>
                                            <span className="text-slate-500 dark:text-slate-400">Haz clic en "Cálculo Automático" y se rellenarán los huecos.</span>
                                        </div>
                                    </li>
                                </ol>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                <button
                                    onClick={() => setShowHelpModal(false)}
                                    className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-lg"
                                >
                                    ¡Entendido!
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MatrixEditor;
