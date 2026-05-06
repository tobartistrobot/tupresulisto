import * as admin from 'firebase-admin';

/**
 * Lazily initializes Firebase Admin SDK and returns the Firestore instance.
 * Uses a robust regex parser to extract the private key from the environment
 * variable, ignoring surrounding quotes, backslashes, or encoding artifacts.
 *
 * @returns {{ adminDb: admin.firestore.Firestore, admin: typeof admin }}
 */
function getAdmin() {
    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
        // Extract only the valid PEM key portion, ignoring surrounding quotes or escape artifacts
        const match = privateKey.match(/-----BEGIN PRIVATE KEY-----(?:.|\n|\\n)*?-----END PRIVATE KEY-----/);
        if (match) {
            privateKey = match[0].replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
        });
    }
    return { adminDb: admin.firestore(), admin };
}

export { getAdmin, admin };
