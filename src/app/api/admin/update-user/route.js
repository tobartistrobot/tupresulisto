import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';

// Next.js API Routes runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** @type {string[]} Emails authorized to access the admin endpoints. */
const ADMIN_EMAILS = ['demo@tupresulisto.com', 'admin@tupresulisto.com', 'tobartistrobot@gmail.com'];

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

        // Check if user is admin
        if (!ADMIN_EMAILS.includes(userEmail)) {
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

        await userRef.update({
            isPro: isPro,
            subscriptionStatus: isPro ? 'manual' : 'inactive',
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
