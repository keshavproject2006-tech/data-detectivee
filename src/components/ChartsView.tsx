import React, { useState, useMemo } from "react";
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  ScatterChart, Scatter, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieIcon, 
  LineChart as LineIcon, 
  TrendingUp, 
  RefreshCw, 
  Layers, 
  Filter, 
  LayoutGrid, 
  SlidersHorizontal,
  Table,
  Check,
  ChevronDown,
  Info
} from "lucide-react";
import { DatasetAnalysis } from "../types";

interface ChartsViewProps {
  dataset: DatasetAnalysis;
  darkMode: boolean;
}

const PALETTE = ["#4f46e5", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4"];

export default function ChartsView({ dataset, darkMode }: ChartsViewProps) {
  const columns = dataset.columns;
  const rawData = dataset.cleanedSample || dataset.rawSample || [];

  // 1. Identify Categorical and Numeric Columns
  const categoricalCols = useMemo(() => {
    return columns.filter(c => c.type === "categorical").map(c => c.name);
  }, [columns]);

  const numericCols = useMemo(() => {
    return columns.filter(c => c.type === "numeric").map(c => c.name);
  }, [columns]);

  // 2. Active Selection States (PowerBI Fields selection)
  const [activeXAxis, setActiveXAxis] = useState<string>(
    categoricalCols[0] || columns[0]?.name || ""
  );
  const [activeMetric, setActiveMetric] = useState<string>(
    numericCols[0] || columns[1]?.name || ""
  );
  const [aggFunction, setAggFunction] = useState<"sum" | "avg" | "max" | "min">("sum");

  // 3. Slicer Filter States (PowerBI Slicers)
  const [selectedSlicerCol, setSelectedSlicerCol] = useState<string>(
    categoricalCols[0] || ""
  );
  
  // Mobile UI States
  const [mobileChartTab, setMobileChartTab] = useState<"all" | "bar" | "trend" | "pie" | "scatter" | "table">("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Get unique values for the selected slicer column
  const slicerValues = useMemo(() => {
    if (!selectedSlicerCol || rawData.length === 0) return [];
    const vals = Array.from(new Set(rawData.map(row => String(row[selectedSlicerCol] ?? "Unknown"))));
    return vals.filter(v => v !== "" && v !== "null" && v !== "undefined").slice(0, 50); // limit to first 50 values for usability
  }, [selectedSlicerCol, rawData]);

  // Map of active filter selections for the slicer values
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});

  // Reset filter when slicer column changes
  const handleSlicerColChange = (newCol: string) => {
    setSelectedSlicerCol(newCol);
    setActiveFilters({});
  };

  // Toggle filter value
  const handleToggleFilter = (val: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [val]: !prev[val]
    }));
  };

  const handleSelectAllFilters = (selectAll: boolean) => {
    if (selectAll) {
      const all: Record<string, boolean> = {};
      slicerValues.forEach(val => {
        all[val] = true;
      });
      setActiveFilters(all);
    } else {
      setActiveFilters({});
    }
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return Object.values(activeFilters).some(v => v === true);
  }, [activeFilters]);

  // 4. Apply Filters to Dataset
  const filteredData = useMemo(() => {
    if (rawData.length === 0) return [];
    if (!selectedSlicerCol || !hasActiveFilters) return rawData;

    return rawData.filter(row => {
      const val = String(row[selectedSlicerCol] ?? "Unknown");
      return activeFilters[val] === true;
    });
  }, [rawData, selectedSlicerCol, activeFilters, hasActiveFilters]);

  // 5. Dynamic KPI Calculations
  const kpis = useMemo(() => {
    const totalRecords = filteredData.length;
    if (totalRecords === 0 || !activeMetric) {
      return { sum: 0, avg: 0, max: 0, min: 0 };
    }

    const values = filteredData.map(row => Number(row[activeMetric]) || 0);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / totalRecords;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      sum: parseFloat(sum.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      min: parseFloat(min.toFixed(2))
    };
  }, [filteredData, activeMetric]);

  // 6. Aggregated Data for Charts
  const chartData = useMemo(() => {
    if (filteredData.length === 0 || !activeXAxis || !activeMetric) return [];

    const groupMap: Record<string, { sum: number; count: number; max: number; min: number }> = {};

    filteredData.forEach(row => {
      const xVal = String(row[activeXAxis] ?? "Unknown");
      const yVal = Number(row[activeMetric] ?? 0);

      if (!groupMap[xVal]) {
        groupMap[xVal] = { sum: 0, count: 0, max: -Infinity, min: Infinity };
      }

      groupMap[xVal].sum += yVal;
      groupMap[xVal].count += 1;
      groupMap[xVal].max = Math.max(groupMap[xVal].max, yVal);
      groupMap[xVal].min = Math.min(groupMap[xVal].min, yVal);
    });

    return Object.keys(groupMap).map(key => {
      const group = groupMap[key];
      let value = 0;
      if (aggFunction === "sum") value = group.sum;
      else if (aggFunction === "avg") value = group.count > 0 ? group.sum / group.count : 0;
      else if (aggFunction === "max") value = group.max === -Infinity ? 0 : group.max;
      else if (aggFunction === "min") value = group.min === Infinity ? 0 : group.min;

      return {
        name: key,
        value: parseFloat(value.toFixed(2)),
        recordCount: group.count
      };
    }).sort((a, b) => b.value - a.value).slice(0, 10); // Show top 10 categories for clarity
  }, [filteredData, activeXAxis, activeMetric, aggFunction]);

  // 7. Scatter correlation data
  const scatterData = useMemo(() => {
    if (filteredData.length === 0 || numericCols.length < 2) return [];
    const xCol = numericCols[0];
    const yCol = numericCols[1] || numericCols[0];
    
    return filteredData.map((row, idx) => ({
      xVal: Number(row[xCol]) || 0,
      yVal: Number(row[yCol]) || 0,
      id: row[columns[0]?.name] || `Row ${idx + 1}`
    })).slice(0, 100); // Plot first 100 points
  }, [filteredData, numericCols, columns]);

  return (
    <div className="space-y-4 py-2 max-w-7xl mx-auto font-sans">
      
      {/* PowerBI Workspace Ribbon */}
      <div className={`p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 ${
        darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest font-bold text-yellow-500 uppercase bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
              PowerBI Analytics Workspace
            </span>
          </div>
          <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-indigo-500 flex-shrink-0" />
            <span>Interactive Analytics Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400">
            Slice and dice metrics, model categories, and examine cross-metric correlations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>{showMobileFilters ? "Hide Filters" : "Filter & Fields"}</span>
          </button>

          <div className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Quick Slicer Filter Pills (Horizontal Scroll on Mobile) */}
      {slicerValues.length > 0 && (
        <div className={`p-2.5 sm:p-3 rounded-xl border space-y-1.5 ${
          darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Filter: <strong className="text-indigo-400 font-mono">{selectedSlicerCol}</strong></span>
            </div>
            {hasActiveFilters && (
              <button 
                onClick={() => setActiveFilters({})}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none no-scrollbar">
            <button
              onClick={() => handleSelectAllFilters(!hasActiveFilters)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[34px] border ${
                !hasActiveFilters
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              All Items ({rawData.length})
            </button>
            {slicerValues.slice(0, 12).map((val) => {
              const isChecked = activeFilters[val] === true;
              return (
                <button
                  key={val}
                  onClick={() => handleToggleFilter(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[34px] border flex items-center gap-1.5 ${
                    isChecked
                      ? "bg-indigo-600/25 text-indigo-300 border-indigo-500 font-semibold"
                      : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span>{val}</span>
                  {isChecked && <Check className="w-3 h-3 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Chart Tab Selector */}
      <div className="flex sm:hidden overflow-x-auto gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 scrollbar-none">
        {[
          { id: "all", label: "All Views" },
          { id: "bar", label: "Categories" },
          { id: "trend", label: "Trends" },
          { id: "pie", label: "Shares" },
          { id: "scatter", label: "Scatter" },
          { id: "table", label: "Data Grid" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileChartTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-h-[36px] cursor-pointer ${
              mobileChartTab === tab.id
                ? "bg-indigo-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main PowerBI Multi-column Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Left Pane: Slicers & Fields Panel (PowerBI Styling) */}
        <div className={`lg:col-span-1 flex flex-col gap-4 ${showMobileFilters ? "block" : "hidden lg:flex"}`}>
          
          {/* 1. Slicers Panel */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">Slicers (Filters)</h3>
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="lg:hidden text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Slicer Column Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Filter By Column</label>
                <select
                  value={selectedSlicerCol}
                  onChange={(e) => handleSlicerColChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500 transition-all min-h-[44px]"
                >
                  <option value="">-- Select Field --</option>
                  {categoricalCols.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Slicer Values Checklist */}
              {selectedSlicerCol && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-400">Values ({slicerValues.length})</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSelectAllFilters(true)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer min-h-[30px] flex items-center"
                      >
                        ALL
                      </button>
                      <button 
                        onClick={() => handleSelectAllFilters(false)}
                        className="text-slate-500 hover:text-slate-400 font-bold cursor-pointer min-h-[30px] flex items-center"
                      >
                        NONE
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 border border-slate-850 rounded-lg p-2 bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-800">
                    {slicerValues.map(val => {
                      const isChecked = activeFilters[val] === true;
                      return (
                        <button
                          key={val}
                          onClick={() => handleToggleFilter(val)}
                          className={`w-full flex items-center justify-between p-2 rounded text-left text-xs font-mono transition-colors cursor-pointer min-h-[36px] ${
                            isChecked 
                              ? "bg-indigo-600/15 text-indigo-300 font-semibold" 
                              : "text-slate-400 hover:bg-slate-800/40"
                          }`}
                        >
                          <span className="truncate pr-2">{val}</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isChecked ? "bg-indigo-600 border-indigo-500" : "border-slate-800"
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <div className="pt-3 border-t border-slate-800 mt-3">
                <button
                  onClick={() => setActiveFilters({})}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer min-h-[40px]"
                >
                  Clear Slicer Filter
                </button>
              </div>
            )}
          </div>

          {/* 2. PowerBI Field Panel */}
          <div className={`p-4 rounded-xl border space-y-4 ${
            darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">Field Mapping</h3>
            </div>

            {/* X Axis select */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Axis (Legend Category)</label>
              <select
                value={activeXAxis}
                onChange={(e) => setActiveXAxis(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500 transition-all min-h-[44px]"
              >
                {categoricalCols.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Metric Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Values (Measure Metric)</label>
              <select
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500 transition-all min-h-[44px]"
              >
                {numericCols.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Aggregation Function */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Calculation Method</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                {(["sum", "avg", "max", "min"] as const).map(func => (
                  <button
                    key={func}
                    onClick={() => setAggFunction(func)}
                    className={`text-[10px] uppercase font-mono py-2 rounded font-bold transition-all cursor-pointer min-h-[36px] ${
                      aggFunction === func 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    {func}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Area: KPI Ribbons and Visual Tiles Stage */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* PowerBI Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              darkMode ? "bg-slate-900/30 border-slate-850" : "bg-white border-slate-200"
            }`}>
              <div className="text-[9px] text-slate-450 font-mono uppercase tracking-wider">Filtered Records count</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {filteredData.length.toLocaleString()} 
                <span className="text-[10px] text-slate-500 font-normal pl-1.5">/ {rawData.length} total</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border flex flex-col justify-between bg-indigo-500/5 border-indigo-500/10">
              <div className="text-[9px] text-indigo-400 font-mono uppercase tracking-wider">{aggFunction} of {activeMetric}</div>
              <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                {aggFunction === "sum" ? `$${kpis.sum.toLocaleString()}` : 
                 aggFunction === "avg" ? `$${kpis.avg.toLocaleString()}` : 
                 aggFunction === "max" ? `$${kpis.max.toLocaleString()}` : `$${kpis.min.toLocaleString()}`}
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              darkMode ? "bg-slate-900/30 border-slate-850" : "bg-white border-slate-200"
            }`}>
              <div className="text-[9px] text-slate-450 font-mono uppercase tracking-wider">Max Observation</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">${kpis.max.toLocaleString()}</div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              darkMode ? "bg-slate-900/30 border-slate-850" : "bg-white border-slate-200"
            }`}>
              <div className="text-[9px] text-slate-450 font-mono uppercase tracking-wider">Min Observation</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">${kpis.min.toLocaleString()}</div>
            </div>

          </div>

          {/* Tiles layout canvas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tile 1: Category Contribution (Bar Chart) */}
            {(mobileChartTab === "all" || mobileChartTab === "bar") && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Category metrics</span>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500">Top 10 buckets</span>
                </div>

                <div className="h-[230px] sm:h-[210px] w-full">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      No matching slicer data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: "rgba(99, 102, 241, 0.04)" }} 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "6px", color: "white", fontSize: "10px" }} 
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={22}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Tile 2: Metric Trend Progression (Area/Line Chart) */}
            {(mobileChartTab === "all" || mobileChartTab === "trend") && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Trend Progression</span>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500">Cumulative index</span>
                </div>

                <div className="h-[230px] sm:h-[210px] w-full">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      No matching slicer data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...chartData].reverse()} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "6px", color: "white", fontSize: "10px" }} />
                        <defs>
                          <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#curveColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Tile 3: Composition Share (Donut / Pie) */}
            {(mobileChartTab === "all" || mobileChartTab === "pie") && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-emerald-400" />
                    <span>Composition Breakdown</span>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500">Allocation</span>
                </div>

                <div className="h-[230px] sm:h-[210px] w-full">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      No matching slicer data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "6px", color: "white", fontSize: "10px" }} />
                        <Legend iconSize={5} iconType="circle" wrapperStyle={{ fontSize: "8px", color: "#9ca3af" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Tile 4: Numeric correlation scatter plot */}
            {(mobileChartTab === "all" || mobileChartTab === "scatter") && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-pink-400" />
                    <span>Correlation Scatter</span>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500">Distribution Cluster</span>
                </div>

                <div className="h-[230px] sm:h-[210px] w-full">
                  {scatterData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      Insufficient numeric columns
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid stroke="#1e293b" />
                        <XAxis type="number" dataKey="xVal" name={numericCols[0]} stroke="#475569" fontSize={8} />
                        <YAxis type="number" dataKey="yVal" name={numericCols[1] || numericCols[0]} stroke="#475569" fontSize={8} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "6px", color: "white", fontSize: "10px" }} />
                        <Scatter name="Records" data={scatterData} fill="#ec4899" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Slicer-Filtered Data Grid Table view (PowerBI Data view tab style) */}
          {(mobileChartTab === "all" || mobileChartTab === "table") && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-indigo-400" />
                  <span>Active Sliced Data Grid View</span>
                </h4>
                <span className="text-[9px] font-mono text-slate-400">Showing first 5 matching records</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-mono uppercase">
                      <th className="px-3 py-2 border-b border-slate-800">Row ID</th>
                      {columns.slice(0, 5).map(col => (
                        <th key={col.name} className="px-3 py-2 border-b border-slate-800">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300 font-mono">
                    {filteredData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="px-3 py-1.5 text-slate-500">#{idx + 1}</td>
                        {columns.slice(0, 5).map(col => (
                          <td key={col.name} className="px-3 py-1.5 truncate max-w-[150px]">
                            {String(row[col.name] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                          No active rows matching the slicer parameters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
