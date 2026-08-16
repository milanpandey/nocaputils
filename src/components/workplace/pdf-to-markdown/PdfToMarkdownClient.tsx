"use client";

import { useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type PdfType = "TextBased" | "Scanned" | "ImageBased" | "Mixed" | null;
type ViewMode = "preview" | "source" | "split";

const PDF_TYPE_COLORS: Record<NonNullable<PdfType>, string> = {
  TextBased: "#54d88d",
  Scanned: "#E76F51",
  ImageBased: "#F4A261",
  Mixed: "#457B9D",
};

const PDF_TYPE_LABELS: Record<NonNullable<PdfType>, string> = {
  TextBased: "✅ Text-Based — Full Markdown extraction",
  Scanned: "🖼️ Scanned — OCR needed for full text",
  ImageBased: "🖼️ Image-Based — No extractable text",
  Mixed: "⚡ Mixed — Partial extraction",
};

export default function PdfToMarkdownClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [pdfType, setPdfType] = useState<PdfType>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf") && selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setMarkdown(null);
    setPdfType(null);
    setConfidence(null);
    setRenderedHtml("");
    setIsProcessing(true);
    setStatusMsg("Loading PDF inspector (WASM)…");

    try {
      const wasmModule = await import("@firecrawl/pdf-inspector-wasm");
      await wasmModule.default();

      setStatusMsg("Reading PDF bytes…");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      setStatusMsg("Classifying & extracting Markdown…");
      const result = wasmModule.processPdf(pdfBytes);

      const detectedType = result.pdfType as PdfType;
      setPdfType(detectedType);
      setConfidence(result.confidence ?? null);

      const md = result.markdown ?? "";
      setMarkdown(md);

      if (md) {
        setStatusMsg("Rendering preview…");
        const { marked } = await import("marked");
        const html = await marked(md);
        setRenderedHtml(html);
      }

      setStatusMsg("");
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to process PDF. The file may be encrypted, corrupted, or purely scanned.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleCopy = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const baseName = file?.name.replace(/\.pdf$/i, "") ?? "document";
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeColor = pdfType ? PDF_TYPE_COLORS[pdfType] : "#666";

  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/workplaceutilities", label: "← Workplace Utilities" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          {/* Hero */}
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">PDF to</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Markdown
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Local", "No Uploads", "Tables & Headings", "Privacy First"].map((label) => (
                <div
                  key={label}
                  className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  {label}
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-xl font-medium leading-9 text-[var(--text-soft)]">
              Extract clean Markdown from text-based PDFs — tables, headings, lists, bold & italic. Powered by Firecrawl pdf-inspector WASM.
            </p>
          </section>

          {/* Upload Zone */}
          <section className="mb-8 w-full max-w-3xl">
            <div
              className={`w-full border-4 border-dashed border-[var(--border-main)] flex flex-col items-center justify-center p-12 bg-[var(--bg-panel)] transition-all cursor-pointer shadow-[8px_8px_0_0_var(--border-main)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--border-main)] ${
                isDragging ? "bg-[var(--accent)]/10" : ""
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileInput}
                id="pdf-upload"
              />
              <div className="text-6xl mb-4">{isProcessing ? "⏳" : "📄"}</div>
              {isProcessing ? (
                <>
                  <span className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)]">{statusMsg}</span>
                  <div className="mt-4 h-2 w-64 bg-[var(--bg-panel-muted)] border-2 border-[var(--border-main)]">
                    <div className="h-full bg-[var(--accent)] animate-pulse" style={{ width: "60%" }} />
                  </div>
                </>
              ) : file && !error ? (
                <>
                  <span className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)]">{file.name}</span>
                  <span className="text-sm font-bold mt-2 uppercase tracking-widest text-[var(--text-soft)]">Click or drop another PDF to replace</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black uppercase tracking-tighter text-[var(--text-main)]">Drop a PDF here</span>
                  <span className="text-sm font-bold mt-2 uppercase tracking-widest text-[var(--text-soft)]">or click to browse</span>
                  <span className="text-xs font-bold mt-1 uppercase tracking-widest text-[var(--text-soft)]">Works best with text-based PDFs (reports, papers, docs)</span>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 border-l-8 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-700 dark:text-red-400 text-sm font-black uppercase">
                ⚠️ {error}
              </div>
            )}
          </section>

          {/* Results */}
          {markdown !== null && (
            <section className="w-full max-w-7xl">
              {/* PDF Type Badge */}
              {pdfType && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex items-center border-4 border-[var(--border-main)] px-4 py-1.5 text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_var(--border-main)]"
                    style={{ background: typeColor }}
                  >
                    {PDF_TYPE_LABELS[pdfType]}
                  </span>
                  {confidence !== null && (
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--text-soft)]">
                      Confidence: <strong>{Math.round(confidence * 100)}%</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Toolbar */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex border-4 border-[var(--border-main)] overflow-hidden shadow-[4px_4px_0_0_var(--border-main)]">
                  {(["split", "preview", "source"] as ViewMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-5 py-2 text-sm font-black uppercase tracking-widest transition-colors border-r-4 border-[var(--border-main)] last:border-r-0 ${
                        viewMode === m
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-muted)]"
                      }`}
                    >
                      {m === "split" ? "Split" : m === "preview" ? "Preview" : "Markdown"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="neo-button neo-button-theme px-5 py-2 text-sm font-black uppercase tracking-widest"
                    disabled={!markdown}
                    id="copy-markdown-btn"
                  >
                    {copied ? "✓ Copied!" : "Copy Markdown"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="neo-button bg-[var(--accent)] text-black px-5 py-2 text-sm font-black uppercase tracking-widest"
                    disabled={!markdown}
                    id="download-markdown-btn"
                  >
                    Download .md
                  </button>
                </div>
              </div>

              {markdown === "" ? (
                <div className="neo-panel bg-[var(--bg-panel)] p-8 text-center">
                  <p className="text-5xl mb-3">🖼️</p>
                  <p className="font-black text-xl uppercase tracking-widest">No extractable text found.</p>
                  <p className="text-sm font-bold mt-2 uppercase tracking-widest text-[var(--text-soft)]">This PDF appears to be scanned or image-based. OCR would be required.</p>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${viewMode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}
                  style={{ minHeight: "500px" }}
                >
                  {/* Source pane */}
                  {(viewMode === "source" || viewMode === "split") && (
                    <div className="flex flex-col neo-panel overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--text-soft)] border-b-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                        <span>Markdown Source</span>
                        <span className="ml-auto">{markdown.length.toLocaleString()} chars</span>
                      </div>
                      <textarea
                        className="flex-1 resize-none p-4 font-mono text-sm bg-transparent outline-none"
                        value={markdown}
                        readOnly
                        style={{ minHeight: "480px" }}
                      />
                    </div>
                  )}

                  {/* Preview pane */}
                  {(viewMode === "preview" || viewMode === "split") && (
                    <div className="flex flex-col neo-panel overflow-hidden">
                      <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--text-soft)] border-b-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                        Rendered Preview
                      </div>
                      <div
                        className="flex-1 overflow-auto p-5 md-preview"
                        style={{ minHeight: "480px" }}
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
