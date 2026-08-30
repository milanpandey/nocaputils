"use client";

import { useState, useMemo } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

interface MatchInfo {
  index: number;
  match: string;
  groups: { [key: string]: string | undefined };
  captures: (string | undefined)[];
}

const CHEATSHEET = [
  { category: "Characters", items: [
    { pattern: ".", desc: "Any character except newline" },
    { pattern: "\\d", desc: "Digit [0-9]" },
    { pattern: "\\D", desc: "Non-digit" },
    { pattern: "\\w", desc: "Word char [a-zA-Z0-9_]" },
    { pattern: "\\W", desc: "Non-word char" },
    { pattern: "\\s", desc: "Whitespace" },
    { pattern: "\\S", desc: "Non-whitespace" },
  ]},
  { category: "Anchors", items: [
    { pattern: "^", desc: "Start of string/line" },
    { pattern: "$", desc: "End of string/line" },
    { pattern: "\\b", desc: "Word boundary" },
  ]},
  { category: "Quantifiers", items: [
    { pattern: "*", desc: "0 or more" },
    { pattern: "+", desc: "1 or more" },
    { pattern: "?", desc: "0 or 1" },
    { pattern: "{n}", desc: "Exactly n" },
    { pattern: "{n,m}", desc: "Between n and m" },
    { pattern: "*?", desc: "Lazy 0 or more" },
  ]},
  { category: "Groups", items: [
    { pattern: "(abc)", desc: "Capture group" },
    { pattern: "(?:abc)", desc: "Non-capturing group" },
    { pattern: "(?<name>abc)", desc: "Named capture group" },
    { pattern: "a|b", desc: "Alternation (or)" },
  ]},
  { category: "Common Patterns", items: [
    { pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$", desc: "Email" },
    { pattern: "https?:\\/\\/[^\\s]+", desc: "URL" },
    { pattern: "\\b\\d{1,3}(\\.\\d{1,3}){3}\\b", desc: "IPv4 Address" },
    { pattern: "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", desc: "UUID v4" },
    { pattern: "^\\+?[1-9]\\d{1,14}$", desc: "Phone (E.164)" },
  ]},
];

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+)\\.(\\w+)");
  const [flags, setFlags] = useState("gi");
  const [testString, setTestString] = useState("Contact us at support@example.com or sales@nocaputils.org for more info.");
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleFlag = (flag: string) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.replace(flag, "") : prev + flag
    );
  };

  const { matches, error: regexError } = useMemo(() => {
    if (!pattern) return { matches: [] as MatchInfo[], error: null };

    try {
      const ensuredFlags = flags.includes("g") ? flags : flags + "g";
      const regex = new RegExp(pattern, ensuredFlags);
      const results: MatchInfo[] = [];
      let m: RegExpExecArray | null;

      while ((m = regex.exec(testString)) !== null) {
        results.push({
          index: m.index,
          match: m[0],
          groups: m.groups ?? {},
          captures: Array.from(m).slice(1),
        });
        if (m[0].length === 0) regex.lastIndex++;
        if (results.length > 200) break;
      }

      return { matches: results, error: null };
    } catch (err) {
      return { matches: [] as MatchInfo[], error: (err as Error).message };
    }
  }, [pattern, flags, testString]);

  const highlightedText = useMemo(() => {
    if (!pattern || regexError || matches.length === 0) return null;

    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (m.index > lastEnd) {
        segments.push(
          <span key={`text-${i}`}>{testString.slice(lastEnd, m.index)}</span>
        );
      }
      segments.push(
        <mark
          key={`match-${i}`}
          className="dev-tool-match-highlight"
          title={`Match ${i + 1}`}
        >
          {m.match}
        </mark>
      );
      lastEnd = m.index + m.match.length;
    }
    if (lastEnd < testString.length) {
      segments.push(<span key="text-end">{testString.slice(lastEnd)}</span>);
    }

    return segments;
  }, [matches, testString, pattern, regexError]);

  const copyRegex = () => {
    navigator.clipboard.writeText(`/${pattern}/${flags}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
              🔍 Regex{" "}
              <span className="inline-block border-4 border-[var(--border-main)] bg-[#3B82F6] px-3 py-1 text-white shadow-[4px_4px_0_0_var(--border-main)]">
                Tester
              </span>
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Test regular expressions in real-time with match highlighting, capture groups & cheatsheet.
            </p>
          </section>

          {/* Pattern Input */}
          <section className="mb-6 w-full max-w-4xl">
            <div className="neo-panel p-6">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <label htmlFor="regex-pattern" className="text-xs font-black uppercase tracking-[0.15em]">
                  Regular Expression
                </label>
                <div className="flex gap-2">
                  <button
                    className="neo-button px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                    onClick={() => setShowCheatsheet(!showCheatsheet)}
                    id="regex-cheatsheet-btn"
                  >
                    {showCheatsheet ? "Hide" : "Show"} Cheatsheet
                  </button>
                  <button
                    className="neo-button px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                    onClick={copyRegex}
                    id="regex-copy-btn"
                  >
                    {copied ? "Copied ✓" : "Copy Regex"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-[var(--text-soft)]">/</span>
                <input
                  id="regex-pattern"
                  type="text"
                  className="dev-tool-input flex-1 font-mono"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter regex pattern..."
                  spellCheck={false}
                />
                <span className="text-lg font-mono text-[var(--text-soft)]">/</span>
                <span className="font-mono text-sm text-[var(--text-soft)]">{flags}</span>
              </div>

              {/* Flags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { flag: "g", label: "Global" },
                  { flag: "i", label: "Case Insensitive" },
                  { flag: "m", label: "Multiline" },
                  { flag: "s", label: "Dot All" },
                  { flag: "u", label: "Unicode" },
                ].map(({ flag, label }) => (
                  <button
                    key={flag}
                    className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      flags.includes(flag)
                        ? "bg-[#3B82F6] text-white"
                        : "bg-[var(--bg-panel-muted)]"
                    }`}
                    onClick={() => toggleFlag(flag)}
                    id={`regex-flag-${flag}`}
                  >
                    {flag} — {label}
                  </button>
                ))}
              </div>

              {regexError && (
                <div className="mt-3 rounded border-2 border-[#E63946] px-4 py-2" style={{ background: "rgba(230,57,70,0.1)" }}>
                  <span className="text-xs font-bold text-[#E63946]">⚠️ {regexError}</span>
                </div>
              )}
            </div>
          </section>

          {/* Test String */}
          <section className="mb-6 w-full max-w-4xl">
            <div className="neo-panel p-6">
              <label htmlFor="regex-test" className="mb-3 block text-xs font-black uppercase tracking-[0.15em]">
                Test String
              </label>
              <textarea
                id="regex-test"
                className="dev-tool-textarea font-mono"
                rows={5}
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter text to test against..."
                spellCheck={false}
              />
            </div>
          </section>

          {/* Highlighted Result */}
          {highlightedText && (
            <section className="mb-6 w-full max-w-4xl">
              <div className="neo-panel p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-[0.15em]">
                    Match Result
                  </h2>
                  <span className="text-xs font-bold" style={{ color: "#3B82F6" }}>
                    {matches.length} match{matches.length !== 1 ? "es" : ""} found
                  </span>
                </div>
                <div className="dev-tool-result-box font-mono text-sm whitespace-pre-wrap break-all leading-7">
                  {highlightedText}
                </div>
              </div>
            </section>
          )}

          {/* Capture Groups */}
          {matches.length > 0 && matches.some((m) => m.captures.length > 0) && (
            <section className="mb-6 w-full max-w-4xl">
              <div className="neo-panel p-6">
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.15em]">
                  Match Details & Capture Groups
                </h2>
                <div className="overflow-x-auto">
                  <table className="dev-tool-table w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Match</th>
                        <th>Index</th>
                        {matches[0].captures.length > 0 &&
                          matches[0].captures.map((_, i) => (
                            <th key={i}>Group {i + 1}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m, i) => (
                        <tr key={i}>
                          <td className="font-bold">{i + 1}</td>
                          <td className="font-mono">{m.match}</td>
                          <td>{m.index}</td>
                          {m.captures.map((cap, j) => (
                            <td key={j} className="font-mono">
                              {cap ?? <span className="text-[var(--text-soft)]">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Cheatsheet */}
          {showCheatsheet && (
            <section className="mb-16 w-full max-w-4xl">
              <div className="neo-panel p-6">
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.15em]">
                  📋 Regex Cheat Sheet
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {CHEATSHEET.map((section) => (
                    <div key={section.category}>
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#3B82F6" }}>
                        {section.category}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {section.items.map((item) => (
                          <button
                            key={item.pattern}
                            className="flex items-center gap-3 rounded px-3 py-1.5 text-left text-xs transition-colors hover:bg-[var(--bg-panel-muted)]"
                            onClick={() => setPattern(item.pattern)}
                          >
                            <code className="dev-tool-cheatsheet-code shrink-0">{item.pattern}</code>
                            <span className="text-[var(--text-soft)]">{item.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
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
