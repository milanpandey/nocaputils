import Link from "next/link";

export default function VideoToMp3Placeholder() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <div className="brutal-card bg-neo-pink text-white p-12 border-4 border-brutal-border shadow-brutal">
                <h1 className="text-4xl font-black uppercase mb-6" style={{ textShadow: '2px 2px 0px #000' }}>Video to MP3</h1>
                <p className="text-xl font-bold mb-8">
                    This tool is currently under construction. Check back soon to strip audio from your videos securely in your browser!
                </p>
                <div className="inline-block bg-bg-secondary text-content font-black uppercase px-6 py-3 border-[3px] border-brutal-border shadow-brutal-hover">
                    Coming Soon
                </div>
            </div>
            <div className="mt-8">
                <Link href="/" className="font-bold underline hover:text-neo-pink transition-colors">
                    &larr; Back to all tools
                </Link>
            </div>
        </div>
    );
}
