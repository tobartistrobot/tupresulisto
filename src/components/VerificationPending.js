import React, { useState } from 'react';
import { Mail, RefreshCw, Send, LogOut, ShieldCheck, ExternalLink } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

const VerificationPending = ({ user, onVerified, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleCheckVerification = async () => {
        setLoading(true);
        try {
            await user.reload();
            if (user.emailVerified) {
                // Sync verification status to Firestore for Admin Stats
                try {
                    await updateDoc(doc(db, "users", user.uid), {
                        emailVerified: true
                    });
                } catch (e) {
                    console.error("Error updating firestore profile:", e);
                }

                toast("¡Cuenta verificada! Accediendo...", "success");
                onVerified(); // Trigger state update in parent
            } else {
                toast("Aún no detectamos la verificación. Inténtalo de nuevo.", "info");
            }
        } catch (error) {
            console.error("Error checking verification:", error);
            toast("Error al verificar. Intenta recargar la página.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setLoading(true);
        try {
            await sendEmailVerification(user);
            toast("Email enviado de nuevo. Revisa spam.", "success");
        } catch (error) {
            console.error("Error sending email:", error);
            if (error.code === 'auth/too-many-requests') {
                toast("Demasiados intentos. Espera unos minutos.", "warning");
            } else {
                toast("Error al enviar email.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-fade-in-up">
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50 relative z-10">
                        <Mail className="text-white" size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2 relative z-10">Confirma tu email</h1>
                    <p className="text-slate-400 text-sm relative z-10">¡Casi hemos terminado! Confirma tu email para activar tu cuenta.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5 shrink-0">
                            <Send size={14} />
                        </div>
                        <div>
                            <p className="text-slate-800 text-sm font-bold mb-1">Email enviado a:</p>
                            <p className="text-blue-700 font-medium text-sm break-all">{user?.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href="https://mail.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-red-200 transition-all group"
                        >
                            <span className="font-bold text-slate-700 group-hover:text-red-600 text-sm flex items-center gap-1">
                                <ExternalLink size={14} /> Gmail
                            </span>
                        </a>
                        <a
                            href="https://outlook.live.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-blue-200 transition-all group"
                        >
                            <span className="font-bold text-slate-700 group-hover:text-blue-600 text-sm flex items-center gap-1">
                                <ExternalLink size={14} /> Outlook
                            </span>
                        </a>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-slate-600 text-sm">
                            Haz clic en el enlace que te hemos enviado.
                        </p>
                        <p className="text-slate-400 text-xs italic">
                            (Revisa la carpeta de Spam o Promociones)
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            onClick={handleCheckVerification}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                            Ya lo he verificado
                        </button>

                        <button
                            onClick={handleResendEmail}
                            disabled={loading}
                            className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <RefreshCw size={16} /> Reenviar email de confirmación
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                    <button onClick={onLogout} className="text-slate-400 hover:text-red-500 text-xs font-bold flex items-center justify-center gap-1 mx-auto transition-colors">
                        <LogOut size={12} /> Cerrar sesión y volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationPending;
