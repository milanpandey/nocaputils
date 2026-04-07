import Mp3ConverterPanel from "@/components/video-to-mp3/Mp3ConverterPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Video to MP3 Converter | nocaputils",
  description: "Extract high-quality audio from any video file. 100% private, browser-based, and lightning fast with no uploads.",
};

export default function VideoToMp3Page() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video to MP3</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Converter
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "320kbps Support", "Privacy First", "No Watermark"].map(
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
              Extract high-quality audio from any video file directly in your browser. Complete privacy, zero uploads.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <Mp3ConverterPanel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Extract Crystal Clear Audio In-Browser
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    Extracting audio from video files once meant uploading massive clips to slow servers,
                    often sacrificing quality or privacy. **nocaputils** uses client-side processing to
                    convert video to MP3 without your data ever leaving your device.
                  </p>
                  <p>
                    Our tool leverages standard encoding libraries to strip the audio stream from your
                    video container and re-encode it as a high-quality MP3 file. This is perfect for
                    podcasting, creating custom ringtones, or extracting background music from travel
                    videos.
                  </p>
                  <p>
                    Simply select your video file, choose your desired bitrate (up to 320kbps for CD-quality
                    sound), and hit convert. Since there's no upload step, the process is limited only by
                    your computer's speed, not your internet bandwidth.
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
                      What is the best bitrate to use?
                    </p>
                    <p className="mt-2">
                       For most purposes, 192kbps is the "sweet spot" between file size and quality. If you're
                       working with high-fidelity music or professional voiceovers, choose 320kbps for
                       maximum clarity.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is my data safe?
                    </p>
                    <p className="mt-2">
                      Yes. Unlike other converters, we don't store or even see your video. The conversion
                      happens entirely within your browser's memory using WebAssembly.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      What video formats can I convert?
                    </p>
                    <p className="mt-2">
                      We support all major video formats including MP4, MOV, WebM, and AVI. If your
                      browser can play the video, we can extract the audio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="video_to_mp3" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
