import React from "react";
import { 
  Brain, 
  LayoutDashboard, 
  Upload, 
  Sparkles, 
  BarChart3, 
  AlertOctagon, 
  MessageSquareCode, 
  FileDown, 
  History, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen,
  setIsMobileOpen,
  onLogout 
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "upload", label: "Upload Dataset", icon: Upload },
    { id: "clean", label: "AI Cleaner", icon: Sparkles },
    { id: "charts", label: "PowerBI Analytics", icon: BarChart3 },
    { id: "anomalies", label: "Anomaly Scan", icon: AlertOctagon },
    { id: "chat", label: "Cognitive Chat", icon: MessageSquareCode },
    { id: "report", label: "Report Generator", icon: FileDown },
    { id: "history", label: "Analysis History", icon: History },
    { id: "profile", label: "User Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false); // Auto close mobile drawer on tab tap
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-[#0A0A12] text-slate-300 transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-60"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="transition-all duration-300">
                <span className="font-bold text-base tracking-tight text-white block truncate">
                  DataDetective
                </span>
                <span className="text-[9px] font-mono tracking-wider text-indigo-400 block">COGNITIVE HUB</span>
              </div>
            )}
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer min-h-[44px] min-w-[44px] items-center justify-center"
            title="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="flex md:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer min-h-[44px] min-w-[44px] items-center justify-center"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer min-h-[44px] ${
                  isActive 
                    ? "bg-indigo-600/15 text-indigo-400 font-semibold border-l-2 border-indigo-500" 
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                }`} />
                {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}

                {/* Tooltip for collapsed mode on desktop */}
                {isCollapsed && !isMobileOpen && (
                  <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left z-50 bg-[#0A0A12] text-white text-xs px-2.5 py-1.5 rounded-md border border-slate-800 shadow-xl font-medium whitespace-nowrap pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile / Logout action */}
        <div className="p-3 border-t border-slate-800 bg-[#05050A]/40">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer group relative min-h-[44px]"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
            {isCollapsed && !isMobileOpen && (
              <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left z-50 bg-[#0A0A12] text-red-300 text-xs px-2.5 py-1.5 rounded-md border border-red-500/20 shadow-xl font-medium whitespace-nowrap pointer-events-none">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

