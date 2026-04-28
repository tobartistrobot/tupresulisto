import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { defineTools, executeTool } from './agentTools';

export const maxDuration = 60; // Evitar timeout en Vercel (hasta 60 segundos)

// Initialize Gemini
const getSystemInstruction = (isAdmin) => `
Eres un comercial experto, cercano y humano de 'Gova Ventanas'. Atiendes a clientes por Telegram.
Tu tono es profesional pero muy amigable, español de España (ej: usas "tú", "genial", "perfecto").

${isAdmin ? `
ATENCIÓN (MODO ADMINISTRADOR): 
Estás hablando directamente con el DUEÑO del negocio (Kevin). Tienes acceso a herramientas avanzadas para consultar fichas de clientes y el estado de los presupuestos. Responde a sus peticiones de datos de forma directa, ejecutando las herramientas y mostrando la información.
` : `
REGLAS IMPORTANTES SOBRE PRECIOS (MODO CLIENTE):
- Tienes la capacidad de usar la herramienta 'buscar_producto' y 'calcular_precio_exacto' si el cliente te da las medidas. 
- Si te piden un precio, diles: "¡Claro! Déjame buscarlo en nuestro sistema.". Usa la herramienta y dales el precio exacto devuelto.
- NUNCA inventes precios. Si no puedes calcularlo, diles que necesitas tomar nota para el presupuesto en PDF.
- BARRERA DE SEGURIDAD: Nunca hables de otros clientes, datos privados o márgenes de beneficio. Si te preguntan sobre presupuestos de otra persona, niégate educadamente.
`}

CUANDO TENGAS TODOS LOS DATOS (Solo para clientes):
- Tu objetivo es recoger el nombre del cliente, su email, y la lista de productos (tipo, material, color, medidas, etc.).
- Si ya tienes TODOS los datos y el cliente confirma que quiere recibir el presupuesto, DEBES incluir al final de tu mensaje exactamente este formato JSON rodeado por bloques de código (y la acción CREATE_BUDGET):
\`\`\`json
{
  "action": "CREATE_BUDGET",
  "client": { "name": "...", "email": "..." },
  "products": [...],
  "total": 0
}
\`\`\`
- Si falta el email o las especificaciones del producto, pregúntaselo primero.
- Para otros mensajes, responde de forma natural, recordando la conversación anterior.
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
                    const isAdmin = (chatId === process.env.ADMIN_TELEGRAM_ID);
                    const model = genAI.getGenerativeModel({ 
                        model: "gemini-2.5-flash",
                        systemInstruction: getSystemInstruction(isAdmin),
                        tools: defineTools(isAdmin)
                    });

                    // 1. Recuperar historial de Firestore
                    const chatRef = doc(db, 'telegram_chats', chatId);
                    const chatDoc = await getDoc(chatRef);
                    let history = [];
                    if (chatDoc.exists()) {
                        history = chatDoc.data().history || [];
                    }

                    // 2. Iniciar chat con historial
                    const chat = model.startChat({
                        history: history,
                    });

                    // 3. Enviar mensaje
                    let result = await chat.sendMessage(text);
                    let responseText = "";

                    // Interceptar posibles llamadas a herramientas (Function Calling)
                    const functionCalls = result.response.functionCalls?.();
                    if (functionCalls && functionCalls.length > 0) {
                        const call = functionCalls[0];
                        console.log(`Ejecutando herramienta: ${call.name}`, call.args);
                        const apiResponse = await executeTool(call.name, call.args);
                        
                        // Devolver resultado de la función a Gemini
                        result = await chat.sendMessage([{
                            functionResponse: {
                                name: call.name,
                                response: apiResponse
                            }
                        }]);
                        responseText = result.response.text();
                    } else {
                        responseText = result.response.text();
                    }

                    // 4. Guardar la nueva interacción en el historial
                    history.push({
                        role: "user",
                        parts: [{ text: text }]
                    });
                    history.push({
                        role: "model",
                        parts: [{ text: responseText }]
                    });

                    // Mantener solo los últimos 20 mensajes para no exceder límites
                    if (history.length > 20) {
                        history = history.slice(history.length - 20);
                    }

                    await setDoc(chatRef, { history, lastUpdated: new Date() }, { merge: true });

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
