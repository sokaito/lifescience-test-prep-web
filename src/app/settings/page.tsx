"use client";

import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { Globe, Save, User, Download, Smartphone } from "lucide-react";
import QuestionSeeder from "@/components/QuestionSeeder";

const languages = ["English", "Hindi", "Spanish", "French"];

export default function SettingsPage() {
  const { userData, updateProfileData, user } = useAuth();
  const [language, setLanguage] = useState(userData?.language || "English");
  const [name, setName] = useState(userData?.name || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileData({ language, name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 pb-20">
      <div className="text-center md:text-left px-2">
        <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight uppercase">Settings</h1>
        <p className="text-text-secondary text-sm font-medium mt-1 uppercase tracking-widest italic">Preferences & Profile</p>
      </div>

      <div className="bg-bg-card p-6 md:p-8 rounded-[2rem] border border-border-subtle shadow-sm animate-fade-in-up transition-all">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile Section - Only for logged-in users */}
          {user && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Public Profile</h3>
              </div>
              
              <div className="pl-12">
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2 ml-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-5 py-4 bg-bg-main border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-main/20 focus:border-accent-main transition-all font-bold placeholder:text-text-secondary"
                />
                <p className="text-[10px] text-text-secondary mt-2 font-medium">This name will be visible on leaderboards and results.</p>
              </div>
            </div>
          )}

          {/* Localization Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">App Experience</h3>
            </div>
            
            <div className="pl-12">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2 ml-1">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-5 py-4 bg-bg-main border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-main/20 focus:border-accent-main transition-all font-bold appearance-none"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {success && (
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 text-accent-main text-xs font-black rounded-2xl animate-bounce text-center uppercase tracking-widest">
              Success! Your profile is updated.
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full flex items-center justify-center space-x-3 bg-text-primary text-bg-card hover:opacity-90 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Updating...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Android App APK Download Card */}
      <div className="bg-bg-card p-6 md:p-8 rounded-[2rem] border border-border-subtle shadow-sm animate-fade-in-up">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl text-accent-main">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Android Application</h3>
            <p className="text-xs text-text-secondary font-medium">Download the standalone APK for mobile devices</p>
          </div>
        </div>

        <div className="p-4 bg-bg-main rounded-2xl border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-text-primary">LifeSci Prep v1.0</span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-teal-500/20 text-accent-main">Signed APK</span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">Package size: 8.7 MB • Compatible with Android 7.0+</p>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <a
              href="/lifesci-prep.apk"
              download="lifesci-prep.apk"
              className="flex-1 sm:flex-initial py-3 px-5 bg-accent-main text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:opacity-90 flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-apk-modal", { detail: { showGuide: true } }));
                }
              }}
              className="py-3 px-4 bg-bg-card border border-border-subtle rounded-xl text-text-primary text-xs font-bold uppercase tracking-wider hover:bg-bg-main transition-all"
            >
              Guide
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-text-secondary opacity-50 uppercase tracking-[0.3em]">App Version 1.0.4-Stable</p>
      </div>
    </div>
  );
}
