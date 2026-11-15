"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { FFmpeg, FFFSType } from "@ffmpeg/ffmpeg";
import type { EnrichedClip } from "./TimelinePanel";
import type { CropMode, CropPreset, FilterPreset } from "./useUndoHistory";
import { useTrackedObjectUrls } from "@/hooks/useTrackedObjectUrls";
import {
  attachFFmpegProgress,
  cleanupFFmpegFiles,
  execFFmpeg,
  getFFmpegCoreUrls,
  getOrCreateFFmpeg,
} from "@/lib/ffmpeg";

type ExportState = "idle" | "loading" | "processing" | "done" | "error";
type ExportFormat = "mp4" | "gif";
type ResolutionPreset = "original" | "1080" | "720" | "480";

let cachedFontBytes: Uint8Array | null = null;

const FONT_CANDIDATE_URLS = [
  "/fonts/LiberationSans-Bold.ttf",
  "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
];

async function getOverlayFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) return cachedFontBytes;
  for (const url of FONT_CANDIDATE_URLS) {
    try {
      const fontRes = await fetch(url);
      if (!fontRes.ok) continue;
      cachedFontBytes = new Uint8Array(await fontRes.arrayBuffer());
      return cachedFontBytes;
    } catch {
      // Try next font source
    }
  }
  return null;
}

async function resolveMediaBlob(
  file: File | null | undefined,
  src: string,
  label: string,
): Promise<Blob> {
  let lastErr: unknown = null;
  if (file) {
    try {
      // Read a 64-byte slice to verify the disk file handle is valid without loading the full file into RAM
      await file.slice(0, 64).arrayBuffer();
      return file;
    } catch (err) {
      lastErr = err;
    }
  }
  if (src) {
    try {
      const res = await fetch(src);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) return blob;
      }
    } catch (err) {
      if (!lastErr) lastErr = err;
    }
  }
  const detail = lastErr instanceof Error ? ` (${lastErr.message})` : "";
  throw new Error(
    `${label} is no longer readable${detail}. Please click "Replace Video" to re-select your file and try again.`,
  );
}

const DEFAULT_EXPORT_FILENAME = "Edited Video";

