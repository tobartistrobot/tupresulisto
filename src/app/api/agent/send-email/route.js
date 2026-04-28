import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Sends an email via Hostinger SMTP on behalf of the AI Agent.
 * 
 * @param {Request} request - The incoming HTTP request.
 * @returns {Promise<NextResponse>} The JSON response indicating success or failure.
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
        const { to, subject, text, pdfUrl } = body;

        if (!to || !subject || !text) {
            return NextResponse.json({ error: 'Missing required email fields (to, subject, text)' }, { status: 400 });
        }

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465', 10),
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"Presupuestos Gova Ventanas" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: pdfUrl ? `${text}\n\nPuedes ver o descargar tu presupuesto aquí: ${pdfUrl}` : text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId }, { status: 200 });

    } catch (error) {
        console.error('Error sending email from agent:', error);
        return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 });
    }
}
