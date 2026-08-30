"use client";

import { useState, useMemo, useCallback } from "react";
import cronstrue from "cronstrue";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

const PRESETS: { label: string; cron: string }[] = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Daily at 9 AM", cron: "0 9 * * *" },
  { label: "Weekly Monday 9 AM", cron: "0 9 * * 1" },
  { label: "Monthly 1st at midnight", cron: "0 0 1 * *" },
  { label: "Weekdays at 6 PM", cron: "0 18 * * 1-5" },
  { label: "Every Sunday noon", cron: "0 12 * * 0" },
];

const FIELD_LABELS = ["Minute", "Hour", "Day (Month)", "Month", "Day (Week)"];
const FIELD_RANGES = ["0–59", "0–23", "1–31", "1–12", "0–7 (Sun=0 or 7)"];

function getNextExecutions(cron: string, count: number): Date[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  try {
    const results: Date[] = [];
    const now = new Date();
    const current = new Date(now);
    current.setSeconds(0, 0);
    current.setMinutes(current.getMinutes() + 1);

    const parseField = (field: string, min: number, max: number): number[] => {
      const values: Set<number> = new Set();
      const subParts = field.split(",");

      for (const sub of subParts) {
        if (sub === "*") {
          for (let i = min; i <= max; i++) values.add(i);
        } else if (sub.includes("/")) {
          const [range, stepStr] = sub.split("/");
          const step = parseInt(stepStr, 10);
          const start = range === "*" ? min : parseInt(range, 10);
          for (let i = start; i <= max; i += step) values.add(i);
        } else if (sub.includes("-")) {
          const [startStr, endStr] = sub.split("-");
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          for (let i = start; i <= end; i++) values.add(i);
        } else {
          values.add(parseInt(sub, 10));
        }
      }
      return Array.from(values).sort((a, b) => a - b);
    };

    const minutes = parseField(parts[0], 0, 59);
    const hours = parseField(parts[1], 0, 23);
    const daysOfMonth = parseField(parts[2], 1, 31);
    const months = parseField(parts[3], 1, 12);
    let daysOfWeek = parseField(parts[4], 0, 7);
    // Normalize Sunday: 7 → 0
    if (daysOfWeek.includes(7)) {
      daysOfWeek = [...new Set([...daysOfWeek.filter(d => d !== 7), 0])].sort((a, b) => a - b);
    }

    const isDayOfMonthRestricted = parts[2] !== "*";
    const isDayOfWeekRestricted = parts[4] !== "*";

    const maxIterations = 525960; // ~1 year of minutes
    for (let iter = 0; iter < maxIterations && results.length < count; iter++) {
      const m = current.getMinutes();
      const h = current.getHours();
      const dom = current.getDate();
      const mon = current.getMonth() + 1;
      const dow = current.getDay();

      const minuteMatch = minutes.includes(m);
      const hourMatch = hours.includes(h);
      const monthMatch = months.includes(mon);

      let dayMatch: boolean;
      if (isDayOfMonthRestricted && isDayOfWeekRestricted) {
        dayMatch = daysOfMonth.includes(dom) || daysOfWeek.includes(dow);
      } else if (isDayOfMonthRestricted) {
        dayMatch = daysOfMonth.includes(dom);
      } else if (isDayOfWeekRestricted) {
        dayMatch = daysOfWeek.includes(dow);
      } else {
        dayMatch = true;
      }

      if (minuteMatch && hourMatch && dayMatch && monthMatch) {
        results.push(new Date(current));
      }

      current.setMinutes(current.getMinutes() + 1);
    }

    return results;
  } catch {
    return [];
  }
}

function validateCron(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "A cron expression must have exactly 5 fields separated by spaces.";

  const patterns = [
    /^(\*|([0-9]|[1-5][0-9])([-,]([0-9]|[1-5][0-9]))*)(\/(([0-9]|[1-5][0-9])))?\s*$/,
    /^(\*|([0-9]|1[0-9]|2[0-3])([-,]([0-9]|1[0-9]|2[0-3]))*)(\/(([0-9]|1[0-9]|2[0-3])))?\s*$/,
    /^(\*|([1-9]|[12][0-9]|3[01])([-,]([1-9]|[12][0-9]|3[01]))*)(\/(([1-9]|[12][0-9]|3[01])))?\s*$/,
    /^(\*|([1-9]|1[0-2])([-,]([1-9]|1[0-2]))*)(\/(([1-9]|1[0-2])))?\s*$/,
    /^(\*|[0-7]([-,][0-7])*)(\/([ 0-7]))?\s*$/,
  ];

  for (let i = 0; i < 5; i++) {
    // Simple validation — allow common patterns
    const field = parts[i];
    if (!/^[\d,\-\*\/]+$/.test(field)) {
      return `Field "${FIELD_LABELS[i]}" contains invalid characters.`;
    }
  }

  return null;
}

