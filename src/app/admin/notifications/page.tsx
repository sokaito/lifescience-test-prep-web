"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Send, Bell, Link as LinkIcon, Users, Target, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const PREDEFINED_ROUTES = [
  { label: "Daily Test", value: "/daily-test" },
  { label: "Weekly Test", value: "/weekly-test" },
  { label: "Full Mock Test", value: "/mock-test" },
  { label: "Home Page", value: "/" },
];

export default function AdminNotificationsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [route, setRoute] = useState("/daily-test");
  const [customRoute, setCustomRoute] = useState("");
  const [target, setTarget] = useState("all");
  const [specificEmail, setSpecificEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  if (!userData || userData.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 bg-red-50 text-red-600 rounded-3xl border border-red-100 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> 
          Access Denied
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!title || !body) {
      setStatus({ type: 'error', message: "Title and Body are required." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const finalRoute = customRoute || route;
    const finalTarget = target === "all" ? "all" : specificEmail;

    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          route: finalRoute,
          target: finalTarget,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: `Successfully sent to ${data.sentCount} devices.` });
        setTitle("");
        setBody("");
      } else {
        setStatus({ type: 'error', message: data.error || "Failed to send notifications." });
      }
    } catch (e) {
      setStatus({ type: 'error', message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <header className="text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight leading-tight uppercase">Push Notifications</h1>
        <p className="text-text-secondary text-sm md:text-lg font-medium mt-2">Compose and broadcast instant alerts to your students.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Section */}
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-bg-card p-6 md:p-10 rounded-[3rem] border border-border-subtle shadow-xl space-y-8">
            
            {/* Notification Payload */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                   <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-black uppercase text-text-primary tracking-widest">Message Content</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary ml-4">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. New Daily Quiz Available!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-main p-4 rounded-2xl border border-border-subtle focus:border-accent-main outline-none transition-all font-bold placeholder:opacity-50 text-text-primary"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary ml-4">Body</label>
                  <textarea
                    placeholder="e.g. Check out the latest questions for Unit-2. Good luck!"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="w-full bg-bg-main p-4 rounded-2xl border border-border-subtle focus:border-accent-main outline-none transition-all font-medium placeholder:opacity-50 text-text-primary"
                  />
                </div>
              </div>
            </section>

            {/* Target & Route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border-subtle">
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                     <Target className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black uppercase text-text-primary tracking-widest">Target Audience</h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTarget("all")}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${target === "all" ? 'bg-accent-main text-white shadow-lg' : 'bg-bg-main text-text-secondary border border-border-subtle hover:bg-white'}`}
                  >
                    All Students
                  </button>
                  <button
                    onClick={() => setTarget("single")}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${target === "single" ? 'bg-accent-main text-white shadow-lg' : 'bg-bg-main text-text-secondary border border-border-subtle hover:bg-white'}`}
                  >
                    Specific Email
                  </button>
                </div>

                {target === "single" && (
                   <input
                     type="email"
                     placeholder="Enter student email"
                     value={specificEmail}
                     onChange={(e) => setSpecificEmail(e.target.value)}
                     className="w-full bg-bg-main p-4 rounded-2xl border border-border-subtle focus:border-accent-main outline-none transition-all font-bold text-sm"
                   />
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                     <LinkIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black uppercase text-text-primary tracking-widest">Redirect Route</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={route}
                    onChange={(e) => { setRoute(e.target.value); setCustomRoute(""); }}
                    className="w-full bg-bg-main p-4 rounded-2xl border border-border-subtle focus:border-accent-main outline-none font-bold text-sm appearance-none cursor-pointer"
                  >
                    {PREDEFINED_ROUTES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                    <option value="custom">Custom Route...</option>
                  </select>

                  {(route === "custom") && (
                    <input
                      type="text"
                      placeholder="/question?id=123"
                      value={customRoute}
                      onChange={(e) => setCustomRoute(e.target.value)}
                      className="w-full bg-bg-main p-4 rounded-2xl border border-border-subtle focus:border-accent-main outline-none font-bold text-sm"
                    />
                  )}
                </div>
              </section>
            </div>

            {/* Status Messages */}
            {status && (
              <div className={`p-5 rounded-3xl border flex items-center gap-4 animate-in zoom-in-95 duration-300 ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                {status.type === 'success' ? <CheckCircle className="w-6 h-6 flex-shrink-0" /> : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
                <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{status.message}</p>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={loading}
              className={`w-full p-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all uppercase font-black tracking-[0.2em] shadow-xl ${loading ? 'bg-bg-main text-text-secondary cursor-not-allowed' : 'bg-accent-main text-white hover:scale-[1.02] active:scale-95 group'}`}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Send Broadcast <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50/50 border border-blue-100/50 p-6 rounded-[2.5rem] flex items-start gap-4">
         <Users className="w-6 h-6 text-blue-500 mt-1" />
         <div>
            <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Backend Notice</p>
            <p className="text-xs text-blue-900/70 font-medium leading-relaxed mt-1">
              Notifications are delivered to all tokens registered for each student. This includes Android, iOS, and Web/Desktop sessions. Batch delivery is limited to 500 devices per broadcast.
            </p>
         </div>
      </div>
    </div>
  );
}
