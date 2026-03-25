import CompressorPanel from "@/components/video-compressor/CompressorPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { getTripTeaLink } from "@/lib/constants";

export const metadata = {
  title: "Video Compressor | nocaputils",
  description: "Compress video file size for Discord, Email, and social media directly in your browser.",
};

export default function CompressVideoPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-20 md:px-10 md:pt-12">
        <div className="absolute left-6 top-6 z-10 md:left-10 md:top-10">
          <a
            href="/"
            className="neo-button flex items-center gap-2 bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-wider"
          >
            ← Home
          </a>
        </div>
        <div className="absolute right-6 top-6 z-10 md:right-10 md:top-10">
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Compressor
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "Privacy First", "Discord Ready", "No Upoads"].map(
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
              Squish your videos down to a specific file size locally in your browser to meet upload limits.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <CompressorPanel />
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                Advertisement
              </span>
              <div className="h-px flex-1 bg-[var(--text-soft)]/20" />
            </div>
            <div className="neo-panel flex h-40 items-center justify-center bg-[var(--bg-panel)]/50 text-lg font-black italic text-[var(--text-soft)]/50 md:h-56">
              AdSense Banner Placeholder
            </div>
          </section>
        </main>

        <footer className="mt-16 w-full border-t-4 border-[var(--border-main)] py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em]">
                A Project By
              </p>
              <a
                href={getTripTeaLink("video_compressor")}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] !text-black shadow-[3px_3px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border-main)]"
              >
                TripTea
              </a>
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
