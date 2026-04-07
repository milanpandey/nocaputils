import GifConverterPanel from "@/components/video-to-gif/GifConverterPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
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

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Create High-Quality Looping GIFs
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    GIFs are the lifeblood of the modern web, from social media to technical tutorials.
                    However, many online converters are slow, add intrusive watermarks, or compress
                    your content into a pixelated mess. **nocaputils** changes this by giving you
                    professional-grade conversion tools directly in your browser.
                  </p>
                  <p>
                    Our converter puts you in full control of the output parameters. You can choose
                    the frames per second (FPS), output dimensions, and optimization levels for your
                    GIF. This makes it easy to balance file size with visual clarity, ensuring your
                    animations look great everywhere.
                  </p>
                  <p>
                    Because we use client-side processing, you can convert clips from personal videos
                    or sensitive demos without ever worrying about where that data is stored. Just
                    select your video, trim the segment you want to loops, and export your GIF in
                    seconds.
                  </p>
                </div>
              </div>

              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  FAQ
                </h2>
                <div className="mt-6 space-y-5 text-sm leading-7 text-[var(--text-soft)]">
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is there a file size limit?
                    </p>
                    <p className="mt-2">
                       We don't impose artificial limits on file size. Your only limitation is your
                       device's memory and performance, as everything happens in your browser.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Can I optimize for Discord?
                    </p>
                    <p className="mt-2">
                      Yes. By adjusting the FPS and resolution in our settings, you can easily create
                      optimized GIFs that fit within Discord's upload limits for free users.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Will there be watermarks?
                    </p>
                    <p className="mt-2">
                      Never. All tools on **nocaputils** produce clean, high-quality output with zero
                      branding or watermarks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="video_to_gif" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