function sanitizeExportBaseName(raw: string): string {
  const cleaned = raw
    .replace(/\.(mp4|gif)$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim();
  return cleaned || DEFAULT_EXPORT_FILENAME;
}

function buildAtempoFilters(speed: number): string[] {
  if (Math.abs(speed - 1) < 0.001) return [];
  const filters: string[] = [];
  let s = speed;
  while (s < 0.5) {
    filters.push("atempo=0.5");
    s *= 2;
  }
  while (s > 2.0) {
    filters.push("atempo=2.0");
    s /= 2;
  }
  if (Math.abs(s - 1) > 0.001) {
    filters.push(`atempo=${s.toFixed(4)}`);
  }
  return filters;
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "'\\''")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

type ExportPanelProps = {
  videoSrc: string;
  videoFile?: File | null;
  audioSrc: string;
  audioFile?: File | null;
  videoSegments: EnrichedClip[];
  audioSegments: EnrichedClip[];
  brightness: number;
  contrast: number;
  saturation: number;
  filterPreset: FilterPreset;
  cropPreset: CropPreset;
  cropMode: CropMode;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  textOverlay: string;
  textSize: number;
  textX: number;
  textY: number;
  textColor: string;
  textBg: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  keepOriginalAudio: boolean;
  audioFadeIn: number;
  audioFadeOut: number;
  videoDimensions: { width: number; height: number };
};

const ExportPanel = memo(function ExportPanel({
  videoSrc,
  videoFile,
  audioSrc,
  audioFile,
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
  textOverlay,
  textSize,
  textX,
  textY,
  textColor,
  textBg,
  playbackRate,
  volume,
  muted,
  keepOriginalAudio,
  audioFadeIn,
  audioFadeOut,
  videoDimensions,
}: ExportPanelProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [resolution, setResolution] = useState<ResolutionPreset>("original");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName, setFileName] = useState(DEFAULT_EXPORT_FILENAME);
  const [errorMsg, setErrorMsg] = useState("");

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const { replaceUrl, revokeUrl } = useTrackedObjectUrls();

  const cleanup = useCallback(() => {
    revokeUrl("export");
    setDownloadUrl("");
  }, [revokeUrl]);

  const openModal = useCallback(() => {
    cleanup();
    setState("idle");
    setProgress(0);
    setFileName(DEFAULT_EXPORT_FILENAME);
    setErrorMsg("");
    void getFFmpegCoreUrls().catch(() => {});
    dialogRef.current?.showModal();
  }, [cleanup]);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Sync dialog close event (Esc / backdrop light-dismiss) and Safari closedby fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      cleanup();
      setState("idle");
      setProgress(0);
      setFileName(DEFAULT_EXPORT_FILENAME);
      setErrorMsg("");
    };
    dialog.addEventListener("close", handleClose);

    if ("closedBy" in HTMLDialogElement.prototype) {
      return () => dialog.removeEventListener("close", handleClose);
    }

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [cleanup]);

  const handleExport = useCallback(async () => {
    if (!videoSrc || !videoSegments.length) return;
    cleanup();
    setState("loading");
    setProgress(0);
    setErrorMsg("");

    const tempFiles: string[] = [
      "font.ttf",
      "concat.txt",
      "video_only.mp4",
      "audio_concat.txt",
      "audio_trimmed.mp3",
      "output.mp4",
      "output.gif",
    ];
    let ffmpeg: FFmpeg | null = null;
    let detachProgress: (() => void) | null = null;

    try {
      ffmpeg = await getOrCreateFFmpeg(ffmpegRef);
      detachProgress = attachFFmpegProgress(ffmpeg, (p) => {
        setProgress(Math.round(p * 100));
      });
      setState("processing");

      const hasCustomAudio = Boolean(audioSrc && audioSegments.length > 0) && format === "mp4";
      const videoBlob = await resolveMediaBlob(videoFile, videoSrc, "Source video");
      const audioBlob =
        hasCustomAudio && !muted
          ? await resolveMediaBlob(audioFile, audioSrc, "Custom audio")
          : null;

      try {
        await ffmpeg.unmount("/input");
      } catch {
        // Ignore if not mounted
      }
      try {
        await ffmpeg.createDir("/input");
      } catch {
        // Ignore if directory already exists
      }
      await ffmpeg.mount(
        "WORKERFS" as FFFSType,
        {
          blobs: [
            { name: "input.mp4", data: videoBlob },
            ...(audioBlob ? [{ name: "input_audio.mp3", data: audioBlob }] : []),
          ],
        },
        "/input",
      );

      // Probe whether source video actually contains an audio stream
      let sourceHasAudio = false;
      const probeLog = ({ message }: { message: string }) => {
        if (message.includes("Audio:")) sourceHasAudio = true;
      };
      ffmpeg.on("log", probeLog);
      try {
        await ffmpeg.exec(["-i", "/input/input.mp4"]);
      } catch {
        // Expected non-zero exit when probing without output
      } finally {
        ffmpeg.off("log", probeLog);
      }

      // Build video filter graph
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
      if (filterPreset === "sepia") {
        filters.push(
          "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
        );
      }
      if (filterPreset === "vintage") filters.push("curves=vintage");
      if (filterPreset === "warm") filters.push("colorbalance=rs=.12:gs=.04:bs=-.12");
      if (filterPreset === "cool") filters.push("colorbalance=rs=-.12:gs=.02:bs=.14");
      if (filterPreset === "dramatic") {
        filters.push("eq=contrast=1.35:saturation=0.85:brightness=-0.04");
      }

      if (flipH) filters.push("hflip");
      if (flipV) filters.push("vflip");

      const r = ((rotation % 360) + 360) % 360;
      if (r === 90) filters.push("transpose=1");
      else if (r === 180) {
        filters.push("hflip", "vflip");
      } else if (r === 270) filters.push("transpose=2");

      // Crop/Letterbox filter (applied AFTER rotation/flips)
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
            filters.push(
              `crop='if(gt(iw/ih,${rw}/${rh}),ih*${rw}/${rh},iw)':'if(gt(iw/ih,${rw}/${rh}),ih,iw*${rh}/${rw})'`,
            );
          } else {
            filters.push("scale=iw:ih,setsar=1");
            filters.push(
              `pad='if(gt(iw/ih,${rw}/${rh}),iw,ih*${rw}/${rh})':'if(gt(iw/ih,${rw}/${rh}),iw*${rh}/${rw},ih)':(ow-iw)/2:(oh-ih)/2:black`,
            );
          }
        }
      }

      // Optional resolution scaling
      if (resolution !== "original") {
        const targetH = Number(resolution);
        filters.push(`scale=-2:'min(trunc(ih/2)*2,${targetH})'`);
      }

      // Text overlay
      if (textOverlay) {
        const fontBytes = await getOverlayFontBytes();
        if (fontBytes) {
          await ffmpeg.writeFile("font.ttf", fontBytes);

          const baseH =
            r === 90 || r === 270
              ? videoDimensions.width || 720
              : videoDimensions.height || 720;
          const effectiveH =
            resolution !== "original" ? Math.min(baseH, Number(resolution)) : baseH;
          const finalFontSize = Math.max(10, Math.round(effectiveH * (textSize / 500)));
          const escapedText = escapeDrawtext(textOverlay);
          const boxPart = textBg ? ":box=1:boxcolor=black@0.68:boxborderw=8" : "";

          filters.push(
            `drawtext=fontfile=font.ttf:text='${escapedText}':fontcolor=${textColor}:fontsize=${finalFontSize}:x=(w*${textX}/100-text_w/2):y=(h*${textY}/100-text_h/2):shadowcolor=black@0.75:shadowx=2:shadowy=2${boxPart}`,
          );
        } else {
          console.warn("Overlay font unavailable; exporting without burned-in text overlay.");
        }
      }

      // Speed adjustment on video
      const hasSpeedChange = Math.abs(playbackRate - 1) >= 0.001;
      if (hasSpeedChange) {
        filters.push(`setpts=${(1 / playbackRate).toFixed(4)}*(PTS-STARTPTS)`);
      }

      // Ensure even pixel dimensions before libx264 when any filter runs
      if (filters.length > 0 && format === "mp4") {
        filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");
      }

      const stripOriginalAudio =
        format === "gif" || muted || (hasCustomAudio && !keepOriginalAudio);

      const totalVideoOutDuration =
        videoSegments.reduce((sum, s) => sum + (s.sourceEnd - s.sourceStart), 0) /
        playbackRate;

      // Per-segment audio filters for original video audio (speed + volume)
      const origSegAudioFilters: string[] = [
        ...buildAtempoFilters(playbackRate),
        ...(Math.abs(volume - 1) > 0.01 ? [`volume=${volume.toFixed(2)}`] : []),
      ];

      const needsReencodeVideo = filters.length > 0;
      const needsReencodeOrigAudio =
        !stripOriginalAudio && sourceHasAudio && origSegAudioFilters.length > 0;

      // Build global fade filters for final audio output
      const fadeFilters: string[] = [];
      if (audioFadeIn > 0) {
        fadeFilters.push(`afade=t=in:st=0:d=${audioFadeIn.toFixed(2)}`);
      }
      if (audioFadeOut > 0 && totalVideoOutDuration > 0.2) {
        const fadeOutDur = Math.min(audioFadeOut, totalVideoOutDuration * 0.8);
        const fadeOutStart = Math.max(0, totalVideoOutDuration - fadeOutDur);
        fadeFilters.push(
          `afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${fadeOutDur.toFixed(2)}`,
        );
      }

      const needsAudioPostStep =
        format === "mp4" &&
        ((hasCustomAudio && !muted) || (!muted && sourceHasAudio && fadeFilters.length > 0));
      const step1Target = format === "mp4" && !needsAudioPostStep ? "output.mp4" : "video_only.mp4";

      // Step 1: Process video segments (trim/concat) directly from WORKERFS
      const buildSegmentArgs = (seg: EnrichedClip, outName: string) => {
        const duration = seg.sourceEnd - seg.sourceStart;
        const args = [
          "-ss",
          seg.sourceStart.toFixed(3),
          "-t",
          duration.toFixed(3),
          "-i",
          "/input/input.mp4",
        ];
        if (needsReencodeVideo) {
          args.push("-vf", filters.join(","));
          args.push("-c:v", "libx264", "-preset", "ultrafast");
        } else {
          args.push("-c:v", "copy");
        }

        if (stripOriginalAudio || !sourceHasAudio) {
          args.push("-an");
        } else if (needsReencodeOrigAudio) {
          args.push("-af", origSegAudioFilters.join(","));
          args.push("-c:a", "aac");
        } else if (needsReencodeVideo) {
          args.push("-c:a", "aac");
        } else {
          args.push("-c:a", "copy");
        }

        if (outName === "output.mp4") {
          args.push("-brand", "mp42");
        }
        args.push("-y", outName);
        return args;
      };

      if (videoSegments.length === 1) {
        await execFFmpeg(
          ffmpeg,
          buildSegmentArgs(videoSegments[0], step1Target),
          "Video segment export",
        );
      } else {
        const segNames: string[] = [];
        const concatList: string[] = [];
        for (let i = 0; i < videoSegments.length; i++) {
          const segName = `seg${i}.mp4`;
          segNames.push(segName);
          tempFiles.push(segName);
          await execFFmpeg(
            ffmpeg,
            buildSegmentArgs(videoSegments[i], segName),
            `Video segment ${i + 1}`,
          );
          concatList.push(`file '${segName}'`);
        }
        await ffmpeg.writeFile("concat.txt", concatList.join("\n"));
        const concatArgs = [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "concat.txt",
          "-c",
          "copy",
          ...(step1Target === "output.mp4" ? ["-brand", "mp42"] : []),
          "-y",
          step1Target,
        ];
        await execFFmpeg(ffmpeg, concatArgs, "Video concatenation");
        await cleanupFFmpegFiles(ffmpeg, [...segNames, "concat.txt"]);
      }

      // GIF export branch
      if (format === "gif") {
        await execFFmpeg(
          ffmpeg,
          [
            "-i",
            "video_only.mp4",
            "-vf",
            "fps=12,scale='min(480,iw)':-1:flags=lanczos",
            "-loop",
            "0",
            "-y",
            "output.gif",
          ],
          "GIF export",
        );
        const data = await ffmpeg.readFile("output.gif");
        const uint8 =
          data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
        const blob = new Blob([new Uint8Array(uint8)], { type: "image/gif" });
        setDownloadUrl(replaceUrl("export", URL.createObjectURL(blob)));
        setState("done");
        return;
      }

      // Step 2: Audio mux / finalization (only when mixing custom audio or applying audio fades)
      if (needsAudioPostStep) {
        if (hasCustomAudio && !muted) {
          const customAudioFilters: string[] = [
            ...buildAtempoFilters(playbackRate),
            ...(Math.abs(volume - 1) > 0.01 ? [`volume=${volume.toFixed(2)}`] : []),
          ];

          const trimAudioSeg = async (aSeg: EnrichedClip, outName: string, label: string) => {
            const aDuration = aSeg.sourceEnd - aSeg.sourceStart;
            const aArgs = [
              "-ss",
              aSeg.sourceStart.toFixed(3),
              "-t",
              aDuration.toFixed(3),
              "-i",
              "/input/input_audio.mp3",
            ];
            if (customAudioFilters.length > 0) {
              aArgs.push("-af", customAudioFilters.join(","));
            }
            aArgs.push("-y", outName);
            await execFFmpeg(ffmpeg!, aArgs, label);
          };

          if (audioSegments.length === 1) {
            await trimAudioSeg(audioSegments[0], "audio_trimmed.mp3", "Audio trim");
          } else {
            const audioSegNames: string[] = [];
            const audioConcatList: string[] = [];
            for (let i = 0; i < audioSegments.length; i++) {
              const aSegName = `aud_seg_${i}.mp3`;
              audioSegNames.push(aSegName);
              tempFiles.push(aSegName);
              await trimAudioSeg(audioSegments[i], aSegName, `Audio segment ${i + 1}`);
              audioConcatList.push(`file '${aSegName}'`);
            }
            await ffmpeg.writeFile("audio_concat.txt", audioConcatList.join("\n"));
            await execFFmpeg(
              ffmpeg,
              [
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                "audio_concat.txt",
                "-c",
                "copy",
                "-y",
                "audio_trimmed.mp3",
              ],
              "Audio concatenation",
            );
            await cleanupFFmpegFiles(ffmpeg, audioSegNames);
          }

          const customChainParts: string[] = [];
          const leadDelaySec = (audioSegments[0]?.timelineStart ?? 0) / playbackRate;
          if (leadDelaySec > 0.05) {
            const delayMs = Math.round(leadDelaySec * 1000);
            customChainParts.push(`adelay=${delayMs}|${delayMs}`);
          }
          customChainParts.push(...fadeFilters);

          if (keepOriginalAudio && sourceHasAudio) {
            const origFadeChain = fadeFilters.length
              ? `[0:a]${fadeFilters.join(",")}[a0];`
              : "";
            const origLabel = fadeFilters.length ? "[a0]" : "[0:a]";
            const custChain = customChainParts.length
              ? `[1:a]${customChainParts.join(",")}[a1];`
              : "";
            const custLabel = customChainParts.length ? "[a1]" : "[1:a]";

            await execFFmpeg(
              ffmpeg,
              [
                "-i",
                "video_only.mp4",
                "-i",
                "audio_trimmed.mp3",
                "-filter_complex",
                `${origFadeChain}${custChain}${origLabel}${custLabel}amix=inputs=2:duration=first:dropout_transition=2[aout]`,
                "-map",
                "0:v",
                "-map",
                "[aout]",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-shortest",
                "-brand",
                "mp42",
                "-y",
                "output.mp4",
              ],
              "Video and mixed audio mux",
            );
          } else {
            const muxArgs = [
              "-i",
              "video_only.mp4",
              "-i",
              "audio_trimmed.mp3",
              "-map",
              "0:v",
              "-map",
              "1:a",
              "-c:v",
              "copy",
            ];
            if (customChainParts.length > 0) {
              muxArgs.push("-af", customChainParts.join(","));
            }
            muxArgs.push("-c:a", "aac", "-shortest", "-brand", "mp42", "-y", "output.mp4");
            await execFFmpeg(ffmpeg, muxArgs, "Video and audio mux");
          }
        } else if (!muted && sourceHasAudio && fadeFilters.length > 0) {
          await execFFmpeg(
            ffmpeg,
            [
              "-i",
              "video_only.mp4",
              "-c:v",
              "copy",
              "-af",
              fadeFilters.join(","),
              "-c:a",
              "aac",
              "-brand",
              "mp42",
              "-y",
              "output.mp4",
            ],
            "MP4 audio fade & finalize",
          );
        }

        await cleanupFFmpegFiles(ffmpeg, ["video_only.mp4", "audio_trimmed.mp3", "audio_concat.txt"]);
      }

      const data = await ffmpeg.readFile("output.mp4");
      const uint8 =
        data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
      const blob = new Blob([new Uint8Array(uint8)], { type: "video/mp4" });
      setDownloadUrl(replaceUrl("export", URL.createObjectURL(blob)));
      setState("done");
    } catch (err) {
      console.warn("Export failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
      setState("error");
    } finally {
      detachProgress?.();
      if (ffmpeg) {
        try {
          await ffmpeg.unmount("/input");
        } catch {
          // Ignore if not mounted
        }
      }
      await cleanupFFmpegFiles(ffmpeg, tempFiles);
    }
  }, [
    videoSrc,
    videoFile,
    audioSrc,
    audioFile,
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
    textOverlay,
    textSize,
    textX,
    textY,
    textColor,
    textBg,
    playbackRate,
    volume,
    muted,
    keepOriginalAudio,
    audioFadeIn,
    audioFadeOut,
    videoDimensions,
    format,
    resolution,
    cleanup,
    replaceUrl,
  ]);

  const activeBadges: string[] = [];
  if (Math.abs(playbackRate - 1) >= 0.01) activeBadges.push(`Speed ${playbackRate.toFixed(2)}x`);
  if (muted) activeBadges.push("Muted");
  else if (audioSrc) activeBadges.push(keepOriginalAudio ? "Mixed Audio" : "Replaced Audio");
  if (filterPreset !== "none") activeBadges.push(`Filter: ${filterPreset}`);
  if (cropPreset !== "free") activeBadges.push(`${cropPreset} (${cropMode})`);
  if (textOverlay) activeBadges.push("Text Overlay");

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!videoSrc}
        className="neo-button bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-widest text-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        Export
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="export-dialog-title"
        {...({ closedby: "any" } as Record<string, string>)}
        className="m-auto w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0"
      >
        <div className="neo-panel space-y-5 bg-[var(--bg-panel)] p-6 text-[var(--text-main)]">
          <div className="flex items-center justify-between">
            <h3 id="export-dialog-title" className="text-lg font-black uppercase tracking-tight">
              Export Video
            </h3>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close export dialog"
              className="border-2 border-[var(--border-main)] px-2 py-0.5 text-base font-black leading-none hover:bg-[var(--accent)] hover:text-black"
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
                <div className="grid grid-cols-2 gap-2">
                  {(["mp4", "gif"] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`border-3 border-[var(--border-main)] px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] ${
                        format === fmt
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--bg-panel)]"
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {format === "mp4" && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                    Max Resolution
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: "original", label: "Orig" },
                        { id: "1080", label: "1080p" },
                        { id: "720", label: "720p" },
                        { id: "480", label: "480p" },
                      ] as const
                    ).map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => setResolution(res.id)}
                        className={`border-2 border-[var(--border-main)] px-2 py-1.5 text-[11px] font-black uppercase shadow-[2px_2px_0_0_var(--border-main)] ${
                          resolution === res.id
                            ? "bg-[var(--accent)] text-black"
                            : "bg-[var(--bg-panel)]"
                        }`}
                      >
                        {res.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-2.5">
                  {activeBadges.map((b) => (
                    <span
                      key={b}
                      className="border border-[var(--border-main)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                autoFocus
                onClick={handleExport}
                className="neo-button w-full bg-[var(--accent)] px-4 py-3 text-sm font-black uppercase tracking-wider text-black"
              >
                Start Export ({format.toUpperCase()})
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
            <div className="space-y-4">
              <p className="text-center text-sm font-bold text-[var(--success)]">
                ✓ Export complete!
              </p>

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="export-file-name"
                  className="block text-xs font-black uppercase tracking-widest text-[var(--text-soft)]"
                >
                  File Name
                </label>
                <div className="flex items-stretch">
                  <input
                    id="export-file-name"
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder={DEFAULT_EXPORT_FILENAME}
                    autoFocus
                    className="min-w-0 flex-1 border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-3 py-2 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <span className="flex items-center border-2 border-l-0 border-[var(--border-main)] bg-[var(--bg-panel)] px-2.5 font-mono text-xs font-black uppercase text-[var(--text-soft)]">
                    .{format}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <a
                  href={downloadUrl}
                  download={`${sanitizeExportBaseName(fileName)}.${format}`}
                  className="neo-button inline-block w-full bg-[var(--accent)] px-6 py-3 text-sm font-black uppercase tracking-wider text-black"
                >
                  Download .{format}
                </a>
              </div>
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
      </dialog>
    </>
  );
});

export default ExportPanel;
