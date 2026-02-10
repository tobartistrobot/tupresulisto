const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Lemon Squeezy Webhook Handler - Production Version
exports.lemonWebhook = onRequest(
    {
        region: 'europe-west1',
        secrets: ['LEMON_SQUEEZY_WEBHOOK_SECRET']
    },
    async (req, res) => {
        console.log('=== WEBHOOK START ===');

        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        try {
            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            const eventName = payload.meta?.event_name;
            const customData = payload.meta?.custom_data;
            const userId = customData?.user_id;

            console.log('Event:', eventName, 'UserId:', userId);

            if (!userId) {
                return res.status(200).json({ success: false, message: 'No user_id' });
            }

            // Extract subscription data
            const subData = payload.data?.attributes || {};
            const urls = subData.urls || {};

            // Determine subscription status
            let subscriptionStatus = 'active';
            if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
                subscriptionStatus = 'inactive';
            }

            // Build update data with all subscription info
            const updateData = {
                subscriptionStatus: subscriptionStatus,
                isPro: subscriptionStatus === 'active',
                lemonEventName: eventName,
                lemonUpdatedAt: new Date().toISOString(),
                // Subscription details
                lemonSubscriptionId: payload.data?.id || null,
                lemonCustomerId: subData.customer_id || null,
                lemonVariantId: subData.variant_id || null,
                lemonProductName: subData.product_name || null,
                // Important dates
                lemonRenewsAt: subData.renews_at || null,
                lemonEndsAt: subData.ends_at || null,
                lemonCreatedAt: subData.created_at || null,
                lemonTrialEndsAt: subData.trial_ends_at || null,
                // Status flags
                lemonCancelled: subData.cancelled || false,
                lemonStatusFormatted: subData.status_formatted || subData.status || null,
                // Customer portal URL for managing subscription
                lemonCustomerPortalUrl: urls.customer_portal || null
            };

            console.log('Writing to Firestore:', JSON.stringify(updateData));

            await db.collection('users').doc(userId).set(updateData, { merge: true });

            console.log('=== WEBHOOK SUCCESS ===');
            return res.status(200).json({
                success: true,
                message: 'Webhook processed',
                userId: userId,
                status: subscriptionStatus
            });

        } catch (error) {
            console.error('WEBHOOK ERROR:', error.message);
            return res.status(500).json({ error: 'Internal error', details: error.message });
        }
    }
);
