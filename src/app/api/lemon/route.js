import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Helper to lazy-load Firebase Admin
function getAdminDb() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        } catch (e) {
            console.error("Firebase Admin initialization error:", e);
            throw e; // Rethrow to handle in the route
        }
    }
    return admin.firestore();
}

export async function POST(req) {
    try {
        // 1. Verify Signature
        const rawBody = await req.text();
        const signature = req.headers.get('x-signature');
        const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

        // If secret is missing (not configured), return error
        if (!secret) {
            console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(rawBody).digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Process Event
        const payload = JSON.parse(rawBody);
        const eventName = payload.meta.event_name;

        console.log(`[LemonWebhook] Event received: ${eventName}`);

        // We care about created orders/subscriptions
        if (eventName === 'order_created' || eventName === 'subscription_created') {
            // 3. Extract User ID
            const userId = payload.meta.custom_data?.user_id;

            if (userId) {
                console.log(`[LemonWebhook] Upgrading user: ${userId}`);

                try {
                    const db = getAdminDb();
                    await db.collection('users').doc(userId).update({
                        isPro: true,
                        subscriptionStatus: 'active',
                        plan: 'pro',
                        updatedAt: new Date()
                    });
                    return NextResponse.json({ message: 'User upgraded successfully' });
                } catch (err) {
                    console.error("Database error:", err);
                    return NextResponse.json({ error: 'Database error' }, { status: 500 });
                }
            } else {
                console.warn("[LemonWebhook] No user_id in custom_data");
            }
        }

        return NextResponse.json({ message: 'Event received' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
