"use client";

import { useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type ViewMode = "preview" | "source" | "split";

/* ------------------------------------------------------------------ */
/*  Text extraction + Markdown conversion using pdfjs-dist             */
/* ------------------------------------------------------------------ */

interface TextItem {
  str: string;
  transform: number[]; // [scaleX, skewX, skewY, scaleY, translateX, translateY]
  width: number;
  height: number;
  fontName: string;
}

interface PageBlock {
  text: string;
  fontSize: number;
  fontName: string;
  x: number;
  y: number;
  width: number;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * Group text items into logical lines by Y-coordinate proximity,
 * then convert to Markdown based on font-size heuristics, line-start
 * patterns, and table-like spacing.
 */
function convertToMarkdown(
  pageItems: { items: TextItem[]; pageWidth: number; pageHeight: number }[],
): string {
  const allLines: string[] = [];

  for (let pi = 0; pi < pageItems.length; pi++) {
    const { items } = pageItems[pi];
    if (items.length === 0) continue;

    // Build block list with position + style info
    const blocks: PageBlock[] = items
      .filter((it) => it.str.trim().length > 0)
      .map((it) => ({
        text: it.str,
        fontSize: Math.abs(it.transform[3]) || Math.abs(it.transform[0]) || 12,
        fontName: it.fontName || "",
        x: it.transform[4],
        y: it.transform[5],
        width: it.width,
        isBold:
          /bold/i.test(it.fontName) ||
          /Black/i.test(it.fontName) ||
          /Heavy/i.test(it.fontName),
        isItalic: /italic|oblique/i.test(it.fontName),
      }));

    if (blocks.length === 0) continue;

    // Sort by Y descending (PDF origin is bottom-left), then X ascending
    blocks.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });

    // Calculate median font size for "body text" detection
    const fontSizes = blocks.map((b) => b.fontSize).sort((a, b) => a - b);
    const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)];

    // Group blocks into lines (items with similar Y coordinate)
    type Line = { blocks: PageBlock[]; y: number; maxFontSize: number; avgFontSize: number };
    const lines: Line[] = [];
    let currentLine: PageBlock[] = [blocks[0]];
    let currentY = blocks[0].y;

    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      // If Y difference is small (within ~60% of font height), same line
      const threshold = Math.max(b.fontSize, currentLine[0].fontSize) * 0.6;
      if (Math.abs(b.y - currentY) <= threshold) {
        currentLine.push(b);
      } else {
        // Finalize current line
        const sizes = currentLine.map((bl) => bl.fontSize);
        lines.push({
          blocks: currentLine,
          y: currentY,
          maxFontSize: Math.max(...sizes),
          avgFontSize: sizes.reduce((s, v) => s + v, 0) / sizes.length,
        });
        currentLine = [b];
        currentY = b.y;
      }
    }
    // Push last line
    if (currentLine.length > 0) {
      const sizes = currentLine.map((bl) => bl.fontSize);
      lines.push({
        blocks: currentLine,
        y: currentY,
        maxFontSize: Math.max(...sizes),
        avgFontSize: sizes.reduce((s, v) => s + v, 0) / sizes.length,
      });
    }

    // Convert each line to markdown
    for (const line of lines) {
      // Sort blocks in line by X position (left to right)
      line.blocks.sort((a, b) => a.x - b.x);

      // Join blocks into text, inserting spaces where there are gaps
      let lineText = "";
      for (let i = 0; i < line.blocks.length; i++) {
        const b = line.blocks[i];
        if (i > 0) {
          const prevBlock = line.blocks[i - 1];
          const gap = b.x - (prevBlock.x + prevBlock.width);
          // If gap is large enough, insert a space (or tab for table-like spacing)
          if (gap > b.fontSize * 2) {
            lineText += " | ";
          } else if (gap > 1) {
            lineText += " ";
          }
        }
        let text = b.text;
        // Apply inline formatting
        if (b.isBold && b.isItalic) {
          text = `***${text}***`;
        } else if (b.isBold) {
          text = `**${text}**`;
        } else if (b.isItalic) {
          text = `*${text}*`;
        }
        lineText += text;
      }

      lineText = lineText.trim();
      if (!lineText) continue;

      // Determine heading level based on font size relative to body text
      const ratio = line.avgFontSize / medianFontSize;
      const allBold = line.blocks.every((b) => b.isBold);

      if (ratio >= 1.8) {
        allLines.push(`# ${cleanBoldMarkers(lineText)}`);
      } else if (ratio >= 1.4) {
        allLines.push(`## ${cleanBoldMarkers(lineText)}`);
      } else if (ratio >= 1.15 && allBold) {
        allLines.push(`### ${cleanBoldMarkers(lineText)}`);
      } else if (allBold && lineText.length < 120) {
        // Short bold lines are likely sub-headings
        allLines.push(`#### ${cleanBoldMarkers(lineText)}`);
      } else {
        // Detect list-like patterns
        const listMatch = lineText.match(/^(\s*)[•●○▪▸►◦–—-]\s+(.*)$/);
        const numberedMatch = lineText.match(/^(\s*)\d+[.)]\s+(.*)$/);
        if (listMatch) {
          allLines.push(`- ${listMatch[2]}`);
        } else if (numberedMatch) {
          allLines.push(lineText); // Keep numbered lists as-is
        } else {
          allLines.push(lineText);
        }
      }
    }

    // Page separator (except after last page)
    if (pi < pageItems.length - 1) {
      allLines.push("");
      allLines.push("---");
      allLines.push("");
    }
  }

  // Post-process: merge lines that are part of the same paragraph
  // and add blank lines between distinct blocks
  return postProcessMarkdown(allLines);
}

