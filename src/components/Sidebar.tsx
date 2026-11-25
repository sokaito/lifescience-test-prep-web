"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  BarChart2,
  Settings,
  X,
  LogIn,
  LogOut,
  History,
  Download,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useIsNativeApp } from "@/lib/useIsNativeApp";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginClick?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  onLoginClick,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, userData, logout } = useAuth();
  const { isNativeApp, isReady } = useIsNativeApp();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "PYQ Papers", href: "/pyq", icon: History },
    { name: "Test Series", href: "/test-series", icon: Library },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 bg-bg-card text-text-primary min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out border-r border-border-subtle pt-[env(safe-area-inset-top)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 md:h-16 px-5 border-b border-border-subtle flex items-center justify-between">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-text-primary">
              LifeSci Prep
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-main"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-teal-600 text-white font-semibold shadow-sm"
                    : "text-text-secondary hover:bg-bg-main hover:text-text-primary font-medium"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Android App Download Card — shown ONLY on Web, hidden inside APK */}
        {isReady && !isNativeApp && (
          <div className="px-3 pb-3">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-apk-modal"));
                onClose?.();
              }}
              className="w-full p-3 bg-teal-500/8 hover:bg-teal-500/14 border border-teal-500/25 rounded-2xl transition-colors text-left flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    Android App
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary truncate">
                  Download APK for offline prep
                </p>
              </div>
            </button>
          </div>
        )}

        <div className="p-4 border-t border-border-subtle">
          {user && (
            <div className="mb-3 px-1">
              <p className="text-xs font-semibold text-text-primary truncate">
                {userData?.name || "Student"}
              </p>
              <p className="text-[11px] text-text-secondary truncate">
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (user) {
                logout();
              } else {
                onLoginClick?.();
              }
              onClose?.();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-main transition-colors"
          >
            {user ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{user ? "Sign Out" : "Sign In"}</span>
          </button>
          <p className="text-[11px] text-text-secondary/60 mt-3 text-center">
            © 2026 LifeSci Prep
          </p>
        </div>
      </aside>
    </>
  );
}
