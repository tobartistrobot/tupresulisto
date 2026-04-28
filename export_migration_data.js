/**
 * MIGRATION EXPORT TOOL (tupresulisto.com)
 * ---------------------------------------
 * This script exports all users, products, and history from your current Firebase 
 * project to a single JSON file. You can give this file to the Horizons or WordPress
 * team to import your existing data.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize with environment variables (or local serviceAccountKey.json)
if (!admin.apps.length) {
    // Attempt to load from .env.local if available or manual config
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

async function exportFullData() {
    console.log("🚀 Starting data export...");
    const exportData = {
        exportedAt: new Date().toISOString(),
        users: {}
    };

    try {
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            console.log(`📦 Processing user: ${userId}`);

            const userData = userDoc.data();

            // Fetch subcollections (products, config, history)
            const productsDoc = await db.collection('users').doc(userId).collection('data').doc('products').get();
            const configDoc = await db.collection('users').doc(userId).collection('data').doc('config').get();
            const historyDoc = await db.collection('users').doc(userId).collection('data').doc('history').get();

            exportData.users[userId] = {
                profile: userData,
                products: productsDoc.exists ? productsDoc.data() : null,
                config: configDoc.exists ? configDoc.data() : null,
                history: historyDoc.exists ? historyDoc.data() : null
            };
        }

        const outputPath = path.join(__dirname, `migration_export_${Date.now()}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

        console.log(`\n✅ SUCCESS! All data exported to: ${outputPath}`);
        console.log("You can now provide this file to your new platform provider.");

    } catch (error) {
        console.error("❌ Export failed:", error);
    }
}

exportFullData();
