import Mp3ConverterPanel from "@/components/video-to-mp3/Mp3ConverterPanel";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VideoToMp3Page() {
    return (
        <div className="subtle-pattern min-h-screen">
            <Header backLink={{ href: "/", label: "← Home" }} />
            <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-24 md:px-10 md:pt-32">

                <main className="flex-1 flex flex-col items-center">
                    <section className="mb-12 max-w-4xl text-center">
                        <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-[-0.06em] mb-4 text-[var(--text-main)]">
                            Video <span className="mt-2 inline-block rotate-[-2deg] border-4 border-black bg-accent px-4 py-1 text-black shadow-[6px_6px_0_0_#000]">to MP3</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg font-black uppercase tracking-widest text-[var(--text-soft)]">
                            Extract high-quality audio from any video file. 100% private, browser-based, and lightning fast.
                        </p>
                    </section>

                    <section className="w-full max-w-7xl">
                        <Mp3ConverterPanel />
                    </section>
                    
                    <section className="mt-20 max-w-4xl text-center">
                        <h2 className="text-4xl font-black uppercase mb-8 italic text-[var(--text-main)]">Why use our MP3 Converter?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            <div className="neo-panel bg-[var(--bg-panel)] p-6">
                                <h3 className="text-xl font-black uppercase mb-2 text-[var(--text-main)]">Privacy First</h3>
                                <p className="font-bold text-[var(--text-soft)]">Your video never leaves your computer. We use WebAssembly to process files locally in your browser.</p>
                            </div>
                            <div className="neo-panel bg-[var(--bg-panel)] p-6">
                                <h3 className="text-xl font-black uppercase mb-2 text-[var(--text-main)]">High Quality</h3>
                                <p className="font-bold text-[var(--text-soft)]">Choose from multiple bitrates up to 320kbps for crystal clear audio extraction.</p>
                            </div>
                            <div className="neo-panel bg-[var(--bg-panel)] p-6">
                                <h3 className="text-xl font-black uppercase mb-2 text-[var(--text-main)]">Fast & Free</h3>
                                <p className="font-bold text-[var(--text-soft)]">No queues, no limits, and no subscriptions. Just pure local processing speed.</p>
                            </div>
                            <div className="neo-panel bg-[var(--bg-panel)] p-6">
                                <h3 className="text-xl font-black uppercase mb-2 text-[var(--text-main)]">Any Format</h3>
                                <p className="font-bold text-[var(--text-soft)]">Supports MP4, MOV, AVI, and most common video formats. Powered by FFmpeg.</p>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </div>
    );
}
