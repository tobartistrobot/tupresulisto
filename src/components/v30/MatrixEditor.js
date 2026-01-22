'use client';
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Trash, Plus, Ban, Wand, Sparkles } from 'lucide-react';

const MatrixEditor = ({ matrix, onChange }) => {
    const safe = { widths: matrix?.widths || [1000], heights: matrix?.heights || [1000], prices: matrix?.prices || [[0]] };
    const [step, setStep] = useState(100);
    const [showAuto, setShowAuto] = useState(false);
    const toast = useToast();
    const [autoCfg, setAutoCfg] = useState({ wMin: 600, wMax: 2000, wStep: 200, hMin: 600, hMax: 2000, hStep: 200 });

    const updateDim = (axis, idx, val) => { const n = [...safe[axis]]; n[idx] = parseInt(val) || 0; onChange({ ...safe, [axis]: n }); };
    const addDim = (axis) => { const last = safe[axis][safe[axis].length - 1] || 0; const next = last + parseInt(step); const n = [...safe[axis], next]; const p = axis === 'heights' ? [...safe.prices, Array(safe.widths.length).fill(0)] : safe.prices.map(r => [...r, 0]); onChange({ ...safe, [axis]: n, prices: p }); };
    const removeDim = (axis, idx) => { if (safe[axis].length <= 1) return toast("Mínimo 1 fila/columna", "error"); const n = safe[axis].filter((_, i) => i !== idx); let p = axis === 'heights' ? safe.prices.filter((_, i) => i !== idx) : safe.prices.map(row => row.filter((_, i) => i !== idx)); onChange({ ...safe, [axis]: n, prices: p }); };
    const updatePrice = (r, c, val) => { const p = [...safe.prices]; p[r] = [...p[r]]; p[r][c] = val === null ? null : parseFloat(val); onChange({ ...safe, prices: p }); };
    const autoFillPrices = () => { const rMax = safe.heights.length - 1; const cMax = safe.widths.length - 1; const pTL = parseFloat(safe.prices[0][0]) || 0; const pTR = parseFloat(safe.prices[0][cMax]) || 0; const pBL = parseFloat(safe.prices[rMax][0]) || 0; const pBR = parseFloat(safe.prices[rMax][cMax]) || 0; if (!pTL || !pTR || !pBL || !pBR) return toast("Rellena las 4 esquinas", "error"); const newPrices = safe.prices.map((row, r) => row.map((val, c) => { const u = (safe.widths[c] - safe.widths[0]) / (safe.widths[cMax] - safe.widths[0]); const v = (safe.heights[r] - safe.heights[0]) / (safe.heights[rMax] - safe.heights[0]); return Math.round(pTL * (1 - u) * (1 - v) + pTR * u * (1 - v) + pBL * (1 - u) * v + pBR * u * v); })); onChange({ ...safe, prices: newPrices }); toast("Precios calculados", "success"); };
    const generateMatrixStructure = () => { const ws = []; for (let i = parseInt(autoCfg.wMin); i <= parseInt(autoCfg.wMax); i += parseInt(autoCfg.wStep)) ws.push(i); const hs = []; for (let i = parseInt(autoCfg.hMin); i <= parseInt(autoCfg.hMax); i += parseInt(autoCfg.hStep)) hs.push(i); if (ws.length === 0 || hs.length === 0) return toast("Rango inválido", "error"); onChange({ widths: ws, heights: hs, prices: Array(hs.length).fill().map(() => Array(ws.length).fill(0)) }); setShowAuto(false); toast("Tabla regenerada", "success"); };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 justify-between flex-wrap">
                <div className="flex gap-2 items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paso:</span><input type="number" className="w-16 p-1 border rounded text-sm text-center font-bold text-slate-700" value={step} onChange={e => setStep(e.target.value)} /></div>
                <div className="flex gap-2">
                    <button onClick={autoFillPrices} className="flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                        <Sparkles size={14} /> Bilineal
                    </button>
                    <button onClick={() => setShowAuto(!showAuto)} className="flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                        <Wand size={14} /> Generador
                    </button>
                </div>
            </div>
            {showAuto && <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 gap-4 animate-fade-in mb-2 shadow-inner"><div className="col-span-2 text-xs text-blue-800 font-bold mb-1">Configuración Rápida</div><div><h4 className="font-bold text-[10px] uppercase text-blue-400 mb-1">Ancho (X)</h4><div className="flex gap-1"><input placeholder="Min" className="w-full p-1 text-xs border rounded" value={autoCfg.wMin} onChange={e => setAutoCfg({ ...autoCfg, wMin: e.target.value })} /><input placeholder="Max" className="w-full p-1 text-xs border rounded" value={autoCfg.wMax} onChange={e => setAutoCfg({ ...autoCfg, wMax: e.target.value })} /><input placeholder="Step" className="w-full p-1 text-xs border rounded" value={autoCfg.wStep} onChange={e => setAutoCfg({ ...autoCfg, wStep: e.target.value })} /></div></div><div><h4 className="font-bold text-[10px] uppercase text-blue-400 mb-1">Alto (Y)</h4><div className="flex gap-1"><input placeholder="Min" className="w-full p-1 text-xs border rounded" value={autoCfg.hMin} onChange={e => setAutoCfg({ ...autoCfg, hMin: e.target.value })} /><input placeholder="Max" className="w-full p-1 text-xs border rounded" value={autoCfg.hMax} onChange={e => setAutoCfg({ ...autoCfg, hMax: e.target.value })} /><input placeholder="Step" className="w-full p-1 text-xs border rounded" value={autoCfg.hStep} onChange={e => setAutoCfg({ ...autoCfg, hStep: e.target.value })} /></div></div><button onClick={generateMatrixStructure} className="col-span-2 py-1.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700">Generar Tabla</button></div>}

            {/* MATRIX TABLE WRAPPER CON SCROLL Y STICKY */}
            <div className="overflow-x-auto overflow-y-auto border rounded-xl shadow-sm bg-white max-h-[600px] relative custom-scrollbar">
                <table className="min-w-full text-xs border-collapse">
                    <thead>
                        <tr>
                            {/* Esquina Sticky Z-30 */}
                            <th className="sticky-corner bg-slate-200 p-2 border-b border-r text-slate-500 font-black tracking-tighter text-[10px] min-w-[80px] shadow-[2px_2px_5px_rgba(0,0,0,0.05)]">
                                ALTO \ ANCHO
                            </th>
                            {safe.widths.map((w, i) =>
                                <th key={`w${i}`} className="sticky-row-header bg-slate-50 p-1 min-w-[70px] border-b border-r border-slate-100 group hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center">
                                        <input type="number" className="w-full bg-transparent text-center font-bold text-slate-700 outline-none mb-1 text-sm" value={w} onChange={e => updateDim('widths', i, e.target.value)} />
                                        <button onClick={() => removeDim('widths', i)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={10} /></button>
                                    </div>
                                </th>
                            )}
                            <th className="sticky-row-header p-1 border-b bg-slate-50 min-w-[40px]">
                                <button onClick={() => addDim('widths')} className="text-blue-600 hover:bg-blue-100 p-1 rounded w-full flex justify-center"><Plus size={14} /></button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {safe.heights.map((h, r) =>
                            <tr key={`r${r}`}>
                                {/* Primera columna Sticky Z-10 */}
                                <td className="sticky-col bg-slate-50 p-1 border-r border-b border-slate-100 font-bold text-slate-700 group hover:bg-slate-100 transition-colors min-w-[80px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    <div className="flex flex-col items-center">
                                        <input type="number" className="w-full bg-transparent text-center outline-none text-sm" value={h} onChange={e => updateDim('heights', r, e.target.value)} />
                                        <button onClick={() => removeDim('heights', r)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={10} /></button>
                                    </div>
                                </td>
                                {safe.widths.map((_, c) => {
                                    const val = safe.prices[r]?.[c];
                                    return <td key={`c${c}`} className={`p-0 border-r border-b border-slate-100 relative group transition-colors hover:z-0 hover:shadow-lg ${val === null ? 'bg-red-50' : 'hover:bg-blue-50'}`}>
                                        {val === null ?
                                            <button onClick={() => updatePrice(r, c, 0)} className="w-full h-12 text-center text-red-50 font-bold text-[10px] hover:text-red-500">N/A</button> :
                                            <>
                                                <input type="number" className="w-full h-12 text-center outline-none bg-transparent font-medium text-slate-600 focus:text-blue-700 focus:font-bold" value={val || 0} onChange={e => updatePrice(r, c, e.target.value)} />
                                                <button onClick={() => updatePrice(r, c, null)} className="absolute top-0 right-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Ban size={14} /></button>
                                            </>
                                        }
                                    </td>;
                                })}
                            </tr>
                        )}
                        <tr>
                            <td className="sticky-col text-center p-1 border-r bg-slate-50 min-w-[80px]">
                                <button onClick={() => addDim('heights')} className="text-blue-600 hover:bg-blue-100 p-1 rounded w-full flex justify-center"><Plus size={14} /></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MatrixEditor;
