import { useState, useCallback } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

export const processImage = (file) => new Promise((resolve, reject) => {
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

export const useSysConfig = ({ user, config, setConfig, products, categories, setProducts, setCategories, toast }) => {
    // 1. Coupon Logic
    const [couponCode, setCouponCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleRedeem = useCallback(async () => {
        setIsRedeeming(true);
        try {
            const response = await fetch('/api/redeem-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, code: couponCode })
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
    }, [couponCode, user?.uid, toast]);

    // 2. Auth & Security Logic
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);

    const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');

    const handleChangePassword = useCallback(async () => {
        if (!newPassword || newPassword.length < 6) return toast("La nueva contraseña debe tener al menos 6 caracteres", "error");
        if (newPassword !== confirmNewPassword) return toast("Las contraseñas nuevas no coinciden", "error");
        if (!currentPassword) return toast("Debes ingresar tu contraseña actual para confirmar", "error");

        setSecurityLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
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
    }, [user, currentPassword, newPassword, confirmNewPassword, toast]);

    // 3. Logo Handling
    const handleLogo = useCallback(async (e) => {
        try {
            const b64 = await processImage(e.target.files[0]);
            setConfig({ ...config, logo: b64 });
        } catch (err) {
            toast(err.message, "error");
        }
    }, [config, setConfig, toast]);

    // 4. Catalog Management
    const handleExportCatalog = useCallback(() => {
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
    }, [products, categories, toast]);

    const handleImportCatalog = useCallback((file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (Array.isArray(json.products) && Array.isArray(json.categories)) {
                    const newCats = [...new Set([...categories, ...json.categories])];
                    setCategories(newCats);

                    const importedProducts = json.products.map((p, idx) => ({
                        ...p,
                        id: `${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`
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
    }, [categories, setCategories, setProducts, toast]);

    return {
        couponCode, setCouponCode, isRedeeming, handleRedeem,
        currentPassword, setCurrentPassword, newPassword, setNewPassword,
        confirmNewPassword, setConfirmNewPassword, securityLoading, handleChangePassword, isGoogleUser,
        handleLogo,
        handleExportCatalog, handleImportCatalog
    };
};
