import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Next.js API Routes runtime config  
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminDb() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    return admin.firestore();
}

export async function POST(request) {
    try {
        const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        const text = await request.text();
        const signature = request.headers.get('x-signature');

        // Secure signature verification using timingSafeEqual
        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(text).digest('hex');

        if (!signature || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
            console.warn('Invalid webhook signature received');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(text);
        const eventName = payload.meta.event_name;
        const userId = payload.meta.custom_data?.user_id;

        if (!userId) {
            console.warn('Webhook without user_id:', eventName);
            return NextResponse.json({ message: 'No user_id found' }, { status: 200 });
        }

        const db = getAdminDb();
        const userRef = db.collection('users').doc(userId);
        const subData = payload.data.attributes;

        let updateData = {
            lemonCustomerId: subData.customer_id,
            lemonSubscriptionId: subData.id,
            lemonVariantId: subData.variant_id,
            lemonRenewsAt: subData.renews_at || null,
            lemonCancelled: subData.cancelled || false,
            lemonCustomerPortalUrl: subData.urls?.customer_portal || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        switch (eventName) {
            case 'subscription_created':
            case 'subscription_updated':
            case 'subscription_resumed':
                if (subData.status === 'active' || subData.status === 'on_trial') {
                    updateData.subscriptionStatus = 'active';
                } else if (subData.status === 'past_due') {
                    updateData.subscriptionStatus = 'past_due';
                } else {
                    updateData.subscriptionStatus = 'inactive';
                }
                break;

            case 'subscription_cancelled':
            case 'subscription_expired':
                updateData.subscriptionStatus = 'inactive';
                break;

            default:
                console.log('Ignoring webhook event:', eventName);
                return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
        }

        await userRef.set(updateData, { merge: true });
        console.log(`Webhook processed: ${eventName} for user ${userId}`);

        return NextResponse.json({ message: 'Webhook processed successfully' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
