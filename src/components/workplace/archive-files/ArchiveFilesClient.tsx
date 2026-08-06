"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import JSZip from "jszip";

export interface ArchiveFileItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  type: string;
}

export default function ArchiveFilesClient() {
  const [fileItems, setFileItems] = useState<ArchiveFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [compressionPreset, setCompressionPreset] = useState<"STORE" | "DEFLATE_STD" | "DEFLATE_MAX">("DEFLATE_STD");
  const [customArchiveName, setCustomArchiveName] = useState<string>("Workplace_Archive");

  const [resultStats, setResultStats] = useState<{
    originalBytes: number;
    zippedBytes: number;
    downloadUrl: string;
    filename: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFilesUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (fileItems.length + fileArray.length > 10) {
      setError("Maximum batch limit is 10 files per archive.");
    }

    const availableSlots = 10 - fileItems.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    const newItems: ArchiveFileItem[] = filesToProcess.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      file,
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
      sizeBytes: file.size,
      type: file.type || "binary/file",
    }));

    setFileItems(prev => [...prev, ...newItems]);
    setError(null);
    setResultStats(null);
  }, [fileItems]);

  const removeItem = (id: string) => {
    setFileItems(prev => prev.filter(item => item.id !== id));
    setResultStats(null);
  };

  const totalInputBytes = fileItems.reduce((sum, item) => sum + item.sizeBytes, 0);

  const estimatedReductionPct = compressionPreset === "DEFLATE_MAX" ? 25 : compressionPreset === "DEFLATE_STD" ? 18 : 0;
  const estimatedArchiveBytes = Math.round(totalInputBytes * (1 - estimatedReductionPct / 100));

  const createZipArchive = useCallback(async () => {
    if (fileItems.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setStatusMsg("Initializing ZIP Archiver Engine...");

    try {
      const zip = new JSZip();

      for (let i = 0; i < fileItems.length; i++) {
        const item = fileItems[i];
        setStatusMsg(`Adding file ${i + 1} of ${fileItems.length}: ${item.name}...`);
        const fileData = await item.file.arrayBuffer();
        zip.file(item.name, fileData);
      }

      setStatusMsg("Compressing files & packaging ZIP stream...");

      const compressionMethod = compressionPreset === "STORE" ? "STORE" : "DEFLATE";
      const compressionOptions = compressionPreset === "DEFLATE_MAX"
        ? { level: 9 }
        : compressionPreset === "DEFLATE_STD"
        ? { level: 6 }
        : undefined;

      const content = await zip.generateAsync(
        {
          type: "blob",
          compression: compressionMethod,
          compressionOptions,
        },
        (metadata) => {
          setStatusMsg(`Archiving progress: ${Math.round(metadata.percent)}%...`);
        }
      );

      const downloadUrl = URL.createObjectURL(content);
      const filename = `${customArchiveName.trim() || "Workplace_Archive"}.zip`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.click();

      setResultStats({
        originalBytes: totalInputBytes,
        zippedBytes: content.size,
        downloadUrl,
        filename,
      });

      setStatusMsg("");
    } catch (err: unknown) {
      console.error("ZIP Archive error:", err);
      setError("Failed to create ZIP archive. Please check file integrity.");
    } finally {
      setIsProcessing(false);
    }
  }, [fileItems, compressionPreset, customArchiveName, totalInputBytes]);

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
            <div className="inline-block border-4 border-black bg-[#FFB703] px-4 py-1 text-black text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Enterprise Portable Archiver
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              Archive Files
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Package up to 10 files into a standard portable ZIP archive with zero quality loss. Custom compression levels and real-time size estimators.
            </p>
          </div>

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-4 sm:p-6 mb-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFilesUpload(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Upload files to archive into ZIP (Up to 10 files)"
              className={`border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center focus:outline-none focus:ring-4 focus:ring-black ${fileItems.length > 0 ? "p-4 sm:p-5" : "p-8"}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                className="hidden"
                id="archive-files-input"
                aria-label="Select Files to Archive"
              />
              <span className={fileItems.length > 0 ? "text-3xl mb-1" : "text-5xl mb-3"} aria-hidden="true">🗂️</span>
              <h2 className={fileItems.length > 0 ? "text-base font-black uppercase text-[var(--text-main)] mb-0.5" : "text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1"}>
                {fileItems.length > 0 ? `Archive Queue (${fileItems.length}/10 Files Uploaded)` : "Upload Files to Archive (Up to 10 Files)"}
              </h2>
              <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-3">
                {fileItems.length > 0 ? `Total Raw Size: ${formatFileSize(totalInputBytes)}` : "Drag & drop PDFs, documents, spreadsheets, images, or click to browse"}
              </p>
              <span className="neo-button bg-[#FFB703] text-black font-black uppercase px-5 py-2 text-xs">
                + Add More Files ({fileItems.length}/10)
              </span>
            </div>

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

          {fileItems.length > 0 && (
            <div className="w-full max-w-4xl flex flex-col gap-6 mb-12">
              {/* ── Top CTA Row: Create ZIP Archive ── */}
              <div className="neo-panel bg-[var(--bg-panel)] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] block">
                    {fileItems.length} Files Selected · Raw: {formatFileSize(totalInputBytes)}
                  </span>
                  <p className="text-sm font-extrabold text-[var(--text-main)] uppercase mt-0.5">
                    Est. ZIP Size: <strong className="text-[#FFB703]">~{formatFileSize(estimatedArchiveBytes)}</strong> ({compressionPreset === "STORE" ? "STORE / No Compression" : compressionPreset === "DEFLATE_MAX" ? "MAX Level 9" : "DEFLATE Level 6"})
                  </p>
                </div>
                <button
                  onClick={createZipArchive}
                  disabled={isProcessing}
                  aria-label="Download ZIP Archive File"
                  className="neo-button bg-[#FFB703] text-black font-black uppercase px-8 py-3.5 text-base sm:text-lg flex-shrink-0 w-full sm:w-auto"
                >
                  🗂️ Create &amp; Download ZIP
                </button>
              </div>

              {resultStats && (
                <div className="neo-panel bg-[var(--bg-panel)] border-4 border-black p-6 animate-fadeIn" role="status">
                  <div className="border-3 border-black bg-[#2A9D8F] text-white p-3 text-center mb-5 flex items-center justify-center gap-2">
                    <span className="text-2xl" aria-hidden="true">🎉</span>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white">
                      ZIP Archive Created Successfully!
                    </h4>
                  </div>

                  {/* ── Stats Cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-center">
                    <div className="border-2 border-black bg-[var(--bg-page)] p-3">
                      <span className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-0.5">Original Total Size</span>
                      <span className="text-base font-black text-[var(--text-main)] block">{formatFileSize(resultStats.originalBytes)}</span>
                    </div>

                    <div className="border-2 border-black bg-[var(--bg-page)] p-3">
                      <span className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-0.5">Compressed ZIP Size</span>
                      <span className="text-base font-black text-[#2A9D8F] block">{formatFileSize(resultStats.zippedBytes)}</span>
                    </div>

                    <div className="border-2 border-black bg-[var(--bg-page)] p-3">
                      <span className="text-[10px] font-black uppercase text-[var(--text-soft)] block mb-0.5">Total Reduction</span>
                      <span className="text-base font-black text-[#E63946] block">
                        -{Math.max(0, Math.round((1 - resultStats.zippedBytes / resultStats.originalBytes) * 100))}% ({formatFileSize(Math.max(0, resultStats.originalBytes - resultStats.zippedBytes))})
                      </span>
                    </div>
                  </div>

                  {/* ── Editable Archive Filename ── */}
                  <div className="mb-5">
                    <label htmlFor="export-zip-filename" className="block text-xs font-black uppercase tracking-wider text-[var(--text-main)] mb-1.5">
                      Export Archive Filename (.zip):
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl flex-shrink-0" aria-hidden="true">📦</span>
                      <input
                        type="text"
                        id="export-zip-filename"
                        value={customArchiveName}
                        onChange={(e) => setCustomArchiveName(e.target.value)}
                        placeholder="Workplace_Archive"
                        aria-label="Editable Export Archive Filename"
                        className="w-full border-3 border-black bg-[var(--bg-page)] text-[var(--text-main)] font-black text-sm px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <a
                      href={resultStats.downloadUrl}
                      download={`${customArchiveName.trim() || "Workplace_Archive"}.zip`}
                      className="neo-button bg-[#FFB703] text-black font-black uppercase px-8 py-3 text-base inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <span>📥</span> Download {customArchiveName.trim() || "Workplace_Archive"}.zip
                    </a>
                  </div>
                </div>
              )}

              {/* ── Archival Options & Files List ── */}
              <div className="neo-panel bg-[var(--bg-panel)] p-5 sm:p-6">
                <div className="border-3 border-black bg-[var(--bg-page)] p-4 sm:p-5 mb-6">
                  <div className="mb-4">
                    <label htmlFor="custom-archive-name-input" className="text-xs font-black uppercase text-[var(--text-main)] block mb-1">
                      Archive File Name (.zip)
                    </label>
                    <input
                      id="custom-archive-name-input"
                      type="text"
                      value={customArchiveName}
                      onChange={(e) => setCustomArchiveName(e.target.value)}
                      className="w-full border-2 border-black p-2.5 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)] focus:ring-2 focus:ring-black"
                      placeholder="e.g. Workplace_Archive"
                    />
                  </div>

                  <label className="text-xs font-black uppercase text-[var(--text-main)] block mb-2">
                    Select Archival &amp; Compression Level Tradeoff:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      onClick={() => setCompressionPreset("STORE")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionPreset("STORE"); }}
                      tabIndex={0}
                      role="button"
                      aria-label="Select STORE compression option"
                      className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionPreset === "STORE" ? "bg-[#FFB703] text-black" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                    >
                      <h4 className="font-black text-xs uppercase">STORE (No Compression)</h4>
                      <p className="text-[10px] font-bold mt-1 opacity-90">Instant Packaging · 0% CPU · Binary Preservation</p>
                    </div>

                    <div
                      onClick={() => setCompressionPreset("DEFLATE_STD")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionPreset("DEFLATE_STD"); }}
                      tabIndex={0}
                      role="button"
                      aria-label="Select DEFLATE Standard compression option"
                      className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionPreset === "DEFLATE_STD" ? "bg-[#2A9D8F] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                    >
                      <h4 className="font-black text-xs uppercase">DEFLATE Standard (Recommended)</h4>
                      <p className="text-[10px] font-bold mt-1 opacity-90">Level 6 · ~15-25% Reduction · Universal Portability</p>
                    </div>

                    <div
                      onClick={() => setCompressionPreset("DEFLATE_MAX")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCompressionPreset("DEFLATE_MAX"); }}
                      tabIndex={0}
                      role="button"
                      aria-label="Select MAX Compression option"
                      className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionPreset === "DEFLATE_MAX" ? "bg-[#E63946] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                    >
                      <h4 className="font-black text-xs uppercase">MAX Compression</h4>
                      <p className="text-[10px] font-bold mt-1 opacity-90">Level 9 · Highest Compression Ratio · Smallest ZIP</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider">
                    Files Included in Archive ({fileItems.length}/10):
                  </h4>

                  {fileItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="border-2 border-black bg-[var(--bg-page)] p-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--text-soft)] uppercase">
                            {item.sizeFormatted} · {item.type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name} from archive queue`}
                        className="text-xs font-black uppercase bg-[#E63946] text-white px-2.5 py-1 border-2 border-black hover:bg-black flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> File packaging and ZIP archiving execute locally inside browser memory. Zero server uploads.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
