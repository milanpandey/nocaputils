"use client";

import { useState, useRef, useEffect } from "react";
import { getTripTeaLink } from "@/lib/constants";

export default function SpeedControllerPanel() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);
  const [originalSizeMB, setOriginalSizeMB] = useState(0);
  const [detectedFps, setDetectedFps] = useState<number | null>(null);
  
  const [speedPercent, setSpeedPercent] = useState(100);
  const [targetFps, setTargetFps] = useState<string>(""); // "" = keep original
  const [keepAudio, setKeepAudio] = useState(false); // default to false

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [resultUrl, setResultUrl] = useState("");
  const [resultSizeMB, setResultSizeMB] = useState(0);

  const ffmpegRef = useRef<any>(null);

  const handleFile = async (file: File) => {
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      const sizeMB = file.size / (1024 * 1024);
      setOriginalSizeMB(sizeMB);
      
      // Reset statuses
      setResultUrl("");
      setResultSizeMB(0);
      setErrorMsg("");
      setProgress(0);
      setDetectedFps(null);

      // Probe FPS
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");
        if (!ffmpegRef.current) {
          const ffmpeg = new FFmpeg();
          const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          });
          ffmpegRef.current = ffmpeg;
        }
        const ffmpeg = ffmpegRef.current;
        const videoBuffer = await file.arrayBuffer();
        await ffmpeg.writeFile("probe.mp4", new Uint8Array(videoBuffer));

        const logHandler = ({ message }: { message: string }) => {
          const fpsMatch = message.match(/(\d+(?:\.\d+)?) fps/);
          if (fpsMatch) {
            setDetectedFps(parseFloat(fpsMatch[1]));
          }
        };
        ffmpeg.on("log", logHandler);
        
        // This command will error because there is no output file, which is fine
        try {
          await ffmpeg.exec(["-i", "probe.mp4"]);
        } catch (e) {
          // ignore
        }
        
        ffmpeg.off("log", logHandler);
        await ffmpeg.deleteFile("probe.mp4");
      } catch (err) {
        console.warn("Failed to probe FPS", err);
      }
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

  const getAudioFilter = (speed: number) => {
    if (speed === 1.0) return "";
    let atempo = [];
    let s = speed;
    while (s < 0.5) { atempo.push("atempo=0.5"); s *= 2; }
    while (s > 2.0) { atempo.push("atempo=2.0"); s /= 2; }
    if (s !== 1.0) atempo.push(`atempo=${s}`);
    return atempo.join(",");
  };

  const handleProcess = async () => {
    if (!videoFile || duration <= 0) return;
    setErrorMsg("");
    setResultUrl("");
    
    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error("FFmpeg not loaded.");

      ffmpeg.on("progress", ({ progress: p }: any) => {
        setProgress(Math.round(Math.min(p, 1) * 100));
      });

      // Cleanup old
      try { await ffmpeg.deleteFile("input.mp4"); } catch (e) {}
      try { await ffmpeg.deleteFile("output.mp4"); } catch (e) {}

      // Write source
      const videoBuffer = await videoFile.arrayBuffer();
      await ffmpeg.writeFile("input.mp4", new Uint8Array(videoBuffer));

      let speedFactor = speedPercent / 100;
      let args: string[] = ["-i", "input.mp4"];

      let vFilter = `setpts=${(1/speedFactor).toFixed(4)}*PTS`;
      let aFilter = getAudioFilter(speedFactor);

      if (keepAudio && speedFactor !== 1.0 && aFilter) {
        args.push("-filter_complex", `[0:v]${vFilter}[v];[0:a]${aFilter}[a]`);
        args.push("-map", "[v]", "-map", "[a]");
      } else if (keepAudio) {
        // speedFactor is 1.0, or aFilter is somehow empty
        args.push("-filter_complex", `[0:v]${vFilter}[v]`);
        args.push("-map", "[v]", "-map", "0:a");
      } else {
        // no audio
        args.push("-filter_complex", `[0:v]${vFilter}[v]`);
        args.push("-map", "[v]");
        args.push("-an");
      }

      if (targetFps) {
        args.push("-r", targetFps);
      }

      args.push("-preset", "ultrafast");
      args.push("output.mp4");

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile("output.mp4");
      const outBlob = new Blob([data as any], { type: "video/mp4" });
      const outSizeMB = outBlob.size / (1024 * 1024);
      const outUrl = URL.createObjectURL(outBlob);
      
      setResultSizeMB(outSizeMB);
      setResultUrl(outUrl);

      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during processing.");
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
          onClick={() => document.getElementById("file-speed-upload")?.click()}
        >
          <input
            id="file-speed-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <span className="text-2xl font-black uppercase mb-2">Drop Video to Change Speed</span>
          <span className="text-sm font-bold text-[var(--text-soft)]">or click to browse</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 text-white font-sans">
          
          {/* Left Column */}
          <div className="space-y-4">
            
            <div className="border-4 border-black bg-[#111111] relative p-4 rounded-sm shadow-[8px_8px_0_0_#000]">
              <div className="flex justify-between items-start absolute w-full left-0 top-0 p-4 z-10 pointer-events-none">
                <div className="border-2 border-[#d7fc70] text-[#d7fc70] px-3 py-1 text-xs font-black tracking-wider uppercase bg-black/50 backdrop-blur-sm">
                  {resultUrl ? "Result Preview" : "Source Preview"}
                </div>
                <button
                  onClick={() => {
                    setVideoSrc("");
                    setResultUrl("");
                  }}
                  className="bg-[#ff7b61] text-black border-2 border-black px-4 py-1 text-xs font-black uppercase pointer-events-auto hover:bg-[#ff947d] transition-colors shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]"
                >
                  Close Video
                </button>
              </div>

              <div className="relative aspect-video flex items-center justify-center bg-black overflow-hidden border-2 border-[#222222] mt-10">
                <video
                  ref={videoRef}
                  src={resultUrl || videoSrc}
                  className="w-full h-full object-contain"
                  controls
                  onLoadedMetadata={(e) => {
                    if (!resultUrl) {
                       setDuration(e.currentTarget.duration);
                    }
                  }}
                />
              </div>
            </div>

            {/* Meta Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#111111] border-4 border-black p-5 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#d7fc70] mb-2 tracking-widest">File Name</p>
                <p className="text-base font-black truncate" title={videoFile?.name}>
                  {(videoFile?.name || "UPLOAD.MP4").toUpperCase()}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-5 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#ff33ff] mb-2 tracking-widest">Duration</p>
                <p className="text-base font-black truncate">
                  {duration > 0 ? `${duration.toFixed(1)}s` : "..."}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-5 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#4deeea] mb-2 tracking-widest">Source FPS</p>
                <p className="text-base font-black truncate">
                   {detectedFps ? `${detectedFps} fps` : "..."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">
            
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#ff33ff]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#ff33ff] uppercase">
                  Speed Settings
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-[#9ca3af]">Adjust Speed</label>
                  <span className="text-[#ff33ff] font-black">{speedPercent}% ({speedPercent / 100}x)</span>
                </div>
                
                <input 
                  type="range" 
                  min="25" 
                  max="400" 
                  step="5"
                  value={speedPercent}
                  onChange={(e) => setSpeedPercent(Number(e.target.value))}
                  className="w-full accent-[#ff33ff] cursor-pointer"
                />
                
                <div className="flex justify-between text-[10px] font-black text-[#555]">
                  <span>25% (Slower)</span>
                  <span>100% (Normal)</span>
                  <span>400% (Faster)</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                 <button onClick={() => setSpeedPercent(50)} className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${speedPercent === 50 ? 'bg-[#ff33ff] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}>0.5x</button>
                 <button onClick={() => setSpeedPercent(100)} className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${speedPercent === 100 ? 'bg-[#ff33ff] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}>1x</button>
                 <button onClick={() => setSpeedPercent(150)} className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${speedPercent === 150 ? 'bg-[#ff33ff] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}>1.5x</button>
                 <button onClick={() => setSpeedPercent(200)} className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${speedPercent === 200 ? 'bg-[#ff33ff] text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}>2x</button>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#4deeea]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#4deeea] uppercase">
                  Video Output
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#9ca3af]">Target Frames Per Second</label>
                  <select 
                    value={targetFps}
                    onChange={e => setTargetFps(e.target.value)}
                    className="w-full bg-black border-2 border-black p-2 text-sm font-black focus:outline-none focus:border-[#4deeea] text-white cursor-pointer"
                  >
                    <option value="">Keep Original FPS</option>
                    <option value="60">60 FPS (Smooth)</option>
                    <option value="30">30 FPS (Standard)</option>
                    <option value="24">24 FPS (Cinematic)</option>
                    <option value="15">15 FPS (GIF-like)</option>
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
                onClick={handleProcess}
                className={`w-full border-2 border-black py-4 text-sm font-black tracking-[0.1em] uppercase shadow-[4px_4px_0_0_#000] transition-all
                  ${isProcessing 
                    ? "bg-[#333] text-gray-500 cursor-not-allowed shadow-[2px_2px_0_0_#000] translate-x-[2px] translate-y-[2px]" 
                    : "bg-[#d7fc70] text-black hover:bg-[#e0ff8a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
                  }`}
              >
                {isProcessing ? "Processing Video..." : "Apply Speed Settings"}
              </button>
            </div>

            {/* Result Area */}
            {resultUrl && (
              <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-4 mt-8 animate-fade-in">
                 <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-6 bg-[#99ff99]"></div>
                  <h2 className="text-xl font-black italic tracking-wider text-[#99ff99] uppercase">
                    Success!
                  </h2>
                </div>
                
                <div className="flex flex-col gap-2 bg-[#222] border-2 border-[#333] p-4 text-center">
                   <p className="text-xs uppercase font-black text-[#9ca3af]">Final Speed Multiplier</p>
                   <p className="text-3xl font-black text-white">{(speedPercent / 100).toFixed(2)}x</p>
                   {targetFps && (
                      <p className="text-xs font-black text-[#99ff99] tracking-wider uppercase">
                         Converted to {targetFps} FPS
                      </p>
                   )}
                </div>
                
                <a
                  href={resultUrl}
                  download={`speed_${speedPercent}_changed_video.mp4`}
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
