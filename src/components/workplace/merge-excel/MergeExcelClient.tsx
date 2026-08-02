"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import * as XLSX from "xlsx";

export interface ExcelFileItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  sheetNames: string[];
  sheetCount: number;
  workbook: XLSX.WorkBook;
}

export default function MergeExcelClient() {
  const [excelItems, setExcelItems] = useState<ExcelFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<"xlsx" | "xls" | "csv">("xlsx");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith(".xlsx") || ext.endsWith(".xls") || ext.endsWith(".csv");
    });

    if (fileArray.length === 0) {
      setError("Invalid file selection. Please select valid Microsoft Excel (.xlsx, .xls) or CSV (.csv) workbooks.");
      return;
    }

    if (excelItems.length + fileArray.length > 5) {
      setError("Maximum limit is 5 Excel/CSV files per merge operation.");
    }

    const availableSlots = 5 - excelItems.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    setIsProcessing(true);
    setError(null);
    setStatusMsg(`Reading ${filesToProcess.length} Excel file(s)...`);

    try {
      const newItems: ExcelFileItem[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setStatusMsg(`Parsing worksheet tabs for ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetNames = workbook.SheetNames;

        newItems.push({
          id: `excel_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          file,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          sizeBytes: file.size,
          sheetNames,
          sheetCount: sheetNames.length,
          workbook,
        });
      }

      setExcelItems(prev => [...prev, ...newItems]);
      setStatusMsg("");
    } catch (err: unknown) {
      console.error("Excel read error:", err);
      setError("Failed to read Excel workbook. Please verify file integrity.");
    } finally {
      setIsProcessing(false);
    }
  }, [excelItems]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    setExcelItems(prev => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index === excelItems.length - 1) return;
    setExcelItems(prev => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setExcelItems(prev => prev.filter(item => item.id !== id));
  };

  const totalSheets = excelItems.reduce((sum, item) => sum + item.sheetCount, 0);
  const totalSizeBytes = excelItems.reduce((sum, item) => sum + item.sizeBytes, 0);

  const mergeWorkbooks = useCallback(async () => {
    if (excelItems.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setStatusMsg("Building master Excel workbook...");

    try {
      const masterWorkbook = XLSX.utils.book_new();
      const usedSheetNames = new Set<string>();

      for (let i = 0; i < excelItems.length; i++) {
        const item = excelItems[i];
        const prefix = item.name.replace(/\.[^/.]+$/, "").substring(0, 12);

        for (const sheetName of item.sheetNames) {
          const worksheet = item.workbook.Sheets[sheetName];
          if (!worksheet) continue;

          let candidateName = `${prefix}_${sheetName}`.substring(0, 31);
          let counter = 1;
          while (usedSheetNames.has(candidateName)) {
            candidateName = `${prefix}_${sheetName}_${counter}`.substring(0, 31);
            counter++;
          }
          usedSheetNames.add(candidateName);

          XLSX.utils.book_append_sheet(masterWorkbook, worksheet, candidateName);
        }
      }

      setStatusMsg("Exporting consolidated Excel binary stream...");
      const bookType = outputFormat === "csv" ? "csv" : outputFormat === "xls" ? "biff8" : "xlsx";
      const fileExt = outputFormat === "csv" ? "csv" : outputFormat === "xls" ? "xls" : "xlsx";

      const outBuffer = XLSX.write(masterWorkbook, { bookType, type: "array" });
      const blob = new Blob([new Uint8Array(outBuffer)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Merged_Workbook_${Date.now()}.${fileExt}`;
      link.click();
      URL.revokeObjectURL(url);

      setStatusMsg("");
    } catch (err: unknown) {
      console.error("Excel Merge error:", err);
      setError("Failed to merge Excel workbooks.");
    } finally {
      setIsProcessing(false);
    }
  }, [excelItems, outputFormat]);

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a href="/workplaceutilities" className="bauhaus-back-link" aria-label="Return to Workplace Utilities Hub">
            <span aria-hidden="true">←</span> Workplace Utilities
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center" id="main-content">
          <div className="mb-10 text-center max-w-3xl">
            <div className="inline-block border-4 border-black bg-[#9C27B0] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Enterprise Excel Workbook Merger
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              Merge Excel
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Combine up to 5 Excel &amp; CSV workbooks into a single multi-tab master workbook. Preserves all sheet tabs in your exact serial order.
            </p>
          </div>

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-10 mb-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFilesUpload(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Upload Excel or CSV files to merge (Up to 5 files)"
              className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-8 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center focus:outline-none focus:ring-4 focus:ring-black"
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                className="hidden"
                id="merge-excel-input"
                aria-label="Select Excel or CSV files"
              />
              <span className="text-5xl mb-3" aria-hidden="true">📊</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1">
                Upload Excel / CSV Files to Merge (Up to 5)
              </h2>
              <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-4">
                Drag &amp; drop .xlsx, .xls, or .csv workbooks or click to browse
              </p>
              <span className="neo-button bg-[#9C27B0] text-white font-black uppercase px-6 py-2.5 text-sm">
                + Add Excel Files ({excelItems.length}/5 uploaded)
              </span>
            </div>

            {isProcessing && (
              <div className="mt-4 border-4 border-black bg-[var(--bg-page)] p-4 text-center font-black uppercase text-sm" role="status">
                ⏳ {statusMsg}
              </div>
            )}

            {error && (
              <div className="mt-4 border-4 border-black bg-[#E63946] text-white p-4 font-bold text-sm" role="alert">
                ⚠️ {error}
              </div>
            )}
          </div>

          {excelItems.length > 0 && (
            <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-6 sm:p-8 mb-12">
              <div className="border-4 border-black bg-[var(--bg-page)] p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase text-[var(--text-main)]">
                    Master Workbook Summary
                  </h3>
                  <p className="text-xs font-bold uppercase text-[var(--text-soft)] tracking-wider mt-1">
                    Input Files: <strong>{excelItems.length}</strong> | Total Sheet Tabs: <strong className="text-[#9C27B0] font-black">{totalSheets} Tabs</strong> | Combined Size: <strong>{formatFileSize(totalSizeBytes)}</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as "xlsx" | "xls" | "csv")}
                    aria-label="Select Output File Format"
                    className="border-3 border-black p-2.5 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)] uppercase focus:ring-2 focus:ring-black"
                  >
                    <option value="xlsx">Format: .XLSX (Modern Excel)</option>
                    <option value="xls">Format: .XLS (Legacy Excel)</option>
                    <option value="csv">Format: .CSV (Single File Data)</option>
                  </select>

                  <button
                    onClick={mergeWorkbooks}
                    disabled={isProcessing}
                    aria-label="Download merged Excel workbook"
                    className="neo-button bg-[#9C27B0] text-white font-black uppercase px-6 py-3 text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>📊 Download Merged Excel</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-black uppercase text-[var(--text-main)] tracking-wider">
                  Set Workbook Tab Order (Serial Sequence):
                </h4>

                {excelItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="border-3 border-black bg-[var(--bg-page)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          aria-label={`Move ${item.name} up in merge queue`}
                          className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase disabled:opacity-30 hover:bg-[#9C27B0] focus:ring-2 focus:ring-white"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === excelItems.length - 1}
                          aria-label={`Move ${item.name} down in merge queue`}
                          className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase disabled:opacity-30 hover:bg-[#9C27B0] focus:ring-2 focus:ring-white"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="w-12 h-12 border-2 border-black bg-[#9C27B0] text-white flex items-center justify-center shrink-0 font-black text-xl" aria-hidden="true">
                        📊
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">
                            #{idx + 1}
                          </span>
                          <span className="font-black text-sm text-[var(--text-main)] break-all">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[var(--text-soft)] uppercase mt-1">
                          {item.sheetCount} Tab(s) [{item.sheetNames.join(", ")}] · {item.sizeFormatted}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove workbook ${item.name}`}
                      className="text-xs font-black uppercase bg-[#E63946] text-white px-3 py-1.5 border-2 border-black hover:bg-black self-end sm:self-center"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> Excel workbook tab merging executes locally inside browser memory. Zero server uploads.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
