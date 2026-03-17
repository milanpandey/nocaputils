import Link from "next/link";
import { Metadata } from 'next';

// In a real app, you would fetch this from MDX files or a CMS
const getPostData = (slug: string) => {
    return {
        title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        date: "Oct 24, 2024",
        content: `This is a placeholder for the blog post content. In production, this would parse markdown files to generate HTML.
    
The goal of this post is to rank for long-tail keywords associated with ${slug.replace(/-/g, ' ')}. It includes a strong H1 tag, structured data, and rich text to maximize SEO value for nocaputils.com.`,
    };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const post = getPostData(resolvedParams.slug);
    return {
        title: `${post.title} | nocaputils Blog`,
        description: post.content.substring(0, 150),
    };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const post = getPostData(resolvedParams.slug);

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <div className="mb-8">
                <Link href="/blog" className="font-bold underline hover:text-neo-blue transition-colors">
                    &larr; Back to Blog
                </Link>
            </div>

            <article className="brutal-card bg-white border-[4px] border-black p-8 md:p-12 shadow-[8px_8px_0px_#000]">
                <time className="text-sm font-bold bg-neo-yellow px-2 py-1 border-2 border-black inline-block mb-6 tracking-wider">
                    {post.date}
                </time>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-8">
                    {post.title}
                </h1>

                <div className="prose prose-lg font-medium max-w-none prose-headings:font-black prose-headings:uppercase prose-a:text-neo-blue prose-a:font-bold prose-strong:font-black text-gray-800 break-words whitespace-pre-line">
                    {post.content}
                </div>

                <div className="mt-12 pt-8 border-t-[4px] border-black">
                    <div className="bg-neo-pink text-white p-6 border-[4px] border-black shadow-[4px_4px_0px_#000]">
                        <h3 className="text-2xl font-black uppercase mb-2" style={{ textShadow: '2px 2px 0px #000' }}>Want to try our tools?</h3>
                        <p className="font-bold mb-4">Don't wait. Edit your videos in your browser right now, for free. No data leaves your device.</p>
                        <Link href="/" className="inline-block bg-white text-black font-black uppercase px-6 py-3 border-[3px] border-black hover:-translate-y-1 transition-transform">
                            Explore Tools
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
}

// Ensure static generation for all slugs to allow Cloudflare Pages zero-cost hosting
export async function generateStaticParams() {
    return [
        { slug: 'how-to-edit-videos-in-browser' },
        { slug: 'why-client-side-processing-matters' },
    ];
}
