import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { getToolsByCategory } from "@/lib/toolRegistry";

const tools = getToolsByCategory("workplace");

export default function WorkplaceUtilitiesHub() {
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
          <section className="bauhaus-hero mb-20 text-center">
            {/* Decorative shapes */}
            <div className="bauhaus-hero-shapes" aria-hidden="true">
              <div className="bauhaus-shape bauhaus-shape--rect-blue" style={{ background: "#457B9D" }} />
              <div className="bauhaus-shape bauhaus-shape--circle-red" style={{ background: "#E63946" }} />
              <div className="bauhaus-shape bauhaus-shape--tri-yellow" style={{ borderBottomColor: "#F4D35E" }} />
            </div>

            <h1 className="bauhaus-title">
              <span className="bauhaus-title-top" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
                WORKPLACE UTILITIES
              </span>
              <span className="bauhaus-title-sub">by nocaputils</span>
            </h1>

            <p className="bauhaus-tagline mt-4">
              Free. Private. Productive.<br />
              <span className="bauhaus-tagline-small">No downloads · No ads · 100% browser-based</span>
            </p>
          </section>

          {/* ── Tools Grid ── */}
          <section className="mb-16 w-full max-w-5xl">
            <h2 className="bauhaus-section-title">
              <span className="bauhaus-section-dot" style={{ background: "#2A9D8F" }} aria-hidden="true" />
              Workplace Tools
            </h2>

            <div className="bauhaus-game-grid">
              {tools.map((tool) => {
                const isAvailable = tool.status === "Live";
                const CardTag = isAvailable ? "a" : "div";
                return (
                  <CardTag
                    key={tool.id}
                    {...(isAvailable ? { href: tool.href } : {})}
                    className={`bauhaus-game-card ${!isAvailable ? "opacity-75 cursor-not-allowed" : ""}`}
                    id={`workplace-card-${tool.id}`}
                  >
                    <div className="bauhaus-game-card-accent" style={{ background: tool.color }} />
                    <div className="bauhaus-game-card-body">
                      <div className="bauhaus-game-card-top">
                        <span className="bauhaus-game-emoji">{tool.emoji}</span>
                        <div className="bauhaus-game-badges">
                          <span className={`bauhaus-badge ${isAvailable ? "bauhaus-badge--live" : "bg-gray-400 text-black font-bold"}`}>
                            {tool.status}
                          </span>
                          {tool.badge && (
                            <span className="bauhaus-badge bauhaus-badge--age">{tool.badge}</span>
                          )}
                        </div>
                      </div>
                      <h3 className="bauhaus-game-name">{tool.name}</h3>
                      <p className="bauhaus-game-desc">{tool.description}</p>
                      <div className="bauhaus-game-play" style={{ color: isAvailable ? tool.color : "#666" }}>
                        {isAvailable ? (
                          <>Open Tool <span aria-hidden="true">→</span></>
                        ) : (
                          <>Coming Soon</>
                        )}
                      </div>
                    </div>
                  </CardTag>
                );
              })}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
