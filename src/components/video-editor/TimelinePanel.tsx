"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

/* ---------- shared types ---------- */
export type TrackType = "video" | "audio";

export type Clip = {
  id: number;
  sourceStart: number;
  sourceEnd: number;
  timelineStart: number;
};

export type EnrichedClip = Clip & {
  duration: number;
  timelineEnd: number;
};

export type Selection = { track: TrackType; id: number } | null;

type TimelineInteraction =
  | { mode: "scrub" }
  | { mode: "move"; track: TrackType; id: number; offset: number }
  | { mode: "trim-start"; track: TrackType; id: number }
  | { mode: "trim-end"; track: TrackType; id: number };

/* ---------- constants ---------- */
const MIN_CLIP_DURATION = 0.1;
export const MIN_TIMELINE_ZOOM = 0.25;
export const MAX_TIMELINE_ZOOM = 16;
const TIMELINE_HEIGHT = 148;
const TIMELINE_INSET = 12;
const VIDEO_TRACK_Y = 38;
const AUDIO_TRACK_Y = 88;
const TRACK_HEIGHT = 32;
const HANDLE_WIDTH = 8;
const TRACK_LABEL_WIDTH = 56;
const TICK_STEPS = [0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];

/* ---------- coalesced media seek state (prevents decoder flooding) ---------- */
const pendingSeekMap = new WeakMap<HTMLMediaElement, number>();
const attachedSeekListeners = new WeakSet<HTMLMediaElement>();

/* ---------- helpers (exported for use by parent) ---------- */
export function enrichClips(clips: Clip[]): EnrichedClip[] {
  return [...clips]
    .sort((a, b) => a.timelineStart - b.timelineStart)
    .map((c) => {
      const duration = Math.max(c.sourceEnd - c.sourceStart, 0);
      return { ...c, duration, timelineEnd: c.timelineStart + duration };
    });
}

export function getClipAtTime(clips: EnrichedClip[], time: number) {
  return clips.find((c) => time >= c.timelineStart && time <= c.timelineEnd) ?? null;
}