export default function CronVisualizerClient() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [copied, setCopied] = useState(false);

  const fields = useMemo(() => expression.trim().split(/\s+/), [expression]);

  const humanReadable = useMemo(() => {
    try {
      return cronstrue.toString(expression, { use24HourTimeFormat: false });
    } catch {
      return null;
    }
  }, [expression]);

  const validationError = useMemo(() => validateCron(expression), [expression]);

  const nextExecutions = useMemo(() => {
    if (validationError) return [];
    return getNextExecutions(expression, 10);
  }, [expression, validationError]);

  const updateField = useCallback(
    (index: number, value: string) => {
      const newFields = [...fields];
      while (newFields.length < 5) newFields.push("*");
      newFields[index] = value || "*";
      setExpression(newFields.join(" "));
    },
    [fields]
  );

  const copyExpression = () => {
    navigator.clipboard.writeText(expression).then(() => {
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
              ⏰ Cron{" "}
              <span className="inline-block border-4 border-[var(--border-main)] bg-[#3B82F6] px-3 py-1 text-white shadow-[4px_4px_0_0_var(--border-main)]">
                Visualizer
              </span>
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Build and understand cron expressions with plain-English translations & next execution times.
            </p>
          </section>

          {/* Expression Input */}
          <section className="mb-6 w-full max-w-4xl">
            <div className="neo-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <label htmlFor="cron-input" className="text-xs font-black uppercase tracking-[0.15em]">
                  Cron Expression
                </label>
                <button
                  className="neo-button px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                  onClick={copyExpression}
                  id="cron-copy-btn"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <input
                id="cron-input"
                type="text"
                className="dev-tool-input text-center text-2xl font-mono tracking-[0.3em]"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                spellCheck={false}
                placeholder="* * * * *"
              />

              {/* Human-readable */}
              {humanReadable && !validationError && (
                <div className="mt-4 rounded border-2 border-[var(--border-main)] px-4 py-3 text-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                  <span className="text-sm font-bold" style={{ color: "#3B82F6" }}>📖 </span>
                  <span className="text-sm font-bold">{humanReadable}</span>
                </div>
              )}

              {validationError && (
                <div className="mt-4 rounded border-2 border-[#E63946] px-4 py-3 text-center" style={{ background: "rgba(230,57,70,0.1)" }}>
                  <span className="text-sm font-bold text-[#E63946]">⚠️ {validationError}</span>
                </div>
              )}
            </div>
          </section>

          {/* Field Breakdown */}
          <section className="mb-6 w-full max-w-4xl">
            <div className="neo-panel p-6">
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.15em]">Field Breakdown</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {FIELD_LABELS.map((label, i) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">{label}</label>
                    <input
                      type="text"
                      className="dev-tool-input text-center font-mono text-sm"
                      value={fields[i] ?? "*"}
                      onChange={(e) => updateField(i, e.target.value)}
                      placeholder="*"
                    />
                    <span className="text-[9px] font-bold text-[var(--text-soft)] text-center">{FIELD_RANGES[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Quick Presets */}
          <section className="mb-6 w-full max-w-4xl">
            <div className="neo-panel p-6">
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.15em]">Quick Presets</h2>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.cron}
                    className={`neo-button px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      expression === preset.cron
                        ? "bg-[#3B82F6] text-white"
                        : "bg-[var(--bg-panel-muted)]"
                    }`}
                    onClick={() => setExpression(preset.cron)}
                    id={`cron-preset-${preset.cron.replace(/\s+/g, "-").replace(/\*/g, "star")}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Next Executions */}
          {nextExecutions.length > 0 && (
            <section className="mb-16 w-full max-w-4xl">
              <div className="neo-panel p-6">
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.15em]">
                  Next 10 Executions
                </h2>
                <div className="flex flex-col gap-1">
                  {nextExecutions.map((date, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded px-3 py-2 text-sm"
                      style={{ background: i % 2 === 0 ? "rgba(59,130,246,0.05)" : "transparent" }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border-main)] bg-[#3B82F6] text-[10px] font-black text-white">
                        {i + 1}
                      </span>
                      <span className="font-mono text-sm">
                        {date.toLocaleString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
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
