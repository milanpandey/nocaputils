import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import type { ToolEntry } from "@/lib/toolRegistry";

export interface CategoryHubShapeConfig {
  circleColor?: string;
  rectColor?: string;
  triColor?: string;
  showLines?: boolean;
  /** Render rectangle before circle to preserve category-specific hero balance. */
  rectFirst?: boolean;
}

export interface CategoryHubPageProps {
  title: string;
  titleFontSize?: string;
  taglineLead: string;
  taglineSub: string;
  sectionTitle: string;
  sectionDotColor: string;
  tools: ToolEntry[];
  actionLabel?: string;
  cardIdPrefix: string;
  useToolColorForAction?: boolean;
  centerHero?: boolean;
  shapes?: CategoryHubShapeConfig;
}

/**
 * Shared Bauhaus-styled hub layout for category index pages, rendering cards
 * with Next.js client navigation (`Link`) and category decorative accents.
 */
export default function CategoryHubPage({
  title,
  titleFontSize,
  taglineLead,
  taglineSub,
  sectionTitle,
  sectionDotColor,
  tools,
  actionLabel = "Open Tool",
  cardIdPrefix,
  useToolColorForAction = false,
  centerHero = false,
  shapes = {},
}: CategoryHubPageProps) {
  const {
    circleColor,
    rectColor,
    triColor,
    showLines = true,
    rectFirst = false,
  } = shapes;

  const circleEl = (
    <div
      key="circle"
      className="bauhaus-shape bauhaus-shape--circle-red"
      style={circleColor ? { background: circleColor } : undefined}
    />
  );
  const rectEl = (
    <div
      key="rect"
      className="bauhaus-shape bauhaus-shape--rect-blue"
      style={rectColor ? { background: rectColor } : undefined}
    />
  );

  return (
    <div className="bauhaus-page min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="bauhaus-back-link">
            <span aria-hidden="true">←</span> Home
          </Link>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          <section className={`bauhaus-hero mb-20 ${centerHero ? "text-center" : ""}`}>
            <div className="bauhaus-hero-shapes" aria-hidden="true">
              {rectFirst ? [rectEl, circleEl] : [circleEl, rectEl]}
              <div
                className="bauhaus-shape bauhaus-shape--tri-yellow"
                style={triColor ? { borderBottomColor: triColor } : undefined}
              />
              {showLines && (
                <>
                  <div className="bauhaus-shape bauhaus-shape--line-1" />
                  <div className="bauhaus-shape bauhaus-shape--line-2" />
                </>
              )}
            </div>

            <h1 className="bauhaus-title">
              <span
                className="bauhaus-title-top"
                style={titleFontSize ? { fontSize: titleFontSize } : undefined}
              >
                {title}
              </span>
              <span className="bauhaus-title-sub">by nocaputils</span>
            </h1>

            <p className={`bauhaus-tagline ${centerHero ? "mt-4" : ""}`}>
              {taglineLead}
              <br />
              <span className="bauhaus-tagline-small">{taglineSub}</span>
            </p>
          </section>

          <section className="mb-16 w-full max-w-5xl">
            <h2 className="bauhaus-section-title">
              <span
                className="bauhaus-section-dot"
                style={{ background: sectionDotColor }}
                aria-hidden="true"
              />
              {sectionTitle}
            </h2>

            <div className="bauhaus-game-grid">
              {tools.map((tool) => {
                const isAvailable = tool.status === "Live";
                const cardBody = (
                  <>
                    <div className="bauhaus-game-card-accent" style={{ background: tool.color }} />
                    <div className="bauhaus-game-card-body">
                      <div className="bauhaus-game-card-top">
                        <span className="bauhaus-game-emoji">{tool.emoji}</span>
                        <div className="bauhaus-game-badges">
                          <span
                            className={`bauhaus-badge ${
                              isAvailable
                                ? "bauhaus-badge--live"
                                : "bg-gray-400 font-bold text-black"
                            }`}
                          >
                            {tool.status}
                          </span>
                          {tool.badge && (
                            <span className="bauhaus-badge bauhaus-badge--age">{tool.badge}</span>
                          )}
                        </div>
                      </div>
                      <h3 className="bauhaus-game-name">{tool.name}</h3>
                      <p className="bauhaus-game-desc">{tool.description}</p>
                      <div
                        className="bauhaus-game-play"
                        style={
                          useToolColorForAction
                            ? { color: isAvailable ? tool.color : "#666" }
                            : undefined
                        }
                      >
                        {isAvailable ? (
                          <>
                            {actionLabel} <span aria-hidden="true">→</span>
                          </>
                        ) : (
                          <>Coming Soon</>
                        )}
                      </div>
                    </div>
                  </>
                );

                if (isAvailable) {
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="bauhaus-game-card"
                      id={`${cardIdPrefix}-${tool.id}`}
                    >
                      {cardBody}
                    </Link>
                  );
                }

                return (
                  <div
                    key={tool.id}
                    className="bauhaus-game-card cursor-not-allowed opacity-75"
                    id={`${cardIdPrefix}-${tool.id}`}
                  >
                    {cardBody}
                  </div>
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
