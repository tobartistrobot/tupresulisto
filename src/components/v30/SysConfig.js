'use client';
import React from 'react';
import { useToast } from '../../context/ToastContext';
import { Box, Save } from 'lucide-react';

const processImage = (file) => new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) return reject(new Error("No es un archivo de imagen"));
    const reader = new FileReader();
    reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const max_size = 500; let w = image.width; let h = image.height;
            if (w > h) { if (w > max_size) { h *= max_size / w; w = max_size; } } else { if (h > max_size) { w *= max_size / h; h = max_size; } }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, w, h);
            resolve(canvas.toDataURL('image/png'));
        }
        image.src = ev.target.result;
    }
    reader.readAsDataURL(file);
});

const SysConfig = ({ config, setConfig, className }) => {
    const toast = useToast();
    const handleLogo = async (e) => { try { const b64 = await processImage(e.target.files[0]); setConfig({ ...config, logo: b64 }); } catch (err) { toast(err.message, "error"); } };

    return (
        <div className={`p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto animate-fade-in ${className}`}>
            <h2 className="text-3xl font-black text-slate-800 mb-6">Configuración de Negocio</h2>
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Identidad Corporativa</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nombre Comercial</label><input className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-bold" value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} /></div>
                            <div><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">CIF / NIF</label><input className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white outline-none" value={config.cif} onChange={e => setConfig({ ...config, cif: e.target.value })} /></div>
                            <div><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Color de Marca</label><div className="flex gap-2"><input type="color" className="h-12 w-20 rounded cursor-pointer border-none" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} /><input className="flex-1 p-3 border rounded-lg bg-slate-50" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} /></div></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Logotipo (Fondo Blanco/Transparente)</label>
                            <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 hover:bg-white transition-colors text-center cursor-pointer relative group h-48 flex items-center justify-center">
                                <input type="file" accept="image/*" onChange={handleLogo} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                {config.logo ? <img src={config.logo} className="max-h-full max-w-full object-contain" /> : <div className="text-slate-400"><Box size={32} className="mx-auto mb-2" /><p className="text-xs">Subir Logo</p></div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Contacto y Legal</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Teléfono</label><input className="w-full p-3 border rounded-lg bg-slate-50 outline-none" value={config.phone} onChange={e => setConfig({ ...config, phone: e.target.value })} /></div>
                        <div><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email</label><input className="w-full p-3 border rounded-lg bg-slate-50 outline-none" value={config.email} onChange={e => setConfig({ ...config, email: e.target.value })} /></div>
                        <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Dirección Completa</label><input className="w-full p-3 border rounded-lg bg-slate-50 outline-none" value={config.address} onChange={e => setConfig({ ...config, address: e.target.value })} /></div>
                        <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Web</label><input className="w-full p-3 border rounded-lg bg-slate-50 outline-none" value={config.website} onChange={e => setConfig({ ...config, website: e.target.value })} /></div>
                    </div>
                    <div><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cuenta Bancaria (para Presupuestos)</label><textarea className="w-full p-3 border rounded-lg bg-slate-50 outline-none h-20 text-sm" value={config.bankAccount} onChange={e => setConfig({ ...config, bankAccount: e.target.value })} /></div>
                    <div className="mt-4"><label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Términos Legales (Pie de página)</label><textarea className="w-full p-3 border rounded-lg bg-slate-50 outline-none h-32 text-xs" value={config.legalText} onChange={e => setConfig({ ...config, legalText: e.target.value })} /></div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Fiscalidad</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">IVA Global (%)</label>
                            <input type="number" className="w-full p-3 border rounded-lg bg-slate-50 outline-none font-bold" value={config.iva !== undefined ? config.iva : 21} onChange={e => setConfig({ ...config, iva: e.target.value })} />
                            <p className="text-[10px] text-slate-400 mt-1">Por defecto: 21%</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pb-8">
                    <button onClick={() => toast("Configuración guardada", "success")} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-900 transition-colors"><Save size={18} /> Guardar Configuración</button>
                </div>
            </div>
        </div>
    );
};

export default SysConfig;
