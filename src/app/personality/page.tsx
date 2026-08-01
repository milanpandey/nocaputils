import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

const tests = [
  {
    id: "rorschach-test",
    name: "Rorschach Test",
    description: "Explore 10 interactive inkblots, choose what you see, and discover your perceptual archetype!",
    status: "Live" as const,
    emoji: "🦋",
    color: "#9C27B0",
    ages: "All Ages",
  },
  {
    id: "color-quest",
    name: "Color Quest",
    description: "Discover your true personality color in this fun, quick, mini-adventure!",
    status: "Live" as const,
    emoji: "🎨",
    color: "#F77F00",
    ages: "4-12 Years",
  }
];

const comingSoon: { name: string; description: string; emoji: string; color: string }[] = [];

export default function PersonalityHub() {
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
              <div className="bauhaus-shape bauhaus-shape--circle-red" style={{ background: "#9C27B0" }} />
              <div className="bauhaus-shape bauhaus-shape--rect-blue" style={{ background: "#2A9D8F" }} />
              <div className="bauhaus-shape bauhaus-shape--tri-yellow" style={{ borderBottomColor: "#F77F00" }} />
              <div className="bauhaus-shape bauhaus-shape--line-1" />
              <div className="bauhaus-shape bauhaus-shape--line-2" />
            </div>

            <h1 className="bauhaus-title">
              <span className="bauhaus-title-top" style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}>
                PERSONALITY TESTS
              </span>
              <span className="bauhaus-title-sub">by nocaputils</span>
            </h1>

            <p className="bauhaus-tagline">
              Free. Private. Insightful.<br />
              <span className="bauhaus-tagline-small">No downloads · No ads · 100% browser-based</span>
            </p>
          </section>

          {/* ── Tests Grid ── */}
          <section className="mb-16 w-full max-w-5xl">
            <h2 className="bauhaus-section-title">
              <span className="bauhaus-section-dot" style={{ background: "#9C27B0" }} aria-hidden="true" />
              Take Test
            </h2>

            <div className="bauhaus-game-grid">
              {tests.map((test) => (
                <a
                  key={test.id}
                  href={`/personality/${test.id}`}
                  className="bauhaus-game-card"
                  id={`test-card-${test.id}`}
                >
                  <div className="bauhaus-game-card-accent" style={{ background: test.color }} />
                  <div className="bauhaus-game-card-body">
                    <div className="bauhaus-game-card-top">
                      <span className="bauhaus-game-emoji">{test.emoji}</span>
                      <div className="bauhaus-game-badges">
                        <span className="bauhaus-badge bauhaus-badge--live">{test.status}</span>
                        <span className="bauhaus-badge bauhaus-badge--age">{test.ages}</span>
                      </div>
                    </div>
                    <h3 className="bauhaus-game-name">{test.name}</h3>
                    <p className="bauhaus-game-desc">{test.description}</p>
                    <div className="bauhaus-game-play" style={{ color: test.color }}>
                      Take Test <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* ── Coming Soon ── */}
          {comingSoon.length > 0 && (
            <section className="mb-20 w-full max-w-5xl">
              <h2 className="bauhaus-section-title">
                <span className="bauhaus-section-dot" style={{ background: "#457B9D" }} aria-hidden="true" />
                Coming Soon
              </h2>
              <div className="bauhaus-coming-grid">
                {comingSoon.map((test) => (
                  <div key={test.name} className="bauhaus-coming-card">
                    <div className="bauhaus-coming-accent" style={{ background: test.color }} />
                    <span className="bauhaus-coming-emoji">{test.emoji}</span>
                    <h3 className="bauhaus-coming-name">{test.name}</h3>
                    <p className="bauhaus-coming-desc">{test.description}</p>
                    <span className="bauhaus-coming-label">Coming Soon</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
