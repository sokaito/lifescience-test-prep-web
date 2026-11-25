"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, User, Download } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import TokenFloatButton from "./TokenFloatButton";
import BrandLogo from "./BrandLogo";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
  onOpenApkModal: () => void;
}

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
  onOpenAuth,
  onOpenApkModal,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, userData, isGuest } = useAuth();
  const { isNativeApp, isReady } = useIsNativeApp();
  const pathname = usePathname();

  const desktopLinks = [
    { name: "Home", href: "/" },
    { name: "PYQ Papers", href: "/pyq" },
    { name: "Test Series", href: "/test-series" },
    { name: "Analytics", href: "/analytics" },
  ];

  const firstName = userData?.name?.split(" ")[0];

  return (
    <header className="sticky top-0 z-40 glass pt-[env(safe-area-inset-top)]">
      <div className="max-w-screen-xl mx-auto h-14 md:h-16 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left: Menu + Custom Brand Logo + Animated Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            className="w-9 h-9 rounded-xl border border-border-subtle bg-bg-card/80 hover:bg-bg-main text-text-primary flex items-center justify-center tab-click-anim shrink-0"
          >
            {isSidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>

          <Link href="/" className="min-w-0 tab-click-anim">
            <BrandLogo size="md" showText />
          </Link>

          {/* Desktop Inline Navigation with Tab Click & Active Pop Animation */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {desktopLinks.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-medium tab-click-anim ${
                    active
                      ? "bg-teal-500/12 text-teal-700 dark:text-teal-300 font-semibold animate-tab-pop"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-main"
                  }`}
                >
                  <span>{item.name}</span>
                  {active && (
                    <span className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 animate-tab-pop" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <TokenFloatButton />

          {/* Show Android APK button ONLY on Web browser, never inside the APK */}
          {isReady && !isNativeApp && (
            <button
              onClick={onOpenApkModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-semibold tab-click-anim"
              title="Download Android App (APK)"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Get App</span>
              <span className="sm:hidden">APK</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-border-subtle bg-bg-card/80 hover:bg-bg-main text-text-secondary hover:text-text-primary flex items-center justify-center tab-click-anim"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-label="Toggle color theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Account Pill */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-xl border border-border-subtle bg-bg-card/90 hover:bg-bg-main text-text-primary tab-click-anim max-w-[140px] sm:max-w-[180px]"
          >
            {user && userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt={userData?.name || "User"}
                className="w-7 h-7 rounded-lg object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : user && userData?.name ? (
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {userData.name[0]?.toUpperCase()}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-text-secondary flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-semibold truncate">
              {user ? firstName || "Account" : isGuest ? "Guest" : "Sign In"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
