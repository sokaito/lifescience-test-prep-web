"use client";

import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { Save } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, updateProfileData } = useAuth();
  const [name, setName] = useState(userData?.name || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileData({ name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (user === undefined) return <div>Loading...</div>;
  if (user === null) return <div className="p-8 text-center text-slate-500">Please log in to edit your profile.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 transition-colors">
      <div className="flex items-center space-x-5">
        {(user?.photoURL || userData?.photoURL) ? (
          <img 
            src={user?.photoURL || userData?.photoURL} 
            alt={userData?.name || "User"}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-teal-200 dark:ring-teal-800 shadow-lg"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <span className="text-xl font-bold text-teal-500">{userData?.name?.[0]?.toUpperCase() || "U"}</span>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Edit Profile</h1>
          <p className="text-text-secondary mt-1">Update your display name and basic information.</p>
        </div>
      </div>

      <div className="bg-bg-card p-8 rounded-3xl border border-border-subtle shadow-sm transition-colors">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email Address</label>
            <input 
              type="text" 
              disabled 
              value={user.email || ""} 
              className="w-full px-4 py-3 bg-bg-main border border-border-subtle rounded-xl text-text-secondary cursor-not-allowed"
            />
            <p className="text-xs text-text-secondary opacity-70 mt-2">Your email address cannot be changed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Display Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-main"
            />
          </div>

          {success && (
            <div className="bg-teal-50 text-teal-700 p-4 rounded-xl text-sm font-medium border border-teal-100">
              Profile updated successfully!
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
