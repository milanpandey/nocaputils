import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { getToolsByCategory } from "@/lib/toolRegistry";

const tools = getToolsByCategory("creator");

export default function CreatorToolsHub() {
  return (
    <div className="bauhaus-page min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="bauhaus-back-link">
            <span aria-hidden="true">←</span> Home
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          {/* ── Hero ── */}
          <section className="bauhaus-hero mb-20">
            {/* Decorative shapes */}
            <div className="bauhaus-hero-shapes" aria-hidden="true">
              <div className="bauhaus-shape bauhaus-shape--circle-red" style={{ background: "#F2EF13" }} />
              <div className="bauhaus-shape bauhaus-shape--rect-blue" style={{ background: "#457B9D" }} />
              <div className="bauhaus-shape bauhaus-shape--tri-yellow" />
              <div className="bauhaus-shape bauhaus-shape--line-1" />
              <div className="bauhaus-shape bauhaus-shape--line-2" />
            </div>

            <h1 className="bauhaus-title">
              <span className="bauhaus-title-top">CREATOR TOOLS</span>
              <span className="bauhaus-title-sub">by nocaputils</span>
            </h1>

            <p className="bauhaus-tagline">
              Professional. Private. Powerful.<br />
              <span className="bauhaus-tagline-small">No downloads · No ads · 100% browser-based</span>
            </p>
          </section>

          {/* ── Tools Grid ── */}
          <section className="mb-16 w-full max-w-5xl">
            <h2 className="bauhaus-section-title">
              <span className="bauhaus-section-dot" style={{ background: "#F2EF13" }} aria-hidden="true" />
              Audio &amp; Video Tools
            </h2>

            <div className="bauhaus-game-grid">
              {tools.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.href}
                  className="bauhaus-game-card"
                  id={`creator-card-${tool.id}`}
                >
                  <div className="bauhaus-game-card-accent" style={{ background: tool.color }} />
                  <div className="bauhaus-game-card-body">
                    <div className="bauhaus-game-card-top">
                      <span className="bauhaus-game-emoji">{tool.emoji}</span>
                      <div className="bauhaus-game-badges">
                        <span className="bauhaus-badge bauhaus-badge--live">{tool.status}</span>
                      </div>
                    </div>
                    <h3 className="bauhaus-game-name">{tool.name}</h3>
                    <p className="bauhaus-game-desc">{tool.description}</p>
                    <div className="bauhaus-game-play">
                      Open Tool <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
