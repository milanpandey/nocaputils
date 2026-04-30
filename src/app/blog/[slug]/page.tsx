import Link from "next/link";
import { Metadata } from 'next';
import ThemeToggle from "@/components/ThemeToggle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PostData {
    title: string;
    date: string;
    content: string;
    tags: string[];
    toolPath?: string;
}

const postDatabase: Record<string, PostData> = {
    "introducing-browser-video-editor": {
        title: "Introducing the Online Video Editor: Trim, Crop, and Filter in Your Browser",
        date: "Mar 18, 2026",
        tags: ["Video Editor", "Release", "Privacy"],
        toolPath: "/online-video-editor",
        content: `We are thrilled to launch the nocaputils Online Video Editor. Our goal has always been to make professional video editing accessible and secure. With our new browser-based editor, you can trim clips, crop dimensions, and apply filters instantly.

### The Power of Client-Side Processing
Because it runs entirely on your device using WebAssembly and FFmpeg, your videos are never uploaded to a server. This guarantees 100% privacy and blazing fast performance, regardless of your internet connection speed.`
    },
    "extract-cinematic-stills-frame-grab": {
        title: "Extract High-Res Cinematic Stills with Frame Grab",
        date: "Mar 23, 2026",
        tags: ["Frame Grab", "Images", "Tutorial"],
        toolPath: "/video-frame-extractor",
        content: `Have you ever tried to pause a video and take a screenshot, only to end up with a blurry, low-resolution image? We felt that pain, which is why we built the Frame Grab tool.

### Precision Control
Now you can upload your video, scrub through frame by frame, and extract the exact moment you want in its original, uncompressed resolution. Whether you are creating thumbnails for YouTube, capturing a beautiful cinematic still, or just saving a memory, Frame Grab makes it effortless and precise.`
    },
    "video-compressor-shrink-files-keep-quality": {
        title: "Video Compressor: Shrink Files, Keep Quality",
        date: "Mar 24, 2026",
        tags: ["Compression", "Performance", "Video"],
        toolPath: "/compress-video",
        content: `Large video files can be a nightmare to share, upload, or store. That's why we added the Video Compressor to the nocaputils suite.

### Advanced Local Encoding
By leveraging advanced encoding algorithms directly in your browser, you can dramatically reduce the file size of your videos without noticeably degrading the quality. Choose your target bitrate, see real-time estimated file sizes, and compress securely on your own device. Say goodbye to upload limits!`
    },
    "create-looping-gifs-instantly": {
        title: "Create Looping GIFs Instantly with Video to GIF",
        date: "Mar 24, 2026",
        tags: ["GIF", "Social Media", "Release"],
        toolPath: "/video-to-gif",
        content: `GIFs are the language of the internet, but creating them shouldn't require complex software. Today, we're introducing the Video to GIF converter.

### Fast and Secure
Simply load your video, select the start and end points, and hit convert. The entire process happens in your browser memory, ensuring your original clips remain private. You can customize the framerate and resolution to get the perfect balance between smooth animation and file size.`
    },
    "extract-pure-audio-video-to-mp3": {
        title: "Extract Pure Audio with Video to MP3",
        date: "Mar 28, 2026",
        tags: ["Audio", "MP3", "Workflow"],
        toolPath: "/video-to-mp3",
        content: `Sometimes the best part of a video is the soundtrack. With the new Video to MP3 tool, you can instantly strip the audio track from any video file and save it as a high-quality MP3.

### Workflow Optimization
Whether you're grabbing a soundbite for a podcast, saving a lecture, or extracting a music track, our tool handles it locally. No need to upload your heavy video files to a random converter website—nocaputils does it all offline.`
    },
    "master-time-with-video-speed-control": {
        title: "Master Time with Video Speed Control",
        date: "Apr 1, 2026",
        tags: ["Speed", "Effects", "Video"],
        toolPath: "/change-video-speed",
        content: `Time manipulation is a powerful storytelling tool. Our new Video Speed Control utility lets you adjust the playback speed of your videos seamlessly.

### Cinematic Slow-Mo and Timelapses
Want to highlight a split-second action? Slow it down to create a dramatic slow-motion effect. Need to condense a long process? Speed it up into a snappy timelapse. Our browser-based engine re-encodes the video locally, ensuring smooth playback at any speed.`
    },
    "audio-reactive-music-visualizer": {
        title: "Create Audio-Reactive Videos with the Music Visualizer",
        date: "Apr 18, 2026",
        tags: ["Music", "Visualizer", "YouTube"],
        toolPath: "/music-visualizer",
        content: `Musicians and podcasters, this one is for you. We've launched a high-performance, NCS-style Music Visualizer. 

### Render Stunning Visuals
Upload your audio track and an image background, and watch our engine generate dynamic, audio-reactive visual particles that pulse to the beat. Best of all, it features deterministic offline rendering to export perfectly smooth MP4 videos. Customize your frequency bands, colors, and particle counts to match your brand.`
    },
    "studio-quality-audio-effects": {
        title: "Studio Quality Audio Effects in the Browser",
        date: "Apr 29, 2026",
        tags: ["Audio", "Effects", "Release"],
        toolPath: "/audio-effects",
        content: `We are expanding our toolkit beyond video with the release of the Audio Effects engine! 

### Granular Audio Processing
You can now apply granular audio processing—including lowpass/highpass filters, delays, pitch shifting, and gain control—directly within your browser. By utilizing the Web Audio API for playback and custom buffer processing for offline export, we ensure zero latency and studio-quality output in a downloadable WAV format. Try it out today!`
    }
};

const getPostData = (slug: string): PostData => {
    return postDatabase[slug] || {
        title: "Blog Post Not Found",
        date: "N/A",
        tags: [],
        content: "The requested blog post could not be found."
    };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const post = getPostData(resolvedParams.slug);
    return {
        title: `${post.title} | nocaputils Blog`,
        description: post.content.substring(0, 160),
    };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const post = getPostData(resolvedParams.slug);

    return (
        <div className="subtle-pattern min-h-screen">
            <Header backLink={{ href: "/blog", label: "← Back to Blog" }} />
            
            <div className="max-w-4xl mx-auto px-6 py-12 pt-24 md:pt-32">

                <article className="neo-panel bg-[var(--bg-panel)] p-8 md:p-12">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map(tag => (
                            <span key={tag} className="text-xs font-black uppercase bg-accent text-black px-2 py-1 border-2 border-black">
                                {tag}
                            </span>
                        ))}
                    </div>
                    
                    <time className="text-sm font-bold block mb-4 text-[var(--text-soft)] uppercase tracking-widest">
                        {post.date}
                    </time>
                    
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-[0.9] mb-10 text-[var(--text-main)]">
                        {post.title}
                    </h1>

                    <div className="prose prose-xl font-bold max-w-none prose-headings:font-black prose-headings:uppercase prose-strong:font-black text-[var(--text-main)] break-words whitespace-pre-line leading-relaxed">
                        {post.content}
                    </div>

                    {post.toolPath && (
                        <div className="mt-12 pt-8 border-t-4 border-[var(--border-main)] text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-[-0.05em] text-[var(--text-main)] mb-2">Ready to try it out?</h3>
                                <p className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-soft)]">100% private, runs entirely in your browser.</p>
                            </div>
                            <Link 
                                href={post.toolPath}
                                className="neo-button neo-button-theme inline-flex px-8 py-4 text-lg font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap"
                            >
                                Try Now →
                            </Link>
                        </div>
                    )}
                </article>
                <Footer />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(postDatabase).map(slug => ({ slug }));
}
