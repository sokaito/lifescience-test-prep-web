"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { ENABLE_TOKEN_SYSTEM } from "@/lib/constants";

export default function TokenFloatButton() {
  const { user, userData, isGuest } = useAuth();
  const router = useRouter();

  if (!ENABLE_TOKEN_SYSTEM || isGuest || !user) return null;

  const tokens = userData?.tokens ?? 0;

  return (
    <button 
      onClick={() => router.push("/dashboard/tokens")}
      className="flex items-center space-x-1.5 px-3 py-1.5 md:space-x-2 md:px-4 md:py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-full shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
      title="View Token Dashboard"
    >
      <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:transition-all group-hover:translate-x-full duration-700"></div>
      <Coins className="w-4 h-4 md:w-5 md:h-5 text-amber-100 animate-[pulse_2s_infinite]" />
      <span className="text-xs md:text-sm tracking-widest uppercase z-10">
        {tokens} <span className="hidden sm:inline">Tokens</span>
      </span>
    </button>
  );
}
