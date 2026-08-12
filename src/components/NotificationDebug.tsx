"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { Bell, Shield, Send, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const { userData } = useAuth();
  const [status, setStatus] = useState<string>("Checking...");

  // Only show for admins or in development
  const isAdmin = userData?.role === "admin";
  
  useEffect(() => {
    const checkStatus = async () => {
      if (Capacitor.isNativePlatform()) {
        const perm = await PushNotifications.checkPermissions();
        setStatus(perm.receive);
      } else {
        if ("Notification" in window) {
          setStatus(Notification.permission);
        } else {
          setStatus("Not supported");
        }
      }
    };
    checkStatus();
  }, [isOpen]);

  if (!isAdmin) return null;

  const requestPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      const res = await PushNotifications.requestPermissions();
      setStatus(res.receive);
    } else {
      const res = await Notification.requestPermission();
      setStatus(res);
    }
  };

  const testRegistration = async () => {
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.register();
      alert("Registration requested. Check console for token.");
    } else {
      alert("Web registration is automatic on login. Check Firestore.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-accent-main text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-4 border-white dark:border-gray-800"
          title="Notification Debug"
        >
          <Bell className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-bg-card border border-border-subtle rounded-[2rem] shadow-2xl p-6 w-80 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase tracking-tight text-text-primary">FCM Debugger</h3>
            <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-bg-main p-3 rounded-2xl border border-border-subtle">
              <p className="text-[10px] uppercase font-bold text-text-secondary mb-1">Permission Status</p>
              <p className="text-sm font-bold text-accent-main uppercase tracking-widest">{status}</p>
            </div>

            <button
              onClick={requestPermission}
              className="w-full flex items-center justify-between p-4 bg-bg-main hover:bg-bg-card rounded-2xl border border-border-subtle transition-colors group"
            >
              <span className="text-sm font-bold uppercase tracking-tight text-text-primary">Request Permission</span>
              <Shield className="w-5 h-5 text-accent-main group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={testRegistration}
              className="w-full flex items-center justify-between p-4 bg-bg-main hover:bg-bg-card rounded-2xl border border-border-subtle transition-colors group"
            >
              <span className="text-sm font-bold uppercase tracking-tight text-text-primary">Trigger Register</span>
              <Send className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </button>
            
            <p className="text-[10px] text-text-secondary text-center leading-relaxed">
              Use this tool to verify push notification bridge status on this device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
