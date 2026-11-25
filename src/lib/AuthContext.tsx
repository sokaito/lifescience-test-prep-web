"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ADMIN_EMAILS } from "./constants";

const GOOGLE_WEB_CLIENT_ID =
  "1019446850266-en7328n3v3nc7v4ndhhk36a80hhk8gs5.apps.googleusercontent.com";

const NORMALIZED_ADMIN_EMAILS = ADMIN_EMAILS.map((e) => e.toLowerCase());

interface AuthContextType {
  user: User | null | undefined; // undefined means loading
  userData: any;
  isGuest: boolean;
  setGuestMode: (val: boolean) => void;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function buildFallbackProfile(firebaseUser: User, overrideName?: string) {
  const userEmail = (firebaseUser.email || "").toLowerCase();
  const isAdmin = NORMALIZED_ADMIN_EMAILS.includes(userEmail);
  return {
    uid: firebaseUser.uid,
    name:
      overrideName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split("@")[0] ||
      "User",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || null,
    streak: 1,
    language: "English",
    role: isAdmin ? "admin" : "user",
    tokens: 50,
  };
}

/**
 * Resolves, migrates (if legacy UID/casing), or initializes the user's Firestore document.
 * Wrapped defensively so transient Firestore failures never block authentication.
 */
async function syncUserProfile(
  firebaseUser: User,
  options?: { overrideName?: string; updatePhotoAndName?: boolean }
) {
  const userEmail = (firebaseUser.email || "").toLowerCase();
  const primaryId = userEmail || firebaseUser.uid;
  const fallback = buildFallbackProfile(firebaseUser, options?.overrideName);

  try {
    const docRef = doc(db, "users", primaryId);
    let docSnap = await getDoc(docRef);

    // Migrate from legacy exact-case email doc or UID doc if primary lowercase doc is absent
    if (!docSnap.exists() && firebaseUser.email && firebaseUser.email !== primaryId) {
      const exactEmailSnap = await getDoc(doc(db, "users", firebaseUser.email));
      if (exactEmailSnap.exists()) {
        await setDoc(docRef, exactEmailSnap.data(), { merge: true });
        docSnap = await getDoc(docRef);
      }
    }
    if (!docSnap.exists()) {
      const legacySnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (legacySnap.exists()) {
        await setDoc(docRef, legacySnap.data(), { merge: true });
        docSnap = await getDoc(docRef);
      }
    }

    if (!docSnap.exists()) {
      const initialData = {
        ...fallback,
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, initialData, { merge: true });
      return fallback;
    }

    const data: any = { ...docSnap.data() };
    const updates: any = {};

    if (NORMALIZED_ADMIN_EMAILS.includes(userEmail)) {
      data.role = "admin";
    } else if (!data.role) {
      data.role = "user";
    }

    if ((data.tokens ?? 0) < 50) {
      data.tokens = 50;
      updates.tokens = 50;
    }

    if (options?.updatePhotoAndName) {
      if (firebaseUser.photoURL) {
        data.photoURL = firebaseUser.photoURL;
        updates.photoURL = firebaseUser.photoURL;
      }
      if (firebaseUser.displayName) {
        data.name = firebaseUser.displayName;
        updates.name = firebaseUser.displayName;
      }
    }

    if (Object.keys(updates).length > 0) {
      await setDoc(docRef, updates, { merge: true });
    }

    return data;
  } catch (err) {
    console.warn("Firestore profile sync failed (using fallback profile):", err);
    return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userData, setUserData] = useState<any>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isGuest") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        GoogleAuth.initialize({
          clientId: GOOGLE_WEB_CLIENT_ID,
          scopes: ["profile", "email"],
          grantOfflineAccess: true,
        });
      } catch (err) {
        console.warn("GoogleAuth.initialize warning:", err);
      }
    } else {
      // Handle OAuth redirect result if signInWithPopup fell back to signInWithRedirect
      getRedirectResult(auth)
        .then(async (result) => {
          if (result?.user) {
            const profile = await syncUserProfile(result.user, {
              updatePhotoAndName: true,
            });
            setUserData(profile);
          }
        })
        .catch((err) => {
          console.warn("Redirect sign-in result error:", err);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        const profile = await syncUserProfile(currentUser);
        setUserData(profile);
      } else {
        setUserData(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (e: string, p: string) => {
    await signInWithEmailAndPassword(auth, e.trim(), p);
  };

  const register = async (e: string, p: string, name: string) => {
    const cleanEmail = e.trim();
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, p);
    const profile = await syncUserProfile(res.user, {
      overrideName: name.trim() || cleanEmail.split("@")[0],
    });
    setUserData(profile);
  };

  const signInWithGoogle = async () => {
    let firebaseUser: User | undefined;

    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const idToken =
          googleUser?.authentication?.idToken || (googleUser as any)?.idToken;
        if (!idToken) {
          throw new Error(
            "Google Sign-In did not return an ID token. Verify SHA-1 and Web Client ID."
          );
        }
        const credential = GoogleAuthProvider.credential(idToken);
        const res = await signInWithCredential(auth, credential);
        firebaseUser = res.user;
      } catch (err: any) {
        const code = String(err?.code || "");
        const msg = String(err?.message || "");
        if (
          code === "12501" ||
          msg.toLowerCase().includes("canceled") ||
          msg.toLowerCase().includes("cancelled")
        ) {
          return; // User dismissed the Google account picker
        }
        console.error("Native Google Sign-In failed:", err);
        throw err;
      }
    } else {
      try {
        const res = await signInWithPopup(auth, googleProvider);
        firebaseUser = res.user;
      } catch (err: any) {
        if (
          err?.code === "auth/popup-blocked" ||
          err?.code === "auth/operation-not-supported-in-this-environment"
        ) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw err;
      }
    }

    if (!firebaseUser) return;

    const profile = await syncUserProfile(firebaseUser, {
      updatePhotoAndName: true,
    });
    setUserData(profile);
  };

  const logout = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch (e) {
        console.warn("GoogleAuth.signOut() error (safe to ignore):", e);
      }
    }
    await firebaseSignOut(auth);
    setIsGuest(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateProfileData = async (data: any) => {
    if (!user) return;
    const primaryId = (user.email || user.uid).toLowerCase();
    await setDoc(doc(db, "users", primaryId), data, { merge: true });
    setUserData({ ...userData, ...data });
  };

  useEffect(() => {
    localStorage.setItem("isGuest", isGuest.toString());
  }, [isGuest]);

  const setGuestMode = (val: boolean) => {
    setIsGuest(val);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isGuest,
        setGuestMode,
        login,
        register,
        signInWithGoogle,
        logout,
        resetPassword,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
