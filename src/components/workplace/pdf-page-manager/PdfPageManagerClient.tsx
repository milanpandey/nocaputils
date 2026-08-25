"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

interface PageItem {
  pageIndex: number; // original 0-based index
  rotation: number;  // 0, 90, 180, 270
  deleted: boolean;
  thumbnailUrl: string;
}

export default function PdfPageManagerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Invalid file format. Please upload a PDF document (.pdf).");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    setStatusMsg("Loading PDF and generating page thumbnails...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      const items: PageItem[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setStatusMsg(`Rendering thumbnail for page ${i} of ${totalPages}...`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        let thumbnailUrl = "";
        if (ctx) {
          await (page as unknown as { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } })
            .render({ canvasContext: ctx, viewport }).promise;
          thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
        }

        items.push({
          pageIndex: i - 1,
          rotation: 0,
          deleted: false,
          thumbnailUrl,
        });
      }

      setPages(items);
      setStatusMsg("");
    } catch (err: unknown) {
      console.error("PDF load error:", err);
      setError("Failed to load PDF. Please verify the file is valid and unencrypted.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const rotatePage = (idx: number) => {
    setPages(prev => prev.map((p, i) =>
      i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const toggleDelete = (idx: number) => {
    setPages(prev => prev.map((p, i) =>
      i === idx ? { ...p, deleted: !p.deleted } : p
    ));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setPages(prev => {
      const updated = [...prev];
      const temp = updated[idx - 1];
      updated[idx - 1] = updated[idx];
      updated[idx] = temp;
      return updated;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === pages.length - 1) return;
    setPages(prev => {
      const updated = [...prev];
      const temp = updated[idx + 1];
      updated[idx + 1] = updated[idx];
      updated[idx] = temp;
      return updated;
    });
  };

  const activePages = pages.filter(p => !p.deleted);

  const downloadModifiedPdf = useCallback(async () => {
    if (!file || activePages.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);
    setStatusMsg("Initializing PDF engine...");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const outDoc = await PDFDocument.create();

      for (let i = 0; i < activePages.length; i++) {
        const pg = activePages[i];
        setStatusMsg(`Processing page ${i + 1} of ${activePages.length}...`);

        const [copiedPage] = await outDoc.copyPages(srcDoc, [pg.pageIndex]);

        if (pg.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pg.rotation));
        }

        outDoc.addPage(copiedPage);
      }

      setStatusMsg("Finalizing PDF...");
      const pdfBytes = await outDoc.save();

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const baseName = file.name.replace(/\.pdf$/i, "");
      link.download = `${baseName}_modified.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMsg("Modified PDF downloaded successfully!");
      setStatusMsg("");
    } catch (err: unknown) {
      console.error("PDF modify error:", err);
      setError("Failed to process PDF. Please verify the file is unencrypted.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, activePages]);

  const splitToZip = useCallback(async () => {
    if (!file || activePages.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);
    setStatusMsg("Preparing individual page exports...");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const JSZip = (await import("jszip")).default;

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const zip = new JSZip();

      for (let i = 0; i < activePages.length; i++) {
        const pg = activePages[i];
        setStatusMsg(`Exporting page ${i + 1} of ${activePages.length}...`);

        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [pg.pageIndex]);

        if (pg.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pg.rotation));
        }

        singleDoc.addPage(copiedPage);
        const pageBytes = await singleDoc.save();
        zip.file(`page_${String(i + 1).padStart(3, "0")}.pdf`, pageBytes);
      }

      setStatusMsg("Compressing ZIP archive...");
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      const baseName = file.name.replace(/\.pdf$/i, "");
      link.download = `${baseName}_split_pages.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMsg(`${activePages.length} pages exported as individual PDFs in a ZIP archive!`);
      setStatusMsg("");
    } catch (err: unknown) {
      console.error("PDF split error:", err);
      setError("Failed to split PDF pages. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, activePages]);

  const resetAll = () => {
    setFile(null);
    setPages([]);
    setError(null);
    setSuccessMsg(null);
    setStatusMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
            <div className="inline-block border-4 border-black bg-[#2A9D8F] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Visual Page Editor
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              PDF Page Manager
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Reorder, rotate, delete, or split individual pages from any PDF document.
              Visual thumbnails, drag-to-reorder, 100% offline in your browser.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="w-full max-w-5xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-10 mb-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Upload a PDF document to manage pages"
              className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-10 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center focus:outline-none focus:ring-4 focus:ring-black"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="pdf-page-manager-file-input"
                aria-label="Select PDF File"
              />
              <span className="text-6xl mb-4" aria-hidden="true">📑</span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] mb-2">
                {file ? file.name : "Select or Drop a PDF File"}
              </h2>
              <p className="text-sm font-bold text-[var(--text-soft)] uppercase tracking-wider mb-6">
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · ${pages.length} Pages`
                  : "Upload any standard PDF document"
                }
              </p>
              <span className="neo-button bg-[#2A9D8F] text-white font-black uppercase px-8 py-3 text-sm">
                {file ? "Change PDF" : "Choose PDF Document"}
              </span>
            </div>

            {(isLoading || (isProcessing && statusMsg)) && (
              <div className="mt-4 border-4 border-black bg-[var(--bg-page)] p-4 text-center font-black uppercase text-sm" role="status">
                ⏳ {statusMsg}
              </div>
            )}

            {error && (
              <div className="mt-4 border-4 border-black bg-[#E63946] text-white p-4 font-bold text-sm" role="alert">
                ⚠️ {error}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 border-4 border-black bg-[#2A9D8F] text-white p-6 text-center animate-fadeIn" role="status">
                <span className="text-3xl mb-2 block" aria-hidden="true">🎉</span>
                <h3 className="text-xl font-black uppercase tracking-tight mb-1">{successMsg}</h3>
              </div>
            )}
          </div>

          {/* Page Thumbnails & Actions */}
          {pages.length > 0 && !isLoading && (
            <div className="w-full max-w-5xl neo-panel bg-[var(--bg-panel)] p-6 sm:p-8 mb-8">
              {/* Stats & Action Bar */}
              <div className="border-4 border-black bg-[var(--bg-page)] p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase text-[var(--text-main)]">
                    Page Editor ({pages.length} Total · {activePages.length} Active)
                  </h3>
                  <p className="text-xs font-bold uppercase text-[var(--text-soft)] tracking-wider mt-1">
                    {pages.length - activePages.length > 0
                      ? `${pages.length - activePages.length} page(s) marked for deletion`
                      : "Click pages to reorder, rotate, or remove them"
                    }
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={downloadModifiedPdf}
                    disabled={isProcessing || activePages.length === 0}
                    className="neo-button bg-[#2A9D8F] text-white font-black uppercase px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-40"
                  >
                    📥 Download Modified PDF
                  </button>
                  <button
                    onClick={splitToZip}
                    disabled={isProcessing || activePages.length === 0}
                    className="neo-button bg-[#457B9D] text-white font-black uppercase px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-40"
                  >
                    📦 Split Pages to ZIP
                  </button>
                  <button
                    onClick={resetAll}
                    disabled={isProcessing}
                    className="neo-button bg-[#E63946] text-white font-black uppercase px-6 py-2.5 text-sm disabled:opacity-40"
                  >
                    ✕ Reset
                  </button>
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((pg, idx) => (
                  <div
                    key={`page-${pg.pageIndex}-${idx}`}
                    className={`border-3 border-black bg-[var(--bg-page)] p-3 flex flex-col items-center gap-2 relative transition-all ${pg.deleted ? "opacity-40" : ""}`}
                  >
                    {/* Page Number Badge */}
                    <div className="absolute top-1 left-1 bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase z-10">
                      #{idx + 1}
                    </div>

                    {/* Deleted Overlay */}
                    {pg.deleted && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="bg-[#E63946] text-white px-3 py-1 text-xs font-black uppercase rotate-[-12deg] border-2 border-black shadow-[3px_3px_0_0_#000]">
                          Removed
                        </div>
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div
                      className="w-full aspect-[3/4] border-2 border-black bg-white overflow-hidden flex items-center justify-center"
                      style={{ transform: `rotate(${pg.rotation}deg)` }}
                    >
                      {pg.thumbnailUrl ? (
                        <img
                          src={pg.thumbnailUrl}
                          alt={`Page ${pg.pageIndex + 1} thumbnail`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl" aria-hidden="true">📄</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 w-full justify-center flex-wrap">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase disabled:opacity-30 hover:bg-[#457B9D]"
                        title="Move Up"
                        aria-label={`Move page ${idx + 1} up`}
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === pages.length - 1}
                        className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase disabled:opacity-30 hover:bg-[#457B9D]"
                        title="Move Down"
                        aria-label={`Move page ${idx + 1} down`}
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => rotatePage(idx)}
                        className="bg-[#F77F00] text-white px-2 py-1 text-[10px] font-black uppercase hover:bg-[#E76F51]"
                        title={`Rotate (currently ${pg.rotation}°)`}
                        aria-label={`Rotate page ${idx + 1}`}
                      >
                        ↻ {pg.rotation > 0 ? `${pg.rotation}°` : ""}
                      </button>
                      <button
                        onClick={() => toggleDelete(idx)}
                        className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black ${pg.deleted ? "bg-[#2A9D8F] text-white" : "bg-[#E63946] text-white"}`}
                        title={pg.deleted ? "Restore Page" : "Delete Page"}
                        aria-label={pg.deleted ? `Restore page ${idx + 1}` : `Delete page ${idx + 1}`}
                      >
                        {pg.deleted ? "↩ Undo" : "✕"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> All page operations execute entirely inside browser memory. Zero document data is uploaded to servers.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
