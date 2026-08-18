import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { getToolsByCategory } from "@/lib/toolRegistry";

const games = getToolsByCategory("games");

export default function GamesHub() {
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
              <div className="bauhaus-shape bauhaus-shape--circle-red" />
              <div className="bauhaus-shape bauhaus-shape--rect-blue" />
              <div className="bauhaus-shape bauhaus-shape--tri-yellow" />
              <div className="bauhaus-shape bauhaus-shape--line-1" />
              <div className="bauhaus-shape bauhaus-shape--line-2" />
            </div>

            <h1 className="bauhaus-title">
              <span className="bauhaus-title-top">GAMES</span>
              <span className="bauhaus-title-sub">by nocaputils</span>
            </h1>

            <p className="bauhaus-tagline">
              Free. Private. Fun.<br />
              <span className="bauhaus-tagline-small">No downloads · No ads · 100% browser-based</span>
            </p>
          </section>

          {/* ── Live Games ── */}
          <section className="mb-16 w-full max-w-5xl">
            <h2 className="bauhaus-section-title">
              <span className="bauhaus-section-dot" style={{ background: "#E63946" }} aria-hidden="true" />
              Play Now
            </h2>

            <div className="bauhaus-game-grid">
              {games.map((game) => (
                <a
                  key={game.id}
                  href={game.href}
                  className="bauhaus-game-card"
                  id={`game-card-${game.id}`}
                >
                  <div className="bauhaus-game-card-accent" style={{ background: game.color }} />
                  <div className="bauhaus-game-card-body">
                    <div className="bauhaus-game-card-top">
                      <span className="bauhaus-game-emoji">{game.emoji}</span>
                      <div className="bauhaus-game-badges">
                        <span className="bauhaus-badge bauhaus-badge--live">{game.status}</span>
                        {game.badge && (
                          <span className="bauhaus-badge bauhaus-badge--age">{game.badge}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="bauhaus-game-name">{game.name}</h3>
                    <p className="bauhaus-game-desc">{game.description}</p>
                    <div className="bauhaus-game-play">
                      Play Now <span aria-hidden="true">→</span>
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
