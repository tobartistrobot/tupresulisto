import { NextResponse } from 'next/server';

/**
 * Telegram webhook endpoint to receive incoming messages.
 * 
 * @param {Request} request - The incoming HTTP request from Telegram.
 * @returns {Promise<NextResponse>} The JSON response confirming receipt.
 */
export async function POST(request) {
    try {
        const body = await request.json();

        if (body.message) {
            const chatId = body.message.chat?.id?.toString();
            const text = body.message.text || '';

            // 1. Verify it's the admin
            if (chatId === process.env.ADMIN_TELEGRAM_ID) {
                // 2. Check if it's an approve command
                const approveMatch = text.match(/^Aprobar\s+(.+)$/i);
                
                if (approveMatch) {
                    const budgetId = approveMatch[1].trim();

                    // 3. Call the internal approve endpoint
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    
                    try {
                        const approveRes = await fetch(`${baseUrl}/api/agent/approve-budget`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.AGENT_SECRET_KEY}`
                            },
                            body: JSON.stringify({ budgetId })
                        });

                        const approveData = await approveRes.json();
                        let replyText = '';

                        if (approveRes.ok) {
                            replyText = `¡Entendido! Presupuesto #${budgetId} aprobado y enviado al cliente. Estado actualizado a: ENVIADO.`;
                        } else {
                            replyText = `Hubo un error al aprobar el presupuesto #${budgetId}: ${approveData.error || 'Error desconocido'}`;
                        }

                        // 4. Send reply back to Telegram
                        if (process.env.TELEGRAM_BOT_TOKEN) {
                            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: chatId,
                                    text: replyText
                                })
                            });
                        }
                    } catch (err) {
                        console.error('Error processing approve command:', err);
                    }
                } else {
                    // TODO: Other agent logic goes here
                    console.log(`Received message from admin: ${text}`);
                }
            } else {
                console.log(`Unauthorized message from ${chatId}: ${text}`);
            }
        }

        // Always return 200 immediately so Telegram doesn't retry
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error in Telegram Webhook:', error);
        // We still return 200 to prevent Telegram from repeatedly sending the same failing webhook,
        // but log the error for internal tracking.
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}
