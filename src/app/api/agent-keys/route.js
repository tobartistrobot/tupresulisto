import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';
import { generateApiKey, hashApiKey, MAX_ACTIVE_KEYS } from '@/lib/apiKeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Gestión de claves de API para agentes, siempre sobre la cuenta del que
 * llama: se verifica el ID token de Firebase y se usa el uid del token,
 * nunca un id que venga en el cuerpo (misma regla que redeem-coupon).
 */
async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const { admin } = getAdmin();
    try {
        return await admin.auth().verifyIdToken(authHeader.substring(7));
    } catch {
        return null;
    }
}

/** Lista las claves del usuario (sin la clave en claro: no se guarda). */
export async function GET(request) {
    try {
        const decoded = await authenticate(request);
        if (!decoded) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { adminDb } = getAdmin();
        const snap = await adminDb.collection('api_keys').where('uid', '==', decoded.uid).get();

        const keys = snap.docs
            .map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    label: data.label || '',
                    prefix: data.prefix || '',
                    revoked: Boolean(data.revoked),
                    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
                    lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() ?? null,
                };
            })
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        return NextResponse.json({ keys });
    } catch (error) {
        console.error('agent-keys GET error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/** Crea una clave nueva. La clave en claro solo viaja en esta respuesta. */
export async function POST(request) {
    try {
        const decoded = await authenticate(request);
        if (!decoded) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { label } = await request.json().catch(() => ({}));

        const { adminDb } = getAdmin();
        const existing = await adminDb.collection('api_keys').where('uid', '==', decoded.uid).get();
        const activas = existing.docs.filter(d => !d.data().revoked).length;
        if (activas >= MAX_ACTIVE_KEYS) {
            return NextResponse.json(
                { error: `Máximo ${MAX_ACTIVE_KEYS} claves activas. Revoca alguna antes de crear otra.` },
                { status: 400 }
            );
        }

        const key = generateApiKey();
        const keyId = hashApiKey(key);
        await adminDb.collection('api_keys').doc(keyId).set({
            uid: decoded.uid,
            label: String(label || '').slice(0, 60) || 'Sin nombre',
            prefix: key.slice(0, 12), // para reconocerla en el listado sin exponerla
            revoked: false,
            createdAt: new Date(),
            lastUsedAt: null,
        });

        return NextResponse.json({ key, id: keyId });
    } catch (error) {
        console.error('agent-keys POST error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/** Revoca una clave del propio usuario (no la borra: queda como rastro). */
export async function DELETE(request) {
    try {
        const decoded = await authenticate(request);
        if (!decoded) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { id } = await request.json().catch(() => ({}));
        if (!id) return NextResponse.json({ error: 'Falta el id de la clave' }, { status: 400 });

        const { adminDb } = getAdmin();
        const ref = adminDb.collection('api_keys').doc(String(id));
        const doc = await ref.get();
        if (!doc.exists || doc.data().uid !== decoded.uid) {
            return NextResponse.json({ error: 'Clave no encontrada' }, { status: 404 });
        }

        await ref.update({ revoked: true, revokedAt: new Date() });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('agent-keys DELETE error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
