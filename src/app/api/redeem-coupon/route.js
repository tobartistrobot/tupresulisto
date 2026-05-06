import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';

// Next.js API Routes runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Parses coupon definitions from the COUPON_CODES environment variable.
 * Format: CODE:TYPE:DURATION,CODE:TYPE:DURATION
 * @returns {Record<string, {type: string, duration: string, label: string}>}
 */
function parseCoupons() {
    const raw = process.env.COUPON_CODES || '';
    /** @type {Record<string, {type: string, duration: string, label: string}>} */
    const coupons = {};
    raw.split(',').forEach(entry => {
        const [code, type, duration] = entry.trim().split(':');
        if (code) coupons[code] = { type, duration, label: type === 'pro' ? 'Acceso Pionero' : 'Basic' };
    });
    return coupons;
}

/**
 * Redeems a promotional coupon code for a given user.
 * @param {Request} request - The incoming HTTP request.
 * @returns {Promise<NextResponse>} JSON response indicating success or failure.
 */
export async function POST(request) {
    try {
        const { userId, code } = await request.json();

        if (!userId || !code) {
            return NextResponse.json({
                success: false,
                message: 'Datos incompletos'
            }, { status: 400 });
        }

        const coupons = parseCoupons();
        const coupon = coupons[code.toUpperCase()];

        if (!coupon) {
            return NextResponse.json({
                success: false,
                message: 'Código no válido o expirado'
            });
        }

        const { adminDb, admin } = getAdmin();
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({
                success: false,
                message: 'Usuario no encontrado'
            }, { status: 404 });
        }

        const userData = userDoc.data();
        if (userData.redeemCode || userData.redeemedAt) {
            return NextResponse.json({
                success: false,
                message: 'Ya has canjeado un código promocional anteriormente'
            });
        }

        const upgradeData = {
            subscriptionStatus: 'active',
            planLabel: coupon.label,
            redeemCode: code.toUpperCase(),
            redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
            planExpiry: coupon.duration === 'lifetime'
                ? 'lifetime'
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        await userRef.update(upgradeData);

        return NextResponse.json({
            success: true,
            message: `¡Código ${code.toUpperCase()} canjeado! Ahora eres PRO.`
        });

    } catch (error) {
        console.error('Redeem coupon error:', error);
        return NextResponse.json({
            success: false,
            message: 'Error al canjear el código. Inténtalo de nuevo.'
        }, { status: 500 });
    }
}
