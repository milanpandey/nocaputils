"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

type Segment = {
  id: number;
  sourceStart: number;
  sourceEnd: number;
};

type FilterPreset = "none" | "grayscale" | "sepia" | "vintage";
type CropPreset = "free" | "16:9" | "1:1" | "9:16";
type TimelineInteraction =
  | { mode: "scrub"; segmentId: number | null }
  | { mode: "trim-start"; segmentId: number }
  | { mode: "trim-end"; segmentId: number };

const tabs = ["Trim", "Crop", "Audio", "Filters", "Text"];
const MIN_SEGMENT_DURATION = 0.1;
const TIMELINE_HEIGHT = 120;
const TIMELINE_INSET = 24;
const TRACK_Y = 40;
const TRACK_HEIGHT = 28;
const HANDLE_WIDTH = 8;

function formatTime(time: number) {
  if (!Number.isFinite(time)) return "00:00.0";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const tenths = Math.floor((time % 1) * 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${tenths}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function VideoEditor() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [sourceDuration, setSourceDuration] = useState(0);
  const [currentTimelineTime, setCurrentTimelineTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("Trim");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
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
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const segmentIdRef = useRef(1);
  const interactionRef = useRef<TimelineInteraction | null>(null);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) {
        messageRef.current.textContent = message;
      }
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
        messageRef.current.textContent =
          "Error loading FFmpeg. Ensure SharedArrayBuffer is enabled.";
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = timelineShellRef.current?.clientWidth ?? 960;
      setTimelineShellWidth(width);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const width = timelineShellRef.current?.clientWidth ?? 960;
    setTimelineShellWidth(width);
  }, [loaded, videoFile]);

  const timelineSegments = useMemo(() => {
    return segments.reduce<
      Array<Segment & { duration: number; timelineStart: number; timelineEnd: number }>
    >((items, segment) => {
      const duration = Math.max(segment.sourceEnd - segment.sourceStart, 0);
      const previousEnd = items[items.length - 1]?.timelineEnd ?? 0;
      return [
        ...items,
        {
          ...segment,
          duration,
          timelineStart: previousEnd,
          timelineEnd: previousEnd + duration,
        },
      ];
    }, []);
  }, [segments]);

  const totalTimelineDuration = useMemo(
    () =>
      timelineSegments.reduce((sum, segment) => sum + Math.max(segment.duration, 0), 0),
    [timelineSegments],
  );

  const selectedSegment =
    timelineSegments.find((segment) => segment.id === selectedSegmentId) ?? null;

  const timelineWidth = useMemo(() => {
    return Math.max(timelineShellWidth - 16, totalTimelineDuration * 100 * zoom, 960);
  }, [timelineShellWidth, totalTimelineDuration, zoom]);

  const cropBoxClass =
    cropPreset === "16:9"
      ? "aspect-video"
      : cropPreset === "1:1"
        ? "aspect-square"
        : cropPreset === "9:16"
          ? "aspect-[9/16]"
          : "h-full w-full";

  const previewFilter = useMemo(() => {
    const filterParts = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
    ];
    if (filterPreset === "grayscale") filterParts.push("grayscale(100%)");
    if (filterPreset === "sepia") filterParts.push("sepia(100%)");
    if (filterPreset === "vintage") {
      filterParts.push("sepia(35%)", "contrast(110%)", "saturate(85%)", "hue-rotate(-8deg)");
    }
    return filterParts.join(" ");
  }, [brightness, contrast, saturation, filterPreset]);

  const previewTransform = useMemo(() => {
    const scaleX = flipHorizontal ? -1 : 1;
    const scaleY = flipVertical ? -1 : 1;
    return `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  }, [flipHorizontal, flipVertical, rotation]);

  const setPreviewFile = (file: File | null) => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    if (!file) {
      setVideoFile(null);
      setVideoSrc("");
      setSourceDuration(0);
      setCurrentTimelineTime(0);
      setSegments([]);
      setSelectedSegmentId(null);
      setIsPlaying(false);
      return;
    }
    // @ts-expect-error navigator.deviceMemory is not in the TS DOM lib yet.
    const deviceMemory = navigator.deviceMemory || 4;
    const maxSizeBytes = (deviceMemory * 1024 * 1024 * 1024) / 4;
    if (file.size > maxSizeBytes) {
      alert(
        `File is too large. Your device has roughly ${deviceMemory}GB of RAM. Please select a video smaller than ${(
          maxSizeBytes /
          (1024 * 1024)
        ).toFixed(0)}MB.`,
      );
      return;
    }
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
    setCurrentTimelineTime(0);
    setSourceDuration(0);
    setSegments([]);
    setSelectedSegmentId(null);
    setIsPlaying(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPreviewFile(file);
    event.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    setSeekInput(currentTimelineTime.toFixed(2));
  }, [currentTimelineTime]);

  const clearVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setPreviewFile(null);
  };

  const togglePlayback = async () => {
    if (!videoRef.current || !timelineSegments.length) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const syncToTimelineTime = useCallback((time: number) => {
    if (!videoRef.current || !timelineSegments.length) return;
    const safeTime = clamp(time, 0, totalTimelineDuration || 0);
    const segment =
      timelineSegments.find(
        (item) =>
          safeTime >= item.timelineStart &&
          safeTime <= item.timelineEnd + Number.EPSILON,
      ) ?? timelineSegments[timelineSegments.length - 1];
    const offsetInsideSegment = clamp(
      safeTime - segment.timelineStart,
      0,
      segment.duration,
    );
    const sourceTime = clamp(
      segment.sourceStart + offsetInsideSegment,
      segment.sourceStart,
      segment.sourceEnd,
    );
    videoRef.current.currentTime = sourceTime;
    setCurrentTimelineTime(safeTime);
    setSelectedSegmentId(segment.id);
  }, [timelineSegments, totalTimelineDuration]);

  const updateSelectedSegment = useCallback((nextStart: number, nextEnd: number) => {
    if (!selectedSegment) return;
    const safeStart = clamp(nextStart, 0, Math.max(sourceDuration - MIN_SEGMENT_DURATION, 0));
    const safeEnd = clamp(
      nextEnd,
      safeStart + MIN_SEGMENT_DURATION,
      Math.max(sourceDuration, MIN_SEGMENT_DURATION),
    );
    setSegments((current) =>
      current.map((segment) =>
        segment.id === selectedSegment.id
          ? { ...segment, sourceStart: safeStart, sourceEnd: safeEnd }
          : segment,
        ),
    );
  }, [selectedSegment, sourceDuration]);

  const getTimelineMetrics = useCallback((canvasWidth: number) => {
    const innerStart = TIMELINE_INSET;
    const innerWidth = Math.max(canvasWidth - innerStart * 2, 1);
    return { innerStart, innerWidth };
  }, []);

  const timelineTimeFromClientX = useCallback((clientX: number) => {
    const canvas = timelineCanvasRef.current;
    if (!canvas || totalTimelineDuration <= 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const { innerStart, innerWidth } = getTimelineMetrics(rect.width);
    const x = clamp(clientX - rect.left, innerStart, innerStart + innerWidth);
    const ratio = (x - innerStart) / innerWidth;
    return ratio * totalTimelineDuration;
  }, [getTimelineMetrics, totalTimelineDuration]);

  const seekFromClientX = useCallback((clientX: number) => {
    syncToTimelineTime(timelineTimeFromClientX(clientX));
  }, [syncToTimelineTime, timelineTimeFromClientX]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;

      if (interaction.mode === "scrub") {
        seekFromClientX(event.clientX);
        return;
      }

      const activeSegment = timelineSegments.find(
        (segment) => segment.id === interaction.segmentId,
      );
      if (!activeSegment) return;

      const nextTime = timelineTimeFromClientX(event.clientX);
      const offsetInsideSegment = clamp(
        nextTime - activeSegment.timelineStart,
        0,
        activeSegment.duration,
      );

      if (interaction.mode === "trim-start") {
        updateSelectedSegment(
          clamp(
            activeSegment.sourceStart + offsetInsideSegment,
            0,
            activeSegment.sourceEnd - MIN_SEGMENT_DURATION,
          ),
          activeSegment.sourceEnd,
        );
      } else {
        updateSelectedSegment(
          activeSegment.sourceStart,
          clamp(
            activeSegment.sourceStart + offsetInsideSegment,
            activeSegment.sourceStart + MIN_SEGMENT_DURATION,
            sourceDuration,
          ),
        );
      }
    };

    const handleUp = () => {
      interactionRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [
    isDragging,
    seekFromClientX,
    sourceDuration,
    timelineSegments,
    timelineTimeFromClientX,
    totalTimelineDuration,
    updateSelectedSegment,
  ]);

  const handleTimelinePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = timelineCanvasRef.current;
    if (!canvas || totalTimelineDuration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const { innerStart, innerWidth } = getTimelineMetrics(rect.width);

    let nextInteraction: TimelineInteraction = { mode: "scrub", segmentId: null };

    if (y >= TRACK_Y && y <= TRACK_Y + TRACK_HEIGHT) {
      const hitSegment = timelineSegments.find((segment) => {
        const startX = innerStart + (segment.timelineStart / totalTimelineDuration) * innerWidth;
        const width = Math.max(8, (segment.duration / totalTimelineDuration) * innerWidth);
        return x >= startX && x <= startX + width;
      });

      if (hitSegment) {
        const startX =
          innerStart + (hitSegment.timelineStart / totalTimelineDuration) * innerWidth;
        const width = Math.max(8, (hitSegment.duration / totalTimelineDuration) * innerWidth);
        const distanceToStart = Math.abs(x - startX);
        const distanceToEnd = Math.abs(x - (startX + width));
        setSelectedSegmentId(hitSegment.id);

        if (distanceToStart <= HANDLE_WIDTH) {
          nextInteraction = { mode: "trim-start", segmentId: hitSegment.id };
        } else if (distanceToEnd <= HANDLE_WIDTH) {
          nextInteraction = { mode: "trim-end", segmentId: hitSegment.id };
        } else {
          nextInteraction = { mode: "scrub", segmentId: hitSegment.id };
        }
      }
    }

    interactionRef.current = nextInteraction;
    setIsDragging(true);
    seekFromClientX(event.clientX);
  };

  const handleMetadataLoaded = () => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 0;
    setSourceDuration(duration);
    const initialSegment = {
      id: segmentIdRef.current,
      sourceStart: 0,
      sourceEnd: duration,
    };
    segmentIdRef.current += 1;
    setSegments([initialSegment]);
    setSelectedSegmentId(initialSegment.id);
    setCurrentTimelineTime(0);
  };

  useEffect(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;

    const dpi = window.devicePixelRatio || 1;
    const width = timelineWidth;
    const { innerStart, innerWidth } = getTimelineMetrics(width);
    canvas.width = width * dpi;
    canvas.height = TIMELINE_HEIGHT * dpi;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${TIMELINE_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
    ctx.clearRect(0, 0, width, TIMELINE_HEIGHT);
    ctx.fillStyle = "#d9d4c9";
    ctx.fillRect(0, 0, width, TIMELINE_HEIGHT);
    ctx.fillStyle = "#111827";
    ctx.fillRect(innerStart, 36, innerWidth, 36);

    if (totalTimelineDuration > 0) {
      const seconds = Math.max(Math.ceil(totalTimelineDuration), 1);
      const pxPerSecond = innerWidth / totalTimelineDuration;

      for (let second = 0; second <= seconds; second += 1) {
        const x = Math.min(width - innerStart, innerStart + second * pxPerSecond);
        const isMajor = second % 5 === 0;
        ctx.strokeStyle = isMajor ? "#111111" : "rgba(17,17,17,0.35)";
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, isMajor ? 10 : 18);
        ctx.lineTo(x, 36);
        ctx.stroke();

        if (isMajor && second < totalTimelineDuration) {
          ctx.fillStyle = "#111111";
          ctx.font = "700 10px sans-serif";
          ctx.fillText(formatTime(second), x + 4, 14);
        }
      }

      timelineSegments.forEach((segment) => {
        const segmentX = innerStart + (segment.timelineStart / totalTimelineDuration) * innerWidth;
        const segmentWidth = Math.max(
          8,
          (segment.duration / totalTimelineDuration) * innerWidth,
        );
        const active = segment.id === selectedSegmentId;

        ctx.fillStyle = active ? "#f2ef13" : "#94a3b8";
        ctx.fillRect(segmentX, 40, segmentWidth, 28);
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 2;
        ctx.strokeRect(segmentX, 40, segmentWidth, 28);
        ctx.fillStyle = "#111111";
        ctx.fillRect(segmentX, 40, 4, 28);
        ctx.fillRect(segmentX + segmentWidth - 4, 40, 4, 28);

        if (active) {
          ctx.fillStyle = "#111111";
          ctx.font = "700 10px sans-serif";
          ctx.fillText(
            `${formatTime(segment.sourceStart)} - ${formatTime(segment.sourceEnd)}`,
            segmentX + 8,
            58,
          );
        }
      });

      const playheadX = innerStart + (currentTimelineTime / totalTimelineDuration) * innerWidth;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playheadX, 18);
      ctx.lineTo(playheadX, 94);
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(playheadX, 18, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(17,17,17,0.55)";
      ctx.font = "700 12px sans-serif";
      ctx.fillText("Upload a video to generate the timeline", 24, 62);
    }
  }, [
    currentTimelineTime,
    getTimelineMetrics,
    selectedSegmentId,
    timelineSegments,
    timelineWidth,
    totalTimelineDuration,
  ]);

  useEffect(() => {
    if (!videoRef.current || !timelineSegments.length || isDragging) return;

    const video = videoRef.current;
    const handleTimeUpdate = () => {
      const currentSegment =
        timelineSegments.find(
          (segment) =>
            video.currentTime >= segment.sourceStart - 0.001 &&
            video.currentTime <= segment.sourceEnd + 0.001,
        ) ?? timelineSegments[0];

      if (video.currentTime > currentSegment.sourceEnd - 0.02) {
        const segmentIndex = timelineSegments.findIndex(
          (segment) => segment.id === currentSegment.id,
        );
        const nextSegment = timelineSegments[segmentIndex + 1];

        if (nextSegment) {
          video.currentTime = nextSegment.sourceStart;
          setSelectedSegmentId(nextSegment.id);
          setCurrentTimelineTime(nextSegment.timelineStart);
          return;
        }

        video.pause();
        setIsPlaying(false);
        setCurrentTimelineTime(totalTimelineDuration);
        return;
      }

      const nextTimelineTime =
        currentSegment.timelineStart + (video.currentTime - currentSegment.sourceStart);
      setCurrentTimelineTime(nextTimelineTime);
      setSelectedSegmentId(currentSegment.id);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [isDragging, timelineSegments, totalTimelineDuration]);

  const splitAtPlayhead = () => {
    const segment = selectedSegment;
    if (!segment) return;
    const splitPoint = clamp(
      segment.sourceStart + (currentTimelineTime - segment.timelineStart),
      segment.sourceStart + MIN_SEGMENT_DURATION,
      segment.sourceEnd - MIN_SEGMENT_DURATION,
    );
    if (
      splitPoint <= segment.sourceStart + MIN_SEGMENT_DURATION / 2 ||
      splitPoint >= segment.sourceEnd - MIN_SEGMENT_DURATION / 2
    ) {
      return;
    }
    const nextId = segmentIdRef.current;
    segmentIdRef.current += 1;
    setSegments((current) => {
      const index = current.findIndex((item) => item.id === segment.id);
      if (index === -1) return current;
      const updated = [...current];
      updated.splice(
        index,
        1,
        { id: segment.id, sourceStart: segment.sourceStart, sourceEnd: splitPoint },
        { id: nextId, sourceStart: splitPoint, sourceEnd: segment.sourceEnd },
      );
      return updated;
    });
    setSelectedSegmentId(nextId);
  };

  const deleteSelectedSegment = () => {
    if (!selectedSegment || segments.length <= 1) return;
    const filtered = segments.filter((segment) => segment.id !== selectedSegment.id);
    setSegments(filtered);
    const fallbackSegment = filtered[0] ?? null;
    if (fallbackSegment) {
      setSelectedSegmentId(fallbackSegment.id);
      const fallbackTimelineSegment =
        timelineSegments.find((segment) => segment.id === fallbackSegment.id) ?? null;
      if (fallbackTimelineSegment) {
        syncToTimelineTime(fallbackTimelineSegment.timelineStart);
      }
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    syncToTimelineTime(currentTimelineTime + deltaSeconds);
  };

  const handleSeekInputCommit = () => {
    const next = Number(seekInput);
    if (Number.isFinite(next)) {
      syncToTimelineTime(next);
    }
  };

  const handleFullscreen = async () => {
    if (!previewRef.current) return;
    if (!document.fullscreenElement) {
      await previewRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div className="w-full">
      <div className="neo-panel relative overflow-hidden bg-[var(--bg-panel)] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-3 border-b-2 border-[var(--border-main)] bg-[var(--accent)]" />

        <div className="mt-4 flex flex-col gap-4 border-b-[3px] border-[var(--border-main)] pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="neo-panel bg-[var(--bg-panel)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em]">
                No Cap: 100% Private
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=com.triptea.app"
                target="_blank"
                rel="noreferrer"
                className="neo-button inline-flex bg-[#161c2b] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white"
              >
                Download on Google Play
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleFullscreen}
                className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
              >
                Fullscreen
              </button>
              <button
                type="button"
                disabled={!videoFile}
                className="neo-button bg-[#161c2b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export
              </button>
            </div>
          </div>

          {videoFile && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-soft)]">
                  Jump To (seconds)
                </span>
                <div className="flex gap-2">
                  <input
                    value={seekInput}
                    onChange={(event) => setSeekInput(event.target.value)}
                    onBlur={handleSeekInputCommit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSeekInputCommit();
                      }
                    }}
                    className="min-w-[120px] border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-3 py-2 text-sm font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSeekInputCommit}
                    className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                  >
                    Seek
                  </button>
                </div>
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "-1s", delta: -1 },
                  { label: "-0.1s", delta: -0.1 },
                  { label: "+0.1s", delta: 0.1 },
                  { label: "+1s", delta: 1 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => seekRelative(item.delta)}
                    className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
          <div
            className={`mt-6 flex w-full flex-col items-center gap-8 py-14 text-center transition-colors ${
              isDragOver ? "bg-[var(--accent)]/20" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragOver(false);
              const file = event.dataTransfer.files?.[0] ?? null;
              setPreviewFile(file);
            }}
          >
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
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-col gap-4 border-b-[3px] border-[var(--border-main)] pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black uppercase tracking-tight">
                      {videoFile.name}
                    </h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                      Private preview - processed locally in your browser
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={togglePlayback}
                      className="neo-button bg-[var(--accent)] px-4 py-2 text-sm font-black uppercase text-black"
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      onClick={splitAtPlayhead}
                      disabled={!selectedSegment}
                      className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-sm font-black uppercase disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Split
                    </button>
                    <button
                      onClick={deleteSelectedSegment}
                      disabled={segments.length <= 1 || !selectedSegment}
                      className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-sm font-black uppercase disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete
                    </button>
                    <button
                      onClick={clearVideo}
                      className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-sm font-black uppercase"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div ref={previewRef} className="neo-panel bg-[var(--bg-panel-muted)] p-4">
                  <div className="relative aspect-video w-full overflow-hidden border-4 border-[var(--border-main)] bg-black">
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      <div
                        className={`relative overflow-hidden border border-white/10 bg-black ${cropBoxClass} ${
                          cropPreset === "free" ? "h-full w-full" : "max-h-full max-w-full"
                        }`}
                      >
                        <video
                          ref={videoRef}
                          src={videoSrc}
                          controls
                          onLoadedMetadata={handleMetadataLoaded}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          className={`absolute inset-0 h-full w-full ${
                            cropPreset === "free" ? "object-contain" : "object-cover"
                          }`}
                          style={{ filter: previewFilter, transform: previewTransform }}
                          crossOrigin="anonymous"
                        />

                        {textOverlay.trim() && (
                          <div
                            className="pointer-events-none absolute inset-x-4 font-black uppercase tracking-[0.12em] text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.85)]"
                            style={{
                              top: `${textY}%`,
                              fontSize: `${textSize}px`,
                              textAlign: "center",
                            }}
                          >
                            {textOverlay}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="neo-panel bg-[var(--bg-panel-muted)] p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-black uppercase tracking-[0.18em]">
                      Timeline
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                      <span>
                        {formatTime(currentTimelineTime)} / {formatTime(totalTimelineDuration)}
                      </span>
                      <label className="flex items-center gap-2">
                        <span>Zoom</span>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="1"
                          value={zoom}
                          onChange={(event) => setZoom(Number(event.target.value))}
                        />
                      </label>
                    </div>
                  </div>

                  <div ref={timelineShellRef} className="overflow-x-auto">
                    <canvas
                      ref={timelineCanvasRef}
                      onPointerDown={handleTimelinePointerDown}
                      className="block cursor-pointer"
                    />
                  </div>

                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    Drag the red playhead to scrub. Grab segment edges to trim. Click a
                    segment to select it.
                  </p>
                </div>
              </div>

              <div className="neo-panel bg-[var(--bg-panel)] p-4">
                <div className="mb-4 flex flex-wrap gap-3">
                  {tabs.map((tab) => {
                    const active = tab === activeTab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                          active
                            ? "bg-[var(--accent)] text-black"
                            : "bg-[var(--bg-panel-muted)]"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "Trim" && selectedSegment ? (
                  <div className="space-y-5 rounded-none border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-sm font-black uppercase tracking-[0.16em]">
                        Selected segment
                      </p>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                        {formatTime(selectedSegment.sourceStart)} -{" "}
                        {formatTime(selectedSegment.sourceEnd)}
                      </p>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Trim start
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(sourceDuration - MIN_SEGMENT_DURATION, 0)}
                        step="0.01"
                        value={selectedSegment.sourceStart}
                        onChange={(event) =>
                          updateSelectedSegment(
                            Number(event.target.value),
                            selectedSegment.sourceEnd,
                          )
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Trim end
                      </span>
                      <input
                        type="range"
                        min={selectedSegment.sourceStart + MIN_SEGMENT_DURATION}
                        max={Math.max(sourceDuration, MIN_SEGMENT_DURATION)}
                        step="0.01"
                        value={selectedSegment.sourceEnd}
                        onChange={(event) =>
                          updateSelectedSegment(
                            selectedSegment.sourceStart,
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </div>
                ) : null}

                {activeTab === "Crop" && (
                  <div className="space-y-4 rounded-none border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em]">
                      Crop & transform
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["free", "16:9", "1:1", "9:16"] as CropPreset[]).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCropPreset(preset)}
                          className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                            cropPreset === preset
                              ? "bg-[var(--accent)] text-black"
                              : "bg-[var(--bg-panel)]"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation((value) => (value + 270) % 360)}
                        className="neo-button bg-[var(--bg-panel)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em]"
                      >
                        Rotate Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((value) => (value + 90) % 360)}
                        className="neo-button bg-[var(--bg-panel)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em]"
                      >
                        Rotate Right
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipHorizontal((value) => !value)}
                        className="neo-button bg-[var(--bg-panel)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em]"
                      >
                        Flip Horizontal
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipVertical((value) => !value)}
                        className="neo-button bg-[var(--bg-panel)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em]"
                      >
                        Flip Vertical
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "Audio" && (
                  <div className="space-y-4 rounded-none border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em]">
                      Audio & speed
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMuted((value) => !value)}
                        className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                          muted ? "bg-[var(--accent)] text-black" : "bg-[var(--bg-panel)]"
                        }`}
                      >
                        {muted ? "Muted" : "Mute"}
                      </button>
                    </div>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Volume
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Playback speed
                      </span>
                      <input
                        type="range"
                        min="0.25"
                        max="2"
                        step="0.05"
                        value={playbackRate}
                        onChange={(event) => setPlaybackRate(Number(event.target.value))}
                      />
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                        {playbackRate.toFixed(2)}x
                      </span>
                    </label>
                  </div>
                )}

                {activeTab === "Filters" && (
                  <div className="space-y-4 rounded-none border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em]">
                      Filters & color
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["none", "grayscale", "sepia", "vintage"] as FilterPreset[]).map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFilterPreset(preset)}
                            className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                              filterPreset === preset
                                ? "bg-[var(--accent)] text-black"
                                : "bg-[var(--bg-panel)]"
                            }`}
                          >
                            {preset}
                          </button>
                        ),
                      )}
                    </div>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Brightness
                      </span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="1"
                        value={brightness}
                        onChange={(event) => setBrightness(Number(event.target.value))}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Contrast
                      </span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="1"
                        value={contrast}
                        onChange={(event) => setContrast(Number(event.target.value))}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Saturation
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={saturation}
                        onChange={(event) => setSaturation(Number(event.target.value))}
                      />
                    </label>
                  </div>
                )}

                {activeTab === "Text" && (
                  <div className="space-y-4 rounded-none border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em]">
                      Text overlay
                    </p>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Overlay text
                      </span>
                      <input
                        value={textOverlay}
                        onChange={(event) => setTextOverlay(event.target.value)}
                        className="border-4 border-[var(--border-main)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-bold outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Text size
                      </span>
                      <input
                        type="range"
                        min="16"
                        max="64"
                        step="1"
                        value={textSize}
                        onChange={(event) => setTextSize(Number(event.target.value))}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        Vertical position
                      </span>
                      <input
                        type="range"
                        min="5"
                        max="75"
                        step="1"
                        value={textY}
                        onChange={(event) => setTextY(Number(event.target.value))}
                      />
                    </label>
                  </div>
                )}

                <p
                  ref={messageRef}
                  className="mt-4 min-h-4 overflow-hidden font-mono text-xs text-[var(--text-soft)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
