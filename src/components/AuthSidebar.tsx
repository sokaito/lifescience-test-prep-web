"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, LayoutDashboard, Chrome, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface AuthSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthSidebar({ isOpen, onClose }: AuthSidebarProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, logout, user, userData, signInWithGoogle, resetPassword } = useAuth();

  useEffect(() => {
    const handleToggle = () => onClose();
    window.addEventListener("toggle-auth-sidebar", () => {
    });
    return () => window.removeEventListener("toggle-auth-sidebar", handleToggle);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name || email.split("@")[0]);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = err.message || "An error occurred";
      
      if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered. Switching to Sign In...";
        setIsLogin(true);
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        message = "Invalid email or password. Please try again or use Google Sign-In.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/weak-password") {
        message = "Password should be at least 6 characters.";
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-bg-card h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-border-subtle transition-colors">
        <div className="p-6 border-b border-border-subtle flex items-center justify-center transition-colors">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-text-primary">LifeSci Prep</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {user ? (
            <div className="flex flex-col h-full">
              <button 
                onClick={onClose} 
                className="w-10 h-10 mb-6 flex items-center justify-center bg-bg-card border border-border-subtle shadow-lg rounded-full text-text-secondary hover:text-accent-main hover:scale-110 active:scale-95 transition-all group"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="text-center py-8">
              {userData?.photoURL ? (
                <img 
                  src={userData.photoURL} 
                  alt={userData?.name || "User"}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-4 ring-teal-200 dark:ring-teal-800 shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-200 dark:border-teal-800">
                  <span className="text-2xl font-bold text-accent-main">{userData?.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <h2 className="text-xl font-bold text-text-primary">{userData?.name}</h2>
              <p className="text-text-secondary mb-8">{user.email}</p>
              
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-bg-main hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-text-secondary rounded-xl font-bold transition-colors flex items-center justify-center border border-border-subtle hover:border-red-200 dark:hover:border-red-800"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
          ) : (
            <>
              <button 
                onClick={onClose} 
                className="w-10 h-10 mb-6 flex items-center justify-center bg-bg-card border border-border-subtle shadow-lg rounded-full text-text-secondary hover:text-accent-main hover:scale-110 active:scale-95 transition-all group"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-text-primary mb-2">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-text-secondary text-sm">
                  {isLogin ? "Login to access your personalized dashboard and progress." : "Sign up to start your CSIR NET preparation journey."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-text-secondary opacity-70 uppercase tracking-widest mb-1.5 ml-1">Display Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full pl-6 pr-4 py-3 bg-bg-main border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-main/20 focus:border-accent-main transition-all placeholder:text-text-secondary"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-secondary opacity-70 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-bg-main border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-main/20 focus:border-accent-main transition-all placeholder:text-text-secondary"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="block text-xs font-bold text-text-secondary opacity-70 uppercase tracking-widest">Password</label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={async () => {
                          if (!email) {
                            setError("Please enter your email first to reset password.");
                            return;
                          }
                          try {
                            await resetPassword(email);
                            setError("Password reset link sent to your email!");
                          } catch (err: any) {
                            setError(err.message || "Failed to send reset link.");
                          }
                        }}
                        className="text-[10px] font-bold text-accent-main hover:opacity-80 uppercase tracking-wider"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-bg-main border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-main/20 focus:border-accent-main transition-all placeholder:text-text-secondary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-text-primary text-bg-card hover:opacity-90 font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-bg-card/30 border-t-bg-card rounded-full animate-spin" />
                    </div>
                  ) : (
                    isLogin ? "Sign In" : "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute w-full border-t border-border-subtle" />
                  <span className="relative px-4 bg-bg-card text-xs font-bold text-text-secondary opacity-70 uppercase italic transition-colors">Or continue with</span>
                </div>

                <button 
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    try {
                      await signInWithGoogle();
                      onClose();
                    } catch (err: any) {
                      setError(err.message || "Google sign in failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-3 px-4 bg-bg-main border border-border-subtle rounded-2xl flex items-center justify-center font-bold text-text-primary hover:opacity-80 transition-opacity shadow-sm"
                >
                  <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                  Google Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
