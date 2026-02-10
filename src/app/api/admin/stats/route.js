import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Next.js API Routes runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['demo@tupresulisto.com', 'admin@tupresulisto.com', 'tobartistrobot@gmail.com'];

function getAdminApp() {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        } catch (error) {
            console.error('Firebase Admin initialization error:', error);
            throw new Error('Server configuration error');
        }
    }
    return admin;
}

export async function GET(request) {
    try {
        // Get auth token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const token = authHeader.substring(7);

        // Initialize and get admin instance
        const adminApp = getAdminApp();

        // Verify Firebase ID token
        const decodedToken = await adminApp.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        // Check if user is admin
        if (!ADMIN_EMAILS.includes(userEmail)) {
            console.warn(`Unauthorized admin access attempt by: ${userEmail}`);
            return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
        }

        // Fetch stats with Admin SDK (has full access)
        const db = adminApp.firestore();

        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;

        const usersList = [];
        let verifiedUsers = 0;

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.emailVerified) verifiedUsers++;

            // Add user to list with minimal required fields for the table
            usersList.push({
                id: doc.id,
                email: data.email,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                emailVerified: data.emailVerified,
                subscriptionStatus: data.subscriptionStatus,
                isPro: data.isPro,
                redeemCode: data.redeemCode,
                productsCount: data.products?.length || 0
            });
        });

        // Products count (if you have a products collection)
        let totalProducts = 0;
        try {
            const productsSnapshot = await db.collection('products').get();
            totalProducts = productsSnapshot.size;
        } catch (e) {
            console.log('Products collection not found or empty');
        }

        return NextResponse.json({
            totalUsers,
            verifiedUsers,
            totalProducts,
            users: usersList // Return the list
        });


    } catch (error) {
        console.error('Admin stats error:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
