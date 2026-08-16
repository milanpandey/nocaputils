import Link from "next/link";
import { Metadata } from 'next';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/lib/blogPosts";

export const metadata: Metadata = {
    title: "nocaputils Blog | Tips and Tricks for Creators & Professionals",
    description: "Discover privacy-first tools for video editing, workplace utilities, personality assessments, and learning games. Development updates, tutorials, and deep dives from the nocaputils team.",
};

export default function BlogIndex() {
    return (
        <div className="subtle-pattern min-h-screen">
            <Header backLink={{ href: "/", label: "← Home" }} />
            
            <div className="max-w-5xl mx-auto px-6 py-12 pt-24 md:pt-32">

                <div className="mb-16">
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight leading-[0.8] mb-4 text-[var(--text-main)]">
                        The <span className="mt-2 inline-block rotate-[-1deg] border-4 border-black bg-accent px-4 py-1 text-black shadow-[6px_6px_0_0_#000]">Blog</span>
                    </h1>
                    <p className="font-black text-[var(--text-soft)] mt-8 text-xl uppercase tracking-widest">
                        Updates, creator tips, and deep dives ({BLOG_POSTS.length} articles).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {BLOG_POSTS.map(post => (
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
