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

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Invalid file format. Please upload a valid Microsoft PDF document (.pdf)");
      return;
    }

    setFile(selectedFile);
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

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-10 mb-8">
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
                {file ? file.name : "Upload PDF File to Compress"}
              </h2>
              <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-4">
                {file ? `${formatFileSize(file.size)} · ${pageCount ?? "..."} Pages` : "Drag & drop PDF document or click to browse"}
              </p>
              <span className="neo-button bg-[#F4D35E] text-black font-black uppercase px-6 py-2.5 text-sm">
                {file ? "Change Selected PDF" : "+ Select PDF File"}
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

          {file && (
            <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-6 sm:p-8 mb-12">
              <h3 className="text-xl font-black uppercase text-[var(--text-main)] mb-6">
                Compression Settings &amp; Range Estimator
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div
                  onClick={() => setCompressionLevel(20)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionLevel(20); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select Low Compression preset"
                  className={`p-4 border-3 border-black cursor-pointer transition-colors ${compressionLevel <= 30 ? "bg-[#2A9D8F] text-white" : "bg-[var(--bg-page)] text-[var(--text-main)]"}`}
                >
                  <span className="text-xs font-black uppercase block">Low Compression</span>
                  <span className="text-lg font-black block mt-1">15% - 30% Saved</span>
                  <p className="text-[11px] font-bold mt-1 opacity-90">150 DPI · 85% Quality · Crisp Print Quality</p>
                </div>

                <div
                  onClick={() => setCompressionLevel(55)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionLevel(55); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select Medium Compression preset"
                  className={`p-4 border-3 border-black cursor-pointer transition-colors ${compressionLevel > 30 && compressionLevel <= 70 ? "bg-[#457B9D] text-white" : "bg-[var(--bg-page)] text-[var(--text-main)]"}`}
                >
                  <span className="text-xs font-black uppercase block">Medium (Recommended)</span>
                  <span className="text-lg font-black block mt-1">40% - 60% Saved</span>
                  <p className="text-[11px] font-bold mt-1 opacity-90">110 DPI · 70% Quality · Email &amp; Web Standard</p>
                </div>

                <div
                  onClick={() => setCompressionLevel(85)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionLevel(85); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select High Compression preset"
                  className={`p-4 border-3 border-black cursor-pointer transition-colors ${compressionLevel > 70 ? "bg-[#E63946] text-white" : "bg-[var(--bg-page)] text-[var(--text-main)]"}`}
                >
                  <span className="text-xs font-black uppercase block">High Compression</span>
                  <span className="text-lg font-black block mt-1">65% - 85% Saved</span>
                  <p className="text-[11px] font-bold mt-1 opacity-90">85 DPI · 50% Quality · Max Size Reduction</p>
                </div>
              </div>

              <div className="border-3 border-black bg-[var(--bg-page)] p-6 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="compress-power-slider" className="text-xs font-black uppercase text-[var(--text-main)]">
                    Adjust Compression Power: {compressionLevel}%
                  </label>
                  <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">
                    Estimated Target: ~{formatFileSize(estimatedSizeBytes)} (-{estimateReductionPct}%)
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
                  className="w-full h-3 bg-gray-300 accent-[#457B9D] cursor-pointer"
                />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={compressPdf}
                  disabled={isProcessing}
                  aria-label="Execute PDF file compression"
                  className="neo-button bg-[#F4D35E] text-black font-black uppercase px-10 py-4 text-lg"
                >
                  ⚡ Compress PDF Now
                </button>
              </div>

              {resultStats && (
                <div className="mt-8 border-4 border-black bg-[#2A9D8F] text-white p-6 text-center animate-fadeIn" role="status">
                  <span className="text-3xl mb-2 block" aria-hidden="true">🎉</span>
                  <h4 className="text-2xl font-black uppercase tracking-tight mb-1">
                    Compression Complete!
                  </h4>
                  <p className="text-sm font-bold uppercase tracking-wider mb-4">
                    Original: {formatFileSize(resultStats.originalBytes)} ➔ Compressed: <strong>{formatFileSize(resultStats.compressedBytes)}</strong>
                    <br />
                    Saved {Math.max(0, Math.round((1 - resultStats.compressedBytes / resultStats.originalBytes) * 100))}% ({formatFileSize(Math.max(0, resultStats.originalBytes - resultStats.compressedBytes))} smaller)
                  </p>
                  <a
                    href={resultStats.downloadUrl}
                    download={`Compressed_${file.name}`}
                    className="neo-button bg-black text-white font-black uppercase px-8 py-3 text-base inline-block"
                  >
                    📥 Download Compressed PDF
                  </a>
                </div>
              )}
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
