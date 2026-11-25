import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported, Messaging } from "firebase/messaging";

// Your web app's Firebase configuration
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

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

let messagingInstance: Messaging | null = null;

/**
 * Safely retrieves Firebase Messaging only when supported by the browser/WebView.
 * Prevents unhandled `messaging/unsupported-browser` rejections on Android WebView or HTTP origins.
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

export { app, auth, db, googleProvider, getMessagingInstance };
