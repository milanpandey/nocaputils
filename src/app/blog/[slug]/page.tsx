import Link from "next/link";
import { Metadata } from 'next';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blogPosts";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const post = getPostBySlug(resolvedParams.slug);
    if (!post) {
        return {
            title: "Blog Post Not Found | nocaputils Blog",
            description: "The requested blog post could not be found.",
        };
    }
    return {
        title: `${post.title} | nocaputils Blog`,
        description: post.excerpt || post.content.substring(0, 160),
    };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const post = getPostBySlug(resolvedParams.slug);

    if (!post) {
        return (
            <div className="subtle-pattern min-h-screen">
                <Header backLink={{ href: "/blog", label: "← Back to Blog" }} />
                <div className="max-w-4xl mx-auto px-6 py-12 pt-24 md:pt-32">
                    <article className="neo-panel bg-[var(--bg-panel)] p-8 md:p-12 text-center">
                        <h1 className="text-4xl font-black uppercase mb-4">Post Not Found</h1>
                        <p className="text-lg font-bold text-[var(--text-soft)] mb-8">The requested blog post does not exist.</p>
                        <Link href="/blog" className="neo-button neo-button-theme px-6 py-3 font-black uppercase">
                            ← Return to Blog
                        </Link>
                    </article>
                    <Footer />
                </div>
            </div>
        );
    }

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
    return BLOG_POSTS.map(post => ({ slug: post.slug }));
}
