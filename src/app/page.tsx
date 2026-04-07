import ThemeToggle from "@/components/ThemeToggle";
import { getTripTeaLink } from "@/lib/constants";
import Footer from "@/components/Footer";

const tools = [
  {
    id: "online-video-editor",
    name: "Video Editor",
    description: "Trim, crop, and filter in-browser.",
    status: "Live",
    artClass: "tool-art-grid",
  },
  {
    id: "video-frame-extractor",
    name: "Frame Grab",
    description: "Extract high-res cinematic stills.",
    status: "Live",
    artClass: "tool-art-frame",
  },
  {
    id: "video-to-gif",
    name: "Video to GIF",
    description: "Convert clips to looping GIFs.",
    status: "Live",
    artClass: "tool-art-wave",
  },
  {
    id: "compress-video",
    name: "Compressor",
    description: "Shrink files, keep quality.",
    status: "Live",
    artClass: "tool-art-compress",
  },
  {
    id: "video-to-mp3",
    name: "Video to MP3",
    description: "Extract pure audio from any video.",
    status: "Live",
    artClass: "tool-art-mp3",
  },
  {
    id: "change-video-speed",
    name: "Speed Control",
    description: "Speed up or slow down videos.",
    status: "Live",
    artClass: "tool-art-speed",
  },
  {
    id: "blog",
    name: "The Blog",
    description: "Creator tips & tool updates.",
    status: "Live",
    artClass: "tool-art-blog",
  },
];

export default function Home() {
  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-12 flex justify-end">
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          <section className="mb-20 max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-[var(--text-main)] sm:text-7xl lg:text-[6.5rem]">
              <span className="block">Level Up Your</span>
              <span className="my-2 inline-block rotate-[-2deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-4 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                Content
              </span>
              <span className="block">Creation</span>
            </h1>

            <div className="mt-10 flex flex-col items-center gap-5">
              <p className="text-2xl font-extrabold uppercase tracking-[-0.04em] sm:text-3xl">
                The ultimate{" "}
                <span className="border-b-[6px] border-[var(--accent)]">nocaputils</span>{" "}
                suite.
              </p>
              <p className="max-w-2xl text-base font-medium leading-7 text-[var(--text-soft)] sm:text-lg">
                Powered by <span className="font-black text-[var(--text-main)]">TripTea</span>.
                Get professional-grade assets with{" "}
                <span className="font-black text-[var(--text-main)]">
                  100% private in-browser processing
                </span>
                . No uploads, zero servers, total control.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {["100% Private", "No Uploads", "Zero Servers"].map((label) => (
                <div
                  key={label}
                  className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  {label}
                </div>
              ))}
            </div>
          </section>

          <section className="neo-panel mb-20 grid w-full max-w-6xl grid-cols-1 gap-10 bg-[var(--bg-panel)] p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
            <div className="flex flex-col justify-center">
              <h2 className="mb-6 text-4xl font-black uppercase italic leading-none tracking-[-0.06em] sm:text-6xl">
                Meet{" "}
                <span className="inline-block border-4 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-black not-italic">
                  TripTea
                </span>
              </h2>
              <p className="mb-6 max-w-xl text-2xl font-extrabold uppercase leading-[1.25] tracking-[-0.04em]">
                Simply describe your dream vacation in plain language, and our AI
                creates a complete, day-by-day itinerary tailored to your preferences.
              </p>
              <p className="mb-10 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
                Whether it&apos;s a romantic getaway to Paris, an adventure trek in the
                Himalayas, or a family beach vacation, TripTea handles it all.
              </p>
                <a
                  href={getTripTeaLink("homepage")}
                  target="_blank"
                  rel="noreferrer"
                  className="neo-button neo-button-theme inline-flex px-8 py-4 text-lg font-black uppercase tracking-[0.2em] transition-colors"
                >
                  Download on Google Play
                </a>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[20rem] rotate-[4deg] border-4 border-[var(--border-main)] bg-[var(--accent)] p-4 text-black shadow-[8px_8px_0_0_var(--border-main)]">
                <div className="absolute -left-2 -top-2 border-2 border-[var(--border-main)] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  New App
                </div>
                <div className="phone-screen overflow-hidden rounded-[1.25rem] border-4 border-[var(--border-main)] p-3">
                  <div className="overflow-hidden rounded-[1rem] border-2 border-[var(--border-main)] bg-white">
                    <img
                      src="/media/app_screen.jpg"
                      alt="TripTea app screen"
                      className="aspect-[9/16] h-full w-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="tools" className="mb-20 w-full max-w-6xl">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <h2 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl">
                Free Utility
                <br />
                Tools
              </h2>
              <p className="max-w-sm text-sm font-bold uppercase leading-7 tracking-[0.18em] text-[var(--text-soft)] md:text-right">
                Industry standard tools running entirely in your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => {
                const statusClass =
                  tool.status === "Live"
                    ? "bg-[var(--success)] text-black"
                    : "bg-[var(--accent)] text-black";

                return (
                  <a
                    key={tool.id}
                    href={`/${tool.id}`}
                    className="neo-button block bg-[var(--bg-panel-muted)] p-3"
                  >
                    <div className="mb-4 border-4 border-[var(--border-main)] bg-[#111827] p-3">
                      <div
                        className={`relative aspect-square border-2 border-[var(--border-main)] ${tool.artClass}`}
                      >
                        <div
                          className={`absolute right-2 top-2 border-2 border-[var(--border-main)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusClass}`}
                        >
                          {tool.status}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-[-0.05em]">
                      {tool.name}
                    </h3>
                    <p className="mt-2 text-xs font-bold uppercase leading-6 tracking-[0.14em] text-[var(--text-soft)]">
                      {tool.description}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="neo-panel mb-24 w-full max-w-6xl !bg-[var(--bg-panel)] px-6 py-16 text-center text-[var(--text-main)] sm:px-10 sm:py-20">
            <h2 className="text-5xl font-black uppercase italic leading-none tracking-[-0.06em] sm:text-7xl">
              Ready to Create?
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg font-extrabold uppercase leading-8 tracking-[0.12em]">
              Join 50,000+ creators using{" "}
              <span className="border-2 border-[var(--border-main)] bg-[#FF00FF] px-2 py-1 text-white">
                nocaputils
              </span>{" "}
              to skip the wait times and keep their data safe.
            </p>
            <div className="mt-12">
              <a
                href="#tools"
                className="neo-button neo-button-theme inline-flex px-12 py-5 text-2xl font-black uppercase tracking-[0.2em] transition-all"
              >
                Explore All Tools
              </a>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
}
