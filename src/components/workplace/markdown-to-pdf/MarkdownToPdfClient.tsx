"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type PaperSize = "a4" | "letter";
type Theme = "minimal" | "academic" | "report";

const THEME_STYLES: Record<Theme, string> = {
  minimal: `
    body { font-family: 'Georgia', serif; font-size: 13px; line-height: 1.7; color: #222; margin: 0; padding: 48px 52px; }
    h1,h2,h3,h4 { font-family: 'Helvetica Neue', sans-serif; font-weight: 700; margin-top: 1.5em; }
    h1 { font-size: 2em; border-bottom: 2px solid #222; padding-bottom: 0.3em; }
    h2 { font-size: 1.4em; border-bottom: 1px solid #ddd; padding-bottom: 0.2em; }
    code { background: #f5f5f5; padding: 1px 5px; border-radius: 3px; font-family: monospace; }
    pre { background: #f5f5f5; padding: 14px; border-radius: 5px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ccc; margin: 1em 0; padding: 0.5em 1em; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f0f0f0; font-weight: 700; }
  `,
  academic: `
    body { font-family: 'Times New Roman', Times, serif; font-size: 12px; line-height: 1.8; color: #111; margin: 0; padding: 52px 60px; }
    h1 { font-size: 1.8em; text-align: center; margin-bottom: 0.2em; }
    h2 { font-size: 1.3em; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333; padding-bottom: 0.2em; margin-top: 2em; }
    h3 { font-size: 1.1em; font-style: italic; }
    code { font-family: 'Courier New', monospace; background: #f8f8f8; padding: 1px 4px; }
    pre { background: #f8f8f8; padding: 12px; border: 1px solid #ddd; }
    pre code { background: none; }
    blockquote { margin: 1em 2em; font-style: italic; color: #444; }
    table { border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 11px; }
    th, td { border: 1px solid #999; padding: 6px 10px; }
    th { background: #eee; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
  `,
  report: `
    body { font-family: 'Calibri', 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 40px 50px; }
    h1 { font-size: 2.2em; color: #16213e; border-left: 5px solid #0f3460; padding-left: 15px; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; color: #0f3460; margin-top: 1.8em; }
    h3 { font-size: 1.15em; color: #16213e; }
    code { background: #e8f4fd; color: #0f3460; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #1a1a2e; color: #e8f4fd; padding: 14px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; color: inherit; }
    blockquote { border-left: 4px solid #0f3460; background: #f0f7ff; margin: 1em 0; padding: 0.8em 1.2em; border-radius: 0 6px 6px 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th { background: #0f3460; color: white; padding: 10px 14px; }
    td { border: 1px solid #d0dde8; padding: 8px 14px; }
    tr:nth-child(even) td { background: #f0f7ff; }
  `,
};

const PAPER_SIZES: Record<PaperSize, { width: string; height: string; label: string }> = {
  a4:     { width: "210mm", height: "297mm", label: "A4 (210 × 297 mm)" },
  letter: { width: "8.5in", height: "11in",  label: "Letter (8.5 × 11 in)" },
};

const THEME_META: Record<Theme, { emoji: string; desc: string }> = {
  minimal:  { emoji: "📄", desc: "Clean · Georgia serif" },
  academic: { emoji: "🎓", desc: "Academic · Times New Roman" },
  report:   { emoji: "📊", desc: "Report · Calibri + Color Accents" },
};

const SAMPLE_MD = `# Project Report

## Executive Summary
This report provides an overview of Q3 results.

## Key Metrics

| Metric      | Q2     | Q3     | Change |
|-------------|--------|--------|--------|
| Revenue     | $120k  | $145k  | +20.8% |
| Users       | 8,400  | 10,200 | +21.4% |
| Churn Rate  | 4.2%   | 3.1%   | -26.2% |

## Highlights
- Launched **3 new features** in September
- Reduced infrastructure costs by **18%**
- Onboarded 2 enterprise clients

## Conclusion
Q3 exceeded projections across all key metrics. The team is well-positioned for Q4.
`;

