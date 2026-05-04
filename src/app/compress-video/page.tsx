import CompressorPanel from "@/components/video-compressor/CompressorPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Video Compressor | nocaputils",
  description: "Compress video file size for Discord, Email, and social media directly in your browser.",
};

export default function CompressVideoPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Compressor
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "Privacy First", "Discord Ready", "No Uploads"].map(
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

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Compress Videos Locally
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    Large video files are a major headache for online sharing. Discord has strict limits,
                    emails often bounce if attachments are over 25MB, and social media platforms can
                    mangle your content during upload. <span className="font-black text-[var(--text-main)]">nocaputils</span> solves this by providing a
                    powerful bitrate calculator and compression engine that runs entirely in your browser.
                  </p>
                  <p>
                    Our compressor allows you to set a target file size (e.g., 8MB or 25MB) and
                    automatically calculates the required bitrate for you. Using FFmpeg and WebAssembly,
                    we shrink your files without ever sending them to an external server. This keeps
                    your private videos private while making them easy to share.
                  </p>
                  <p>
                    Simply drop your video, select your target size, and let our browser-based engine
                    do the heavy lifting. You'll get a preview of the estimated quality and file size
                    before you even start the compression process.
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
                      Will it ruin the video quality?
                    </p>
                    <p className="mt-2">
                      We use high-efficiency H.264 encoding. While all compression involves some
                      trade-off, our bitrate calculator ensures the best possible quality for your
                      chosen file size limit.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is it faster than other compressors?
                    </p>
                    <p className="mt-2">
                       Since there is NO upload or download time, <span className="font-black text-[var(--text-main)]">nocaputils</span> is often significantly
                       faster than traditional cloud converters, especially for large source files.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                       What is the limit for Discord?
                    </p>
                    <p className="mt-2">
                      Discord's file limit for free users is currently 25MB. Simply select the 25MB
                      preset in our tool to ensure your video will upload successfully every time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="video_compressor" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
