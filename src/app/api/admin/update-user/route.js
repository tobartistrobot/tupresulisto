import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';
import { isVerifiedAdmin } from '@/lib/adminEmails';

// Next.js API Routes runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        // Get auth token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const { adminDb, admin } = getAdmin();

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        // Check if user is admin (email en la lista Y verificado)
        if (!isVerifiedAdmin(decodedToken)) {
            console.warn(`Unauthorized admin update attempt by: ${userEmail}`);
            return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, isPro } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Bad Request - Missing userId' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(userId);
        
        // Ensure user document exists
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'Not Found - User does not exist' }, { status: 404 });
        }

        // planExpiry se limpia SIEMPRE: si quedara una caducidad vieja de un
        // cupón, getSubscriptionState() anularía el PRO manual en cuanto esa
        // fecha pasara (o al instante, si ya está vencida), y el panel diría
        // PRO mientras la app dice FREE.
        await userRef.update({
            isPro: isPro,
            subscriptionStatus: isPro ? 'manual' : 'inactive',
            planLabel: isPro ? 'PRO manual' : admin.firestore.FieldValue.delete(),
            planExpiry: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true, isPro });

    } catch (error) {
        console.error('Admin update user error:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
