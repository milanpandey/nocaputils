"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dropzone from "./Dropzone";
import EditorToolbar, { type ToolId } from "./EditorToolbar";
import VideoPreview, { type VideoPreviewHandle } from "./VideoPreview";
import ToolPanel from "./ToolPanel";
import TimelinePanel, {
  enrichClips,
  getClipAtTime,
  seekMediaToTimelineTime,
  type Clip,
  type Selection,
  type TimelinePanelHandle,
} from "./TimelinePanel";
import ExportPanel from "./ExportPanel";
import {
  useUndoHistory,
  type CropMode,
  type CropPreset,
  type FilterPreset,
  type UndoableState,
} from "./useUndoHistory";
import { useTrackedObjectUrls } from "@/hooks/useTrackedObjectUrls";
import { formatTimeTenths } from "@/lib/formatters";
import { triggerBlobDownload } from "@/lib/download";

const MIN_CLIP_DURATION = 0.1;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

async function buildAudioPeaks(file: File): Promise<number[]> {
  try {
    const ctx = new AudioContext();
    const buf = await file.arrayBuffer();
    const ab = await ctx.decodeAudioData(buf);
    const raw = ab.getChannelData(0);
    const samples = 240;
    const block = Math.max(1, Math.floor(raw.length / samples));
    const peaks = Array.from({ length: samples }, (_, i) => {
      let peak = 0;
      const start = i * block;
      const end = Math.min(start + block, raw.length);
      for (let j = start; j < end; j++) {
        peak = Math.max(peak, Math.abs(raw[j] ?? 0));
      }
      return peak;
    });
    await ctx.close();
    return peaks;
  } catch {
    return [];
  }
}

async function extractVideoThumbnails(
  src: string,
  duration: number,
  signal: AbortSignal,
  count = 8,
  onProgress?: (done: number, total: number) => void,
): Promise<HTMLCanvasElement[]> {
  if (!src || duration <= 0) return [];
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;

  const waitEvent = (event: "loadeddata" | "seeked") =>
    new Promise<boolean>((resolve) => {
      if (signal.aborted) {
        resolve(false);
        return;
      }
      const onDone = () => {
        cleanup();
        resolve(true);
      };
      const onErr = () => {
        cleanup();
        resolve(false);
      };
      const onAbort = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        video.removeEventListener(event, onDone);
        video.removeEventListener("error", onErr);
        signal.removeEventListener("abort", onAbort);
      };
      video.addEventListener(event, onDone, { once: true });
      video.addEventListener("error", onErr, { once: true });
      signal.addEventListener("abort", onAbort, { once: true });
    });

  try {
    const loaded = await waitEvent("loadeddata");
    if (!loaded || signal.aborted || !video.videoWidth || !video.videoHeight) {
      return [];
    }

    const thumbs: HTMLCanvasElement[] = [];
    for (let i = 0; i < count; i++) {
      if (signal.aborted) break;
      const t = clamp(((i + 0.5) / count) * duration, 0, Math.max(duration - 0.05, 0));
      video.currentTime = t;
      const ok = await waitEvent("seeked");
      if (!ok || signal.aborted) break;

      const c = document.createElement("canvas");
      c.width = 96;
      c.height = 54;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 96, 54);
        thumbs.push(c);
      }
      onProgress?.(i + 1, count);
    }
    return thumbs;
  } catch {
    return [];
  } finally {
    video.src = "";
    video.load();
  }
}

function getAudioEnvelopeGain(
  t: number,
  totalDur: number,
  baseVolume: number,
  muted: boolean,
  fadeIn: number,
  fadeOut: number,
): number {
  if (muted) return 0;
  let gain = baseVolume;
  if (fadeIn > 0 && t < fadeIn) {
    gain *= t / fadeIn;
  }
  if (fadeOut > 0 && totalDur > fadeOut && totalDur - t < fadeOut) {
    gain *= Math.max(0, (totalDur - t) / fadeOut);
  }
  return clamp(gain, 0, 1);
}

