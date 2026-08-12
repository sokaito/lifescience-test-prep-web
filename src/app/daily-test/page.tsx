"use client";

import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DailyTestPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent-main font-bold uppercase text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="bg-bg-card p-10 rounded-[3rem] border border-border-subtle shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto text-orange-600">
          <Calendar className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-text-primary">Daily Mini Quiz</h1>
        <p className="text-text-secondary font-medium tracking-tight">Today's Quick Refresh Challenge</p>
        
        <div className="pt-8 border-t border-border-subtle">
           <Link 
             href="/exam/dq-morning" 
             className="block w-full bg-accent-main text-white p-6 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center"
           >
             Start Morning Session
           </Link>
        </div>
        
        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest leading-relaxed">
          This page is a deep-link target from your daily notification.
        </p>
      </div>
    </div>
  );
}