export function seekMediaToTimelineTime(
  el: HTMLMediaElement | null,
  clips: EnrichedClip[],
  time: number,
  tolerance = 0.12,
): boolean {
  if (!el || !clips.length) return false;
  const clip = getClipAtTime(clips, time);
  if (!clip) {
    el.pause();
    return false;
  }
  const src = clip.sourceStart + (time - clip.timelineStart);
  if (Math.abs(el.currentTime - src) <= tolerance) {
    return false;
  }

  // Coalesce overlapping seeks while the decoder is already busy
  if (el.seeking) {
    pendingSeekMap.set(el, src);
    if (!attachedSeekListeners.has(el)) {
      attachedSeekListeners.add(el);
      const flushSeek = () => {
        const queued = pendingSeekMap.get(el);
        pendingSeekMap.delete(el);
        if (queued !== undefined && Math.abs(el.currentTime - queued) > 0.04) {
          el.currentTime = queued;
        } else {
          el.removeEventListener("seeked", flushSeek);
          attachedSeekListeners.delete(el);
        }
      };
      el.addEventListener("seeked", flushSeek);
    }
    return true;
  }

  pendingSeekMap.delete(el);
  el.currentTime = src;
  return true;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

/**
 * Piecewise logarithmic zoom mapping so 1.00x (Fit) sits at slider center (50):
 * - [0..50]   -> 0.25x .. 1.00x (zoom out)
 * - [50..100] -> 1.00x .. 16.00x (zoom in)
 */
function sliderToZoom(pos: number): number {
  const z =
    pos <= 50
      ? Math.pow(2, (pos - 50) / 25)
      : Math.pow(2, (pos - 50) / 12.5);
  return clamp(Number(z.toFixed(2)), MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM);
}

function zoomToSlider(zoom: number): number {
  const z = clamp(zoom, MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM);
  const pos =
    z <= 1 ? 50 + 25 * Math.log2(z) : 50 + 12.5 * Math.log2(z);
  return Math.round(clamp(pos, 0, 100));
}

function getLayoutMetrics(viewportWidth: number, zoom: number) {
  const safeViewport = Math.max(viewportWidth, 320);
  const innerStart = TIMELINE_INSET + TRACK_LABEL_WIDTH;
  const baseInnerWidth = Math.max(safeViewport - innerStart - TIMELINE_INSET, 80);
  const innerWidth = Math.max(Math.round(baseInnerWidth * zoom), 48);
  const virtualWidth =
    zoom <= 1
      ? safeViewport
      : Math.max(safeViewport, innerStart + innerWidth + TIMELINE_INSET);
  return { safeViewport, innerStart, baseInnerWidth, innerWidth, virtualWidth };
}

function getTrackY(t: TrackType) {
  return t === "video" ? VIDEO_TRACK_Y : AUDIO_TRACK_Y;
}

function neighbors(clips: EnrichedClip[], id: number) {
  const idx = clips.findIndex((c) => c.id === id);
  if (idx === -1) return { prev: null, next: null };
  return { prev: clips[idx - 1] ?? null, next: clips[idx + 1] ?? null };
}

function getAdaptiveTickStep(ppSec: number): number {
  for (const step of TICK_STEPS) {
    if (step * ppSec >= 56) return step;
  }
  return 300;
}

function formatRulerTick(sec: number, step: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  if (step < 0.5) return `${sec.toFixed(2)}s`;
  if (step < 1) return `${sec.toFixed(1)}s`;
  return `${Math.round(sec)}s`;
}

/* ---------- component ---------- */
type Props = {
  videoSegments: EnrichedClip[];
  audioSegments: EnrichedClip[];
  audioPeaks: number[];
  videoDuration: number;
  audioDuration: number;
  totalDuration: number;
  videoTrackEnd: number;
  currentTime: number;
  zoom: number;
  selection: Selection;
  audioSrc: string;
  canTrimStart: boolean;
  canTrimEnd: boolean;
  thumbnails?: HTMLCanvasElement[];
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  onTimeChange: (t: number) => void;
  onSelectionChange: (s: Selection) => void;
  onVideoClipsUpdate: (fn: (clips: Clip[]) => Clip[]) => void;
  onAudioClipsUpdate: (fn: (clips: Clip[]) => Clip[]) => void;
  onSplit: () => void;
  onTrimStartToPlayhead: () => void;
  onTrimEndToPlayhead: () => void;
  onDelete: () => void;
  onUploadAudio: () => void;
  onClearAudio: () => void;
  onStopPlayback: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  containerWidth: number;
  onContainerResize: (w: number) => void;
};

export type TimelinePanelHandle = {
  setPlayheadTime: (t: number) => void;
};

const TimelinePanel = memo(
  forwardRef<TimelinePanelHandle, Props>(function TimelinePanel(
    {
      videoSegments,
      audioSegments,
      audioPeaks,
      videoDuration,
      audioDuration,
      totalDuration,
      videoTrackEnd,
      currentTime,
      zoom,
      selection,
      audioSrc,
      canTrimStart,
      canTrimEnd,
      thumbnails,
      onZoomChange,
      onTimeChange,
      onSelectionChange,
      onVideoClipsUpdate,
      onAudioClipsUpdate,
      onSplit,
      onTrimStartToPlayhead,
      onTrimEndToPlayhead,
      onDelete,
      onUploadAudio,
      onClearAudio,
      onStopPlayback,
      onDragStart,
      onDragEnd,
      containerWidth,
      onContainerResize,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const interactionRef = useRef<TimelineInteraction | null>(null);
    const playheadTimeRef = useRef(currentTime);
    const prevZoomRef = useRef(zoom);
    const lastScrubSyncRef = useRef(0);
    const drawRafRef = useRef<number | null>(null);

    const layout = getLayoutMetrics(containerWidth, zoom);
    const viewportWidth = layout.safeViewport;
    const virtualWidth = layout.virtualWidth;

    const pps = useCallback(
      () => layout.innerWidth / Math.max(totalDuration, 0.01),
      [layout.innerWidth, totalDuration],
    );

    const xToTime = useCallback(
      (virtualX: number) => {
        const cx = clamp(
          virtualX,
          layout.innerStart,
          layout.innerStart + layout.innerWidth,
        );
        return ((cx - layout.innerStart) / layout.innerWidth) * totalDuration;
      },
      [layout.innerStart, layout.innerWidth, totalDuration],
    );

    const themeColorsRef = useRef({
      bgMuted: "#ece8df",
      textSoft: "#4b5563",
      textMain: "#111827",
      accent: "#f2ef13",
      isDark: false,
    });

    /* ---- draw (viewport-sized canvas: never exceeds containerWidth) ---- */
    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const vw = viewportWidth;
      const h = TIMELINE_HEIGHT;
      const scrollLeft = shellRef.current?.scrollLeft ?? 0;
      const { innerStart, innerWidth } = layout;
      const ppSec = innerWidth / Math.max(totalDuration, 0.01);
      const { bgMuted, textSoft, textMain, accent, isDark } = themeColorsRef.current;
      const activeTime = playheadTimeRef.current;

      ctx.clearRect(0, 0, vw, h);

      // Background
      ctx.fillStyle = bgMuted;
      ctx.fillRect(0, 0, vw, h);

      // Adaptive Grid & Ruler (culled strictly to canvas [innerStart, vw - TIMELINE_INSET])
      const step = getAdaptiveTickStep(ppSec);
      const minVisSec = Math.max(0, (scrollLeft + innerStart - innerStart) / ppSec);
      const maxVisSec = Math.min(
        totalDuration,
        (scrollLeft + vw - TIMELINE_INSET - innerStart) / ppSec,
      );
      const startTick = Math.max(0, Math.floor(minVisSec / step) * step);
      const endTick = Math.min(totalDuration, Math.ceil(maxVisSec / step) * step);

      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      for (let s = startTick; s <= endTick + 1e-6; s += step) {
        const cx = innerStart + s * ppSec - scrollLeft;
        if (cx < innerStart - 1 || cx > vw - TIMELINE_INSET + 1) continue;
        ctx.beginPath();
        ctx.moveTo(cx, 16);
        ctx.lineTo(cx, h - 8);
        ctx.stroke();
        ctx.fillStyle = textSoft;
        ctx.font = "700 9px sans-serif";
        ctx.fillText(formatRulerTick(s, step), cx + 3, 12);
      }

      // Clip tracks to the scrollable timeline lane so clips never bleed over left labels
      ctx.save();
      ctx.beginPath();
      ctx.rect(innerStart, 0, Math.max(vw - innerStart, 1), h);
      ctx.clip();

      const drawTrack = (track: TrackType, clips: EnrichedClip[]) => {
        const y = getTrackY(track);
        const trackEndX = innerStart + innerWidth - scrollLeft;
        const slotLeft = Math.max(innerStart, innerStart - scrollLeft);
        const slotRight = Math.min(vw - TIMELINE_INSET, trackEndX);
        if (slotRight > slotLeft) {
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
          ctx.fillRect(slotLeft, y, slotRight - slotLeft, TRACK_HEIGHT);
        }

        for (const clip of clips) {
          const cx = innerStart + clip.timelineStart * ppSec - scrollLeft;
          const cw = Math.max(clip.duration * ppSec, HANDLE_WIDTH * 2 + 8);
          if (cx + cw < innerStart || cx > vw) continue;

          const sel = selection?.track === track && selection.id === clip.id;

          ctx.fillStyle = track === "video" ? "#fff400" : "#b8ffcf";
          ctx.fillRect(cx, y, cw, TRACK_HEIGHT);

          // Optional video filmstrip thumbnails (strictly tile-culled to visible viewport!)
          if (track === "video" && thumbnails && thumbnails.length > 0 && videoDuration > 0) {
            const innerLeft = cx + HANDLE_WIDTH;
            const innerW = cw - HANDLE_WIDTH * 2;
            if (innerW > 18) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(
                Math.max(innerStart, innerLeft),
                y + 1,
                Math.min(innerLeft + innerW, vw) - Math.max(innerStart, innerLeft),
                TRACK_HEIGHT - 2,
              );
              ctx.clip();
              ctx.globalAlpha = 0.42;
              const thumbW = Math.max(24, Math.round((TRACK_HEIGHT - 2) * (16 / 9)));
              const totalTiles = Math.ceil(innerW / thumbW);
              const firstTile = Math.max(0, Math.floor((innerStart - innerLeft) / thumbW));
              const lastTile = Math.min(
                totalTiles - 1,
                Math.ceil((vw - innerLeft) / thumbW),
              );
              for (let ti = firstTile; ti <= lastTile; ti++) {
                const frac = (ti + 0.5) / totalTiles;
                const srcTime = clip.sourceStart + frac * clip.duration;
                const thumbIdx = Math.min(
                  thumbnails.length - 1,
                  Math.max(0, Math.floor((srcTime / videoDuration) * thumbnails.length)),
                );
                const thumb = thumbnails[thumbIdx];
                if (thumb) {
                  ctx.drawImage(thumb, innerLeft + ti * thumbW, y + 1, thumbW, TRACK_HEIGHT - 2);
                }
              }
              ctx.restore();
            }
          }

          // Clip border & handles
          ctx.strokeStyle = sel ? (isDark ? "#ffffff" : "#000000") : "rgba(0,0,0,0.5)";
          ctx.lineWidth = sel ? 3 : 1.5;
          ctx.strokeRect(cx, y, cw, TRACK_HEIGHT);

          ctx.fillStyle = sel ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.16)";
          ctx.fillRect(cx, y, HANDLE_WIDTH, TRACK_HEIGHT);
          ctx.fillRect(cx + cw - HANDLE_WIDTH, y, HANDLE_WIDTH, TRACK_HEIGHT);

          // Sliced audio waveform matching [sourceStart, sourceEnd]
          if (track === "audio" && audioPeaks.length > 0) {
            const safeAudioDur = Math.max(audioDuration, 0.01);
            const startRatio = clamp(clip.sourceStart / safeAudioDur, 0, 1);
            const endRatio = clamp(clip.sourceEnd / safeAudioDur, startRatio, 1);
            const startIdx = Math.floor(startRatio * (audioPeaks.length - 1));
            const endIdx = Math.max(
              startIdx + 1,
              Math.ceil(endRatio * (audioPeaks.length - 1)),
            );
            const slice = audioPeaks.slice(startIdx, endIdx + 1);
            if (slice.length > 0) {
              ctx.strokeStyle = "rgba(0,0,0,0.55)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              const mid = y + TRACK_HEIGHT / 2;
              const innerLeft = cx + HANDLE_WIDTH;
              const innerW = Math.max(cw - HANDLE_WIDTH * 2, 1);
              for (let i = 0; i < slice.length; i++) {
                const wx = innerLeft + (i / Math.max(slice.length - 1, 1)) * innerW;
                if (wx < innerStart - 2 || wx > vw + 2) continue;
                const a = (slice[i] ?? 0) * (TRACK_HEIGHT / 2 - 3);
                ctx.moveTo(wx, mid - a);
                ctx.lineTo(wx, mid + a);
              }
              ctx.stroke();
            }
          }

          // Clip label pill
          const label = `${track === "video" ? "Clip" : "Audio"} ${clip.id}`;
          if (cw > HANDLE_WIDTH * 2 + 24) {
            ctx.font = "800 10px sans-serif";
            const lw = ctx.measureText(label).width;
            const labelDrawX = Math.max(innerStart + 4, cx + HANDLE_WIDTH + 4);
            const availW = cx + cw - HANDLE_WIDTH - labelDrawX;
            if (availW > 18) {
              if (track === "video" && thumbnails && thumbnails.length > 0) {
                ctx.fillStyle = "rgba(255, 244, 0, 0.9)";
                ctx.fillRect(labelDrawX - 2, y + 6, Math.min(lw + 6, availW), 18);
              }
              ctx.fillStyle = "#000000";
              ctx.fillText(label, labelDrawX + 1, y + 19, availW);
            }
          }
        }
      };

      drawTrack("video", videoSegments);
      drawTrack("audio", audioSegments);

      // Overflow indicator on audio track (greyed out area beyond video)
      if (audioSegments.length > 0 && videoTrackEnd > 0) {
        const overflowX = innerStart + videoTrackEnd * ppSec - scrollLeft;
        const overflowW = innerWidth - videoTrackEnd * ppSec;
        if (overflowW > 0 && overflowX < vw && overflowX + overflowW > innerStart) {
          const drawStart = Math.max(overflowX, innerStart);
          const drawEnd = Math.min(overflowX + overflowW, vw);
          const drawW = drawEnd - drawStart;
          if (drawW > 0) {
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            ctx.fillRect(drawStart, AUDIO_TRACK_Y, drawW, TRACK_HEIGHT);
            ctx.strokeStyle = "rgba(255,255,255,0.18)";
            ctx.lineWidth = 1;
            const stripeStart = Math.floor(drawStart / 8) * 8;
            for (let sx = stripeStart; sx < drawEnd; sx += 8) {
              ctx.beginPath();
              ctx.moveTo(sx, AUDIO_TRACK_Y);
              ctx.lineTo(sx + TRACK_HEIGHT, AUDIO_TRACK_Y + TRACK_HEIGHT);
              ctx.stroke();
            }
            if (drawW > 70) {
              ctx.fillStyle = "rgba(255,255,255,0.85)";
              ctx.font = "700 9px sans-serif";
              ctx.fillText("NOT EXPORTED", drawStart + 6, AUDIO_TRACK_Y + 19);
            }
          }
        }
      }

      ctx.restore();

      // Fixed left track labels gutter
      ctx.fillStyle = bgMuted;
      ctx.fillRect(0, 14, innerStart - 1, h - 14);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerStart - 1, 16);
      ctx.lineTo(innerStart - 1, h - 8);
      ctx.stroke();

      ctx.fillStyle = textSoft;
      ctx.font = "800 10px sans-serif";
      ctx.fillText("VIDEO", TIMELINE_INSET, VIDEO_TRACK_Y + 19);
      ctx.fillText("AUDIO", TIMELINE_INSET, AUDIO_TRACK_Y + 19);

      // Playhead (visible inside canvas viewport)
      const px = innerStart + activeTime * ppSec - scrollLeft;
      if (px >= innerStart - 2 && px <= vw + 2) {
        ctx.strokeStyle = isDark ? accent : textMain;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 15);
        ctx.lineTo(px, h - 6);
        ctx.stroke();

        ctx.fillStyle = isDark ? accent : textMain;
        ctx.beginPath();
        ctx.arc(px, 15, 4, 0, Math.PI * 2);
        ctx.fill();

        const timeText = activeTime.toFixed(2) + "s";
        ctx.font = "800 10px sans-serif";
        const tw = ctx.measureText(timeText).width;
        const badgeX = clamp(px - tw / 2, innerStart, vw - tw - 10);

        ctx.fillStyle = isDark ? accent : "#111111";
        ctx.fillRect(badgeX - 4, 0, tw + 8, 14);
        ctx.fillStyle = isDark ? "#000000" : "#ffffff";
        ctx.fillText(timeText, badgeX, 10);
      }
    }, [
      audioDuration,
      audioPeaks,
      audioSegments,
      layout,
      selection,
      thumbnails,
      totalDuration,
      videoDuration,
      videoSegments,
      videoTrackEnd,
      viewportWidth,
    ]);

    const scheduleDraw = useCallback(() => {
      if (drawRafRef.current !== null) return;
      drawRafRef.current = requestAnimationFrame(() => {
        drawRafRef.current = null;
        draw();
      });
    }, [draw]);

    useEffect(() => {
      return () => {
        if (drawRafRef.current !== null) {
          cancelAnimationFrame(drawRafRef.current);
          drawRafRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      const syncColors = () => {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        themeColorsRef.current = {
          bgMuted: style.getPropertyValue("--bg-panel-muted").trim() || "#ece8df",
          textSoft: style.getPropertyValue("--text-soft").trim() || "#4b5563",
          textMain: style.getPropertyValue("--text-main").trim() || "#111827",
          accent: style.getPropertyValue("--accent").trim() || "#f2ef13",
          isDark: root.classList.contains("dark"),
        };
        draw();
      };
      syncColors();
      const observer = new MutationObserver(syncColors);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "style"],
      });
      return () => observer.disconnect();
    }, [draw]);

    useEffect(() => {
      playheadTimeRef.current = currentTime;
      draw();
    }, [currentTime, draw]);

    /* ---- Anchor scroll position around the playhead when zoom changes ---- */
    useEffect(() => {
      const shell = shellRef.current;
      const prevZoom = prevZoomRef.current;
      prevZoomRef.current = zoom;
      if (!shell || prevZoom === zoom) return;

      if (zoom <= 1) {
        shell.scrollLeft = 0;
        draw();
        return;
      }

      const oldLayout = getLayoutMetrics(containerWidth, prevZoom);
      const frac = clamp(playheadTimeRef.current / Math.max(totalDuration, 0.01), 0, 1);
      const oldScreenX =
        layout.innerStart + frac * oldLayout.innerWidth - shell.scrollLeft;
      const anchorX =
        oldScreenX >= layout.innerStart && oldScreenX <= viewportWidth - TIMELINE_INSET
          ? oldScreenX
          : layout.innerStart + (viewportWidth - layout.innerStart - TIMELINE_INSET) / 2;

      const nextScrollLeft = Math.max(
        0,
        layout.innerStart + frac * layout.innerWidth - anchorX,
      );
      shell.scrollLeft = nextScrollLeft;
      draw();
    }, [containerWidth, draw, layout.innerStart, layout.innerWidth, totalDuration, viewportWidth, zoom]);

    useImperativeHandle(
      ref,
      () => ({
        setPlayheadTime: (t: number) => {
          playheadTimeRef.current = t;
          const shell = shellRef.current;
          if (shell && zoom > 1) {
            const ppSec = layout.innerWidth / Math.max(totalDuration, 0.01);
            const virtualPx = layout.innerStart + t * ppSec;
            const canvasPx = virtualPx - shell.scrollLeft;
            if (canvasPx > viewportWidth - 36) {
              shell.scrollLeft = Math.max(0, virtualPx - layout.innerStart - (viewportWidth - layout.innerStart) * 0.25);
            } else if (canvasPx < layout.innerStart + 16 && shell.scrollLeft > 0) {
              shell.scrollLeft = Math.max(0, virtualPx - layout.innerStart - 40);
            }
          }
          draw();
        },
      }),
      [draw, layout.innerStart, layout.innerWidth, totalDuration, viewportWidth, zoom],
    );

    /* ---- resize backing store only to viewport width (never exceeds GPU texture cap!) ---- */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(TIMELINE_HEIGHT * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${TIMELINE_HEIGHT}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      draw();
    }, [viewportWidth, draw]);

    /* ---- shell resize observer, scroll redraw & Ctrl+Wheel zoom ---- */
    useEffect(() => {
      const el = shellRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => onContainerResize(el.clientWidth));
      ro.observe(el);
      onContainerResize(el.clientWidth);

      const onScroll = () => scheduleDraw();
      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onZoomChange((z) => {
            const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
            return clamp(
              Number((z * factor).toFixed(2)),
              MIN_TIMELINE_ZOOM,
              MAX_TIMELINE_ZOOM,
            );
          });
        }
      };

      el.addEventListener("scroll", onScroll, { passive: true });
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => {
        ro.disconnect();
        el.removeEventListener("scroll", onScroll);
        el.removeEventListener("wheel", onWheel);
      };
    }, [onContainerResize, onZoomChange, scheduleDraw]);

    /* ---- pointer helpers ---- */
    const canvasPointer = useCallback(
      (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>) => {
        const c = canvasRef.current;
        if (!c) return null;
        const r = c.getBoundingClientRect();
        const scrollLeft = shellRef.current?.scrollLeft ?? 0;
        const canvasX = e.clientX - r.left;
        const virtualX = canvasX + scrollLeft;
        const y = e.clientY - r.top;
        return { x: virtualX, canvasX, y, time: xToTime(virtualX) };
      },
      [xToTime],
    );

    const findHit = useCallback(
      (track: TrackType, virtualX: number, y: number) => {
        const clips = track === "video" ? videoSegments : audioSegments;
        const ty = getTrackY(track);
        if (y < ty || y > ty + TRACK_HEIGHT) return null;
        const ppSec = pps();
        for (const clip of clips) {
          const cx = layout.innerStart + clip.timelineStart * ppSec;
          const cw = Math.max(clip.duration * ppSec, HANDLE_WIDTH * 2 + 8);
          if (virtualX < cx || virtualX > cx + cw) continue;
          if (virtualX <= cx + HANDLE_WIDTH) return { clip, hit: "trim-start" as const };
          if (virtualX >= cx + cw - HANDLE_WIDTH) return { clip, hit: "trim-end" as const };
          return { clip, hit: "move" as const };
        }
        return null;
      },
      [audioSegments, layout.innerStart, pps, videoSegments],
    );

    const getUpdater = useCallback(
      (track: TrackType) => (track === "video" ? onVideoClipsUpdate : onAudioClipsUpdate),
      [onAudioClipsUpdate, onVideoClipsUpdate],
    );

    const getSegs = useCallback(
      (track: TrackType) => (track === "video" ? videoSegments : audioSegments),
      [audioSegments, videoSegments],
    );

    /* ---- hover cursor ---- */
    const handleCanvasPointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (interactionRef.current) return;
        const c = canvasRef.current;
        const p = canvasPointer(e);
        if (!c || !p) return;

        if (p.canvasX < layout.innerStart) {
          c.style.cursor = "default";
          return;
        }

        const track: TrackType | null =
          p.y >= AUDIO_TRACK_Y && p.y <= AUDIO_TRACK_Y + TRACK_HEIGHT
            ? "audio"
            : p.y >= VIDEO_TRACK_Y && p.y <= VIDEO_TRACK_Y + TRACK_HEIGHT
              ? "video"
              : null;

        if (track) {
          const hit = findHit(track, p.x, p.y);
          if (hit) {
            if (hit.hit === "trim-start" || hit.hit === "trim-end") {
              c.style.cursor = "ew-resize";
              return;
            }
            if (track === "audio" && hit.hit === "move") {
              c.style.cursor = "grab";
              return;
            }
          }
        }
        c.style.cursor = "pointer";
      },
      [canvasPointer, findHit, layout.innerStart],
    );

    /* ---- pointer down ---- */
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const p = canvasPointer(e);
        if (!p) return;

        const track: TrackType | null =
          p.canvasX >= layout.innerStart
            ? p.y >= AUDIO_TRACK_Y && p.y <= AUDIO_TRACK_Y + TRACK_HEIGHT
              ? "audio"
              : p.y >= VIDEO_TRACK_Y && p.y <= VIDEO_TRACK_Y + TRACK_HEIGHT
                ? "video"
                : null
            : null;

        if (track) {
          const hit = findHit(track, p.x, p.y);
          if (hit) {
            onSelectionChange({ track, id: hit.clip.id });
            if (track === "video" && hit.hit === "move") return;
            if (onDragStart) onDragStart();
            if (hit.hit === "move" && canvasRef.current) {
              canvasRef.current.style.cursor = "grabbing";
            }
            interactionRef.current =
              hit.hit === "move"
                ? { mode: "move", track, id: hit.clip.id, offset: p.time - hit.clip.timelineStart }
                : { mode: hit.hit, track, id: hit.clip.id };
            return;
          }
        }

        interactionRef.current = { mode: "scrub" };
        onStopPlayback();
        playheadTimeRef.current = p.time;
        scheduleDraw();
        lastScrubSyncRef.current = performance.now();
        onTimeChange(p.time);
      },
      [
        canvasPointer,
        findHit,
        layout.innerStart,
        onDragStart,
        onSelectionChange,
        onStopPlayback,
        onTimeChange,
        scheduleDraw,
      ],
    );

    /* ---- global move / up ---- */
    const handleMove = useCallback(
      (e: PointerEvent) => {
        if (!interactionRef.current) return;
        const p = canvasPointer(e);
        if (!p) return;

        if (interactionRef.current.mode === "scrub") {
          playheadTimeRef.current = p.time;
          scheduleDraw();
          const now = performance.now();
          if (now - lastScrubSyncRef.current >= 33) {
            lastScrubSyncRef.current = now;
            onTimeChange(p.time);
          }
          return;
        }

        const ia = interactionRef.current;
        const clips = getSegs(ia.track);
        const clip = clips.find((c) => c.id === ia.id);
        if (!clip) return;
        const { prev, next } = neighbors(clips, clip.id);
        const update = getUpdater(ia.track);

        if (ia.mode === "move") {
          const ns = p.time - ia.offset;
          const minS = prev?.timelineEnd ?? 0;
          const maxS = (next?.timelineStart ?? totalDuration) - clip.duration;
          const ts = clamp(ns, minS, maxS);
          update((items) =>
            items.map((i) => (i.id === ia.id ? { ...i, timelineStart: ts } : i)),
          );
          return;
        }

        if (ia.mode === "trim-start") {
          const minTS = prev?.timelineEnd ?? 0;
          const maxTS = clip.timelineEnd - MIN_CLIP_DURATION;
          const ts = clamp(p.time, minTS, maxTS);
          const delta = ts - clip.timelineStart;
          update((items) =>
            items.map((i) =>
              i.id === ia.id
                ? { ...i, timelineStart: ts, sourceStart: i.sourceStart + delta }
                : i,
            ),
          );
          playheadTimeRef.current = ts;
          scheduleDraw();
          const now = performance.now();
          if (now - lastScrubSyncRef.current >= 33) {
            lastScrubSyncRef.current = now;
            onTimeChange(ts);
          }
          return;
        }

        // trim-end
        const maxTE = next?.timelineStart ?? totalDuration;
        const nd = clamp(
          p.time - clip.timelineStart,
          MIN_CLIP_DURATION,
          maxTE - clip.timelineStart,
        );
        update((items) =>
          items.map((i) =>
            i.id === ia.id ? { ...i, sourceEnd: i.sourceStart + nd } : i,
          ),
        );
        const endT = clip.timelineStart + nd;
        playheadTimeRef.current = endT;
        scheduleDraw();
        const now = performance.now();
        if (now - lastScrubSyncRef.current >= 33) {
          lastScrubSyncRef.current = now;
          onTimeChange(endT);
        }
      },
      [canvasPointer, getSegs, getUpdater, onTimeChange, scheduleDraw, totalDuration],
    );

    const handleUp = useCallback(() => {
      const ia = interactionRef.current;
      if (!ia) return;
      interactionRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "pointer";
      }
      if (ia.mode === "scrub") {
        onTimeChange(playheadTimeRef.current);
      } else {
        onTimeChange(playheadTimeRef.current);
        if (onDragEnd) onDragEnd();
      }
    }, [onDragEnd, onTimeChange]);

    useEffect(() => {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      return () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };
    }, [handleMove, handleUp]);

    const sliderPos = zoomToSlider(zoom);

    return (
      <div className="neo-panel shrink-0 overflow-hidden bg-[var(--bg-panel)]">
        {/* Attached Timeline Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-[var(--border-main)] bg-[var(--bg-panel)] px-3 py-2">
          {/* Left: Clip Editing Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onSplit}
              disabled={!selection}
              title="Split selected clip at playhead (S)"
              className="border-2 border-[var(--border-main)] bg-[var(--accent)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ✂ Split
            </button>
            <button
              type="button"
              onClick={onTrimStartToPlayhead}
              disabled={!canTrimStart}
              title="Trim clip start to playhead ([)"
              className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              [ Trim In
            </button>
            <button
              type="button"
              onClick={onTrimEndToPlayhead}
              disabled={!canTrimEnd}
              title="Trim clip end to playhead (])"
              className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ] Trim Out
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={!selection}
              title="Delete selected clip (Delete)"
              className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑 Delete
            </button>
            <span className="mx-1 hidden h-4 w-[2px] bg-[var(--border-main)]/20 sm:inline-block" />
            <button
              type="button"
              onClick={onUploadAudio}
              className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)]"
            >
              {audioSrc ? "♪ Replace Audio" : "♪ Add Audio"}
            </button>
            {audioSrc && (
              <button
                type="button"
                onClick={onClearAudio}
                title="Remove custom audio track"
                className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)]"
              >
                ✕ Audio
              </button>
            )}
          </div>

          {/* Right: Duration-Normalized Zoom Controls (center = 1.00x Fit) */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
            <span className="hidden text-[10px] font-black sm:inline">Zoom</span>
            <button
              type="button"
              onClick={() =>
                onZoomChange((z) =>
                  clamp(Number((z / 1.25).toFixed(2)), MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM),
                )
              }
              aria-label="Zoom out timeline"
              className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-0.5 text-xs font-black leading-none text-[var(--text-main)] shadow-[1px_1px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
            >
              −
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderPos}
              aria-label="Timeline zoom level"
              onChange={(e) => onZoomChange(sliderToZoom(Number(e.target.value)))}
              className="w-28 accent-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() =>
                onZoomChange((z) =>
                  clamp(Number((z * 1.25).toFixed(2)), MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM),
                )
              }
              aria-label="Zoom in timeline"
              className="border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-0.5 text-xs font-black leading-none text-[var(--text-main)] shadow-[1px_1px_0_0_var(--border-main)] hover:bg-[var(--accent)] hover:text-black"
            >
              +
            </button>
            <span className="w-12 text-right font-mono text-[11px] font-black text-[var(--text-main)]">
              {zoom.toFixed(2)}x
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(1)}
              title="Fit full video inside timeline (1.00x)"
              className={`border-2 border-[var(--border-main)] px-2 py-0.5 text-[10px] font-black uppercase ${
                Math.abs(zoom - 1) < 0.02
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-panel-muted)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-black"
              }`}
            >
              Fit
            </button>
          </div>
        </div>

        {/* Scrollable Virtualized Canvas Track Area */}
        <div ref={shellRef} className="relative overflow-x-auto overflow-y-hidden">
          <div
            style={{ width: `${virtualWidth}px`, height: `${TIMELINE_HEIGHT}px` }}
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handleCanvasPointerMove}
            style={{ marginTop: `-${TIMELINE_HEIGHT}px` }}
            className="sticky left-0 block cursor-pointer"
          />
        </div>
      </div>
    );
  }),
);

TimelinePanel.displayName = "TimelinePanel";

export default TimelinePanel;
