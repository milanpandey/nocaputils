"use client";

import { useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Alignment = "left" | "center" | "right";

interface Column {
  id: string;
  header: string;
  align: Alignment;
}

interface Row {
  id: string;
  cells: Record<string, string>; // colId -> value
}

const ALIGN_CHARS: Record<Alignment, string> = {
  left: ":---",
  center: ":---:",
  right: "---:",
};

const ALIGN_ICONS: Record<Alignment, string> = {
  left: "⬅",
  center: "↔",
  right: "➡",
};

function makeId() {
  return Math.random().toString(36).slice(2, 8);
}

function generateMarkdown(cols: Column[], rows: Row[]): string {
  if (cols.length === 0) return "";

  const colWidths = cols.map((col) => {
    const maxData = rows.reduce((max, row) => Math.max(max, (row.cells[col.id] ?? "").length), 0);
    return Math.max(col.header.length, maxData, 3);
  });

  const pad = (str: string, width: number, align: Alignment) => {
    if (align === "right") return str.padStart(width);
    if (align === "center") {
      const totalPad = width - str.length;
      const left = Math.floor(totalPad / 2);
      const right = totalPad - left;
      return " ".repeat(left) + str + " ".repeat(right);
    }
    return str.padEnd(width);
  };

  const headerRow =
    "| " + cols.map((col, i) => pad(col.header, colWidths[i], "left")).join(" | ") + " |";
  const separatorRow =
    "| " +
    cols.map((col, i) => {
      const dashes = "-".repeat(colWidths[i]);
      if (col.align === "center") return `:${dashes.slice(1,-1)}:`;
      if (col.align === "right") return `${dashes}:`;
      return `:${dashes.slice(1)}`;
    }).join(" | ") +
    " |";
  const dataRows = rows.map(
    (row) =>
      "| " +
      cols.map((col, i) => pad(row.cells[col.id] ?? "", colWidths[i], col.align)).join(" | ") +
      " |"
  );

  return [headerRow, separatorRow, ...dataRows].join("\n");
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parse = (line: string) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const [headerLine, ...dataLines] = lines;
  return {
    headers: parse(headerLine),
    rows: dataLines.map(parse),
  };
}

const DEFAULT_COLS: Column[] = [
  { id: "c1", header: "Name",   align: "left"   },
  { id: "c2", header: "Role",   align: "left"   },
  { id: "c3", header: "Status", align: "center" },
  { id: "c4", header: "Score",  align: "right"  },
];

const DEFAULT_ROWS: Row[] = [
  { id: "r1", cells: { c1: "Alice",   c2: "Engineer",  c3: "✅ Active", c4: "98"  } },
  { id: "r2", cells: { c1: "Bob",     c2: "Designer",  c3: "✅ Active", c4: "87"  } },
  { id: "r3", cells: { c1: "Charlie", c2: "PM",        c3: "🟡 Away",  c4: "73"  } },
];

export default function MarkdownTableClient() {
  const [cols, setCols] = useState<Column[]>(DEFAULT_COLS);
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [copied, setCopied] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const markdown = generateMarkdown(cols, rows);

  // ── Column operations ──────────────────────────────────────────
  const addColumn = () => {
    const id = makeId();
    setCols((prev) => [...prev, { id, header: "Column", align: "left" }]);
    setRows((prev) =>
      prev.map((row) => ({ ...row, cells: { ...row.cells, [id]: "" } }))
    );
  };

  const removeColumn = (colId: string) => {
    if (cols.length <= 1) return;
    setCols((prev) => prev.filter((c) => c.id !== colId));
    setRows((prev) =>
      prev.map((row) => {
        const cells = { ...row.cells };
        delete cells[colId];
        return { ...row, cells };
      })
    );
  };

  const updateColHeader = (colId: string, value: string) => {
    setCols((prev) => prev.map((c) => (c.id === colId ? { ...c, header: value } : c)));
  };

  const cycleAlign = (colId: string) => {
    const cycle: Alignment[] = ["left", "center", "right"];
    setCols((prev) =>
      prev.map((c) => {
        if (c.id !== colId) return c;
        const idx = cycle.indexOf(c.align);
        return { ...c, align: cycle[(idx + 1) % 3] };
      })
    );
  };

  // ── Row operations ─────────────────────────────────────────────
  const addRow = () => {
    const id = makeId();
    const cells: Record<string, string> = {};
    cols.forEach((c) => (cells[c.id] = ""));
    setRows((prev) => [...prev, { id, cells }]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
      )
    );
  };

  // ── Copy ───────────────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOutput = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // ── CSV Import ────────────────────────────────────────────────
  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { headers, rows: csvRows } = parseCsv(reader.result as string);
        if (headers.length === 0) throw new Error("No headers found");
        const newCols: Column[] = headers.map((h) => ({ id: makeId(), header: h, align: "left" }));
        const newRows: Row[] = csvRows.map((cells) => {
          const id = makeId();
          const cellMap: Record<string, string> = {};
          newCols.forEach((col, i) => (cellMap[col.id] = cells[i] ?? ""));
          return { id, cells: cellMap };
        });
        setCols(newCols);
        setRows(newRows.length > 0 ? newRows : [{ id: makeId(), cells: Object.fromEntries(newCols.map((c) => [c.id, ""])) }]);
      } catch {
        setImportError("Failed to parse CSV. Make sure the first row contains headers.");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }, []);

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
                Table Gen
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["Visual Editor", "CSV Import", "GitHub Flavored", "Zero Setup"].map((label) => (
                <div
                  key={label}
                  className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  {label}
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-xl font-medium leading-9 text-[var(--text-soft)]">
              Build GitHub-Flavored Markdown tables visually. Import CSV, set column alignment, copy in one click.
            </p>
          </section>

          <div className="w-full max-w-5xl flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={addColumn}
                className="neo-button neo-button-theme px-5 py-2.5 text-sm font-black uppercase tracking-widest"
                id="add-column-btn"
              >
                + Add Column
              </button>
              <button
                onClick={addRow}
                className="neo-button neo-button-theme px-5 py-2.5 text-sm font-black uppercase tracking-widest"
                id="add-row-btn"
              >
                + Add Row
              </button>

              <label
                className="neo-button neo-button-theme px-5 py-2.5 text-sm font-black uppercase tracking-widest cursor-pointer"
                id="import-csv-label"
              >
                Import CSV
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvImport}
                />
              </label>

              <div className="ml-auto neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-widest">
                {cols.length} col{cols.length !== 1 ? "s" : ""} · {rows.length} row{rows.length !== 1 ? "s" : ""}
              </div>

              <button
                onClick={handleCopy}
                className={`border-4 border-[var(--border-main)] px-6 py-2.5 text-sm font-black uppercase tracking-widest shadow-[5px_5px_0_0_var(--border-main)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_var(--border-main)] ${
                  copied ? "bg-[var(--success)] text-black" : "bg-[var(--accent)] text-black"
                }`}
                id="copy-table-btn"
              >
                {copied ? "✓ Copied!" : "Copy Markdown"}
              </button>
            </div>

            {importError && (
              <div className="border-l-8 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-red-700 dark:text-red-400 text-sm font-black uppercase">
                ⚠️ {importError}
              </div>
            )}

            {/* Table editor */}
            <div className="neo-panel overflow-x-auto bg-[var(--bg-panel)]">
              <table className="w-full border-collapse text-sm" style={{ minWidth: `${cols.length * 150}px` }}>
                {/* Column header row */}
                <thead>
                  <tr className="bg-[var(--bg-panel-muted)]">
                    {cols.map((col) => (
                      <th
                        key={col.id}
                        className="border-b-4 border-r-4 border-[var(--border-main)] last:border-r-0 p-0"
                      >
                        <div className="flex items-center gap-1 px-3 py-2">
                          <input
                            type="text"
                            value={col.header}
                            onChange={(e) => updateColHeader(col.id, e.target.value)}
                            className="flex-1 bg-transparent font-black uppercase tracking-wide outline-none text-center min-w-0 text-sm"
                            placeholder="Header"
                            id={`col-header-${col.id}`}
                          />
                          <button
                            title={`Alignment: ${col.align}`}
                            onClick={() => cycleAlign(col.id)}
                            className="neo-button neo-button-theme text-xs px-1.5 py-0.5 flex-shrink-0"
                            id={`align-${col.id}`}
                          >
                            {ALIGN_ICONS[col.align]}
                          </button>
                          <button
                            onClick={() => removeColumn(col.id)}
                            className="text-xs opacity-40 hover:text-red-500 hover:opacity-100 transition-opacity flex-shrink-0 font-black px-1"
                            title="Remove column"
                            disabled={cols.length <= 1}
                            id={`remove-col-${col.id}`}
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="border-b-4 border-[var(--border-main)] w-10" />
                  </tr>
                  {/* Alignment hint row */}
                  <tr className="bg-[var(--bg-panel)]">
                    {cols.map((col) => (
                      <td key={col.id} className="px-3 py-1 text-center border-b-2 border-r-4 border-[var(--border-main)] last:border-r-0" style={{ borderBottomColor: "var(--bg-panel-muted)" }}>
                        <span className="font-mono text-xs text-[var(--text-soft)]">{ALIGN_CHARS[col.align]}</span>
                      </td>
                    ))}
                    <td className="border-b-2" style={{ borderBottomColor: "var(--bg-panel-muted)" }} />
                  </tr>
                </thead>

                {/* Data rows */}
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="group hover:bg-[var(--bg-panel-muted)] transition-colors">
                      {cols.map((col) => (
                        <td
                          key={col.id}
                          className={`border-b-2 border-r-4 border-[var(--border-main)] last:border-r-0 px-3 py-2 ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          }`}
                          style={{ borderBottomColor: "var(--bg-panel-muted)" }}
                        >
                          <input
                            type="text"
                            value={row.cells[col.id] ?? ""}
                            onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                            className="w-full bg-transparent outline-none text-sm"
                            placeholder="—"
                            id={`cell-${row.id}-${col.id}`}
                          />
                        </td>
                      ))}
                      <td className="border-b-2 w-10 opacity-0 group-hover:opacity-100 transition-opacity text-center" style={{ borderBottomColor: "var(--bg-panel-muted)" }}>
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                          className="text-xs text-[var(--text-soft)] hover:text-red-500 font-black px-1"
                          title="Remove row"
                          id={`remove-row-${row.id}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Markdown Output */}
            <div className="flex flex-col neo-panel overflow-hidden bg-[var(--bg-panel)]">
              <div className="flex items-center justify-between px-4 py-3 border-b-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                  Markdown Output
                </span>
                <button
                  onClick={handleCopyOutput}
                  className={`neo-button text-xs font-black uppercase tracking-widest px-4 py-1.5 ${
                    copiedOutput ? "bg-[var(--success)] text-black" : "neo-button-theme"
                  }`}
                  id="copy-markdown-output-btn"
                >
                  {copiedOutput ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed whitespace-pre">
                <code>{markdown}</code>
              </pre>
            </div>

            {/* Tip */}
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)] text-center">
              💡 Paste directly into GitHub issues, PRs, Notion, or any Markdown editor.
            </p>
          </div>
        </main>

        <div className="mt-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
