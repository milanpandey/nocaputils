import SpeedControllerPanel from "@/components/change-video-speed/SpeedControllerPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Change Video Speed & Reverse Video | nocaputils",
  description: "Speed up, slow down, or reverse video playback online. Rewind clips backwards, change video speed from 0.25x to 4x, and adjust framerate directly in your browser without watermarks.",
};

export default function ChangeVideoSpeedPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video Speed &amp;</span>
              <span className="mt-3 inline-block rotate-[2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Reverse
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "Privacy First", "Reverse Playback", "Custom FPS", "No Watermark"].map(
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
              Speed up, slow down, or play your videos in reverse directly in your browser. Complete privacy, zero uploads.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <SpeedControllerPanel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Change Speed &amp; Reverse Video In-Browser
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    From perfect slow-motion effects to fast-forwarding timelapses and dramatic backwards
                    rewind sequences, controlling playback speed and direction is an essential tool for creators.
                    Many cloud-based tools force you to re-upload massive files just to change speed or reverse a clip.
                    <span className="font-black text-[var(--text-main)]"> nocaputils</span> lets you do it all locally in seconds.
                  </p>
                  <p>
                    Our tool utilizes advanced frame-level manipulation and video encoding powered by FFmpeg
                    directly inside your browser window. You can speed up or slow down any clip from 0.25x to 4x,
                    toggle reverse playback to run frames from end to beginning, or combine both (like a 2x fast rewind
                    or 0.5x slow-mo reverse).
                  </p>
                  <p>
                    Simply drop your video, pick your direction and speed multiplier, optionally toggle audio reversal,
                    and preview your result. When you&apos;re satisfied, click export to save the processed video straight
                    to your device with zero quality loss or watermarks.
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
                      How does reversing a video work?
                    </p>
                    <p className="mt-2">
                      When you toggle &quot;Reverse Video&quot;, frames are decoded and reconstructed backwards from end to start.
                      You can pair reverse mode with any speed setting (such as 2x fast rewind or 0.5x slow-motion reverse).
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Can I reverse the audio as well?
                    </p>
                    <p className="mt-2">
                      Yes! When &quot;Include Audio Track&quot; is enabled on a reversed video, the audio track is reversed
                      and tempo-synchronized to match the reversed video frames.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Can I set a custom FPS?
                    </p>
                    <p className="mt-2">
                      Yes. You can manually set the output frames per second (24, 30, or 60 FPS) to ensure your video
                      meets specific technical requirements for social media or professional projects.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is there a limit on video length?
                    </p>
                    <p className="mt-2">
                      Since reverse and speed processing happens inside your browser using WebAssembly, clips under 60 seconds
                      process fastest. Extremely long or 4K videos will require more memory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 mb-8 w-full max-w-7xl">
            <TripTeaBanner source="video_speed_controller" />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
