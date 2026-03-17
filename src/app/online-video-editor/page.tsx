import VideoEditor from "@/components/video-editor/VideoEditor";

export default function OnlineVideoEditor() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="mb-8 border-b-[4px] border-black pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight">Online Video Editor</h1>
                    <p className="font-bold text-gray-600 mt-2">100% Private. No Uploads. Zero Servers.</p>
                </div>
                <span className="hidden md:inline-block font-bold bg-neo-green px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] uppercase text-sm -rotate-2">Beta</span>
            </div>

            <VideoEditor />
        </div>
    );
}
