import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';
import { isVerifiedAdmin } from '@/lib/adminEmails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        const { adminDb, admin } = getAdmin();

        // Verify the caller is a real admin (email en la lista Y verificado)
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!isVerifiedAdmin(decodedToken)) {
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

        // Rastro de auditoría persistente: los logs de Vercel son efímeros y
        // "quién entró como quién y cuándo" es justo lo que conviene poder
        // responder meses después. Si la escritura falla no se bloquea el
        // acceso, pero queda registrado el fallo en los logs.
        try {
            await adminDb.collection('admin_audit').add({
                action: 'impersonation',
                adminEmail: decodedToken.email,
                adminUid: decodedToken.uid,
                targetUserId,
                targetUserEmail: targetUserEmail || null,
                at: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (auditError) {
            console.error('[IMPERSONATION] Audit write failed:', auditError);
        }

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
