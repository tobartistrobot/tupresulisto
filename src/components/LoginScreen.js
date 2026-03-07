import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Lock, AlertCircle, Calculator } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFriendlyErrorMessage } from '../utils/authErrors';

const LoginScreen = ({ onLoginSuccess, mode = 'login', onSwitchToRegister, onSwitchToLogin }) => {
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState('');

    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const isFormValid = mode === 'register'
        ? isValidEmail(email) && password.length >= 6 && password === confirmPassword
        : isValidEmail(email) && password.length > 0;

    const handleForgotPassword = async () => {
        if (!email) {
            toast("Por favor, escribe tu email primero para poder recuperarla", "info");
            return;
        }

        setIsResetting(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast("Correo de recuperación enviado. Revisa tu bandeja de entrada.", "success");
        } catch (error) {
            console.error("Error password reset:", error);
            if (error.code === 'auth/user-not-found') {
                toast("No encontramos ninguna cuenta con ese email", "error");
            } else {
                toast(getFriendlyErrorMessage(error.code), "error");
            }
        } finally {
            setIsResetting(false);
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
                if (!userCredential.user.emailVerified) {
                    console.log("User not verified, waiting for redirect...");
                } else {
                    console.log("User verified, entering dashboard...");
                    if (onLoginSuccess) onLoginSuccess(userCredential.user);
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: email,
                    createdAt: new Date().toISOString(),
                    subscriptionStatus: 'inactive',
                    role: 'user'
                });

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

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    subscriptionStatus: 'inactive',
                    role: 'user',
                    photoURL: user.photoURL,
                    displayName: user.displayName
                });
            }

            if (onLoginSuccess) onLoginSuccess(user);

        } catch (err) {
            console.error("Google Sign In Error:", err);
            setError("Error al iniciar con Google. " + (err.message || ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500">
            {/* Ambient Animated Gradient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-400/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-400/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-400/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">

                {/* Logo and Branding Header */}
                <div className="flex flex-col items-center mb-8 gap-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-sky-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-300 border border-brand-500/30">
                            <Calculator className="text-white drop-shadow-md" size={32} />
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1">
                            tupresulisto<span className="text-brand-600 dark:text-brand-400">.com</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                            {mode === 'login' ? 'Bienvenido de nuevo, profesional' : 'Comienza a presupuestar como un experto'}
                        </p>
                    </div>
                </div>

                {/* Glassmorphism Auth Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 flex items-start gap-3 animate-fade-in backdrop-blur-sm">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                            Continuar con Google
                        </button>

                        <div className="relative flex items-center justify-center my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700/50"></div>
                            </div>
                            <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded-full">O usa tu email</span>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="group">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Dirección Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-300 placeholder:text-slate-400"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="group">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-300 placeholder:text-slate-400"
                                    placeholder={mode === 'register' ? "Crea una clave segura" : "••••••••"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {mode === 'login' && (
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            disabled={isResetting}
                                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isResetting ? 'Enviando...' : '¿Has olvidado tu contraseña?'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {mode === 'register' && (
                                <div className="group">
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Repetir Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        className={`w-full bg-slate-50 dark:bg-slate-800 border ${password !== confirmPassword && confirmPassword ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/20'} rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-4 outline-none transition-all duration-300 placeholder:text-slate-400`}
                                        placeholder="Repite tu clave"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="pt-2">
                                <button
                                    disabled={loading}
                                    onClick={handleAuth}
                                    className={`w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Procesando...' : (
                                        mode === 'register'
                                            ? 'Crear Cuenta Profesional'
                                            : <><Lock className="mr-2" size={18} /> Iniciar Sesión Segura</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-full py-2 px-6 border border-white/20 inline-block mx-auto">
                    {mode === 'register' ? (
                        <button onClick={onSwitchToLogin} className="text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">
                            ¿Ya tienes cuenta? <span className="font-extrabold ml-1">Inicia sesión</span>
                        </button>
                    ) : (
                        <button onClick={onSwitchToRegister} className="text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">
                            ¿No tienes cuenta? <span className="font-extrabold ml-1">Regístrate gratis</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
