"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles, X, AlertCircle } from "lucide-react";

// Currently installed version inside this build
const CURRENT_VERSION_CODE = 2;
const CURRENT_VERSION_NAME = "2.0.0";
const VERSION_URL = "https://csir-net-mocktest.web.app/version.json";

interface UpdateData {
  latestVersion: string;
  versionCode: number;
  title: string;
  message: string;
  downloadUrl: string;
  forceUpdate?: boolean;
}

export default function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateData | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      try {
        const res = await fetch(VERSION_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data: UpdateData = await res.json();

        // Check if server version is newer than installed version
        const hasNewerVersion = (data.versionCode && data.versionCode > CURRENT_VERSION_CODE) ||
                                (data.latestVersion && data.latestVersion !== CURRENT_VERSION_NAME);

        // Check if user dismissed it in this session
        const dismissedVersion = sessionStorage.getItem("dismissed_app_version");

        if (hasNewerVersion && dismissedVersion !== data.latestVersion && isMounted) {
          setUpdateInfo(data);
          setShowModal(true);
        }
      } catch (err) {
        // Silently skip if offline or unreachable
        console.log("Update check skipped:", err);
      }
    }

    // Check after 1.5 seconds so app UI loads first smoothly
    const timer = setTimeout(checkVersion, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!showModal || !updateInfo) return null;

  const handleDismiss = () => {
    if (updateInfo.latestVersion) {
      sessionStorage.setItem("dismissed_app_version", updateInfo.latestVersion);
    }
    setShowModal(false);
  };

  const handleUpdate = () => {
    window.open(updateInfo.downloadUrl, "_blank");
    if (!updateInfo.forceUpdate) {
      setShowModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center overflow-hidden animate-fade-in-up">
        {/* Glow ambient background effects */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close button if not forced */}
        {!updateInfo.forceUpdate && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-teal-400 via-emerald-400 to-blue-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 transform hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 text-white fill-white" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-wider mb-2">
          <span>Version {updateInfo.latestVersion} Available</span>
        </div>

        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {updateInfo.title || "App Update Available"}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {updateInfo.message}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleUpdate}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Update Now</span>
          </button>

          {!updateInfo.forceUpdate && (
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Baad me karein (Remind Later)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

