import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, OperationType, handleFirestoreError } from "./firebase";
import { UserProfile, DatasetAnalysis } from "./types";

// Component imports
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import DatasetUpload from "./components/DatasetUpload";
import CleanView from "./components/CleanView";
import ChartsView from "./components/ChartsView";
import AnomaliesView from "./components/AnomaliesView";
import ChatView from "./components/ChatView";
import ReportGenerator from "./components/ReportGenerator";
import HistoryView from "./components/HistoryView";
import ProfileView from "./components/ProfileView";
import SettingsView from "./components/SettingsView";
import BottomNav from "./components/BottomNav";

// Icons
import { 
  Database, 
  Sparkles, 
  ArrowRight, 
  BarChart3, 
  AlertOctagon, 
  FileDown, 
  MessageSquareCode, 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  History
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Navigation & Sizing
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Active dataset analytic context
  const [activeDataset, setActiveDataset] = useState<DatasetAnalysis | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthLoading(true);
      if (fbUser) {
        setUser(fbUser);
        
        // Fetch or initialize Firestore user profile
        try {
          const docRef = doc(db, "users", fbUser.uid);
          let docSnap;
          try {
            docSnap = await getDoc(docRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
            return;
          }
          
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || "Data Detective",
              email: fbUser.email || "",
              photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              createdAt: Date.now(),
              lastLogin: Date.now(),
              totalUploads: 0,
              totalReports: 0
            };
            try {
              await setDoc(docRef, initialProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
              return;
            }
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setActiveDataset(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleUploadComplete = async (dataset: DatasetAnalysis) => {
    setActiveDataset(dataset);
    setActiveTab("dashboard");

    // Save initial dataset analysis report back to Firestore securely for user specific history
    if (user?.uid) {
      try {
        try {
          await setDoc(doc(db, "analyses", dataset.id), dataset);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `analyses/${dataset.id}`);
        }
        
        // Increment user uploads count
        const docRef = doc(db, "users", user.uid);
        let profileSnap;
        try {
          profileSnap = await getDoc(docRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          return;
        }
        if (profileSnap.exists()) {
          const curr = profileSnap.data();
          try {
            await setDoc(docRef, { totalUploads: (curr.totalUploads || 0) + 1 }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
          setUserProfile(prev => prev ? { ...prev, totalUploads: (prev.totalUploads || 0) + 1 } : null);
        }
      } catch (err) {
        console.error("Failed to save initial analysis to Firestore:", err);
      }
    }
  };

  const handleCleanComplete = async (cleanedDataset: DatasetAnalysis) => {
    setActiveDataset(cleanedDataset);
    if (user?.uid) {
      try {
        try {
          await setDoc(doc(db, "analyses", cleanedDataset.id), cleanedDataset);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `analyses/${cleanedDataset.id}`);
        }
      } catch (err) {
        console.error("Failed to save cleaned analysis back to Firestore:", err);
      }
    }
  };

  const handleAnalysisGenerated = async (aiSummaryResult: any) => {
    if (!activeDataset) return;
    
    const updatedDataset: DatasetAnalysis = {
      ...activeDataset,
      aiSummary: aiSummaryResult
    };

    setActiveDataset(updatedDataset);
    
    // Save generated aiBrief report back to Firestore
    if (user?.uid) {
      try {
        try {
          await setDoc(doc(db, "analyses", updatedDataset.id), updatedDataset);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `analyses/${updatedDataset.id}`);
        }
        
        // Increment user reports generated count
        const docRef = doc(db, "users", user.uid);
        let profileSnap;
        try {
          profileSnap = await getDoc(docRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          return;
        }
        if (profileSnap.exists()) {
          const curr = profileSnap.data();
          try {
            await setDoc(docRef, { totalReports: (curr.totalReports || 0) + 1 }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
          setUserProfile(prev => prev ? { ...prev, totalReports: (prev.totalReports || 0) + 1 } : null);
        }
      } catch (err) {
        console.error("Failed to update Firestore analysis with AI Brief:", err);
      }
    }
  };

  const handleSelectHistoryDataset = (dataset: DatasetAnalysis) => {
    setActiveDataset(dataset);
    setActiveTab("dashboard");
  };

  // If Auth states are still fetching, show clean fullscreen loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col justify-center items-center font-sans">
        <div className="relative w-10 h-10 mb-4">
          <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-semibold">Synchronizing Cognitive Core...</p>
      </div>
    );
  }

  // Secure Protected Auth Gate Screen
  if (!user) {
    return (
      <AuthScreen 
        onAuthSuccess={(fbUser) => setUser(fbUser)} 
        darkMode={darkMode} 
      />
    );
  }

  // Main UI dashboard View Renderer
  const renderTabContent = () => {
    if (activeTab === "upload") {
      return (
        <DatasetUpload 
          onUploadComplete={handleUploadComplete} 
          userId={user.uid} 
          darkMode={darkMode} 
        />
      );
    }

    if (activeTab === "history") {
      return (
        <HistoryView 
          userId={user.uid} 
          onSelectDataset={handleSelectHistoryDataset} 
          darkMode={darkMode} 
        />
      );
    }

    if (activeTab === "profile") {
      return (
        <ProfileView 
          user={user} 
          darkMode={darkMode} 
        />
      );
    }

    if (activeTab === "settings") {
      return (
        <SettingsView 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          onLogout={handleLogout} 
        />
      );
    }

    // Protection gate: All subsequent analytical tabs require a loaded active dataset!
    if (!activeDataset) {
      return (
        <div className="max-w-lg mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Active Case Dossier</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              To review metrics, dynamic charts, forecasting intervals, or chat with AI, you must upload a dataset or launch the sales demo.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("upload")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer mx-auto animate-fade-in"
          >
            <span>Launch Upload Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Render tab once dataset is confirmed loaded
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 py-4 max-w-5xl mx-auto">
            {/* Case Dashboard Title block */}
            <div className="text-center md:text-left space-y-1.5 border-b border-slate-800 pb-4">
              <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block">Active Case Dossier</span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {activeDataset.aiSummary?.dashboardTitle || `Case: ${activeDataset.fileName}`}
              </h2>
              <p className="text-xs text-slate-400">{activeDataset.aiSummary?.datasetDescription || `Statistical analysis dashboard loaded on the client cluster.`}</p>
            </div>

            {/* Statistics grid row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">OBSERVED ROWS</div>
                <div className="text-lg font-bold font-mono mt-0.5 text-white">{activeDataset.rowCount.toLocaleString()}</div>
              </div>

              <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">DIMENSIONS</div>
                <div className="text-lg font-bold font-mono mt-0.5 text-white">{activeDataset.columnCount} cols</div>
              </div>

              <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">DATA QUALITY</div>
                <div className={`text-lg font-bold font-mono mt-0.5 ${activeDataset.dataQualityScore > 80 ? "text-emerald-400" : "text-amber-400"}`}>
                  {activeDataset.dataQualityScore}%
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">CLEAN STATS</div>
                <div className="text-xs font-bold uppercase font-mono tracking-wider mt-1.5 text-indigo-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{activeDataset.hasBeenCleaned ? "Optimized" : "Pending Clean"}</span>
                </div>
              </div>

            </div>

            {/* Quick Actions Panel & Gemini plain text summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Left Column: Gemini Summary text */}
              <div className={`p-5 rounded-lg border md:col-span-2 space-y-3.5 ${
                darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <h4 className="text-xs font-bold flex items-center gap-2 text-indigo-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>AI Cognitive Case Summary</span>
                </h4>
                
                <p className="text-xs leading-relaxed text-slate-300 font-medium">
                  {activeDataset.aiSummary?.plainEnglishExplanation || (
                    "Welcome to your active analytical case dossier. Head over to the 'AI Cleaner' tab to optimize your dataset columns, or 'PowerBI Analytics' on the sidebar to slice metrics and review dynamic charts."
                  )}
                </p>

                {activeDataset.aiSummary?.storytelling && (
                  <div className="pt-3.5 border-t border-slate-800 space-y-1">
                    <h5 className="text-[9px] font-mono uppercase text-purple-400 font-semibold tracking-wider">Data Storytelling Excerpt</h5>
                    <p className="text-xs text-slate-400 italic">"{activeDataset.aiSummary.storytelling}"</p>
                  </div>
                )}
              </div>

              {/* Right Column: Case Navigation Panel */}
              <div className={`p-5 rounded-lg border flex flex-col justify-between ${
                darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="space-y-3.5">
                  <h4 className="text-[9px] font-bold font-mono uppercase tracking-widest text-indigo-400">CASE CONTROL DESK</h4>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab("clean")}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex justify-between items-center transition-colors ${
                        darkMode ? "bg-slate-950/50 border-slate-800 hover:border-indigo-500/35" : "bg-slate-50 border-slate-150 hover:border-indigo-500/35"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>AI Cleaner Tool</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveTab("charts")}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex justify-between items-center transition-colors ${
                        darkMode ? "bg-slate-950/50 border-slate-800 hover:border-indigo-500/35" : "bg-slate-50 border-slate-150 hover:border-indigo-500/35"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        <span>PowerBI Analytics Desk</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveTab("anomalies")}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex justify-between items-center transition-colors ${
                        darkMode ? "bg-slate-950/50 border-slate-800 hover:border-indigo-500/35" : "bg-slate-50 border-slate-150 hover:border-indigo-500/35"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-red-400" />
                        <span>Anomaly Log Scan</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!activeDataset.hasBeenCleaned && (
                  <div className="pt-3.5 border-t border-slate-800 mt-4">
                    <button
                      onClick={() => setActiveTab("clean")}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>1-Click Forensic Clean</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );

      case "clean":
        return (
          <CleanView 
            dataset={activeDataset} 
            onCleanComplete={handleCleanComplete} 
            darkMode={darkMode} 
          />
        );

      case "charts":
        return (
          <ChartsView 
            dataset={activeDataset} 
            darkMode={darkMode} 
          />
        );

      case "anomalies":
        return (
          <AnomaliesView 
            dataset={activeDataset} 
            darkMode={darkMode} 
          />
        );

      case "chat":
        return (
          <ChatView 
            dataset={activeDataset} 
            darkMode={darkMode} 
          />
        );

      case "report":
        return (
          <ReportGenerator 
            dataset={activeDataset} 
            darkMode={darkMode} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-[#05050A] text-slate-100" : "bg-white text-slate-900"} font-sans transition-colors`}>
      {/* Navigation Sidebar component */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout} 
      />

      {/* Primary Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Navbar 
          userProfile={userProfile} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          activeDataset={activeDataset} 
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsMobileOpen(false);
          }}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />
        
        {/* Dynamic content stage */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-6 pb-24 md:pb-6 scrollbar-thin scrollbar-thumb-slate-850">
          {renderTabContent()}
        </main>

        {/* Mobile-first bottom quick navigation */}
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeDataset={activeDataset} 
          onLogout={handleLogout} 
        />
      </div>
    </div>
  );
}
