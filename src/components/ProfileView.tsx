import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { User, Shield, Mail, Calendar, Activity, Save, Check, RefreshCw } from "lucide-react";
import { UserProfile } from "../types";

interface ProfileViewProps {
  user: any;
  darkMode: boolean;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=DetectiveJane",
  "https://api.dicebear.com/7.x/bottts/svg?seed=AgentSmith",
  "https://api.dicebear.com/7.x/bottts/svg?seed=ForensicBob",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CognitiveAda"
];

export default function ProfileView({ user, darkMode }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "users", user.uid);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          return;
        }
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setName(data.name);
          setAvatar(data.photoURL);
        } else {
          // Fallback if record doesn't exist
          const fallback: UserProfile = {
            uid: user.uid,
            name: user.displayName || "Detective",
            email: user.email || "",
            photoURL: user.photoURL || PRESET_AVATARS[0],
            createdAt: Date.now(),
            lastLogin: Date.now(),
            totalUploads: 0,
            totalReports: 0
          };
          setProfile(fallback);
          setName(fallback.name);
          setAvatar(fallback.photoURL);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchProfile();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setUpdating(true);
    setSuccess(false);

    try {
      const docRef = doc(db, "users", user.uid);
      try {
        await updateDoc(docRef, {
          name,
          photoURL: avatar
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      setProfile(prev => prev ? { ...prev, name, photoURL: avatar } : null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to update Firestore profile:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500 text-xs font-mono tracking-wider">
        <RefreshCw className="w-8 h-8 mx-auto stroke-1 animate-spin text-gray-600 mb-2.5" />
        <span>Syncing credentials with cloud directory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="text-center md:text-left space-y-1 border-b border-slate-800 pb-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          Admin Profile Settings
        </h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Review case volumes, configure administrative profiles, and synchronize database credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Card: Account Statistics overview */}
        <div className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <div className="space-y-4">
            {/* Massive Avatar Preview */}
            <div className="w-16 h-16 mx-auto rounded-full ring-2 ring-indigo-500/30 overflow-hidden bg-slate-800 flex items-center justify-center">
              <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
            </div>

            <div className="text-center space-y-0.5">
              <h3 className="text-sm font-bold text-white">{profile?.name}</h3>
              <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Forensics Lead</span>
              </p>
            </div>

            {/* Profile Statistics counters */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Joined Case Hub:</span>
                <span className="font-semibold font-mono text-slate-300">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Today"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Last Login:</span>
                <span className="font-semibold font-mono text-slate-300">
                  {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : "Just now"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase mt-4">
            <span>Identity Auth Valid</span>
            <span className="text-emerald-400 font-bold">SECURE</span>
          </div>
        </div>

        {/* Right Card: Profile Configuration Form */}
        <div className={`p-4 sm:p-5 rounded-xl border md:col-span-2 space-y-4 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Profile Configuration</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none font-mono min-h-[44px] ${
                  darkMode ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-white border-gray-200 text-gray-950 focus:border-indigo-500"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Admin Email (Read-Only)</label>
              <input
                type="email"
                disabled
                value={profile?.email}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none bg-slate-950/20 border-slate-850 text-slate-500 cursor-not-allowed font-mono min-h-[44px]"
              />
            </div>

            {/* Avatar Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium block text-slate-300">Cognitive Avatar presets</label>
              <div className="flex gap-2.5 flex-wrap">
                {PRESET_AVATARS.map((avUrl) => {
                  const isSelected = avatar === avUrl;
                  return (
                    <button
                      key={avUrl}
                      type="button"
                      onClick={() => setAvatar(avUrl)}
                      className={`w-12 h-12 rounded-xl border transition-all cursor-pointer p-0.5 overflow-hidden ${
                        isSelected ? "border-indigo-500 ring-2 ring-indigo-500/50 bg-slate-950" : "border-slate-850 opacity-65 hover:opacity-100 bg-slate-900"
                      }`}
                    >
                      <img src={avUrl} alt="Avatar Preset" className="w-full h-full object-cover rounded-lg" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status updates */}
            {success && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-mono">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Administrative profile synchronized with Cloud Directory.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
            >
              {updating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Synchronize Profile</span>
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
