import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

const tools = [
  {
    id: "file-bills",
    name: "File Bills & Expense Ledger",
    description: "Organize receipt photos into a compiled printable PDF and Excel summary ledger.",
    status: "Live" as const,
    emoji: "🧾",
    color: "#2A9D8F",
    badge: "PDF + Excel",
    isAvailable: true,
  },
  {
    id: "pdf-merge",
    name: "PDF Merger",
    description: "Combine multiple PDF documents into a single consolidated file offline.",
    status: "Live" as const,
    emoji: "📚",
    color: "#457B9D",
    badge: "Fast & Private",
    isAvailable: true,
  },
  {
    id: "compress-pdf",
    name: "PDF Compressor",
    description: "Compress and reduce PDF file size directly in your browser.",
    status: "Live" as const,
    emoji: "🗜️",
    color: "#E76F51",
    badge: "100% Private",
    isAvailable: true,
  },
  {
    id: "merge-excel",
    name: "Merge Excel Files",
    description: "Combine multiple Excel spreadsheets (.xlsx, .xls, .csv) into one workbook.",
    status: "Live" as const,
    emoji: "📊",
    color: "#107C41",
    badge: "XLSX + CSV",
    isAvailable: true,
  },
  {
    id: "archive-files",
    name: "Archive Files (ZIP/TAR)",
    description: "Compress multiple files into ZIP or extract archives offline without server uploads.",
    status: "Live" as const,
    emoji: "📦",
    color: "#F4A261",
    badge: "ZIP / Extract",
    isAvailable: true,
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word Converter",
    description: "Convert PDF documents to editable Microsoft Word (.docx) files offline.",
    status: "Coming Soon" as const,
    emoji: "📄",
    color: "#E63946",
    badge: "In Development",
    isAvailable: false,
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
                const CardTag = tool.isAvailable ? "a" : "div";
                return (
                  <CardTag
                    key={tool.id}
                    {...(tool.isAvailable ? { href: `/workplaceutilities/${tool.id}` } : {})}
                    className={`bauhaus-game-card ${!tool.isAvailable ? "opacity-75 cursor-not-allowed" : ""}`}
                    id={`workplace-card-${tool.id}`}
                  >
                    <div className="bauhaus-game-card-accent" style={{ background: tool.color }} />
                    <div className="bauhaus-game-card-body">
                      <div className="bauhaus-game-card-top">
                        <span className="bauhaus-game-emoji">{tool.emoji}</span>
                        <div className="bauhaus-game-badges">
                          <span className={`bauhaus-badge ${tool.isAvailable ? "bauhaus-badge--live" : "bg-gray-400 text-black font-bold"}`}>
                            {tool.status}
                          </span>
                          <span className="bauhaus-badge bauhaus-badge--age">{tool.badge}</span>
                        </div>
                      </div>
                      <h3 className="bauhaus-game-name">{tool.name}</h3>
                      <p className="bauhaus-game-desc">{tool.description}</p>
                      <div className="bauhaus-game-play" style={{ color: tool.isAvailable ? tool.color : "#666" }}>
                        {tool.isAvailable ? (
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
