import React, { useState } from "react";
import { Sparkles, Brain, CheckSquare, Target, TrendingUp, AlertTriangle, Lightbulb, BookOpen, Share2, Clipboard, ShieldCheck, Cpu } from "lucide-react";
import { DatasetAnalysis } from "../types";

interface InsightsViewProps {
  dataset: DatasetAnalysis;
  onAnalysisGenerated: (aiSummary: any) => void;
  darkMode: boolean;
}

export default function InsightsView({ dataset, onAnalysisGenerated, darkMode }: InsightsViewProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: dataset.fileName,
          rowCount: dataset.rowCount,
          columnCount: dataset.columnCount,
          columns: dataset.columns.map(c => ({
            name: c.name,
            type: c.type,
            missingCount: c.missingCount,
            uniqueCount: c.uniqueCount,
            mean: c.mean,
            stdDev: c.stdDev
          })),
          rawSample: dataset.rawSample,
          hasBeenCleaned: dataset.hasBeenCleaned
        })
      });

      if (!response.ok) {
        throw new Error("Analysis failed on server.");
      }

      const result = await response.json();
      onAnalysisGenerated(result);
    } catch (err) {
      console.error("Error generating insights:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!dataset.aiSummary) return;
    const text = `
DATASET ANALYSIS REPORT: ${dataset.aiSummary.dashboardTitle}
Description: ${dataset.aiSummary.datasetDescription}
Executive Summary: ${dataset.aiSummary.executiveSummary}
Key Findings: ${dataset.aiSummary.keyFindings.join(", ")}
Business Insights: ${dataset.aiSummary.businessInsights.join(", ")}
Recommendations: ${dataset.aiSummary.recommendations.join(", ")}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 200);
  };

  const summary = dataset.aiSummary;

  return (
    <div className="space-y-4 py-2 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          AI Cognitive Insights Engine
        </h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Leverage Google Gemini AI to compile executive-level corporate findings, trends, risk factors, and actionable KPIs.
        </p>
      </div>

      {!summary ? (
        /* Call to Action for AI Generation */
        <div className={`p-8 rounded-lg border text-center space-y-4 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="w-12 h-12 mx-auto bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/10 animate-pulse">
            <Brain className="w-5 h-5" />
          </div>

          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-white">Perform Forensic Data Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our advanced AI model will examine your columns, averages, standard deviations, and records to summarize correlations and trends in an executive business report.
            </p>
          </div>

          <button
            onClick={handleGenerateAnalysis}
            disabled={analyzing}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 cursor-pointer mx-auto disabled:opacity-50 min-h-[44px]"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Scanning columns and compiling case file...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Initialize Gemini AI Forensic Analysis</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Beautiful Bento grid showing AI findings */
        <div className="space-y-4">
          
          {/* Header Dashboard Title card */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950 border border-slate-800 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shadow-md">
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block">CASE REPORT</span>
              <h3 className="text-base sm:text-lg font-bold text-white">{summary.dashboardTitle}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{summary.datasetDescription}</p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
              <div className="text-left sm:text-right">
                <span className="text-[9px] text-slate-500 block font-mono uppercase tracking-wider">AI CONFIDENCE INDEX</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">{summary.confidenceScore}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Copy Report"
                >
                  {copied ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Executive Summary */}
            <div className={`p-4 rounded-lg border space-y-2 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-indigo-400 uppercase tracking-wider font-mono">
                <BookOpen className="w-4 h-4" />
                <span>Executive Summary</span>
              </h4>
              <p className="text-xs leading-relaxed text-slate-300 font-medium">
                {summary.executiveSummary}
              </p>
            </div>

            {/* Storytelling Narrative */}
            <div className={`p-4 rounded-lg border space-y-2 bg-gradient-to-b ${
              darkMode ? "from-slate-900/30 to-slate-900/60 border-slate-800" : "from-gray-50 to-white border-gray-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-purple-400 uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Forensic Data Storytelling</span>
              </h4>
              <p className="text-xs italic leading-relaxed text-slate-300">
                "{summary.storytelling}"
              </p>
            </div>

            {/* Key Findings List */}
            <div className={`p-4 rounded-lg border space-y-3 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-emerald-400 uppercase tracking-wider font-mono">
                <CheckSquare className="w-4 h-4" />
                <span>Key Findings</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {summary.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0 font-mono"></span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Correlations */}
            <div className={`p-4 rounded-lg border space-y-3 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-blue-400 uppercase tracking-wider font-mono">
                <Cpu className="w-4 h-4" />
                <span>Correlations & Features</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {summary.correlations.map((corr, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0 font-mono"></span>
                    <span>{corr}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business Insights */}
            <div className={`p-4 rounded-lg border space-y-3 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-amber-400 uppercase tracking-wider font-mono">
                <Lightbulb className="w-4 h-4" />
                <span>Strategic Business Insights</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {summary.businessInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0 font-mono"></span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Analysis */}
            <div className={`p-4 rounded-lg border space-y-3 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-red-400 uppercase tracking-wider font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>Audit Risk Identification</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {summary.riskAnalysis.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0 font-mono"></span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className={`p-4 rounded-lg border space-y-3 md:col-span-2 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-indigo-400 uppercase tracking-wider font-mono">
                <Target className="w-4 h-4" />
                <span>Actionable Strategic Recommendations</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summary.recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-3 rounded-lg flex items-start gap-2.5 border ${
                    darkMode ? "bg-slate-950/40 border-slate-800" : "bg-gray-50 border-gray-150"
                  }`}>
                    <div className="p-1 bg-indigo-500/10 rounded text-[10px] font-bold font-mono text-indigo-400">
                      {idx + 1}
                    </div>
                    <span className="text-xs text-slate-300 leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested KPIs & ML Models */}
            <div className={`p-4 rounded-lg border space-y-3 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-pink-400 uppercase tracking-wider font-mono">
                <TrendingUp className="w-4 h-4" />
                <span>Suggested KPIs to Track</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {summary.suggestedKPIs.map((kpi, idx) => (
                  <span key={idx} className="px-2 py-1 bg-pink-500/10 border border-pink-500/20 rounded text-[10px] text-pink-300 font-semibold font-mono">
                    {kpi}
                  </span>
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-lg border space-y-3 ${
              darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 text-indigo-400 uppercase tracking-wider font-mono">
                <Cpu className="w-4 h-4" />
                <span>Recommended ML Models</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {summary.mlModels.map((model, idx) => (
                  <span key={idx} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] text-indigo-300 font-semibold font-mono">
                    {model}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
