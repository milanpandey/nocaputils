"use client";

import { useState, useRef, useEffect } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { useTrackedObjectUrls } from "@/hooks/useTrackedObjectUrls";
import {
  attachFFmpegProgress,
  cleanupFFmpegFiles,
  getOrCreateFFmpeg,
} from "@/lib/ffmpeg";

export default function SpeedControllerPanel() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);
  const [originalSizeMB, setOriginalSizeMB] = useState(0);
  const [detectedFps, setDetectedFps] = useState<number | null>(null);
  const [hasAudio, setHasAudio] = useState(true);

  const [isReversed, setIsReversed] = useState(false);
  const [speedPercent, setSpeedPercent] = useState(100);
  const [targetFps, setTargetFps] = useState<string>(""); // "" = keep original
  const [keepAudio, setKeepAudio] = useState(false); // default to false

  const [isProcessing, setIsProcessing] = useState(false);
  const [engineStatus, setEngineStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [resultUrl, setResultUrl] = useState("");
  const [resultSizeMB, setResultSizeMB] = useState(0);

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const ffmpegBusyRef = useRef(false);
  const probeTokenRef = useRef(0);
  const { replaceUrl, revokeUrl } = useTrackedObjectUrls();

  const loadFFmpeg = async (forceFresh = false): Promise<FFmpeg> => {
    return getOrCreateFFmpeg(ffmpegRef, { forceFresh });
  };

  useEffect(() => {
    if (videoRef.current) {
      if (resultUrl) {
        videoRef.current.playbackRate = 1.0;
      } else {
        videoRef.current.playbackRate = speedPercent / 100;
      }
    }
  }, [speedPercent, resultUrl]);

  const handleFile = async (file: File) => {
    if (file.type.startsWith("video/")) {
      const token = ++probeTokenRef.current;
      const url = replaceUrl("source", URL.createObjectURL(file));
      revokeUrl("result");
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
      setIsReversed(false);
      setSpeedPercent(100);
      setTargetFps("");
      setKeepAudio(false);
      setHasAudio(true);

      // Probe FPS & Audio in background only when engine is idle
      (async () => {
        if (ffmpegBusyRef.current) return;
        ffmpegBusyRef.current = true;
        let ffmpeg: FFmpeg | null = null;
        let logHandler: ((event: { message: string }) => void) | null = null;
        try {
          ffmpeg = await loadFFmpeg();
          if (probeTokenRef.current !== token) return;

          const videoBuffer = await file.arrayBuffer();
          if (probeTokenRef.current !== token) return;

          await ffmpeg.writeFile("probe.mp4", new Uint8Array(videoBuffer));

          let foundAudio = false;
          logHandler = ({ message }: { message: string }) => {
            if (probeTokenRef.current !== token) return;
            const fpsMatch = message.match(/(\d+(?:\.\d+)?) fps/);
            if (fpsMatch) {
              setDetectedFps(parseFloat(fpsMatch[1]));
            }
            if (message.includes("Audio:")) {
              foundAudio = true;
            }
          };
          ffmpeg.on("log", logHandler);

          try {
            await ffmpeg.exec(["-i", "probe.mp4"]);
          } catch {
            // Probing without output returns non-zero after printing stream metadata
          }

          if (probeTokenRef.current === token) {
            setHasAudio(foundAudio);
            if (!foundAudio) {
              setKeepAudio(false);
            }
          }
        } catch (err) {
          console.warn("Failed to probe FPS", err);
        } finally {
          if (ffmpeg && logHandler) {
            ffmpeg.off("log", logHandler);
          }
          await cleanupFFmpegFiles(ffmpeg, ["probe.mp4"]);
          ffmpegBusyRef.current = false;
        }
      })();
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
    const atempo: string[] = [];
    let s = speed;
    while (s < 0.5) { atempo.push("atempo=0.5"); s *= 2; }
    while (s > 2.0) { atempo.push("atempo=2.0"); s /= 2; }
    if (s !== 1.0) atempo.push(`atempo=${s}`);
    return atempo.join(",");
  };

  const handleProcess = async () => {
    const effectiveDuration = duration > 0 ? duration : (videoRef.current?.duration || 0);
    if (!videoFile || effectiveDuration <= 0 || ffmpegBusyRef.current) return;
    probeTokenRef.current++;
    ffmpegBusyRef.current = true;
    revokeUrl("result");
    setErrorMsg("");
    setResultUrl("");

    setIsProcessing(true);
    setProgress(0);

    let activeFFmpeg: FFmpeg | null = null;
    let detachProgress: (() => void) | null = null;

    try {
      setEngineStatus("Initializing video engine...");
      let ffmpeg = await loadFFmpeg();
      activeFFmpeg = ffmpeg;
      setEngineStatus("");

      const videoBuffer = await videoFile.arrayBuffer();
      const sourceBytes = new Uint8Array(videoBuffer);

      const speedFactor = speedPercent / 100;
      const shouldIncludeAudio = keepAudio && hasAudio;

      // Video filter chain
      const vFilters: string[] = [];
      if (isReversed) {
        vFilters.push("reverse");
        if (speedFactor !== 1.0) {
          vFilters.push(`setpts=${(1 / speedFactor).toFixed(4)}*(PTS-STARTPTS)`);
        } else {
          vFilters.push("setpts=PTS-STARTPTS");
        }
      } else if (speedFactor !== 1.0) {
        vFilters.push(`setpts=${(1 / speedFactor).toFixed(4)}*PTS`);
      } else {
        vFilters.push("setpts=PTS-STARTPTS");
      }
      const vFilter = vFilters.join(",");

      // Audio filter chain
      const aFilters: string[] = [];
      if (isReversed) {
        aFilters.push("areverse", "asetpts=PTS-STARTPTS");
      }
      const tempoFilter = getAudioFilter(speedFactor);
      if (tempoFilter) {
        aFilters.push(tempoFilter);
      }
      const aFilter = aFilters.join(",");

      const CHUNK_SECONDS = 15;
      const useChunkedReversal = isReversed && effectiveDuration > 20;

      if (!useChunkedReversal) {
        // Single-pass processing (forward speed changes or short reverse clips <= 20s)
        detachProgress = attachFFmpegProgress(ffmpeg, (p) => {
          setProgress(Math.round(p * 100));
        });

        await cleanupFFmpegFiles(ffmpeg, ["input.mp4", "output.mp4"]);
        await ffmpeg.writeFile("input.mp4", sourceBytes);

        const args: string[] = ["-i", "input.mp4"];
        if (shouldIncludeAudio && aFilter) {
          args.push("-filter_complex", `[0:v]${vFilter}[v];[0:a]${aFilter}[a]`);
          args.push("-map", "[v]", "-map", "[a]");
        } else if (shouldIncludeAudio) {
          args.push("-filter_complex", `[0:v]${vFilter}[v]`);
          args.push("-map", "[v]", "-map", "0:a");
        } else {
          args.push("-filter_complex", `[0:v]${vFilter}[v]`);
          args.push("-map", "[v]", "-an");
        }

        if (targetFps) {
          args.push("-r", targetFps);
        }
        args.push("-preset", "ultrafast", "-brand", "mp42", "output.mp4");

        const ret = await ffmpeg.exec(args);
        detachProgress();
        detachProgress = null;

        if (ret !== 0) {
          throw new Error("Video conversion failed. Please check your video format or try different settings.");
        }
      } else {
        // Multi-segment chunked reversal for long videos (> 20s) to stay well within 32-bit WASM memory limits
        const chunks: { start: number; len: number }[] = [];
        for (let start = 0; start < effectiveDuration; start += CHUNK_SECONDS) {
          const remaining = effectiveDuration - start;
          if (remaining < CHUNK_SECONDS + 3) {
            chunks.push({ start, len: remaining });
            break;
          } else {
            chunks.push({ start, len: CHUNK_SECONDS });
          }
        }

        try { await ffmpeg.deleteFile("input.mp4"); } catch {}
        await ffmpeg.writeFile("input.mp4", sourceBytes);

        const reversedChunkBuffers: { name: string; bytes: Uint8Array }[] = [];
        const totalChunks = chunks.length;

        // Process chunks from last to first so they are in reverse chronological order
        for (let stepIdx = 0; stepIdx < totalChunks; stepIdx++) {
          const chunkIdx = totalChunks - 1 - stepIdx;
          const { start, len } = chunks[chunkIdx];
          const chunkOutName = `rev_part_${stepIdx}.mp4`;
          const expectedChunkOutDur = Math.max(0.5, len / speedFactor);

          setEngineStatus(`Reversing segment ${stepIdx + 1}/${totalChunks}...`);
          setProgress(Math.round((stepIdx / totalChunks) * 94));

          const chunkProgressHandler = ({ progress: p }: { progress: number }) => {
            // @ffmpeg/core reports p = encoded_seconds / total_input_duration
            const encodedSec = Math.max(0, p) * effectiveDuration;
            const chunkFrac = Math.min(1, encodedSec / expectedChunkOutDur);
            const overall = Math.round(((stepIdx + chunkFrac) / totalChunks) * 94);
            setProgress(Math.min(94, overall));
          };

          const buildChunkArgs = () => {
            const cArgs: string[] = [
              "-ss", start.toFixed(3),
              "-t", len.toFixed(3),
              "-i", "input.mp4",
            ];
            if (shouldIncludeAudio && aFilter) {
              cArgs.push("-filter_complex", `[0:v]${vFilter}[v];[0:a]${aFilter}[a]`);
              cArgs.push("-map", "[v]", "-map", "[a]", "-shortest");
            } else {
              cArgs.push("-filter_complex", `[0:v]${vFilter}[v]`);
              cArgs.push("-map", "[v]", "-an");
            }
            if (targetFps) {
              cArgs.push("-r", targetFps);
            }
            cArgs.push("-preset", "ultrafast", "-brand", "mp42", chunkOutName);
            return cArgs;
          };

          ffmpeg.on("progress", chunkProgressHandler);
          let ret = await ffmpeg.exec(buildChunkArgs());
          ffmpeg.off("progress", chunkProgressHandler);

          // If WASM heap fragmented across segments, respawn a fresh WASM worker from cached blob URLs and retry
          if (ret !== 0) {
            ffmpeg = await loadFFmpeg(true);
            await ffmpeg.writeFile("input.mp4", sourceBytes);
            ffmpeg.on("progress", chunkProgressHandler);
            ret = await ffmpeg.exec(buildChunkArgs());
            ffmpeg.off("progress", chunkProgressHandler);
          }

          if (ret !== 0) {
            throw new Error(`Failed while reversing segment ${stepIdx + 1} of ${totalChunks}.`);
          }

          const rawChunk = await ffmpeg.readFile(chunkOutName);
          const chunkBytes = typeof rawChunk === "string"
            ? new TextEncoder().encode(rawChunk)
            : new Uint8Array(rawChunk);

          reversedChunkBuffers.push({ name: chunkOutName, bytes: chunkBytes });
          // Free chunk from WASM MEMFS immediately so WASM heap stays lean
          try { await ffmpeg.deleteFile(chunkOutName); } catch {}
        }

        // Stitch all reversed segments together using stream copy
        setEngineStatus("Stitching reversed segments...");
        setProgress(96);

        try { await ffmpeg.deleteFile("input.mp4"); } catch {}
        try { await ffmpeg.deleteFile("output.mp4"); } catch {}

        const concatLines: string[] = [];
        for (const part of reversedChunkBuffers) {
          await ffmpeg.writeFile(part.name, part.bytes);
          concatLines.push(`file '${part.name}'`);
        }
        await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatLines.join("\n") + "\n"));

        let concatRet = await ffmpeg.exec([
          "-f", "concat",
          "-safe", "0",
          "-i", "concat.txt",
          "-c", "copy",
          "-brand", "mp42",
          "output.mp4",
        ]);

        if (concatRet !== 0) {
          // Retry concat on a fresh WASM instance if needed
          ffmpeg = await loadFFmpeg(true);
          for (const part of reversedChunkBuffers) {
            await ffmpeg.writeFile(part.name, part.bytes);
          }
          await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatLines.join("\n") + "\n"));
          concatRet = await ffmpeg.exec([
            "-f", "concat",
            "-safe", "0",
            "-i", "concat.txt",
            "-c", "copy",
            "-brand", "mp42",
            "output.mp4",
          ]);
        }

        for (const part of reversedChunkBuffers) {
          try { await ffmpeg.deleteFile(part.name); } catch {}
        }
        try { await ffmpeg.deleteFile("concat.txt"); } catch {}

        if (concatRet !== 0) {
          throw new Error("Failed to stitch reversed video segments.");
        }
        setProgress(100);
      }

      let data: Uint8Array;
      try {
        const raw = await ffmpeg.readFile("output.mp4");
        data = typeof raw === "string" ? new TextEncoder().encode(raw) : raw;
      } catch {
        throw new Error("Failed to read converted video output.");
      }

      if (!data || data.length === 0) {
        throw new Error("Generated video file was empty (0 bytes).");
      }

      const outBlob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
      if (outBlob.size === 0) {
        throw new Error("Generated video file was empty (0 bytes).");
      }

      const outSizeMB = outBlob.size / (1024 * 1024);
      const outUrl = replaceUrl("result", URL.createObjectURL(outBlob));

      setResultSizeMB(outSizeMB);
      setResultUrl(outUrl);
    } catch (err: unknown) {
      console.error("Video processing error:", err);
      if (ffmpegRef.current) {
        try {
          ffmpegRef.current.terminate();
        } catch {}
        ffmpegRef.current = null;
      }
      const msg = err instanceof Error ? err.message : "An error occurred during processing.";
      setErrorMsg(msg);
    } finally {
      detachProgress?.();
      await cleanupFFmpegFiles(activeFFmpeg, ["input.mp4", "output.mp4", "concat.txt"]);
      ffmpegBusyRef.current = false;
      setIsProcessing(false);
      setEngineStatus("");
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
          <span className="text-2xl font-black uppercase mb-2">Drop Video to Change Speed or Reverse</span>
          <span className="text-sm font-bold text-[var(--text-soft)]">or click to browse • Speed up, slow down, or play backwards</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 text-white font-sans">
          
          {/* Left Column */}
          <div className="space-y-4">
            
            <div className="border-4 border-black bg-[#111111] relative p-4 rounded-sm shadow-[8px_8px_0_0_#000]">
              <div className="flex justify-between items-start absolute w-full left-0 top-0 p-4 z-10 pointer-events-none">
                <div className="border-2 border-[#d7fc70] text-[#d7fc70] px-3 py-1 text-xs font-black tracking-wider uppercase bg-black/50 backdrop-blur-sm">
                  {resultUrl ? (isReversed ? "Result Preview (Reversed)" : "Result Preview") : "Source Preview"}
                </div>
                <button
                  onClick={() => {
                    revokeUrl("source");
                    revokeUrl("result");
                    setVideoSrc("");
                    setVideoFile(null);
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

              {isReversed && !resultUrl && (
                <div className="mt-3 text-center text-xs font-bold text-[#ff7b61] bg-[#ff7b61]/10 border border-[#ff7b61]/30 py-2 px-3">
                  ⏪ Reverse mode active — click &quot;Apply Reverse &amp; Speed&quot; to render the reversed clip.
                </div>
              )}
            </div>

            {/* Meta Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#d7fc70] mb-2 tracking-widest">File Name</p>
                <p className="text-sm font-black truncate" title={videoFile?.name}>
                  {(videoFile?.name || "UPLOAD.MP4").toUpperCase()}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#99ff99] mb-2 tracking-widest">Size</p>
                <p className="text-sm font-black truncate">
                  {originalSizeMB > 0 ? `${originalSizeMB.toFixed(2)} MB` : "..."}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#ff33ff] mb-2 tracking-widest">Duration</p>
                <p className="text-sm font-black truncate">
                  {duration > 0 ? `${duration.toFixed(1)}s` : "..."}
                </p>
              </div>
              <div className="bg-[#111111] border-4 border-black p-4 shadow-[6px_6px_0_0_#000] relative">
                <p className="text-[10px] uppercase font-black text-[#4deeea] mb-2 tracking-widest">Source FPS</p>
                <p className="text-sm font-black truncate">
                   {detectedFps ? `${detectedFps} fps` : "..."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">

            {/* Direction Selector */}
            <div className="bg-[#111111] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#ff7b61]"></div>
                <h2 className="text-xl font-black italic tracking-wider text-[#ff7b61] uppercase">
                  Playback Direction
                </h2>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReversed(false)}
                    className={`border-2 border-black py-3 px-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0_0_#000] ${
                      !isReversed
                        ? "bg-[#ff7b61] text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0_0_#000]"
                        : "bg-[#222] text-[#9ca3af] hover:text-white hover:bg-[#333]"
                    }`}
                  >
                    <span className="text-sm">▶</span>
                    <span>Forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReversed(true)}
                    className={`border-2 border-black py-3 px-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0_0_#000] ${
                      isReversed
                        ? "bg-[#ff7b61] text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0_0_#000]"
                        : "bg-[#222] text-[#9ca3af] hover:text-white hover:bg-[#333]"
                    }`}
                  >
                    <span className="text-sm">⏪</span>
                    <span>Reverse Video</span>
                  </button>
                </div>

                {isReversed ? (
                  <div className="bg-[#ff7b61]/10 border border-[#ff7b61]/30 p-3 text-xs font-bold text-[#ff947d] space-y-1">
                    <p className="flex items-center gap-1.5">
                      <span>⏪</span>
                      <span>Video frames will play in reverse from end to beginning.</span>
                    </p>
                    {duration > 20 && (
                      <p className="text-[11px] text-amber-200 font-semibold pt-1 border-t border-[#ff7b61]/20">
                        ⚡ Multi-segment chunked reversal active ({Math.ceil(duration / 15)} segments) — reverses long videos 100% locally in your browser without memory limits or server uploads.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#222] border border-[#333] p-2.5 text-xs font-bold text-[#9ca3af] flex items-center gap-2">
                    <span>▶</span>
                    <span>Video plays forwards in standard order with continuous stream encoding.</span>
                  </div>
                )}
              </div>
            </div>
            
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
                  <span className="text-[#ff33ff] font-black">
                    {speedPercent}% ({(speedPercent / 100).toFixed(2)}x{isReversed ? " Reverse" : ""})
                  </span>
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
                  <span>25% (0.25x Slow)</span>
                  <span>100% (Normal)</span>
                  <span>400% (4x Fast)</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[25, 50, 75, 100, 150, 200, 400].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSpeedPercent(preset)}
                      className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] transition-colors ${
                        speedPercent === preset
                          ? "bg-[#ff33ff] text-black"
                          : "bg-[#222] text-white hover:bg-[#333]"
                      }`}
                    >
                      {preset === 100 ? "1x" : `${preset / 100}x`}
                    </button>
                  ))}
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

                <div
                  className={`flex items-start gap-3 pt-2 ${
                    hasAudio ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (hasAudio) setKeepAudio(!keepAudio);
                  }}
                >
                  <div
                    className={`w-5 h-5 mt-0.5 border-2 border-black flex items-center justify-center transition-colors shadow-[2px_2px_0_0_#000] shrink-0 ${
                      keepAudio && hasAudio ? "bg-[#4deeea]" : "bg-[#222]"
                    }`}
                  >
                    {keepAudio && hasAudio && <span className="text-black font-black text-xs">✓</span>}
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-white cursor-pointer select-none block">
                      Include Audio Track
                    </label>
                    <span className="text-[10px] text-[#9ca3af] block">
                      {!hasAudio
                        ? "No audio stream detected in source video"
                        : isReversed
                        ? "Audio will be reversed to match backwards playback"
                        : "Preserves audio with tempo adjusted to video speed"}
                    </span>
                  </div>
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
                {isProcessing
                  ? engineStatus || `Processing Video (${progress}%)...`
                  : isReversed && speedPercent !== 100
                  ? `Apply Reverse & ${(speedPercent / 100).toFixed(2)}x Speed`
                  : isReversed
                  ? "Apply Reverse Playback"
                  : `Apply ${(speedPercent / 100).toFixed(2)}x Speed`}
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
                
                <div className="grid grid-cols-2 gap-3 bg-[#222] border-2 border-[#333] p-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-black text-[#9ca3af]">Direction</p>
                    <p className="text-base font-black text-white mt-1">
                      {isReversed ? "⏪ Reversed" : "▶ Forward"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-[#9ca3af]">Speed Multiplier</p>
                    <p className="text-base font-black text-[#ff33ff] mt-1">{(speedPercent / 100).toFixed(2)}x</p>
                  </div>
                  {targetFps && (
                    <div className="col-span-2 border-t border-[#333] pt-2">
                      <p className="text-xs font-black text-[#99ff99] tracking-wider uppercase">
                        Converted to {targetFps} FPS
                      </p>
                    </div>
                  )}
                  {resultSizeMB > 0 && (
                    <div className="col-span-2 border-t border-[#333] pt-2">
                      <p className="text-[11px] font-bold text-[#9ca3af]">
                        Output Size: {resultSizeMB.toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
                
                <a
                  href={resultUrl}
                  download={`${videoFile?.name.replace(/\.[^/.]+$/, "") || "video"}${isReversed ? "_reversed" : ""}_speed_${speedPercent}x.mp4`}
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
