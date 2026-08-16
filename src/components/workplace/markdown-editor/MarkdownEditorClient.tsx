"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const INITIAL_MD = `# Hello, Markdown!

Write on the **left**, see the result on the **right**.

## Features
- Live preview as you type
- Toolbar shortcuts for common formatting
- Import **.md** files, export as Markdown or HTML
- Word count, reading time, and line count in the footer

## Code Example
\`\`\`js
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("World"));
\`\`\`

## Table
| Column A | Column B | Column C |
|----------|----------|----------|
| Row 1    | Data     | More     |
| Row 2    | Data     | More     |

> **Tip:** Use the toolbar buttons above to apply formatting, or type Markdown directly.
`;

type FormatAction = {
  label: string;
  title: string;
  before: string;
  after: string;
  placeholder?: string;
};

const FORMAT_ACTIONS: FormatAction[] = [
  { label: "B",   title: "Bold",        before: "**", after: "**",  placeholder: "bold text"  },
  { label: "I",   title: "Italic",      before: "_",  after: "_",   placeholder: "italic text" },
  { label: "H1",  title: "Heading 1",   before: "# ", after: "",    placeholder: "Heading"    },
  { label: "H2",  title: "Heading 2",   before: "## ", after: "",   placeholder: "Heading"    },
  { label: "H3",  title: "Heading 3",   before: "### ", after: "",  placeholder: "Heading"    },
  { label: "`",   title: "Inline Code", before: "`",  after: "`",   placeholder: "code"       },
  { label: "```", title: "Code Block",  before: "```\n", after: "\n```", placeholder: "code block" },
  { label: "—",   title: "Divider",     before: "\n---\n", after: "", placeholder: "" },
  { label: "🔗",  title: "Link",        before: "[", after: "](url)", placeholder: "link text" },
  { label: "•",   title: "List item",   before: "- ", after: "",    placeholder: "item"       },
  { label: ">",   title: "Blockquote",  before: "> ", after: "",    placeholder: "quote"      },
];

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}
function readingTime(words: number) {
  return Math.max(1, Math.round(words / 200));
}

export default function MarkdownEditorClient() {
  const [source, setSource] = useState(INITIAL_MD);
  const [html, setHtml] = useState("");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Render markdown whenever source changes
  useEffect(() => {
    let active = true;
    (async () => {
      const { marked } = await import("marked");
      const result = await marked(source);
      if (active) setHtml(result);
    })();
    return () => { active = false; };
  }, [source]);

  // Apply toolbar format
  const applyFormat = useCallback((action: FormatAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = source.slice(start, end) || action.placeholder || "";
    const newText =
      source.slice(0, start) +
      action.before + selected + action.after +
      source.slice(end);
    setSource(newText);
    // Restore focus + selection
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = start + action.before.length + selected.length + action.after.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  }, [source]);

  // Tab key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const updated = source.slice(0, s) + "  " + source.slice(s);
      setSource(updated);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
  };

  // Import .md file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setSource(reader.result as string);
    reader.readAsText(f);
    e.target.value = "";
  };

  // Export .md
  const handleExportMd = () => {
    const blob = new Blob([source], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export .html
  const handleExportHtml = () => {
    const full = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>Document</title></head>\n<body>\n${html}\n</body>\n</html>`;
    const blob = new Blob([full], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMd = async () => {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const words = countWords(source);
  const lines = source.split("\n").length;
  const mins = readingTime(words);

  return (
    <div className="subtle-pattern min-h-screen flex flex-col">
      <Header backLink={{ href: "/workplaceutilities", label: "← Workplace Utilities" }} />
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col px-6 pb-6 pt-24 md:px-8 md:pt-32 flex-1">

        {/* Title bar */}
        <div className="mb-8 flex flex-wrap items-end gap-4">
          <div>
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">
              <span className="block">Markdown</span>
              <span className="mt-2 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-4 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Editor
              </span>
            </h1>
            <p className="mt-4 text-base font-bold uppercase tracking-widest text-[var(--text-soft)]">
              Write, preview, and export Markdown — fully offline
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-3 items-center">
            {/* Stats */}
            <div className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-widest">
              📝 {words.toLocaleString()} words
            </div>
            <div className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-widest">
              📄 {lines.toLocaleString()} lines
            </div>
            <div className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-widest">
              ⏱ ~{mins} min read
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 neo-panel bg-[var(--bg-panel)] flex flex-wrap items-center gap-2 px-4 py-3">
          {/* Format buttons */}
          <div className="flex flex-wrap gap-1">
            {FORMAT_ACTIONS.map((a) => (
              <button
                key={a.title}
                title={a.title}
                onClick={() => applyFormat(a)}
                className="neo-button neo-button-theme px-3 py-1 text-sm font-mono font-black"
                id={`md-fmt-${a.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-[4px] bg-[var(--border-main)] mx-2" />

          {/* File actions */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest"
            id="md-import-btn"
          >
            Import .md
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            className="hidden"
            onChange={handleImport}
          />
          <button onClick={handleExportMd} className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest" id="md-export-md-btn">
            Export .md
          </button>
          <button onClick={handleExportHtml} className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest" id="md-export-html-btn">
            Export .html
          </button>
          <button onClick={handleCopyMd} className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest" id="md-copy-md-btn">
            {copied ? "✓ Copied!" : "Copy MD"}
          </button>
          <button onClick={handleCopyHtml} className="neo-button neo-button-theme px-3 py-1.5 text-xs font-black uppercase tracking-widest" id="md-copy-html-btn">
            {copiedHtml ? "✓ Copied!" : "Copy HTML"}
          </button>

          {/* View mode */}
          <div className="ml-auto flex border-4 border-[var(--border-main)] overflow-hidden shadow-[4px_4px_0_0_var(--border-main)]">
            {(["editor", "split", "preview"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors border-r-4 border-[var(--border-main)] last:border-r-0 ${
                  viewMode === m
                    ? "bg-[var(--accent)] text-black"
                    : "bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-muted)]"
                }`}
                id={`md-view-${m}`}
              >
                {m === "split" ? "Split" : m === "editor" ? "Editor" : "Preview"}
              </button>
            ))}
          </div>
        </div>

        {/* Editor / Preview panes */}
        <div
          className={`flex-1 grid gap-4 ${viewMode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}
          style={{ minHeight: "calc(100vh - 380px)" }}
        >
          {(viewMode === "editor" || viewMode === "split") && (
            <div className="flex flex-col neo-panel overflow-hidden">
              <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--text-soft)] border-b-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                Editor
              </div>
              <textarea
                ref={textareaRef}
                id="markdown-textarea"
                className="flex-1 resize-none p-4 font-mono text-sm bg-transparent outline-none leading-relaxed"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{ minHeight: "500px" }}
              />
            </div>
          )}

          {(viewMode === "preview" || viewMode === "split") && (
            <div className="flex flex-col neo-panel overflow-hidden">
              <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--text-soft)] border-b-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                Preview
              </div>
              <div
                className="flex-1 overflow-auto p-5 md-preview"
                style={{ minHeight: "500px" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <Footer />
        </div>
      </div>
    </div>
  );
}