/** Remove redundant bold markers from text that will be a heading */
function cleanBoldMarkers(text: string): string {
  return text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/\*/g, "").trim();
}

/** Post-process: add blank lines between different block types */
function postProcessMarkdown(lines: string[]): string {
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : "";

    // Add blank line before headings (if not already blank)
    if (/^#{1,6}\s/.test(line) && prev !== "" && prev !== "---") {
      result.push("");
    }

    result.push(line);

    // Add blank line after headings
    if (/^#{1,6}\s/.test(line)) {
      result.push("");
    }
  }

  // Clean up excessive blank lines
  return result
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Detect pipe-separated table patterns and format them               */
/* ------------------------------------------------------------------ */
function detectAndFormatTables(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Check if this line has pipe separators (potential table row)
    const pipeCount = (line.match(/ \| /g) || []).length;

    if (pipeCount >= 1) {
      // Collect consecutive pipe-separated lines
      const tableLines: string[] = [];
      while (i < lines.length) {
        const tl = lines[i];
        const tPipes = (tl.match(/ \| /g) || []).length;
        if (tPipes >= 1) {
          tableLines.push(tl);
          i++;
        } else {
          break;
        }
      }

      if (tableLines.length >= 2) {
        // Format as markdown table
        // Determine column count from the line with most pipes
        const maxCols = Math.max(...tableLines.map((l) => l.split(" | ").length));

        for (let j = 0; j < tableLines.length; j++) {
          const cells = tableLines[j].split(" | ").map((c) => c.trim());
          // Pad to maxCols
          while (cells.length < maxCols) cells.push("");
          result.push("| " + cells.join(" | ") + " |");

          // Add separator after first row (header)
          if (j === 0) {
            result.push("| " + cells.map(() => "---").join(" | ") + " |");
          }
        }
      } else {
        // Single pipe line — not a table, keep as-is
        result.push(...tableLines);
      }
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function PdfToMarkdownClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    if (
      !selectedFile.name.toLowerCase().endsWith(".pdf") &&
      selectedFile.type !== "application/pdf"
    ) {
      setError("Please upload a PDF file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setMarkdown(null);
    setPageCount(0);
    setRenderedHtml("");
    setIsProcessing(true);
    setStatusMsg("Loading PDF engine…");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      setStatusMsg("Reading PDF bytes…");
      const arrayBuffer = await selectedFile.arrayBuffer();

      setStatusMsg("Opening PDF document…");
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setPageCount(numPages);

      setStatusMsg(`Extracting text from ${numPages} page${numPages !== 1 ? "s" : ""}…`);

      const pageItems: {
        items: TextItem[];
        pageWidth: number;
        pageHeight: number;
      }[] = [];

      for (let p = 1; p <= numPages; p++) {
        setStatusMsg(`Extracting page ${p} of ${numPages}…`);
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();

        const items: TextItem[] = (textContent.items as TextItem[]).filter(
          (it) => "str" in it && typeof it.str === "string",
        );

        pageItems.push({
          items,
          pageWidth: viewport.width,
          pageHeight: viewport.height,
        });
      }

      setStatusMsg("Converting to Markdown…");

      // Check if we got any text at all
      const totalChars = pageItems.reduce(
        (sum, p) => sum + p.items.reduce((s, it) => s + it.str.trim().length, 0),
        0,
      );

      if (totalChars === 0) {
        setMarkdown("");
        setStatusMsg("");
        return;
      }

      let md = convertToMarkdown(pageItems);
      md = detectAndFormatTables(md);

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
      setError(
        "Failed to process PDF. The file may be encrypted, corrupted, or use an unsupported format.",
      );
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

  const words =
    markdown && markdown.trim()
      ? markdown.trim().split(/\s+/).length
      : 0;

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
              {["100% Local", "No Uploads", "Tables & Headings", "Works Offline"].map((label) => (
                <div
                  key={label}
                  className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  {label}
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-xl font-medium leading-9 text-[var(--text-soft)]">
              Extract clean Markdown from text-based PDFs — headings, paragraphs, tables, bold &amp; italic.
              Powered by PDF.js. Rendered entirely in your browser.
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
              {/* Stats bar */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center border-4 border-[var(--border-main)] px-4 py-1.5 text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_var(--border-main)] bg-[#54d88d]">
                  ✅ Extracted from {pageCount} page{pageCount !== 1 ? "s" : ""}
                </span>
                {markdown && (
                  <>
                    <span className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-widest">
                      📝 {words.toLocaleString()} words
                    </span>
                    <span className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-widest">
                      📄 {markdown.length.toLocaleString()} chars
                    </span>
                  </>
                )}
              </div>

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
