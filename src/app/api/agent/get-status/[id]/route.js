import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request, { params }) {
    try {
        // Validate Bearer token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        if (token !== process.env.AGENT_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Missing budgetId in URL' }, { status: 400 });
        }

        const budgetRef = doc(db, 'presupuestos', id);
        const budgetSnap = await getDoc(budgetRef);

        if (!budgetSnap.exists()) {
            return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
        }

        const data = budgetSnap.data();

        return NextResponse.json({
            success: true,
            status: data.status,
            client: data.client,
            total: data.total,
            adminNotificationSent: data.adminNotificationSent,
            createdAt: data.createdAt
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching budget status:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
