"use client";

import { Clock, CheckSquare, Target, PlayCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ENABLE_TOKEN_SYSTEM } from "@/lib/constants";

async function handleTokenDeduct(userId: string, cost: number, testId: string, testType: string) {
  const res = await fetch("/api/tokens/deduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, cost, testId, testType })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to deduct tokens");
  return data;
}

export function DailyMiniQuiz({ title, questions, minutes, id, isLocked, onLockedClick }: { title: string, questions: number, minutes: number, id: string, isLocked?: boolean, onLockedClick?: () => void }) {
  const cost = 1;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      // If it's a guest or token system is disabled, just proceed.
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
             router.push("/dashboard/tokens");
             return;
          }
          
          const data = await handleTokenDeduct(user?.uid || user?.email || "unknown", cost, id, "Daily Quiz");
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`w-full max-w-[280px] sm:max-w-xs md:max-w-sm bg-bg-card rounded-2xl p-4 md:p-5 border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group shrink-0 relative overflow-hidden ${isLocked ? 'grayscale-[0.5]' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Daily</span>
        {isLocked ? <Lock className="w-4 h-4 text-orange-500" /> : <Target className="w-4 h-4 text-text-secondary group-hover:text-accent-main transition-colors" />}
      </div>
      <h3 className="font-bold text-text-primary text-sm md:text-base mb-3 line-clamp-2 leading-tight" title={title}>{title}</h3>
      <div className="flex items-center space-x-3 text-[10px] font-bold text-text-secondary mb-4 uppercase tracking-widest">
        <div className="flex items-center space-x-1">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{questions} Qs</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{minutes} Min</span>
        </div>
      </div>
      {!isGuest && ENABLE_TOKEN_SYSTEM && (
        <div className="flex items-center space-x-1 mb-3 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg w-max border border-amber-200/50 dark:border-amber-800/50 uppercase tracking-widest">
          <span>🪙 1 Token (Daily Quiz)</span>
        </div>
      )}
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${isLocked ? 'bg-bg-main text-text-secondary cursor-not-allowed' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-accent-main hover:text-white dark:hover:bg-accent-main'} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {isLoading ? (
          "Starting..."
        ) : isLocked ? (
          <><Lock className="w-3.5 h-3.5 mr-1.5" /> Unlock Test</>
        ) : (
          <><PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start Test</>
        )}
      </button>
    </div>
  );
}

export function UnitMockTest({ title, questions, minutes, id, unitId, isLocked, onLockedClick }: { title: string, questions: number, minutes: number, id: string, unitId: number, isLocked?: boolean, onLockedClick?: () => void }) {
  const cost = 5;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
             router.push("/dashboard/tokens");
             return;
          }

          const data = await handleTokenDeduct(user?.uid || user?.email || "unknown", cost, id, "Unit Test");
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative w-full bg-bg-card rounded-2xl p-4 md:p-5 border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${isLocked ? 'grayscale-[0.5]' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Unit {unitId}</span>
        {isLocked ? <Lock className="w-4 h-4 text-orange-500" /> : <Target className="w-4 h-4 text-text-secondary group-hover:text-orange-500 transition-colors" />}
      </div>
      <h3 className="font-bold text-text-primary text-sm md:text-base mb-3 line-clamp-2 leading-tight" title={title}>{title}</h3>
      <div className="flex items-center space-x-3 text-[10px] font-bold text-text-secondary mb-4 uppercase tracking-widest">
        <div className="flex items-center space-x-1">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{questions} Qs</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{minutes} Min</span>
        </div>
      </div>
      {!isGuest && ENABLE_TOKEN_SYSTEM && (
        <div className="flex items-center space-x-1 mb-3 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg w-max border border-amber-200/50 dark:border-amber-800/50 uppercase tracking-widest">
          <span>🪙 5 Tokens (Unit Test)</span>
        </div>
      )}
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${isLocked ? 'bg-bg-main text-text-secondary cursor-not-allowed' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500'} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {isLoading ? (
          "Starting..."
        ) : isLocked ? (
          <><Lock className="w-3.5 h-3.5 mr-1.5" /> Unlock Unit</>
        ) : (
          <><PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start Test</>
        )}
      </button>
    </div>
  );
}

export function WeeklyRevision({ topic, questions, minutes, id, isLocked, onLockedClick }: { topic: string, questions: number, minutes: number, id: string, isLocked?: boolean, onLockedClick?: () => void }) {
  const cost = 5;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
             router.push("/dashboard/tokens");
             return;
          }
          
          const data = await handleTokenDeduct(user?.uid || user?.email || "unknown", cost, id, "Weekly Revision");
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-bg-card rounded-3xl p-5 md:p-6 border border-border-subtle shadow-sm hover:shadow-xl transition-all group overflow-hidden relative ${isLocked ? 'grayscale-[0.5]' : ''}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-125 transition-transform text-accent-main">
        <Clock className="w-20 h-20" />
      </div>
      <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full mb-4 uppercase tracking-widest z-10 relative">Weekly Revision</div>
      <h3 className="text-lg md:text-xl font-black text-text-primary mb-4 leading-tight break-words z-10 relative">{topic}</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-6 z-10 relative">
        <div className="bg-bg-main p-3 rounded-2xl border border-border-subtle">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Questions</span>
          <span className="text-text-primary font-black flex items-center text-sm"><CheckSquare className="w-3.5 h-3.5 mr-1.5 text-accent-main"/>{questions}</span>
        </div>
        <div className="bg-bg-main p-3 rounded-2xl border border-border-subtle">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Duration</span>
          <span className="text-text-primary font-black flex items-center text-sm"><Clock className="w-3.5 h-3.5 mr-1.5 text-accent-main"/>{minutes} min</span>
        </div>
      </div>
      
      {!isGuest && ENABLE_TOKEN_SYSTEM && (
        <div className="flex items-center justify-center mb-4 relative z-10">
          <div className="flex items-center space-x-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 uppercase tracking-widest shadow-sm">
            <span>🪙 5 Tokens (Weekly Test)</span>
          </div>
        </div>
      )}

      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-lg relative z-10 ${isLocked ? 'bg-bg-main text-text-secondary shadow-none' : 'bg-text-primary text-bg-card hover:opacity-90 shadow-lg'} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {isLoading ? "Starting..." : isLocked ? <><Lock className="w-4 h-4 mr-2" /> Unlock Topic</> : "Begin Revision"}
      </button>

      {isLocked && (
        <div className="absolute inset-0 bg-bg-card/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-20">
          <div className="bg-bg-card p-3 rounded-2xl shadow-xl border border-border-subtle animate-bounce">
            <Lock className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      )}
    </div>
  );
}

export function FullMockTest({ title, questions, minutes, id, tags, isLocked, onLockedClick }: { title: string, questions: number, minutes: number, id: string, tags: string[], isLocked?: boolean, onLockedClick?: () => void }) {
  const cost = 10;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
             router.push("/dashboard/tokens");
             return;
          }
          
          const data = await handleTokenDeduct(user?.uid || user?.email || "unknown", cost, id, "Full Mock Test");
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-bg-card rounded-[2.5rem] p-6 md:p-10 border border-border-subtle shadow-xl hover:shadow-2xl relative overflow-hidden group transition-all ${isLocked ? 'opacity-90' : ''}`}
    >
      {isLocked && (
        <div className="absolute inset-0 bg-bg-main/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-6 transition-all group-hover:bg-bg-main/50">
          <div className="w-16 h-16 bg-bg-card rounded-2xl flex items-center justify-center border border-border-subtle mb-4 shadow-lg animate-pulse">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
          <h4 className="text-xl font-black text-text-primary uppercase tracking-widest mb-2">Authenticated Users Only</h4>
          <p className="text-text-secondary text-sm font-medium mb-6 max-w-sm">Sign in to unlock full-length CSIR NET mock tests.</p>
          <button 
            onClick={handleClick}
            className="px-8 py-3 bg-text-primary text-bg-card rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Sign In Now
          </button>
        </div>
      )}

      <div className="absolute top-0 right-0 p-12 opacity-5 transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform hidden sm:block text-accent-main">
        <Target className="w-48 h-48" />
      </div>
      
      <div className={`relative z-10 flex flex-col items-center text-center ${isLocked ? 'blur-[4px] pointer-events-none' : ''}`}>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="bg-bg-main text-text-primary border border-border-subtle text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Full Mock</span>
          {tags.map(tag => (
            <span key={tag} className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black px-3 py-1 rounded-full border border-teal-500/20 uppercase tracking-widest">{tag}</span>
          ))}
        </div>
        
        <h3 className="text-2xl md:text-4xl font-black text-text-primary mb-3 tracking-tight leading-tight max-w-2xl">{title}</h3>
        <p className="text-text-secondary font-bold text-xs md:text-sm uppercase tracking-[0.2em] mb-8">Official Pattern Exam</p>
        
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-10 w-full max-w-md">
          <div className="flex-1 bg-bg-main border border-border-subtle p-4 rounded-3xl">
            <span className="text-[10px] font-bold text-accent-main uppercase tracking-widest block mb-1">Total Qs</span>
            <span className="text-xl md:text-2xl font-black text-text-primary">{questions}</span>
          </div>
          <div className="flex-1 bg-bg-main border border-border-subtle p-4 rounded-3xl">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Time Limit</span>
            <span className="text-xl md:text-2xl font-black text-text-primary">{minutes}m</span>
          </div>
        </div>
        
        {!isGuest && ENABLE_TOKEN_SYSTEM && (
          <div className="flex items-center space-x-1.5 mb-6 text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl border border-amber-200/50 dark:border-amber-800/50 uppercase tracking-widest shadow-sm">
            <span>🪙 10 Tokens (Mock Test)</span>
          </div>
        )}
        
        <button 
          onClick={handleClick}
          disabled={isLoading}
          className={`w-full sm:w-auto px-10 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-black text-lg md:text-xl shadow-lg hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-1 transition-all ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isLoading ? "Starting..." : "Take Exam Now"}
        </button>
      </div>
    </div>
  );
}
