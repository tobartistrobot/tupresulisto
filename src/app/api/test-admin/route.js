import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        const test = await adminDb.collection('telegram_chats').limit(1).get();
        return NextResponse.json({ success: true, count: test.size, projectId: process.env.FIREBASE_PROJECT_ID || "missing" });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message, email: process.env.FIREBASE_CLIENT_EMAIL || "missing" });
    }
}
