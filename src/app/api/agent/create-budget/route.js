import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Creates a new budget in Firestore initiated by an AI agent.
 * 
 * @param {Request} request - The incoming HTTP request.
 * @returns {Promise<NextResponse>} The JSON response with the created budget ID.
 */
export async function POST(request) {
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

        const body = await request.json();

        // Enforce required fields or provide defaults if necessary
        const { client, products, total, ...otherData } = body;

        // Save to Firestore 'presupuestos' collection
        const presupuestosRef = collection(db, 'presupuestos');
        const newBudgetRef = await addDoc(presupuestosRef, {
            client: client || {},
            products: products || [],
            total: total || 0,
            ...otherData,
            createdBy: 'AI_AGENT',
            agentEmail: 'presupuestos@govaventanas.es',
            status: 'pending_approval',
            adminNotificationSent: false,
            createdAt: serverTimestamp()
        });

        // Generate a mock URL or the logic for your PDF generation.
        // Assuming a dynamic route exists like /presupuestos/[id]/pdf
        const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tupresulisto.com'}/presupuestos/${newBudgetRef.id}/pdf`;

        return NextResponse.json({
            success: true,
            budgetId: newBudgetRef.id,
            pdfUrl: pdfUrl
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating budget from agent:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
