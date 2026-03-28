import Link from "next/link";
import { Metadata } from 'next';
import ThemeToggle from "@/components/ThemeToggle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripTeaBanner from "@/components/TripTeaBanner";

interface PostData {
    title: string;
    date: string;
    content: string;
    tags: string[];
}

const postDatabase: Record<string, PostData> = {
    "how-to-edit-videos-in-browser": {
        title: "How to Edit Videos Directly in Your Browser (No Software Needed)",
        date: "Oct 24, 2024",
        tags: ["Tutorial", "FFmpeg", "WebAssembly"],
        content: `In today's fast-paced digital world, content creators need tools that are quick, reliable, and most importantly, secure. Traditional video editing often requires bulky software installations or uploading sensitive data to remote servers. At nocaputils, we've pioneered a better way: browser-based, client-side video processing.

### The Power of WebAssembly
By leveraging the power of FFmpeg compiled to WebAssembly, our tools can handle complex video manipulations—like trimming, cropping, and compressing—directly on your machine. This means your files never leave your device, ensuring 100% privacy.

### Step-by-Step Guide
1. **Choose your tool**: Navigate to our Video Editor or Frame Extractor.
2. **Select your file**: Drop your video into the dashboard.
3. **Edit with ease**: Use our neo-brutalist interface to make your changes.
4. **Export locally**: Click download and your processed file is saved instantly.

No registration, no hidden fees, just pure utility.`
    },
    "why-client-side-processing-matters": {
        title: "Why Client-Side Video Processing is the Future of Privacy",
        date: "Oct 12, 2024",
        tags: ["Privacy", "Tech", "Performance"],
        content: `Privacy is no longer a luxury; it's a fundamental requirement. When you upload a video to a cloud-based editor, you're essentially handing over your data to a third party. But what if the editor came to you?

### Zero-Server Architecture
nocaputils is built on a "Zero-Server" philosophy. While we use servers to deliver the website code to you, the actual heavy lifting of video processing happens in your browser's memory. We use modern web technologies like OPFS (Origin Private File System) to manage large files without the overhead of cloud storage.

### Benefits of Local Processing:
- **Instant Latency**: No waiting for uploads or downloads to a remote server.
- **Data Sovereignty**: You maintain full control over your source files at all times.
- **Bandwidth Savings**: Only the final result is "downloaded" from your own browser memory.

As hackers and data breaches become more common, client-side processing represents a safer, more sustainable path for the web.`
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

                    <div className="mt-16">
                        <TripTeaBanner source={`blog_${resolvedParams.slug}`} />
                    </div>
                </article>
                <Footer />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(postDatabase).map(slug => ({ slug }));
}
