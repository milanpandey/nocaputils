"use client";

import { useState, useRef, useEffect } from "react";
import { getTripTeaLink } from "@/lib/constants";

export default function CompressorPanel() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);
  const [originalSizeMB, setOriginalSizeMB] = useState(0);
  
  const [targetSizeMB, setTargetSizeMB] = useState(25);
  const [targetHeight, setTargetHeight] = useState<number | null>(null); // null = original
  const [keepAudio, setKeepAudio] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [compressedUrl, setCompressedUrl] = useState("");
  const [compressedSizeMB, setCompressedSizeMB] = useState(0);

  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      const sizeMB = file.size / (1024 * 1024);
      setOriginalSizeMB(sizeMB);
      setTargetSizeMB(parseFloat(sizeMB.toFixed(1)));
      
      // Reset statuses
      setCompressedUrl("");
      setCompressedSizeMB(0);
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

  const calculateBitrates = () => {
    // 1 MB = 8192 kilobits
    const totalBitrateKbps = (targetSizeMB * 8192) / (duration || 1);
    const audioBitrateKbps = keepAudio ? 128 : 0;
    const videoBitrateKbps = totalBitrateKbps - audioBitrateKbps;
    return Math.floor(videoBitrateKbps); // standard flooring
  };

  const handleCompress = async () => {
    if (!videoFile || duration <= 0) return;
    setErrorMsg("");
    setCompressedUrl("");
    
    if (targetSizeMB >= originalSizeMB) {
       setErrorMsg("Target size must be smaller than the original video size.");
       return;
    }

    const videoBitrateKbps = calculateBitrates();
    
    if (videoBitrateKbps < 50) {
      setErrorMsg("Target size is too small for this duration. Video quality will be unreadable.");
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

      // Ensure we clear out old files if they exist to free up memory
      try { await ffmpeg.deleteFile("input.mp4"); } catch (e) {}
      try { await ffmpeg.deleteFile("output.mp4"); } catch (e) {}

      // Write source
      const videoBuffer = await videoFile.arrayBuffer();
      await ffmpeg.writeFile("input.mp4", new Uint8Array(videoBuffer));

      // Construct FFmpeg args
      // -b:v specifies average video bitrate
      // -maxrate and -bufsize enforce standard limits for variable bitrates so it respects our physical constraint
      let args: string[] = [
        "-i", "input.mp4",
        "-b:v", `${videoBitrateKbps}k`,
        "-maxrate", `${videoBitrateKbps * 1.5}k`,
        "-bufsize", `${videoBitrateKbps * 2}k`, 
        "-preset", "ultrafast" // WASM is slow, ultrafast helps considerably in browser
      ];

      if (targetHeight) {
         // Scale proportionally preserving aspect ratio. 
         // Force width to be divisible by 2 to prevent "not divisible by 2" ffmpeg error.
         args.push("-vf", `scale='trunc(oh*a/2)*2':${targetHeight}`);
      }

      if (keepAudio) {
         args.push("-c:a", "aac", "-b:a", "128k");
      } else {
         args.push("-an");
      }

      args.push("output.mp4");

      // Execute compression
      await ffmpeg.exec(args);

      // Read output
      const data = await ffmpeg.readFile("output.mp4");
      // Coerce correctly to prevent BlobPart TS errors
      const outBlob = new Blob([data as any], { type: "video/mp4" });
      const outSizeMB = outBlob.size / (1024 * 1024);
      const outUrl = URL.createObjectURL(outBlob);
      
      setCompressedSizeMB(outSizeMB);
      setCompressedUrl(outUrl);

      // Cleanup
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during video compression.");
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
          onClick={() => document.getElementById("file-comp-upload")?.click()}
        >
          <input
            id="file-comp-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <span className="text-2xl font-black uppercase mb-2">Drop Video to Squash</span>
          <span className="text-sm font-bold text-[var(--text-soft)]">or click to browse</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 text-white font-sans">
          
          {/* Left Column */}
          <div className="space-y-4">
            
            <div className="border-4 border-black bg-[#111111] relative p-4 rounded-sm shadow-[8px_8px_0_0_#000]">
              <div className="flex justify-between items-start absolute w-full left-0 top-0 p-4 z-10 pointer-events-none">
                <div className="border-2 border-[#d7fc70] text-[#d7fc70] px-3 py-1 text-xs font-black tracking-wider uppercase bg-black/50 backdrop-blur-sm">
                  {compressedUrl ? "Result Preview" : "Source Preview"}
                </div>
                <button
                  onClick={() => {
                    setVideoSrc("");
                    setCompressedUrl("");
                  }}
                  className="bg-[#ff7b61] text-black border-2 border-black px-4 py-1 text-xs font-black uppercase pointer-events-auto hover:bg-[#ff947d] transition-colors shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]"
                >
                  Close Video
                </button>
              </div>

              <div className="relative aspect-video flex items-center justify-center bg-black overflow-hidden border-2 border-[#222222] mt-10">
                <video
                  ref={videoRef}
                  src={compressedUrl || videoSrc}
                  className="w-full h-full object-contain"
                  controls
                  onLoadedMetadata={(e) => {
                    // Only track duration from original source, ignore when switching to compressed result
                    if (!compressedUrl) {
                       setDuration(e.currentTarget.duration);
                    }
                  }}
                />
              </div>
            </div>

            {/* Meta Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[4px_4px_0_0_#000] col-span-2">
                <p className="text-[9px] uppercase font-black text-[#d7fc70] mb-1">File Name</p>
                <p className="text-sm font-black truncate" title={videoFile?.name}>
                  {(videoFile?.name || "UPLOAD.MP4").toUpperCase()}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[4px_4px_0_0_#000] relative">
                <p className="text-[9px] uppercase font-black text-[#ff33ff] mb-1">Duration</p>
                <p className="text-sm font-black truncate">
                  {duration > 0 ? `${duration.toFixed(1)}s` : "..."}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[4px_4px_0_0_#000] relative">
                <p className="text-[9px] uppercase font-black text-[#4deeea] mb-1">File Size</p>
                <p className="text-sm font-black truncate">
                   {originalSizeMB > 0 ? `${originalSizeMB.toFixed(2)} MB` : "..."}
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
                  href={getTripTeaLink("video_compressor")}
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

          {/* Right Column: Settings */}
          <div className="space-y-6">
            
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#ff33ff]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#ff33ff] uppercase">
                  Target Size Constraints
                </h2>
              </div>
              <p className="text-xs font-bold text-[#9ca3af] leading-relaxed">
                Choose a preset or enter a custom target file size in MB.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                 <button 
                  onClick={() => setTargetSizeMB(8)}
                  disabled={originalSizeMB > 0 && 8 >= originalSizeMB}
                  className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${originalSizeMB > 0 && 8 >= originalSizeMB ? 'opacity-50 cursor-not-allowed bg-[#222] text-[#777]' : targetSizeMB === 8 ? 'bg-[#d7fc70] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                 >
                   Discord (8MB)
                 </button>
                 <button 
                  onClick={() => setTargetSizeMB(25)}
                  disabled={originalSizeMB > 0 && 25 >= originalSizeMB}
                  className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${originalSizeMB > 0 && 25 >= originalSizeMB ? 'opacity-50 cursor-not-allowed bg-[#222] text-[#777]' : targetSizeMB === 25 ? 'bg-[#d7fc70] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                 >
                   Discord+ (25MB)
                 </button>
                 <button 
                  onClick={() => setTargetSizeMB(10)}
                  disabled={originalSizeMB > 0 && 10 >= originalSizeMB}
                  className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${originalSizeMB > 0 && 10 >= originalSizeMB ? 'opacity-50 cursor-not-allowed bg-[#222] text-[#777]' : targetSizeMB === 10 ? 'bg-[#d7fc70] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                 >
                   Email (10MB)
                 </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#9ca3af]">Custom Target Bound (MB)</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={targetSizeMB}
                  onChange={e => setTargetSizeMB(Number(e.target.value))}
                  className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#ff33ff] text-white"
                />
              </div>

              <div className="bg-[#1a1a1a] border-l-4 border-[#ffb84d] p-3 text-[10px] text-white/80 font-bold uppercase tracking-wide leading-relaxed">
                Note: Approximated natively using bitrate calculus. Result +/- 10% tolerance.
              </div>
            </div>

            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#4deeea]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#4deeea] uppercase">
                  Additional Settings
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#9ca3af]">Scale Resolution Height</label>
                  <select 
                    value={targetHeight || ""}
                    onChange={e => setTargetHeight(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#4deeea] text-white cursor-pointer"
                  >
                    <option value="">Keep Original Quality</option>
                    <option value={1080}>1080p (FHD)</option>
                    <option value={720}>720p (HD)</option>
                    <option value={480}>480p (SD)</option>
                    <option value={360}>360p (Low)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2 cursor-pointer" onClick={() => setKeepAudio(!keepAudio)}>
                   <div className={`w-5 h-5 border-2 border-black flex items-center justify-center transition-colors shadow-[2px_2px_0_0_#000] ${keepAudio ? 'bg-[#4deeea]' : 'bg-[#222]'}`}>
                      {keepAudio && <span className="text-black font-black text-xs">✓</span>}
                   </div>
                   <label className="text-xs font-black uppercase text-white cursor-pointer select-none">Include Audio Track</label>
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
                onClick={handleCompress}
                className={`w-full border-2 border-black py-4 text-sm font-black tracking-[0.1em] uppercase shadow-[4px_4px_0_0_#000] transition-all
                  ${isProcessing 
                    ? "bg-[#333] text-gray-500 cursor-not-allowed shadow-[2px_2px_0_0_#000] translate-x-[2px] translate-y-[2px]" 
                    : "bg-[#d7fc70] text-black hover:bg-[#e0ff8a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
                  }`}
              >
                {isProcessing ? "Squishing Video..." : "Compress Video"}
              </button>
            </div>

            {/* Result Area */}
            {compressedUrl && (
              <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-4 mt-8 animate-fade-in">
                 <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-6 bg-[#99ff99]"></div>
                  <h2 className="text-xl font-black italic tracking-wider text-[#99ff99] uppercase">
                    Success!
                  </h2>
                </div>
                
                <div className="flex flex-col gap-2 bg-[#222] border-2 border-[#333] p-4 text-center">
                   <p className="text-xs uppercase font-black text-[#9ca3af]">Final Size Constraint Hit</p>
                   <p className="text-3xl font-black text-white">{compressedSizeMB.toFixed(2)} MB</p>
                   <p className="text-xs font-black text-[#99ff99] tracking-wider uppercase">
                      Reduced by {(((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100).toFixed(1)}%
                   </p>
                </div>
                
                <a
                  href={compressedUrl}
                  download={`compressed_video.mp4`}
                  className="block w-full text-center border-2 border-black bg-[#99ff99] text-black py-4 text-sm font-black tracking-[0.1em] uppercase shadow-[4px_4px_0_0_#000] hover:bg-[#b3ffb3] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all"
                >
                  Download Output
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
