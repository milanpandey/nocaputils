"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function GifConverterPanel() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [targetWidth, setTargetWidth] = useState(480);
  const [targetFps, setTargetFps] = useState(15);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [gifUrl, setGifUrl] = useState("");

  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);

  useEffect(() => {
    // If we loaded a new video or its duration updated, we cap the endTime initial state at duration or 15
    if (duration > 0) {
      setEndTime(Math.min(15, duration));
    }
  }, [duration]);

  const handleFile = (file: File) => {
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      setGifUrl("");
      setErrorMsg("");
      setProgress(0);
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };
  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleGenerateGif = async () => {
    if (!videoFile) return;
    setErrorMsg("");
    setGifUrl("");
    
    // Performance constraints limits
    const trimDuration = endTime - startTime;
    if (trimDuration <= 0) {
      setErrorMsg("End time must be greater than start time.");
      return;
    }
    if (trimDuration > 15) {
      setErrorMsg("GIF duration cannot exceed 15 seconds to maintain browser performance.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");

      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        ffmpeg.on("progress", ({ progress: p }) => {
          setProgress(Math.round(Math.min(p, 1) * 100));
        });

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ffmpeg;
      }

      const ffmpeg = ffmpegRef.current;

      // fetch source
      const videoResponse = await fetch(videoSrc);
      const videoBuffer = await videoResponse.arrayBuffer();
      await ffmpeg.writeFile("input.mp4", new Uint8Array(videoBuffer));

      // FFmpeg command to trim, scale, and generate GIF using a custom palette for high quality
      // We use ss and t for accurate seeking
      const filterGraph = `fps=${targetFps},scale=${targetWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;
      
      await ffmpeg.exec([
        "-ss", startTime.toString(),
        "-t", trimDuration.toString(),
        "-i", "input.mp4",
        "-vf", filterGraph,
        "-loop", "0",
        "output.gif"
      ]);

      const data = await ffmpeg.readFile("output.gif");
      const gifBlob = new Blob([data as any], { type: "image/gif" });
      const newGifUrl = URL.createObjectURL(gifBlob);
      setGifUrl(newGifUrl);

      // Cleanup
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.gif");

    } catch (err: any) {
      console.error(err);
      setErrorMsg("An error occurred during GIF generation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {!videoSrc ? (
        <div
          className={`w-full h-64 border-4 border-dashed border-brutal-border flex flex-col items-center justify-center bg-bg-panel transition-colors cursor-pointer ${
            isHovering ? "bg-neo-blue/20" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <span className="text-2xl font-black uppercase mb-2">Drop Video Here</span>
          <span className="text-sm font-bold text-[var(--text-soft)]">or click to browse</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 text-white font-sans">
          
          {/* Left Column */}
          <div className="space-y-4">
            {/* Player Panel */}
            <div className="border-4 border-black bg-[#111111] relative p-4 rounded-sm shadow-[8px_8px_0_0_#000]">
              <div className="flex justify-between items-start absolute w-full left-0 top-0 p-4 z-10 pointer-events-none">
                <div className="border-2 border-[#d7fc70] text-[#d7fc70] px-3 py-1 text-xs font-black tracking-wider uppercase bg-black/50 backdrop-blur-sm">
                  Live Preview
                </div>
                <button
                  onClick={() => {
                    setVideoSrc("");
                    setGifUrl("");
                  }}
                  className="bg-[#ff7b61] text-black border-2 border-black px-4 py-1 text-xs font-black uppercase pointer-events-auto hover:bg-[#ff947d] transition-colors shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]"
                >
                  Close Video
                </button>
              </div>

              <div className="relative aspect-video flex items-center justify-center bg-black overflow-hidden border-2 border-[#222222] mt-10">
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  controls
                  onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                  }}
                  onTimeUpdate={(e) => {
                    // Could sync exact time if desired.
                  }}
                />
              </div>
            </div>

            {/* Meta Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000]">
                <p className="text-[9px] uppercase font-black text-[#d7fc70] mb-1">File Name</p>
                <p className="text-sm font-black truncate" title={videoFile?.name || "UPLOADED_VIDEO.MP4"}>
                  {(videoFile?.name || "UPLOADED_VIDEO.MP4").toUpperCase()}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[9px] uppercase font-black text-[#ff33ff] mb-1">Duration</p>
                <p className="text-sm font-black truncate">
                  {duration > 0 ? `${duration.toFixed(2)} SECONDS` : "LOADING"}
                </p>
              </div>
            </div>

            {/* TripTea Promoted App Card */}
            <div className="mt-8 bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-black uppercase italic leading-none tracking-[-0.04em] mb-3 text-white">
                  Meet{" "}
                  <span className="inline-block border-2 border-black bg-[#d7fc70] px-2 py-0.5 text-black not-italic shadow-[3px_3px_0_0_#000]">
                    TripTea
                  </span>
                </h3>
                <p className="text-sm font-bold uppercase leading-relaxed text-[#9ca3af] mb-4 xl:max-w-md">
                  Simply describe your dream vacation in plain language, and our AI creates a complete, day-by-day itinerary tailored to your preferences.
                </p>
                <a
                  href="https://play.google.com/store/apps/details?id=com.triptea.app"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#ff33ff] text-black border-2 border-black px-4 py-2 text-xs font-black uppercase inline-block hover:bg-[#ff66ff] transition-colors shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
                >
                  Download on Google Play
                </a>
              </div>
              <div className="hidden lg:flex items-center justify-center shrink-0 w-32 h-32 rotate-[3deg] border-4 border-black bg-[#d7fc70] p-2 shadow-[6px_6px_0_0_#000]">
                <div className="w-full h-full bg-black border-2 border-black overflow-hidden relative">
                  <img
                    src="/media/app_screen.jpg"
                    alt="TripTea app screen"
                    className="w-full h-full object-cover object-top opacity-80"
                  />
                  <div className="absolute inset-0 border-4 border-[#ff33ff] z-10 pointer-events-none mix-blend-screen opacity-50"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Control Panels */}
          <div className="space-y-6">
            
            {/* Trim Selection */}
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#ff33ff]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#ff33ff] uppercase">
                  Trim Video
                </h2>
              </div>
              <p className="text-xs font-bold text-[#9ca3af] leading-relaxed">
                Select the start and end time (in seconds) for your GIF.
              </p>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#9ca3af]">Start Time (s)</label>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, endTime - 0.1)}
                    step={0.1}
                    value={startTime}
                    onChange={e => setStartTime(Number(e.target.value))}
                    className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#ff33ff] text-white"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#9ca3af]">End Time (s)</label>
                  <input
                    type="number"
                    min={startTime + 0.1}
                    max={duration || 100}
                    step={0.1}
                    value={endTime}
                    onChange={e => setEndTime(Number(e.target.value))}
                    className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#ff33ff] text-white"
                  />
                </div>
              </div>
              
              <div className="bg-[#1a1a1a] border-l-4 border-[#ffb84d] p-3 text-xs text-white/80 font-bold uppercase tracking-wide leading-relaxed">
                Max 15 seconds recommended for GIFs to prevent browser crashes.
              </div>
            </div>

            {/* Export Settings */}
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#4deeea]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#4deeea] uppercase">
                  Settings
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#9ca3af]">Width (px)</label>
                  <select 
                    value={targetWidth}
                    onChange={e => setTargetWidth(Number(e.target.value))}
                    className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#4deeea] text-white cursor-pointer"
                  >
                    <option value={320}>320px (Small)</option>
                    <option value={480}>480px (Medium)</option>
                    <option value={640}>640px (Large)</option>
                    <option value={800}>800px (HD)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#9ca3af]">Framerate</label>
                  <select 
                    value={targetFps}
                    onChange={e => setTargetFps(Number(e.target.value))}
                    className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#4deeea] text-white cursor-pointer"
                  >
                    <option value={10}>10 FPS</option>
                    <option value={15}>15 FPS</option>
                    <option value={20}>20 FPS</option>
                    <option value={30}>30 FPS</option>
                  </select>
                </div>
              </div>

               {errorMsg && (
                <div className="bg-[#ff4d4d]/10 border-l-4 border-[#ff4d4d] p-3 text-xs text-[#ff4d4d] font-bold uppercase tracking-wide">
                  {errorMsg}
                </div>
              )}
            </div>
            
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-4">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-[#9ca3af]">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-black border-2 border-[#333]">
                <div 
                  className="h-full bg-[#d7fc70] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <button
                disabled={isProcessing}
                onClick={handleGenerateGif}
                className={`w-full border-2 border-black py-4 text-sm font-black tracking-[0.1em] uppercase shadow-[4px_4px_0_0_#000] transition-all
                  ${isProcessing 
                    ? "bg-[#333] text-gray-500 cursor-not-allowed shadow-[2px_2px_0_0_#000] translate-x-[2px] translate-y-[2px]" 
                    : "bg-[#d7fc70] text-black hover:bg-[#e0ff8a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
                  }`}
              >
                {isProcessing ? "Generating..." : "Generate GIF"}
              </button>
            </div>

            {/* Result Area */}
            {gifUrl && (
              <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-4">
                 <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#99ff99]"></div>
                  <h2 className="text-xl font-black italic tracking-wider text-[#99ff99] uppercase">
                    Result
                  </h2>
                </div>
                <div className="border-2 border-black bg-black p-2">
                  <img src={gifUrl} alt="Generated GIF" className="w-full h-auto" />
                </div>
                
                <a
                  href={gifUrl}
                  download="exported_loop.gif"
                  className="block w-full text-center border-2 border-black bg-[#99ff99] text-black py-4 text-sm font-black tracking-[0.1em] uppercase shadow-[4px_4px_0_0_#000] hover:bg-[#b3ffb3] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all"
                >
                  Download GIF
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
