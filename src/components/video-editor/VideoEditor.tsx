"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TrackType = "video" | "audio";
type FilterPreset = "none" | "grayscale" | "sepia" | "vintage";
type CropPreset = "free" | "16:9" | "1:1" | "9:16";

type Clip = {
  id: number;
  sourceStart: number;
  sourceEnd: number;
  timelineStart: number;
};

type EnrichedClip = Clip & {
  duration: number;
  timelineEnd: number;
};

type Selection = {
  track: TrackType;
  id: number;
} | null;

type TimelineInteraction =
  | { mode: "scrub" }
  | {
      mode: "move";
      track: TrackType;
      id: number;
      offset: number;
    }
  | {
      mode: "trim-start";
      track: TrackType;
      id: number;
    }
  | {
      mode: "trim-end";
      track: TrackType;
      id: number;
    };

const tabs = ["Trim", "Crop", "Audio", "Filters", "Text"];
const MIN_CLIP_DURATION = 0.1;
const TIMELINE_HEIGHT = 176;
const TIMELINE_INSET = 24;
const VIDEO_TRACK_Y = 42;
const AUDIO_TRACK_Y = 104;
const TRACK_HEIGHT = 28;
const HANDLE_WIDTH = 8;
const TRACK_LABEL_WIDTH = 64;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(time: number) {
  if (!Number.isFinite(time)) return "00:00.0";
  const safe = Math.max(time, 0);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const tenths = Math.floor((safe % 1) * 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${tenths}`;
}

function enrichClips(clips: Clip[]) {
  return [...clips]
    .sort((a, b) => a.timelineStart - b.timelineStart)
    .map((clip) => {
      const duration = Math.max(clip.sourceEnd - clip.sourceStart, 0);
      return {
        ...clip,
        duration,
        timelineEnd: clip.timelineStart + duration,
      };
    });
}

function getTimelineMetrics(width: number) {
  const innerStart = TIMELINE_INSET + TRACK_LABEL_WIDTH;
  const innerWidth = Math.max(width - innerStart - TIMELINE_INSET, 1);
  return { innerStart, innerWidth };
}

function getTrackY(track: TrackType) {
  return track === "video" ? VIDEO_TRACK_Y : AUDIO_TRACK_Y;
}

function getClipAtTime(clips: EnrichedClip[], time: number) {
  return clips.find((clip) => time >= clip.timelineStart && time <= clip.timelineEnd) ?? null;
}

function seekMediaToTimelineTime(
  element: HTMLMediaElement | null,
  clips: EnrichedClip[],
  timelineTime: number,
) {
  if (!element || !clips.length) return;
  const clip = getClipAtTime(clips, timelineTime);
  if (!clip) {
    element.pause();
    return;
  }

  const clipTime = clip.sourceStart + (timelineTime - clip.timelineStart);
  if (Math.abs(element.currentTime - clipTime) > 0.12) {
    element.currentTime = clipTime;
  }
}

async function buildAudioPeaks(file: File) {
  try {
    const context = new AudioContext();
    const buffer = await file.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(buffer.slice(0));
    const raw = audioBuffer.getChannelData(0);
    const samples = 240;
    const blockSize = Math.max(1, Math.floor(raw.length / samples));
    const peaks = new Array(samples).fill(0).map((_, index) => {
      let peak = 0;
      const start = index * blockSize;
      const end = Math.min(start + blockSize, raw.length);
      for (let i = start; i < end; i += 1) {
        peak = Math.max(peak, Math.abs(raw[i] ?? 0));
      }
      return peak;
    });
    await context.close();
    return peaks;
  } catch {
    return [];
  }
}

function getClipNeighbors(clips: EnrichedClip[], id: number) {
  const index = clips.findIndex((clip) => clip.id === id);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: clips[index - 1] ?? null,
    next: clips[index + 1] ?? null,
  };
}

export default function VideoEditor() {
  const [videoSrc, setVideoSrc] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [audioPeaks, setAudioPeaks] = useState<number[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTimelineTime, setCurrentTimelineTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("Trim");
  const [videoClips, setVideoClips] = useState<Clip[]>([]);
  const [audioClips, setAudioClips] = useState<Clip[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [timelineShellWidth, setTimelineShellWidth] = useState(960);
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("none");
  const [textOverlay, setTextOverlay] = useState("Sample title");
  const [textSize, setTextSize] = useState(28);
  const [textY, setTextY] = useState(14);
  const [seekInput, setSeekInput] = useState("0");
  const [statusText, setStatusText] = useState("Load a video to begin editing.");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const clipIdRef = useRef(1);
  const interactionRef = useRef<TimelineInteraction | null>(null);
  const rafRef = useRef<number | null>(null);
  const playClockStartRef = useRef(0);
  const playTimelineStartRef = useRef(0);

  const videoSegments = useMemo(() => enrichClips(videoClips), [videoClips]);
  const audioSegments = useMemo(() => enrichClips(audioClips), [audioClips]);
  const selectedClip = useMemo(() => {
    if (!selection) return null;
    const clips = selection.track === "video" ? videoSegments : audioSegments;
    return clips.find((clip) => clip.id === selection.id) ?? null;
  }, [audioSegments, selection, videoSegments]);

  const totalTimelineDuration = useMemo(() => {
    const videoEnd = videoSegments[videoSegments.length - 1]?.timelineEnd ?? 0;
    const audioEnd = audioSegments[audioSegments.length - 1]?.timelineEnd ?? 0;
    return Math.max(videoEnd, audioEnd, videoDuration, audioDuration, 1);
  }, [audioDuration, audioSegments, videoDuration, videoSegments]);

  const timelineWidth = useMemo(
    () => Math.max(timelineShellWidth - 16, totalTimelineDuration * 110 * zoom, 960),
    [timelineShellWidth, totalTimelineDuration, zoom],
  );

  const previewFilter = useMemo(() => {
    const parts = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
    ];
    if (filterPreset === "grayscale") parts.push("grayscale(100%)");
    if (filterPreset === "sepia") parts.push("sepia(100%)");
    if (filterPreset === "vintage") {
      parts.push("sepia(35%)", "contrast(110%)", "saturate(85%)", "hue-rotate(-8deg)");
    }
    return parts.join(" ");
  }, [brightness, contrast, saturation, filterPreset]);

  const previewTransform = useMemo(() => {
    const scaleX = flipHorizontal ? -1 : 1;
    const scaleY = flipVertical ? -1 : 1;
    return `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  }, [flipHorizontal, flipVertical, rotation]);

  const cropBoxClass =
    cropPreset === "16:9"
      ? "aspect-video"
      : cropPreset === "1:1"
        ? "aspect-square"
        : cropPreset === "9:16"
          ? "aspect-[9/16]"
          : "h-full w-full";

  const syncMediaElements = useCallback(
    (timelineTime: number) => {
      seekMediaToTimelineTime(videoRef.current, videoSegments, timelineTime);
      seekMediaToTimelineTime(audioRef.current, audioSegments, timelineTime);
    },
    [audioSegments, videoSegments],
  );

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    videoRef.current?.pause();
    audioRef.current?.pause();
  }, []);

  const updateTrackClips = useCallback(
    (track: TrackType, updater: (clips: Clip[]) => Clip[]) => {
      if (track === "video") {
        setVideoClips((clips) => updater(clips));
      } else {
        setAudioClips((clips) => updater(clips));
      }
    },
    [],
  );

  const getTrackSegments = useCallback(
    (track: TrackType) => (track === "video" ? videoSegments : audioSegments),
    [audioSegments, videoSegments],
  );

  const getPixelsPerSecond = useCallback(
    (width: number) => {
      const { innerWidth } = getTimelineMetrics(width);
      return innerWidth / Math.max(totalTimelineDuration, 0.01);
    },
    [totalTimelineDuration],
  );

  const xToTime = useCallback(
    (x: number, width: number) => {
      const { innerStart, innerWidth } = getTimelineMetrics(width);
      const clampedX = clamp(x, innerStart, innerStart + innerWidth);
      const progress = (clampedX - innerStart) / innerWidth;
      return progress * totalTimelineDuration;
    },
    [totalTimelineDuration],
  );

  const handleVideoFile = useCallback((file: File) => {
    setStatusText(`Loaded ${file.name}`);
    setVideoSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setCurrentTimelineTime(0);
    setSelection(null);
    setIsPlaying(false);
  }, []);

  const handleAudioFile = useCallback(async (file: File) => {
    setStatusText(`Loaded audio track: ${file.name}`);
    setAudioSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setSelection(null);
    const peaks = await buildAudioPeaks(file);
    setAudioPeaks(peaks);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const [first] = Array.from(files);
      if (first.type.startsWith("video/")) {
        handleVideoFile(first);
        return;
      }
      if (first.type.startsWith("audio/")) {
        void handleAudioFile(first);
      }
    },
    [handleAudioFile, handleVideoFile],
  );

  const togglePlayback = useCallback(() => {
    if (!videoSrc && !audioSrc) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    playClockStartRef.current = performance.now();
    playTimelineStartRef.current = currentTimelineTime;
    setIsPlaying(true);
  }, [audioSrc, currentTimelineTime, isPlaying, stopPlayback, videoSrc]);

  const nudgePlayhead = useCallback(
    (delta: number) => {
      stopPlayback();
      setCurrentTimelineTime((time) => clamp(time + delta, 0, totalTimelineDuration));
    },
    [stopPlayback, totalTimelineDuration],
  );

  const nudgeSelectedClip = useCallback(
    (delta: number) => {
      if (!selection) return;
      const clips = getTrackSegments(selection.track);
      const clip = clips.find((item) => item.id === selection.id);
      if (!clip) return;
      const { previous, next } = getClipNeighbors(clips, clip.id);
      const minStart = previous?.timelineEnd ?? 0;
      const maxStart = (next?.timelineStart ?? totalTimelineDuration) - clip.duration;
      updateTrackClips(selection.track, (items) =>
        items.map((item) =>
          item.id === clip.id
            ? { ...item, timelineStart: clamp(item.timelineStart + delta, minStart, maxStart) }
            : item,
        ),
      );
      setStatusText(`Moved ${selection.track} clip by ${delta > 0 ? "+" : ""}${delta.toFixed(1)}s`);
    },
    [getTrackSegments, selection, totalTimelineDuration, updateTrackClips],
  );

  const trimSelectedEdge = useCallback(
    (edge: "start" | "end", delta: number) => {
      if (!selection) return;
      const clips = getTrackSegments(selection.track);
      const clip = clips.find((item) => item.id === selection.id);
      if (!clip) return;
      const { previous, next } = getClipNeighbors(clips, clip.id);

      updateTrackClips(selection.track, (items) =>
        items.map((item) => {
          if (item.id !== clip.id) return item;
          if (edge === "start") {
            const minTimelineStart = previous?.timelineEnd ?? 0;
            const maxTimelineStart =
              item.timelineStart + (item.sourceEnd - item.sourceStart) - MIN_CLIP_DURATION;
            const nextTimelineStart = clamp(
              item.timelineStart + delta,
              minTimelineStart,
              maxTimelineStart,
            );
            const consumed = nextTimelineStart - item.timelineStart;
            return {
              ...item,
              timelineStart: nextTimelineStart,
              sourceStart: item.sourceStart + consumed,
            };
          }

          const minSourceEnd = item.sourceStart + MIN_CLIP_DURATION;
          const maxSourceEnd =
            item.sourceStart +
            ((next?.timelineStart ?? totalTimelineDuration) - item.timelineStart);
          return {
            ...item,
            sourceEnd: clamp(item.sourceEnd + delta, minSourceEnd, maxSourceEnd),
          };
        }),
      );
    },
    [getTrackSegments, selection, totalTimelineDuration, updateTrackClips],
  );

  const splitSelectedClip = useCallback(() => {
    if (!selection) return;
    const clips = getTrackSegments(selection.track);
    const clip = clips.find((item) => item.id === selection.id);
    if (!clip) return;
    if (
      currentTimelineTime <= clip.timelineStart + MIN_CLIP_DURATION ||
      currentTimelineTime >= clip.timelineEnd - MIN_CLIP_DURATION
    ) {
      return;
    }

    const splitSource = clip.sourceStart + (currentTimelineTime - clip.timelineStart);
    const newClip: Clip = {
      id: clipIdRef.current++,
      sourceStart: splitSource,
      sourceEnd: clip.sourceEnd,
      timelineStart: currentTimelineTime,
    };

    updateTrackClips(selection.track, (items) =>
      items.flatMap((item) =>
        item.id !== clip.id
          ? [item]
          : [{ ...item, sourceEnd: splitSource }, newClip],
      ),
    );
    setSelection({ track: selection.track, id: newClip.id });
    setStatusText(`Split ${selection.track} clip at ${formatTime(currentTimelineTime)}`);
  }, [currentTimelineTime, getTrackSegments, selection, updateTrackClips]);

  const deleteSelectedClip = useCallback(() => {
    if (!selection) return;
    updateTrackClips(selection.track, (items) =>
      items.filter((item) => item.id !== selection.id),
    );
    setSelection(null);
    setStatusText(`Deleted ${selection.track} clip`);
  }, [selection, updateTrackClips]);

  const clearAudioLayer = useCallback(() => {
    stopPlayback();
    setAudioDuration(0);
    setAudioClips([]);
    setAudioPeaks([]);
    setSelection((current) => (current?.track === "audio" ? null : current));
    setAudioSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return "";
    });
    setStatusText("Removed audio layer");
  }, [stopPlayback]);

  const drawTimeline = useCallback(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const width = timelineWidth;
    const height = TIMELINE_HEIGHT;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const { innerStart, innerWidth } = getTimelineMetrics(width);
    const pixelsPerSecond = innerWidth / Math.max(totalTimelineDuration, 0.01);

    context.fillStyle = "rgba(10, 16, 46, 0.04)";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#596a89";
    context.font = "900 11px sans-serif";
    context.fillText("VIDEO", TIMELINE_INSET, VIDEO_TRACK_Y + 18);
    context.fillText("AUDIO", TIMELINE_INSET, AUDIO_TRACK_Y + 18);

    context.strokeStyle = "rgba(10, 16, 46, 0.12)";
    context.lineWidth = 1;
    for (let second = 0; second <= totalTimelineDuration; second += 1) {
      const x = innerStart + second * pixelsPerSecond;
      context.beginPath();
      context.moveTo(x, 16);
      context.lineTo(x, height - 20);
      context.stroke();
      context.fillStyle = "#7d8ba7";
      context.fillText(`${second}s`, x + 4, 12);
    }

    const drawTrack = (track: TrackType, clips: EnrichedClip[]) => {
      const y = getTrackY(track);
      context.fillStyle = "rgba(10, 16, 46, 0.08)";
      context.fillRect(innerStart, y, innerWidth, TRACK_HEIGHT);

      clips.forEach((clip) => {
        const x = innerStart + clip.timelineStart * pixelsPerSecond;
        const clipWidth = Math.max(clip.duration * pixelsPerSecond, HANDLE_WIDTH * 2 + 8);
        const selected = selection?.track === track && selection.id === clip.id;

        context.fillStyle = track === "video" ? "#fff400" : "#b8ffcf";
        context.strokeStyle = selected ? "#0a102e" : "rgba(10, 16, 46, 0.55)";
        context.lineWidth = selected ? 3 : 2;
        context.beginPath();
        context.rect(x, y, clipWidth, TRACK_HEIGHT);
        context.fill();
        context.stroke();

        context.fillStyle = "rgba(10, 16, 46, 0.22)";
        context.fillRect(x, y, HANDLE_WIDTH, TRACK_HEIGHT);
        context.fillRect(x + clipWidth - HANDLE_WIDTH, y, HANDLE_WIDTH, TRACK_HEIGHT);

        if (track === "audio" && audioPeaks.length) {
          context.strokeStyle = "#0a102e";
          context.lineWidth = 1.25;
          context.beginPath();
          const midY = y + TRACK_HEIGHT / 2;
          audioPeaks.forEach((peak, index) => {
            const waveX = x + (index / Math.max(audioPeaks.length - 1, 1)) * clipWidth;
            const amplitude = peak * (TRACK_HEIGHT / 2 - 4);
            context.moveTo(waveX, midY - amplitude);
            context.lineTo(waveX, midY + amplitude);
          });
          context.stroke();
        }

        context.fillStyle = "#0a102e";
        context.font = "700 11px sans-serif";
        context.fillText(`${track === "video" ? "Clip" : "Audio"} ${clip.id}`, x + 10, y + 18);
      });
    };

    drawTrack("video", videoSegments);
    drawTrack("audio", audioSegments);

    const playheadX = innerStart + currentTimelineTime * pixelsPerSecond;
    context.strokeStyle = "#0a102e";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(playheadX, 18);
    context.lineTo(playheadX, height - 12);
    context.stroke();

    context.fillStyle = "#0a102e";
    context.beginPath();
    context.arc(playheadX, 18, 5, 0, Math.PI * 2);
    context.fill();
  }, [
    audioPeaks,
    audioSegments,
    currentTimelineTime,
    selection,
    timelineWidth,
    totalTimelineDuration,
    videoSegments,
  ]);

  const getCanvasPointerData = useCallback(
    (event: PointerEvent | React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = timelineCanvasRef.current;
      if (!canvas) return null;
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const width = canvas.clientWidth;
      const time = xToTime(x, width);
      return { x, y, time, width };
    },
    [xToTime],
  );

  const findHitClip = useCallback(
    (track: TrackType, x: number, y: number, width: number) => {
      const clips = track === "video" ? videoSegments : audioSegments;
      const trackY = getTrackY(track);
      if (y < trackY || y > trackY + TRACK_HEIGHT) return null;
      const { innerStart } = getTimelineMetrics(width);
      const pixelsPerSecond = getPixelsPerSecond(width);

      for (const clip of clips) {
        const clipX = innerStart + clip.timelineStart * pixelsPerSecond;
        const clipWidth = Math.max(clip.duration * pixelsPerSecond, HANDLE_WIDTH * 2 + 8);
        if (x < clipX || x > clipX + clipWidth) continue;
        if (x <= clipX + HANDLE_WIDTH) return { clip, hit: "trim-start" as const };
        if (x >= clipX + clipWidth - HANDLE_WIDTH) return { clip, hit: "trim-end" as const };
        return { clip, hit: "move" as const };
      }

      return null;
    },
    [audioSegments, getPixelsPerSecond, videoSegments],
  );

  const handleTimelinePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const pointer = getCanvasPointerData(event);
      if (!pointer) return;

      const track =
        pointer.y >= AUDIO_TRACK_Y && pointer.y <= AUDIO_TRACK_Y + TRACK_HEIGHT
          ? "audio"
          : pointer.y >= VIDEO_TRACK_Y && pointer.y <= VIDEO_TRACK_Y + TRACK_HEIGHT
            ? "video"
            : null;

      if (track) {
        const hit = findHitClip(track, pointer.x, pointer.y, pointer.width);
        if (hit) {
          setSelection({ track, id: hit.clip.id });
          interactionRef.current =
            hit.hit === "move"
              ? {
                  mode: "move",
                  track,
                  id: hit.clip.id,
                  offset: pointer.time - hit.clip.timelineStart,
                }
              : hit.hit === "trim-start"
                ? { mode: "trim-start", track, id: hit.clip.id }
                : { mode: "trim-end", track, id: hit.clip.id };
          return;
        }
      }

      interactionRef.current = { mode: "scrub" };
      stopPlayback();
      setCurrentTimelineTime(pointer.time);
    },
    [findHitClip, getCanvasPointerData, stopPlayback],
  );

  const handleGlobalPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!interactionRef.current) return;
      const pointer = getCanvasPointerData(event);
      if (!pointer) return;

      if (interactionRef.current.mode === "scrub") {
        setCurrentTimelineTime(pointer.time);
        return;
      }

      const interaction = interactionRef.current;
      const clips = getTrackSegments(interaction.track);
      const clip = clips.find((item) => item.id === interaction.id);
      if (!clip) return;
      const { previous, next } = getClipNeighbors(clips, clip.id);

      if (interaction.mode === "move") {
        const nextStart = pointer.time - interaction.offset;
        const minStart = previous?.timelineEnd ?? 0;
        const maxStart = (next?.timelineStart ?? totalTimelineDuration) - clip.duration;
        const timelineStart = clamp(nextStart, minStart, maxStart);
        updateTrackClips(interaction.track, (items) =>
          items.map((item) =>
            item.id === interaction.id ? { ...item, timelineStart } : item,
          ),
        );
        return;
      }

      if (interaction.mode === "trim-start") {
        const minTimelineStart = previous?.timelineEnd ?? 0;
        const maxTimelineStart = clip.timelineEnd - MIN_CLIP_DURATION;
        const timelineStart = clamp(pointer.time, minTimelineStart, maxTimelineStart);
        const delta = timelineStart - clip.timelineStart;
        updateTrackClips(interaction.track, (items) =>
          items.map((item) =>
            item.id === interaction.id
              ? {
                  ...item,
                  timelineStart,
                  sourceStart: item.sourceStart + delta,
                }
              : item,
          ),
        );
        setCurrentTimelineTime(timelineStart);
        return;
      }

      const maxTimelineEnd = next?.timelineStart ?? totalTimelineDuration;
      const nextDuration = clamp(
        pointer.time - clip.timelineStart,
        MIN_CLIP_DURATION,
        maxTimelineEnd - clip.timelineStart,
      );
      updateTrackClips(interaction.track, (items) =>
        items.map((item) =>
          item.id === interaction.id
            ? {
                ...item,
                sourceEnd: item.sourceStart + nextDuration,
              }
            : item,
        ),
      );
      setCurrentTimelineTime(clip.timelineStart + nextDuration);
    },
    [getCanvasPointerData, getTrackSegments, totalTimelineDuration, updateTrackClips],
  );

  const handleGlobalPointerUp = useCallback(() => {
    if (!interactionRef.current) return;
    interactionRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  useEffect(() => {
    const shell = timelineShellRef.current;
    if (!shell) return;
    const resize = () => setTimelineShellWidth(shell.clientWidth);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  useEffect(() => {
    if (!isPlaying) {
      syncMediaElements(currentTimelineTime);
      return;
    }

    const tick = (now: number) => {
      const elapsed = (now - playClockStartRef.current) / 1000;
      const nextTime = playTimelineStartRef.current + elapsed * playbackRate;
      if (nextTime >= totalTimelineDuration) {
        setCurrentTimelineTime(totalTimelineDuration);
        stopPlayback();
        return;
      }
      setCurrentTimelineTime(nextTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    syncMediaElements(currentTimelineTime);
    if (getClipAtTime(videoSegments, currentTimelineTime)) {
      void videoRef.current?.play().catch(() => undefined);
    } else {
      videoRef.current?.pause();
    }

    if (getClipAtTime(audioSegments, currentTimelineTime) && !muted) {
      void audioRef.current?.play().catch(() => undefined);
    } else {
      audioRef.current?.pause();
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    audioSegments,
    currentTimelineTime,
    isPlaying,
    muted,
    playbackRate,
    stopPlayback,
    syncMediaElements,
    totalTimelineDuration,
    videoSegments,
  ]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [muted, playbackRate, volume]);

  useEffect(() => {
    setSeekInput(currentTimelineTime.toFixed(1));
  }, [currentTimelineTime]);

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [audioSrc, videoSrc]);

  const selectedTrackLabel = selection ? `${selection.track} clip ${selection.id}` : "none";
  const dropzone = (
    <div
      className={`neo-panel flex min-h-[420px] flex-col items-center justify-center bg-[var(--bg-panel)] px-8 py-12 text-center transition ${
        isDragOver ? "translate-x-[2px] translate-y-[2px] shadow-none" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--border-main)] bg-[var(--bg-base)] text-4xl shadow-[4px_4px_0_0_var(--border-main)]">
        {"\u21E7"}
      </div>
      <h2 className="mt-8 text-4xl font-black uppercase tracking-[-0.05em] text-[var(--text-main)]">
        Select a Video to Begin
      </h2>
      <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--text-soft)]">
        Supported formats: MP4, WEBM, MOV
      </p>
      <button
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className="neo-button mt-10 bg-[var(--accent)] px-8 py-5 text-xl font-black uppercase tracking-[0.08em] text-[var(--text-main)]"
      >
        Choose Video File
      </button>
      <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-[var(--text-soft)]/70">
        Or drag and drop here
      </p>
    </div>
  );

  return (
    <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleAudioFile(file);
        }}
      />

      <div className="space-y-6">
        {!videoSrc ? (
          dropzone
        ) : (
          <>
            <div className="neo-panel bg-[var(--bg-panel)] p-5">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-4">
                  <div className={`neo-panel bg-[#0a102e] p-3 ${cropBoxClass}`}>
                    <div className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        className="h-full w-full object-contain"
                        style={{ filter: previewFilter, transform: previewTransform }}
                        controls={false}
                        playsInline
                        onLoadedMetadata={(event) => {
                          const duration = Number.isFinite(event.currentTarget.duration)
                            ? event.currentTarget.duration
                            : 0;
                          setVideoDuration(duration);
                          const id = clipIdRef.current++;
                          setVideoClips([{ id, sourceStart: 0, sourceEnd: duration, timelineStart: 0 }]);
                          setSelection({ track: "video", id });
                          setStatusText(`Video ready: ${formatTime(duration)}`);
                        }}
                      />

                      {textOverlay ? (
                        <div
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 px-4 py-2 text-center font-black uppercase tracking-[0.06em] text-white"
                          style={{
                            top: `${textY}%`,
                            fontSize: `${textSize}px`,
                            textShadow: "0 2px 0 rgba(0,0,0,0.55)",
                          }}
                        >
                          {textOverlay}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="neo-button bg-[var(--bg-dark)] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white"
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgePlayhead(-1)}
                      className="neo-button bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.16em]"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgePlayhead(-0.1)}
                      className="neo-button bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.16em]"
                    >
                      -0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgePlayhead(0.1)}
                      className="neo-button bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.16em]"
                    >
                      +0.1s
                    </button>
                  </div>
                </div>

                <div className="neo-panel bg-[var(--bg-base)] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                    Workspace Status
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-soft)]">
                    <p>{statusText}</p>
                    <p>
                      Current time:{" "}
                      <span className="font-black text-[var(--text-main)]">
                        {formatTime(currentTimelineTime)}
                      </span>
                    </p>
                    <p>
                      Selection:{" "}
                      <span className="font-black text-[var(--text-main)]">
                        {selectedTrackLabel}
                      </span>
                    </p>
                    <p>
                      Duration:{" "}
                      <span className="font-black text-[var(--text-main)]">
                        {formatTime(totalTimelineDuration)}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      Seek to time
                    </label>
                    <input
                      value={seekInput}
                      onChange={(event) => setSeekInput(event.target.value)}
                      className="w-full border-4 border-[var(--border-main)] bg-white px-3 py-3 text-base font-bold outline-none dark:bg-[var(--bg-panel)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextTime = Number.parseFloat(seekInput);
                        if (!Number.isFinite(nextTime)) return;
                        stopPlayback();
                        setCurrentTimelineTime(clamp(nextTime, 0, totalTimelineDuration));
                      }}
                      className="neo-button w-full bg-[var(--accent)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em]"
                    >
                      Jump
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      Zoom
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.25"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                      {zoom.toFixed(2)}x timeline zoom
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="neo-button w-full bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em]"
                    >
                      Replace Video
                    </button>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="neo-button w-full bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em]"
                    >
                      {audioSrc ? "Replace Audio Layer" : "Add Audio Layer"}
                    </button>
                    {audioSrc ? (
                      <button
                        type="button"
                        onClick={clearAudioLayer}
                        className="neo-button w-full bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                      >
                        Remove Audio Layer
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="neo-panel bg-[var(--bg-panel)] p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                      activeTab === tab ? "bg-[var(--accent)]" : "bg-[var(--bg-base)]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div
                ref={timelineShellRef}
                className="overflow-x-auto border-4 border-[var(--border-main)] bg-white dark:bg-[var(--bg-base)]"
              >
                <canvas
                  ref={timelineCanvasRef}
                  onPointerDown={handleTimelinePointerDown}
                  className="block cursor-pointer"
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      onClick={splitSelectedClip}
                      disabled={!selection}
                      className="neo-button bg-[var(--accent)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Split Selected
                    </button>
                    <button
                      type="button"
                      onClick={deleteSelectedClip}
                      disabled={!selection}
                      className="neo-button bg-[var(--bg-dark)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeSelectedClip(-0.25)}
                      disabled={!selection}
                      className="neo-button bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move Left
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeSelectedClip(0.25)}
                      disabled={!selection}
                      className="neo-button bg-[var(--bg-base)] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move Right
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => trimSelectedEdge("start", -0.1)}
                      disabled={!selection}
                      className="neo-button bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--bg-base)]"
                    >
                      Extend Start
                    </button>
                    <button
                      type="button"
                      onClick={() => trimSelectedEdge("start", 0.1)}
                      disabled={!selection}
                      className="neo-button bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--bg-base)]"
                    >
                      Trim Start
                    </button>
                    <button
                      type="button"
                      onClick={() => trimSelectedEdge("end", -0.1)}
                      disabled={!selection}
                      className="neo-button bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--bg-base)]"
                    >
                      Trim End
                    </button>
                    <button
                      type="button"
                      onClick={() => trimSelectedEdge("end", 0.1)}
                      disabled={!selection}
                      className="neo-button bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--bg-base)]"
                    >
                      Extend End
                    </button>
                  </div>

                  <div className="rounded border-4 border-dashed border-[var(--border-main)]/20 bg-[var(--bg-base)]/60 px-4 py-4 text-sm leading-7 text-[var(--text-soft)]">
                    {selectedClip ? (
                      <>
                        <p>
                          Selected {selection?.track} clip from{" "}
                          <span className="font-black text-[var(--text-main)]">
                            {formatTime(selectedClip.timelineStart)}
                          </span>{" "}
                          to{" "}
                          <span className="font-black text-[var(--text-main)]">
                            {formatTime(selectedClip.timelineEnd)}
                          </span>
                        </p>
                        <p>
                          Source span:{" "}
                          <span className="font-black text-[var(--text-main)]">
                            {formatTime(selectedClip.sourceStart)}
                          </span>{" "}
                          to{" "}
                          <span className="font-black text-[var(--text-main)]">
                            {formatTime(selectedClip.sourceEnd)}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p>
                        Select a video or audio clip on the timeline to trim, move, split,
                        or delete it. Audio and video are handled as separate editable layers.
                      </p>
                    )}
                  </div>
                </div>

                <div className="neo-panel bg-[var(--bg-base)] p-4">
                  {activeTab === "Trim" ? (
                    <div className="space-y-3 text-sm leading-7 text-[var(--text-soft)]">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)]">
                        Segment Editing
                      </p>
                      <p>
                        Drag clip bodies to move them on the timeline. Drag either edge to trim.
                        Video and audio clips can be selected and edited independently.
                      </p>
                    </div>
                  ) : null}

                  {activeTab === "Crop" ? (
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)]">
                        Preview Framing
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["free", "16:9", "1:1", "9:16"] as CropPreset[]).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCropPreset(preset)}
                            className={`neo-button px-3 py-3 text-xs font-black uppercase tracking-[0.18em] ${
                              cropPreset === preset ? "bg-[var(--accent)]" : "bg-white dark:bg-[var(--bg-panel)]"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRotation((value) => value - 90)}
                          className="neo-button bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                        >
                          Rotate -90°
                        </button>
                        <button
                          type="button"
                          onClick={() => setRotation((value) => value + 90)}
                          className="neo-button bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                        >
                          Rotate +90°
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlipHorizontal((value) => !value)}
                          className="neo-button bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                        >
                          Flip X
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlipVertical((value) => !value)}
                          className="neo-button bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                        >
                          Flip Y
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === "Audio" ? (
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)]">
                        Audio Layer
                      </p>
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="neo-button w-full bg-[var(--accent)] px-3 py-3 text-xs font-black uppercase tracking-[0.18em]"
                      >
                        {audioSrc ? "Replace Audio" : "Upload Audio"}
                      </button>
                      {audioSrc ? (
                        <button
                          type="button"
                          onClick={clearAudioLayer}
                          className="neo-button w-full bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                        >
                          Remove Audio
                        </button>
                      ) : null}
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Playback speed: {playbackRate.toFixed(2)}x
                      </label>
                      <input
                        type="range"
                        min="0.25"
                        max="2"
                        step="0.05"
                        value={playbackRate}
                        onChange={(event) => setPlaybackRate(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Volume: {Math.round(volume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => setMuted((value) => !value)}
                        className="neo-button w-full bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.18em] dark:bg-[var(--bg-panel)]"
                      >
                        {muted ? "Unmute" : "Mute"}
                      </button>
                    </div>
                  ) : null}

                  {activeTab === "Filters" ? (
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)]">
                        Filters
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["none", "grayscale", "sepia", "vintage"] as FilterPreset[]).map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setFilterPreset(preset)}
                              className={`neo-button px-3 py-3 text-xs font-black uppercase tracking-[0.18em] ${
                                filterPreset === preset ? "bg-[var(--accent)]" : "bg-white dark:bg-[var(--bg-panel)]"
                              }`}
                            >
                              {preset}
                            </button>
                          ),
                        )}
                      </div>
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Brightness
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="1"
                        value={brightness}
                        onChange={(event) => setBrightness(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Contrast
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="1"
                        value={contrast}
                        onChange={(event) => setContrast(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Saturation
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={saturation}
                        onChange={(event) => setSaturation(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                    </div>
                  ) : null}

                  {activeTab === "Text" ? (
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)]">
                        Text Overlay
                      </p>
                      <textarea
                        value={textOverlay}
                        onChange={(event) => setTextOverlay(event.target.value)}
                        rows={3}
                        className="w-full border-4 border-[var(--border-main)] bg-white px-3 py-3 text-sm font-bold outline-none dark:bg-[var(--bg-panel)]"
                      />
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Size
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="64"
                        step="1"
                        value={textSize}
                        onChange={(event) => setTextSize(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
                        Vertical position
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="1"
                        value={textY}
                        onChange={(event) => setTextY(Number(event.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}

        <audio ref={audioRef} src={audioSrc} className="hidden" />
      </div>
    </section>
  );
}
