import ExtractorPanel from "@/components/video-extractor/ExtractorPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Video Frame Extractor | nocaputils",
  description: "Extract specific frames from a video or batch extract multiple frames at once. 100% private and runs in your browser.",
};

export default function VideoFrameExtractorPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video Frame</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Extractor
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "No Sign-In Required", "Privacy First: In-Browser", "No Watermark"].map(
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
              Extract individual frames or batch process automatically. Your files never leave your device.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <ExtractorPanel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Extract High-Res Video Frames
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    Extracting high-quality stills from video files was once a cumbersome task involving
                    complicated video editing software or risky online uploads. With **nocaputils**, you
                    can pull pixel-perfect frames directly in your browser.
                  </p>
                  <p>
                    Our extractor uses advanced WebAssembly technologies to decode your video streams
                    locally. This means no data is ever sent to a server, ensuring 100% privacy for your
                    sensitive footage. Whether you need a cinematic still for a thumbnail, a capture for
                    technical analysis, or a batch of images for an animation sequence, our tools handle
                    it instantly.
                  </p>
                  <p>
                    Simply drop your video, navigate to the desired timestamp using the timeline, and
                    click "Capture". You can also use our **Batch Mode** to automatically extract frames
                    at specific intervals throughout the entire video.
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
                      Is the quality maintained?
                    </p>
                    <p className="mt-2">
                      Yes. We extract frames at the original resolution of your source video, ensuring
                      maximum clarity without additional compression.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Does it work on mobile?
                    </p>
                    <p className="mt-2">
                      Absolutely. The frame extractor is fully responsive and works on modern mobile
                      browsers, including Chrome on Android and Safari on iOS.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      What formats are supported?
                    </p>
                    <p className="mt-2">
                      We support all major video containers including MP4, MOV, and WebM. If your
                      browser can play it, we can extract from it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="frame_extractor" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
