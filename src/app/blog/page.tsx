import Link from "next/link";
import { Metadata } from 'next';

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
        },
        {
            slug: "why-client-side-processing-matters",
            title: "Why Client-Side Video Processing is the Future of Privacy",
            date: "Oct 12, 2024",
            excerpt: "Your files never leave your device. Here is why nocaputils doesn't have a backend server.",
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-12 border-b-[4px] border-black pb-4">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">The nocaputils Blog</h1>
                <p className="font-bold text-gray-600 mt-2 text-xl">Updates, creator tips, and deep dives.</p>
            </div>

            <div className="space-y-8">
                {posts.map(post => (
                    <article key={post.slug} className="brutal-card bg-white border-[4px] border-black p-8 shadow-[6px_6px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000] transition-all">
                        <time className="text-sm font-bold bg-neo-yellow px-2 py-1 border-2 border-black inline-block mb-4">{post.date}</time>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
                            <Link href={`/blog/${post.slug}`} className="hover:text-neo-blue transition-colors">
                                {post.title}
                            </Link>
                        </h2>
                        <p className="text-lg font-medium mb-6 text-gray-700">{post.excerpt}</p>
                        <Link href={`/blog/${post.slug}`} className="font-black uppercase inline-flex items-center group">
                            Read More
                            <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                        </Link>
                    </article>
                ))}
            </div>
        </div>
    );
}
