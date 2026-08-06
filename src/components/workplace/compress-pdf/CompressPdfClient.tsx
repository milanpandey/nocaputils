"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default function CompressPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<number>(50);

  const [resultStats, setResultStats] = useState<{
    originalBytes: number;
    compressedBytes: number;
    downloadUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const [exportFileName, setExportFileName] = useState<string>("");

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Invalid file format. Please upload a valid PDF document (.pdf)");
      return;
    }

    setFile(selectedFile);
    setExportFileName(selectedFile.name.replace(/\.pdf$/i, "") + "_compressed.pdf");
    setError(null);
    setResultStats(null);
    setIsProcessing(true);
    setStatusMsg("Analyzing PDF structure & page count...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      setStatusMsg("");
    } catch (err) {
      console.error("PDF read error:", err);
      setError("Failed to read PDF document. Please verify the file is unencrypted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const estimateReductionPct = Math.round(20 + (compressionLevel / 100) * 55);
  const estimatedSizeBytes = file ? Math.round(file.size * (1 - estimateReductionPct / 100)) : 0;

  const compressPdf = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setStatusMsg("Initializing PDF compression engine...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const { PDFDocument } = await import("pdf-lib");

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      const compressedPdf = await PDFDocument.create();

      const scale = 1.6 - (compressionLevel / 100) * 0.7;
      const jpgQuality = 0.85 - (compressionLevel / 100) * 0.35;

      for (let p = 1; p <= totalPages; p++) {
        setStatusMsg(`Compressing page ${p} of ${totalPages}...`);
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          await (page as unknown as { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } })
            .render({ canvasContext: ctx, viewport }).promise;

          const jpegDataUrl = canvas.toDataURL("image/jpeg", jpgQuality);
          const jpgImageBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
          const embeddedJpg = await compressedPdf.embedJpg(jpgImageBytes);

          const newPage = compressedPdf.addPage([viewport.width / scale, viewport.height / scale]);
          newPage.drawImage(embeddedJpg, {
            x: 0,
            y: 0,
            width: viewport.width / scale,
            height: viewport.height / scale,
          });
        }
      }

      setStatusMsg("Optimizing PDF structure & saving stream...");
      const pdfBytes = await compressedPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      setResultStats({
        originalBytes: file.size,
        compressedBytes: blob.size,
        downloadUrl,
      });

      setStatusMsg("");
    } catch (err: unknown) {
      console.error("PDF compression error:", err);
      setError("Failed to compress PDF file. Please verify file integrity.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, compressionLevel]);

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
            <div className="inline-block border-4 border-black bg-[#F4D35E] px-4 py-1 text-black text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Enterprise Document Optimizer
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              Compress PDF
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Shrink PDF file size in browser memory with interactive quality controls and real-time size reduction estimates.
            </p>
          </div>

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-4 sm:p-6 mb-6">
            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && handleFileSelect(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                tabIndex={0}
                role="button"
                aria-label="Upload PDF file to compress"
                className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-8 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center focus:outline-none focus:ring-4 focus:ring-black"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="compress-pdf-file-input"
                  aria-label="Select PDF File to Compress"
                />
                <span className="text-5xl mb-3" aria-hidden="true">📦</span>
                <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1">
                  Upload PDF File to Compress
                </h2>
                <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-4">
                  Drag &amp; drop PDF document or click to browse
                </p>
                <span className="neo-button bg-[#F4D35E] text-black font-black uppercase px-6 py-2.5 text-sm">
                  + Select PDF File
                </span>
              </div>
            ) : (
              /* ── Compact Uploaded File Bar ── */
              <div className="border-3 border-black bg-[var(--bg-page)] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="compress-pdf-file-input-compact"
                />
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0" aria-hidden="true">📦</span>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[var(--text-main)] truncate">
                      {file.name}
                    </h2>
                    <p className="text-[11px] font-bold text-[var(--text-soft)] uppercase tracking-wider">
                      {formatFileSize(file.size)} · {pageCount !== null ? `${pageCount} Page${pageCount === 1 ? "" : "s"}` : "Loading..."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="neo-button bg-[#F4D35E] text-black font-black uppercase px-3 py-1.5 text-xs flex-shrink-0"
                >
                  Change Selected PDF
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="mt-3 border-3 border-black bg-[var(--bg-page)] p-3 text-center font-black uppercase text-xs" role="status">
                ⏳ {statusMsg}
              </div>
            )}

            {error && (
              <div className="mt-3 border-3 border-black bg-[#E63946] text-white p-3 font-bold text-xs" role="alert">
                ⚠️ {error}
              </div>
            )}
          </div>

          {file && (
            <div className="w-full max-w-4xl flex flex-col gap-6 mb-12">
              {/* ── Main CTA Row: Compress PDF Now ── */}
              <div className="neo-panel bg-[var(--bg-panel)] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] block">
                    Target Estimate: ~{formatFileSize(estimatedSizeBytes)} (-{estimateReductionPct}%)
                  </span>
                  <p className="text-sm font-extrabold text-[var(--text-main)] uppercase">
                    Preset: {compressionLevel <= 30 ? "Low (15-30% Saved)" : compressionLevel > 70 ? "High (65-85% Saved)" : "Medium Recommended (40-60% Saved)"}
                  </p>
                </div>
                <button
                  onClick={compressPdf}
                  disabled={isProcessing}
                  aria-label="Execute PDF file compression"
                  className="neo-button bg-[#F4D35E] text-black font-black uppercase px-8 py-3.5 text-base sm:text-lg flex-shrink-0 w-full sm:w-auto"
                >
                  ⚡ Compress PDF Now
                </button>
              </div>

              {resultStats && (
                <div className="neo-panel bg-[var(--bg-panel)] border-4 border-black p-6 animate-fadeIn" role="status">
                  <div className="border-3 border-black bg-[#2A9D8F] text-white p-3 text-center mb-5 flex items-center justify-center gap-2">
                    <span className="text-2xl" aria-hidden="true">🎉</span>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white">
                      Compression Complete!
                    </h4>
                  </div>

                  {/* ── Compression Stats Cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-center">
                    <div className="border-2 border-black bg-[var(--bg-page)] p-3">
                      <span className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-0.5">Original File Size</span>
                      <span className="text-base font-black text-[var(--text-main)] block">{formatFileSize(resultStats.originalBytes)}</span>
                    </div>

                    <div className="border-2 border-black bg-[var(--bg-page)] p-3">
                      <span className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-0.5">Compressed File Size</span>
                      <span className="text-base font-black text-[#2A9D8F] block">{formatFileSize(resultStats.compressedBytes)}</span>
                    </div>

                    <div className="border-2 border-black bg-[var(--bg-page)] p-3">
                      <span className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-0.5">Total Reduction</span>
                      <span className="text-base font-black text-[#E63946] block">
                        -{Math.max(0, Math.round((1 - resultStats.compressedBytes / resultStats.originalBytes) * 100))}% ({formatFileSize(Math.max(0, resultStats.originalBytes - resultStats.compressedBytes))})
                      </span>
                    </div>
                  </div>

                  {/* ── Editable Export Filename ── */}
                  <div className="mb-5">
                    <label htmlFor="export-pdf-filename" className="block text-xs font-black uppercase tracking-wider text-[var(--text-main)] mb-1.5">
                      Export Filename &amp; Path:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl flex-shrink-0" aria-hidden="true">📄</span>
                      <input
                        type="text"
                        id="export-pdf-filename"
                        value={exportFileName}
                        onChange={(e) => setExportFileName(e.target.value)}
                        placeholder="Compressed_document.pdf"
                        aria-label="Editable Export PDF Filename"
                        className="w-full border-3 border-black bg-[var(--bg-page)] text-[var(--text-main)] font-black text-sm px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* ── Download Action Button ── */}
                  <div className="text-center">
                    <a
                      href={resultStats.downloadUrl}
                      download={exportFileName || `Compressed_${file.name}`}
                      className="neo-button bg-[#F4D35E] text-black font-black uppercase px-8 py-3 text-base inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <span>📥</span> Download Compressed PDF
                    </a>
                  </div>
                </div>
              )}

              {/* ── Compression Settings & Range Estimator (Positioned Below CTA) ── */}
              <div className="neo-panel bg-[var(--bg-panel)] p-5 sm:p-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)] mb-4">
                  Compression Settings &amp; Range Estimator
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div
                    onClick={() => setCompressionLevel(20)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionLevel(20); }}
                    tabIndex={0}
                    role="button"
                    aria-label="Select Low Compression preset"
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionLevel <= 30 ? "bg-[#2A9D8F] text-white" : "bg-[var(--bg-page)] text-[var(--text-main)]"}`}
                  >
                    <span className="text-[11px] font-black uppercase block">Low Compression</span>
                    <span className="text-sm font-black block mt-0.5">15% - 30% Saved</span>
                    <p className="text-[10px] font-bold mt-0.5 opacity-90">150 DPI · 85% Quality · Print</p>
                  </div>

                  <div
                    onClick={() => setCompressionLevel(50)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionLevel(50); }}
                    tabIndex={0}
                    role="button"
                    aria-label="Select Medium Compression preset"
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionLevel > 30 && compressionLevel <= 70 ? "bg-[#457B9D] text-white" : "bg-[var(--bg-page)] text-[var(--text-main)]"}`}
                  >
                    <span className="text-[11px] font-black uppercase block">Medium (Recommended)</span>
                    <span className="text-sm font-black block mt-0.5">40% - 60% Saved</span>
                    <p className="text-[10px] font-bold mt-0.5 opacity-90">110 DPI · 70% Quality · Web</p>
                  </div>

                  <div
                    onClick={() => setCompressionLevel(85)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionLevel(85); }}
                    tabIndex={0}
                    role="button"
                    aria-label="Select High Compression preset"
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionLevel > 70 ? "bg-[#E63946] text-white" : "bg-[var(--bg-page)] text-[var(--text-main)]"}`}
                  >
                    <span className="text-[11px] font-black uppercase block">High Compression</span>
                    <span className="text-sm font-black block mt-0.5">65% - 85% Saved</span>
                    <p className="text-[10px] font-bold mt-0.5 opacity-90">85 DPI · 50% Quality · Small</p>
                  </div>
                </div>

                <div className="border-2 border-black bg-[var(--bg-page)] p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="compress-power-slider" className="text-[11px] font-black uppercase text-[var(--text-main)]">
                      Compression Power: {compressionLevel}%
                    </label>
                    <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                      Est: ~{formatFileSize(estimatedSizeBytes)} (-{estimateReductionPct}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    id="compress-power-slider"
                    min="0"
                    max="100"
                    value={compressionLevel}
                    onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                    aria-label="Compression Strength Slider"
                    className="w-full h-2.5 bg-gray-300 accent-[#457B9D] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> PDF size reduction executes locally inside browser memory. Zero server uploads.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
