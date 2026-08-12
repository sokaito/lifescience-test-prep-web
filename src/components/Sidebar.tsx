"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, Trello, Settings, X, LogIn, ShieldCheck, History } from "lucide-react";
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
