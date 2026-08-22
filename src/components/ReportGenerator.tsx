import React, { useState } from "react";
import { FileDown, Sparkles, Printer, CheckCircle, Award, ShieldAlert, TrendingUp, BookOpen } from "lucide-react";
import { DatasetAnalysis } from "../types";
import { jsPDF } from "jspdf";

interface ReportGeneratorProps {
  dataset: DatasetAnalysis;
  darkMode: boolean;
}

export default function ReportGenerator({ dataset, darkMode }: ReportGeneratorProps) {
  const [downloading, setDownloading] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handlePrintPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Colors
      const indigoColor = [79, 70, 229]; // RGB for #4f46e5
      const darkColor = [15, 23, 42]; // RGB for slate-900

      // Header Banner
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.rect(0, 0, 210, 35, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("AI Data Detective Analysis Report", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(`FILE NAME: ${dataset.fileName}  |  COMPILED ON: ${new Date(dataset.uploadTime).toLocaleDateString()}`, 15, 26);

      // Score block in header
      doc.setFillColor(indigoColor[0], indigoColor[1], indigoColor[2]);
      doc.rect(160, 8, 35, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("QUALITY SCORE", 163, 13);
      doc.setFontSize(14);
      doc.text(`${dataset.dataQualityScore}%`, 163, 22);

      let yPos = 48;

      // Section 1: Profiling
      doc.setTextColor(indigoColor[0], indigoColor[1], indigoColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("SECTION 1: DATASET QUALITY PROFILING", 15, yPos);
      
      // Draw a line
      yPos += 2;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, yPos, 195, yPos);
      yPos += 8;

      // KPI Grid
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TOTAL ROWS", 15, yPos);
      doc.text("TOTAL COLUMNS", 60, yPos);
      doc.text("DUPLICATE ROWS", 110, yPos);
      doc.text("PRIMARY KEY", 155, yPos);

      yPos += 5;
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${dataset.rowCount} records`, 15, yPos);
      doc.text(`${dataset.columnCount} columns`, 60, yPos);
      doc.text(`${dataset.duplicateCount} rows`, 110, yPos);
      doc.text(`${dataset.primaryKey || "Auto-detected"}`, 155, yPos);

      yPos += 15;

      // Section 2: AI Strategic Brief
      if (summary) {
        doc.setTextColor(indigoColor[0], indigoColor[1], indigoColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("SECTION 2: AI STRATEGIC BRIEF", 15, yPos);
        
        yPos += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;

        // Executive Summary Paragraph word wrap
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("EXECUTIVE SUMMARY:", 15, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        const splitSummary = doc.splitTextToSize(summary.executiveSummary, 180);
        doc.text(splitSummary, 15, yPos);
        yPos += splitSummary.length * 5 + 8;

        // Section 3: Findings & Correlations
        doc.setTextColor(indigoColor[0], indigoColor[1], indigoColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("SECTION 3: KEY FINDINGS & INSIGHTS", 15, yPos);
        
        yPos += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;

        doc.setTextColor(16, 185, 129); // emerald style
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("CORE DATA FINDINGS", 15, yPos);
        
        doc.setTextColor(245, 158, 11); // amber style
        doc.text("BUSINESS CORRELATIONS", 110, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);

        // Map split strings for listings
        const leftFindings = summary.keyFindings.slice(0, 3);
        const rightCorrelations = summary.correlations.slice(0, 3);

        let leftY = yPos;
        leftFindings.forEach((f, idx) => {
          const splitText = doc.splitTextToSize(`• ${f}`, 85);
          doc.text(splitText, 15, leftY);
          leftY += splitText.length * 4.5 + 2;
        });

        let rightY = yPos;
        rightCorrelations.forEach((c, idx) => {
          const splitText = doc.splitTextToSize(`• ${c}`, 85);
          doc.text(splitText, 110, rightY);
          rightY += splitText.length * 4.5 + 2;
        });

        yPos = Math.max(leftY, rightY) + 8;

        // Check if we need a page break before Recommendations
        if (yPos > 240) {
          doc.addPage();
          yPos = 25;
        }

        // Section 4: Recommendations
        doc.setTextColor(indigoColor[0], indigoColor[1], indigoColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("SECTION 4: ACTIONABLE RECOMMENDATIONS", 15, yPos);
        
        yPos += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);

        summary.recommendations.slice(0, 4).forEach((rec, idx) => {
          const splitRec = doc.splitTextToSize(`${idx + 1}. ${rec}`, 180);
          if (yPos > 270) {
            doc.addPage();
            yPos = 25;
          }
          doc.text(splitRec, 15, yPos);
          yPos += splitRec.length * 5 + 3;
        });
      } else {
        // No summary case
        yPos += 10;
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("Note: Full AI analysis was not generated for this session.", 15, yPos);
        yPos += 8;
        doc.text("Clean columns first or interact with the Cognitive Chat to compile custom briefs.", 15, yPos);
      }

      // Add Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 280, 195, 280);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("AI DATA DETECTIVE EXECUTIVE REPORT", 15, 285);
        doc.text(`Page ${i} of ${pageCount}`, 175, 285);
      }

      // Download the PDF file directly!
      doc.save(`${dataset.fileName.replace(/\.[^/.]+$/, "")}_Executive_Report.pdf`);

      setDownloading(false);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 2500);
    } catch (err) {
      console.error("PDF Export error:", err);
      setDownloading(false);
    }
  };

  const summary = dataset.aiSummary;

  return (
    <div className="space-y-4 py-2 max-w-5xl mx-auto printable-area">
      
      {/* Printable page styling injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Intro Header (No Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3 no-print">
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Case Report Compiler
          </h2>
          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Compile your dataset statistics, data quality logs, and AI cognitive insights into a print-ready executive PDF.
          </p>
        </div>

        <button
          onClick={handlePrintPDF}
          disabled={downloading}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
        >
          {downloading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Printer className="w-4 h-4" />
          )}
          <span>Save Executive Report (PDF)</span>
        </button>
      </div>

      {exportComplete && (
        <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs no-print font-mono">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Case report exported successfully. Print spool triggered.</span>
        </div>
      )}

      {/* The Printable Document Case Card */}
      <div className={`p-4 sm:p-6 md:p-8 rounded-xl border space-y-5 sm:space-y-6 shadow-xl ${
        darkMode ? "bg-slate-900/45 border-slate-800 text-slate-200" : "bg-white border-gray-200 text-gray-900"
      }`}>
        
        {/* Document Header block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-indigo-400">EXECUTIVE BRIEF</span>
            <h1 className="text-xl font-bold tracking-tight text-white">AI Data Detective Analysis</h1>
            <p className="text-xs text-slate-400">Dossier File: <strong className="text-slate-200 font-semibold font-mono">{dataset.fileName}</strong></p>
            <p className="text-[9px] text-slate-550 font-mono uppercase">COMPILED ON: {new Date(dataset.uploadTime).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3.5 rounded-lg">
            <div className="text-right">
              <span className="text-[8px] text-slate-500 font-mono block tracking-wider">QUALITY SCORE</span>
              <span className="text-xl font-black text-indigo-400 font-mono">{dataset.dataQualityScore}%</span>
            </div>
            <Award className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Section 1: Data Metrics & Audit Profile */}
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">SECTION 1: Dataset Quality Profiling</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-0.5">
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase">OBSERVED ROWS</div>
              <div className="text-xs font-bold font-mono mt-0.5 text-white">{dataset.rowCount} records</div>
            </div>
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase">DIMENSIONS</div>
              <div className="text-xs font-bold font-mono mt-0.5 text-white">{dataset.columnCount} columns</div>
            </div>
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase">DUPLICATED ROWS</div>
              <div className="text-xs font-bold font-mono mt-0.5 text-white">{dataset.duplicateCount} rows</div>
            </div>
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase">PRIMARY KEY</div>
              <div className="text-xs font-bold font-mono mt-0.5 truncate text-indigo-400">{dataset.primaryKey}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Executive Summaries (if generated) */}
        {summary ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">SECTION 2: AI Strategic Brief</h3>
              <div className={`p-3 rounded-lg border flex items-start gap-3 ${
                darkMode ? "bg-slate-950/40 border-slate-850" : "bg-indigo-50/20 border-indigo-50/10"
              }`}>
                <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-indigo-300">EXECUTIVE SUMMARY</h4>
                  <p className="text-xs leading-relaxed text-slate-300 font-mono">{summary.executiveSummary}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">SECTION 3: Core Insights & Findings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border space-y-2 ${darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"}`}>
                  <h5 className="text-[9px] font-mono uppercase font-bold text-emerald-400">KEY FINDINGS</h5>
                  <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300 font-mono">
                    {summary.keyFindings.slice(0, 3).map((f, idx) => <li key={idx}>{f}</li>)}
                  </ul>
                </div>

                <div className={`p-3 rounded-lg border space-y-2 ${darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"}`}>
                  <h5 className="text-[9px] font-mono uppercase font-bold text-amber-400">BUSINESS CORRELATIONS</h5>
                  <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300 font-mono">
                    {summary.correlations.slice(0, 3).map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">SECTION 4: Actionable Recommendations</h4>
              <div className="space-y-1.5">
                {summary.recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className={`p-2.5 rounded-md border flex items-start gap-2.5 text-xs ${
                    darkMode ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-150"
                  }`}>
                    <span className="p-0.5 bg-indigo-500/10 text-indigo-400 font-mono font-bold rounded text-[9px] min-w-[18px] text-center">{idx + 1}</span>
                    <span className="text-slate-300 leading-relaxed font-mono text-[11px]">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-8 bg-slate-950/50 rounded-lg border border-slate-850 space-y-1">
            <Sparkles className="w-5 h-5 text-indigo-400 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold text-white">Gemini Insights Not Generated</h4>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Please visit the "AI Insights" dashboard first to compile AI-derived business summaries and recommendations.</p>
          </div>
        )}

        {/* Security watermark footer */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-6 text-[8px] text-slate-500 font-mono uppercase">
          <span>AI Data Detective Brief &copy; 2026</span>
          <span>Security Tag: AES-256-AUTHENTICATED-brief</span>
        </div>

      </div>

    </div>
  );
}
