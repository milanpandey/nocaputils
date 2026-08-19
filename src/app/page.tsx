import ThemeToggle from "@/components/ThemeToggle";
import { getTripTeaLink, SHOW_TRIPTEA } from "@/lib/constants";
import Footer from "@/components/Footer";
import { POPULAR_TOOLS, CATEGORIES } from "@/lib/toolRegistry";
import HomepageSearch from "@/components/HomepageSearch";

export default function Home() {
  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-12 flex justify-end">
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          {/* ── Hero ── */}
          <section className="mb-8 max-w-4xl text-center">
            <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-[var(--text-main)] sm:text-6xl lg:text-[5.5rem]">
              <span className="block">Level Up Your</span>
              <span className="my-2 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-4 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Toolkit
              </span>
            </h1>

            <div className="mt-10 flex flex-col items-center gap-5">
              <p className="text-2xl font-extrabold uppercase tracking-[-0.04em] sm:text-3xl">
                The ultimate{" "}
                <span className="border-2 border-[var(--border-main)] bg-[var(--accent)] px-2 py-1 text-black shadow-[4px_4px_0_0_var(--border-main)]">nocaputils</span>{" "}
                suite.
              </p>
              <p className="max-w-2xl text-base font-medium leading-7 text-[var(--text-soft)] sm:text-lg">
                {SHOW_TRIPTEA && (
                  <>
                    Powered by <span className="font-black text-[var(--text-main)]">TripTea</span>.{" "}
                  </>
                )}
                Get professional-grade tools with{" "}
                <span className="font-black text-[var(--text-main)]">
                  100% private in-browser processing
                </span>
                . No uploads, zero servers, total control.{" "}
                Check out the{" "}
                <a
                  href="/blog"
                  className="inline-block border-2 border-[var(--border-main)] bg-[var(--accent)] px-1.5 py-0.5 font-black text-black shadow-[3px_3px_0_0_var(--border-main)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border-main)] transition-all"
                >
                  Blog
                </a>{" "}
                for creator tips &amp; tool updates.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {[
                "100% Private",
                "100% Free",
                "No Sign-In Required",
                "No Watermark",
                "Zero Servers",
              ].map((label) => (
                <div
                  key={label}
                  className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* ── Search Bar ── */}
          <section className="mb-12 flex w-full max-w-6xl justify-center">
            <HomepageSearch />
          </section>

          {SHOW_TRIPTEA && (
            <section className="neo-panel mb-20 grid w-full max-w-6xl grid-cols-1 gap-10 bg-[var(--bg-panel)] p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
              <div className="flex flex-col justify-center">
                <h2 className="mb-6 text-4xl font-black uppercase italic leading-none tracking-[-0.06em] sm:text-6xl">
                  Meet{" "}
                  <span className="inline-block border-4 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-black not-italic">
                    TripTea
                  </span>
                </h2>
                <p className="mb-6 max-w-xl text-2xl font-extrabold uppercase leading-[1.25] tracking-[-0.04em]">
                  Simply describe your dream vacation in plain language, and our AI
                  creates a complete, day-by-day itinerary tailored to your preferences.
                </p>
                <p className="mb-10 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
                  Whether it&apos;s a romantic getaway to Paris, an adventure trek in the
                  Himalayas, or a family beach vacation, TripTea handles it all.
                </p>
                <a
                  href={getTripTeaLink("homepage")}
                  target="_blank"
                  rel="noreferrer"
                  className="neo-button neo-button-theme inline-flex px-8 py-4 text-lg font-black uppercase tracking-[0.2em] transition-colors"
                >
                  Download on Google Play
                </a>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[20rem] rotate-[4deg] border-4 border-[var(--border-main)] bg-[var(--accent)] p-4 text-black shadow-[8px_8px_0_0_var(--border-main)]">
                  <div className="absolute -left-2 -top-2 border-2 border-[var(--border-main)] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    New App
                  </div>
                  <div className="phone-screen overflow-hidden rounded-[1.25rem] border-4 border-[var(--border-main)] p-3">
                    <div className="overflow-hidden rounded-[1rem] border-2 border-[var(--border-main)] bg-white">
                      <img
                        src="/media/app_screen.jpg"
                        alt="TripTea app screen"
                        className="aspect-[9/16] h-full w-full object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Popular Tools ── */}
          <section id="popular" className="mb-20 w-full max-w-6xl">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <h2 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl">
                Popular
                <br />
                Tools
              </h2>
              <p className="max-w-sm text-sm font-bold uppercase leading-7 tracking-[0.18em] text-[var(--text-soft)] md:text-right">
                The most-used tools across all categories.
              </p>
            </div>

            <div className="compact-grid">
              {POPULAR_TOOLS.map((tool) => {
                const catMeta = CATEGORIES.find((c) => c.key === tool.category);
                return (
                  <a
                    key={tool.id}
                    href={tool.href}
                    className="compact-card"
                    id={`popular-${tool.id}`}
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
                  </a>
                );
              })}
            </div>
          </section>

          {/* ── Browse by Category ── */}
          <section id="categories" className="mb-20 w-full max-w-6xl">
            <div className="mb-10">
              <h2 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-5xl">
                Browse by Category
              </h2>
            </div>

            <div className="category-grid">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.key}
                  href={cat.href}
                  className="category-card"
                  style={{ borderLeftColor: cat.color }}
                  id={`category-${cat.key}`}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[6px]"
                    style={{ background: cat.color }}
                  />
                  <span className="category-card-emoji">{cat.emoji}</span>
                  <div className="category-card-body">
                    <h3 className="category-card-title">{cat.label}</h3>
                    <p className="category-card-desc">{cat.tagline}</p>
                  </div>
                  <span className="category-card-arrow">→</span>
                </a>
              ))}
            </div>
          </section>

          {/* ── Explore All CTA ── */}
          <section className="neo-panel mb-24 w-full max-w-6xl !bg-[var(--bg-panel)] px-6 py-16 text-center text-[var(--text-main)] sm:px-10 sm:py-20">
            <h2 className="text-5xl font-black uppercase italic leading-none tracking-[-0.06em] sm:text-7xl">
              Want More?
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg font-extrabold uppercase leading-8 tracking-[0.12em]">
              Discover all {POPULAR_TOOLS.length > 0 ? "28+" : ""} tools in one place.
            </p>
            <div className="mt-12">
              <a
                href="/tools"
                className="neo-button neo-button-theme inline-flex px-12 py-5 text-2xl font-black uppercase tracking-[0.2em] transition-all"
              >
                Explore All Tools
              </a>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
}
