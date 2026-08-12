"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

function QuestionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent-main font-bold uppercase text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="bg-bg-card p-10 rounded-[3rem] border border-border-subtle shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-accent-main/10 rounded-3xl flex items-center justify-center mx-auto text-accent-main">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-text-primary">Question Details</h1>
        <p className="text-text-secondary font-medium">Viewing details for Question ID: <span className="text-accent-main font-bold">#{id || "Unknown"}</span></p>
        
        <div className="pt-6 border-t border-border-subtle">
           <p className="text-sm text-text-secondary leading-relaxed">
             This is a deep-linked page triggered by a push notification. In a full implementation, this would fetch and display question #{id} specifically.
           </p>
        </div>
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold uppercase tracking-widest animate-pulse">Loading Question...</div>}>
      <QuestionContent />
    </Suspense>
  );
}
