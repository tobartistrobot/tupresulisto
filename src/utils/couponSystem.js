import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";

// List of active master codes
const MASTER_COUPONS = {
    'BETA2026': { type: 'pro', duration: 'lifetime', label: 'Acceso Pionero' },
    'PIONEROS': { type: 'pro', duration: 'lifetime', label: 'Acceso Pionero' },
    'DEMOPRO': { type: 'pro', duration: '30days', label: 'Prueba 30 Días' }
};

export const redeemCoupon = async (userId, codeInput) => {
    if (!userId) return { success: false, message: "Usuario no identificado." };
    if (!codeInput) return { success: false, message: "Introduce un código." };

    const code = codeInput.trim().toUpperCase();
    const coupon = MASTER_COUPONS[code];

    if (!coupon) {
        return { success: false, message: "Código no válido o expirado." };
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        const upgradeData = {
            subscriptionStatus: 'pro',
            planLabel: coupon.label,
            redeemCode: code,
            redeemedAt: new Date().toISOString(),
            planExpiry: coupon.duration === 'lifetime' ? 'lifetime' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.redeemCode || userData.redeemedAt) {
                return { success: false, message: "Ya has canjeado un código promocional anteriormente." };
            }
            await updateDoc(userRef, upgradeData);
        } else {
            // Create if profile doesn't exist (unlikely but safe)
            await setDoc(userRef, { uid: userId, ...upgradeData });
        }

        return { success: true, message: `¡Código ${code} canjeado! Ahora eres PRO.` };
    } catch (error) {
        console.error("Redemption error:", error);
        return { success: false, message: "Error al canjear el código. Inténtalo de nuevo." };
    }
};
