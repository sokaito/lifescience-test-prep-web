import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// Replace these with your actual Firebase project config values from console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSyAHZUDi082Xxr-X8BplAuFD0mrv0ZXXxt0",
  authDomain: "csir-net-mocktest.firebaseapp.com",
  projectId: "csir-net-mocktest",
  storageBucket: "csir-net-mocktest.firebasestorage.app",
  messagingSenderId: "1019446850266",
  appId: "1:1019446850266:web:e558bebd67dad8231fabe3",
  measurementId: "G-2LDV4166TL",
};

// Initialize Firebase only if it hasn't been initialized already to avoid duplicate instances in Next.js development
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, messaging };
