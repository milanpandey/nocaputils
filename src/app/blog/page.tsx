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
            slug: "how-to-edit-videos-in-browser",
            title: "How to Edit Videos Directly in Your Browser (No Software Needed)",
            date: "Oct 24, 2024",
            excerpt: "A complete guide to using OPFS and FFmpeg for safe, secure, zero-upload video editing.",
            category: "Tutorial"
        },
        {
            slug: "why-client-side-processing-matters",
            title: "Why Client-Side Video Processing is the Future of Privacy",
            date: "Oct 12, 2024",
            excerpt: "Your files never leave your device. Here is why nocaputils doesn't have a backend server.",
            category: "Tech"
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
