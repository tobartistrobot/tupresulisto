import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';
import { isVerifiedAdmin } from '@/lib/adminEmails';

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

        // Check if user is admin (email en la lista Y verificado)
        if (!isVerifiedAdmin(decodedToken)) {
            console.warn(`Unauthorized admin access attempt by: ${userEmail}`);
            return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
        }

        // Fetch stats with Admin SDK (has full access)
        const usersSnapshot = await adminDb.collection('users').get();
        const totalUsers = usersSnapshot.size;

        // El estado de verificación vive en Firebase Auth, no en Firestore:
        // la copia del documento se escribe al registrarse y se queda vieja si
        // el usuario verifica su email después. Se lee de Auth (paginado).
        /** @type {Map<string, boolean>} */
        const verifiedByUid = new Map();
        try {
            let pageToken;
            do {
                const page = await admin.auth().listUsers(1000, pageToken);
                page.users.forEach(u => verifiedByUid.set(u.uid, u.emailVerified));
                pageToken = page.pageToken;
            } while (pageToken);
        } catch (authError) {
            // Si Auth fallara, se degrada a la copia de Firestore en vez de romper el panel.
            console.error('Admin stats: listUsers failed, falling back to Firestore emailVerified', authError);
        }

        /** @type {Array<object>} */
        const usersList = [];
        let verifiedUsers = 0;
        let totalProducts = 0;

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            const emailVerified = verifiedByUid.has(doc.id) ? verifiedByUid.get(doc.id) : Boolean(data.emailVerified);
            if (emailVerified) verifiedUsers++;

            const productsCount = data.products?.length || 0;
            totalProducts += productsCount;

            usersList.push({
                id: doc.id,
                email: data.email,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                emailVerified,
                subscriptionStatus: data.subscriptionStatus,
                isPro: data.isPro,
                redeemCode: data.redeemCode,
                planExpiry: data.planExpiry ?? null,
                planLabel: data.planLabel ?? null,
                productsCount
            });
        });

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
