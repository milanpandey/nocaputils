import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";
import VideoEditor from "@/components/video-editor/VideoEditor";

export const metadata: Metadata = {
  title: "Online Video Editor | nocaputils",
  description:
    "Edit videos directly in your browser for free. Trim, preview, scrub the timeline, and keep your files private with no uploads.",
  alternates: {
    canonical: "/online-video-editor",
  },
};

export default function OnlineVideoEditor() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "nocaputils Online Video Editor",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    url: "https://nocaputils.com/online-video-editor",
    description:
      "Free privacy-first online video editor that runs directly in your browser with timeline scrubbing, trim tools, and no uploads.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "TripTea",
    },
  };

  return (
    <div className="subtle-pattern min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-10 md:px-10 md:pt-12">
        <div className="absolute right-6 top-8 md:right-10 md:top-10">
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Online Video</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Editor
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "No Sign-In Required", "Privacy First: In-Browser"].map(
                (label) => (
                  <div
                    key={label}
                    className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>

            <p className="mt-8 max-w-4xl text-xl font-medium leading-9 text-[var(--text-soft)]">
              Professional editing tools right in your browser. Your files never leave
              your device.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <VideoEditor />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Edit Videos in Your Browser
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    nocaputils lets you upload a video locally, preview it instantly,
                    scrub through the timeline, and work without sending your file to a
                    server. That makes it faster to start and much safer for private
                    footage.
                  </p>
                  <p>
                    The editor is designed for creators who need quick trim and preview
                    workflows for reels, shorts, demos, and social clips. Because the
                    workspace runs in-browser, you stay in control of the original file
                    the whole time.
                  </p>
                  <p>
                    Upload a clip, drag the timeline to inspect exact moments, and use
                    the workspace as a lightweight browser-based video editor before
                    moving on to deeper transformations.
                  </p>
                  <div className="mt-4">
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Keyboard Shortcuts
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      <li><strong>Space</strong> — Play / Pause</li>
                      <li><strong>← →</strong> — Seek ±1 second</li>
                      <li><strong>Shift + ← →</strong> — Seek ±1 frame (1/30s)</li>
                      <li><strong>Delete / Backspace</strong> — Delete selected clip</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  FAQ
                </h2>
                <div className="mt-6 space-y-5 text-sm leading-7 text-[var(--text-soft)]">
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Does my video upload anywhere?
                    </p>
                    <p className="mt-2">
                      No. Files are handled locally in your browser session.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Can I use portrait videos?
                    </p>
                    <p className="mt-2">
                      Yes. Portrait and landscape clips stay inside a fixed preview
                      frame with letterboxing instead of stretching the layout.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      What formats are supported?
                    </p>
                    <p className="mt-2">MP4, WEBM, MOV, and most browser-playable video files.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                  Advertisement
                </span>
                <div className="h-px flex-1 bg-[var(--text-soft)]/20" />
              </div>
              <div className="neo-panel flex h-40 items-center justify-center bg-[var(--bg-panel)]/50 text-lg font-black italic text-[var(--text-soft)]/50 md:h-56">
                AdSense Banner Placeholder
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-16 border-t-4 border-[var(--border-main)] py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em]">
                A Project By
              </p>
              <span className="border-2 border-[var(--border-main)] bg-[var(--bg-dark)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-white">
                TripTea
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-[11px] font-black uppercase tracking-[0.22em]">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact Support</a>
            </div>

            <div className="flex gap-3">
              <div className="neo-button flex h-10 w-10 items-center justify-center bg-[var(--bg-panel)] text-lg">
                {"\u2197"}
              </div>
              <div className="neo-button flex h-10 w-10 items-center justify-center bg-[var(--bg-panel)] text-lg">
                {"\u25CE"}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
