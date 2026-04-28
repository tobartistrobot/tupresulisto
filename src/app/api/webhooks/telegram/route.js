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

        // Ensure it's a message and has required fields
        if (body.message) {
            const chatId = body.message.chat?.id;
            const text = body.message.text;

            // TODO: Here you would integrate with your AI Agent logic.
            // e.g., Trigger an event, add to a queue, or call your Claude agent.
            
            console.log(`Received Telegram message from ${chatId}: ${text}`);
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
