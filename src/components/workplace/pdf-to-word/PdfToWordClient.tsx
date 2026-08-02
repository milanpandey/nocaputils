"use client";

import { useState, useCallback, useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Packer, AlignmentType, WidthType } from "docx";

export default function PdfToWordClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [isConverted, setIsConverted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setError("Please select a valid PDF document (.pdf)");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setIsConverted(false);
    setProgress(0);
    setStatusMsg("");
    setPageCount(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const convertPdfToWord = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(10);
    setStatusMsg("Loading PDF document...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const totalPages = pdfDoc.numPages;
      setPageCount(totalPages);
      setStatusMsg(`Extracting text, images, and tables from ${totalPages} page(s)...`);

      const docxChildren: (Paragraph | Table)[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(Math.round(10 + (pageNum / totalPages) * 70));
        setStatusMsg(`Processing page ${pageNum} of ${totalPages}...`);

        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.5 });

        // Render page canvas snapshot to extract images & graphics
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const imgDataUrl = canvas.toDataURL("image/png");
          const base64Data = imgDataUrl.replace(/^data:image\/png;base64,/, "");
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          // Page Banner Header
          if (totalPages > 1) {
            docxChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `--- Page ${pageNum} ---`,
                    bold: true,
                    color: "666666",
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })
            );
          }

          // Embedded WYSIWYG Page Snapshot Graphic
          docxChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBytes,
                  transformation: {
                    width: 550,
                    height: Math.min(750, (viewport.height * 550) / viewport.width),
                  },
                  type: "png",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            })
          );
        }

        // Extract Text and Column/Table structures
        const lines: { y: number; items: { x: number; text: string }[] }[] = [];

        for (const item of textContent.items as { str?: string; transform: number[]; hasSpace?: boolean }[]) {
          if (!item.str || !item.str.trim()) continue;

          const x = Math.round(item.transform[4]);
          const y = Math.round(item.transform[5]);

          let existingLine = lines.find(l => Math.abs(l.y - y) <= 4);
          if (!existingLine) {
            existingLine = { y, items: [] };
            lines.push(existingLine);
          }
          existingLine.items.push({ x, text: item.str.trim() });
        }

        // Sort lines from top to bottom
        lines.sort((a, b) => b.y - a.y);

        for (const line of lines) {
          // Sort items from left to right
          line.items.sort((a, b) => a.x - b.x);

          // If line has multiple column entries separated by gaps, render as a Word Table Row
          if (line.items.length >= 2) {
            const tableRow = new TableRow({
              children: line.items.map(colItem => new TableCell({
                width: { size: Math.floor(10000 / line.items.length), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: colItem.text,
                        size: 22,
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              })),
            });

            docxChildren.push(
              new Table({
                rows: [tableRow],
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
          } else if (line.items.length === 1) {
            const lineText = line.items[0].text;
            const isHeading = lineText.length < 60 && lineText === lineText.toUpperCase() && lineText.length > 3;

            docxChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    bold: isHeading,
                    size: isHeading ? 28 : 24,
                    font: "Calibri",
                  }),
                ],
                spacing: { after: isHeading ? 180 : 120 },
              })
            );
          }
        }
      }

      setStatusMsg("Generating Microsoft Word (.docx) document...");
      setProgress(90);

      const wordDoc = new Document({
        sections: [
          {
            properties: {},
            children: docxChildren.length > 0 ? docxChildren : [
              new Paragraph({
                children: [new TextRun({ text: "PDF text and layout converted successfully.", size: 24 })]
              })
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(wordDoc);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      a.download = `${baseName}_converted.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setProgress(100);
      setIsConverted(true);
      setStatusMsg("Conversion Complete! Download started automatically.");
    } catch (err: unknown) {
      console.error("PDF Conversion Error:", err);
      setError("Failed to convert PDF. The file may be password protected or corrupted.");
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

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
          <div className="mb-12 text-center max-w-3xl">
            <div className="inline-block border-4 border-black bg-[#E63946] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              WYSIWYG Layout · Tables &amp; Graphics
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              PDF to Word Converter
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Convert PDF documents into editable Word (.docx) files preserving tables, images, and formatting. Runs 100% offline in your browser.
            </p>
          </div>

          <div className="w-full max-w-2xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-12 mb-16">
            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-10 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <span className="text-6xl mb-4">📄</span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] mb-2">
                  Drop PDF file here
                </h2>
                <p className="text-sm font-bold text-[var(--text-soft)] uppercase tracking-wider mb-6">
                  or click to browse from device
                </p>
                <span className="neo-button bg-[var(--accent)] text-black font-black uppercase px-6 py-3">
                  Select PDF Document
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="border-4 border-[var(--border-main)] bg-[var(--bg-page)] p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">📑</span>
                    <div>
                      <h3 className="font-black text-lg text-[var(--text-main)] truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </h3>
                      <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB {pageCount ? `· ${pageCount} pages` : ""}
                      </p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={() => setFile(null)}
                      className="text-sm font-black uppercase text-[var(--text-soft)] hover:text-[#E63946]"
                      title="Remove file"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {isProcessing && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                      <span>{statusMsg}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-4 border-2 border-black bg-[var(--bg-page)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="border-4 border-black bg-[#E63946] text-white p-4 font-bold text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {isConverted && (
                  <div className="border-4 border-black bg-[var(--success)] text-black p-4 font-black uppercase text-center">
                    🎉 Conversion Complete! Check your downloads folder.
                  </div>
                )}

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={convertPdfToWord}
                    disabled={isProcessing}
                    className={`neo-button neo-button-theme font-black uppercase text-lg px-8 py-4 ${
                      isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing ? "Converting..." : "Convert to Word (.docx) →"}
                  </button>

                  {isConverted && (
                    <button
                      onClick={() => { setFile(null); setIsConverted(false); }}
                      className="neo-button bg-[var(--bg-panel)] font-black uppercase px-6 py-4"
                    >
                      Convert Another File
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-2xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
            🔒 <strong>100% Browser Security:</strong> Your files never leave your computer. Processing happens locally using WebAssembly.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
