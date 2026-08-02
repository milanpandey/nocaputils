"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  pageCount: number;
  previewUrl: string;
}

export default function PdfMergeClient() {
  const [pdfItems, setPdfItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Sub-action / Compression Settings
  const [enableCompression, setEnableCompression] = useState(false);
  const [compressionPreset, setCompressionPreset] = useState<"original" | "balanced" | "max">("balanced");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (fileArray.length === 0) {
      setError("Invalid file selection. Please select valid Microsoft PDF documents (.pdf).");
      return;
    }

    if (pdfItems.length + fileArray.length > 5) {
      setError("Maximum limit is 5 PDF files per merge operation.");
    }

    const availableSlots = 5 - pdfItems.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    setIsProcessing(true);
    setError(null);
    setStatusMsg(`Loading ${filesToProcess.length} PDF file(s)...`);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const newItems: PdfFileItem[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setStatusMsg(`Analyzing page structure & preview for ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdfDoc.numPages;

        let previewUrl = "";
        try {
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            await (page as unknown as { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } })
              .render({ canvasContext: ctx, viewport }).promise;
            previewUrl = canvas.toDataURL("image/jpeg", 0.8);
          }
        } catch (e) {
          console.warn("Page preview generation skipped:", e);
        }

        newItems.push({
          id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          file,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          sizeBytes: file.size,
          pageCount,
          previewUrl,
        });
      }

      setPdfItems(prev => [...prev, ...newItems]);
      setStatusMsg("");
    } catch (err: unknown) {
      console.error("PDF upload error:", err);
      setError("Failed to process PDF document. Please verify files are unencrypted.");
    } finally {
      setIsProcessing(false);
    }
  }, [pdfItems]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    setHasUserEdited(true);
    setPdfItems(prev => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index === pdfItems.length - 1) return;
    setHasUserEdited(true);
    setPdfItems(prev => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setHasUserEdited(true);
    setPdfItems(prev => prev.filter(item => item.id !== id));
  };

  const totalPages = pdfItems.reduce((sum, item) => sum + item.pageCount, 0);
  const totalSizeBytes = pdfItems.reduce((sum, item) => sum + item.sizeBytes, 0);

  const estimatedFinalSizeBytes = enableCompression
    ? Math.round(totalSizeBytes * (compressionPreset === "max" ? 0.35 : compressionPreset === "balanced" ? 0.55 : 0.80))
    : totalSizeBytes;

  const mergePdfs = useCallback(async () => {
    if (pdfItems.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setStatusMsg("Initializing PDF consolidation engine...");

    try {
      const { PDFDocument } = await import("pdf-lib");
      const mergedPdf = await PDFDocument.create();

      if (enableCompression) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const scale = compressionPreset === "max" ? 1.0 : compressionPreset === "balanced" ? 1.4 : 1.8;
        const jpgQuality = compressionPreset === "max" ? 0.55 : compressionPreset === "balanced" ? 0.75 : 0.88;

        let processedPages = 0;
        for (const item of pdfItems) {
          const buffer = await item.file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;

          for (let p = 1; p <= pdfDoc.numPages; p++) {
            processedPages++;
            setStatusMsg(`Compressing & merging page ${processedPages} of ${totalPages}...`);
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
              const embeddedJpg = await mergedPdf.embedJpg(jpgImageBytes);

              const newPage = mergedPdf.addPage([viewport.width / scale, viewport.height / scale]);
              newPage.drawImage(embeddedJpg, {
                x: 0,
                y: 0,
                width: viewport.width / scale,
                height: viewport.height / scale,
              });
            }
          }
        }
      } else {
        for (let i = 0; i < pdfItems.length; i++) {
          const item = pdfItems[i];
          setStatusMsg(`Merging file ${i + 1} of ${pdfItems.length}: ${item.name}...`);
          const fileBuffer = await item.file.arrayBuffer();
          const pdf = await PDFDocument.load(fileBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach(page => mergedPdf.addPage(page));
        }
      }

      setStatusMsg("Finalizing consolidated PDF document...");
      const mergedPdfBytes = await mergedPdf.save();

      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Merged_Document_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setStatusMsg("");
    } catch (err: unknown) {
      console.error("PDF Merge error:", err);
      setError("Failed to merge PDF documents. Please verify files are unencrypted.");
    } finally {
      setIsProcessing(false);
    }
  }, [pdfItems, enableCompression, compressionPreset, totalPages]);

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
            <div className="inline-block border-4 border-black bg-[#457B9D] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Enterprise Document Consolidation
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              PDF Merge
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Combine up to 5 PDF files into a single consolidated document. Reorder files in your exact sequence and toggle size compression options.
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
              aria-label="Upload PDF files to merge (Up to 5 files)"
              className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-8 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center focus:outline-none focus:ring-4 focus:ring-black"
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="application/pdf,.pdf"
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                className="hidden"
                id="pdf-merge-file-input"
                aria-label="Select PDF files to merge"
              />
              <span className="text-5xl mb-3" aria-hidden="true">📑</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1">
                Upload PDFs to Merge (Up to 5 Files)
              </h2>
              <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-4">
                Drag &amp; drop PDF documents or click to browse
              </p>
              <span className="neo-button bg-[#457B9D] text-white font-black uppercase px-6 py-2.5 text-sm">
                + Add PDF Files ({pdfItems.length}/5 uploaded)
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

          {pdfItems.length > 0 && (
            <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-6 sm:p-8 mb-12">
              <div className="border-4 border-black bg-[var(--bg-page)] p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black uppercase text-[var(--text-main)]">
                      Merge Queue ({pdfItems.length} Files)
                    </h3>
                    {hasUserEdited && (
                      <div className="flex items-center gap-2 bg-black text-white px-3 py-1 border-2 border-black text-[11px] font-black uppercase tracking-wider" role="status">
                        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
                        </span>
                        <span>Live Sync Active</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase text-[var(--text-soft)] tracking-wider mt-1">
                    Total Pages: <strong>{totalPages}</strong> | Input Size: <strong>{formatFileSize(totalSizeBytes)}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={mergePdfs}
                    disabled={isProcessing}
                    aria-label="Download consolidated merged PDF document"
                    className="neo-button bg-[#E63946] text-white font-black uppercase px-8 py-3 text-base flex items-center gap-2"
                  >
                    <span>📥 Download Merged PDF</span>
                  </button>
                  <span className="text-[11px] font-black uppercase text-[#2A9D8F]">
                    Estimated Output Size: ~{formatFileSize(estimatedFinalSizeBytes)}
                  </span>
                </div>
              </div>

              <div className="border-3 border-black bg-[var(--bg-page)] p-5 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="enable-compression-check" className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="enable-compression-check"
                      checked={enableCompression}
                      onChange={(e) => {
                        setEnableCompression(e.target.checked);
                        setHasUserEdited(true);
                      }}
                      className="w-5 h-5 accent-[#457B9D] border-2 border-black focus:ring-2 focus:ring-black"
                    />
                    <span className="text-sm font-black uppercase text-[var(--text-main)]">
                      Enable File Compression Sub-Action
                    </span>
                  </label>

                  <span className="text-[10px] font-black uppercase bg-[#457B9D] text-white px-2 py-0.5">
                    {enableCompression ? "Compression Active" : "Uncompressed Vector Mode"}
                  </span>
                </div>

                {enableCompression && (
                  <div className="mt-4 pt-4 border-t-2 border-black grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      onClick={() => { setCompressionPreset("original"); setHasUserEdited(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setCompressionPreset("original"); setHasUserEdited(true); } }}
                      tabIndex={0}
                      role="button"
                      aria-label="Select High Quality compression preset"
                      className={`p-3 border-2 border-black cursor-pointer ${compressionPreset === "original" ? "bg-[#457B9D] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                    >
                      <h4 className="font-black text-xs uppercase">High Quality</h4>
                      <p className="text-[11px] font-bold mt-1 opacity-90">1.8x Scale · 88% Quality · Best for Printing</p>
                    </div>

                    <div
                      onClick={() => { setCompressionPreset("balanced"); setHasUserEdited(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setCompressionPreset("balanced"); setHasUserEdited(true); } }}
                      tabIndex={0}
                      role="button"
                      aria-label="Select Balanced compression preset"
                      className={`p-3 border-2 border-black cursor-pointer ${compressionPreset === "balanced" ? "bg-[#2A9D8F] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                    >
                      <h4 className="font-black text-xs uppercase">Balanced (Recommended)</h4>
                      <p className="text-[11px] font-bold mt-1 opacity-90">1.4x Scale · 75% Quality · Ideal Email Attachment</p>
                    </div>

                    <div
                      onClick={() => { setCompressionPreset("max"); setHasUserEdited(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setCompressionPreset("max"); setHasUserEdited(true); } }}
                      tabIndex={0}
                      role="button"
                      aria-label="Select Max Compression preset"
                      className={`p-3 border-2 border-black cursor-pointer ${compressionPreset === "max" ? "bg-[#E63946] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                    >
                      <h4 className="font-black text-xs uppercase">Max Compression</h4>
                      <p className="text-[11px] font-bold mt-1 opacity-90">1.0x Scale · 55% Quality · Smallest File (~70% reduction)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-black uppercase text-[var(--text-main)] tracking-wider">
                  Set Merge Sequence (Order Top to Bottom):
                </h4>

                {pdfItems.map((item, idx) => (
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
                          className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase disabled:opacity-30 hover:bg-[#457B9D] focus:ring-2 focus:ring-white"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === pdfItems.length - 1}
                          aria-label={`Move ${item.name} down in merge queue`}
                          className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase disabled:opacity-30 hover:bg-[#457B9D] focus:ring-2 focus:ring-white"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="w-12 h-16 border-2 border-black bg-black overflow-hidden flex items-center justify-center shrink-0">
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt={`Thumbnail preview of ${item.name}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs" aria-hidden="true">📄</span>
                        )}
                      </div>

                      <div>
                        <span className="bg-black text-[#FFF] px-2 py-0.5 text-[10px] font-black uppercase mr-2">
                          #{idx + 1}
                        </span>
                        <span className="font-black text-sm text-[var(--text-main)] break-all">
                          {item.name}
                        </span>
                        <div className="text-xs font-bold text-[var(--text-soft)] uppercase mt-0.5">
                          {item.pageCount} Page(s) · {item.sizeFormatted}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from queue`}
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
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> PDF merging and page copy operations execute strictly inside browser memory. Zero server uploads.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