export default function MarkdownToPdfClient() {
  const [source, setSource] = useState(SAMPLE_MD);
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [theme, setTheme] = useState<Theme>("minimal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setSource(reader.result as string);
    reader.readAsText(f);
    e.target.value = "";
  };

  const buildHtmlDocument = async (md: string) => {
    const { marked } = await import("marked");
    const body = await marked(md);
    const css = THEME_STYLES[theme];
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${css}
    @page { size: ${PAPER_SIZES[paperSize].width} ${PAPER_SIZES[paperSize].height}; margin: 0; }
  </style>
</head>
<body>${body}</body>
</html>`;
  };

  const handleGeneratePdf = async () => {
    if (!source.trim()) {
      setError("Please enter some Markdown content.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setStatusMsg("Rendering Markdown to HTML…");

    try {
      const htmlDoc = await buildHtmlDocument(source);

      setStatusMsg("Building PDF with html2canvas + jsPDF…");
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:900px;height:1200px;border:0;";
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = htmlDoc;
      });

      await new Promise((r) => setTimeout(r, 300));

      const iframeDoc = iframe.contentDocument!;
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: paperSize === "a4" ? "a4" : "letter",
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgAspect = canvas.height / canvas.width;

      let heightLeft = pdfW * imgAspect;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pdfW, pdfW * imgAspect);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfW, pdfW * imgAspect);
        heightLeft -= pdfH;
      }

      pdf.save("document.pdf");
      setStatusMsg("");
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const words = source.trim() === "" ? 0 : source.trim().split(/\s+/).length;

  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/workplaceutilities", label: "← Workplace Utilities" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          {/* Hero */}
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Markdown</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                to PDF
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Local", "No Uploads", "3 Themes", "Works Offline"].map((label) => (
                <div
                  key={label}
                  className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  {label}
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-xl font-medium leading-9 text-[var(--text-soft)]">
              Convert Markdown to a styled, print-ready PDF — choose your paper size and document theme. Rendered entirely in your browser.
            </p>
          </section>

          <div className="w-full max-w-6xl grid gap-6 md:grid-cols-[1fr_300px]">
            {/* Editor */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-widest text-[var(--text-soft)]">
                  Markdown Input
                  <span className="ml-3 font-bold normal-case tracking-normal text-[var(--text-soft)]">
                    {words.toLocaleString()} words · {source.length.toLocaleString()} chars
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest"
                    id="md-pdf-import-btn"
                  >
                    Import .md
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown"
                    className="hidden"
                    onChange={handleImport}
                  />
                  <button
                    onClick={() => setSource("")}
                    className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest"
                    id="md-pdf-clear-btn"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                id="md-pdf-textarea"
                className="flex-1 resize-none neo-panel p-4 font-mono text-sm bg-[var(--bg-panel)] outline-none leading-relaxed"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                style={{ minHeight: "540px" }}
              />
            </div>

            {/* Settings sidebar */}
            <div className="flex flex-col gap-4">
              <div className="neo-panel bg-[var(--bg-panel)] p-6 flex flex-col gap-6">
                <h2 className="text-xl font-black uppercase tracking-widest border-b-4 border-[var(--border-main)] pb-3">
                  PDF Settings
                </h2>

                {/* Paper size */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-3 text-[var(--text-soft)]">Paper Size</p>
                  <div className="flex flex-col gap-2">
                    {(Object.entries(PAPER_SIZES) as [PaperSize, typeof PAPER_SIZES[PaperSize]][]).map(([key, val]) => (
                      <label
                        key={key}
                        className={`flex items-center gap-3 cursor-pointer border-4 border-[var(--border-main)] px-3 py-2 transition-all ${
                          paperSize === key
                            ? "bg-[var(--accent)] text-black shadow-[3px_3px_0_0_var(--border-main)]"
                            : "bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-muted)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paper-size"
                          value={key}
                          checked={paperSize === key}
                          onChange={() => setPaperSize(key)}
                          className="hidden"
                        />
                        <span className="text-sm font-black uppercase tracking-wide">{val.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-3 text-[var(--text-soft)]">Document Theme</p>
                  <div className="flex flex-col gap-2">
                    {(["minimal", "academic", "report"] as Theme[]).map((t) => (
                      <label
                        key={t}
                        className={`flex items-center gap-3 cursor-pointer border-4 border-[var(--border-main)] px-3 py-2 transition-all ${
                          theme === t
                            ? "bg-[var(--accent)] text-black shadow-[3px_3px_0_0_var(--border-main)]"
                            : "bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-muted)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={t}
                          checked={theme === t}
                          onChange={() => setTheme(t)}
                          className="hidden"
                        />
                        <span className="text-lg">{THEME_META[t].emoji}</span>
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide">{t}</p>
                          <p className="text-[10px] font-bold opacity-70">{THEME_META[t].desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="border-l-8 border-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-red-700 dark:text-red-400 text-xs font-black uppercase">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating || !source.trim()}
                  className={`w-full border-4 border-[var(--border-main)] py-4 text-xl font-black uppercase shadow-[6px_6px_0_0_var(--border-main)] transition-all ${
                    isGenerating || !source.trim()
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed translate-x-[2px] translate-y-[2px] shadow-[4px_4px_0_0_var(--border-main)]"
                      : "bg-[var(--accent)] text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--border-main)]"
                  }`}
                  id="generate-pdf-btn"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-5 w-5 animate-spin border-4 border-black border-t-transparent" />
                      {statusMsg || "Generating…"}
                    </span>
                  ) : (
                    "⬇ Download PDF"
                  )}
                </button>

                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)] text-center leading-relaxed">
                  Your document is rendered entirely in this browser. Nothing is sent to any server.
                </p>
              </div>
            </div>
          </div>
        </main>

        <div className="mt-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
