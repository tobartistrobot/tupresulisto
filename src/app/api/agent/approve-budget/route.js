import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

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
        const { budgetId } = body;

        if (!budgetId) {
            return NextResponse.json({ error: 'Missing budgetId' }, { status: 400 });
        }

        const budgetRef = doc(db, 'presupuestos', budgetId);
        const budgetSnap = await getDoc(budgetRef);

        if (!budgetSnap.exists()) {
            return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
        }

        const budgetData = budgetSnap.data();

        if (budgetData.status !== 'pending_approval') {
            return NextResponse.json({ error: 'Budget is not pending approval', currentStatus: budgetData.status }, { status: 400 });
        }

        // Update status to approved
        await updateDoc(budgetRef, {
            status: 'approved'
        });

        // Send email to client automatically if email exists
        let emailSent = false;
        const clientEmail = budgetData.client?.email;
        if (clientEmail) {
            const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tupresulisto.com'}/presupuestos/${budgetId}/pdf`;
            const subject = 'Tu presupuesto de Gova Ventanas está listo';
            const text = `Hola ${budgetData.client?.name || 'Cliente'},\n\nTu presupuesto ha sido revisado y aprobado.`;

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '465', 10),
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: `"Presupuestos Gova Ventanas" <${process.env.SMTP_USER}>`,
                to: clientEmail,
                subject: subject,
                text: `${text}\n\nPuedes ver o descargar tu presupuesto aquí: ${pdfUrl}`,
            };

            await transporter.sendMail(mailOptions);
            emailSent = true;
        }

        return NextResponse.json({ success: true, message: 'Budget approved', emailSent }, { status: 200 });

    } catch (error) {
        console.error('Error approving budget:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
