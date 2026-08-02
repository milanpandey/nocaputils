"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { parseReceiptFile, evaluateQAFlags, type ReceiptItem } from "@/lib/workplace/receiptParser";
import { CURRENCY_MAP, TOP_CURRENCY_CODES } from "@/lib/workplace/currencyMap";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export default function FileBillsClient() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Corporate Expense Fields
  const [projectCode, setProjectCode] = useState("PRJ-2026-EXP");
  const [deptCode, setDeptCode] = useState("FIN-001");

  // Track if user has modified any fields
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Inline Image Preview Modal State
  const [previewItem, setPreviewItem] = useState<ReceiptItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      setError("Please select valid image files (JPG, PNG, WEBP).");
      return;
    }

    if (receipts.length + fileArray.length > 10) {
      setError("Maximum limit is 10 receipt images per batch.");
    }

    const availableSlots = 10 - receipts.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    setIsProcessing(true);
    setError(null);
    setStatusMsg(`Scanning & enhancing ${filesToProcess.length} receipt image(s)...`);

    try {
      const newItems: ReceiptItem[] = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        const itemNo = receipts.length + i + 1;
        setStatusMsg(`Analyzing receipt ${i + 1} of ${filesToProcess.length}...`);
        const item = await parseReceiptFile(filesToProcess[i], itemNo);
        newItems.push(item);
      }

      setReceipts(prev => {
        let combined = [...prev, ...newItems];

        // 1. Batch Currency Anomaly Resolver:
        const currencyCounts: Record<string, number> = {};
        combined.forEach(item => {
          if (item.currencyDetected) {
            currencyCounts[item.currency] = (currencyCounts[item.currency] || 0) + 1;
          }
        });

        const sortedCurrencies = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1]);
        const dominantCurrency = sortedCurrencies.length > 0 ? sortedCurrencies[0][0] : "AED";
        const dominantCount = sortedCurrencies.length > 0 ? sortedCurrencies[0][1] : 0;

        combined = combined.map(item => {
          if (!item.currencyDetected || (dominantCount >= 2 && currencyCounts[item.currency] === 1)) {
            return { ...item, currency: dominantCurrency };
          }
          return item;
        });

        // 2. Duplicate Check Scanner
        const seenKeys = new Map<string, string>();
        combined = combined.map(item => {
          const key = `${item.date}_${item.amount}_${item.billName.toLowerCase()}`;
          const isDuplicate = seenKeys.has(key) && item.amount > 0;
          if (!isDuplicate) seenKeys.set(key, item.id);

          const qaFlags = evaluateQAFlags(item, isDuplicate);
          return { ...item, qaFlags };
        });

        return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                       .map((item, idx) => ({ ...item, itemNo: idx + 1 }));
      });

      setStatusMsg("");
    } catch (err: unknown) {
      console.error("Receipt parsing error:", err);
      setError("Failed to parse some receipt images. You can edit details manually below.");
    } finally {
      setIsProcessing(false);
    }
  }, [receipts]);

  // Live Re-evaluation of Policy QA Flags on User Edits
  const updateReceipt = <K extends keyof ReceiptItem>(id: string, field: K, value: ReceiptItem[K]) => {
    setHasUserEdited(true);
    setReceipts(prev => {
      const updated = prev.map(r => (r.id === id ? { ...r, [field]: value } : r));

      const seenKeys = new Map<string, string>();
      return updated.map(item => {
        const key = `${item.date}_${item.amount}_${item.billName.toLowerCase()}`;
        const isDuplicate = seenKeys.has(key) && item.amount > 0;
        if (!isDuplicate) seenKeys.set(key, item.id);

        const qaFlags = evaluateQAFlags(item, isDuplicate);
        return { ...item, qaFlags };
      });
    });
  };

  const removeReceipt = (id: string) => {
    setHasUserEdited(true);
    setReceipts(prev =>
      prev.filter(r => r.id !== id).map((item, idx) => ({ ...item, itemNo: idx + 1 }))
    );
  };

  // Date Window calculation
  const dates = receipts.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t));
  const startDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split("T")[0] : "N/A";
  const endDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split("T")[0] : "N/A";

  // Dominant Batch Currency
  const batchCurrencies: Record<string, number> = {};
  receipts.forEach(r => { batchCurrencies[r.currency] = (batchCurrencies[r.currency] || 0) + 1; });
  const sortedBatchCurrencies = Object.entries(batchCurrencies).sort((a, b) => b[1] - a[1]);
  const dominantBatchCurrency = sortedBatchCurrencies.length > 0 ? sortedBatchCurrencies[0][0] : "AED";
  const dominantSymbol = CURRENCY_MAP[dominantBatchCurrency]?.symbol || dominantBatchCurrency;

  // Exact Sum Calculation in Batch Dominant Currency
  const totalAmount = receipts.reduce((sum, r) => {
    if (r.currency === dominantBatchCurrency) {
      return sum + (r.amount || 0);
    }
    const fromRate = CURRENCY_MAP[r.currency]?.rateToUSD || 1.0;
    const toRate = CURRENCY_MAP[dominantBatchCurrency]?.rateToUSD || 1.0;
    const converted = (r.amount || 0) * (fromRate / toRate);
    return sum + converted;
  }, 0);

  // Download PDF
  const downloadPrintablePdf = useCallback(() => {
    if (receipts.length === 0) return;

    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("EXPENSE BILLS LEDGER REPORT", 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Project Code: ${projectCode} | Department Code: ${deptCode}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Total Receipts: ${receipts.length} | Window: ${startDate} to ${endDate}`, 14, 35);

    doc.setFillColor(243, 244, 246);
    doc.rect(14, 48, pageWidth - 28, 20, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`ESTIMATED GRAND TOTAL (${dominantBatchCurrency}): ${dominantSymbol} ${totalAmount.toFixed(2)}`, 20, 60);

    let y = 76;
    doc.setFillColor(42, 157, 143);
    doc.rect(14, y, pageWidth - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text("#", 17, y + 5.5);
    doc.text("Date", 25, y + 5.5);
    doc.text("Merchant / Bill Name", 50, y + 5.5);
    doc.text("Location", 100, y + 5.5);
    doc.text("Amount", 140, y + 5.5);
    doc.text("Policy QA Status", 175, y + 5.5);

    y += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    receipts.forEach(r => {
      doc.text(`${r.itemNo}`, 17, y);
      doc.text(`${r.date}`, 25, y);
      doc.text(`${r.billName.substring(0, 22)}`, 50, y);
      doc.text(`${r.location.substring(0, 18)}`, 100, y);
      const symbol = CURRENCY_MAP[r.currency]?.symbol || r.currency;
      doc.text(`${symbol} ${r.amount.toFixed(2)} (${r.currency})`, 140, y);

      const statusText = r.qaFlags.messages.length > 0 ? r.qaFlags.messages.join("; ").substring(0, 18) : "PASSED";
      if (r.qaFlags.isDuplicate || r.qaFlags.isFutureDate || r.qaFlags.isOffensive) {
        doc.setTextColor(220, 38, 38);
      } else if (r.qaFlags.messages.length > 0) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(16, 185, 129);
      }
      doc.text(statusText, 175, y);
      doc.setTextColor(0, 0, 0);

      y += 8;
    });

    receipts.forEach(r => {
      doc.addPage();
      doc.setFillColor(243, 244, 246);
      doc.rect(0, 0, pageWidth, 28, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Item #${r.itemNo}: ${r.billName}`, 14, 12);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const symbol = CURRENCY_MAP[r.currency]?.symbol || r.currency;
      doc.text(`Date: ${r.date} | Amount: ${symbol} ${r.amount.toFixed(2)} (${r.currency}) | Location: ${r.location}`, 14, 18);
      if (r.qaFlags.messages.length > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`QA Warnings: ${r.qaFlags.messages.join(" | ")}`, 14, 24);
        doc.setTextColor(0, 0, 0);
      }

      const imgProps = doc.getImageProperties(r.enhancedDataUrl);
      const pdfWidth = pageWidth - 28;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const maxHeight = 235;
      const finalHeight = Math.min(pdfHeight, maxHeight);
      const finalWidth = (imgProps.width * finalHeight) / imgProps.height;

      doc.addImage(r.enhancedDataUrl, "JPEG", (pageWidth - finalWidth) / 2, 34, finalWidth, finalHeight);
    });

    doc.save(`Expense_Bills_Ledger_${startDate}_to_${endDate}.pdf`);
  }, [receipts, startDate, endDate, totalAmount, projectCode, deptCode, dominantBatchCurrency, dominantSymbol]);

  // Download Excel
  const downloadExcelLedger = useCallback(() => {
    if (receipts.length === 0) return;

    const data = [
      ["WORKPLACE EXPENSE BILLS LEDGER"],
      ["Project Code", projectCode],
      ["Department Code", deptCode],
      ["Date Window", `${startDate} to ${endDate}`],
      ["Total Receipts", receipts.length],
      [`Grand Total (${dominantBatchCurrency} Estimate)`, `${dominantSymbol} ${totalAmount.toFixed(2)}`],
      [],
      ["Item #", "Date of Bill", "Name of Bill / Merchant", "Location / Country", "Currency", `Amount (${dominantBatchCurrency})`, "Policy QA Warnings"],
      ...receipts.map(r => {
        let amountInDominant = r.amount;
        if (r.currency !== dominantBatchCurrency) {
          const fromRate = CURRENCY_MAP[r.currency]?.rateToUSD || 1.0;
          const toRate = CURRENCY_MAP[dominantBatchCurrency]?.rateToUSD || 1.0;
          amountInDominant = Math.round(r.amount * (fromRate / toRate) * 100) / 100;
        }
        return [
          r.itemNo,
          r.date,
          r.billName,
          r.location,
          r.currency,
          amountInDominant,
          r.qaFlags.messages.length > 0 ? r.qaFlags.messages.join(" | ") : "PASSED",
        ];
      }),
      [],
      ["TOTALS", "", "", "", "", totalAmount, ""],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills Ledger");
    XLSX.writeFile(workbook, `Bills_Ledger_${projectCode}_${startDate}_to_${endDate}.xlsx`);
  }, [receipts, startDate, endDate, totalAmount, projectCode, deptCode, dominantBatchCurrency, dominantSymbol]);

  const remainingCurrencies = Object.keys(CURRENCY_MAP).filter(c => !TOP_CURRENCY_CODES.includes(c));

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a href="/workplaceutilities" className="bauhaus-back-link">
            <span aria-hidden="true">←</span> Workplace Utilities
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          <div className="mb-10 text-center max-w-3xl">
            <div className="inline-block border-4 border-black bg-[#2A9D8F] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Receipt Organizer &amp; Compliance QA
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              File Bills
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Upload up to 10 receipts. Auto-scan, enhance, order by date, run corporate policy QA checks, and export printable PDF + Excel ledger.
            </p>
          </div>

          {/* Upload Drop Zone & Corporate Header Inputs */}
          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-10 mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-black uppercase text-[var(--text-main)] block mb-1">
                  Project Code
                </label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={(e) => { setProjectCode(e.target.value); setHasUserEdited(true); }}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm bg-[var(--bg-page)] text-[var(--text-main)]"
                  placeholder="e.g. PRJ-2026-EXP"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-[var(--text-main)] block mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => { setDeptCode(e.target.value); setHasUserEdited(true); }}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm bg-[var(--bg-page)] text-[var(--text-main)]"
                  placeholder="e.g. FIN-001"
                />
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFilesUpload(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-8 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center"
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                className="hidden"
              />
              <span className="text-5xl mb-3">🧾</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1">
                Upload Receipts (Up to 10 Images)
              </h2>
              <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-4">
                Drag &amp; drop receipt photos or click to browse
              </p>
              <span className="neo-button bg-[var(--accent)] text-black font-black uppercase px-6 py-2.5 text-sm">
                + Select Receipts ({receipts.length}/10 uploaded)
              </span>
            </div>

            {isProcessing && (
              <div className="mt-4 border-4 border-black bg-[var(--bg-page)] p-4 text-center font-black uppercase text-sm">
                ⏳ {statusMsg}
              </div>
            )}

            {error && (
              <div className="mt-4 border-4 border-black bg-[#E63946] text-white p-4 font-bold text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Verification & Edit Ledger */}
          {receipts.length > 0 && (
            <div className="w-full max-w-5xl neo-panel bg-[var(--bg-panel)] p-6 sm:p-8 mb-12">
              {/* Executive Summary Bar */}
              <div className="border-4 border-black bg-[var(--bg-page)] p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase text-[var(--text-main)]">
                    Expense Summary ({receipts.length} Bills)
                  </h3>
                  <p className="text-xs font-bold uppercase text-[var(--text-soft)] tracking-wider">
                    Project: <strong>{projectCode}</strong> | Dept: <strong>{deptCode}</strong> | Window: <strong>{startDate}</strong> to <strong>{endDate}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase text-[var(--text-soft)] block">
                    Estimated Grand Total ({dominantBatchCurrency})
                  </span>
                  <span className="text-3xl font-black text-[#E63946]">
                    {dominantSymbol} {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons + Pulsing Green LED Indicator */}
              <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-black uppercase text-[var(--text-main)]">
                    Ledger Items (Sorted by Date)
                  </h4>
                  {hasUserEdited && (
                    <div className="flex items-center gap-2 bg-black text-white px-3 py-1 border-2 border-black text-[11px] font-black uppercase tracking-wider">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
                      </span>
                      <span>Live Sync Active</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadPrintablePdf}
                    className="neo-button bg-[#E63946] text-white font-black uppercase px-6 py-3 text-sm flex items-center gap-2"
                  >
                    <span>📄 Download Printable PDF</span>
                  </button>
                  <button
                    onClick={downloadExcelLedger}
                    className="neo-button bg-[#2A9D8F] text-white font-black uppercase px-6 py-3 text-sm flex items-center gap-2"
                  >
                    <span>📊 Download Excel Ledger (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Receipt Cards Grid */}
              <div className="flex flex-col gap-6">
                {receipts.map(r => {
                  const isRed = r.qaFlags.isDuplicate || r.qaFlags.isFutureDate || r.qaFlags.isOffensive;
                  const isYellow = !isRed && (r.qaFlags.isAlcohol || r.qaFlags.isZeroAmount || r.qaFlags.isOver60Days);

                  const cardBorderColor = isRed
                    ? "border-[#E63946] bg-[#FFF0F0]"
                    : isYellow
                    ? "border-[#F4D35E] bg-[#FFFDF0]"
                    : "border-[var(--border-main)] bg-[var(--bg-page)]";

                  return (
                    <div
                      key={r.id}
                      className={`border-4 p-5 grid grid-cols-1 md:grid-cols-[110px_1fr_auto] gap-6 items-center transition-colors ${cardBorderColor}`}
                    >
                      {/* Preview Scan Thumbnail + Zoom Button */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          onClick={() => setPreviewItem(r)}
                          className="relative aspect-[3/4] w-full border-2 border-black overflow-hidden bg-black flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity group"
                          title="Click to preview scan"
                        >
                          <img
                            src={r.enhancedDataUrl}
                            alt={r.billName}
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute top-1 left-1 bg-black text-white px-1.5 py-0.5 text-[10px] font-black">
                            #{r.itemNo}
                          </span>
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 font-bold group-hover:scale-110 transition-transform">
                            🔍 Zoom
                          </span>
                        </div>
                      </div>

                      {/* Inputs Form + Policy Flags */}
                      <div className="flex flex-col gap-3">
                        {/* Policy QA Warnings Banner */}
                        {r.qaFlags.messages.length > 0 && (
                          <div className={`p-2.5 border-2 border-black font-black text-xs uppercase flex flex-col gap-1 ${isRed ? "bg-[#E63946] text-white" : "bg-[#F4D35E] text-black"}`}>
                            <span className="underline">⚠️ POLICY QA WARNINGS:</span>
                            {r.qaFlags.messages.map((m, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-black text-white text-[10px]">
                                  {m}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-1">
                              Bill / Merchant Name
                            </label>
                            <input
                              type="text"
                              value={r.billName}
                              onChange={(e) => updateReceipt(r.id, "billName", e.target.value)}
                              className="w-full border-2 border-black p-2 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-1">
                              Date of Bill (YYYY-MM-DD)
                            </label>
                            <input
                              type="date"
                              value={r.date}
                              onChange={(e) => updateReceipt(r.id, "date", e.target.value)}
                              className="w-full border-2 border-black p-2 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-1">
                              Amount (Excl. Tip)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={r.amount}
                              onChange={(e) => updateReceipt(r.id, "amount", parseFloat(e.target.value) || 0)}
                              className="w-full border-2 border-black p-2 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-1">
                              Currency
                            </label>
                            <select
                              value={r.currency}
                              onChange={(e) => updateReceipt(r.id, "currency", e.target.value)}
                              className="w-full border-2 border-black p-2 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)]"
                            >
                              <optgroup label="Popular Currencies">
                                {TOP_CURRENCY_CODES.map(code => (
                                  <option key={code} value={code}>
                                    {code} ({CURRENCY_MAP[code].symbol})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Other Currencies">
                                {remainingCurrencies.map(code => (
                                  <option key={code} value={code}>
                                    {code} ({CURRENCY_MAP[code].symbol})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <div className="flex md:flex-col justify-end items-end gap-2">
                        <button
                          onClick={() => removeReceipt(r.id)}
                          className="text-xs font-black uppercase bg-[#E63946] text-white px-3 py-2 border-2 border-black hover:bg-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inline High-Res Image Preview Modal */}
          {previewItem && (
            <div
              onClick={() => setPreviewItem(null)}
              className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="neo-panel bg-[var(--bg-panel)] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4 relative"
              >
                <div className="flex items-center justify-between border-b-4 border-black pb-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase text-[var(--text-main)]">
                      Receipt #{previewItem.itemNo}: {previewItem.billName}
                    </h3>
                    <p className="text-xs font-bold uppercase text-[var(--text-soft)]">
                      Date: {previewItem.date} | Amount: {CURRENCY_MAP[previewItem.currency]?.symbol || previewItem.currency} {previewItem.amount.toFixed(2)} ({previewItem.currency})
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="neo-button bg-[#E63946] text-white font-black text-sm px-4 py-2 uppercase"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="flex justify-center border-4 border-black bg-black p-4 max-h-[65vh] overflow-auto">
                  <img
                    src={previewItem.enhancedDataUrl}
                    alt={previewItem.billName}
                    className="max-w-full object-contain"
                  />
                </div>

                {previewItem.qaFlags.messages.length > 0 && (
                  <div className="p-3 border-2 border-black bg-[#F4D35E] text-black font-bold text-xs uppercase">
                    <strong>⚠️ QA Warning Flags:</strong> {previewItem.qaFlags.messages.join(" | ")}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>100% Private Processing:</strong> Receipts and compliance checks run locally in your browser memory. Zero server uploads.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
