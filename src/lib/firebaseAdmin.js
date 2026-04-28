import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // Handle escaped newlines in environment variables
        if (privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error.stack);
    }
}

const adminDb = admin.firestore();

export { adminDb, admin };
