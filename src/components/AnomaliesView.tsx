import React, { useMemo } from "react";
import { AlertOctagon, ShieldCheck, Database, Search, AlertCircle, TrendingDown, HelpCircle, CheckCircle2 } from "lucide-react";
import { DatasetAnalysis, AnomalyItem } from "../types";

interface AnomaliesViewProps {
  dataset: DatasetAnalysis;
  darkMode: boolean;
}

export default function AnomaliesView({ dataset, darkMode }: AnomaliesViewProps) {
  const sampleData = dataset.cleanedSample || dataset.rawSample;

  // Compute Rule-based anomalies client-side if Gemini hasn't generated any
  const computedAnomalies = useMemo<AnomalyItem[]>(() => {
    if (dataset.anomalies && dataset.anomalies.length > 0) {
      // Return Gemini generated anomalies if available
      return dataset.anomalies.map((anom: any, idx: number) => ({
        rowIndex: anom.rowIndex || idx,
        columnName: anom.columnName || "N/A",
        value: anom.value || "N/A",
        reason: anom.reason || "Outlier identified by cognitive scanner.",
        severity: (anom.severity as 'high' | 'medium' | 'low') || 'medium'
      }));
    }

    const anomaliesList: AnomalyItem[] = [];

    // 1. Scan for duplicates
    const seen = new Set();
    dataset.rawSample.forEach((row, idx) => {
      const str = JSON.stringify(row);
      if (seen.has(str)) {
        anomaliesList.push({
          rowIndex: idx + 1,
          columnName: "Row Hash",
          value: row[Object.keys(row)[0]] || "Duplicate",
          reason: "Identical Row Duplicate found. Distorts statistics and models.",
          severity: "medium"
        });
      } else {
        seen.add(str);
      }
    });

    // 2. Scan for missing / null values
    dataset.rawSample.forEach((row, idx) => {
      Object.keys(row).forEach(key => {
        if (row[key] === null || row[key] === undefined || row[key] === "") {
          anomaliesList.push({
            rowIndex: idx + 1,
            columnName: key,
            value: "NULL",
            reason: "Missing value detected in critical observation path.",
            severity: "medium"
          });
        }
      });
    });

    // 3. Scan for numeric outliers (Z-score check > 2.0 stdDev)
    dataset.columns.forEach(col => {
      if (col.type === "numeric" && col.mean !== undefined && col.stdDev !== undefined && col.stdDev > 0) {
        const mean = col.mean;
        const stdDev = col.stdDev;
        
        dataset.rawSample.forEach((row, idx) => {
          const val = Number(row[col.name]);
          if (!isNaN(val)) {
            const zScore = Math.abs((val - mean) / stdDev);
            if (zScore > 2.0) {
              anomaliesList.push({
                rowIndex: idx + 1,
                columnName: col.name,
                value: val,
                reason: `Extreme numerical outlier. Z-Score = ${zScore.toFixed(2)} (> 2.0 standard deviations from average).`,
                severity: zScore > 3.0 ? "high" : "low"
              });
            }
          }
        });
      }
    });

    return anomaliesList.slice(0, 15); // limit top 15 anomalies
  }, [dataset]);

  return (
    <div className="space-y-4 py-2 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          Anomaly & Outlier Forensics
        </h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Cognitive outlier scans examine distribution ranges, identify duplicated customers, empty cells, and flag transactional irregularities.
        </p>
      </div>

      {/* Alert Header Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className={`p-4 rounded-lg border flex items-center gap-3.5 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider">SCANNED OBSERVATIONS</div>
            <div className="text-sm font-bold font-mono text-white">{sampleData.length} records</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border flex items-center gap-3.5 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider">POTENTIAL OUTLIERS</div>
            <div className="text-sm font-bold font-mono text-amber-400">{computedAnomalies.length} cases</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border flex items-center gap-3.5 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider">CLEANING STATE</div>
            <div className="text-xs font-bold uppercase font-mono tracking-wider text-emerald-400 mt-0.5">
              {dataset.hasBeenCleaned ? "OPTIMIZED" : "PENDING CLEAN"}
            </div>
          </div>
        </div>

      </div>

      {/* Anomaly Table */}
      <div className={`p-4 rounded-lg border space-y-3 ${
        darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
      }`}>
        <div className="space-y-0.5 border-b border-slate-800 pb-3">
          <div className="text-xs font-bold flex items-center gap-1.5 text-white uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Forensic Outliers Log</span>
          </div>
          <p className="text-[10px] text-slate-405">Reviewing cases flagged based on statistical standard deviations or Gemini's cognitive scanner.</p>
        </div>

        {computedAnomalies.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 stroke-1" />
            <span className="text-xs font-mono">No critical anomalies or outliers found in this dataset. Excellent quality!</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={darkMode ? "bg-slate-950 text-slate-300" : "bg-gray-50"}>
                  <th className="px-3 py-2 text-[10px] font-mono font-semibold border-b border-slate-800">Row Index</th>
                  <th className="px-3 py-2 text-[10px] font-mono font-semibold border-b border-slate-800">Column Name</th>
                  <th className="px-3 py-2 text-[10px] font-mono font-semibold border-b border-slate-800">Flagged Value</th>
                  <th className="px-3 py-2 text-[10px] font-mono font-semibold border-b border-slate-800">Severity</th>
                  <th className="px-3 py-2 text-[10px] font-mono font-semibold border-b border-slate-800">Forensic Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {computedAnomalies.map((anom, idx) => (
                  <tr key={idx} className="hover:bg-red-500/5 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-400">{anom.rowIndex}</td>
                    <td className="px-3 py-2.5 font-semibold font-mono text-indigo-400">{anom.columnName}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10.5px] font-bold text-white bg-slate-950 border border-slate-850">
                        {String(anom.value)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] uppercase font-mono tracking-wider font-bold ${
                        anom.severity === "high" 
                          ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                          : anom.severity === "medium"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                      }`}>
                        {anom.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 leading-relaxed text-slate-300 max-w-[280px] text-[11px] font-mono">{anom.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
