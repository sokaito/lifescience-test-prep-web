"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, Trello, Settings, X, LogIn, ShieldCheck, History, Download } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginClick?: () => void;
}

export default function Sidebar({ isOpen, onClose, onLoginClick }: SidebarProps) {
  const pathname = usePathname();
  const { userData, user, logout } = useAuth();
  const isAdmin = userData?.role === "admin";

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Test Series", href: "/test-series", icon: Library },
    { name: "PYQ Papers", href: "/pyq", icon: History },
    { name: "Analytics", href: "/analytics", icon: Trello },
    { name: "Settings", href: "/settings", icon: Settings },
  ];


  /* Role-based links removed from public UI as per security requirements */
  /* if (isAdmin) {
    navItems.push({ name: "Admin (Seeder)", href: "/admin", icon: ShieldCheck });
  } */

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-64 bg-bg-card text-text-primary min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out border-r border-border-subtle transition-colors
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 border-b border-border-subtle flex items-center justify-between transition-colors">
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            LifeSci Prep
          </h1>
          
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={onClose}
                className={`flex items-center space-x-3 px-6 py-3 transition-all ${
                  isActive 
                    ? "bg-accent-main text-white shadow-lg shadow-teal-500/20 mx-2 rounded-xl" 
                    : "text-text-secondary hover:bg-bg-main hover:text-text-primary mx-2 rounded-xl"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-secondary'}`} />
                <span className="font-bold text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Android App Download Banner */}
        <div className="px-4 py-3">
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-apk-modal"));
              onClose?.();
            }}
            className="w-full relative overflow-hidden group p-3 bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-blue-500/10 hover:from-teal-500/20 hover:to-blue-500/20 border border-teal-500/30 hover:border-teal-500/50 rounded-2xl transition-all duration-300 text-left shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993s-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5847 8.351 13.847 8 12 8s-3.5847.351-5.1373.9507L4.8404 5.4477a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3333 14.8872.3333 19.1667h23.3334c0-4.2795-2.3556-7.98-5.7867-9.8453"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-text-primary uppercase tracking-tight">Android App</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-600 dark:text-teal-400">APK</span>
                </div>
                <div className="flex items-center text-[10px] text-text-secondary font-bold mt-0.5 space-x-1 group-hover:text-accent-main transition-colors">
                  <Download className="w-3 h-3" />
                  <span>Download (8.7 MB)</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="p-6 border-t border-border-subtle transition-colors">
          <button 
            onClick={() => {
              if (user) {
                logout();
              } else {
                onLoginClick?.();
              }
              onClose?.();
            }}
            className="w-full flex items-center space-x-3 text-text-secondary hover:text-accent-main transition-colors py-2 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-widest uppercase">
              {user ? "Sign Out" : "Sign In"}
            </span>
          </button>
          <p className="text-[10px] font-bold text-text-secondary opacity-50 mt-4 uppercase tracking-widest text-center">© 2026 CSIR NET Prep</p>
        </div>
      </aside>
    </>
  );
}
