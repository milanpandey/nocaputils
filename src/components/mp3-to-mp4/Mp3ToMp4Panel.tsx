"use client";

import { useState, useRef } from "react";
import TripTeaBanner from "../TripTeaBanner";

export default function Mp3ToMp4Panel() {
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isHoveringAudio, setIsHoveringAudio] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [mp4Url, setMp4Url] = useState("");
  const [mp4SizeMB, setMp4SizeMB] = useState(0);

  const ffmpegRef = useRef<any>(null);

  const handleAudioFile = (file: File) => {
    if (file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setAudioFile(file);
      setMp4Url("");
      setMp4SizeMB(0);
      setErrorMsg("");
      setProgress(0);
    } else {
      alert("Please upload a valid audio file.");
    }
  };

  const handleImageFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setImageFile(file);
    } else {
      alert("Please upload a valid image file.");
    }
  };

  const handleConvert = async () => {
    if (!audioFile) return;
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
      const inputAudio = "input.mp3";
      const inputImage = "image.jpg";
      const outputName = "output.mp4";

      const audioBuffer = await audioFile.arrayBuffer();
      await ffmpeg.writeFile(inputAudio, new Uint8Array(audioBuffer));

      let ffmpegArgs: string[] = [];

      if (imageFile) {
        const imageBuffer = await imageFile.arrayBuffer();
        await ffmpeg.writeFile(inputImage, new Uint8Array(imageBuffer));
        
        ffmpegArgs = [
          "-loop", "1",
          "-framerate", "1",
          "-i", inputImage,
          "-i", inputAudio,
          "-map", "0:v",
          "-map", "1:a",
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-tune", "stillimage",
          "-c:a", "copy",
          "-shortest",
          "-pix_fmt", "yuv420p",
          outputName
        ];
      } else {
        ffmpegArgs = [
          "-f", "lavfi",
          "-i", "color=c=black:s=1280x720:r=1",
          "-i", inputAudio,
          "-map", "0:v",
          "-map", "1:a",
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-c:a", "copy",
          "-shortest",
          "-pix_fmt", "yuv420p",
          outputName
        ];
      }

      await ffmpeg.exec(ffmpegArgs);

      const data = await ffmpeg.readFile(outputName);
      const outBlob = new Blob([data as any], { type: "video/mp4" });
      setMp4SizeMB(outBlob.size / (1024 * 1024));
      setMp4Url(URL.createObjectURL(outBlob));

      await ffmpeg.deleteFile(inputAudio);
      if (imageFile) await ffmpeg.deleteFile(inputImage);
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
      {!audioFile ? (
        <div
          className={`w-full h-80 border-4 border-dashed border-black flex flex-col items-center justify-center bg-[var(--bg-panel)] transition-all cursor-pointer shadow-[8px_8px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000] ${
            isHoveringAudio ? "bg-accent/10" : ""
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsHoveringAudio(true); }}
          onDragLeave={() => setIsHoveringAudio(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsHoveringAudio(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleAudioFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => document.getElementById("audio-upload")?.click()}
        >
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleAudioFile(e.target.files[0])}
          />
          <div className="text-6xl mb-4">🎵</div>
          <span className="text-3xl font-black uppercase tracking-tighter text-[var(--text-main)]">Drop Audio File</span>
          <span className="text-sm font-bold mt-2 uppercase tracking-widest text-[var(--text-soft)]">or click to browse</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-8">
          <div className="space-y-6">
            <div className="neo-panel bg-[var(--bg-panel)] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">Audio & Background</h3>
                <button
                  onClick={() => { setAudioFile(null); setMp4Url(""); }}
                  className="bg-accent text-black border-2 border-black px-4 py-1 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]"
                >
                  Change Audio
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Upload Area */}
                <div 
                  className={`relative flex-1 aspect-video border-4 border-dashed border-black flex items-center justify-center bg-black transition-all overflow-hidden ${
                    isHoveringImage ? "border-accent" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsHoveringImage(true); }}
                  onDragLeave={() => setIsHoveringImage(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsHoveringImage(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  {imageFile ? (
                    <>
                      <img src={imageSrc} alt="Thumbnail" className="w-full h-full object-contain" />
                      <button
                        onClick={() => { setImageFile(null); setImageSrc(""); }}
                        className="absolute top-2 right-2 bg-neo-pink text-white border-2 border-black px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div 
                      className="flex flex-col items-center justify-center cursor-pointer w-full h-full"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      <span className="text-4xl mb-2">🖼️</span>
                      <span className="text-xs font-black uppercase text-white/70">Optional: Drop Image</span>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 items-center">
                 <audio src={audioSrc} controls className="w-full h-10" />
                 <div className="bg-accent text-black px-3 py-1 border-2 border-black text-xs font-black uppercase">
                    {audioFile.name}
                 </div>
                 <div className="bg-neo-blue text-white px-3 py-1 border-2 border-black text-xs font-black uppercase">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                 </div>
              </div>
            </div>

            <TripTeaBanner source="mp3_to_mp4" />
          </div>

          <div className="space-y-6">
            <div className="neo-panel bg-[var(--bg-panel)] p-8">
              <h3 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 text-[var(--text-main)]">Export settings</h3>
              
              <div className="space-y-2 mt-6">
                <p className="text-xs font-bold uppercase text-[var(--text-soft)]">
                  Audio is stream-copied (no re-encoding) for ultra-fast export. Video is encoded at 1 FPS.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-neo-pink/20 border-l-8 border-neo-pink p-4 text-xs font-black text-neo-pink uppercase mt-4">
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
                  {isProcessing ? "Converting..." : "Convert to MP4"}
                </button>
              </div>

              {mp4Url && (
                <div className="pt-6 mt-6 border-t-4 border-black animate-fade-in">
                  <div className="bg-neo-green/20 border-l-8 border-neo-green p-4 mb-6">
                    <p className="text-xs font-black text-neo-green uppercase">Success! MP4 ready.</p>
                    <p className="text-xl font-black">{mp4SizeMB.toFixed(2)} MB</p>
                  </div>
                  <a
                    href={mp4Url}
                    download={`${audioFile.name.replace(/\.[^/.]+$/, "")}.mp4`}
                    className="block w-full text-center border-4 border-black bg-neo-blue text-white py-4 text-xl font-black uppercase shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000]"
                  >
                    Download MP4
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
