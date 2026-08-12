"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User 
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ADMIN_EMAILS } from "./constants";

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

// ADMIN_EMAILS moved to ./constants.ts

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
    // Initialize Native Google Auth
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        // Fetch user data from Firestore using email to ensure consistency across auth methods
        const uniqueId = currentUser.email || currentUser.uid;
        const docRef = doc(db, "users", uniqueId);
        const docSnap = await getDoc(docRef);
        
        const userEmail = (currentUser.email || "").toLowerCase();
        
        let data: any = docSnap.exists() ? docSnap.data() : { 
          name: currentUser.email?.split("@")[0], 
          streak: 0, 
          language: "English",
          role: ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail) ? "admin" : "user"
        };
        
        // Force admin role if email is in whitelist
        if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
          data.role = "admin";
        } else if (!data.role) {
          data.role = "user";
        }
        
        // --- TOKEN ALLOCATION LOGIC ---
        let needsSync = false;
        // Everyone should have at least 50 tokens as a baseline
        const currentTokens = data.tokens ?? 0;
        if (currentTokens < 50) {
          data.tokens = 50;
          needsSync = true;
        }

        // Sync to Firestore if tokens were corrected
        if (needsSync) {
          await setDoc(docRef, { tokens: data.tokens }, { merge: true });
        }
        
        setUserData(data);
      } else {
        setUserData(null);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (e: string, p: string) => {
    await signInWithEmailAndPassword(auth, e, p);
  };

  const register = async (e: string, p: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, e, p);
    const role = ADMIN_EMAILS.includes(e) ? "admin" : "user";
    
    const initialData = {
      uid: res.user.uid,
      name: name,
      email: e,
      streak: 1,
      language: "English",
      role: role,
      tokens: 50,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", e), initialData);
    setUserData(initialData);
  };

  const signInWithGoogle = async () => {
    let firebaseUser;
    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const res = await signInWithCredential(auth, credential);
        firebaseUser = res.user;
      } catch (err: any) {
        // Error code 12501 = user cancelled the account picker — not a real error
        if (err?.code === '12501' || err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
          return; // Silently return, user simply dismissed the picker
        }
        // Google Play Services not available
        if (err?.code === 'PLAY_SERVICES_NOT_AVAILABLE' || err?.message?.includes('Play Services')) {
          throw new Error('Google Play Services is not available on this device. Please install or update it from the Play Store.');
        }
        // Network issues
        if (err?.message?.includes('network') || err?.message?.includes('NETWORK_ERROR')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        console.error("Native Google Sign-In failed", err);
        throw new Error(err?.message || 'Google sign-in failed. Please try again.');
      }
    } else {
      const res = await signInWithPopup(auth, googleProvider);
      firebaseUser = res.user;
    }

    if (!firebaseUser) return;
    
    // Check if user exists in Firestore by their email to unify accounts
    const uniqueId = firebaseUser.email || firebaseUser.uid;
    let docRef = doc(db, "users", uniqueId);
    let docSnap = await getDoc(docRef);
    
    // Fallback/Migration: if they don't have an email doc, check if they have a legacy UID doc
    if (!docSnap.exists() && firebaseUser.email) {
      const legacyDocRef = doc(db, "users", firebaseUser.uid);
      const legacySnap = await getDoc(legacyDocRef);
      if (legacySnap.exists()) {
         // Migrate legacy profile
         await setDoc(docRef, legacySnap.data());
         docSnap = await getDoc(docRef);
      }
    }
    
    if (!docSnap.exists()) {
      // New user — create full profile with photo
      const role = ADMIN_EMAILS.includes(firebaseUser.email || "") ? "admin" : "user";
      const initialData = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || null,
        streak: 1,
        language: "English",
        role: role,
        tokens: 50,
        joinedDate: serverTimestamp()
      };
      await setDoc(docRef, initialData);
      setUserData(initialData);
    } else {
      // Existing user — update photo and name in case they changed
      const updates: any = {};
      if (firebaseUser.photoURL) updates.photoURL = firebaseUser.photoURL;
      if (firebaseUser.displayName) updates.name = firebaseUser.displayName;
      if (Object.keys(updates).length > 0) {
        await setDoc(docRef, updates, { merge: true });
      }
      setUserData({ ...docSnap.data(), ...updates });
    }
  };

  const logout = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch (e) {
        // Ignore native sign-out errors (e.g., user was not signed in via Google)
        console.warn("GoogleAuth.signOut() error (safe to ignore):", e);
      }
    }
    await firebaseSignOut(auth);
    setIsGuest(false);
  };
  
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfileData = async (data: any) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.email || user.uid), data, { merge: true });
    setUserData({ ...userData, ...data });
  };

  useEffect(() => {
    localStorage.setItem("isGuest", isGuest.toString());
  }, [isGuest]);


  const setGuestMode = (val: boolean) => {
    setIsGuest(val);
  };




  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      isGuest, 
      setGuestMode, 
      login, 
      register, 
      signInWithGoogle,
      logout,
      resetPassword,
      updateProfileData 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
