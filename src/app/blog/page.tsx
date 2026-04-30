import Link from "next/link";
import { Metadata } from 'next';
import ThemeToggle from "@/components/ThemeToggle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "nocaputils Blog | Tips and Tricks for Creators",
    description: "Learn how to edit videos safely and privately in your browser. Development updates, tutorials, and more from the nocaputils team.",
};

export default function BlogIndex() {
    const posts = [
        {
            slug: "studio-quality-audio-effects",
            title: "Studio Quality Audio Effects in the Browser",
            date: "Apr 29, 2026",
            excerpt: "Apply professional filters, delays, and EQs to your audio files without leaving the browser.",
            category: "Tech"
        },
        {
            slug: "audio-reactive-music-visualizer",
            title: "Create Audio-Reactive Videos with the Music Visualizer",
            date: "Apr 18, 2026",
            excerpt: "Turn your audio tracks into stunning, audio-reactive visualizers perfect for YouTube.",
            category: "Release"
        },
        {
            slug: "master-time-with-video-speed-control",
            title: "Master Time with Video Speed Control",
            date: "Apr 1, 2026",
            excerpt: "Speed up or slow down your videos to create dramatic slow-motion or fast-paced timelapses.",
            category: "Release"
        },
        {
            slug: "extract-pure-audio-video-to-mp3",
            title: "Extract Pure Audio with Video to MP3",
            date: "Mar 28, 2026",
            excerpt: "Need just the audio from a video? Our new extractor gets the job done securely.",
            category: "Tutorial"
        },
        {
            slug: "create-looping-gifs-instantly",
            title: "Create Looping GIFs Instantly with Video to GIF",
            date: "Mar 24, 2026",
            excerpt: "Turn your favorite video clips into high-quality, looping GIFs in seconds.",
            category: "Release"
        },
        {
            slug: "video-compressor-shrink-files-keep-quality",
            title: "Video Compressor: Shrink Files, Keep Quality",
            date: "Mar 24, 2026",
            excerpt: "Learn how our new Video Compressor reduces file sizes significantly while maintaining crisp visuals.",
            category: "Tech"
        },
        {
            slug: "extract-cinematic-stills-frame-grab",
            title: "Extract High-Res Cinematic Stills with Frame Grab",
            date: "Mar 23, 2026",
            excerpt: "Stop taking blurry screenshots of your videos. Use Frame Grab for perfect, full-resolution stills.",
            category: "Tutorial"
        },
        {
            slug: "introducing-browser-video-editor",
            title: "Introducing the Online Video Editor: Trim, Crop, and Filter in Your Browser",
            date: "Mar 18, 2026",
            excerpt: "A fast, privacy-first way to edit your videos without leaving your browser.",
            category: "Release"
        }
    ];

    return (
        <div className="subtle-pattern min-h-screen">
            <Header backLink={{ href: "/", label: "← Home" }} />
            
            <div className="max-w-5xl mx-auto px-6 py-12 pt-24 md:pt-32">

                <div className="mb-16">
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight leading-[0.8] mb-4 text-[var(--text-main)]">
                        The <span className="mt-2 inline-block rotate-[-1deg] border-4 border-black bg-accent px-4 py-1 text-black shadow-[6px_6px_0_0_#000]">Blog</span>
                    </h1>
                    <p className="font-black text-[var(--text-soft)] mt-8 text-xl uppercase tracking-widest">Updates, creator tips, and deep dives.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {posts.map(post => (
                        <article key={post.slug} className="neo-panel bg-[var(--bg-panel)] p-8 hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col group">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-xs font-black uppercase bg-accent text-black px-2 py-1 border-2 border-black">
                                    {post.category}
                                </span>
                                <time className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-widest">{post.date}</time>
                            </div>
                            
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-4 leading-none flex-grow text-[var(--text-main)]">
                                <Link href={`/blog/${post.slug}`} className="hover:text-accent transition-colors">
                                    {post.title}
                                </Link>
                            </h2>
                            <p className="text-lg font-bold mb-8 text-[var(--text-soft)] leading-snug">{post.excerpt}</p>
                            
                            <Link href={`/blog/${post.slug}`} className="neo-button neo-button-theme font-black uppercase inline-flex items-center group px-6 py-3 self-start transition-all">
                                Read Article
                                <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                            </Link>
                        </article>
                    ))}
                </div>

                <Footer />
            </div>
        </div>
    );
}
