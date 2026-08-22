import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { History, Search, Star, Share2, Trash2, Calendar, FileText, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { DatasetAnalysis } from "../types";

interface HistoryViewProps {
  userId: string;
  onSelectDataset: (dataset: DatasetAnalysis) => void;
  darkMode: boolean;
}

export default function HistoryView({ userId, onSelectDataset, darkMode }: HistoryViewProps) {
  const [historyList, setHistoryList] = useState<DatasetAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", userId),
        orderBy("uploadTime", "desc")
      );
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "analyses");
        return;
      }
      const list: DatasetAnalysis[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DatasetAnalysis);
      });
      setHistoryList(list);
    } catch (err) {
      console.error("Error loading analysis history from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const handleToggleFavorite = async (e: React.MouseEvent, item: DatasetAnalysis) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, "analyses", item.id);
      const newFavoriteState = !item.isFavorite;
      try {
        await updateDoc(docRef, { isFavorite: newFavoriteState });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `analyses/${item.id}`);
      }
      setHistoryList(prev => prev.map(h => h.id === item.id ? { ...h, isFavorite: newFavoriteState } : h));
    } catch (err) {
      console.error("Failed to update favorite tag:", err);
    }
  };

  const handleToggleShared = async (e: React.MouseEvent, item: DatasetAnalysis) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, "analyses", item.id);
      const newSharedState = !item.isShared;
      try {
        await updateDoc(docRef, { isShared: newSharedState });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `analyses/${item.id}`);
      }
      setHistoryList(prev => prev.map(h => h.id === item.id ? { ...h, isShared: newSharedState } : h));
    } catch (err) {
      console.error("Failed to update shared state:", err);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this forensic analysis record? This cannot be undone.")) return;
    try {
      try {
        await deleteDoc(doc(db, "analyses", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `analyses/${id}`);
      }
      setHistoryList(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Failed to delete case record:", err);
    }
  };

  // Filter list based on search query
  const filteredList = historyList.filter(item => {
    return item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.aiSummary?.dashboardTitle || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4 py-2 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            <History className="w-5 h-5 text-indigo-500" />
            <span>Forensic Case History</span>
          </h2>
          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Securely saved and tracked analysis files located in your Google Firestore database cluster.
          </p>
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files or reports..."
            className={`w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border outline-none font-mono min-h-[44px] ${
              darkMode 
                ? "bg-slate-950 border-slate-850 focus:border-indigo-500 text-white" 
                : "bg-white border-gray-200 focus:border-indigo-500 text-gray-950"
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-mono tracking-wider">
          <RefreshCw className="w-6 h-6 mx-auto stroke-1 animate-spin text-slate-500 mb-2" />
          <span>Synchronizing cloud files...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl border-slate-800 bg-slate-950/20">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">No cases recorded yet</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 px-4">Upload a dataset or load the demo dataset to initiate cloud persistence.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectDataset(item)}
              className={`p-4 rounded-xl border flex flex-col justify-between min-h-[190px] cursor-pointer transition-all hover:border-indigo-500/55 hover:shadow-lg relative group ${
                darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
              }`}
            >
              
              {/* Card top */}
              <div>
                <div className="flex justify-between items-start gap-2 sm:gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[9px] text-indigo-400 font-mono block">FILE DETECTED</span>
                    <h3 className="text-sm font-bold truncate text-white">{item.fileName}</h3>
                    <p className="text-xs text-slate-400 font-medium font-mono">
                      {item.rowCount.toLocaleString()} rows &bull; {item.columnCount} cols
                    </p>
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(e, item)}
                      className={`p-2 rounded-lg border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer ${
                        item.isFavorite 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                          : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400"
                      }`}
                      title={item.isFavorite ? "Remove favorite" : "Mark as favorite"}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => handleToggleShared(e, item)}
                      className={`p-2 rounded-lg border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer ${
                        item.isShared 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400"
                      }`}
                      title={item.isShared ? "Unshare case" : "Share case"}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      className="p-2 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                      title="Delete case file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle / Title summary */}
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-indigo-400 truncate">
                    {item.aiSummary?.dashboardTitle || "No brief generated yet"}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.aiSummary?.datasetDescription || "Statistical summaries waiting generation."}
                  </p>
                </div>
              </div>

              {/* Card bottom */}
              <div className="flex justify-between items-center border-t border-slate-800 pt-2.5 mt-3 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{new Date(item.uploadTime).toLocaleDateString()}</span>
                </span>
                
                <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Explore Case</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
