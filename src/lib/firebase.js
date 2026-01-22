import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBzIxWGRtcmjMafcRud91WGJTnSpJhYx7c",
    authDomain: "tupresulisto.firebaseapp.com",
    projectId: "tupresulisto",
    storageBucket: "tupresulisto.firebasestorage.app",
    messagingSenderId: "755896919636",
    appId: "1:755896919636:web:ab79e04b27f974ebf2afc1",
    measurementId: "G-B7VXNVG8JJ"
};

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { db, auth };
