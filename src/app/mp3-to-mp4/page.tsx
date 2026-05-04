import Mp3ToMp4Panel from "@/components/mp3-to-mp4/Mp3ToMp4Panel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MP3 to MP4 Converter | nocaputils",
  description: "Quickly convert MP3 audio to MP4 video with a custom background image. 100% private, browser-based, and lightning fast with no uploads.",
};

export default function Mp3ToMp4Page() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">MP3 to MP4</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Converter
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "Ultra Fast", "Privacy First", "No Watermark"].map(
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
              Convert your MP3 audio files to MP4 videos in seconds. Just add an optional image and export instantly. Complete privacy, zero uploads.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <Mp3ToMp4Panel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Convert MP3 to MP4 Quickly
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    Need to upload a podcast, music track, or voiceover to YouTube or Instagram? They don't accept MP3 files directly. 
                    <span className="font-black text-[var(--text-main)]">nocaputils</span> uses client-side processing to convert your audio to video instantly, without uploading your data to slow servers. This makes it perfect for quickly creating videos for YouTube.
                  </p>
                  <p>
                    Unlike other tools that re-encode the audio and take minutes to finish, our tool simply copies the audio stream directly into an MP4 container along with a 1fps background image. 
                    This makes the conversion process incredibly fast and maintains the original audio quality perfectly.
                  </p>
                  <p>
                    Simply select your MP3 file, optionally provide a background image (we provide a default one if you don't), and hit convert. 
                    Since there's no upload step and no re-encoding, the process takes only seconds.
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
                      Why is it so much faster than other tools?
                    </p>
                    <p className="mt-2">
                      We use a technique called "stream copying" where we skip re-encoding the audio and simply package the existing MP3 audio data into an MP4 container. This saves massive amounts of processing time.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is my data safe?
                    </p>
                    <p className="mt-2">
                      Yes. Unlike other converters, we don't store or even see your files. The conversion happens entirely within your browser's memory using WebAssembly.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      What if I don't add an image?
                    </p>
                    <p className="mt-2">
                      If you don't provide an image, we will generate a simple black background frame for your video automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="mp3_to_mp4" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
