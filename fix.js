const fs = require('fs');
let c = fs.readFileSync('src/components/v30/ClientManager.js', 'utf8');
const start = c.indexOf('{/* Datos de Cliente (Protegidos contra Overflow) */}');
const endStr = '<div className="mt-8 relative z-10 w-full min-w-0">';
const end = c.indexOf(endStr);
if (start > 0 && end > start) {
    const replacement = `{/* Datos de Cliente (Protegidos contra Overflow) */}
                                <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 break-words w-full leading-tight">{activeClient.name}</h2>
                                    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {activeClient.phone && <span className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border dark:border-slate-700 font-mono shadow-sm flex items-center shrink-0 w-full sm:w-auto">{activeClient.phone}</span>}
                                        {activeClient.email && <span className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border dark:border-slate-700 text-sm shadow-sm break-all w-full sm:w-auto">{activeClient.email}</span>}
                                    </div>
                                    {activeClient.address && <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 flex gap-1.5 items-start bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-full break-words"><span className="shrink-0 opacity-50">📍</span> <span>{activeClient.address}</span></p>}
                                </div>
                                
                                {/* Métricas y Acciones (Alineación Responsiva y Regla de 44px) */}
                                <div className="flex flex-col items-start xl:items-end w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
                                    <div className="flex flex-col xl:items-end bg-white dark:bg-slate-800 p-5 xl:p-0 rounded-2xl border border-slate-200 dark:border-slate-700 xl:border-none shadow-sm xl:shadow-none w-full xl:w-auto xl:bg-transparent dark:xl:bg-transparent">
                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Volumen de Negocio</div>
                                        <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-6">{formatCurrency(activeClient.total)}</div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                                            <button onClick={() => handleExportClient(activeClient)} className="flex-1 xl:flex-none border min-h-[48px] justify-center px-6 text-sm bg-slate-700 dark:bg-slate-700 border-slate-600 rounded-xl hover:bg-slate-600 text-white font-bold flex items-center gap-2 transition-colors uppercase tracking-wider"><Download size={16} /> Exportar</button>
                                            <button onClick={() => { if (confirm('¿Eliminar toda la ficha de cliente y sus presupuestos?')) { onDeleteClient(activeClient); setSelKey(null); } }} className="flex-1 xl:flex-none min-h-[48px] justify-center px-6 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 font-bold flex items-center gap-2 transition-colors uppercase tracking-wider"><Trash size={16} /> Eliminar Ficha</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            `;
    c = c.substring(0, start) + replacement + c.substring(end);
    fs.writeFileSync('src/components/v30/ClientManager.js', c);
    console.log('Replaced successfully!');
} else {
    console.log('Tags not found', start, end);
}
