import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';
import { isAdminEmail } from '@/lib/adminEmails';

// Next.js API Routes runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns admin dashboard statistics. Requires a valid Firebase ID token
 * from an authorized admin email.
 * @param {Request} request - The incoming HTTP request.
 * @returns {Promise<NextResponse>} JSON with user stats and list.
 */
export async function GET(request) {
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
        if (!isAdminEmail(userEmail)) {
            console.warn(`Unauthorized admin access attempt by: ${userEmail}`);
            return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
        }

        // Fetch stats with Admin SDK (has full access)
        const usersSnapshot = await adminDb.collection('users').get();
        const totalUsers = usersSnapshot.size;

        /** @type {Array<object>} */
        const usersList = [];
        let verifiedUsers = 0;

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.emailVerified) verifiedUsers++;

            usersList.push({
                id: doc.id,
                email: data.email,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                emailVerified: data.emailVerified,
                subscriptionStatus: data.subscriptionStatus,
                isPro: data.isPro,
                redeemCode: data.redeemCode,
                productsCount: data.products?.length || 0
            });
        });

        // Products count
        let totalProducts = 0;
        try {
            const productsSnapshot = await adminDb.collection('products').get();
            totalProducts = productsSnapshot.size;
        } catch (_e) {
            // Products collection may not exist yet
        }

        return NextResponse.json({
            totalUsers,
            verifiedUsers,
            totalProducts,
            users: usersList
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
