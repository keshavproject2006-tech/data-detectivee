import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Sparkles, 
  MessageSquareCode, 
  MoreHorizontal, 
  AlertOctagon, 
  FileDown, 
  History, 
  User, 
  Settings,
  LogOut,
  X
} from "lucide-react";
import { DatasetAnalysis } from "../types";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeDataset: DatasetAnalysis | null;
  onLogout: () => void;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  activeDataset,
  onLogout
}: BottomNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "charts", label: "Charts", icon: BarChart3, requiresDataset: true },
    { id: "clean", label: "Clean", icon: Sparkles, requiresDataset: true },
    { id: "chat", label: "AI Chat", icon: MessageSquareCode, requiresDataset: true },
  ];

  const moreItems = [
    { id: "anomalies", label: "Anomaly Scanner", icon: AlertOctagon, desc: "Outliers & data issues", requiresDataset: true },
    { id: "report", label: "Export PDF Report", icon: FileDown, desc: "Executive data summary", requiresDataset: true },
    { id: "history", label: "Analysis History", icon: History, desc: "Previous saved sessions", requiresDataset: false },
    { id: "profile", label: "User Profile", icon: User, desc: "Account details & credits", requiresDataset: false },
    { id: "settings", label: "Settings", icon: Settings, desc: "Theme & app preferences", requiresDataset: false },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  const isMoreTabActive = moreItems.some(item => item.id === activeTab);

  return (
    <>
      {/* More Options Sheet (Bottom Drawer Modal) */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-x-0 bottom-0 bg-[#0A0A12] border-t border-slate-800 rounded-t-2xl p-4 shadow-2xl z-50 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <h3 className="text-sm font-bold text-white tracking-wide">More Tools & Navigation</h3>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 py-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isDisabled = item.requiresDataset && !activeDataset;

                return (
                  <button
                    key={item.id}
                    disabled={isDisabled}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      isActive
                        ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-300"
                        : isDisabled
                          ? "opacity-40 border-slate-900 bg-slate-950/40 cursor-not-allowed text-slate-500"
                          : "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800/80 text-slate-400"}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>

                    {isDisabled && (
                      <span className="text-[9px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Requires Data</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold min-h-[48px] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Bottom Navigation Bar for Mobile View */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0A0A12]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.requiresDataset && !activeDataset;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isDisabled) {
                    setActiveTab("upload");
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-h-[48px] min-w-[56px] ${
                  isActive 
                    ? "text-indigo-400 font-semibold" 
                    : isDisabled 
                      ? "text-slate-500 opacity-60" 
                      : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"></span>
                )}
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-indigo-400" : ""}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-h-[48px] min-w-[56px] ${
              isMoreTabActive || showMoreMenu 
                ? "text-indigo-400 font-semibold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {(isMoreTabActive || showMoreMenu) && (
              <span className="absolute -top-1 w-6 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"></span>
            )}
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
