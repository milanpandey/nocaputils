import ThemeToggle from "@/components/ThemeToggle";
import VideoEditor from "@/components/video-editor/VideoEditor";

export default function OnlineVideoEditor() {
  return (
    <div className="subtle-pattern min-h-screen">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-8 pt-10 md:px-10 md:pt-12">
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

          <VideoEditor />

          <section className="mt-20 w-full max-w-5xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                Advertisement
              </span>
              <div className="h-px flex-1 bg-[var(--text-soft)]/20" />
            </div>
            <div className="flex h-40 items-center justify-center border-4 border-dashed border-[var(--border-main)]/20 bg-[var(--bg-panel)]/50 text-lg font-black italic text-[var(--text-soft)]/50 md:h-56">
              AdSense Banner Placeholder
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
