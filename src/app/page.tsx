export default function Home() {
  const tools = [
    {
      id: "online-video-editor",
      name: "Online Video Editor",
      description: "100% private in-browser video editor. Trim, crop, filter, and export without uploading.",
      color: "bg-neo-yellow",
      status: "Available"
    },
    {
      id: "video-frame-extractor",
      name: "Frame Extractor",
      description: "Extract high-quality still frames from any video instantly.",
      color: "bg-neo-blue",
      status: "Coming Soon"
    },
    {
      id: "video-to-mp3",
      name: "Video to MP3",
      description: "Strip the visual track and download the audio in seconds.",
      color: "bg-neo-pink",
      status: "Coming Soon"
    },
    {
      id: "compress-video",
      name: "Video Compressor",
      description: "Reduce video file sizes quickly for Discord or email.",
      color: "bg-neo-green",
      status: "Coming Soon"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Hero Section - App Promotion */}
      <section className="mb-20">
        <div className="brutal-card bg-neo-pink text-white p-8 md:p-12 border-[4px]">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase leading-tight mb-6" style={{ textShadow: '4px 4px 0px #000' }}>
              Level up your content creation.
            </h2>
            <p className="text-xl md:text-2xl font-bold mb-8">
              nocaputils is brought to you by the team behind <span className="bg-neo-yellow text-black px-2 py-1 border-2 border-black inline-block transform -rotate-2">TripTea</span>.
              Download our Android app for the ultimate travel and planning experience.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.triptea.app"
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-white text-black text-xl font-black uppercase px-8 py-4 border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all"
            >
              Get TripTea on Google Play
            </a>
          </div>
        </div>
      </section>

      {/* Tools Directory */}
      <section>
        <div className="flex items-center justify-between mb-8 pb-4 border-b-[4px] border-black">
          <h2 className="text-4xl font-black uppercase tracking-tight">Free Utility Tools</h2>
          <span className="hidden sm:block font-bold bg-neo-green text-black px-4 py-2 border-2 border-black">Browser-based processing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {tools.map((tool) => (
            <a
              key={tool.id}
              href={`/${tool.id}`}
              className={`block bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_#000] transition-all relative overflow-hidden group`}
            >
              {/* Decorative background shape */}
              <div className={`absolute -right-16 -top-16 w-40 h-40 ${tool.color} rounded-full border-4 border-black opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight">{tool.name}</h3>
                  {tool.status === "Coming Soon" && (
                    <span className="text-xs font-bold uppercase bg-gray-200 border-2 border-black px-2 py-1">
                      Soon
                    </span>
                  )}
                  {tool.status === "Available" && (
                    <span className={`text-xs font-bold uppercase ${tool.color} border-2 border-black px-2 py-1`}>
                      Live
                    </span>
                  )}
                </div>
                <p className="text-lg font-medium mb-6">{tool.description}</p>
                <div className="inline-flex items-center font-black uppercase">
                  Launch Tool
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
