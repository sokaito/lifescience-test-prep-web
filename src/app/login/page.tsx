"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Chrome } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };

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
      router.push("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <LayoutDashboard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-text-primary">
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-card py-8 px-4 shadow-sm border border-border-subtle sm:rounded-2xl sm:px-10 transition-colors">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text-primary">Display Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-border-subtle bg-bg-main text-text-primary rounded-xl shadow-sm placeholder:text-text-secondary focus:outline-none focus:ring-accent-main focus:border-accent-main sm:text-sm"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-primary">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border-subtle bg-bg-main text-text-primary rounded-xl shadow-sm placeholder:text-text-secondary focus:outline-none focus:ring-accent-main focus:border-accent-main sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text-primary">Password</label>
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
                    className="text-xs font-bold text-accent-main hover:opacity-80"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border-subtle bg-bg-main text-text-primary rounded-xl shadow-sm placeholder:text-text-secondary focus:outline-none focus:ring-accent-main focus:border-accent-main sm:text-sm"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-bg-card bg-text-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary disabled:opacity-50 transition-colors"
              >
                {loading ? "Processing..." : isLogin ? "Sign in" : "Sign up"}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-full border-t border-border-subtle" />
              <span className="relative px-4 bg-bg-card text-xs font-bold text-text-secondary uppercase italic transition-colors">Or continue with</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-border-subtle rounded-xl shadow-sm text-sm font-bold text-text-primary bg-bg-card hover:bg-bg-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-main disabled:opacity-50 transition-colors"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              Sign in with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-accent-main hover:opacity-80"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
