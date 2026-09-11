"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AuthSidebar from "./AuthSidebar";
import DownloadApkModal from "./DownloadApkModal";
import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { Menu, X, User, Bell, Sun, Moon, CheckCircle2, Download } from "lucide-react";
import TokenFloatButton from "./TokenFloatButton";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthSidebarOpen, setIsAuthSidebarOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [showGuideInModal, setShowGuideInModal] = useState(false);
  const { user, userData, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  // Toast for notification button
  const [showToast, setShowToast] = useState(false);

  // Auto-hide removed to allow interaction with futuristic modal

  // Route Guard: Redirect to welcome if not logged in or guest
  useEffect(() => {
    // Wait for auth to initialize (user is undefined while loading)
    if (user === undefined) return;

    if (user === null && !isGuest && pathname !== "/welcome") {
      router.push("/welcome");
    } else if (user && pathname === "/welcome") {
      router.push("/");
    }
    // Listen for toggle events
    const handleToggleAuth = () => setIsAuthSidebarOpen(true);
    const handleOpenApk = (e: Event) => {
      const customEvent = e as CustomEvent<{ showGuide?: boolean }>;
      setShowGuideInModal(Boolean(customEvent?.detail?.showGuide));
      setIsApkModalOpen(true);
    };
    window.addEventListener("toggle-auth-sidebar", handleToggleAuth);
    window.addEventListener("open-apk-modal", handleOpenApk);
    return () => {
      window.removeEventListener("toggle-auth-sidebar", handleToggleAuth);
      window.removeEventListener("open-apk-modal", handleOpenApk);
    };
  }, [user, isGuest, pathname, router]);


  if (user === undefined) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center transition-colors">
        <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-500 rounded-full animate-spin mb-4" />
        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Lifesci Prep...</p>
      </div>
    );
  }

  const isWelcomePage = pathname === "/welcome";
  const shouldHideUI = isWelcomePage && !user && !isGuest;


  if (shouldHideUI) {
    return (
      <div className="min-h-screen">
        {children}
        <AuthSidebar 
          isOpen={isAuthSidebarOpen} 
          onClose={() => setIsAuthSidebarOpen(false)} 
        />
        <DownloadApkModal 
          isOpen={isApkModalOpen} 
          onClose={() => setIsApkModalOpen(false)} 
          defaultShowGuide={showGuideInModal}
        />
      </div>
    );
  }


  return (
    <div className="flex bg-bg-main text-text-primary min-h-screen transition-colors duration-500">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLoginClick={() => setIsAuthSidebarOpen(true)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 relative ${isSidebarOpen ? "md:ml-64" : ""}`}>
        <Header />

        {/* Floating Menu Button (Top Left) */}
        <div className={`fixed top-16 ${isSidebarOpen ? 'left-68' : 'left-4'} z-40 animate-float`}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-float-btn-bg border border-float-btn-border shadow-[var(--float-btn-glow)] text-float-btn-text backdrop-blur-md rounded-full hover:scale-110 active:scale-95 transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </div>

        {/* Floating User + Notification + Theme + APK (Top Right) */}
        <div className="fixed top-16 right-4 md:right-8 z-40 flex items-center space-x-2 md:space-x-3 animate-float">
          <TokenFloatButton />

          {/* APK Download Button */}
          <button 
            onClick={() => setIsApkModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 md:px-3.5 py-1.5 md:py-2 bg-float-btn-bg border border-teal-500/40 shadow-[var(--float-btn-glow)] text-teal-600 dark:text-teal-400 backdrop-blur-md rounded-full hover:scale-105 active:scale-95 transition-all group"
            title="Download Android APK (v1.0)"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-y-0.5 transition-transform text-accent-main" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider hidden sm:inline">
              Get App
            </span>
            <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-teal-500/20 text-teal-600 dark:text-teal-400">
              APK
            </span>
          </button>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-float-btn-bg border border-float-btn-border shadow-[var(--float-btn-glow)] text-float-btn-text backdrop-blur-md rounded-full hover:scale-110 active:scale-95 transition-all group"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-500 group-hover:text-blue-500" /> : <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />}
          </button>

          {/* Notification Button */}
          <button
              onClick={() => setShowToast(true)}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-float-btn-bg border border-float-btn-border shadow-[var(--float-btn-glow)] text-float-btn-text backdrop-blur-md rounded-full hover:bg-opacity-100 transition-all relative group"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-bg-main animate-pulse"></span>
            </button>

          {/* User / Guest Button */}
          <button 
            onClick={() => setIsAuthSidebarOpen(true)}
            className="flex items-center space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-float-btn-bg border border-float-btn-border shadow-[var(--float-btn-glow)] text-float-btn-text backdrop-blur-md rounded-full hover:bg-opacity-100 transition-all group"
          >
            {user && userData?.photoURL ? (
              <img 
                src={userData.photoURL} 
                alt={userData?.name || "User"} 
                className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover ring-2 ring-teal-400/50 group-hover:ring-teal-400 transition-all"
                referrerPolicy="no-referrer"
              />
            ) : user && userData?.name ? (
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner group-hover:rotate-12 transition-transform">
                {userData.name[0]?.toUpperCase()}
              </div>
            ) : (
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-inner group-hover:rotate-12 transition-transform">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
            )}
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">
              {user ? (userData?.name || "User") : isGuest ? "Guest" : "Login"}
            </span>
          </button>
        </div>

        <main className="flex-1 p-3 md:p-8 mt-28 md:mt-32 overflow-x-hidden">
          {children}
        </main>
      </div>

      <AuthSidebar 
        isOpen={isAuthSidebarOpen} 
        onClose={() => setIsAuthSidebarOpen(false)} 
      />
      <DownloadApkModal 
        isOpen={isApkModalOpen} 
        onClose={() => setIsApkModalOpen(false)} 
        defaultShowGuide={showGuideInModal}
      />
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowToast(false)}
          />
          <div className="relative w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl animate-float overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl group-hover:bg-teal-500/30 transition-colors duration-500" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-500" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20">
                <CheckCircle2 className="w-12 h-12 text-teal-500" />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                Success!
              </h3>
              <p className="text-white/70 font-medium mb-8 leading-relaxed">
                Thank you for joining <span className="text-teal-400 font-bold">Lifesci Prep</span>. Your journey to excellence starts here.
              </p>
              
              <button 
                onClick={() => setShowToast(false)}
                className="w-full py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-teal-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
