"use client";

import { useCallback, useRef, useState } from "react";
import type { EnrichedClip } from "./TimelinePanel";

type ExportState = "idle" | "loading" | "processing" | "done" | "error";

type ExportPanelProps = {
  videoSrc: string;
  audioSrc: string;
  videoSegments: EnrichedClip[];
  audioSegments: EnrichedClip[];
  brightness: number;
  contrast: number;
  saturation: number;
  filterPreset: string;
  cropPreset: string;
  cropMode: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
};

export default function ExportPanel({
  videoSrc,
  audioSrc,
  videoSegments,
  audioSegments,
  brightness,
  contrast,
  saturation,
  filterPreset,
  cropPreset,
  cropMode,
  rotation,
  flipH,
  flipV,
}: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);

  const cleanup = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl("");
    }
  }, [downloadUrl]);

  const handleExport = useCallback(async () => {
    if (!videoSrc || !videoSegments.length) return;
    cleanup();
    setState("loading");
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
      setState("processing");

      // Fetch source video
      const videoResponse = await fetch(videoSrc);
      const videoBuffer = await videoResponse.arrayBuffer();
      await ffmpeg.writeFile("input.mp4", new Uint8Array(videoBuffer));

      // Build filter graph
      const filters: string[] = [];
      if (brightness !== 100 || contrast !== 100) {
        const b = (brightness - 100) / 100;
        const c = contrast / 100;
        filters.push(`eq=brightness=${b.toFixed(2)}:contrast=${c.toFixed(2)}`);
      }
      if (saturation !== 100) {
        const s = saturation / 100;
        filters.push(`eq=saturation=${s.toFixed(2)}`);
      }
      if (filterPreset === "grayscale") filters.push("hue=s=0");
      if (filterPreset === "sepia") filters.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
      if (filterPreset === "vintage") filters.push("curves=vintage");

      // Crop/Letterbox filter
      if (cropPreset !== "free") {
        const ratioMap: Record<string, [number, number]> = {
          "16:9": [16, 9],
          "1:1": [1, 1],
          "9:16": [9, 16],
        };
        const ratio = ratioMap[cropPreset];
        if (ratio) {
          const [rw, rh] = ratio;
          if (cropMode === "crop") {
            // Crop: cut video to target aspect ratio (center crop)
            filters.push(`crop='if(gt(iw/ih,${rw}/${rh}),ih*${rw}/${rh},iw)':'if(gt(iw/ih,${rw}/${rh}),ih,iw*${rh}/${rw})'`);
          } else {
            // Letterbox: add black bars to fit target aspect ratio
            filters.push(`scale=iw:ih,setsar=1`);
            filters.push(`pad='if(gt(iw/ih,${rw}/${rh}),iw,ih*${rw}/${rh})':'if(gt(iw/ih,${rw}/${rh}),iw*${rh}/${rw},ih)':(ow-iw)/2:(oh-ih)/2:black`);
          }
        }
      }

      if (flipH) filters.push("hflip");
      if (flipV) filters.push("vflip");

      const r = ((rotation % 360) + 360) % 360;
      if (r === 90) filters.push("transpose=1");
      else if (r === 180) { filters.push("hflip", "vflip"); }
      else if (r === 270) filters.push("transpose=2");

      const hasCustomAudio = Boolean(audioSrc && audioSegments.length > 0);

      // Step 1: Process video (trim/concat)
      if (videoSegments.length === 1) {
        const seg = videoSegments[0];
        const duration = seg.sourceEnd - seg.sourceStart;
        const args = [
          "-ss", seg.sourceStart.toFixed(3),
          "-t", duration.toFixed(3),
          "-i", "input.mp4"
        ];
        if (filters.length > 0) {
          args.push("-vf", filters.join(","));
          args.push("-c:v", "libx264", "-preset", "ultrafast");
        } else {
          args.push("-c:v", "copy");
        }
        if (hasCustomAudio) args.push("-an");
        args.push("-y", "video_only.mp4");
        await ffmpeg.exec(args);
      } else {
        const concatList: string[] = [];
        for (let i = 0; i < videoSegments.length; i++) {
          const seg = videoSegments[i];
          const duration = seg.sourceEnd - seg.sourceStart;
          const segArgs = [
            "-ss", seg.sourceStart.toFixed(3),
            "-t", duration.toFixed(3),
            "-i", "input.mp4",
          ];
          if (filters.length > 0) {
            segArgs.push("-vf", filters.join(","));
            segArgs.push("-c:v", "libx264", "-preset", "ultrafast");
          } else {
            segArgs.push("-c:v", "copy");
          }
          if (hasCustomAudio) segArgs.push("-an");
          segArgs.push("-y", `seg${i}.mp4`);
          await ffmpeg.exec(segArgs);
          concatList.push(`file 'seg${i}.mp4'`);
        }
        await ffmpeg.writeFile("concat.txt", concatList.join("\n"));
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-c", "copy", "-y", "video_only.mp4",
        ]);
      }

      // Step 2: If audio exists, fetch and trim it, then mux with video
      if (hasCustomAudio) {
        const audioResponse = await fetch(audioSrc);
        const audioBuffer = await audioResponse.arrayBuffer();
        await ffmpeg.writeFile("input_audio.mp3", new Uint8Array(audioBuffer));

        // Trim audio to first segment bounds
        const aSeg = audioSegments[0];
        const aDuration = aSeg.sourceEnd - aSeg.sourceStart;
        await ffmpeg.exec([
          "-ss", aSeg.sourceStart.toFixed(3),
          "-t", aDuration.toFixed(3),
          "-i", "input_audio.mp3",
          "-y", "audio_trimmed.mp3",
        ]);

        // Mux video + audio: use shortest stream to avoid desync
        await ffmpeg.exec([
          "-i", "video_only.mp4",
          "-i", "audio_trimmed.mp3",
          "-c:v", "copy",
          "-c:a", "aac",
          "-shortest",
          "-y", "output.mp4",
        ]);
      } else {
        // No audio — just rename
        await ffmpeg.exec([
          "-i", "video_only.mp4",
          "-c", "copy",
          "-y", "output.mp4",
        ]);
      }

      const data = await ffmpeg.readFile("output.mp4");
      const uint8 = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
      const blob = new Blob([new Uint8Array(uint8)], { type: "video/mp4" });
      setDownloadUrl(URL.createObjectURL(blob));
      setState("done");
    } catch (err) {
      console.error("Export failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
      setState("error");
    }
  }, [videoSrc, audioSrc, videoSegments, audioSegments, brightness, contrast, saturation, filterPreset, cropPreset, cropMode, rotation, flipH, flipV, cleanup]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!videoSrc}
        className="neo-button bg-[var(--accent)] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        Export
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => { setOpen(false); cleanup(); setState("idle"); }}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="neo-panel space-y-5 bg-[var(--bg-panel)] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight">Export Video</h3>
            <button
              type="button"
              onClick={() => { setOpen(false); cleanup(); setState("idle"); }}
              className="text-xl font-black leading-none"
            >
              ×
            </button>
          </div>

          {state === "idle" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                  Format
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="border-3 border-[var(--border-main)] bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0_0_var(--border-main)]"
                  >
                    MP4
                  </button>
                </div>
                {audioSrc && (
                  <p className="text-xs text-[var(--text-soft)]">
                    ♪ Audio layer will be included
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="neo-button w-full bg-[var(--accent)] px-4 py-3 text-sm font-black uppercase tracking-wider text-black"
              >
                Start Export
              </button>
            </>
          )}

          {(state === "loading" || state === "processing") && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-bold text-[var(--text-soft)]">
                {state === "loading" ? "Loading FFmpeg…" : `Processing… ${progress}%`}
              </p>
              <div className="h-4 w-full overflow-hidden border-3 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                <div
                  className="h-full bg-[var(--accent)] transition-all"
                  style={{ width: `${state === "loading" ? 10 : progress}%` }}
                />
              </div>
            </div>
          )}

          {state === "done" && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-bold text-[var(--success)]">✓ Export complete!</p>
              <a
                href={downloadUrl}
                download="edited-video.mp4"
                className="neo-button inline-block bg-[var(--accent)] px-6 py-3 text-sm font-black uppercase tracking-wider text-black"
              >
                Download .mp4
              </a>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-bold text-red-500">Export failed</p>
              <p className="text-xs text-[var(--text-soft)]">{errorMsg}</p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="neo-button bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-wider"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