export default function VideoEditor() {
  /* ---- media state ---- */
  const [videoSrc, setVideoSrc] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPeaks, setAudioPeaks] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<HTMLCanvasElement[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isPreparingVideo, setIsPreparingVideo] = useState(false);
  const [prepProgress, setPrepProgress] = useState(0);
  const [prepStatus, setPrepStatus] = useState("Preparing video workspace...");

  /* ---- timeline & workspace state ---- */
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoClips, setVideoClips] = useState<Clip[]>([]);
  const [audioClips, setAudioClips] = useState<Clip[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  /* ---- tool state ---- */
  const [activeTab, setActiveTab] = useState<ToolId>("Trim");
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [cropMode, setCropMode] = useState<CropMode>("letterbox");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioFadeIn, setAudioFadeIn] = useState(0);
  const [audioFadeOut, setAudioFadeOut] = useState(0);
  const [keepOriginalAudio, setKeepOriginalAudio] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("none");
  const [textOverlay, setTextOverlay] = useState("");
  const [textSize, setTextSize] = useState(28);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(18);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textBg, setTextBg] = useState(false);

  /* ---- refs ---- */
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<VideoPreviewHandle | null>(null);
  const timelineRef = useRef<TimelinePanelHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const clipIdRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const playClockStart = useRef(0);
  const playTimelineStart = useRef(0);
  const currentTimeRef = useRef(0);
  const sliderCommitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbAbortRef = useRef<AbortController | null>(null);
  const prepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { replaceUrl, revokeUrl } = useTrackedObjectUrls();

  /* ---- undo / redo ---- */
  const { pushState, undo, redo, canUndo, canRedo, clearHistory } = useUndoHistory();

  const snapshotState = useCallback(
    (): UndoableState => ({
      videoClips,
      audioClips,
      selection,
      cropPreset,
      cropMode,
      rotation,
      flipH,
      flipV,
      brightness,
      contrast,
      saturation,
      filterPreset,
      textOverlay,
      textSize,
      textX,
      textY,
      textColor,
      textBg,
      playbackRate,
      volume,
      muted,
      audioFadeIn,
      audioFadeOut,
      keepOriginalAudio,
    }),
    [
      videoClips,
      audioClips,
      selection,
      cropPreset,
      cropMode,
      rotation,
      flipH,
      flipV,
      brightness,
      contrast,
      saturation,
      filterPreset,
      textOverlay,
      textSize,
      textX,
      textY,
      textColor,
      textBg,
      playbackRate,
      volume,
      muted,
      audioFadeIn,
      audioFadeOut,
      keepOriginalAudio,
    ],
  );

  const applyState = useCallback((s: UndoableState) => {
    setVideoClips(s.videoClips);
    setAudioClips(s.audioClips);
    setSelection(s.selection);
    setCropPreset(s.cropPreset);
    setCropMode(s.cropMode);
    setRotation(s.rotation);
    setFlipH(s.flipH);
    setFlipV(s.flipV);
    setBrightness(s.brightness);
    setContrast(s.contrast);
    setSaturation(s.saturation);
    setFilterPreset(s.filterPreset);
    setTextOverlay(s.textOverlay);
    setTextSize(s.textSize);
    setTextX(s.textX);
    setTextY(s.textY);
    setTextColor(s.textColor);
    setTextBg(s.textBg);
    setPlaybackRate(s.playbackRate);
    setVolume(s.volume);
    setMuted(s.muted);
    setAudioFadeIn(s.audioFadeIn);
    setAudioFadeOut(s.audioFadeOut);
    setKeepOriginalAudio(s.keepOriginalAudio);
  }, []);

  const commit = useCallback(
    (action: () => void) => {
      pushState(snapshotState());
      action();
    },
    [pushState, snapshotState],
  );

  const sliderSnapshotRef = useRef<UndoableState | null>(null);
  const commitSlider = useCallback(
    (action: () => void) => {
      if (!sliderSnapshotRef.current) {
        sliderSnapshotRef.current = snapshotState();
      }
      action();
      if (sliderCommitTimer.current) clearTimeout(sliderCommitTimer.current);
      sliderCommitTimer.current = setTimeout(() => {
        if (sliderSnapshotRef.current) {
          pushState(sliderSnapshotRef.current);
          sliderSnapshotRef.current = null;
        }
      }, 600);
    },
    [pushState, snapshotState],
  );

  const handleUndo = useCallback(() => {
    const prev = undo(snapshotState());
    if (prev) applyState(prev);
  }, [applyState, snapshotState, undo]);

  const handleRedo = useCallback(() => {
    const next = redo(snapshotState());
    if (next) applyState(next);
  }, [applyState, snapshotState, redo]);

  /* ---- derived ---- */
  const videoSegments = useMemo(() => enrichClips(videoClips), [videoClips]);
  const audioSegments = useMemo(() => enrichClips(audioClips), [audioClips]);

  const selectedClip = useMemo(() => {
    if (!selection) return null;
    const clips = selection.track === "video" ? videoSegments : audioSegments;
    return clips.find((c) => c.id === selection.id) ?? null;
  }, [audioSegments, selection, videoSegments]);

  const totalDuration = useMemo(() => {
    const ve = videoSegments[videoSegments.length - 1]?.timelineEnd ?? 0;
    const ae = audioSegments[audioSegments.length - 1]?.timelineEnd ?? 0;
    const clipMax = Math.max(ve, ae);
    if (clipMax > 0) return Math.max(clipMax, 0.1);
    return Math.max(videoDuration, audioDuration, 1);
  }, [audioDuration, audioSegments, videoDuration, videoSegments]);

  const previewFilter = useMemo(() => {
    const p = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
    ];
    if (filterPreset === "grayscale") p.push("grayscale(100%)");
    if (filterPreset === "sepia") p.push("sepia(100%)");
    if (filterPreset === "vintage") {
      p.push("sepia(35%)", "contrast(110%)", "saturate(85%)", "hue-rotate(-8deg)");
    }
    if (filterPreset === "warm") {
      p.push("sepia(22%)", "saturate(115%)", "brightness(103%)");
    }
    if (filterPreset === "cool") {
      p.push("hue-rotate(14deg)", "saturate(95%)", "contrast(105%)");
    }
    if (filterPreset === "dramatic") {
      p.push("contrast(135%)", "saturate(85%)", "brightness(96%)");
    }
    return p.join(" ");
  }, [brightness, contrast, saturation, filterPreset]);

  const canTrimStart = Boolean(
    selectedClip &&
      currentTime > selectedClip.timelineStart + MIN_CLIP_DURATION &&
      currentTime < selectedClip.timelineEnd - MIN_CLIP_DURATION,
  );
  const canTrimEnd = canTrimStart;

  const clearPrepTimeout = useCallback(() => {
    if (prepTimeoutRef.current) {
      clearTimeout(prepTimeoutRef.current);
      prepTimeoutRef.current = null;
    }
  }, []);

  const skipPreparation = useCallback(() => {
    clearPrepTimeout();
    const ac = thumbAbortRef.current;
    thumbAbortRef.current = null;
    ac?.abort();
    setPrepProgress(100);
    setIsPreparingVideo(false);
  }, [clearPrepTimeout]);

  /* ---- media sync ---- */
  const syncMedia = useCallback(
    (t: number, tolerance = 0.12) => {
      seekMediaToTimelineTime(
        previewRef.current?.getElement() ?? null,
        videoSegments,
        t,
        tolerance,
      );
      seekMediaToTimelineTime(audioRef.current, audioSegments, t, tolerance);
    },
    [audioSegments, videoSegments],
  );

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    previewRef.current?.getElement()?.pause();
    audioRef.current?.pause();
  }, []);

  const seekTo = useCallback(
    (t: number) => {
      const clamped = clamp(t, 0, totalDuration);
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
      timelineRef.current?.setPlayheadTime(clamped);
      if (isPlaying) {
        playClockStart.current = performance.now();
        playTimelineStart.current = clamped;
      }
      syncMedia(clamped, isPlaying ? 0.15 : 0.04);
    },
    [isPlaying, syncMedia, totalDuration],
  );

  /* ---- handlers ---- */
  const handleVideoFile = useCallback(
    (file: File) => {
      clearPrepTimeout();
      const prevAc = thumbAbortRef.current;
      thumbAbortRef.current = null;
      prevAc?.abort();

      setThumbnails([]);
      setZoom(1);
      setIsPreparingVideo(true);
      setPrepProgress(15);
      setPrepStatus("Loading video metadata...");
      setVideoFile(file);
      setVideoSrc(replaceUrl("video", URL.createObjectURL(file)));
      currentTimeRef.current = 0;
      setCurrentTime(0);
      setSelection(null);
      setIsPlaying(false);
      clearHistory();

      // Ensure the overlay never blocks the editor if metadata stalls or fails
      prepTimeoutRef.current = setTimeout(() => {
        setIsPreparingVideo(false);
      }, 5000);
    },
    [clearHistory, clearPrepTimeout, replaceUrl],
  );

  const handleAudioFile = useCallback(
    async (file: File) => {
      setAudioFile(file);
      setAudioSrc(replaceUrl("audio", URL.createObjectURL(file)));
      setSelection(null);
      const peaks = await buildAudioPeaks(file);
      setAudioPeaks(peaks);
    },
    [replaceUrl],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const f = files[0];
      if (f.type.startsWith("video/")) handleVideoFile(f);
      else if (f.type.startsWith("audio/")) void handleAudioFile(f);
    },
    [handleAudioFile, handleVideoFile],
  );

  const togglePlayback = useCallback(() => {
    if (!videoSrc && !audioSrc) return;
    if (isPlaying) {
      setCurrentTime(currentTimeRef.current);
      stopPlayback();
      return;
    }
    // Restart from 0 if already at the end
    const startAt = currentTimeRef.current >= totalDuration - 0.05 ? 0 : currentTimeRef.current;
    currentTimeRef.current = startAt;
    setCurrentTime(startAt);
    playClockStart.current = performance.now();
    playTimelineStart.current = startAt;
    setIsPlaying(true);
  }, [audioSrc, isPlaying, stopPlayback, totalDuration, videoSrc]);

  const toggleFullscreen = useCallback(async () => {
    const shell = editorShellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen denial
    }
  }, []);

  const splitSelected = useCallback(() => {
    if (!selection) return;
    const t = currentTimeRef.current;
    const segs = selection.track === "video" ? videoSegments : audioSegments;
    const clip = segs.find((c) => c.id === selection.id);
    if (!clip) return;
    if (
      t <= clip.timelineStart + MIN_CLIP_DURATION ||
      t >= clip.timelineEnd - MIN_CLIP_DURATION
    ) {
      return;
    }

    commit(() => {
      const splitSrc = clip.sourceStart + (t - clip.timelineStart);
      const newClip: Clip = {
        id: clipIdRef.current++,
        sourceStart: splitSrc,
        sourceEnd: clip.sourceEnd,
        timelineStart: t,
      };
      const updater = (items: Clip[]) =>
        items.flatMap((i) => (i.id !== clip.id ? [i] : [{ ...i, sourceEnd: splitSrc }, newClip]));

      if (selection.track === "video") setVideoClips(updater);
      else setAudioClips(updater);
      setSelection({ track: selection.track, id: newClip.id });
    });
  }, [audioSegments, commit, selection, videoSegments]);

  const trimStartToPlayhead = useCallback(() => {
    if (!selection || !selectedClip) return;
    const t = currentTimeRef.current;
    if (
      t <= selectedClip.timelineStart + MIN_CLIP_DURATION ||
      t >= selectedClip.timelineEnd - MIN_CLIP_DURATION
    ) {
      return;
    }

    commit(() => {
      const trimDelta = t - selectedClip.timelineStart;
      if (selection.track === "video") {
        const repackedStart = selectedClip.timelineStart;
        setVideoClips((items) => {
          const sorted = [...items].sort((a, b) => a.timelineStart - b.timelineStart);
          let repackedCursor = 0;
          return sorted.map((clip) => {
            const updated =
              clip.id === selectedClip.id
                ? { ...clip, sourceStart: clip.sourceStart + trimDelta }
                : clip;
            const dur = updated.sourceEnd - updated.sourceStart;
            const repacked = { ...updated, timelineStart: repackedCursor };
            repackedCursor += dur;
            return repacked;
          });
        });
        currentTimeRef.current = repackedStart;
        setCurrentTime(repackedStart);
      } else {
        setAudioClips((items) =>
          items.map((clip) =>
            clip.id === selectedClip.id
              ? { ...clip, timelineStart: t, sourceStart: clip.sourceStart + trimDelta }
              : clip,
          ),
        );
      }
    });
  }, [commit, selectedClip, selection]);

  const trimEndToPlayhead = useCallback(() => {
    if (!selection || !selectedClip) return;
    const t = currentTimeRef.current;
    if (
      t <= selectedClip.timelineStart + MIN_CLIP_DURATION ||
      t >= selectedClip.timelineEnd - MIN_CLIP_DURATION
    ) {
      return;
    }

    commit(() => {
      const nextSourceEnd = selectedClip.sourceStart + (t - selectedClip.timelineStart);
      if (selection.track === "video") {
        setVideoClips((items) => {
          const sorted = [...items].sort((a, b) => a.timelineStart - b.timelineStart);
          let cursor = 0;
          return sorted.map((clip) => {
            const updated =
              clip.id === selectedClip.id ? { ...clip, sourceEnd: nextSourceEnd } : clip;
            const dur = updated.sourceEnd - updated.sourceStart;
            const repacked = { ...updated, timelineStart: cursor };
            cursor += dur;
            return repacked;
          });
        });
      } else {
        setAudioClips((items) =>
          items.map((clip) =>
            clip.id === selectedClip.id ? { ...clip, sourceEnd: nextSourceEnd } : clip,
          ),
        );
      }
    });
  }, [commit, selectedClip, selection]);

  const deleteSelected = useCallback(() => {
    if (!selection) return;

    commit(() => {
      const repack = (items: Clip[]): Clip[] => {
        const remaining = items
          .filter((i) => i.id !== selection.id)
          .sort((a, b) => a.timelineStart - b.timelineStart);
        let cursor = 0;
        return remaining.map((clip) => {
          const duration = clip.sourceEnd - clip.sourceStart;
          const repacked = { ...clip, timelineStart: cursor };
          cursor += duration;
          return repacked;
        });
      };

      if (selection.track === "video") setVideoClips(repack);
      else setAudioClips(repack);
      setSelection(null);
    });
  }, [commit, selection]);

  const clearAudio = useCallback(() => {
    stopPlayback();
    setAudioDuration(0);
    setAudioClips([]);
    setAudioPeaks([]);
    setSelection((s) => (s?.track === "audio" ? null : s));
    revokeUrl("audio");
    setAudioFile(null);
    setAudioSrc("");
  }, [revokeUrl, stopPlayback]);

  const resetTransform = useCallback(() => {
    commit(() => {
      setCropPreset("free");
      setCropMode("letterbox");
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    });
  }, [commit]);

  const resetAudio = useCallback(() => {
    commit(() => {
      setPlaybackRate(1);
      setVolume(1);
      setMuted(false);
      setAudioFadeIn(0);
      setAudioFadeOut(0);
      setKeepOriginalAudio(true);
    });
  }, [commit]);

  const resetFilters = useCallback(() => {
    commit(() => {
      setFilterPreset("none");
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    });
  }, [commit]);

  const captureSnapshot = useCallback(() => {
    const vid = previewRef.current?.getElement();
    if (!vid || !vid.videoWidth || !vid.videoHeight) return;

    const r = ((rotation % 360) + 360) % 360;
    const isRotated90 = r === 90 || r === 270;
    const rotW = isRotated90 ? vid.videoHeight : vid.videoWidth;
    const rotH = isRotated90 ? vid.videoWidth : vid.videoHeight;

    let outW = rotW;
    let outH = rotH;
    if (cropPreset !== "free") {
      const ratios: Record<string, number> = { "16:9": 16 / 9, "1:1": 1, "9:16": 9 / 16 };
      const targetRatio = ratios[cropPreset] ?? rotW / rotH;
      if (rotW / rotH > targetRatio) {
        outH = rotH;
        outW = Math.round(outH * targetRatio);
      } else {
        outW = rotW;
        outH = Math.round(outW / targetRatio);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, outW, outH);

    const scale =
      cropPreset !== "free" && cropMode === "crop"
        ? Math.max(outW / rotW, outH / rotH)
        : Math.min(outW / rotW, outH / rotH);

    ctx.save();
    ctx.filter = previewFilter;
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -scale : scale, flipV ? -scale : scale);
    ctx.drawImage(vid, -vid.videoWidth / 2, -vid.videoHeight / 2, vid.videoWidth, vid.videoHeight);
    ctx.restore();

    if (textOverlay) {
      const fontPx = Math.max(12, Math.round(outH * (textSize / 500)));
      ctx.font = `900 ${fontPx}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tx = (outW * textX) / 100;
      const ty = (outH * textY) / 100;
      const upper = textOverlay.toUpperCase();
      if (textBg) {
        const metrics = ctx.measureText(upper);
        const bw = metrics.width + 24;
        const bh = fontPx * 1.35;
        ctx.fillStyle = "rgba(0,0,0,0.68)";
        ctx.fillRect(tx - bw / 2, ty - bh / 2, bw, bh);
      } else {
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
      }
      ctx.fillStyle = textColor;
      ctx.fillText(upper, tx, ty);
    }

    canvas.toBlob((blob) => {
      canvas.width = 0;
      canvas.height = 0;
      if (blob) {
        const stamp = formatTimeTenths(currentTimeRef.current).replace(/[:.]/g, "-");
        triggerBlobDownload(blob, `snapshot-${stamp}.png`);
      }
    }, "image/png");
  }, [
    cropMode,
    cropPreset,
    flipH,
    flipV,
    previewFilter,
    rotation,
    textBg,
    textColor,
    textOverlay,
    textSize,
    textX,
    textY,
  ]);

  /* ---- playback loop (60fps imperative canvas + 15fps React state sync) ---- */
  const videoSegRef = useRef(videoSegments);
  const audioSegRef = useRef(audioSegments);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  const playbackRateRef = useRef(playbackRate);
  const totalDurationRef = useRef(totalDuration);
  const isLoopingRef = useRef(isLooping);
  const audioSrcRef = useRef(audioSrc);
  const keepOriginalAudioRef = useRef(keepOriginalAudio);
  const fadeInRef = useRef(audioFadeIn);
  const fadeOutRef = useRef(audioFadeOut);

  videoSegRef.current = videoSegments;
  audioSegRef.current = audioSegments;
  mutedRef.current = muted;
  volumeRef.current = volume;
  playbackRateRef.current = playbackRate;
  totalDurationRef.current = totalDuration;
  isLoopingRef.current = isLooping;
  audioSrcRef.current = audioSrc;
  keepOriginalAudioRef.current = keepOriginalAudio;
  fadeInRef.current = audioFadeIn;
  fadeOutRef.current = audioFadeOut;

  useEffect(() => {
    if (!isPlaying) return;

    const cTime = playTimelineStart.current;
    syncMedia(cTime, 0.04);

    const vid = previewRef.current?.getElement();
    if (vid && getClipAtTime(videoSegRef.current, cTime)) void vid.play().catch(() => {});
    if (audioRef.current && getClipAtTime(audioSegRef.current, cTime) && !mutedRef.current) {
      void audioRef.current.play().catch(() => {});
    }

    let lastReactSync = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - playClockStart.current) / 1000;
      let next = playTimelineStart.current + elapsed * playbackRateRef.current;
      const dur = totalDurationRef.current;

      if (next >= dur) {
        if (isLoopingRef.current) {
          playClockStart.current = now;
          playTimelineStart.current = 0;
          next = 0;
          syncMedia(0, 0.04);
        } else {
          currentTimeRef.current = dur;
          setCurrentTime(dur);
          timelineRef.current?.setPlayheadTime(dur);
          stopPlayback();
          return;
        }
      }

      currentTimeRef.current = next;
      timelineRef.current?.setPlayheadTime(next);
      if (now - lastReactSync >= 50) {
        lastReactSync = now;
        setCurrentTime(next);
      }

      const envGain = getAudioEnvelopeGain(
        next,
        dur,
        volumeRef.current,
        mutedRef.current,
        fadeInRef.current,
        fadeOutRef.current,
      );

      // Sync video + original audio gain
      const v = previewRef.current?.getElement();
      if (v) {
        const hasCustom = Boolean(audioSrcRef.current && audioSegRef.current.length > 0);
        const muteVideoAudio = mutedRef.current || (hasCustom && !keepOriginalAudioRef.current);
        v.muted = muteVideoAudio;
        v.volume = envGain;

        const didSeek = seekMediaToTimelineTime(v, videoSegRef.current, next, 0.15);
        if (getClipAtTime(videoSegRef.current, next)) {
          if (v.paused || didSeek) void v.play().catch(() => {});
        } else {
          v.pause();
        }
      }

      // Sync custom audio + gain
      const a = audioRef.current;
      if (a) {
        a.muted = mutedRef.current;
        a.volume = envGain;
        const didSeekA = seekMediaToTimelineTime(a, audioSegRef.current, next, 0.15);
        if (getClipAtTime(audioSegRef.current, next) && !mutedRef.current) {
          if (a.paused || didSeekA) void a.play().catch(() => {});
        } else {
          a.pause();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const preview = previewRef.current;
    const audio = audioRef.current;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      preview?.getElement()?.pause();
      audio?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // When not playing, sync media position and audio state
  useEffect(() => {
    if (isPlaying) return;
    currentTimeRef.current = currentTime;
    syncMedia(currentTime, 0.04);
  }, [currentTime, isPlaying, syncMedia]);

  /* ---- side effects ---- */
  useEffect(() => {
    const vid = previewRef.current?.getElement();
    if (vid) {
      vid.playbackRate = playbackRate;
      const hasCustom = Boolean(audioSrc && audioSegments.length > 0);
      vid.muted = muted || (hasCustom && !keepOriginalAudio);
      vid.volume = volume;
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [audioSegments.length, audioSrc, keepOriginalAudio, muted, playbackRate, volume]);

  // Listen to fullscreenchange so state stays synced if user exits via Esc
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === editorShellRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Clean up thumbnail abort controller & preparation timer on unmount
  useEffect(() => {
    return () => {
      clearPrepTimeout();
      thumbAbortRef.current?.abort();
    };
  }, [clearPrepTimeout]);

  /* ---- keyboard shortcuts ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (document.querySelector("dialog[open]")) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y / Cmd+Y
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (selection) {
            e.preventDefault();
            deleteSelected();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekTo(currentTimeRef.current - (e.shiftKey ? 1 / 30 : 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekTo(currentTimeRef.current + (e.shiftKey ? 1 / 30 : 1));
          break;
        case "Home":
          e.preventDefault();
          seekTo(0);
          break;
        case "End":
          e.preventDefault();
          seekTo(totalDuration);
          break;
        case " ":
          e.preventDefault();
          togglePlayback();
          break;
        case "s":
        case "S":
          if (selection) {
            e.preventDefault();
            splitSelected();
          }
          break;
        case "[":
        case "i":
        case "I":
          if (canTrimStart) {
            e.preventDefault();
            trimStartToPlayhead();
          }
          break;
        case "]":
        case "o":
        case "O":
          if (canTrimEnd) {
            e.preventDefault();
            trimEndToPlayhead();
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          void toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    canTrimEnd,
    canTrimStart,
    deleteSelected,
    handleRedo,
    handleUndo,
    seekTo,
    selection,
    splitSelected,
    toggleFullscreen,
    togglePlayback,
    totalDuration,
    trimEndToPlayhead,
    trimStartToPlayhead,
  ]);

  /* ---- drag undo helpers ---- */
  const dragSnapshotRef = useRef<UndoableState | null>(null);
  const handleDragSnapshotStart = useCallback(() => {
    dragSnapshotRef.current = snapshotState();
  }, [snapshotState]);
  const handleDragSnapshotEnd = useCallback(() => {
    if (dragSnapshotRef.current) {
      pushState(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
    }
  }, [pushState]);

  const onVideoLoaded = useCallback(
    ({ duration, width, height }: { duration: number; width: number; height: number }) => {
      clearPrepTimeout();
      setVideoDuration(duration);
      setVideoDimensions({ width, height });
      const id = clipIdRef.current++;
      setVideoClips([{ id, sourceStart: 0, sourceEnd: duration, timelineStart: 0 }]);
      setSelection({ track: "video", id });

      const prevAc = thumbAbortRef.current;
      thumbAbortRef.current = null;
      prevAc?.abort();

      const ac = new AbortController();
      thumbAbortRef.current = ac;
      setIsPreparingVideo(true);
      setPrepProgress(35);
      setPrepStatus("Preparing timeline previews...");

      // Cap thumbnail pre-generation so long videos never stall editing
      prepTimeoutRef.current = setTimeout(() => {
        ac.abort();
      }, 1800);

      void extractVideoThumbnails(videoSrc, duration, ac.signal, 8, (done, total) => {
        if (thumbAbortRef.current !== ac) return;
        setPrepProgress(35 + Math.round((done / total) * 60));
      })
        .then((frames) => {
          if (thumbAbortRef.current === ac && frames.length > 0) {
            setThumbnails(frames);
          }
        })
        .finally(() => {
          if (thumbAbortRef.current === ac) {
            clearPrepTimeout();
            thumbAbortRef.current = null;
            setPrepProgress(100);
            setIsPreparingVideo(false);
          }
        });
    },
    [clearPrepTimeout, videoSrc],
  );

  const onAudioLoaded = useCallback(() => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    const dur = el.duration;
    setAudioDuration(dur);
    const id = clipIdRef.current++;
    setAudioClips([{ id, sourceStart: 0, sourceEnd: dur, timelineStart: 0 }]);
    setSelection({ track: "audio", id });
  }, []);

  const handleTextPositionChange = useCallback((x: number, y: number) => {
    setTextX(x);
    setTextY(y);
  }, []);

  /* ---- selected clip info for ToolPanel ---- */
  const selectedClipInfo = useMemo(
    () =>
      selectedClip && selection
        ? {
            track: selection.track,
            timelineStart: formatTimeTenths(selectedClip.timelineStart),
            timelineEnd: formatTimeTenths(selectedClip.timelineEnd),
            sourceStart: formatTimeTenths(selectedClip.sourceStart),
            sourceEnd: formatTimeTenths(selectedClip.sourceEnd),
          }
        : null,
    [selectedClip, selection],
  );

  /* ---- render ---- */
  if (!videoSrc) {
    return (
      <div>
        <Dropzone onFiles={handleFiles} />
      </div>
    );
  }

  return (
    <div
      ref={editorShellRef}
      className={
        isFullscreen
          ? "relative flex h-screen w-screen flex-col gap-3 overflow-hidden bg-[var(--bg-page)] p-3 sm:p-4"
          : "relative space-y-4"
      }
    >
      {isPreparingVideo && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--bg-page)]/85 p-4 backdrop-blur-[2px]"
        >
          <div className="neo-panel w-full max-w-md space-y-4 bg-[var(--bg-panel)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                  Preparing Video Workspace
                </h3>
                <p className="mt-1 text-xs font-bold text-[var(--text-main)]/70">{prepStatus}</p>
              </div>
              <span className="border-2 border-[var(--border-main)] bg-[var(--accent)] px-2 py-0.5 font-mono text-xs font-black text-black">
                {prepProgress}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
              <div
                className="h-full bg-[var(--accent)] transition-[width] duration-150"
                style={{ width: `${Math.min(100, Math.max(10, prepProgress))}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-[var(--text-main)]/65">
                Auto-completes in under 2s for long videos
              </span>
              <button
                type="button"
                onClick={skipPreparation}
                className="neo-button bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-black uppercase tracking-wider"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleAudioFile(f);
        }}
      />

      {/* Top Studio Header Bar */}
      <div className="neo-panel flex shrink-0 flex-wrap items-center justify-between gap-3 bg-[var(--bg-panel)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="neo-button bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-black uppercase tracking-wider"
          >
            Replace Video
          </button>
          {videoDimensions.width > 0 && (
            <span className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2.5 py-1 font-mono text-[11px] font-black text-[var(--text-main)]">
              {videoDimensions.width}×{videoDimensions.height} • {formatTimeTenths(totalDuration)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="neo-button bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="neo-button bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↪ Redo
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="neo-button bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-black uppercase tracking-wider"
            title="Toggle Editor Fullscreen (F)"
          >
            {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"}
          </button>
          <ExportPanel
            videoSrc={videoSrc}
            videoFile={videoFile}
            audioSrc={audioSrc}
            audioFile={audioFile}
            videoSegments={videoSegments}
            audioSegments={audioSegments}
            brightness={brightness}
            contrast={contrast}
            saturation={saturation}
            filterPreset={filterPreset}
            cropPreset={cropPreset}
            cropMode={cropMode}
            rotation={rotation}
            flipH={flipH}
            flipV={flipV}
            textOverlay={textOverlay}
            textSize={textSize}
            textX={textX}
            textY={textY}
            textColor={textColor}
            textBg={textBg}
            playbackRate={playbackRate}
            volume={volume}
            muted={muted}
            keepOriginalAudio={keepOriginalAudio}
            audioFadeIn={audioFadeIn}
            audioFadeOut={audioFadeOut}
            videoDimensions={videoDimensions}
          />
        </div>
      </div>

      {/* Main Studio Workspace: Left Rail + Center Stage + Single Responsive Inspector */}
      <div
        className={`flex flex-col gap-4 lg:flex-row ${
          isFullscreen ? "min-h-0 flex-1 overflow-hidden" : ""
        }`}
      >
        {/* Tool Rail + Center Stage */}
        <div
          className={`flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-4 ${
            isFullscreen ? "min-h-0" : ""
          }`}
        >
          <div className="shrink-0">
            <EditorToolbar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div
            className={`flex min-w-0 flex-1 flex-col gap-3 ${
              isFullscreen ? "min-h-0" : ""
            }`}
          >
            <VideoPreview
              ref={previewRef}
              src={videoSrc}
              filter={previewFilter}
              rotation={rotation}
              flipH={flipH}
              flipV={flipV}
              cropPreset={cropPreset}
              cropMode={cropMode}
              textOverlay={textOverlay}
              textSize={textSize}
              textX={textX}
              textY={textY}
              textColor={textColor}
              textBg={textBg}
              isPlaying={isPlaying}
              isWorkspaceFullscreen={isFullscreen}
              onTogglePlay={togglePlayback}
              onTextPositionChange={handleTextPositionChange}
              onTextDragStart={handleDragSnapshotStart}
              onTextDragEnd={handleDragSnapshotEnd}
              onLoadedMetadata={onVideoLoaded}
            />

            {/* Dedicated Transport Bar */}
            <div className="neo-panel flex shrink-0 flex-wrap items-center justify-between gap-2 bg-[var(--bg-panel)] px-3 py-2">
              {/* Left: Volume & Speed */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => commit(() => setMuted((v) => !v))}
                  title={muted ? "Unmute" : "Mute"}
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
                >
                  {muted ? "🔇" : "🔊"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={muted ? 0 : volume}
                  aria-label="Preview volume"
                  onChange={(e) => {
                    const nextVol = Number(e.target.value);
                    commitSlider(() => {
                      if (muted && nextVol > 0) setMuted(false);
                      setVolume(nextVol);
                    });
                  }}
                  className="hidden w-16 accent-[var(--accent)] sm:block"
                />
                <span className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2 py-0.5 font-mono text-[11px] font-black">
                  {playbackRate.toFixed(2)}x
                </span>
              </div>

              {/* Center: Transport Playback */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => seekTo(0)}
                  title="Jump to start (Home)"
                  aria-label="Jump to start"
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  onClick={() => seekTo(currentTimeRef.current - 1 / 30)}
                  title="Previous frame (Shift+←)"
                  aria-label="Previous frame"
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
                >
                  -1f
                </button>
                <button
                  type="button"
                  onClick={togglePlayback}
                  title="Play / Pause (Space)"
                  className="neo-button bg-[var(--accent)] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  type="button"
                  onClick={() => seekTo(currentTimeRef.current + 1 / 30)}
                  title="Next frame (Shift+→)"
                  aria-label="Next frame"
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
                >
                  +1f
                </button>
                <button
                  type="button"
                  onClick={() => seekTo(totalDuration)}
                  title="Jump to end (End)"
                  aria-label="Jump to end"
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
                >
                  ⏭
                </button>
                <button
                  type="button"
                  onClick={() => setIsLooping((l) => !l)}
                  title="Toggle loop playback"
                  aria-pressed={isLooping}
                  className={`border-2 border-[var(--border-main)] px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_var(--border-main)] ${
                    isLooping
                      ? "bg-[var(--accent)] text-black"
                      : "bg-[var(--bg-panel)]"
                  }`}
                >
                  🔁
                </button>
              </div>

              {/* Right: Timecode & Snapshot */}
              <div className="flex items-center gap-2">
                <span className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2.5 py-1 font-mono text-xs font-black text-[var(--text-main)]">
                  {formatTimeTenths(currentTime)} / {formatTimeTenths(totalDuration)}
                </span>
                <button
                  type="button"
                  onClick={captureSnapshot}
                  title="Save current frame as PNG"
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
                >
                  📸 Snapshot
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Single Mounted Tool Panel (responsive desktop sidebar / mobile stacked card) */}
        <div className="w-full shrink-0 lg:w-64">
          <div
            className={`neo-panel bg-[var(--bg-panel)] p-4 ${
              isFullscreen ? "h-full overflow-y-auto" : "h-full"
            }`}
          >
            <ToolPanel
              activeTab={activeTab}
              selectedClipInfo={selectedClipInfo}
              onSplit={splitSelected}
              onTrimStartToPlayhead={trimStartToPlayhead}
              onTrimEndToPlayhead={trimEndToPlayhead}
              onDeleteSelected={deleteSelected}
              canTrimStart={canTrimStart}
              canTrimEnd={canTrimEnd}
              cropPreset={cropPreset}
              onCropPreset={(v) => commit(() => setCropPreset(v))}
              cropMode={cropMode}
              onCropMode={(v) => commit(() => setCropMode(v))}
              onRotate={(d) => commit(() => setRotation((v) => v + d))}
              onFlipH={() => commit(() => setFlipH((v) => !v))}
              onFlipV={() => commit(() => setFlipV((v) => !v))}
              onResetTransform={resetTransform}
              audioSrc={audioSrc}
              onUploadAudio={() => audioInputRef.current?.click()}
              onClearAudio={clearAudio}
              playbackRate={playbackRate}
              onPlaybackRate={(v) => commitSlider(() => setPlaybackRate(v))}
              volume={volume}
              onVolume={(v) => commitSlider(() => setVolume(v))}
              muted={muted}
              onToggleMute={() => commit(() => setMuted((v) => !v))}
              keepOriginalAudio={keepOriginalAudio}
              onToggleKeepOriginalAudio={() =>
                commit(() => setKeepOriginalAudio((v) => !v))
              }
              audioFadeIn={audioFadeIn}
              onAudioFadeIn={(v) => commitSlider(() => setAudioFadeIn(v))}
              audioFadeOut={audioFadeOut}
              onAudioFadeOut={(v) => commitSlider(() => setAudioFadeOut(v))}
              onResetAudio={resetAudio}
              filterPreset={filterPreset}
              onFilterPreset={(v) => commit(() => setFilterPreset(v))}
              brightness={brightness}
              onBrightness={(v) => commitSlider(() => setBrightness(v))}
              contrast={contrast}
              onContrast={(v) => commitSlider(() => setContrast(v))}
              saturation={saturation}
              onSaturation={(v) => commitSlider(() => setSaturation(v))}
              onResetFilters={resetFilters}
              textOverlay={textOverlay}
              onTextOverlay={(v) => commitSlider(() => setTextOverlay(v))}
              textSize={textSize}
              onTextSize={(v) => commitSlider(() => setTextSize(v))}
              textX={textX}
              onTextX={(v) => commitSlider(() => setTextX(v))}
              textY={textY}
              onTextY={(v) => commitSlider(() => setTextY(v))}
              textColor={textColor}
              onTextColor={(c) => commit(() => setTextColor(c))}
              textBg={textBg}
              onToggleTextBg={() => commit(() => setTextBg((b) => !b))}
              onClearText={() => commit(() => setTextOverlay(""))}
            />
          </div>
        </div>
      </div>

      {/* Bottom Timeline Dock (with attached Clip Actions & Zoom Controls) */}
      <TimelinePanel
        ref={timelineRef}
        videoSegments={videoSegments}
        audioSegments={audioSegments}
        audioPeaks={audioPeaks}
        videoDuration={videoDuration}
        audioDuration={audioDuration}
        totalDuration={totalDuration}
        videoTrackEnd={videoSegments[videoSegments.length - 1]?.timelineEnd ?? 0}
        currentTime={currentTime}
        zoom={zoom}
        selection={selection}
        audioSrc={audioSrc}
        canTrimStart={canTrimStart}
        canTrimEnd={canTrimEnd}
        thumbnails={thumbnails}
        onZoomChange={setZoom}
        onTimeChange={(t) => {
          currentTimeRef.current = t;
          setCurrentTime(t);
        }}
        onSelectionChange={setSelection}
        onVideoClipsUpdate={(fn) => setVideoClips(fn)}
        onAudioClipsUpdate={(fn) => setAudioClips(fn)}
        onSplit={splitSelected}
        onTrimStartToPlayhead={trimStartToPlayhead}
        onTrimEndToPlayhead={trimEndToPlayhead}
        onDelete={deleteSelected}
        onUploadAudio={() => audioInputRef.current?.click()}
        onClearAudio={clearAudio}
        onStopPlayback={stopPlayback}
        onDragStart={handleDragSnapshotStart}
        onDragEnd={handleDragSnapshotEnd}
        containerWidth={containerWidth}
        onContainerResize={setContainerWidth}
      />

      {/* Hidden audio element — only render when we have a source */}
      {audioSrc ? (
        <audio
          ref={audioRef}
          src={audioSrc}
          className="hidden"
          onLoadedMetadata={onAudioLoaded}
        />
      ) : null}
    </div>
  );
}
