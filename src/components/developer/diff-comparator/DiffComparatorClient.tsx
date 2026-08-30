"use client";

import { useState, useMemo } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

type DiffType = "equal" | "added" | "removed";
type ViewMode = "split" | "unified";

interface DiffLine {
  type: DiffType;
  oldLine?: number;
  newLine?: number;
  text: string;
}

/** Myers-style LCS-based line diff */
function computeDiff(
  oldText: string,
  newText: string,
  options: { trimWhitespace: boolean; caseInsensitive: boolean }
): DiffLine[] {
  let oldLines = oldText.split("\n");
  let newLines = newText.split("\n");

  const normalize = (line: string) => {
    let l = line;
    if (options.trimWhitespace) l = l.trim();
    if (options.caseInsensitive) l = l.toLowerCase();
    return l;
  };

  // LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) {
      result.unshift({ type: "equal", oldLine: i, newLine: j, text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", newLine: j, text: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      result.unshift({ type: "removed", oldLine: i, text: oldLines[i - 1] });
      i--;
    }
  }

  return result;
}

/** Character-level diff for inline highlight within a single line pair */
function charDiff(oldStr: string, newStr: string): { oldSegments: { text: string; changed: boolean }[]; newSegments: { text: string; changed: boolean }[] } {
  // Simple character-level LCS
  const m = oldStr.length;
  const n = newStr.length;

  // For very long lines, fall back to no char-level diff
  if (m > 500 || n > 500) {
    return {
      oldSegments: [{ text: oldStr, changed: true }],
      newSegments: [{ text: newStr, changed: true }],
    };
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldStr[i - 1] === newStr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const ops: { type: "eq" | "del" | "ins"; char: string }[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldStr[i - 1] === newStr[j - 1]) {
      ops.unshift({ type: "eq", char: oldStr[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "ins", char: newStr[j - 1] });
      j--;
    } else {
      ops.unshift({ type: "del", char: oldStr[i - 1] });
      i--;
    }
  }

  // Build segments
  const oldSegments: { text: string; changed: boolean }[] = [];
  const newSegments: { text: string; changed: boolean }[] = [];

  let currentOldText = "";
  let currentOldChanged = false;
  let currentNewText = "";
  let currentNewChanged = false;

  for (const op of ops) {
    if (op.type === "eq") {
      if (currentOldChanged && currentOldText) { oldSegments.push({ text: currentOldText, changed: true }); currentOldText = ""; }
      if (currentNewChanged && currentNewText) { newSegments.push({ text: currentNewText, changed: true }); currentNewText = ""; }
      currentOldChanged = false;
      currentNewChanged = false;
      currentOldText += op.char;
      currentNewText += op.char;
    } else if (op.type === "del") {
      if (!currentOldChanged && currentOldText) { oldSegments.push({ text: currentOldText, changed: false }); currentOldText = ""; }
      currentOldChanged = true;
      currentOldText += op.char;
    } else {
      if (!currentNewChanged && currentNewText) { newSegments.push({ text: currentNewText, changed: false }); currentNewText = ""; }
      currentNewChanged = true;
      currentNewText += op.char;
    }
  }
  if (currentOldText) oldSegments.push({ text: currentOldText, changed: currentOldChanged });
  if (currentNewText) newSegments.push({ text: currentNewText, changed: currentNewChanged });

  return { oldSegments, newSegments };
}

const SAMPLE_OLD = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const x = 42;
const y = "world";`;

const SAMPLE_NEW = `function greet(name, greeting) {
  console.log(greeting + ", " + name + "!");
  return true;
}

const x = 100;
const y = "world";
const z = "new line";`;

export default function DiffComparatorClient() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [trimWhitespace, setTrimWhitespace] = useState(false);
  const [caseInsensitive, setCaseInsensitive] = useState(false);

  const diff = useMemo(
    () => computeDiff(oldText, newText, { trimWhitespace, caseInsensitive }),
    [oldText, newText, trimWhitespace, caseInsensitive]
  );

  const stats = useMemo(() => {
    let added = 0, removed = 0, unchanged = 0;
    for (const line of diff) {
      if (line.type === "added") added++;
      else if (line.type === "removed") removed++;
      else unchanged++;
    }
    return { added, removed, unchanged };
  }, [diff]);

  const hasContent = oldText.length > 0 || newText.length > 0;

  const loadSample = () => {
    setOldText(SAMPLE_OLD);
    setNewText(SAMPLE_NEW);
  };

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a href="/developer-tools" className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all">
            ← Dev Tools
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-10 max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-5xl">
              📝 Diff{" "}
              <span className="inline-block border-4 border-[var(--border-main)] bg-[#3B82F6] px-3 py-1 text-white shadow-[4px_4px_0_0_var(--border-main)]">
                Comparator
              </span>
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Compare two texts with line-level and character-level difference highlighting.
            </p>
          </section>

          {/* Input panels */}
          <section className="mb-6 w-full max-w-5xl">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <button
                  className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    viewMode === "split" ? "bg-[#3B82F6] text-white" : "bg-[var(--bg-panel-muted)]"
                  }`}
                  onClick={() => setViewMode("split")}
                  id="diff-view-split"
                >
                  Split View
                </button>
                <button
                  className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    viewMode === "unified" ? "bg-[#3B82F6] text-white" : "bg-[var(--bg-panel-muted)]"
                  }`}
                  onClick={() => setViewMode("unified")}
                  id="diff-view-unified"
                >
                  Unified View
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    trimWhitespace ? "bg-[#3B82F6] text-white" : "bg-[var(--bg-panel-muted)]"
                  }`}
                  onClick={() => setTrimWhitespace(!trimWhitespace)}
                  id="diff-trim-ws"
                >
                  Trim Whitespace
                </button>
                <button
                  className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    caseInsensitive ? "bg-[#3B82F6] text-white" : "bg-[var(--bg-panel-muted)]"
                  }`}
                  onClick={() => setCaseInsensitive(!caseInsensitive)}
                  id="diff-case-insensitive"
                >
                  Ignore Case
                </button>
                <button
                  className="neo-button px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                  onClick={loadSample}
                  id="diff-sample-btn"
                >
                  Try Sample
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="neo-panel p-4">
                <label htmlFor="diff-old" className="mb-2 block text-xs font-black uppercase tracking-[0.15em]">
                  Original
                </label>
                <textarea
                  id="diff-old"
                  className="dev-tool-textarea font-mono text-sm"
                  rows={12}
                  value={oldText}
                  onChange={(e) => setOldText(e.target.value)}
                  placeholder="Paste original text..."
                  spellCheck={false}
                />
              </div>
              <div className="neo-panel p-4">
                <label htmlFor="diff-new" className="mb-2 block text-xs font-black uppercase tracking-[0.15em]">
                  Modified
                </label>
                <textarea
                  id="diff-new"
                  className="dev-tool-textarea font-mono text-sm"
                  rows={12}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Paste modified text..."
                  spellCheck={false}
                />
              </div>
            </div>
          </section>

          {/* Stats */}
          {hasContent && (
            <section className="mb-6 w-full max-w-5xl">
              <div className="neo-panel flex flex-wrap items-center justify-center gap-6 p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#54d88d" }} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {stats.added} Added
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#E63946" }} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {stats.removed} Removed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#666" }} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {stats.unchanged} Unchanged
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Diff Output */}
          {hasContent && diff.length > 0 && (
            <section className="mb-16 w-full max-w-5xl">
              <div className="neo-panel overflow-hidden">
                <div className="border-b-4 border-[var(--border-main)] px-6 py-3 bg-[var(--bg-panel-muted)]">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    {viewMode === "split" ? "Side-by-Side" : "Unified"} Diff
                  </span>
                </div>
                <div className="overflow-x-auto">
                  {viewMode === "split" ? (
                    <SplitDiffView diff={diff} oldText={oldText} newText={newText} />
                  ) : (
                    <UnifiedDiffView diff={diff} />
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

function SplitDiffView({ diff }: { diff: DiffLine[]; oldText: string; newText: string }) {
  // Pair up removed/added for char-level diff
  const rows: { left: DiffLine | null; right: DiffLine | null }[] = [];
  let i = 0;
  while (i < diff.length) {
    const line = diff[i];
    if (line.type === "equal") {
      rows.push({ left: line, right: line });
      i++;
    } else if (line.type === "removed") {
      // Look ahead for corresponding "added"
      if (i + 1 < diff.length && diff[i + 1].type === "added") {
        rows.push({ left: line, right: diff[i + 1] });
        i += 2;
      } else {
        rows.push({ left: line, right: null });
        i++;
      }
    } else {
      rows.push({ left: null, right: line });
      i++;
    }
  }

  return (
    <table className="dev-tool-diff-table w-full">
      <tbody>
        {rows.map((row, idx) => {
          const leftLine = row.left;
          const rightLine = row.right;

          // Char-level diff for changed pairs
          let leftSegments: { text: string; changed: boolean }[] | null = null;
          let rightSegments: { text: string; changed: boolean }[] | null = null;
          if (leftLine?.type === "removed" && rightLine?.type === "added") {
            const cd = charDiff(leftLine.text, rightLine.text);
            leftSegments = cd.oldSegments;
            rightSegments = cd.newSegments;
          }

          return (
            <tr key={idx}>
              <td className="dev-tool-diff-linenum">{leftLine?.oldLine ?? ""}</td>
              <td
                className={`dev-tool-diff-cell ${
                  leftLine?.type === "removed" ? "dev-tool-diff-removed" : leftLine?.type === "equal" ? "" : "dev-tool-diff-empty"
                }`}
              >
                {leftSegments ? (
                  <code>
                    {leftSegments.map((seg, si) => (
                      <span key={si} className={seg.changed ? "dev-tool-diff-char-del" : ""}>{seg.text}</span>
                    ))}
                  </code>
                ) : (
                  <code>{leftLine?.text ?? ""}</code>
                )}
              </td>
              <td className="dev-tool-diff-linenum">{rightLine?.newLine ?? ""}</td>
              <td
                className={`dev-tool-diff-cell ${
                  rightLine?.type === "added" ? "dev-tool-diff-added" : rightLine?.type === "equal" ? "" : "dev-tool-diff-empty"
                }`}
              >
                {rightSegments ? (
                  <code>
                    {rightSegments.map((seg, si) => (
                      <span key={si} className={seg.changed ? "dev-tool-diff-char-add" : ""}>{seg.text}</span>
                    ))}
                  </code>
                ) : (
                  <code>{rightLine?.text ?? ""}</code>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function UnifiedDiffView({ diff }: { diff: DiffLine[] }) {
  return (
    <div className="p-0">
      {diff.map((line, idx) => (
        <div
          key={idx}
          className={`dev-tool-diff-unified-row ${
            line.type === "added"
              ? "dev-tool-diff-added"
              : line.type === "removed"
              ? "dev-tool-diff-removed"
              : ""
          }`}
        >
          <span className="dev-tool-diff-linenum-unified">
            {line.type === "removed" ? line.oldLine : line.type === "added" ? line.newLine : line.oldLine}
          </span>
          <span className="dev-tool-diff-symbol">
            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
          </span>
          <code className="dev-tool-diff-unified-text">{line.text}</code>
        </div>
      ))}
    </div>
  );
}
