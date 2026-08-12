"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Database, ShieldCheck, ArrowRight, BookOpen, Bell, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/");
    }
  }, [userData, router]);

  if (!userData || userData.role !== "admin") {
     return null; // Handled by useEffect redirect
  }

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 space-y-8 transition-colors">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight leading-tight uppercase">Admin Panel</h1>
        <p className="text-text-secondary text-sm md:text-lg font-medium mt-2">Manage your question bank and application data securely.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/seeder" className="group bg-bg-card p-6 rounded-[2.5rem] border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-accent-main">
            <Database className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-text-primary mb-2 uppercase tracking-tight">Question Seeder</h3>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">Synchronize your local question database with Firestore. Supports bulk uploads and updates.</p>
          <div className="flex items-center text-accent-main font-black text-xs uppercase tracking-[0.2em]">
            Access Tool <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/admin/notifications" className="group bg-bg-card p-6 rounded-[2.5rem] border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-orange-600">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-text-primary mb-2 uppercase tracking-tight">Push Notifications</h3>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">Broadcast alerts and reminders to all students. Supports deep linking and mobile/web delivery.</p>
          <div className="flex items-center text-orange-600 font-black text-xs uppercase tracking-[0.2em]">
            Manage <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/admin/reported-questions" className="group bg-bg-card p-6 rounded-[2.5rem] border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-rose-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-text-primary mb-2 uppercase tracking-tight">Reported Questions</h3>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">Review student feedback, resolve data errors, and edit questions inline directly in Firestore.</p>
          <div className="flex items-center text-rose-600 font-black text-xs uppercase tracking-[0.2em]">
            Review Reports <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <div className="bg-bg-main p-6 rounded-[2.5rem] border border-border-subtle opacity-50 cursor-not-allowed transition-colors">
          <div className="w-14 h-14 bg-bg-card border border-border-subtle rounded-2xl flex items-center justify-center mb-6">
            <BookOpen className="w-7 h-7 text-text-secondary" />
          </div>
          <h3 className="text-xl font-black text-text-secondary opacity-70 mb-2 uppercase tracking-tight">User Analytics</h3>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">Monitor student progress and test performance. Coming soon.</p>
          <div className="flex items-center text-text-secondary font-black text-xs uppercase tracking-[0.2em]">
            Locked
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-[2.5rem] transition-colors">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-black text-blue-900 dark:text-blue-200 uppercase tracking-tight">Security Note</h3>
        </div>
        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          Access to this page is restricted to accounts with the <code className="bg-blue-200/50 dark:bg-blue-800/50 px-1 rounded font-bold">admin</code> role. Ensure your email is whitelisted in the <code className="bg-blue-200/50 dark:bg-blue-800/50 px-1 rounded font-bold">AuthContext.tsx</code> file.
        </p>
      </div>
    </div>
  );
}
