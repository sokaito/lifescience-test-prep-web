"use client";

import { useState, useEffect } from "react";
import { 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  FolderDown,
  Settings,
  ArrowRight,
  Info
} from "lucide-react";

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultShowGuide?: boolean;
}

export default function DownloadApkModal({ isOpen, onClose, defaultShowGuide = false }: DownloadApkModalProps) {
  const [showInstructions, setShowInstructions] = useState(defaultShowGuide);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowInstructions(defaultShowGuide);
    } else {
      setDownloadStarted(false);
    }
  }, [isOpen, defaultShowGuide]);

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    setDownloadStarted(true);
    setShowInstructions(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[110] px-3 md:px-4 py-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-bg-card border border-border-subtle rounded-[2.5rem] p-6 md:p-8 shadow-2xl z-10 animate-fade-in-up transition-all my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Futuristic glowing ambient orbs */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-bg-main border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:scale-110 active:scale-95 transition-all z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-teal-400 via-emerald-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-500/25 mb-4 p-4 transform hover:rotate-6 transition-transform">
            {/* Custom Android SVG Icon */}
            <svg 
              className="w-12 h-12 text-slate-950 fill-current" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993s-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5847 8.351 13.847 8 12 8s-3.5847.351-5.1373.9507L4.8404 5.4477a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3333 14.8872.3333 19.1667h23.3334c0-4.2795-2.3556-7.98-5.7867-9.8453"/>
            </svg>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Android APK • v1.0</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Install LifeSci Prep on Android
          </h3>
          
          <p className="text-text-secondary text-sm md:text-base mt-2 max-w-md">
            Download our direct APK to enjoy superfast test loading, complete offline exam mode, and test alerts.
          </p>

          {/* Quick specs pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 my-4 py-2.5 px-5 bg-bg-main rounded-2xl border border-border-subtle text-xs font-bold text-text-secondary">
            <span className="flex items-center"><Smartphone className="w-3.5 h-3.5 mr-1 text-teal-500" /> Android 7.0+</span>
            <span className="text-border-subtle hidden sm:inline">|</span>
            <span>Size: 8.7 MB</span>
            <span className="text-border-subtle hidden sm:inline">|</span>
            <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Safe & Verified</span>
          </div>

          {/* Primary Action Button */}
          <a
            href="/lifesci-prep.apk"
            download="lifesci-prep.apk"
            onClick={handleDownloadClick}
            className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-3 group hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <span>{downloadStarted ? "Downloading Again..." : "Download APK Now (8.7 MB)"}</span>
          </a>

          {downloadStarted && (
            <div className="w-full mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Download started! Check your phone's notification bar or downloads.</span>
            </div>
          )}

          {/* Detailed Step-by-Step Installation Guide */}
          <div className="w-full mt-6 text-left border-t border-border-subtle pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-accent-main" />
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">
                  Easy Step-by-Step Installation Guide
                </h4>
              </div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs font-bold text-accent-main hover:underline flex items-center"
              >
                {showInstructions ? "Collapse" : "View Steps"}
                {showInstructions ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
              </button>
            </div>

            {showInstructions && (
              <div className="space-y-3 mt-4 text-xs animate-fade-in">
                
                {/* Step 1 */}
                <div className="p-4 bg-bg-main rounded-2xl border border-border-subtle space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      1
                    </span>
                    <h5 className="font-bold text-text-primary text-sm">Download the APK File</h5>
                  </div>
                  <p className="text-text-secondary pl-8 leading-relaxed">
                    Click the <span className="font-bold text-teal-600 dark:text-teal-400">Download APK Now</span> button above.
                  </p>
                  <div className="ml-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Seeing "File might be harmful"?</span>
                        <p className="mt-0.5 text-[11px] opacity-90">
                          Do not worry! Tap <span className="font-black underline">"Download anyway"</span>. Android displays this generic warning for <strong>all apps</strong> downloaded from websites instead of the Play Store. Our APK is 100% clean.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-bg-main rounded-2xl border border-border-subtle space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      2
                    </span>
                    <h5 className="font-bold text-text-primary text-sm">Open the Downloaded File</h5>
                  </div>
                  <div className="text-text-secondary pl-8 space-y-1.5 leading-relaxed">
                    <p>
                      Swipe down from the top of your phone screen to check notifications and tap <span className="font-bold text-text-primary">"lifesci-prep.apk • Download complete"</span>.
                    </p>
                    <p className="text-[11px] text-text-secondary opacity-80 flex items-center">
                      <FolderDown className="w-3.5 h-3.5 mr-1 text-teal-500 flex-shrink-0" />
                      Alternatively, open your phone's <strong>Files</strong> app or Chrome's <strong>(⋮) Menu ➔ Downloads</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-bg-main rounded-2xl border border-border-subtle space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      3
                    </span>
                    <h5 className="font-bold text-text-primary text-sm">Allow Unknown Apps Permission</h5>
                  </div>
                  <div className="text-text-secondary pl-8 space-y-2 leading-relaxed">
                    <p>
                      If your phone says <span className="italic">"For your security, your phone is not allowed to install unknown apps"</span>:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-bold">
                      <div className="p-2.5 rounded-xl bg-bg-card border border-border-subtle flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <span>1. Tap <strong>Settings</strong></span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-bg-card border border-border-subtle flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>2. Turn ON <strong>Allow</strong></span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-bg-card border border-border-subtle flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span>3. Tap <strong>Back</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 bg-bg-main rounded-2xl border border-border-subtle space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      4
                    </span>
                    <h5 className="font-bold text-text-primary text-sm">Tap Install & Launch</h5>
                  </div>
                  <p className="text-text-secondary pl-8 leading-relaxed">
                    Tap <span className="font-bold text-teal-600 dark:text-teal-400">"Install"</span>. In a few seconds, installation will finish. Tap <span className="font-bold text-text-primary">"Open"</span> to launch LifeSci Prep and begin preparing!
                  </p>
                </div>

                {/* Reassurance Callout */}
                <div className="p-3.5 bg-teal-500/10 border border-teal-500/25 rounded-2xl flex items-start space-x-2.5 text-[11px] text-teal-700 dark:text-teal-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Verified Safe Application:</span> This APK is built directly from our official CSIR NET Life Sciences platform. It requires no dangerous permissions and does not access private device storage.
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
