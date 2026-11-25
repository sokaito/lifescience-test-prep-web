"use client";

import { useEffect } from "react";
import { BookOpen, LogIn, UserPlus, Download } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { setGuestMode } = useAuth();
  const { isNativeApp, isReady } = useIsNativeApp();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    }
  }, []);

  const handleGuestEntry = () => {
    setGuestMode(true);
    router.push("/");
  };

  const handleLoginToggle = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    }
  };

  const handleOpenApkModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-apk-modal"));
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
        <BookOpen className="w-8 h-8 text-white" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 tracking-tight">
        LifeSci <span className="text-teal-600 dark:text-teal-400">Prep</span>
      </h1>
      <p className="text-text-secondary text-sm sm:text-base max-w-md mb-10">
        Your focused study companion for CSIR NET, GATE Life Sciences, DBT-BET & ICMR JRF.
      </p>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleLoginToggle}
          className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 rounded-xl text-white font-semibold text-base shadow-sm transition-colors flex items-center justify-center gap-2.5"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In / Create Account</span>
        </button>

        <button
          onClick={handleGuestEntry}
          className="w-full py-3.5 px-6 bg-bg-card hover:bg-bg-main border border-border-subtle rounded-xl text-text-primary font-semibold text-base transition-colors flex items-center justify-center gap-2.5"
        >
          <UserPlus className="w-5 h-5 text-teal-600" />
          <span>Continue as Guest</span>
        </button>

        {/* Web-only APK Download */}
        {isReady && !isNativeApp && (
          <button
            onClick={handleOpenApkModal}
            className="w-full py-3 px-6 bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/25 rounded-xl text-teal-700 dark:text-teal-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Android App</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-teal-500/15">
              v2.0
            </span>
          </button>
        )}
      </div>

      <p className="mt-12 text-text-secondary/60 text-xs">
        © 2026 LifeSci Prep. All rights reserved.
      </p>
    </div>
  );
}
