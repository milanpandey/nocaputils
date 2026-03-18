"use client";

import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export default function VideoEditor() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) {
        messageRef.current.innerHTML = message;
      }
      console.log(message);
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      setLoaded(true);
    } catch (error) {
      console.error("Failed to load FFmpeg", error);
      if (messageRef.current) {
        messageRef.current.innerHTML =
          "Error loading FFmpeg. Ensure SharedArrayBuffer is enabled.";
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // @ts-ignore navigator.deviceMemory is not typed in the standard lib yet.
    const deviceMemory = navigator.deviceMemory || 4;
    const maxSizeBytes = (deviceMemory * 1024 * 1024 * 1024) / 4;

    if (file.size > maxSizeBytes) {
      alert(
        `File is too large. Your device has roughly ${deviceMemory}GB of RAM. Please select a video smaller than ${(
          maxSizeBytes /
          (1024 * 1024)
        ).toFixed(0)}MB.`,
      );
      event.target.value = "";
      return;
    }

    setVideoFile(file);

    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    setVideoSrc(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  const clearVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoFile(null);
    setVideoSrc("");
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="neo-panel relative w-full overflow-hidden bg-[var(--bg-panel)] p-6 md:p-10">
        <div className="absolute inset-x-0 top-0 h-3 border-b-2 border-[var(--border-main)] bg-[var(--accent)]" />

        {!loaded && isLoading && (
          <div className="w-full py-20 text-center">
            <h2 className="mb-4 text-2xl font-black uppercase animate-pulse">
              Loading Video Engine...
            </h2>
            <p className="font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Downloading @ffmpeg/core
            </p>
          </div>
        )}

        {!loaded && !isLoading && (
          <div className="w-full py-20 text-center">
            <h2 className="mb-4 text-2xl font-black uppercase text-red-600">
              Engine Failed to Load
            </h2>
            <p className="mb-6 font-bold text-[var(--text-soft)]" ref={messageRef} />
            <button
              onClick={load}
              className="neo-button bg-[var(--accent)] px-6 py-3 font-black uppercase text-black"
            >
              Retry
            </button>
          </div>
        )}

        {loaded && !videoFile && (
          <div className="flex w-full flex-col items-center gap-8 py-12 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] text-5xl">
              {"\u2912"}
            </div>

            <div>
              <h2 className="mb-3 text-3xl font-black uppercase">
                Select a Video to Begin
              </h2>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                Supported Formats: MP4, WEBM, MOV
              </p>
            </div>

            <div className="relative inline-block w-full max-w-sm">
              <input
                type="file"
                accept="video/mp4,video/x-m4v,video/*"
                onChange={handleFileUpload}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              <button className="neo-button flex w-full items-center justify-center gap-3 bg-[var(--accent)] px-8 py-5 text-xl font-black uppercase text-black">
                <span className="text-2xl leading-none">+</span>
                Choose Video File
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]/70">
              <span className="h-px w-10 bg-[var(--text-soft)]/25" />
              <span>Or drag and drop here</span>
              <span className="h-px w-10 bg-[var(--text-soft)]/25" />
            </div>
          </div>
        )}

        {loaded && videoFile && (
          <div className="flex w-full flex-col gap-6 pt-4">
            <div className="flex flex-col gap-4 border-b-[3px] border-[var(--border-main)] pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {videoFile.name}
                </h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                  Private preview - processed locally in your browser
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={clearVideo}
                  className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-sm font-black uppercase"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="neo-panel bg-[var(--bg-panel-muted)] p-4">
              <div className="relative aspect-video w-full overflow-hidden border-4 border-[var(--border-main)] bg-black">
                <video
                  src={videoSrc}
                  controls
                  className="absolute inset-0 h-full w-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            <div className="neo-panel flex h-24 items-center justify-center bg-[var(--bg-panel-muted)]">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--text-soft)]/70">
                Timeline Under Construction
              </p>
            </div>

            <p
              ref={messageRef}
              className="h-4 overflow-hidden font-mono text-xs text-[var(--text-soft)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
