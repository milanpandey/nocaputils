import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

const tools = [
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF documents to editable Microsoft Word (.docx) files offline.",
    status: "Live" as const,
    emoji: "📄",
    color: "#E63946",
    badge: "100% Private",
  },
  {
    id: "pdf-merge",
    name: "PDF Merge",
    description: "Combine up to 5 PDF files into a single document with drag-and-drop ordering & compression options.",
    status: "Live" as const,
    emoji: "📑",
    color: "#457B9D",
    badge: "Reorder & Merge",
  },
  {
    id: "file-bills",
    name: "File Bills",
    description: "Organize receipt photos & PDFs into a compiled printable PDF and Excel summary ledger.",
    status: "Live" as const,
    emoji: "🧾",
    color: "#2A9D8F",
    badge: "PDF + Excel",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Shrink PDF file size in your browser with interactive quality presets and file size estimators.",
    status: "Live" as const,
    emoji: "📦",
    color: "#F4D35E",
    badge: "Size Savings",
  },
];

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
          <section className="bauhaus-hero mb-16 text-center">
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
              {tools.map((tool) => (
                <a
                  key={tool.id}
                  href={`/workplaceutilities/${tool.id}`}
                  className="bauhaus-game-card"
                  id={`workplace-card-${tool.id}`}
                >
                  <div className="bauhaus-game-card-accent" style={{ background: tool.color }} />
                  <div className="bauhaus-game-card-body">
                    <div className="bauhaus-game-card-top">
                      <span className="bauhaus-game-emoji">{tool.emoji}</span>
                      <div className="bauhaus-game-badges">
                        <span className="bauhaus-badge bauhaus-badge--live">{tool.status}</span>
                        <span className="bauhaus-badge bauhaus-badge--age" style={{ background: "#111827", color: "#FFF" }}>{tool.badge}</span>
                      </div>
                    </div>
                    <h3 className="bauhaus-game-name">{tool.name}</h3>
                    <p className="bauhaus-game-desc">{tool.description}</p>
                    <div className="bauhaus-game-play" style={{ color: tool.color }}>
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
