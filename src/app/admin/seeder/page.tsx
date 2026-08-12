"use client";

import FirebaseQuestionSeeder from "@/components/QuestionSeeder";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminSeederPage() {
  const { userData, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/");
    }
  }, [userData, router]);

  if (!userData || userData.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8">You do not have permission to access the seeder tool.</p>
        <Link href="/" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Question Seeder</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Database Synchronizer</p>
        </div>
        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center text-slate-500 font-bold text-xs uppercase tracking-widest">
           <ArrowLeft className="w-4 h-4 mr-1" />
           Back to Admin
        </Link>
      </div>

      <FirebaseQuestionSeeder />
    </div>
  );
}
