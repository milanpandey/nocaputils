"use client";

import { useState, useRef } from "react";
import JSZip from "jszip";
import Link from "next/link";

export default function ExtractorPanel() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [isHovering, setIsHovering] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Exact capture states
  const [exactTimeMs, setExactTimeMs] = useState<number>(0);
  const [exactFrameIndex, setExactFrameIndex] = useState<number>(0);
  const [assumedFps, setAssumedFps] = useState<number>(30); // Default guess

  // Batch capture states
  const [batchIntervalSec, setBatchIntervalSec] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const captureFrame = (filename = "frame.jpg", type = "image/jpeg") => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(type, 0.95);

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const seekAndCapture = async (time: number, filename: string) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const previousTime = video.currentTime;

    // Pause video to ensure we get a clean frame extracted
    const wasPlaying = !video.paused;
    video.pause();

    return new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        // Wait a small tick to ensure browser paints the frame internally
        setTimeout(() => {
          captureFrame(filename);
          // Restore state
          video.currentTime = previousTime;
          if (wasPlaying) video.play();
          resolve();
        }, 100);
      };

      video.addEventListener("seeked", onSeeked);
      video.currentTime = Math.max(0, Math.min(time, duration));
    });
  };

  const handleBatchExtract = async () => {
    if (!videoRef.current || !videoSrc) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const video = videoRef.current;
      const totalDuration = video.duration;
      let currentTimePointer = 0;
      let addedFrames = 0;

      const previousTime = video.currentTime;
      const wasPlaying = !video.paused;
      video.pause();

      while (currentTimePointer <= totalDuration) {
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            
            // Wait slightly for frame to render
            setTimeout(() => {
              if (video.videoWidth && video.videoHeight) {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  
                  // Convert to blob and add to zip
                  canvas.toBlob(
                    (blob) => {
                      if (blob) {
                        const fileName = `frame_${addedFrames.toString().padStart(4, "0")}.jpg`;
                        zip.file(fileName, blob);
                        addedFrames++;
                      }
                      resolve();
                    },
                    "image/jpeg",
                    0.95
                  );
                } else {
                  resolve();
                }
              } else {
                resolve();
              }
            }, 50);
          };

          video.addEventListener("seeked", onSeeked);
          video.currentTime = currentTimePointer;
        });

        currentTimePointer += batchIntervalSec;
        setProgress(Math.round((currentTimePointer / totalDuration) * 100));
      }

      // Restore video state
      video.currentTime = previousTime;
      if (wasPlaying) video.play();

      setProgress(100);

      if (addedFrames > 0) {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `extracted_frames_${addedFrames}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to extract any frames.");
      }
    } catch (err) {
      console.error(err);
      alert("Error during batch extraction.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
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
                  onClick={() => setVideoSrc("")}
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
                    const t = e.currentTarget.currentTime;
                    setCurrentTime(t);
                    if (e.currentTarget.paused) {
                      setExactTimeMs(Math.floor(t * 1000));
                      setExactFrameIndex(Math.floor(t * assumedFps));
                    }
                  }}
                />
              </div>
            </div>

            {/* Meta Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000]">
                <p className="text-[9px] uppercase font-black text-[#d7fc70] mb-1">File Name</p>
                <p className="text-sm font-black truncate" title={videoFile?.name || "UPLOADED_VIDEO.MP4"}>
                  {(videoFile?.name || "UPLOADED_VIDEO.MP4").toUpperCase()}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000]">
                <p className="text-[9px] uppercase font-black text-[#ff33ff] mb-1">Resolution</p>
                <p className="text-sm font-black truncate">
                  {videoRef.current?.videoWidth ? `${videoRef.current.videoWidth} X ${videoRef.current.videoHeight}` : "LOADING"}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[9px] uppercase font-black text-[#99ff99] mb-1">Frame Rate</p>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={assumedFps} 
                    onChange={e => setAssumedFps(Number(e.target.value))}
                    className="bg-transparent border-b-2 border-white/20 w-12 text-sm font-black outline-none"
                  />
                  <span className="text-sm font-black">FPS</span>
                </div>
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
            
            {/* Capture Frame */}
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#d7fc70]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#d7fc70] uppercase">
                  Capture Frame
                </h2>
              </div>
              
              <button 
                onClick={() => captureFrame(`frame-${formatTime(currentTime).replace(/:/g, '-')}.jpg`)}
                className="w-full bg-[#d7fc70] text-black border-4 border-black py-4 font-black uppercase text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:shadow-[2px_2px_0_0_#000]"
              >
                📸 Capture Current Frame
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => seekAndCapture(0, "first-frame.jpg")}
                  className="bg-[#222222] text-[#d7fc70] border-2 border-black py-3 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-[#2a2a2a]"
                >
                  First Frame
                </button>
                <button 
                  onClick={() => seekAndCapture(Math.max(0, duration - 0.05), "last-frame.jpg")}
                  className="bg-[#222222] text-[#d7fc70] border-2 border-black py-3 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-[#2a2a2a]"
                >
                  Last Frame
                </button>
              </div>
            </div>

            {/* Exact Position */}
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#ff33ff]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#ff33ff] uppercase">
                  Exact Position
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-white/50">Time (MS)</p>
                  <div className="bg-[#0a0a0a] border-2 border-black p-3 flex justify-between items-center shadow-inner">
                    <input
                      type="number"
                      value={exactTimeMs || ""}
                      onChange={(e) => setExactTimeMs(Number(e.target.value))}
                      className="bg-transparent w-full outline-none text-[#d7fc70] font-black text-xl"
                    />
                    <span className="text-[10px] font-black uppercase text-white/30">MS</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-white/50">Frame ID</p>
                  <div className="bg-[#0a0a0a] border-2 border-black p-3 flex justify-between items-center shadow-inner">
                    <input
                      type="number"
                      value={exactFrameIndex || ""}
                      onChange={(e) => setExactFrameIndex(Number(e.target.value))}
                      className="bg-transparent w-full outline-none text-[#ff33ff] font-black text-xl"
                    />
                    <span className="text-[10px] font-black uppercase text-white/30">FRM</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => seekAndCapture(exactTimeMs / 1000, `frame-${exactTimeMs}ms.jpg`)}
                  className="w-full bg-[#ff33ff] text-black border-4 border-black py-3 font-black uppercase text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:shadow-[2px_2px_0_0_#000]"
                >
                  Capture MS
                </button>
                <button 
                  onClick={() => seekAndCapture(exactFrameIndex / assumedFps, `frame-${exactFrameIndex}.jpg`)}
                  className="w-full bg-[#ff33ff] text-black border-4 border-black py-3 font-black uppercase text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:shadow-[2px_2px_0_0_#000]"
                >
                  Capture FRM
                </button>
              </div>
            </div>

            {/* Export */}
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#99ff99]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#99ff99] uppercase flex-1">
                  Export
                </h2>
                <div className="border border-[#99ff99] text-[#99ff99] px-2 py-1 text-[10px] font-black uppercase">
                  Batch Mode
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/50">
                  <p>Extraction Interval</p>
                  <p className="text-[#99ff99]">1 Frame Every {batchIntervalSec}s</p>
                </div>
                <div className="bg-[#0a0a0a] border-2 border-black p-2 flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="bg-transparent w-full outline-none text-white font-black text-sm"
                    value={batchIntervalSec}
                    onChange={(e) => setBatchIntervalSec(Number(e.target.value))}
                  />
                  <span className="text-[10px] font-black uppercase text-[#99ff99] pr-2">SEC</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/50 mb-1">
                  <p>Progress</p>
                  <p className="text-[#99ff99]">{progress}%</p>
                </div>
                <div className="w-full h-3 bg-black border-2 border-[#222]">
                  <div className="h-full bg-[#99ff99] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <button 
                onClick={handleBatchExtract}
                disabled={isProcessing}
                className="w-full bg-[#99ff99] text-black border-4 border-black py-4 font-black flex items-center justify-center gap-3 uppercase text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⚡ {isProcessing ? 'Processing...' : 'Batch Extract (ZIP)'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
