'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Box, Save, Crown, Ticket, Shield, AlertTriangle, Bot, Copy, Trash2 } from 'lucide-react';
import { SITE_URL } from '../../lib/site';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'; // Import auth methods
import { track, EVENTS } from '../../lib/analytics';
import { getSubscriptionState } from '../../lib/subscription';

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
    const { userProfile, refreshUserProfile } = useAuth(); // Access Firestore profile with Lemon Squeezy data
    // Fuente única de verdad para distinguir prueba por cupón (con planExpiry)
    // de suscripción de pago (con lemonRenewsAt) — antes esta sección mostraba
    // lemonRenewsAt para cualquier cuenta PRO, aunque el PRO viniera de un
    // cupón y ese campo fuera de una suscripción antigua/de prueba sin relación.
    const subscription = getSubscriptionState(userProfile);
    const [couponCode, setCouponCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const redeemInFlight = useRef(false); // cierra la ventana de doble-tap antes de que el re-render desactive el botón

    // SECURITY STATE
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);

    // La pregunta correcta es "¿tiene contraseña?", no "¿tiene Google?": una
    // cuenta puede tener AMBOS proveedores vinculados (entró alguna vez con
    // Google y también tiene contraseña). Mirando solo google.com, a esos
    // usuarios se les ocultaba el formulario de cambio de contraseña aunque
    // iniciaran sesión con ella cada día.
    const hasPasswordProvider = user?.providerData?.some(p => p.providerId === 'password');

    // AGENTES / CLAVES DE API — estado de la sección "Agentes y API"
    const [apiKeys, setApiKeys] = useState([]);
    const [apiKeysLoading, setApiKeysLoading] = useState(false);
    const [newKeyLabel, setNewKeyLabel] = useState('');
    const [creatingKey, setCreatingKey] = useState(false);
    /** La clave en claro se enseña UNA vez, justo tras crearla. */
    const [createdKey, setCreatedKey] = useState(null);

    const loadApiKeys = useCallback(async () => {
        if (!user) return;
        setApiKeysLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/agent-keys', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setApiKeys(data.keys || []);
        } catch (err) {
            console.error('Error cargando claves de API:', err);
        } finally {
            setApiKeysLoading(false);
        }
    }, [user]);

    useEffect(() => { loadApiKeys(); }, [loadApiKeys]);

    const handleCreateKey = async () => {
        if (creatingKey) return;
        setCreatingKey(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/agent-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ label: newKeyLabel }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'No se pudo crear la clave');
            setCreatedKey(data.key);
            setNewKeyLabel('');
            toast('Clave creada. Cópiala ahora: no volverá a mostrarse.', 'success');
            loadApiKeys();
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            setCreatingKey(false);
        }
    };

    const handleRevokeKey = async (id) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/agent-keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'No se pudo revocar');
            toast('Clave revocada. Los agentes que la usaban ya no tienen acceso.', 'success');
            loadApiKeys();
        } catch (err) {
            toast(err.message, 'error');
        }
    };

    const handleLogo = async (e) => { try { const b64 = await processImage(e.target.files[0]); setConfig({ ...config, logo: b64 }); } catch (err) { toast(err.message, "error"); } };

    const handleRedeem = async () => {
        if (redeemInFlight.current) return; // evita doble envío si el segundo tap llega antes del re-render
        redeemInFlight.current = true;
        setIsRedeeming(true);

        try {
            const token = await user?.getIdToken();
            const response = await fetch('/api/redeem-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: couponCode
                })
            });

            const result = await response.json();

            if (result.success) {
                track(EVENTS.CUPON_CANJEADO, { codigo: couponCode });
                toast(result.message, "success");
                setCouponCode('');
                // Refresco puntual en vez de recargar la página entera: no
                // dependemos de que el listener en tiempo real reciba el push
                // a tiempo, y el usuario ve el PRO activo al instante.
                await refreshUserProfile();
            } else {
                toast(result.message, "error");
            }
        } catch (error) {
            console.error('Coupon error:', error);
            toast("Error al canjear el código. Inténtalo de nuevo.", "error");
        } finally {
            redeemInFlight.current = false;
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
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-6">Configuración de Negocio</h2>
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 shadow-sm overflow-hidden w-full">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Identidad Corporativa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
                        <div className="space-y-4 w-full min-w-0 flex flex-col items-center">
                            <div className="w-full"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Nombre Comercial</label><input className="input-saas" value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} /></div>
                            <div className="w-full"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">CIF / NIF</label><input className="input-saas" value={config.cif} onChange={e => setConfig({ ...config, cif: e.target.value })} /></div>
                            <div className="w-full"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Color de Marca</label><div className="flex gap-2 w-full"><input type="color" className="h-[44px] w-[56px] rounded-xl cursor-pointer border-none shrink-0 bg-transparent block" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} /><input className="input-saas flex-1 font-mono uppercase" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} /></div></div>
                        </div>
                        <div className="w-full min-w-0">
                            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Logotipo (Fondo Blanco/Transparente)</label>
                            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-center cursor-pointer relative group h-40 md:h-48 flex items-center justify-center overflow-hidden w-full">
                                <input type="file" accept="image/*" onChange={handleLogo} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full" />
                                {config.logo ? <img src={config.logo} className="h-full w-full object-contain p-2" /> : <div className="text-slate-400 dark:text-slate-500"><Box size={32} className="mx-auto mb-2" /><p className="text-xs font-bold">ACTUALIZAR LOGO</p></div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 shadow-sm overflow-hidden w-full">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Contacto y Legal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 w-full min-w-0">
                        <div className="w-full"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label><input className="input-saas" value={config.phone} onChange={e => setConfig({ ...config, phone: e.target.value })} /></div>
                        <div className="w-full"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Email</label><input className="input-saas" value={config.email} onChange={e => setConfig({ ...config, email: e.target.value })} /></div>
                        <div className="w-full md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Dirección Completa</label><input className="input-saas" value={config.address} onChange={e => setConfig({ ...config, address: e.target.value })} /></div>
                        <div className="w-full md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Web</label><input className="input-saas" value={config.website} onChange={e => setConfig({ ...config, website: e.target.value })} /></div>
                    </div>
                    <div className="w-full min-w-0"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Cuenta Bancaria (para Presupuestos)</label><textarea className="input-saas h-20 min-h-[80px] text-sm py-2" value={config.bankAccount} onChange={e => setConfig({ ...config, bankAccount: e.target.value })} /></div>
                    <div className="mt-4 w-full min-w-0"><label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Términos Legales (Pie de página)</label><textarea className="input-saas h-32 min-h-[120px] text-xs py-2" value={config.legalText} onChange={e => setConfig({ ...config, legalText: e.target.value })} /></div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 shadow-sm overflow-hidden w-full">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Fiscalidad</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
                        <div className="w-full">
                            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">IVA Global (%)</label>
                            <input type="number" className="input-saas" value={config.iva !== undefined ? config.iva : 21} onChange={e => setConfig({ ...config, iva: e.target.value })} />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Por defecto: 21%</p>
                        </div>
                    </div>
                </div>

                {/* Presupuestos: comportamiento al entregar */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 shadow-sm overflow-hidden w-full">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Presupuestos</h3>
                    {/* El interruptor entero es el label: en móvil se puede
                        pulsar en cualquier parte de la fila, no solo la casilla. */}
                    <label className="flex items-start gap-4 cursor-pointer select-none">
                        {/* El input ocupa EL SITIO del interruptor y se hace
                            invisible con opacity, en vez de usar sr-only. Con
                            sr-only queda absoluto y de 1×1 px, y al pulsar la
                            etiqueta el navegador lo enfocaba y hacía scroll
                            hasta él: eso desplazaba <main> (que es
                            overflow-hidden) ~980 px, dejaba el panel fuera de
                            vista y solo se veía el fondo oscuro. Parecía que la
                            pestaña se ponía en negro y no había forma de volver
                            salvo cambiando de pestaña. */}
                        <span className="relative mt-0.5 shrink-0 w-12 h-7">
                            <input
                                type="checkbox"
                                className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
                                checked={config.autoSaveOnFinish !== false}
                                onChange={e => setConfig({ ...config, autoSaveOnFinish: e.target.checked })}
                            />
                            <span className="pointer-events-none absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-600 peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-800 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"></span>
                        </span>
                        <span className="min-w-0">
                            <span className="block font-bold text-slate-800 dark:text-slate-100">Guardar también al pulsar Finalizar</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Al pulsar Finalizar el presupuesto se guarda solo en tu historial, para que no se te pierda si se te olvida darle a Guardar.
                                Desactívalo si sueles montar varias versiones para enseñárselas al cliente y no quieres que se guarden todas.
                            </span>
                        </span>
                    </label>
                </div>

                {/* Suscripción y Licencia */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2"><Crown className={isPro ? "text-yellow-500" : "text-slate-400"} /> Suscripción y Licencia</h3>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Plan Actual</p>
                            <div className={`text-xl font-black flex items-center gap-2 ${isPro ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                {isPro ? 'PLAN PRO 🚀' : 'GRATUITO'}
                                {isPro && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                {isPro ? "Disfrutas de acceso ilimitado a todas las funciones." : "Limitado a 3 productos. Actualiza para eliminar límites."}
                            </p>

                            {/* Prueba PRO por cupón: la fecha real es planExpiry, no lemonRenewsAt */}
                            {isPro && subscription.isTrial && subscription.expiresAt && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">📅 Tu prueba PRO termina:</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            {subscription.expiresAt.toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Suscripción de pago (Lemon Squeezy): esta sí usa lemonRenewsAt */}
                            {isPro && !subscription.isTrial && userProfile?.lemonRenewsAt && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">📅 Próxima renovación:</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
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
                            {isPro && userProfile?.lemonCustomerPortalUrl ? (
                                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Administración de Plan</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                        Gestiona tu método de pago, visualiza tu historial de facturas o <span className="font-semibold text-slate-700 dark:text-slate-300">cancela tu suscripción activa</span> de forma segura a través de nuestro portal de clientes oficial.
                                    </p>
                                    <button
                                        onClick={() => window.open(userProfile.lemonCustomerPortalUrl, '_blank')}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border shadow-sm border-slate-200 dark:border-slate-600"
                                    >
                                        <Crown size={18} className="text-yellow-500" />
                                        Gestionar o Cancelar Suscripción
                                    </button>
                                </div>
                            ) : (
                                isPro && (
                                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Administración de Plan</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                            Gestiona tu método de pago, visualiza tu historial de facturas o <span className="font-semibold text-slate-700 dark:text-slate-300">cancela tu suscripción activa</span> solicitando acceso directo a través de nuestro portal seguro.
                                        </p>
                                        <button
                                            onClick={() => window.open('https://app.lemonsqueezy.com/my-orders', '_blank')}
                                            className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border shadow-sm border-slate-200 dark:border-slate-600"
                                        >
                                            <Crown size={18} className="text-yellow-500" />
                                            Acceder al Portal de Clientes
                                        </button>
                                        <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">
                                            * Se enviará un enlace de acceso seguro al correo electrónico asociado a la compra.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        {!isPro && (
                            <div className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Canjear Código Promocional</label>
                                <div className="flex gap-2 w-full flex-col sm:flex-row">
                                    <input
                                        placeholder="INTRODUCE TU CÓDIGO"
                                        className="input-saas flex-1"
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value)}
                                        autoComplete="off"
                                        name="couponCode"
                                        type="text"
                                    />
                                    <button
                                        onClick={handleRedeem}
                                        disabled={isRedeeming || !couponCode}
                                        className="btn-primary shadow-none py-2 px-6"
                                    >
                                        {isRedeeming ? '...' : <><Ticket size={14} /> Canjear</>}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Si tienes un código de acceso anticipado, introdúcelo aquí.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* GESTIÓN DE CATÁLOGO (IMPORTAR / EXPORTAR) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2"><Box className="text-purple-600" /> Gestión de Catálogo</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/40">
                            <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-2">Exportar Catálogo</h4>
                            <p className="text-xs text-purple-700 dark:text-purple-300 mb-4">Descarga un archivo con todos tus productos, imágenes y categorías para hacer una copia de seguridad o compartir.</p>
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
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/40">
                            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Importar Catálogo</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">Añade productos desde un archivo. <span className="font-bold">No borra lo actual</span>, solo añade lo nuevo.</p>
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

                {/* AGENTES Y API (BETA): claves para que agentes de IA trabajen sobre esta cuenta vía MCP */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">
                        <Bot className="text-emerald-600" /> Agentes y API
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Conecta un asistente de IA (Claude u otro compatible con MCP) para que te haga los presupuestos como si fuera tu oficinista.
                        Cada clave da acceso <span className="font-bold">solo a tu cuenta</span> y puedes revocarla cuando quieras.
                        Dirección de conexión: <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded select-all">{SITE_URL}/api/mcp</code>
                    </p>

                    {createdKey && (
                        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                                ⚠️ Guarda esta clave ahora: por seguridad no volverá a mostrarse.
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 font-mono text-xs bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-2 break-all select-all">{createdKey}</code>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(createdKey); toast('Clave copiada', 'success'); }}
                                    className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                                    title="Copiar clave"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            <button onClick={() => setCreatedKey(null)} className="text-[10px] text-emerald-700 dark:text-emerald-400 underline mt-2">Ya la he guardado, ocultar</button>
                        </div>
                    )}

                    <div className="flex gap-2 flex-col sm:flex-row mb-4">
                        <input
                            placeholder="Nombre de la clave (ej: Agente presupuestos)"
                            className="input-saas flex-1"
                            value={newKeyLabel}
                            onChange={e => setNewKeyLabel(e.target.value)}
                            maxLength={60}
                        />
                        <button onClick={handleCreateKey} disabled={creatingKey} className="btn-primary shadow-none py-2 px-6">
                            {creatingKey ? '...' : 'Crear clave'}
                        </button>
                    </div>

                    {apiKeysLoading ? (
                        <p className="text-xs text-slate-400">Cargando claves…</p>
                    ) : apiKeys.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500">Aún no tienes claves. Crea una para conectar tu primer agente.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {apiKeys.map(k => (
                                <li key={k.id} className={`py-2.5 flex items-center gap-3 ${k.revoked ? 'opacity-50' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{k.label}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                            {k.prefix}…
                                            {k.createdAt && <> · creada {new Date(k.createdAt).toLocaleDateString('es-ES')}</>}
                                            {k.lastUsedAt ? <> · último uso {new Date(k.lastUsedAt).toLocaleDateString('es-ES')}</> : <> · sin usar</>}
                                        </p>
                                    </div>
                                    {k.revoked ? (
                                        <span className="text-[10px] font-bold uppercase text-red-400">Revocada</span>
                                    ) : (
                                        <button
                                            onClick={() => handleRevokeKey(k.id)}
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                                            title="Revocar clave"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* SEGURIDAD / CAMBIAR CONTRASEÑA */}
                <div className="bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 p-6 shadow-sm animate-fade-in relative overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-800 dark:text-red-300 border-b border-red-100 dark:border-red-900/50 pb-2 relative z-10">
                        <Shield className="text-red-600" size={20} /> Seguridad
                    </h3>

                    {!hasPasswordProvider ? (
                        <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-red-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 shrink-0 mt-0.5" alt="Google" />
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">Cuenta gestionada por Google</p>
                                <p>Iniciaste sesión con Google, por lo que no tienes una contraseña independiente en esta aplicación. Para cambiar tu clave, debes hacerlo desde la configuración de tu cuenta de Google.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            <p className="text-xs text-red-600 font-bold uppercase mb-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> Zona de Cambio de Contraseña
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                                <div className="w-full md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Contraseña Actual (Requerido)</label>
                                    <input
                                        type="password"
                                        className="input-saas border-red-200 dark:border-red-900 focus:ring-red-500/20 focus:border-red-500 bg-white"
                                        placeholder="••••••••"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="w-full min-w-0">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        className="input-saas bg-white"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="w-full min-w-0">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Confirmar Nueva</label>
                                    <input
                                        type="password"
                                        className="input-saas bg-white"
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
                    <button onClick={() => toast("Configuración guardada", "success")} className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"><Save size={18} /> Guardar Configuración</button>
                </div>
            </div>
        </div>
    );
};

export default SysConfig;
