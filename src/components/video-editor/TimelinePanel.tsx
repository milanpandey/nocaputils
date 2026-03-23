"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

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
const TIMELINE_HEIGHT = 140;
const TIMELINE_INSET = 12;
const VIDEO_TRACK_Y = 36;
const AUDIO_TRACK_Y = 84;
const TRACK_HEIGHT = 28;
const HANDLE_WIDTH = 8;
const TRACK_LABEL_WIDTH = 56;

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
) {
  if (!el || !clips.length) return;
  const clip = getClipAtTime(clips, time);
  if (!clip) { el.pause(); return; }
  const src = clip.sourceStart + (time - clip.timelineStart);
  if (Math.abs(el.currentTime - src) > 0.12) el.currentTime = src;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function getMetrics(width: number) {
  const innerStart = TIMELINE_INSET + TRACK_LABEL_WIDTH;
  const innerWidth = Math.max(width - innerStart - TIMELINE_INSET, 1);
  return { innerStart, innerWidth };
}

function getTrackY(t: TrackType) {
  return t === "video" ? VIDEO_TRACK_Y : AUDIO_TRACK_Y;
}

function neighbors(clips: EnrichedClip[], id: number) {
  const idx = clips.findIndex((c) => c.id === id);
  if (idx === -1) return { prev: null, next: null };
  return { prev: clips[idx - 1] ?? null, next: clips[idx + 1] ?? null };
}

/* ---------- component ---------- */
type Props = {
  videoSegments: EnrichedClip[];
  audioSegments: EnrichedClip[];
  audioPeaks: number[];
  totalDuration: number;
  videoTrackEnd: number;
  currentTime: number;
  zoom: number;
  selection: Selection;
  onTimeChange: (t: number) => void;
  onSelectionChange: (s: Selection) => void;
  onVideoClipsUpdate: (fn: (clips: Clip[]) => Clip[]) => void;
  onAudioClipsUpdate: (fn: (clips: Clip[]) => Clip[]) => void;
  onStopPlayback: () => void;
  containerWidth: number;
  onContainerResize: (w: number) => void;
};

export type TimelinePanelHandle = {
  /* currently unused, reserved for imperative scroll-to-playhead */
};

const TimelinePanel = forwardRef<TimelinePanelHandle, Props>(function TimelinePanel(
  {
    videoSegments,
    audioSegments,
    audioPeaks,
    totalDuration,
    videoTrackEnd,
    currentTime,
    zoom,
    selection,
    onTimeChange,
    onSelectionChange,
    onVideoClipsUpdate,
    onAudioClipsUpdate,
    onStopPlayback,
    containerWidth,
    onContainerResize,
  },
  _ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<TimelineInteraction | null>(null);

  useImperativeHandle(_ref, () => ({}));

  const timelineWidth = Math.max(containerWidth - 16, totalDuration * 110 * zoom, 600);

  const pps = useCallback(
    (w: number) => getMetrics(w).innerWidth / Math.max(totalDuration, 0.01),
    [totalDuration],
  );

  const xToTime = useCallback(
    (x: number, w: number) => {
      const m = getMetrics(w);
      const cx = clamp(x, m.innerStart, m.innerStart + m.innerWidth);
      return ((cx - m.innerStart) / m.innerWidth) * totalDuration;
    },
    [totalDuration],
  );

  /* ---- draw ---- */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = timelineWidth;
    const h = TIMELINE_HEIGHT;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const m = getMetrics(w);
    const ppSec = m.innerWidth / Math.max(totalDuration, 0.01);

    // bg
    ctx.fillStyle = "var(--bg-panel-muted, #ece8df)";
    ctx.fillRect(0, 0, w, h);

    // labels
    ctx.fillStyle = "var(--text-soft, #4b5563)";
    ctx.font = "800 10px sans-serif";
    ctx.fillText("VIDEO", TIMELINE_INSET, VIDEO_TRACK_Y + 17);
    ctx.fillText("AUDIO", TIMELINE_INSET, AUDIO_TRACK_Y + 17);

    // grid
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let s = 0; s <= totalDuration; s += 1) {
      const x = m.innerStart + s * ppSec;
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, h - 10);
      ctx.stroke();
      ctx.fillStyle = "var(--text-soft, #4b5563)";
      ctx.font = "700 9px sans-serif";
      ctx.fillText(`${s}s`, x + 3, 11);
    }

    // draw track
    const drawTrack = (track: TrackType, clips: EnrichedClip[]) => {
      const y = getTrackY(track);
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(m.innerStart, y, m.innerWidth, TRACK_HEIGHT);

      for (const clip of clips) {
        const x = m.innerStart + clip.timelineStart * ppSec;
        const cw = Math.max(clip.duration * ppSec, HANDLE_WIDTH * 2 + 8);
        const sel = selection?.track === track && selection.id === clip.id;

        ctx.fillStyle = track === "video" ? "#fff400" : "#b8ffcf";
        ctx.strokeStyle = sel ? "#000" : "rgba(0,0,0,0.4)";
        ctx.lineWidth = sel ? 3 : 2;
        ctx.beginPath();
        ctx.rect(x, y, cw, TRACK_HEIGHT);
        ctx.fill();
        ctx.stroke();

        // handles
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(x, y, HANDLE_WIDTH, TRACK_HEIGHT);
        ctx.fillRect(x + cw - HANDLE_WIDTH, y, HANDLE_WIDTH, TRACK_HEIGHT);

        // waveform
        if (track === "audio" && audioPeaks.length) {
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          const mid = y + TRACK_HEIGHT / 2;
          audioPeaks.forEach((pk, i) => {
            const wx = x + (i / Math.max(audioPeaks.length - 1, 1)) * cw;
            const a = pk * (TRACK_HEIGHT / 2 - 3);
            ctx.moveTo(wx, mid - a);
            ctx.lineTo(wx, mid + a);
          });
          ctx.stroke();
        }

        // label
        ctx.fillStyle = "#000";
        ctx.font = "700 10px sans-serif";
        ctx.fillText(
          `${track === "video" ? "Clip" : "Audio"} ${clip.id}`,
          x + HANDLE_WIDTH + 3,
          y + 17,
        );
      }
    };

    drawTrack("video", videoSegments);
    drawTrack("audio", audioSegments);

    // Draw overflow indicator on audio track (greyed out area beyond video)
    if (audioSegments.length > 0 && videoTrackEnd > 0) {
      const overflowX = m.innerStart + videoTrackEnd * ppSec;
      const overflowW = m.innerWidth - videoTrackEnd * ppSec;
      if (overflowW > 0) {
        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(overflowX, AUDIO_TRACK_Y, overflowW, TRACK_HEIGHT);
        // Diagonal stripes pattern
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        for (let sx = overflowX; sx < overflowX + overflowW; sx += 8) {
          ctx.beginPath();
          ctx.moveTo(sx, AUDIO_TRACK_Y);
          ctx.lineTo(sx + TRACK_HEIGHT, AUDIO_TRACK_Y + TRACK_HEIGHT);
          ctx.stroke();
        }
        // Label
        if (overflowW > 60) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "700 9px sans-serif";
          ctx.fillText("NOT EXPORTED", overflowX + 6, AUDIO_TRACK_Y + 17);
        }
      }
    }

    // playhead
    const px = m.innerStart + currentTime * ppSec;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 14);
    ctx.lineTo(px, h - 6);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(px, 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // playhead time label
    const timeText = currentTime.toFixed(2) + "s";
    ctx.font = "800 10px sans-serif";
    const tw = ctx.measureText(timeText).width;
    const labelX = Math.max(0, Math.min(px - tw / 2, w - tw - 8));
    
    ctx.fillStyle = "#000";
    // Draw rounding rect for a nicer look if possible, but fillRect is fine
    ctx.fillRect(labelX - 4, 0, tw + 8, 14);
    
    ctx.fillStyle = "#fff";
    ctx.fillText(timeText, labelX, 10);
  }, [audioPeaks, audioSegments, currentTime, selection, timelineWidth, totalDuration, videoSegments, videoTrackEnd]);

  useEffect(() => { draw(); }, [draw]);

  /* ---- shell resize observer ---- */
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onContainerResize(el.clientWidth));
    ro.observe(el);
    onContainerResize(el.clientWidth);
    return () => ro.disconnect();
  }, [onContainerResize]);

  /* ---- pointer helpers ---- */
  const canvasPointer = useCallback(
    (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>) => {
      const c = canvasRef.current;
      if (!c) return null;
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const w = c.clientWidth;
      return { x, y, time: xToTime(x, w), width: w };
    },
    [xToTime],
  );

  const findHit = useCallback(
    (track: TrackType, x: number, y: number, w: number) => {
      const clips = track === "video" ? videoSegments : audioSegments;
      const ty = getTrackY(track);
      if (y < ty || y > ty + TRACK_HEIGHT) return null;
      const m = getMetrics(w);
      const ppSec = pps(w);
      for (const clip of clips) {
        const cx = m.innerStart + clip.timelineStart * ppSec;
        const cw = Math.max(clip.duration * ppSec, HANDLE_WIDTH * 2 + 8);
        if (x < cx || x > cx + cw) continue;
        if (x <= cx + HANDLE_WIDTH) return { clip, hit: "trim-start" as const };
        if (x >= cx + cw - HANDLE_WIDTH) return { clip, hit: "trim-end" as const };
        return { clip, hit: "move" as const };
      }
      return null;
    },
    [audioSegments, pps, videoSegments],
  );

  const getUpdater = useCallback(
    (track: TrackType) => (track === "video" ? onVideoClipsUpdate : onAudioClipsUpdate),
    [onAudioClipsUpdate, onVideoClipsUpdate],
  );

  const getSegs = useCallback(
    (track: TrackType) => (track === "video" ? videoSegments : audioSegments),
    [audioSegments, videoSegments],
  );

  /* ---- pointer down ---- */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const p = canvasPointer(e);
      if (!p) return;

      const track: TrackType | null =
        p.y >= AUDIO_TRACK_Y && p.y <= AUDIO_TRACK_Y + TRACK_HEIGHT
          ? "audio"
          : p.y >= VIDEO_TRACK_Y && p.y <= VIDEO_TRACK_Y + TRACK_HEIGHT
            ? "video"
            : null;

      if (track) {
        const hit = findHit(track, p.x, p.y, p.width);
        if (hit) {
          onSelectionChange({ track, id: hit.clip.id });
          // Video clips are locked — no move, only trim & select
          if (track === "video" && hit.hit === "move") return;
          interactionRef.current =
            hit.hit === "move"
              ? { mode: "move", track, id: hit.clip.id, offset: p.time - hit.clip.timelineStart }
              : { mode: hit.hit, track, id: hit.clip.id };
          return;
        }
      }

      interactionRef.current = { mode: "scrub" };
      onStopPlayback();
      onTimeChange(p.time);
    },
    [canvasPointer, findHit, onSelectionChange, onStopPlayback, onTimeChange],
  );

  /* ---- global move / up ---- */
  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (!interactionRef.current) return;
      const p = canvasPointer(e);
      if (!p) return;

      if (interactionRef.current.mode === "scrub") {
        onTimeChange(p.time);
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
        onTimeChange(ts);
        return;
      }

      // trim-end
      const maxTE = next?.timelineStart ?? totalDuration;
      const nd = clamp(p.time - clip.timelineStart, MIN_CLIP_DURATION, maxTE - clip.timelineStart);
      update((items) =>
        items.map((i) =>
          i.id === ia.id ? { ...i, sourceEnd: i.sourceStart + nd } : i,
        ),
      );
      onTimeChange(clip.timelineStart + nd);
    },
    [canvasPointer, getSegs, getUpdater, onTimeChange, totalDuration],
  );

  const handleUp = useCallback(() => {
    interactionRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [handleMove, handleUp]);

  return (
    <div
      ref={shellRef}
      className="neo-panel overflow-x-auto bg-[var(--bg-panel)]"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="block cursor-pointer"
      />
    </div>
  );
});

export default TimelinePanel;
