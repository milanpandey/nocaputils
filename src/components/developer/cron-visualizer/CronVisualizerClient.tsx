"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
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

const FIELD_BOUNDS: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

function parseCronField(field: string, min: number, max: number): number[] | null {
  if (!field) return null;
  const values = new Set<number>();

  for (const sub of field.split(",")) {
    if (!sub) return null;
    if (sub === "*") {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (sub.includes("/")) {
      const slashParts = sub.split("/");
      if (slashParts.length !== 2) return null;
      const [range, stepStr] = slashParts;
      const step = parseInt(stepStr, 10);
      if (!/^\d+$/.test(stepStr) || Number.isNaN(step) || step <= 0) return null;

      let start = min;
      let end = max;
      if (range !== "*") {
        if (range.includes("-")) {
          const bounds = range.split("-");
          if (bounds.length !== 2) return null;
          start = parseInt(bounds[0], 10);
          end = parseInt(bounds[1], 10);
        } else {
          start = parseInt(range, 10);
        }
      }
      if (Number.isNaN(start) || Number.isNaN(end) || start < min || end > max || start > end) {
        return null;
      }
      for (let i = start; i <= end; i += step) values.add(i);
    } else if (sub.includes("-")) {
      const bounds = sub.split("-");
      if (bounds.length !== 2) return null;
      const start = parseInt(bounds[0], 10);
      const end = parseInt(bounds[1], 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start < min || end > max || start > end) {
        return null;
      }
      for (let i = start; i <= end; i++) values.add(i);
    } else {
      if (!/^\d+$/.test(sub)) return null;
      const val = parseInt(sub, 10);
      if (Number.isNaN(val) || val < min || val > max) return null;
      values.add(val);
    }
  }

  return values.size > 0 ? Array.from(values).sort((a, b) => a - b) : null;
}

function getNextExecutions(cron: string, count: number): Date[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const minutes = parseCronField(parts[0], 0, 59);
  const hours = parseCronField(parts[1], 0, 23);
  const daysOfMonth = parseCronField(parts[2], 1, 31);
  const months = parseCronField(parts[3], 1, 12);
  const rawDow = parseCronField(parts[4], 0, 7);
  if (!minutes || !hours || !daysOfMonth || !months || !rawDow) return [];

  const daysOfWeek = Array.from(new Set(rawDow.map((d) => (d === 7 ? 0 : d)))).sort((a, b) => a - b);
  const isDomRestricted = parts[2] !== "*";
  const isDowRestricted = parts[4] !== "*";

  const results: Date[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const maxTime = cursor.getTime() + 45 * 366 * 24 * 60 * 60 * 1000;
  let guard = 0;

  while (cursor.getTime() <= maxTime && results.length < count && guard++ < 8000) {
    const mon = cursor.getMonth() + 1;
    if (!months.includes(mon)) {
      const nextMon = months.find((m) => m > mon);
      if (nextMon !== undefined) {
        cursor.setMonth(nextMon - 1, 1);
      } else {
        cursor.setFullYear(cursor.getFullYear() + 1, months[0] - 1, 1);
      }
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    const dom = cursor.getDate();
    const dow = cursor.getDay();
    const dayMatch =
      isDomRestricted && isDowRestricted
        ? daysOfMonth.includes(dom) || daysOfWeek.includes(dow)
        : isDomRestricted
          ? daysOfMonth.includes(dom)
          : isDowRestricted
            ? daysOfWeek.includes(dow)
            : true;

    if (!dayMatch) {
      cursor.setDate(dom + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    const h = cursor.getHours();
    if (!hours.includes(h)) {
      const nextH = hours.find((hr) => hr > h);
      if (nextH !== undefined) {
        cursor.setHours(nextH, minutes[0], 0, 0);
      } else {
        cursor.setDate(dom + 1);
        cursor.setHours(hours[0], minutes[0], 0, 0);
      }
      continue;
    }

    const m = cursor.getMinutes();
    if (!minutes.includes(m)) {
      const nextM = minutes.find((minVal) => minVal > m);
      if (nextM !== undefined) {
        cursor.setMinutes(nextM, 0, 0);
      } else {
        cursor.setHours(h + 1, minutes[0], 0, 0);
      }
      continue;
    }

    results.push(new Date(cursor));
    cursor.setMinutes(m + 1, 0, 0);
  }

  return results;
}

function validateCron(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "A cron expression must have exactly 5 fields separated by spaces.";

  for (let i = 0; i < 5; i++) {
    const field = parts[i];
    if (!/^[\d,\-\*\/]+$/.test(field)) {
      return `Field "${FIELD_LABELS[i]}" contains invalid characters.`;
    }
    const [min, max] = FIELD_BOUNDS[i];
    if (!parseCronField(field, min, max)) {
      return `Field "${FIELD_LABELS[i]}" is out of range (${FIELD_RANGES[i]}) or uses an invalid step/range.`;
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
          <Link href="/developer-tools" className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all">
            ← Dev Tools
          </Link>
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
