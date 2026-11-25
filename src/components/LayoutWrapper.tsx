"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AuthSidebar from "./AuthSidebar";
import DownloadApkModal from "./DownloadApkModal";
import { useAuth } from "@/lib/AuthContext";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { usePathname, useRouter } from "next/navigation";
import { Home, History, Library, BarChart2 } from "lucide-react";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthSidebarOpen, setIsAuthSidebarOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [showGuideInModal, setShowGuideInModal] = useState(false);
  const { user, isGuest } = useAuth();
  const { isNativeApp, isReady } = useIsNativeApp();
  const pathname = usePathname();
  const router = useRouter();

  // Route Guard: Redirect to welcome if not logged in or guest
  useEffect(() => {
    if (user === undefined) return;

    if (
      user === null &&
      !isGuest &&
      pathname !== "/welcome" &&
      pathname !== "/login"
    ) {
      router.push("/welcome");
    } else if (user && pathname === "/welcome") {
      router.push("/");
    }

    const handleToggleAuth = () => setIsAuthSidebarOpen(true);
    const handleOpenApk = (e: Event) => {
      if (isNativeApp) return;
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
  }, [user, isGuest, pathname, router, isNativeApp]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mb-3" />
        <p className="text-text-secondary font-medium text-sm">
          Loading LifeSci Prep...
        </p>
      </div>
    );
  }

  const isWelcomePage = pathname === "/welcome" || pathname === "/login";
  const shouldHideUI = isWelcomePage && !user && !isGuest;

  if (shouldHideUI) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary pt-[env(safe-area-inset-top)]">
        {children}
        <AuthSidebar
          isOpen={isAuthSidebarOpen}
          onClose={() => setIsAuthSidebarOpen(false)}
        />
        {isReady && !isNativeApp && (
          <DownloadApkModal
            isOpen={isApkModalOpen}
            onClose={() => setIsApkModalOpen(false)}
            defaultShowGuide={showGuideInModal}
          />
        )}
      </div>
    );
  }

  const bottomNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "PYQs", href: "/pyq", icon: History },
    { name: "Tests", href: "/test-series", icon: Library },
    { name: "Stats", href: "/analytics", icon: BarChart2 },
  ];

  // Hide mobile bottom nav during active exam runner so students have full screen focus
  const isInsideTestRunner =
    pathname.startsWith("/exam/") ||
    (pathname.startsWith("/pyq/") && pathname.split("/").length >= 4);

  return (
    <div className="min-h-screen flex bg-bg-main text-text-primary">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLoginClick={() => setIsAuthSidebarOpen(true)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAuth={() => setIsAuthSidebarOpen(true)}
          onOpenApkModal={() => setIsApkModalOpen(true)}
        />

        <main
          className={`flex-1 w-full max-w-screen-xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 md:pt-8 ${
            isInsideTestRunner ? "pb-10" : "pb-24 md:pb-12"
          }`}
        >
          {/* Keyed wrapper triggers smooth pop-in animation whenever navigating between tabs */}
          <div key={pathname} className="animate-pop-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation with Tab Click Pop Animation */}
      {!isInsideTestRunner && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-card/95 backdrop-blur-md border-t border-border-subtle pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4 h-15 py-1">
            {bottomNavItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium tab-click-anim relative ${
                    active
                      ? "text-teal-600 dark:text-teal-400 font-semibold animate-tab-pop"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div
                    className={`px-3 py-1 rounded-full transition-all duration-200 ${
                      active
                        ? "bg-teal-500/15 scale-105"
                        : "bg-transparent"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        active ? "stroke-[2.3] -translate-y-0.5" : "stroke-[1.8]"
                      }`}
                    />
                  </div>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <AuthSidebar
        isOpen={isAuthSidebarOpen}
        onClose={() => setIsAuthSidebarOpen(false)}
      />

      {isReady && !isNativeApp && (
        <DownloadApkModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
          defaultShowGuide={showGuideInModal}
        />
      )}
    </div>
  );
}
