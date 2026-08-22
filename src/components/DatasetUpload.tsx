import React, { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Database, FileText, CheckCircle2, AlertTriangle, Sparkles, Search, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { DatasetAnalysis, ColumnMetric } from "../types";

interface DatasetUploadProps {
  onUploadComplete: (analysis: DatasetAnalysis) => void;
  userId: string;
  darkMode: boolean;
}

// Full comprehensive sample dataset for flawless live demo
const SAMPLE_SALES_DATA = [
  { Transaction_ID: "T1001", Date: "2026-05-01", Product_Category: "Electronics", Product_Name: "iPhone 16 Pro", Units_Sold: 2, Unit_Price: 1199, Total_Revenue: 2398, Customer_Age: 28, Payment_Method: "Credit Card", Region: "North" },
  { Transaction_ID: "T1002", Date: "2026-05-02", Product_Category: "Electronics", Product_Name: "iPad Air", Units_Sold: 1, Unit_Price: 599, Total_Revenue: 599, Customer_Age: 34, Payment_Method: "Google Pay", Region: "West" },
  { Transaction_ID: "T1003", Date: "2026-05-03", Product_Category: "Apparel", Product_Name: "Designer Hoodie", Units_Sold: 4, Unit_Price: 85, Total_Revenue: 340, Customer_Age: 22, Payment_Method: "PayPal", Region: "South" },
  { Transaction_ID: "T1004", Date: "2026-05-04", Product_Category: "Home & Kitchen", Product_Name: "Espresso Machine", Units_Sold: 1, Unit_Price: 450, Total_Revenue: 450, Customer_Age: 45, Payment_Method: "Credit Card", Region: "East" },
  { Transaction_ID: "T1005", Date: "2026-05-05", Product_Category: "Apparel", Product_Name: "Running Shoes", Units_Sold: 3, Unit_Price: 120, Total_Revenue: 360, Customer_Age: 29, Payment_Method: "Credit Card", Region: "West" },
  { Transaction_ID: "T1006", Date: "2026-05-06", Product_Category: "Electronics", Product_Name: "iPhone 16 Pro", Units_Sold: 1, Unit_Price: 1199, Total_Revenue: 1199, Customer_Age: 31, Payment_Method: "PayPal", Region: "North" },
  { Transaction_ID: "T1007", Date: "2026-05-07", Product_Category: "Books", Product_Name: "Sci-Fi Novel", Units_Sold: 10, Unit_Price: 15, Total_Revenue: 150, Customer_Age: 52, Payment_Method: "Cash", Region: "East" },
  { Transaction_ID: "T1008", Date: "2026-05-08", Product_Category: "Home & Kitchen", Product_Name: "Air Fryer", Units_Sold: 2, Unit_Price: 180, Total_Revenue: 360, Customer_Age: 40, Payment_Method: "Credit Card", Region: "North" },
  { Transaction_ID: "T1009", Date: "2026-05-09", Product_Category: "Electronics", Product_Name: "Wireless Earbuds", Units_Sold: 5, Unit_Price: 150, Total_Revenue: 750, Customer_Age: 25, Payment_Method: "Google Pay", Region: "South" },
  { Transaction_ID: "T1010", Date: "2026-05-10", Product_Category: "Apparel", Product_Name: "Denim Jacket", Units_Sold: 2, Unit_Price: 95, Total_Revenue: 190, Customer_Age: 24, Payment_Method: "PayPal", Region: "West" },
  { Transaction_ID: "T1011", Date: "2026-05-11", Product_Category: "Home & Kitchen", Product_Name: "Air Fryer", Units_Sold: 1, Unit_Price: 180, Total_Revenue: 180, Customer_Age: 48, Payment_Method: "Credit Card", Region: "East" },
  { Transaction_ID: "T1012", Date: "2026-05-12", Product_Category: "Electronics", Product_Name: "Noise Cancelling Headphones", Units_Sold: 2, Unit_Price: 350, Total_Revenue: 700, Customer_Age: 33, Payment_Method: "Credit Card", Region: "North" },
  { Transaction_ID: "T1013", Date: "2026-05-13", Product_Category: "Books", Product_Name: "Business Strategy Book", Units_Sold: 6, Unit_Price: 28, Total_Revenue: 168, Customer_Age: 39, Payment_Method: "Google Pay", Region: "West" },
  { Transaction_ID: "T1014", Date: "2026-05-14", Product_Category: "Electronics", Product_Name: "Wireless Earbuds", Units_Sold: 12, Unit_Price: 150, Total_Revenue: 1800, Customer_Age: 19, Payment_Method: "Google Pay", Region: "South" },
  { Transaction_ID: "T1015", Date: "2026-05-15", Product_Category: "Home & Kitchen", Product_Name: "Espresso Machine", Units_Sold: 1, Unit_Price: 450, Total_Revenue: 450, Customer_Age: 42, Payment_Method: "Credit Card", Region: "North" },
  { Transaction_ID: "T1015", Date: "2026-05-15", Product_Category: "Home & Kitchen", Product_Name: "Espresso Machine", Units_Sold: 1, Unit_Price: 450, Total_Revenue: 450, Customer_Age: 42, Payment_Method: "Credit Card", Region: "North" }, // DUPLICATE row for cleaning feature
  { Transaction_ID: "T1016", Date: "2026-05-16", Product_Category: "Apparel", Product_Name: "Designer Hoodie", Units_Sold: 3, Unit_Price: 85, Total_Revenue: 255, Customer_Age: 27, Payment_Method: "Cash", Region: "East" },
  { Transaction_ID: "T1017", Date: "2026-05-17", Product_Category: "Books", Product_Name: "Sci-Fi Novel", Units_Sold: 2, Unit_Price: 15, Total_Revenue: 30, Customer_Age: 61, Payment_Method: "Credit Card", Region: "South" },
  { Transaction_ID: "T1018", Date: "2026-05-18", Product_Category: "Electronics", Product_Name: "iPad Air", Units_Sold: 1, Unit_Price: 599, Total_Revenue: 599, Customer_Age: 35, Payment_Method: "PayPal", Region: "East" },
  { Transaction_ID: "T1019", Date: "2026-05-19", Product_Category: "Electronics", Product_Name: "iPhone 16 Pro", Units_Sold: 15, Unit_Price: 1199, Total_Revenue: 17985, Customer_Age: 110, Payment_Method: "Credit Card", Region: "North" }, // OUTLIER (Units sold high, age 110 high)
  { Transaction_ID: "T1020", Date: "2026-05-20", Product_Category: "Apparel", Product_Name: "Running Shoes", Units_Sold: 1, Unit_Price: 120, Total_Revenue: null, Customer_Age: 23, Payment_Method: "Google Pay", Region: "West" } // MISSING Total_Revenue for missing values feature
];

export default function DatasetUpload({ onUploadComplete, userId, darkMode }: DatasetUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Paginated states
  const [previewData, setPreviewData] = useState<Record<string, any>[] | null>(null);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const calculateStatistics = (data: Record<string, any>[], fileName: string, fileSize: number): DatasetAnalysis => {
    const rowCount = data.length;
    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    const columnCount = keys.length;

    // Duplicates scan
    const rowStrings = data.map(r => JSON.stringify(r));
    const uniqueRowStrings = new Set(rowStrings);
    const duplicateCount = rowStrings.length - uniqueRowStrings.size;

    let missingTotal = 0;
    let cellTotal = rowCount * columnCount;

    const columns: ColumnMetric[] = keys.map(key => {
      let missingCount = 0;
      const values: any[] = [];
      const countsMap: Record<string, number> = {};

      data.forEach(row => {
        const val = row[key];
        if (val === undefined || val === null || val === "" || String(val).trim() === "" || (typeof val === "number" && isNaN(val))) {
          missingCount++;
        } else {
          values.push(val);
          const strVal = String(val);
          countsMap[strVal] = (countsMap[strVal] || 0) + 1;
        }
      });

      missingTotal += missingCount;

      const uniqueValues = Array.from(new Set(values));
      const uniqueCount = uniqueValues.length;

      // Type detection
      let type: 'numeric' | 'categorical' | 'date' | 'unknown' = 'unknown';
      const numericSample = values.filter(v => !isNaN(Number(v)) && v !== "");
      const dateSample = values.filter(v => !isNaN(Date.parse(String(v))) && isNaN(Number(v)) && String(v).length > 6);

      if (numericSample.length > values.length * 0.7) {
        type = 'numeric';
      } else if (dateSample.length > values.length * 0.7) {
        type = 'date';
      } else if (values.length > 0) {
        type = 'categorical';
      }

      const metric: ColumnMetric = {
        name: key,
        type,
        missingCount,
        uniqueCount,
        missingPercentage: parseFloat(((missingCount / rowCount) * 100).toFixed(1))
      };

      if (type === 'numeric') {
        const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          numbers.sort((a, b) => a - b);
          const min = numbers[0];
          const max = numbers[numbers.length - 1];
          const sum = numbers.reduce((a, b) => a + b, 0);
          const mean = parseFloat((sum / numbers.length).toFixed(2));
          
          // Median
          const mid = Math.floor(numbers.length / 2);
          const median = numbers.length % 2 !== 0 ? numbers[mid] : parseFloat(((numbers[mid - 1] + numbers[mid]) / 2).toFixed(2));
          
          // StdDev
          const variance = parseFloat((numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length).toFixed(2));
          const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

          // Mode
          let maxCount = 0;
          let modeVal: any = "";
          Object.keys(countsMap).forEach(k => {
            if (countsMap[k] > maxCount) {
              maxCount = countsMap[k];
              modeVal = Number(k);
            }
          });

          metric.min = min;
          metric.max = max;
          metric.mean = mean;
          metric.median = median;
          metric.stdDev = stdDev;
          metric.variance = variance;
          metric.mode = modeVal;
        }
      } else {
        // Categorical Mode
        let maxCount = 0;
        let modeVal: any = "N/A";
        Object.keys(countsMap).forEach(k => {
          if (countsMap[k] > maxCount) {
            maxCount = countsMap[k];
            modeVal = k;
          }
        });
        metric.mode = modeVal;
        metric.uniqueValues = uniqueValues.slice(0, 10).map(v => String(v));
      }

      return metric;
    });

    // Detect Primary Key candidate
    let primaryKey = "N/A";
    columns.forEach(col => {
      if (col.uniqueCount === rowCount && col.missingCount === 0 && primaryKey === "N/A") {
        primaryKey = col.name;
      }
    });

    const missingPercentage = cellTotal > 0 ? parseFloat(((missingTotal / cellTotal) * 100).toFixed(1)) : 0;
    
    // Quality Score Calculation
    let dataQualityScore = 100;
    dataQualityScore -= (missingPercentage * 2.5);
    dataQualityScore -= (duplicateCount * 2);
    if (primaryKey === "N/A") dataQualityScore -= 5;
    dataQualityScore = Math.max(10, Math.min(100, Math.round(dataQualityScore)));

    return {
      id: "ds_" + Date.now().toString(36),
      userId,
      fileName,
      fileSize,
      uploadTime: Date.now(),
      rowCount,
      columnCount,
      columns,
      primaryKey,
      missingPercentage,
      duplicateCount,
      dataQualityScore,
      rawSample: data.slice(0, 50), // store top 50 as preview payload
      hasBeenCleaned: false
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setLoading(true);

    const name = file.name;
    const size = file.size;
    const extension = name.split(".").pop()?.toLowerCase();

    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const analysis = calculateStatistics(results.data as Record<string, any>[], name, size);
            setPreviewData(results.data as Record<string, any>[]);
            setPreviewColumns(Object.keys(results.data[0]));
            setLoading(false);
            onUploadComplete(analysis);
          } else {
            setError("The CSV file appears to be empty or poorly formatted.");
            setLoading(false);
          }
        },
        error: (err) => {
          setError("Error parsing CSV: " + err.message);
          setLoading(false);
        }
      });
    } else if (extension === "xlsx" || extension === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const ab = e.target?.result;
          const workbook = XLSX.read(ab, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          
          if (jsonData && jsonData.length > 0) {
            const analysis = calculateStatistics(jsonData as Record<string, any>[], name, size);
            setPreviewData(jsonData as Record<string, any>[]);
            setPreviewColumns(Object.keys(jsonData[0]));
            setLoading(false);
            onUploadComplete(analysis);
          } else {
            setError("The Excel sheet is empty.");
            setLoading(false);
          }
        } catch (err: any) {
          setError("Error parsing Excel: " + err.message);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === "json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          const dataArray = Array.isArray(parsed) ? parsed : [parsed];
          if (dataArray.length > 0) {
            const analysis = calculateStatistics(dataArray, name, size);
            setPreviewData(dataArray);
            setPreviewColumns(Object.keys(dataArray[0]));
            setLoading(false);
            onUploadComplete(analysis);
          } else {
            setError("JSON is not a populated array of records.");
            setLoading(false);
          }
        } catch (err: any) {
          setError("Error parsing JSON: " + err.message);
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } else {
      setError("Unsupported file format. Please upload a CSV, Excel (.xlsx/.xls), or JSON dataset.");
      setLoading(false);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleLoadSample = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      const data = [...SAMPLE_SALES_DATA];
      const analysis = calculateStatistics(data, "Sample_Sales_Dataset.csv", 4560);
      setPreviewData(data);
      setPreviewColumns(Object.keys(data[0]));
      setLoading(false);
      onUploadComplete(analysis);
    }, 800);
  };

  // Pagination & Search logic
  const filteredData = previewData ? previewData.filter(row => {
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div className="space-y-4 max-w-5xl mx-auto py-2">
      {/* Dynamic Introduction Header */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
          <Upload className="w-5 h-5 text-indigo-400" />
          <span>Upload Dataset</span>
        </h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Upload your <strong className="text-indigo-400">CSV</strong>, <strong className="text-indigo-400">Excel</strong>, or <strong className="text-indigo-400 font-mono">JSON</strong> dataset for instant AI data cleaning and analytics.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
          <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick 1-Tap Demo Banner - Super useful on mobile! */}
      {!loading && (
        <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          darkMode 
            ? "bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30 border-indigo-500/30" 
            : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
        }`}>
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Instant 1-Tap Demo Dataset</span>
            </div>
            <p className="text-[11px] text-slate-400">Test the AI cleaner, charts, and report generator without uploading a file.</p>
          </div>
          <button
            onClick={handleLoadSample}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-lg shadow-indigo-600/20 flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Load Sales Demo Data</span>
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-all ${
          dragActive 
            ? "border-indigo-500 bg-indigo-500/10 shadow-xl scale-[1.005]" 
            : darkMode 
              ? "border-slate-800 bg-slate-900/30 hover:border-indigo-500/40 hover:bg-slate-900/50" 
              : "border-gray-300 bg-white hover:border-indigo-500/40 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv, .xlsx, .xls, .json"
          onChange={handleFileInput}
        />

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="relative w-10 h-10 mx-auto">
              <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Analyzing dataset structure...</p>
              <p className="text-[11px] text-slate-400 mt-1">Scanning columns, data types, anomalies, and statistics.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Upload className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-white">Drag and drop your file here</p>
              <p className="text-xs text-slate-400">Supports .CSV, .XLSX (Excel), and .JSON files up to 10MB</p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={triggerFileBrowser}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer min-h-[44px] border border-slate-700 shadow-sm"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Browse Files on Device</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">.CSV</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">.XLSX</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">.JSON</span>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Preview Section (If uploaded/parsed already) */}
      {previewData && (
        <div className={`p-4 rounded-xl border space-y-3 ${
          darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dataset Preview & Search</span>
              </div>
              <p className="text-[10px] text-slate-400">Showing {filteredData.length} records found.</p>
            </div>
            
            {/* Local Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search records..."
                className={`w-full text-xs pl-8 pr-3 py-2 rounded-lg border outline-none min-h-[40px] ${
                  darkMode 
                    ? "bg-slate-950 border-slate-800 focus:border-indigo-500 text-white" 
                    : "bg-white border-gray-200 focus:border-indigo-500 text-gray-950"
                }`}
              />
            </div>
          </div>

          {/* Paginated Grid Table */}
          <div className="overflow-x-auto rounded-md border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={darkMode ? "bg-slate-950 text-slate-300" : "bg-gray-50"}>
                  {previewColumns.map((col) => (
                    <th key={col} className="px-3 py-2 text-[10px] font-mono font-semibold border-b border-slate-800 truncate max-w-[150px]" title={col}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {paginatedData.map((row, rIdx) => (
                  <tr key={rIdx} className={`hover:bg-indigo-500/5 transition-colors ${
                    (row.Customer_Age === 110 || row.Units_Sold === 15) 
                      ? "bg-amber-500/5 text-amber-300"
                      : row.Total_Revenue === null 
                        ? "bg-red-500/5 text-red-300" 
                        : "text-slate-300"
                  }`}>
                    {previewColumns.map((col) => (
                      <td key={col} className="px-3 py-2 truncate max-w-[150px] font-mono text-[11px]" title={String(row[col])}>
                        {row[col] === null || row[col] === undefined ? (
                          <span className="text-[9px] uppercase font-mono tracking-wider font-semibold bg-red-500/10 text-red-400 px-1 py-0.5 rounded">NULL</span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Showing {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredData.length, currentPage * pageSize)} of {filteredData.length} filtered rows
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </button>
                <span className="text-[10px] font-mono font-semibold text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
