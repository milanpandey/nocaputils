import MusicVisualizerPanel from "@/components/music-visualizer/MusicVisualizerPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Song Visualizer & Video Exporter | nocaputils",
  description: "Create stunning audio-reactive music visualizers for YouTube and TikTok directly in your browser. 100% private, zero uploads.",
};

export default function MusicVisualizerPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Music</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Visualizer
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "Audio FX", "Privacy First", "Social Media Ready"].map(
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
              Convert your audio files into stunning, dynamic videos with audio-reactive visualizers, perfect for YouTube cover songs and TikToks.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <MusicVisualizerPanel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Create Music Visualizers Locally
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    Creating engaging music videos for YouTube, TikTok, or Spotify Canvas used to require
                    heavy desktop software like After Effects. **nocaputils** changes that by putting
                    a powerful rendering engine right inside your browser. No uploads, no waiting in line.
                  </p>
                  <p>
                    Whether you are posting a cover song, a bass-boosted remix, or just need a simple
                    waveform over a background image, our tool has you covered. You can apply instant
                    audio effects like "Slowed + Reverb" or "Nightcore" and have the visualizer react
                    perfectly to the modified audio.
                  </p>
                  <p>
                    Drop your audio track, upload your cover art or background image, pick a visualizer
                    style, and hit render. Your browser will securely process and export a high-quality 
                    MP4 ready for social media.
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
                      Do I need to upload my music?
                    </p>
                    <p className="mt-2">
                      No! All processing happens completely locally on your device. Your unreleased tracks
                      and files are 100% secure and never leave your browser.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      What video formats does it export?
                    </p>
                    <p className="mt-2">
                       We natively export to universal MP4 format with crisp H.264 video encoding and
                       AAC audio, which is the perfect standard for YouTube, TikTok, and Instagram.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                       What audio effects are included?
                    </p>
                    <p className="mt-2">
                      You can instantly apply popular social media audio edits like "Bass Boosted",
                      "Slowed + Reverb", or "Nightcore". The visualizer will perfectly sync with the
                      applied audio effect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="music_visualizer" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
