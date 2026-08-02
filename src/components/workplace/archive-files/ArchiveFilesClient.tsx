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

  // Archive & Compression Options
  const [compressionPreset, setCompressionPreset] = useState<"STORE" | "DEFLATE_STD" | "DEFLATE_MAX">("DEFLATE_STD");
  const [customArchiveName, setCustomArchiveName] = useState<string>("Workplace_Archive");

  // Result Stats
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

  // Dynamic Size Estimator Math
  const estimatedReductionPct = compressionPreset === "DEFLATE_MAX" ? 25 : compressionPreset === "DEFLATE_STD" ? 18 : 0;
  const estimatedArchiveBytes = Math.round(totalInputBytes * (1 - estimatedReductionPct / 100));

  // Create ZIP Archive using JSZip
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

      setResultStats({
        originalBytes: totalInputBytes,
        zippedBytes: content.size,
        downloadUrl,
        filename,
      });

      setStatusMsg("");
    } catch (err: unknown) {
      console.error("ZIP Archive error:", err);
      setError("Failed to create ZIP archive. Please check files.");
    } finally {
      setIsProcessing(false);
    }
  }, [fileItems, compressionPreset, customArchiveName, totalInputBytes]);

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
            <div className="inline-block border-4 border-black bg-[#FFB703] px-4 py-1 text-black text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Universal Portable Archiver
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              Archive Files
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Package up to 10 files into a standard portable ZIP archive with zero quality loss. Custom compression levels and real-time size estimators.
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-10 mb-8">
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
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                className="hidden"
              />
              <span className="text-5xl mb-3">🗂️</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-1">
                Upload Files to Archive (Up to 10 Files)
              </h2>
              <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-4">
                Drag &amp; drop PDFs, documents, spreadsheets, images, or click to browse
              </p>
              <span className="neo-button bg-[#FFB703] text-black font-black uppercase px-6 py-2.5 text-sm">
                + Select Files ({fileItems.length}/10 uploaded)
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

          {/* Archival Workspace & Options */}
          {fileItems.length > 0 && (
            <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-6 sm:p-8 mb-12">
              <div className="border-4 border-black bg-[var(--bg-page)] p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase text-[var(--text-main)]">
                    Archive Queue ({fileItems.length} Files)
                  </h3>
                  <p className="text-xs font-bold uppercase text-[var(--text-soft)] tracking-wider mt-1">
                    Combined Input Size: <strong>{formatFileSize(totalInputBytes)}</strong> | Estimated ZIP Size: <strong className="text-[#FFB703]">~{formatFileSize(estimatedArchiveBytes)}</strong>
                  </p>
                </div>

                <button
                  onClick={createZipArchive}
                  disabled={isProcessing}
                  className="neo-button bg-[#FFB703] text-black font-black uppercase px-8 py-3 text-base flex items-center gap-2"
                >
                  <span>🗂️ Download ZIP Archive</span>
                </button>
              </div>

              {/* Archive Name & Compression Preset Tradeoffs */}
              <div className="border-3 border-black bg-[var(--bg-page)] p-5 mb-8">
                <div className="mb-4">
                  <label className="text-xs font-black uppercase text-[var(--text-main)] block mb-1">
                    Archive File Name (.zip)
                  </label>
                  <input
                    type="text"
                    value={customArchiveName}
                    onChange={(e) => setCustomArchiveName(e.target.value)}
                    className="w-full border-2 border-black p-2.5 font-bold text-sm bg-[var(--bg-panel)] text-[var(--text-main)]"
                    placeholder="e.g. Workplace_Archive"
                  />
                </div>

                <label className="text-xs font-black uppercase text-[var(--text-main)] block mb-2">
                  Select Archival &amp; Compression Level Tradeoff:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    onClick={() => setCompressionPreset("STORE")}
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionPreset === "STORE" ? "bg-[#FFB703] text-black" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                  >
                    <h4 className="font-black text-xs uppercase">STORE (No Compression)</h4>
                    <p className="text-[11px] font-bold mt-1 opacity-90">Instant Packaging · 0% CPU Overhead · 100% Binary Preservation</p>
                  </div>

                  <div
                    onClick={() => setCompressionPreset("DEFLATE_STD")}
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionPreset === "DEFLATE_STD" ? "bg-[#2A9D8F] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                  >
                    <h4 className="font-black text-xs uppercase">DEFLATE Standard (Recommended)</h4>
                    <p className="text-[11px] font-bold mt-1 opacity-90">Level 6 · ~15-25% Size Reduction · Universal OS Portability</p>
                  </div>

                  <div
                    onClick={() => setCompressionPreset("DEFLATE_MAX")}
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${compressionPreset === "DEFLATE_MAX" ? "bg-[#E63946] text-white" : "bg-[var(--bg-panel)] text-[var(--text-main)]"}`}
                  >
                    <h4 className="font-black text-xs uppercase">MAX Compression</h4>
                    <p className="text-[11px] font-bold mt-1 opacity-90">Level 9 · Highest Compression Ratio · Email Attachment Efficient</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-black text-[11px] font-bold text-[var(--text-soft)] uppercase flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    <strong>Portability Notice:</strong> Standard ZIP format is natively supported by Windows, macOS, iOS, Android, and all email clients without requiring third-party software.
                  </span>
                </div>
              </div>

              {/* Uploaded File List */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-black uppercase text-[var(--text-main)] tracking-wider">
                  Files Included in Archive:
                </h4>

                {fileItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="border-2 border-black bg-[var(--bg-page)] p-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-black text-sm text-[var(--text-main)] break-all block">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--text-soft)] uppercase">
                          {item.sizeFormatted} · {item.type}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-black uppercase bg-[#E63946] text-white px-3 py-1 border-2 border-black hover:bg-black"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Results Banner & Download */}
              {resultStats && (
                <div className="mt-8 border-4 border-black bg-[#2A9D8F] text-white p-6 text-center animate-fadeIn">
                  <span className="text-3xl mb-2 block">🎉</span>
                  <h4 className="text-2xl font-black uppercase tracking-tight mb-1">
                    ZIP Archive Created Successfully!
                  </h4>
                  <p className="text-sm font-bold uppercase tracking-wider mb-4">
                    Original Files Total: {formatFileSize(resultStats.originalBytes)} ➔ Final ZIP Archive: <strong>{formatFileSize(resultStats.zippedBytes)}</strong>
                    <br />
                    Saved {Math.max(0, Math.round((1 - resultStats.zippedBytes / resultStats.originalBytes) * 100))}% ({formatFileSize(Math.max(0, resultStats.originalBytes - resultStats.zippedBytes))} saved)
                  </p>
                  <a
                    href={resultStats.downloadUrl}
                    download={resultStats.filename}
                    className="neo-button bg-black text-white font-black uppercase px-8 py-3 text-base inline-block"
                  >
                    📥 Download {resultStats.filename}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>100% Private Processing:</strong> File packaging and ZIP archiving execute locally inside your browser memory. Zero server uploads.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
