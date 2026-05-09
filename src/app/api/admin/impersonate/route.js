import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** @type {string[]} Emails authorized to perform impersonation. */
const ADMIN_EMAILS = ['demo@tupresulisto.com', 'admin@tupresulisto.com', 'tobartistrobot@gmail.com'];

/**
 * Generates a Firebase custom token so an admin can sign in as another user.
 * The token carries an `impersonatedBy` claim for auditing purposes.
 *
 * @param {Request} request - Incoming POST request with JSON body { targetUserId: string }.
 * @returns {Promise<NextResponse>} JSON with { customToken } or an error.
 */
export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const { admin } = getAdmin();

        // Verify the caller is a real admin
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!ADMIN_EMAILS.includes(decodedToken.email)) {
            console.warn(`Unauthorized impersonation attempt by: ${decodedToken.email}`);
            return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
        }

        const body = await request.json();
        const { targetUserId, targetUserEmail } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
        }

        // Verify target user exists in Firebase Auth
        await admin.auth().getUser(targetUserId);

        // Generate custom token with impersonation claim for auditing
        const customToken = await admin.auth().createCustomToken(targetUserId, {
            impersonatedBy: decodedToken.email,
            impersonatedByUid: decodedToken.uid,
            targetUserEmail: targetUserEmail || '',
        });

        console.info(`[IMPERSONATION] Admin ${decodedToken.email} accessing user ${targetUserId} (${targetUserEmail})`);

        return NextResponse.json({ customToken });

    } catch (error) {
        console.error('Impersonation error:', error);
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Admin token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
