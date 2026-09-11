"use client";

import { useEffect } from "react";
import { LayoutDashboard, LogIn, UserPlus, Download } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { setGuestMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Automatically trigger the login sidebar on mount for better UX
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    }
  }, []);

  const handleGuestEntry = () => {
    setGuestMode(true);
    router.push("/");
  };


  const handleLoginToggle = () => {
    // We will implement a way to trigger the AuthSidebar from here
    // For now, we'll store a flag or use a shared state in LayoutWrapper
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
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center transition-colors">
      <div className="w-20 h-20 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-bounce">
        <LayoutDashboard className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4 tracking-tight">
        LIFESCI <span className="text-accent-main">PREP</span>
      </h1>
      <p className="text-text-secondary text-lg md:text-xl max-w-md mb-12">
        Your ultimate companion for CSIR NET Life Sciences preparation.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleGuestEntry}
          className="w-full py-4 px-8 bg-bg-card hover:bg-bg-main border border-border-subtle rounded-2xl text-text-primary font-bold text-lg transition-all flex items-center justify-center shadow-lg group"
        >
          <UserPlus className="w-5 h-5 mr-3 text-accent-main group-hover:scale-110 transition-transform" />
          Continue as Guest
        </button>

        <button
          onClick={handleLoginToggle}
          className="w-full py-4 px-8 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center group"
        >
          <LogIn className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
          Login / Sign In
        </button>

        <button
          onClick={handleOpenApkModal}
          className="w-full py-3.5 px-8 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-2xl text-teal-600 dark:text-teal-400 font-bold text-base transition-all flex items-center justify-center shadow-md group"
        >
          <Download className="w-5 h-5 mr-3 group-hover:translate-y-0.5 transition-transform text-accent-main" />
          <span>Download Android App</span>
          <span className="ml-2 text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-teal-500/20">8.7 MB</span>
        </button>
      </div>

      <p className="mt-12 text-text-secondary opacity-50 text-sm">
        © 2026 CSIR NET Prep. All rights reserved.
      </p>
    </div>
  );
}
