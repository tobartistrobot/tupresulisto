'use client';
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Box, Save, Crown, Ticket, Shield, AlertTriangle } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'; // Import auth methods

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

const SysConfig = ({ config, setConfig, className, user, isPro, products = [], setProducts, categories = [], setCategories }) => {
    const toast = useToast();
    const { userProfile } = useAuth(); // Access Firestore profile with Lemon Squeezy data
    const [couponCode, setCouponCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    // SECURITY STATE
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);

    // Check provider (google.com vs password)
    const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');

    const handleLogo = async (e) => { try { const b64 = await processImage(e.target.files[0]); setConfig({ ...config, logo: b64 }); } catch (err) { toast(err.message, "error"); } };

    const handleRedeem = async () => {
        setIsRedeeming(true);

        try {
            const response = await fetch('/api/redeem-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.uid,
                    code: couponCode
                })
            });

            const result = await response.json();

            if (result.success) {
                toast(result.message, "success");
                setCouponCode('');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast(result.message, "error");
            }
        } catch (error) {
            console.error('Coupon error:', error);
            toast("Error al canjear el código. Inténtalo de nuevo.", "error");
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) return toast("La nueva contraseña debe tener al menos 6 caracteres", "error");
        if (newPassword !== confirmNewPassword) return toast("Las contraseñas nuevas no coinciden", "error");
        if (!currentPassword) return toast("Debes ingresar tu contraseña actual para confirmar", "error");

        setSecurityLoading(true);
        try {
            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update Password
            await updatePassword(user, newPassword);

            // 3. Success & Reset
            toast("Contraseña actualizada correctamente", "success");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            console.error("Change Password Error:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast("La contraseña actual es incorrecta", "error");
            } else {
                toast("Error al actualizar contraseña: " + error.code, "error");
            }
        } finally {
            setSecurityLoading(false);
        }
    };

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

                {/* Suscripción y Licencia */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700 border-b pb-2"><Crown className={isPro ? "text-yellow-500" : "text-slate-400"} /> Suscripción y Licencia</h3>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-500 mb-1">Plan Actual</p>
                            <div className={`text-xl font-black flex items-center gap-2 ${isPro ? 'text-blue-600' : 'text-slate-600'}`}>
                                {isPro ? 'PLAN PRO 🚀' : 'GRATUITO'}
                                {isPro && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                {isPro ? "Disfrutas de acceso ilimitado a todas las funciones." : "Limitado a 3 productos. Actualiza para eliminar límites."}
                            </p>

                            {/* Subscription Details for PRO users */}
                            {isPro && userProfile?.lemonRenewsAt && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-blue-600 font-bold">📅 Próxima renovación:</span>
                                        <span className="text-slate-700 font-medium">
                                            {new Date(userProfile.lemonRenewsAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    {userProfile.lemonCancelled && (
                                        <p className="text-xs text-orange-600 mt-1 font-medium">
                                            ⚠️ Renovación automática desactivada. Tu acceso termina en la fecha indicada.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Manage Subscription Button */}
                            {isPro && userProfile?.lemonCustomerPortalUrl && (
                                <button
                                    onClick={() => window.open(userProfile.lemonCustomerPortalUrl, '_blank')}
                                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors border border-slate-200"
                                >
                                    <Crown size={16} className="text-yellow-500" />
                                    Gestionar Suscripción
                                </button>
                            )}
                            {isPro && !userProfile?.lemonCustomerPortalUrl && (
                                <p className="mt-4 text-xs text-slate-400">
                                    Para gestionar tu suscripción, contacta con soporte.
                                </p>
                            )}
                        </div>

                        {!isPro && (
                            <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Canjear Código Promocional</label>
                                <div className="flex gap-2">
                                    <input
                                        placeholder="INTRODUCE TU CÓDIGO"
                                        className="flex-1 p-2 border rounded-lg text-sm uppercase font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value)}
                                        autoComplete="off"
                                        name="couponCode"
                                        type="text"
                                    />
                                    <button
                                        onClick={handleRedeem}
                                        disabled={isRedeeming || !couponCode}
                                        className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-xs hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isRedeeming ? '...' : <><Ticket size={14} /> Canjear</>}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">Si tienes un código de acceso anticipado, introdúcelo aquí.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* GESTIÓN DE CATÁLOGO (IMPORTAR / EXPORTAR) */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700 border-b pb-2"><Box className="text-purple-600" /> Gestión de Catálogo</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-bold text-purple-900 mb-2">Exportar Catálogo</h4>
                            <p className="text-xs text-purple-700 mb-4">Descarga un archivo con todos tus productos, imágenes y categorías para hacer una copia de seguridad o compartir.</p>
                            <button
                                onClick={() => {
                                    const dataStr = JSON.stringify({ products, categories, exportedAt: new Date().toISOString() }, null, 2);
                                    const blob = new Blob([dataStr], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `catalogo-tupresulisto-${new Date().toISOString().slice(0, 10)}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    toast("Catálogo exportado correctamente", "success");
                                }}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Save size={18} /> Descargar Copia (.json)
                            </button>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-2">Importar Catálogo</h4>
                            <p className="text-xs text-blue-700 mb-4">Añade productos desde un archivo. <span className="font-bold">No borra lo actual</span>, solo añade lo nuevo.</p>
                            <label className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                <Box size={18} /> Seleccionar Archivo
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            try {
                                                const json = JSON.parse(event.target.result);
                                                if (Array.isArray(json.products) && Array.isArray(json.categories)) {
                                                    // 1. Merge Categories
                                                    const newCats = [...new Set([...categories, ...json.categories])];
                                                    setCategories(newCats);

                                                    // 2. Add Products with ID regeneration to avoid collision
                                                    const importedProducts = json.products.map((p, idx) => ({
                                                        ...p,
                                                        id: `${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}` // Regenerate ID
                                                    }));

                                                    setProducts(prev => [...prev, ...importedProducts]);
                                                    toast(`Se han importado ${importedProducts.length} productos y categorías.`, "success");
                                                } else {
                                                    toast("El archivo no tiene el formato correcto.", "error");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                toast("Error al leer el archivo JSON.", "error");
                                            }
                                        };
                                        reader.readAsText(file);
                                        e.target.value = null; // Reset input
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* SEGURIDAD / CAMBIAR CONTRASEÑA */}
                <div className="bg-red-50/50 rounded-xl border border-red-100 p-6 shadow-sm animate-fade-in relative overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-800 border-b border-red-100 pb-2 relative z-10">
                        <Shield className="text-red-600" size={20} /> Seguridad
                    </h3>

                    {isGoogleUser ? (
                        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-red-100 text-slate-600 text-sm">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 shrink-0 mt-0.5" alt="Google" />
                            <div>
                                <p className="font-bold text-slate-800">Cuenta gestionada por Google</p>
                                <p>Iniciaste sesión con Google, por lo que no tienes una contraseña independiente en esta aplicación. Para cambiar tu clave, debes hacerlo desde la configuración de tu cuenta de Google.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            <p className="text-xs text-red-600 font-bold uppercase mb-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> Zona de Cambio de Contraseña
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Contraseña Actual (Requerido)</label>
                                    <input
                                        type="password"
                                        className="w-full p-3 border border-red-200 rounded-lg bg-white focus:ring-2 focus:ring-red-200 outline-none"
                                        placeholder="••••••••"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Confirmar Nueva</label>
                                    <input
                                        type="password"
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none"
                                        placeholder="Repite la nueva contraseña"
                                        value={confirmNewPassword}
                                        onChange={e => setConfirmNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleChangePassword}
                                    disabled={securityLoading || !currentPassword || !newPassword || !confirmNewPassword || newPassword.length < 6}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
                                >
                                    {securityLoading ? 'Verificando...' : 'Actualizar Contraseña'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pb-8">
                    <button onClick={() => toast("Configuración guardada", "success")} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-900 transition-colors"><Save size={18} /> Guardar Configuración</button>
                </div>
            </div>
        </div>
    );
};

export default SysConfig;
