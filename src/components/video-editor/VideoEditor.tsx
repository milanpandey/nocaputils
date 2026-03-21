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
  type TrackType,
} from "./TimelinePanel";
import ExportPanel from "./ExportPanel";

type FilterPreset = "none" | "grayscale" | "sepia" | "vintage";
type CropPreset = "free" | "16:9" | "1:1" | "9:16";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function formatTime(t: number) {
  if (!Number.isFinite(t)) return "00:00.0";
  const s = Math.max(t, 0);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const tn = Math.floor((s % 1) * 10);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${tn}`;
}

async function buildAudioPeaks(file: File) {
  try {
    const ctx = new AudioContext();
    const buf = await file.arrayBuffer();
    const ab = await ctx.decodeAudioData(buf.slice(0));
    const raw = ab.getChannelData(0);
    const samples = 240;
    const block = Math.max(1, Math.floor(raw.length / samples));
    const peaks = Array.from({ length: samples }, (_, i) => {
      let peak = 0;
      const start = i * block;
      const end = Math.min(start + block, raw.length);
      for (let j = start; j < end; j++) peak = Math.max(peak, Math.abs(raw[j] ?? 0));
      return peak;
    });
    await ctx.close();
    return peaks;
  } catch {
    return [];
  }
}

const MIN_CLIP_DURATION = 0.1;

export default function VideoEditor() {
  /* ---- media state ---- */
  const [videoSrc, setVideoSrc] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [audioPeaks, setAudioPeaks] = useState<number[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  /* ---- timeline state ---- */
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoClips, setVideoClips] = useState<Clip[]>([]);
  const [audioClips, setAudioClips] = useState<Clip[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  /* ---- tool state ---- */
  const [activeTab, setActiveTab] = useState<ToolId>("Trim");
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("none");
  const [textOverlay, setTextOverlay] = useState("");
  const [textSize, setTextSize] = useState(28);
  const [textY, setTextY] = useState(14);

  /* ---- refs ---- */
  const previewRef = useRef<VideoPreviewHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const clipIdRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const playClockStart = useRef(0);
  const playTimelineStart = useRef(0);

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
    // Use max of clip endpoints only (not raw media duration) so it shrinks when clips are removed
    const clipMax = Math.max(ve, ae);
    // Only fall back to raw durations if no clips exist at all
    if (clipMax > 0) return Math.max(clipMax, 0.1);
    return Math.max(videoDuration, audioDuration, 1);
  }, [audioDuration, audioSegments, videoDuration, videoSegments]);

  const previewFilter = useMemo(() => {
    const p = [`brightness(${brightness}%)`, `contrast(${contrast}%)`, `saturate(${saturation}%)`];
    if (filterPreset === "grayscale") p.push("grayscale(100%)");
    if (filterPreset === "sepia") p.push("sepia(100%)");
    if (filterPreset === "vintage") p.push("sepia(35%)", "contrast(110%)", "saturate(85%)", "hue-rotate(-8deg)");
    return p.join(" ");
  }, [brightness, contrast, saturation, filterPreset]);

  const previewTransform = useMemo(() => {
    return `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;
  }, [flipH, flipV, rotation]);

  /* ---- media sync ---- */
  const syncMedia = useCallback(
    (t: number) => {
      seekMediaToTimelineTime(previewRef.current?.getElement() ?? null, videoSegments, t);
      seekMediaToTimelineTime(audioRef.current, audioSegments, t);
    },
    [audioSegments, videoSegments],
  );

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    previewRef.current?.getElement()?.pause();
    audioRef.current?.pause();
  }, []);

  /* ---- handlers ---- */
  const handleVideoFile = useCallback((file: File) => {
    setVideoSrc((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
    setCurrentTime(0);
    setSelection(null);
    setIsPlaying(false);
  }, []);

  const handleAudioFile = useCallback(async (file: File) => {
    setAudioSrc((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
    setSelection(null);
    const peaks = await buildAudioPeaks(file);
    setAudioPeaks(peaks);
  }, []);

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
    if (isPlaying) { stopPlayback(); return; }
    playClockStart.current = performance.now();
    playTimelineStart.current = currentTime;
    setIsPlaying(true);
  }, [audioSrc, currentTime, isPlaying, stopPlayback, videoSrc]);

  const splitSelected = useCallback(() => {
    if (!selection) return;
    const segs = selection.track === "video" ? videoSegments : audioSegments;
    const clip = segs.find((c) => c.id === selection.id);
    if (!clip) return;
    if (currentTime <= clip.timelineStart + MIN_CLIP_DURATION || currentTime >= clip.timelineEnd - MIN_CLIP_DURATION) return;

    const splitSrc = clip.sourceStart + (currentTime - clip.timelineStart);
    const newClip: Clip = { id: clipIdRef.current++, sourceStart: splitSrc, sourceEnd: clip.sourceEnd, timelineStart: currentTime };
    const updater = (items: Clip[]) =>
      items.flatMap((i) => (i.id !== clip.id ? [i] : [{ ...i, sourceEnd: splitSrc }, newClip]));

    if (selection.track === "video") setVideoClips(updater);
    else setAudioClips(updater);
    setSelection({ track: selection.track, id: newClip.id });
  }, [audioSegments, currentTime, selection, videoSegments]);

  const deleteSelected = useCallback(() => {
    if (!selection) return;

    // Remove the clip, then repack to close gaps
    const repack = (items: Clip[]): Clip[] => {
      const remaining = items
        .filter((i) => i.id !== selection.id)
        .sort((a, b) => a.timelineStart - b.timelineStart);
      // Shift each clip so they're contiguous (no gaps)
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
  }, [selection]);

  const clearAudio = useCallback(() => {
    stopPlayback();
    setAudioDuration(0);
    setAudioClips([]);
    setAudioPeaks([]);
    setSelection((s) => (s?.track === "audio" ? null : s));
    setAudioSrc((old) => { if (old) URL.revokeObjectURL(old); return ""; });
  }, [stopPlayback]);

  /* ---- playback loop ---- */
  // Use refs for values accessed inside the animation tick to avoid
  // the effect re-running (and re-calling .play()) on every frame
  const videoSegRef = useRef(videoSegments);
  const audioSegRef = useRef(audioSegments);
  const mutedRef = useRef(muted);
  const playbackRateRef = useRef(playbackRate);
  const totalDurationRef = useRef(totalDuration);
  videoSegRef.current = videoSegments;
  audioSegRef.current = audioSegments;
  mutedRef.current = muted;
  playbackRateRef.current = playbackRate;
  totalDurationRef.current = totalDuration;

  useEffect(() => {
    if (!isPlaying) return;

    // Initial sync + play
    const cTime = playTimelineStart.current;
    syncMedia(cTime);

    const vid = previewRef.current?.getElement();
    if (vid && getClipAtTime(videoSegRef.current, cTime)) void vid.play().catch(() => {});
    if (audioRef.current && getClipAtTime(audioSegRef.current, cTime) && !mutedRef.current)
      void audioRef.current.play().catch(() => {});

    const tick = () => {
      const elapsed = (performance.now() - playClockStart.current) / 1000;
      const next = playTimelineStart.current + elapsed * playbackRateRef.current;
      const dur = totalDurationRef.current;

      if (next >= dur) {
        setCurrentTime(dur);
        stopPlayback();
        return;
      }

      setCurrentTime(next);

      // Sync video
      const v = previewRef.current?.getElement();
      if (v) {
        seekMediaToTimelineTime(v, videoSegRef.current, next);
        if (getClipAtTime(videoSegRef.current, next)) {
          if (v.paused) void v.play().catch(() => {});
        } else {
          v.pause();
        }
      }

      // Sync audio
      const a = audioRef.current;
      if (a) {
        seekMediaToTimelineTime(a, audioSegRef.current, next);
        if (getClipAtTime(audioSegRef.current, next) && !mutedRef.current) {
          if (a.paused) void a.play().catch(() => {});
        } else {
          a.pause();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      // Explicitly pause both on cleanup (when isPlaying becomes false)
      previewRef.current?.getElement()?.pause();
      audioRef.current?.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // When not playing, sync media position to whatever currentTime is (e.g. from scrubbing)
  useEffect(() => {
    if (isPlaying) return;
    syncMedia(currentTime);
  }, [currentTime, isPlaying, syncMedia]);

  /* ---- side effects ---- */
  useEffect(() => {
    const vid = previewRef.current?.getElement();
    if (vid) vid.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [muted, playbackRate, volume]);

  // Only revoke blob URLs on unmount — NOT on every audioSrc/videoSrc change.
  // The individual handlers (handleVideoFile, handleAudioFile, clearAudio) already
  // revoke old URLs when replacing them. This effect just handles component unmount.
  const videoSrcRef = useRef(videoSrc);
  const audioSrcRef = useRef(audioSrc);
  videoSrcRef.current = videoSrc;
  audioSrcRef.current = audioSrc;
  useEffect(() => {
    return () => {
      if (videoSrcRef.current) URL.revokeObjectURL(videoSrcRef.current);
      if (audioSrcRef.current) URL.revokeObjectURL(audioSrcRef.current);
    };
  }, []);

  /* ---- keyboard shortcuts ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (selection) { e.preventDefault(); deleteSelected(); }
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentTime((t) => Math.max(t - (e.shiftKey ? 1 / 30 : 1), 0));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentTime((t) => Math.min(t + (e.shiftKey ? 1 / 30 : 1), totalDuration));
          break;
        case " ":
          e.preventDefault();
          togglePlayback();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, selection, togglePlayback, totalDuration]);

  const onVideoLoaded = useCallback((duration: number) => {
    setVideoDuration(duration);
    const id = clipIdRef.current++;
    setVideoClips([{ id, sourceStart: 0, sourceEnd: duration, timelineStart: 0 }]);
    setSelection({ track: "video", id });
  }, []);

  const onAudioLoaded = useCallback(() => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    const dur = el.duration;
    setAudioDuration(dur);
    const id = clipIdRef.current++;
    setAudioClips([{ id, sourceStart: 0, sourceEnd: dur, timelineStart: 0 }]);
    setSelection({ track: "audio", id });
  }, []);

  /* ---- selected clip info for ToolPanel ---- */
  const selectedClipInfo = selectedClip
    ? {
        track: selection!.track,
        timelineStart: formatTime(selectedClip.timelineStart),
        timelineEnd: formatTime(selectedClip.timelineEnd),
        sourceStart: formatTime(selectedClip.sourceStart),
        sourceEnd: formatTime(selectedClip.sourceEnd),
      }
    : null;

  /* ---- render ---- */
  if (!videoSrc) {
    return (
      <div>
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <Dropzone onFiles={handleFiles} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void handleAudioFile(f);
      }} />

      {/* Header bar */}
      <div className="neo-panel flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-panel)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="neo-button bg-[var(--bg-panel)] px-3 py-2 text-xs font-black uppercase tracking-wider"
          >
            Replace Video
          </button>
          <span className="text-sm font-bold text-[var(--text-soft)]">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
            Zoom
            <input
              type="range"
              min="1"
              max="4"
              step="0.25"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 accent-[var(--accent)]"
            />
            <span className="w-10 text-right">{zoom.toFixed(1)}x</span>
          </label>
          <ExportPanel
            videoSrc={videoSrc}
            audioSrc={audioSrc}
            videoSegments={videoSegments}
            audioSegments={audioSegments}
            brightness={brightness}
            contrast={contrast}
            saturation={saturation}
            filterPreset={filterPreset}
          />
        </div>
      </div>

      {/* Main area: toolbar + preview + tool panel */}
      <div className="flex gap-4">
        {/* Left toolbar */}
        <div className="hidden sm:block">
          <EditorToolbar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Center: video + controls */}
        <div className="min-w-0 flex-1 space-y-3">
          <VideoPreview
            ref={previewRef}
            src={videoSrc}
            filter={previewFilter}
            transform={previewTransform}
            cropPreset={cropPreset}
            textOverlay={textOverlay}
            textSize={textSize}
            textY={textY}
            onLoadedMetadata={onVideoLoaded}
          />

          {/* Controls bar */}
          <div className="neo-panel flex flex-wrap items-center gap-2 bg-[var(--bg-panel)] px-3 py-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="neo-button bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-wider text-black"
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            <button
              type="button"
              onClick={() => setMuted((v) => !v)}
              className="neo-button bg-[var(--bg-panel)] px-3 py-2 text-xs font-black uppercase tracking-wider"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              type="button"
              onClick={splitSelected}
              disabled={!selection}
              className="neo-button bg-[var(--accent)] px-3 py-2 text-xs font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              ✂ Split
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selection}
              className="neo-button bg-[var(--bg-panel)] px-3 py-2 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑 Delete
            </button>
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="neo-button bg-[var(--bg-panel)] px-3 py-2 text-xs font-black uppercase tracking-wider"
            >
              {audioSrc ? "♪ Replace Audio" : "♪ Add Audio"}
            </button>
            {audioSrc && (
              <button
                type="button"
                onClick={clearAudio}
                className="neo-button bg-[var(--bg-panel)] px-3 py-2 text-xs font-black uppercase tracking-wider"
              >
                ✕ Remove Audio
              </button>
            )}
          </div>
        </div>

        {/* Right: tool panel */}
        <div className="hidden w-52 shrink-0 lg:block">
          <div className="neo-panel h-full bg-[var(--bg-panel)] p-4">
            <ToolPanel
              activeTab={activeTab}
              cropPreset={cropPreset}
              onCropPreset={setCropPreset}
              onRotate={(d) => setRotation((v) => v + d)}
              onFlipH={() => setFlipH((v) => !v)}
              onFlipV={() => setFlipV((v) => !v)}
              audioSrc={audioSrc}
              onUploadAudio={() => audioInputRef.current?.click()}
              onClearAudio={clearAudio}
              playbackRate={playbackRate}
              onPlaybackRate={setPlaybackRate}
              volume={volume}
              onVolume={setVolume}
              muted={muted}
              onToggleMute={() => setMuted((v) => !v)}
              filterPreset={filterPreset}
              onFilterPreset={setFilterPreset}
              brightness={brightness}
              onBrightness={setBrightness}
              contrast={contrast}
              onContrast={setContrast}
              saturation={saturation}
              onSaturation={setSaturation}
              textOverlay={textOverlay}
              onTextOverlay={setTextOverlay}
              textSize={textSize}
              onTextSize={setTextSize}
              textY={textY}
              onTextY={setTextY}
              selectedClipInfo={selectedClipInfo}
            />
          </div>
        </div>
      </div>

      {/* Mobile tab bar (visible on small screens) */}
      <div className="flex gap-2 overflow-x-auto sm:hidden">
        {(["Trim", "Crop", "Audio", "Filters", "Text"] as ToolId[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`shrink-0 border-3 border-[var(--border-main)] px-3 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] ${
              activeTab === t ? "bg-[var(--accent)]" : "bg-[var(--bg-panel)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mobile tool panel */}
      <div className="lg:hidden">
        <div className="neo-panel bg-[var(--bg-panel)] p-4">
          <ToolPanel
            activeTab={activeTab}
            cropPreset={cropPreset}
            onCropPreset={setCropPreset}
            onRotate={(d) => setRotation((v) => v + d)}
            onFlipH={() => setFlipH((v) => !v)}
            onFlipV={() => setFlipV((v) => !v)}
            audioSrc={audioSrc}
            onUploadAudio={() => audioInputRef.current?.click()}
            onClearAudio={clearAudio}
            playbackRate={playbackRate}
            onPlaybackRate={setPlaybackRate}
            volume={volume}
            onVolume={setVolume}
            muted={muted}
            onToggleMute={() => setMuted((v) => !v)}
            filterPreset={filterPreset}
            onFilterPreset={setFilterPreset}
            brightness={brightness}
            onBrightness={setBrightness}
            contrast={contrast}
            onContrast={setContrast}
            saturation={saturation}
            onSaturation={setSaturation}
            textOverlay={textOverlay}
            onTextOverlay={setTextOverlay}
            textSize={textSize}
            onTextSize={setTextSize}
            textY={textY}
            onTextY={setTextY}
            selectedClipInfo={selectedClipInfo}
          />
        </div>
      </div>

      {/* Timeline */}
      <TimelinePanel
        videoSegments={videoSegments}
        audioSegments={audioSegments}
        audioPeaks={audioPeaks}
        totalDuration={totalDuration}
        videoTrackEnd={videoSegments[videoSegments.length - 1]?.timelineEnd ?? 0}
        currentTime={currentTime}
        zoom={zoom}
        selection={selection}
        onTimeChange={setCurrentTime}
        onSelectionChange={setSelection}
        onVideoClipsUpdate={(fn) => setVideoClips(fn)}
        onAudioClipsUpdate={(fn) => setAudioClips(fn)}
        onStopPlayback={stopPlayback}
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
