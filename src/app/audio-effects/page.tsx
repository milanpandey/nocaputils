import AudioEffectsPanel from "@/components/audio-effects/AudioEffectsPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Audio Effects & Converter | nocaputils",
  description:
    "Apply bass boost, slowed + reverb, nightcore, lo-fi, vaporwave, pitch shift and more to any audio file — directly in your browser. 100% private, zero uploads.",
};

export default function AudioEffectsPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Audio</span>
              <span className="mt-3 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Effects
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "9 Presets", "Privacy First", "Instant Export"].map(
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
              Apply viral audio effects like slowed + reverb, bass boost, nightcore, and more.
              Fine-tune with custom controls and export high-quality WAV files — all processed
              locally in your browser.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <AudioEffectsPanel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How It Works
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    Professional audio editing usually means buying expensive DAW software
                    and learning complex workflows. <strong>nocaputils</strong> puts a
                    complete audio effects chain right in your browser — no downloads,
                    no accounts, no uploads to sketchy servers.
                  </p>
                  <p>
                    Choose from 9 carefully-tuned presets that cover the most popular audio
                    trends on social media, or dial in your own settings with granular sliders
                    for speed, pitch, bass, reverb, and master volume. The real-time preview
                    lets you hear exactly what you&apos;re getting before you export.
                  </p>
                  <p>
                    Your exported WAV files are studio-quality 16-bit PCM — perfect for
                    uploading to YouTube, SoundCloud, Spotify, or using in your own video
                    projects. Everything runs on your device, so your unreleased music stays
                    safe.
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
                      What audio formats are supported?
                    </p>
                    <p className="mt-2">
                      You can load MP3, WAV, OGG, FLAC, M4A, and any other format your
                      browser supports. Exports are always high-quality WAV files.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is my audio uploaded anywhere?
                    </p>
                    <p className="mt-2">
                      Absolutely not. All processing happens 100% locally using the Web Audio
                      API. Your files never leave your device — ideal for unreleased tracks.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      What&apos;s the &ldquo;Slowed + Reverb&rdquo; preset?
                    </p>
                    <p className="mt-2">
                      It reduces playback speed to 0.85x, lowers the pitch by ~2.8 semitones,
                      and adds 40% wet reverb. This creates the dreamy, viral sound popular
                      on TikTok and YouTube.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Can I combine presets?
                    </p>
                    <p className="mt-2">
                      Use the &ldquo;Custom&rdquo; preset to freely mix any combination of
                      speed, pitch shift, bass, reverb, and volume adjustments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="audio_effects" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
