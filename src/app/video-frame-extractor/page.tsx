import Link from "next/link";

export default function VideoFrameExtractorPlaceholder() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <div className="brutal-card bg-neo-blue text-black p-12 border-4 border-brutal-border">
                <h1 className="text-4xl font-black uppercase mb-6">Video Frame Extractor</h1>
                <p className="text-xl font-bold mb-8">
                    This tool is currently under construction. Check back soon for the fastest, 100% private frame extractor on the web!
                </p>
                <div className="inline-block bg-bg-secondary text-content font-black uppercase px-6 py-3 border-[3px] border-brutal-border shadow-brutal-hover">
                    Coming Soon
                </div>
            </div>
            <div className="mt-8">
                <Link href="/" className="font-bold underline hover:text-neo-blue transition-colors">
                    &larr; Back to all tools
                </Link>
            </div>
        </div>
    );
}
