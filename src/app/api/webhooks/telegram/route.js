import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const systemInstruction = `
Eres un amable oficinista experto en ventas para 'Gova Ventanas'.
Atiendes clientes por Telegram.
Tu objetivo es responder sus dudas sobre ventanas y, si quieren un presupuesto, recoger su nombre, email y qué productos quieren.
Si ya tienes todos los datos y el cliente confirma que quiere el presupuesto, DEBES incluir al final de tu mensaje exactamente este formato JSON rodeado por bloques de código (y la acción CREATE_BUDGET):
\`\`\`json
{
  "action": "CREATE_BUDGET",
  "client": { "name": "...", "email": "..." },
  "products": [...],
  "total": 1500
}
\`\`\`
Para otros mensajes, responde de forma natural y conversacional. No incluyas el JSON si no tienen toda la información.
`;

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

            // 1. Verify if it's an admin approve command
            const approveMatch = text.match(/^Aprobar\s+(.+)$/i);
            
            if (chatId === process.env.ADMIN_TELEGRAM_ID && approveMatch) {
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
                // Lógica del Agente IA (Gemini) para clientes o para el administrador probando el bot
                console.log(`Mensaje de cliente ${chatId}: ${text}`);
                
                try {
                    const model = genAI.getGenerativeModel({ 
                        model: "gemini-1.5-flash",
                        systemInstruction: systemInstruction
                    });

                    const result = await model.generateContent(text);
                    const responseText = result.response.text();

                    let replyToTelegram = responseText;

                    // Si Gemini generó la orden de crear presupuesto
                    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
                    if (jsonMatch) {
                        try {
                            const parsed = JSON.parse(jsonMatch[1]);
                            if (parsed.action === "CREATE_BUDGET") {
                                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                                
                                await fetch(`${baseUrl}/api/agent/create-budget`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${process.env.AGENT_SECRET_KEY}`
                                    },
                                    body: JSON.stringify(parsed)
                                });
                                
                                // Remover el JSON de la respuesta final que lee el cliente
                                replyToTelegram = responseText.replace(/```json\n[\s\S]*?\n```/, '').trim();
                                if (!replyToTelegram) {
                                    replyToTelegram = "¡Perfecto! Ya he generado tu presupuesto y lo envié a administración para que lo revisen. Te avisaremos pronto.";
                                }
                            }
                        } catch (e) {
                            console.error("Error parseando JSON de Gemini:", e);
                        }
                    }

                    // Enviar respuesta al cliente en Telegram
                    if (process.env.TELEGRAM_BOT_TOKEN) {
                        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: replyToTelegram
                            })
                        });
                    }
                } catch (geminiError) {
                    console.error("Gemini Error:", geminiError);
                    return NextResponse.json({ success: false, error: "Gemini Error: " + geminiError.message }, { status: 200 });
                }
            }
        }

        // Always return 200 immediately so Telegram doesn't retry
        return NextResponse.json({ success: true, processed: true }, { status: 200 });
    } catch (error) {
        console.error('Error in Telegram Webhook:', error);
        // We still return 200 to prevent Telegram from repeatedly sending the same failing webhook,
        // but log the error for internal tracking.
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}
