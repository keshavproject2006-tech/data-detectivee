import React, { useState } from "react";
import { deleteUser } from "firebase/auth";
import { auth } from "../firebase";
import { Settings, ShieldAlert, LogOut, Trash2, Check, RefreshCw, Volume2, Globe } from "lucide-react";

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
}

export default function SettingsView({ darkMode, setDarkMode, onLogout }: SettingsViewProps) {
  const [lang, setLang] = useState("en");
  const [notifWarning, setNotifWarning] = useState(true);
  const [notifAI, setNotifAI] = useState(true);
  
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to permanently delete your AI Data Detective account? This will erase all of your datasets, reports, configurations, and chat history. This action is irreversible.")) return;
    
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        alert("Your administrative credentials have been successfully expunged. Goodbye!");
        onLogout();
      }
    } catch (err: any) {
      console.error("Account expungement failed:", err);
      alert("Error: Re-authentication is required to perform secure account deletion. Please log out and sign back in, then retry.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSavePreferences = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="space-y-4 py-2 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="text-center md:text-left space-y-1 border-b border-slate-800 pb-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-1.5">
          <Settings className="w-5 h-5 text-indigo-500" />
          <span>Case Workspace Settings</span>
        </h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Tune system notification preferences, change system languages, or safely expunge admin credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Side: System Information & Status */}
        <div className={`p-4 sm:p-5 rounded-xl border space-y-3 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Workspace Status</span>
          </h3>

          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 font-mono">
              <span className="text-slate-500">System Build:</span>
              <span className="text-slate-300">v1.24.10-release</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 font-mono">
              <span className="text-slate-500">Firebase Region:</span>
              <span className="text-slate-300 font-mono">asia-southeast1</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-1 font-mono">
              <span className="text-slate-500">Security Standard:</span>
              <span className="text-emerald-400 font-bold">AES-256 Cloud</span>
            </div>
          </div>
        </div>

        {/* Right Side: Preferences Configuration */}
        <div className={`p-4 sm:p-5 rounded-xl border md:col-span-2 space-y-5 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Administrative Preferences</span>
          </h3>

          <div className="space-y-4">
            {/* Dark/Light Mode selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium block text-slate-300">Default Theme Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDarkMode(true)}
                  className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors min-h-[44px] ${
                    darkMode 
                      ? "bg-indigo-600/15 border-indigo-500 text-white font-bold" 
                      : "bg-transparent border-gray-200 text-gray-500"
                  }`}
                >
                  Dark Mode
                </button>
                <button
                  onClick={() => setDarkMode(false)}
                  className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors min-h-[44px] ${
                    !darkMode 
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-600 font-bold" 
                      : "bg-transparent border-slate-800 text-slate-400"
                  }`}
                >
                  Light Mode
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Workspace Translation Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none font-mono min-h-[44px] ${
                  darkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <option value="en">English (US)</option>
                <option value="es">Español (Castellano)</option>
                <option value="fr">Français (Europe)</option>
                <option value="jp">日本語 (Japanese)</option>
              </select>
            </div>

            {/* Notifications checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-medium block text-slate-300">Workspace Notifications</label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-850 bg-slate-950/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifWarning}
                  onChange={(e) => setNotifWarning(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 mt-0.5 w-4 h-4 bg-slate-950 flex-shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-300">Anomalies & Standard Deviation Warnings</span>
                  <p className="text-[11px] text-slate-500">Alert me when the statistical engine detects Z-scores &gt; 2.0.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-850 bg-slate-950/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifAI}
                  onChange={(e) => setNotifAI(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 mt-0.5 w-4 h-4 bg-slate-950 flex-shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-300">Gemini AI Insights Compilation Ready</span>
                  <p className="text-[11px] text-slate-500">Alert me when structural summaries are translated successfully.</p>
                </div>
              </label>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePreferences}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer min-h-[44px]"
              >
                <span>Save Case Preferences</span>
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Expunge Security Account</span>
              </button>
            </div>

            {success && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-mono">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Case workspace preferences updated successfully.</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
