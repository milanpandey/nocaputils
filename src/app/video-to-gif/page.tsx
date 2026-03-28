import GifConverterPanel from "@/components/video-to-gif/GifConverterPanel";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Video to GIF Converter | nocaputils",
  description: "Convert video clips to high-quality looping GIFs in your browser.",
};

export default function VideoToGifPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video to GIF</span>
              <span className="mt-3 inline-block rotate-[2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Converter
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "No Watermark", "Privacy First", "Fast Export"].map(
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
              Turn any video segment into a looping, optimized GIF directly on your device.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <GifConverterPanel />
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

        <Footer />
      </div>
    </div>
  );
}
