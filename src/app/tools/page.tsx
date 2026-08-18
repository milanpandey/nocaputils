"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import {
  ALL_TOOLS,
  CATEGORIES,
  searchTools,
  type ToolCategory,
  type ToolEntry,
} from "@/lib/toolRegistry";

function ToolsPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    let results: ToolEntry[] = searchTools(query);
    if (activeCategory !== "all") {
      results = results.filter((t) => t.category === activeCategory);
    }
    return results;
  }, [query, activeCategory]);

  const categoryLabel = (key: ToolCategory | "all") => {
    if (key === "all") return "All";
    return CATEGORIES.find((c) => c.key === key)?.label ?? key;
  };

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a
            href="/"
            className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            ← Home
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          {/* ── Header ── */}
          <section className="mb-12 max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl">
              Explore All{" "}
              <span className="inline-block border-4 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-black shadow-[4px_4px_0_0_var(--border-main)]">
                Tools
              </span>
            </h1>
            <p className="mt-6 text-sm font-bold uppercase leading-7 tracking-[0.12em] text-[var(--text-soft)]">
              {ALL_TOOLS.length} free tools across {CATEGORIES.length} categories — all running in your browser.
            </p>
          </section>

          {/* ── Search ── */}
          <section className="mb-8 flex w-full max-w-6xl justify-center">
            <div className="neo-search-wrapper">
              <span className="neo-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="neo-search"
                placeholder="Search tools…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                id="tools-search"
              />
            </div>
          </section>

          {/* ── Category Filters ── */}
          <section className="mb-10 w-full max-w-6xl">
            <div className="filter-pills">
              {(["all", ...CATEGORIES.map((c) => c.key)] as const).map((key) => (
                <button
                  key={key}
                  className={`filter-pill ${activeCategory === key ? "filter-pill--active" : ""}`}
                  onClick={() => setActiveCategory(key as ToolCategory | "all")}
                  id={`filter-${key}`}
                >
                  {categoryLabel(key as ToolCategory | "all")}
                </button>
              ))}
            </div>
          </section>

          {/* ── Results Count ── */}
          <p className="results-count mb-6">
            {filtered.length} tool{filtered.length !== 1 ? "s" : ""} found
            {query && ` for "${query}"`}
            {activeCategory !== "all" && ` in ${categoryLabel(activeCategory)}`}
          </p>

          {/* ── Tool Grid ── */}
          <section className="mb-20 w-full max-w-6xl">
            {filtered.length === 0 ? (
              <div className="no-results">
                <div className="no-results-emoji">🔍</div>
                <p className="no-results-text">No tools found. Try a different search.</p>
              </div>
            ) : (
              <div className="compact-grid">
                {filtered.map((tool) => {
                  const catMeta = CATEGORIES.find((c) => c.key === tool.category);
                  const isAvailable = tool.status === "Live";
                  const Tag = isAvailable ? "a" : "div";

                  return (
                    <Tag
                      key={tool.id}
                      {...(isAvailable ? { href: tool.href } : {})}
                      className={`compact-card ${!isAvailable ? "opacity-60 cursor-not-allowed" : ""}`}
                      id={`tool-${tool.id}`}
                    >
                      <div className="compact-card-emoji">{tool.emoji}</div>
                      <div className="compact-card-body">
                        <div className="compact-card-header">
                          <span className="compact-card-name">{tool.name}</span>
                          <span
                            className="compact-card-badge"
                            style={{ background: catMeta?.color ?? "#ccc", color: "#000" }}
                          >
                            {catMeta?.label}
                          </span>
                        </div>
                        <p className="compact-card-desc">{tool.description}</p>
                      </div>
                    </Tag>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense>
      <ToolsPageContent />
    </Suspense>
  );
}
