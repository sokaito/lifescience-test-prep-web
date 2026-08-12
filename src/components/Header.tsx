"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 glass z-50 flex items-center px-4 md:px-8">
      {/* Centered Branding */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter animate-advanced-text select-none">
          LIFESCI PREP
        </h1>
      </div>
    </header>
  );
}
