import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase'; // Using absolute path alias
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export async function POST(request) {
    try {
        // 1. Validate Signature
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
        if (!secret) {
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        const text = await request.text();
        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(text).digest('hex');
        const signature = request.headers.get('x-signature');

        if (!signature || signature !== digest) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Parse Event
        const payload = JSON.parse(text);
        const eventName = payload.meta.event_name;
        const customData = payload.meta.custom_data;
        const userId = customData?.user_id;

        if (!userId) {
            // If no user_id, we can't link it to a user. Log this.
            console.warn('Webhook received without user_id:', payload);
            return NextResponse.json({ message: 'No user_id found' }, { status: 200 });
        }

        // 3. Handle Events
        const userRef = doc(db, 'users', userId);

        // Default status logic
        let subscriptionStatus = 'inactive';
        const subData = payload.data.attributes;

        switch (eventName) {
            case 'subscription_created':
            case 'subscription_updated':
            case 'subscription_resumed':
                // Check status from LS (active, on_trial, etc.)
                // We map LS status to our app status
                if (subData.status === 'active' || subData.status === 'on_trial') {
                    subscriptionStatus = 'active';
                } else if (subData.status === 'past_due') {
                    subscriptionStatus = 'past_due'; // Maybe allow access with warning
                } else {
                    subscriptionStatus = 'inactive';
                }
                break;

            case 'subscription_cancelled':
            case 'subscription_expired':
                subscriptionStatus = 'inactive';
                break;

            default:
                // Other events (order_created, etc.) ignore for now
                return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
        }

        // 4. Update Firestore
        // Using setDoc with merge to ensure document exists if it was deleted/missing
        await setDoc(userRef, {
            subscriptionStatus,
            lemonCustomerId: subData.customer_id,
            lemonSubscriptionId: subData.id,
            lemonVariantId: subData.variant_id,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ message: 'Webhook processed', status: subscriptionStatus });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
