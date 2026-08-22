import React, { useState } from "react";
import { Sun, Moon, Bell, Info, ShieldCheck, Database, Check, Menu } from "lucide-react";
import { UserProfile, DatasetAnalysis } from "../types";

interface NavbarProps {
  userProfile: UserProfile | null;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeDataset: DatasetAnalysis | null;
  onNavigate: (tab: string) => void;
  onOpenMobileMenu?: () => void;
}

export default function Navbar({ 
  userProfile, 
  darkMode, 
  setDarkMode, 
  activeDataset, 
  onNavigate,
  onOpenMobileMenu 
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "AI Detective successfully provisioned.", read: false, time: "Just now" },
    { id: 2, text: "Google Firebase cognitive database connected.", read: true, time: "5m ago" },
    { id: 3, text: "Try loading the 'Sample Sales Dataset' to run analytics instantly.", read: false, time: "1h ago" }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0A0A12]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between text-slate-200 relative z-30">
      {/* Left side: Mobile Menu Toggle + Active Case Status */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onOpenMobileMenu}
          className="flex md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] items-center justify-center flex-shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {activeDataset ? (
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/50 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg min-w-0">
            <Database className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
              <strong className="text-white font-semibold">{activeDataset.fileName}</strong>
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-400 font-mono flex-shrink-0">
              {activeDataset.rowCount.toLocaleString()} rows
            </span>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate("upload")}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all text-left cursor-pointer min-h-[44px] min-w-0"
          >
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate">
              No Dataset. <strong className="underline font-semibold text-white">Upload</strong>
            </span>
          </button>
        )}
      </div>

      {/* Right side: Actions & User Info */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        
        {/* Connection status indicator */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-slate-400">AI Engine Online</span>
        </div>

        {/* Generate Report quick action */}
        {activeDataset && (
          <button 
            onClick={() => onNavigate("report")}
            className="px-2.5 sm:px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors font-medium cursor-pointer min-h-[44px] flex items-center justify-center font-mono"
          >
            <span className="hidden sm:inline">Generate PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        )}

        {/* Toggle Theme */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#0A0A12]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-lg bg-[#0A0A12] border border-slate-800 shadow-2xl p-4 text-sm z-50">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 mb-2">
                <span className="font-semibold text-white">System Logs</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-2.5 rounded transition-colors ${n.read ? "text-slate-400" : "bg-indigo-500/5 text-slate-200 border-l-2 border-indigo-500"}`}>
                    <div className="text-xs leading-relaxed">{n.text}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info Block */}
        <div className="flex items-center space-x-2 sm:space-x-3 pl-1.5 sm:pl-2 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{userProfile?.name || "Detective"}</div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-end space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate("profile")}
            className="w-8 h-8 rounded-full ring-2 ring-indigo-500/20 hover:ring-indigo-500/50 transition-all overflow-hidden cursor-pointer bg-slate-800 flex items-center justify-center text-white font-bold flex-shrink-0"
            title="User Profile"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span>{(userProfile?.name || "D")[0].toUpperCase()}</span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}

