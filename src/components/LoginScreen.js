import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Lock, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth'; // Import sendEmailVerification
import { doc, setDoc } from 'firebase/firestore';
import { getFriendlyErrorMessage } from '../utils/authErrors';

const LoginScreen = ({ onLoginSuccess, mode = 'login', onSwitchToRegister, onSwitchToLogin }) => {
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const isFormValid = mode === 'register'
        ? isValidEmail(email) && password.length >= 6 && password === confirmPassword
        : isValidEmail(email) && password.length > 0;

    const handleForgotPassword = async () => {
        if (!email) {
            toast("Por favor, introduce tu email para enviarte el enlace", "info");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            toast("¡Enlace de recuperación enviado! Revisa tu bandeja de entrada", "success");
        } catch (error) {
            console.error("Error password reset:", error);
            toast(getFriendlyErrorMessage(error.code), "error");
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden');
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                setLoading(false);
                return;
            }
        }

        try {
            if (mode === 'login') {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Check verification immediately
                if (!userCredential.user.emailVerified) {
                    // Logic handled by page.js listener but we log it
                    console.log("User not verified, waiting for redirect...");
                } else {
                    console.log("User verified, entering dashboard...");
                    if (onLoginSuccess) onLoginSuccess(userCredential.user);
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create user profile
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: email,
                    createdAt: new Date().toISOString(),
                    subscriptionStatus: 'inactive',
                    role: 'user'
                });

                // Send Verification Email
                await sendEmailVerification(userCredential.user);
                toast("Cuenta creada. ¡Verifica tu email!", "success");
            }
        } catch (err) {
            console.error("Firebase Auth Error:", err);
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">tupresulisto<span className="text-sky-600">.com</span></h1>
                    <p className="text-slate-500 mt-2">
                        {mode === 'register' ? 'Crea tu cuenta profesional' : 'Gestión profesional para carpintería'}
                    </p>
                </div>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2 animate-fade-in">
                        <AlertCircle className="shrink-0 mt-0.5" size={16} />
                        <span>{error}</span>
                    </div>
                )}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL</label>
                        <input
                            type="email"
                            required
                            className="w-full input-saas p-3 rounded-lg text-slate-900"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">CONTRASEÑA</label>
                        <input
                            type="password"
                            required
                            className="w-full input-saas p-3 rounded-lg text-slate-900"
                            placeholder={mode === 'register' ? "Crea una clave segura" : "••••••••"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}

                        />
                        {mode === 'login' && (
                            <div className="flex justify-end mt-1">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-slate-400 hover:text-sky-600 font-medium transition-colors"
                                >
                                    ¿Has olvidado tu contraseña?
                                </button>
                            </div>
                        )}
                    </div>
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">REPETIR CONTRASEÑA</label>
                            <input
                                type="password"
                                required
                                className={`w-full input-saas p-3 rounded-lg text-slate-900 ${password !== confirmPassword && confirmPassword ? 'border-red-300 ring-red-200' : ''}`}
                                placeholder="Repite tu clave"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}
                    <button
                        disabled={loading || !isFormValid}
                        className={`w-full py-3 flex items-center justify-center px-4 rounded-lg font-semibold transition-all duration-200 
                            ${loading || !isFormValid
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-500/30'}`}
                    >
                        {loading ? 'Procesando...' : (
                            mode === 'register'
                                ? 'Crear Cuenta Profesional'
                                : <><Lock className="mr-2" size={18} /> Iniciar Sesión Segura</>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    {mode === 'register' ? (
                        <button onClick={onSwitchToLogin} className="text-sm text-slate-500 hover:text-sky-600 font-medium">
                            ¿Ya tienes cuenta? <span className="font-bold underline">Inicia sesión</span>
                        </button>
                    ) : (
                        <button onClick={onSwitchToRegister} className="text-sm text-slate-500 hover:text-sky-600 font-medium">
                            ¿No tienes cuenta? <span className="font-bold underline">Regístrate gratis</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
};

export default LoginScreen;
