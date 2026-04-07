import SpeedControllerPanel from "@/components/change-video-speed/SpeedControllerPanel";
import Header from "@/components/Header";
import TripTeaBanner from "@/components/TripTeaBanner";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Change Video Speed | nocaputils",
  description: "Speed up or slow down videos online. Adjust video playback speed and framerate directly in your browser without watermarks.",
};

export default function ChangeVideoSpeedPage() {
  return (
    <div className="subtle-pattern min-h-screen">
      <Header backLink={{ href: "/", label: "← Home" }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:px-10 md:pt-32">

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-12 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              <span className="block">Video Speed</span>
              <span className="mt-3 inline-block rotate-[2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-5 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Controller
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {["100% Free", "Privacy First", "Custom FPS", "No Watermark"].map(
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
              Speed up or slow down your videos directly in your browser. Complete privacy, zero uploads.
            </p>
          </section>

          <section className="w-full max-w-7xl">
            <SpeedControllerPanel />
          </section>

          <section className="mt-16 w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="neo-panel bg-[var(--bg-panel)] p-8">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  How to Control Video Playback Speed In-Browser
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
                  <p>
                    From perfect slow-motion effects to fast-forwarding through long screen recordings,
                    controlling video playback speed is an essential tool for creators. Many cloud-based
                    tools force you to re-upload massive files just to change the speed. **nocaputils** lets
                    you make these adjustments locally in seconds.
                  </p>
                  <p>
                    Our tool utilizes advanced frame-rate manipulation and video encoding directly in your
                    browser window. This allows you to speed up or slow down any clip while maintaining
                    full control over the output frame rate (FPS). This is perfect for creating smooth
                    timelapse effects or detailed slow-motion for technical analysis.
                  </p>
                  <p>
                    Simply drop your video, use our slider to choose your desired speed (from 0.25x to 4x),
                    and preview your changes instantly. Once you're happy with the results, click export to
                    save the modified video to your device.
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
                      Does it affect the audio?
                    </p>
                    <p className="mt-2">
                       Currently, our speed tool focuses on the video frames. You can adjust the playback
                       speed, and we'll ensure the final video file is technically accurate.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Can I set a custom FPS?
                    </p>
                    <p className="mt-2">
                      Yes. You can manually set the output frames per second to ensure your video
                      meets specific technical requirements for social media or professional projects.
                    </p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                      Is there a limit on video length?
                    </p>
                    <p className="mt-2">
                      We don't have a strict length limit. However, since the processing happens in your
                      browser, extremely long or high-resolution videos may take longer to process.
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
