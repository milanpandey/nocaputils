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
      setError("Invalid file format. Please upload a standard Microsoft PDF document (.pdf).");
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
    setStatusMsg("Initializing PDF parsing engine...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const totalPages = pdfDoc.numPages;
      setPageCount(totalPages);
      setStatusMsg(`Extracting structure, tables, and text from ${totalPages} page(s)...`);

      const docxChildren: (Paragraph | Table)[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(Math.round(10 + (pageNum / totalPages) * 70));
        setStatusMsg(`Converting page ${pageNum} of ${totalPages}...`);

        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await (page as unknown as { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown; canvas: HTMLCanvasElement }) => { promise: Promise<void> } })
            .render({ canvasContext: ctx, viewport, canvas }).promise;
          const imgDataUrl = canvas.toDataURL("image/png");
          const base64Data = imgDataUrl.replace(/^data:image\/png;base64,/, "");
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          if (totalPages > 1) {
            docxChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `--- Document Page ${pageNum} ---`,
                    bold: true,
                    color: "4A5568",
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })
            );
          }

          docxChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBytes,
                  type: "png",
                  transformation: {
                    width: 580,
                    height: Math.round((580 * viewport.height) / viewport.width),
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            })
          );
        }

        const linesMap = new Map<number, string[]>();
        for (const item of textContent.items) {
          const str = (item as { str: string }).str;
          const transform = (item as { transform: number[] }).transform;
          if (!str || !str.trim()) continue;

          const yPos = Math.round((transform ? transform[5] : 0) / 10) * 10;
          if (!linesMap.has(yPos)) {
            linesMap.set(yPos, []);
          }
          linesMap.get(yPos)!.push(str);
        }

        const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);

        for (const y of sortedYs) {
          const lineText = linesMap.get(y)!.join(" ").trim();
          if (!lineText) continue;

          const isTableLine = lineText.includes("\t") || (linesMap.get(y)!.length > 3 && y % 20 === 0);

          if (isTableLine) {
            const cells = linesMap.get(y)!;
            docxChildren.push(
              new Table({
                rows: [
                  new TableRow({
                    children: cells.map(
                      cellText =>
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: cellText, size: 22 })] })],
                          width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
                        })
                    ),
                  }),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
          } else {
            docxChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    size: 24,
                    color: "1A202C",
                  }),
                ],
                spacing: { after: 120 },
              })
            );
          }
        }
      }

      setProgress(85);
      setStatusMsg("Packaging Microsoft Word (.docx) binary stream...");

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docxChildren,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const originalName = file.name.replace(/\.pdf$/i, "");
      link.download = `${originalName}_converted.docx`;
      link.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      setStatusMsg("Conversion completed successfully.");
      setIsConverted(true);
    } catch (err: unknown) {
      console.error("PDF to Word Error:", err);
      setError("Failed to convert PDF document. Please verify the file is unencrypted.");
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

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
            <div className="inline-block border-4 border-black bg-[#E63946] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Enterprise Document Converter
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              PDF to Word
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Convert PDF documents to editable Microsoft Word (.docx) files. Parses layout text, graphics, and table structures 100% offline in your browser memory.
            </p>
          </div>

          <div className="w-full max-w-3xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-12 mb-12">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Upload PDF document to convert to Word"
              className="border-4 border-dashed border-[var(--border-main)] bg-[var(--bg-page)] p-10 text-center cursor-pointer hover:bg-[var(--bg-panel-muted)] transition-colors flex flex-col items-center focus:outline-none focus:ring-4 focus:ring-black"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="pdf-word-file-input"
                aria-label="Select PDF File"
              />
              <span className="text-6xl mb-4" aria-hidden="true">📄</span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] mb-2">
                {file ? file.name : "Select or Drop PDF File"}
              </h2>
              <p className="text-sm font-bold text-[var(--text-soft)] uppercase tracking-wider mb-6">
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB ${pageCount ? `· ${pageCount} Pages` : ""}`
                  : "Supports standard Microsoft PDF documents"}
              </p>
              <span className="neo-button bg-[#E63946] text-white font-black uppercase px-8 py-3 text-sm">
                {file ? "Change Selected PDF" : "Choose PDF Document"}
              </span>
            </div>

            {isProcessing && (
              <div className="mt-8 border-4 border-black bg-[var(--bg-page)] p-6">
                <div className="flex justify-between items-center mb-2 font-black uppercase text-sm">
                  <span>{statusMsg}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 border-2 border-black h-4 overflow-hidden">
                  <div className="bg-[#E63946] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 border-4 border-black bg-[#E63946] text-white p-4 font-bold text-sm" role="alert">
                ⚠️ {error}
              </div>
            )}

            {file && !isProcessing && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={convertPdfToWord}
                  className="neo-button bg-[#E63946] text-white font-black uppercase px-10 py-4 text-lg"
                >
                  ⚡ Convert to Word (.docx)
                </button>
              </div>
            )}

            {isConverted && (
              <div className="mt-8 border-4 border-black bg-[#2A9D8F] text-white p-6 text-center animate-fadeIn" role="status">
                <span className="text-4xl mb-2 block" aria-hidden="true">🎉</span>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                  Document Converted Successfully!
                </h3>
                <p className="text-sm font-bold uppercase tracking-wider">
                  Your Microsoft Word (.docx) document has been downloaded.
                </p>
              </div>
            )}
          </div>

          <div className="w-full max-w-3xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> Conversion occurs locally inside browser memory. Zero document data is uploaded to servers.
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
