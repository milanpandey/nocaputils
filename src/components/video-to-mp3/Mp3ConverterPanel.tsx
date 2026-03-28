"use client";

import { useState, useRef } from "react";
import { getTripTeaLink } from "@/lib/constants";
import TripTeaBanner from "../TripTeaBanner";

export default function Mp3ConverterPanel() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [bitrate, setBitrate] = useState("192k");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [mp3Url, setMp3Url] = useState("");
  const [mp3SizeMB, setMp3SizeMB] = useState(0);

  const ffmpegRef = useRef<any>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      setMp3Url("");
      setMp3SizeMB(0);
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

  const handleConvert = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    setProgress(0);
    setErrorMsg("");

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
      const inputName = "input" + videoFile.name.substring(videoFile.name.lastIndexOf("."));
      const outputName = "output.mp3";

      const videoBuffer = await videoFile.arrayBuffer();
      await ffmpeg.writeFile(inputName, new Uint8Array(videoBuffer));

      await ffmpeg.exec([
        "-i", inputName,
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", bitrate,
        "-ar", "44100",
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const outBlob = new Blob([data as any], { type: "audio/mp3" });
      setMp3SizeMB(outBlob.size / (1024 * 1024));
      setMp3Url(URL.createObjectURL(outBlob));

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during conversion.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {!videoFile ? (
        <div
          className={`w-full h-80 border-4 border-dashed border-black flex flex-col items-center justify-center bg-[var(--bg-panel)] transition-all cursor-pointer shadow-[8px_8px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000] ${
            isHovering ? "bg-accent/10" : ""
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
          onDragLeave={() => setIsHovering(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-6xl mb-4">🎬</div>
          <span className="text-3xl font-black uppercase tracking-tighter text-[var(--text-main)]">Drop Video to Strip Audio</span>
          <span className="text-sm font-bold mt-2 uppercase tracking-widest text-[var(--text-soft)]">or click to browse</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-8">
          <div className="space-y-6">
            <div className="neo-panel bg-[var(--bg-panel)] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">Selected Video</h3>
                <button
                  onClick={() => { setVideoFile(null); setMp3Url(""); }}
                  className="bg-accent text-black border-2 border-black px-4 py-1 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]"
                >
                  Change File
                </button>
              </div>
              <div className="bg-black aspect-video flex items-center justify-center border-4 border-black overflow-hidden relative">
                <video src={videoSrc} className="w-full h-full object-contain" controls />
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                 <div className="bg-accent text-black px-3 py-1 border-2 border-black text-xs font-black uppercase">
                    {videoFile.name}
                 </div>
                 <div className="bg-neo-blue text-white px-3 py-1 border-2 border-black text-xs font-black uppercase">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                 </div>
              </div>
            </div>

            <TripTeaBanner source="video_to_mp3" />
          </div>

          <div className="space-y-6">
            <div className="neo-panel bg-[var(--bg-panel)] p-8">
              <h3 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 text-[var(--text-main)]">Audio Settings</h3>
              
              <div className="space-y-2 mt-6">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">MP3 Quality (Bitrate)</label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  className="w-full bg-[var(--bg-panel)] border-4 border-black p-3 text-lg font-black uppercase focus:outline-none focus:bg-accent transition-colors cursor-pointer text-[var(--text-main)]"
                >
                  <option value="128k">128kbps (Standard)</option>
                  <option value="192k">192kbps (High)</option>
                  <option value="256k">256kbps (Premium)</option>
                  <option value="320k">320kbps (Pro)</option>
                </select>
              </div>

              {errorMsg && (
                <div className="bg-neo-pink/20 border-l-8 border-neo-pink p-4 text-xs font-black text-neo-pink uppercase">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-xs font-black uppercase mb-1 text-[var(--text-main)]">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-6 bg-[var(--bg-panel-muted)] border-4 border-black relative">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleConvert}
                  className={`w-full border-4 border-black py-4 text-xl font-black uppercase shadow-[6px_6px_0_0_#000] transition-all
                    ${isProcessing 
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed translate-x-[2px] translate-y-[2px] shadow-[4px_4px_0_0_#000]" 
                      : "bg-accent text-black hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000]"
                    }`}
                >
                  {isProcessing ? "Extracting..." : "Convert to MP3"}
                </button>
              </div>

              {mp3Url && (
                <div className="pt-6 mt-6 border-t-4 border-black animate-fade-in">
                  <div className="bg-neo-green/20 border-l-8 border-neo-green p-4 mb-6">
                    <p className="text-xs font-black text-neo-green uppercase">Success! MP3 ready.</p>
                    <p className="text-xl font-black">{mp3SizeMB.toFixed(2)} MB</p>
                  </div>
                  <a
                    href={mp3Url}
                    download={`${videoFile.name.replace(/\.[^/.]+$/, "")}.mp3`}
                    className="block w-full text-center border-4 border-black bg-neo-blue text-white py-4 text-xl font-black uppercase shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000]"
                  >
                    Download MP3
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
