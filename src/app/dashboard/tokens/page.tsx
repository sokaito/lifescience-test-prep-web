"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Coins, History, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import BuyTokens from "@/components/BuyTokens";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ENABLE_TOKEN_SYSTEM } from "@/lib/constants";

export default function TokenDashboard() {
  const { user, userData, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<"history" | "purchase">("history");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!ENABLE_TOKEN_SYSTEM) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-bg-card rounded-[2.5rem] border border-border-subtle shadow-xl max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-800">
           <Coins className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tight mb-2">Token System Maintenance</h2>
        <p className="text-text-secondary font-medium mb-8 max-w-sm mx-auto">
          The token system is currently disabled for maintenance. You can access all tests freely for now.
        </p>
        <Link href="/" className="px-10 py-4 bg-text-primary text-bg-card rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
          Back to Home
        </Link>
      </div>
    );
  }

  useEffect(() => {
    async function fetchLogs() {
      if (!user) return;
      try {
        const logsRef = collection(db, "tokenLogs");
        const q = query(logsRef, where("userId", "==", user.uid || user.email), orderBy("timestamp", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [user]);

  if (isGuest || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-bg-card rounded-[2.5rem] border border-border-subtle shadow-xl max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-800">
           <Coins className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tight mb-2">Token System Restricted</h2>
        <p className="text-text-secondary font-medium mb-8 max-w-sm mx-auto">
          The token dashboard and payment features are only available to registered members. Sign in to start managing your tokens.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <Link href="/" className="px-8 py-4 bg-bg-main border border-border-subtle text-text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-bg-card transition-all">
            Back to Home
          </Link>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"))}
            className="px-10 py-4 bg-text-primary text-bg-card rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const tokens = userData?.tokens ?? 0;
  const usageLogs = logs.filter(l => l.type === "spend");
  const purchaseLogs = logs.filter(l => l.type === "earn");

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/" className="p-2 bg-bg-card rounded-full hover:bg-bg-main transition-colors border border-border-subtle">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tight">Token Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token Balance Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
            <Coins className="w-32 h-32" />
          </div>
          <Coins className="w-12 h-12 mb-4 text-amber-100 z-10 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-100 mb-2 z-10">Current Balance</h2>
          <div className="text-6xl font-black mb-4 z-10">{tokens}</div>
          <button 
            onClick={() => setActiveTab("purchase")}
            className="w-full py-3 bg-white text-orange-600 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg z-10"
          >
            Buy Tokens
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="md:col-span-2 bg-bg-card rounded-[2rem] border border-border-subtle p-2 md:p-6 shadow-sm flex flex-col min-h-[400px]">
          {/* Tabs */}
          <div className="flex space-x-2 bg-bg-main p-1.5 rounded-2xl mb-6">
             <button 
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${activeTab === "history" ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
             >
                <History className="w-4 h-4" />
                <span>Usage logs</span>
             </button>
             <button 
                onClick={() => setActiveTab("purchase")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${activeTab === "purchase" ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
             >
                <CreditCard className="w-4 h-4" />
                <span>Purchase Tokens</span>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === "history" && (
              <div className="space-y-4">
                {loading ? (
                   <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-text-secondary" /></div>
                ) : logs.length === 0 ? (
                   <div className="text-center p-8 text-text-secondary">No token history found.</div>
                ) : (
                  usageLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-bg-main border border-border-subtle rounded-2xl hover:border-text-secondary transition-colors group">
                      <div>
                        <h4 className="font-bold text-text-primary text-sm sm:text-base group-hover:text-accent-main transition-colors">{log.testType || log.detail || "Item"}</h4>
                        <p className="text-xs text-text-secondary font-medium mt-1 uppercase tracking-widest">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "Recently"}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg">-{log.amount}</span>
                        <Coins className="w-4 h-4 text-text-secondary" />
                      </div>
                    </div>
                  ))
                )}
                {/* Purchase history included below */}
                {purchaseLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-bg-main border border-border-subtle rounded-2xl hover:border-text-secondary transition-colors group">
                      <div>
                        <h4 className="font-bold text-text-primary text-sm sm:text-base group-hover:text-amber-500 transition-colors">Purchased Tokens</h4>
                        <p className="text-xs text-text-secondary font-medium mt-1 uppercase tracking-widest">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "Recently"}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">+{log.amount}</span>
                        <Coins className="w-4 h-4 text-text-secondary" />
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "purchase" && (
              <BuyTokens />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
