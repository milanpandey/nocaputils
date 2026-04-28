"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import NCSVisualizerCanvas, {
  renderVisualizerFrame,
  type Particle,
  type RenderFrameState,
} from "./NCSVisualizerCanvas";
import {
  useAudioEngine,
  getFrequencyDataAtTime,
  renderAudioOffline,
  audioBufferToWav,
  type OfflineAudioEffects,
} from "./useAudioEngine";

/* ======================================================================
   Constants
   ====================================================================== */

const VIS_STYLES = [
  { id: "ncs_bars", label: "NCS Radial Bars" },
  { id: "ncs_wave", label: "Circular Wave" },
  { id: "ncs_dots", label: "Particle Ring" },
  { id: "bars_bottom", label: "Spectrum Bars" },
];

const AUDIO_EFFECTS = [
  { id: "none", label: "Normal (None)" },
  { id: "bass_boost", label: "Bass Boosted" },
  { id: "slowed_reverb", label: "Slowed + Reverb" },
  { id: "nightcore", label: "Nightcore (Sped up)" },
  { id: "custom", label: "Custom" },
];

const THEME_COLORS = [
  { hex: "#ffffff", label: "White" },
  { hex: "#00ffff", label: "Cyan" },
  { hex: "#ff00ff", label: "Magenta" },
  { hex: "#faff00", label: "Yellow" },
  { hex: "#00ff88", label: "Lime" },
  { hex: "#ff6b6b", label: "Coral" },
  { hex: "#4d9fff", label: "Sky" },
  { hex: "#ff8800", label: "Orange" },
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 (YouTube)", w: 1920, h: 1080 },
  { id: "9:16", label: "9:16 (Shorts)", w: 1080, h: 1920 },
];

const GLOW_LEVELS = [
  { value: 0, label: "Low" },
  { value: 1, label: "Medium" },
  { value: 2, label: "High" },
];

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const EXPORT_FPS = 30;

/* ======================================================================
   Component
   ====================================================================== */

export default function MusicVisualizerPanel() {
  // ── Audio files ──
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  // ── Object URLs ──
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [thumbImageUrl, setThumbImageUrl] = useState<string | null>(null);

  // ── Visualization ──
  const [visStyle, setVisStyle] = useState("ncs_bars");
  const [visColor, setVisColor] = useState("#ffffff");

  // ── Text ──
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  // ── Layout & overlays ──
  const [aspect, setAspect] = useState("16:9");
  const [showSeekBar, setShowSeekBar] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const [particleDensity, setParticleDensity] = useState(60);
  const [particleSpeed, setParticleSpeed] = useState(1.0);
  const [particleSize, setParticleSize] = useState(1.0);
  const [reactivity, setReactivity] = useState(1.0);
  const [glowLevel, setGlowLevel] = useState(1);
  const [rotating, setRotating] = useState(false);

  // ── Audio effects ──
  const [audioEffect, setAudioEffect] = useState("none");
  const [preservePitch, setPreservePitch] = useState(true);
  const [customSpeed, setCustomSpeed] = useState(1.0);
  const [customBassGain, setCustomBassGain] = useState(0);
  const [customReverbMix, setCustomReverbMix] = useState(0);

  // ── Export ──
  const [isExporting, setIsExporting] = useState(false);
  const [isRemuxing, setIsRemuxing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Preview ──
  const [previewStart, setPreviewStart] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // ── UI ──
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // ── Refs ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ffmpegRef = useRef<any>(null);
  const cancelledRef = useRef(false);

  // ── Audio engine ──
  const engine = useAudioEngine();

  const aspectCfg = ASPECT_RATIOS.find((a) => a.id === aspect) || ASPECT_RATIOS[0];

  /* ────────────────────────────────────────────────────────────────────
     Object‑URL lifecycle
     ──────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (bgFile) {
      const u = URL.createObjectURL(bgFile);
      setBgImageUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setBgImageUrl(null);
  }, [bgFile]);

  useEffect(() => {
    if (thumbFile) {
      const u = URL.createObjectURL(thumbFile);
      setThumbImageUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setThumbImageUrl(null);
  }, [thumbFile]);

  /* ────────────────────────────────────────────────────────────────────
     Init engine when audio changes
     ──────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (audioFile) {
      engine.init(audioFile).catch((e) => setErrorMsg(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile]);

  /* ────────────────────────────────────────────────────────────────────
     Apply audio effect preset
     ──────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!engine.isReady) return;

    switch (audioEffect) {
      case "none":
        engine.setSpeed(1.0);
        engine.setBassGain(0);
        engine.setReverbMix(0);
        engine.setPreservePitch(true);
        break;
      case "bass_boost":
        engine.setSpeed(1.0);
        engine.setBassGain(14);
        engine.setReverbMix(0);
        engine.setPreservePitch(true);
        break;
      case "slowed_reverb":
        engine.setSpeed(0.85);
        engine.setBassGain(3);
        engine.setReverbMix(0.4);
        engine.setPreservePitch(false);
        break;
      case "nightcore":
        engine.setSpeed(1.25);
        engine.setBassGain(0);
        engine.setReverbMix(0);
        engine.setPreservePitch(preservePitch);
        break;
      case "custom":
        engine.setSpeed(customSpeed);
        engine.setBassGain(customBassGain);
        engine.setReverbMix(customReverbMix);
        engine.setPreservePitch(preservePitch);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEffect, preservePitch, customSpeed, customBassGain, customReverbMix, engine.isReady]);

  /* ────────────────────────────────────────────────────────────────────
     Mute control
     ──────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    engine.setMuted(isMuted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted]);

  /* (export progress is now driven directly by the offline render loop) */

  /* ────────────────────────────────────────────────────────────────────
     Export handlers
     ──────────────────────────────────────────────────────────────────── */

  /* ────────────────────────────────────────────────────────────────────
     Load FFmpeg WASM (shared between preview & full export)
     ──────────────────────────────────────────────────────────────────── */

  const ensureFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  /* ────────────────────────────────────────────────────────────────────
     Offline frame-by-frame renderer (used by both preview & full export)
     ──────────────────────────────────────────────────────────────────── */

  const offlineRender = useCallback(async (
    mode: "preview" | "full"
  ) => {
    if (!audioFile || !canvasRef.current) return;

    cancelledRef.current = false;
    setIsExporting(true);
    setIsRemuxing(false);
    setExportProgress(0);
    setErrorMsg("");
    if (mode === "preview") {
      setIsPreviewMode(true);
      setPreviewUrl("");
    } else {
      setIsPreviewMode(false);
      setExportUrl("");
    }

    // Pause live playback so we own the canvas
    engine.pause();

    try {
      // 1. Decode the raw audio file
      const arrayBuf = await audioFile.arrayBuffer();
      const audioCtx = new AudioContext();
      const rawBuffer = await audioCtx.decodeAudioData(arrayBuf);
      audioCtx.close();

      // 2. Resolve the current audio effect settings
      let fxSpeed = 1, fxBass = 0, fxReverb = 0, fxPitch = true;
      switch (audioEffect) {
        case "bass_boost":
          fxBass = 14;
          break;
        case "slowed_reverb":
          fxSpeed = 0.85; fxBass = 3; fxReverb = 0.4; fxPitch = false;
          break;
        case "nightcore":
          fxSpeed = 1.25; fxPitch = preservePitch;
          break;
        case "custom":
          fxSpeed = customSpeed; fxBass = customBassGain;
          fxReverb = customReverbMix; fxPitch = preservePitch;
          break;
        // "none" — all defaults
      }

      const fx: OfflineAudioEffects = {
        speed: fxSpeed,
        bassGain: fxBass,
        reverbMix: fxReverb,
        preservePitch: fxPitch,
      };

      // 3. Render audio through the effect chain offline
      const processedBuffer = await renderAudioOffline(rawBuffer, fx);
      const processedDuration = processedBuffer.duration;

      const startSec = mode === "preview" ? Math.min(previewStart / fxSpeed, processedDuration) : 0;
      const endSec = mode === "preview"
        ? Math.min(startSec + 10, processedDuration)
        : processedDuration;
      const totalFrames = Math.ceil((endSec - startSec) * EXPORT_FPS);

      // 4. Create an offscreen canvas at full export resolution
      const W = aspectCfg.w;
      const H = aspectCfg.h;
      const offCanvas = document.createElement("canvas");
      offCanvas.width = W;
      offCanvas.height = H;
      const offCtx = offCanvas.getContext("2d", { alpha: false })!;

      // 5. Load background & thumbnail images for the offscreen canvas
      const loadImg = (url: string | null): Promise<HTMLImageElement | null> => {
        if (!url) return Promise.resolve(null);
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const [bgImg, thumbImg] = await Promise.all([
        loadImg(bgImageUrl),
        loadImg(thumbImageUrl),
      ]);

      // 6. Initialise render state (smoothing, particles, beat detection)
      const smoothed = new Float32Array(180);
      const particles: Particle[] = [];
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random(),
          y: Math.random(),
          vy: -(0.0005 + Math.random() * 0.001),
          size: 0.8 + Math.random() * 1.2,
          opacity: 0.15 + Math.random() * 0.25,
        });
      }
      const renderState: RenderFrameState = {
        smoothed,
        particles,
        beat: {
          rollingAvg: 0,
          lastBeatTime: 0,
          flashAlpha: 0,
          pulseScale: 1,
          glowBoost: 0,
        },
      };

      // 7. Load FFmpeg & write the processed audio as WAV
      const ffmpeg = await ensureFFmpeg();
      const wavBytes = audioBufferToWav(processedBuffer);
      const audioFSName = "processed_audio.wav";
      await ffmpeg.writeFile(audioFSName, wavBytes);

      // 6. Frame-by-frame render loop
      const BATCH = 30; // yield every 30 frames for UI responsiveness

      for (let f = 0; f < totalFrames; f++) {
        if (cancelledRef.current) break;

        const timeSec = startSec + f / EXPORT_FPS;
        // FFT runs against the processed buffer (effects already baked in)
        const freqData = getFrequencyDataAtTime(processedBuffer, timeSec, 2048);

        renderVisualizerFrame(offCtx, {
          width: W,
          height: H,
          freqData,
          visStyle,
          visColor,
          isPlaying: true,
          currentTime: timeSec,
          duration: processedDuration,
          showSeekBar,
          showParticles,
          particleSpeed,
          reactivity,
          glowLevel,
          rotating,
          title,
          artist,
          bgImg,
          thumbImg,
        }, renderState);

        // Capture as JPEG and write to FFmpeg FS
        const blob = await new Promise<Blob>((res) =>
          offCanvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
        );
        const frameBuf = new Uint8Array(await blob.arrayBuffer());
        const frameName = `frame_${String(f).padStart(6, "0")}.jpg`;
        await ffmpeg.writeFile(frameName, frameBuf);

        // Update progress
        setExportProgress(Math.round(((f + 1) / totalFrames) * 90)); // 0-90% for frames

        // Yield to event loop periodically
        if ((f + 1) % BATCH === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      if (cancelledRef.current) {
        // Cleanup partial frames
        for (let f = 0; f < totalFrames; f++) {
          try { await ffmpeg.deleteFile(`frame_${String(f).padStart(6, "0")}.jpg`); } catch {}
        }
        try { await ffmpeg.deleteFile(audioFSName); } catch {}
        setIsExporting(false);
        setIsPreviewMode(false);
        return;
      }

      // 7. Assemble with FFmpeg
      setIsRemuxing(true);
      setExportProgress(92);

      const ffArgs = [
        "-framerate", String(EXPORT_FPS),
        "-i", "frame_%06d.jpg",
        "-ss", String(startSec),
        "-t", String(endSec - startSec),
        "-i", audioFSName,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-ac", "2",
        "-shortest",
        "-movflags", "+faststart",
        "output.mp4",
      ];

      await ffmpeg.exec(ffArgs);
      setExportProgress(98);

      // 8. Read result
      const data = await ffmpeg.readFile("output.mp4");
      const finalBlob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(finalBlob);

      if (mode === "preview") {
        setPreviewUrl(url);
      } else {
        setExportUrl(url);
      }

      // 9. Cleanup FFmpeg FS
      for (let f = 0; f < totalFrames; f++) {
        try { await ffmpeg.deleteFile(`frame_${String(f).padStart(6, "0")}.jpg`); } catch {}
      }
      try { await ffmpeg.deleteFile(audioFSName); } catch {}
      try { await ffmpeg.deleteFile("output.mp4"); } catch {}

      setExportProgress(100);
    } catch (err: any) {
      console.error("Export failed:", err);
      setErrorMsg(err.message || "Export failed.");
    } finally {
      setIsExporting(false);
      setIsRemuxing(false);
      setIsPreviewMode(false);
    }
  }, [
    audioFile, engine, previewStart, aspectCfg,
    bgImageUrl, thumbImageUrl, ensureFFmpeg,
    visStyle, visColor, showSeekBar, showParticles,
    particleSpeed, reactivity, glowLevel, rotating,
    title, artist,
    audioEffect, preservePitch, customSpeed, customBassGain, customReverbMix,
  ]);

  const handleExport = useCallback(() => offlineRender("full"), [offlineRender]);
  const handlePreview = useCallback(() => offlineRender("preview"), [offlineRender]);

  const handleCancelExport = useCallback(() => {
    cancelledRef.current = true;
    setIsExporting(false);
    setIsRemuxing(false);
    setExportProgress(0);
    setIsPreviewMode(false);
  }, []);

  /* ────────────────────────────────────────────────────────────────────
     Derived values
     ──────────────────────────────────────────────────────────────────── */

  const effectiveSpeed =
    audioEffect === "slowed_reverb" ? 0.85
      : audioEffect === "nightcore" ? 1.25
        : audioEffect === "custom" ? customSpeed
          : 1.0;

  const effectivePreservePitch =
    audioEffect === "slowed_reverb" ? false
      : audioEffect === "custom" || audioEffect === "nightcore" ? preservePitch
        : true;

  const semitoneShift = effectivePreservePitch
    ? 0
    : +(12 * Math.log2(effectiveSpeed)).toFixed(1);

  const downloadExt = "mp4";

  /* ────────────────────────────────────────────────────────────────────
     Drop handler
     ──────────────────────────────────────────────────────────────────── */

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i))) {
      setAudioFile(f);
    } else {
      alert("Please upload a valid audio file.");
    }
  };

  const handleRemoveAudio = () => {
    engine.cleanup();
    setAudioFile(null);
    setBgFile(null);
    setThumbFile(null);
    setExportUrl("");
    setErrorMsg("");
    setTitle("");
    setArtist("");
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* ── Drop zone (no audio) ── */}
      {!audioFile ? (
        <div
          className={`w-full h-80 border-4 border-dashed border-black flex flex-col items-center justify-center bg-[var(--bg-panel)] transition-all cursor-pointer shadow-[8px_8px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000] ${isHovering ? "bg-accent/10" : ""
            }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsHovering(true);
          }}
          onDragLeave={() => setIsHovering(false)}
          onDrop={handleAudioDrop}
          onClick={() => document.getElementById("audio-upload")?.click()}
        >
          <input
            id="audio-upload"
            type="file"
            accept="audio/*,.m4a,.ogg,.flac"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setAudioFile(e.target.files[0])}
          />
          <div className="text-6xl mb-4">🎵</div>
          <span className="text-3xl font-black uppercase tracking-tighter text-[var(--text-main)]">
            Drop Audio Track Here
          </span>
          <span className="text-sm font-bold mt-2 uppercase tracking-widest text-[var(--text-soft)]">
            MP3, WAV, M4A, OGG, FLAC supported
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ──────────────────────────────────────────────────────────
             LIVE PREVIEW CANVAS
             ────────────────────────────────────────────────────────── */}
          <div className="neo-panel bg-black p-0 overflow-hidden">
            <NCSVisualizerCanvas
              canvasRef={canvasRef}
              width={aspectCfg.w}
              height={aspectCfg.h}
              getFrequencyData={engine.getFrequencyData}
              getTimeDomainData={engine.getTimeDomainData}
              isPlaying={engine.isPlaying}
              currentTime={engine.currentTime}
              duration={engine.duration}
              visStyle={visStyle}
              visColor={visColor}
              bgImageUrl={bgImageUrl}
              thumbImageUrl={thumbImageUrl}
              title={title}
              artist={artist}
              showSeekBar={showSeekBar}
              showParticles={showParticles}
              particleDensity={particleDensity}
              particleSpeed={particleSpeed}
              particleSize={particleSize}
              reactivity={reactivity}
              glowLevel={glowLevel}
              rotating={rotating}
            />
          </div>

          {/* ──────────────────────────────────────────────────────────
             TRANSPORT CONTROLS
             ────────────────────────────────────────────────────────── */}
          <div className="neo-panel bg-[var(--bg-panel)] p-4 flex items-center gap-4">
            <button
              onClick={() => (engine.isPlaying ? engine.pause() : engine.play())}
              disabled={!engine.isReady || isExporting}
              className="w-12 h-12 flex items-center justify-center border-4 border-black bg-accent text-black font-black text-xl shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-40"
            >
              {engine.isPlaying ? "⏸" : "▶"}
            </button>

            <input
              type="range"
              min="0"
              max={engine.duration || 0}
              step="0.1"
              value={engine.currentTime}
              onChange={(e) => engine.seek(Number(e.target.value))}
              className="flex-1 vis-range"
              disabled={isExporting}
            />

            <span className="text-sm font-black font-mono tracking-wider text-[var(--text-main)] min-w-[90px] text-right">
              {fmtTime(engine.currentTime)} / {fmtTime(engine.duration)}
            </span>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-xl w-10 h-10 flex items-center justify-center"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* ──────────────────────────────────────────────────────────
             SETTINGS GRID
             ────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ─── Panel 1: Media Assets ─── */}
            <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-4">
              <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
                1. Media Assets
              </h3>

              {/* Audio indicator */}
              <div className="p-4 border-4 border-black bg-accent flex justify-between items-center">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-2xl">🎵</span>
                  <span className="font-black uppercase truncate text-black">{audioFile.name}</span>
                </div>
                <button
                  onClick={handleRemoveAudio}
                  className="font-black uppercase bg-white px-2 py-1 border-2 border-black text-black"
                >
                  X
                </button>
              </div>

              {/* Thumbnail & Background */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                    Thumbnail (Circle)
                  </label>
                  <input
                    type="file"
                    id="thumb-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setThumbFile(e.target.files[0])}
                  />
                  {thumbFile ? (
                    <div className="space-y-2">
                      <div className="w-full aspect-square border-4 border-black bg-[var(--bg-panel-muted)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbImageUrl!} alt="Thumb" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => setThumbFile(null)}
                        className="w-full text-xs uppercase font-black text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => document.getElementById("thumb-upload")?.click()}
                      className="w-full h-24 border-4 border-black font-black uppercase flex items-center justify-center bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      + Cover Art
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                    Background Image
                  </label>
                  <input
                    type="file"
                    id="bg-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setBgFile(e.target.files[0])}
                  />
                  {bgFile ? (
                    <div className="space-y-2">
                      <div className="w-full aspect-square border-4 border-black bg-[var(--bg-panel-muted)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bgImageUrl!} alt="BG" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => setBgFile(null)}
                        className="w-full text-xs uppercase font-black text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => document.getElementById("bg-upload")?.click()}
                      className="w-full h-24 border-4 border-black font-black uppercase flex items-center justify-center bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      + Upload BG
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Panel 2: Text & Overlays ─── */}
            <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-4">
              <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
                2. Text &amp; Overlays
              </h3>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Song Title
                </label>
                <input
                  type="text"
                  value={title}
                  placeholder="e.g. Lost In Space"
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[var(--bg-panel)] border-4 border-black p-3 text-sm font-bold focus:outline-none focus:border-accent text-[var(--text-main)] placeholder:text-[var(--text-soft)] placeholder:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={artist}
                  placeholder="e.g. Elektronomia"
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-[var(--bg-panel)] border-4 border-black p-3 text-sm font-bold focus:outline-none focus:border-accent text-[var(--text-main)] placeholder:text-[var(--text-soft)] placeholder:opacity-40"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="seekbar-toggle"
                  className="w-5 h-5 accent-[var(--accent)] border-2 border-black"
                  checked={showSeekBar}
                  onChange={(e) => setShowSeekBar(e.target.checked)}
                />
                <label htmlFor="seekbar-toggle" className="font-black uppercase tracking-widest cursor-pointer text-[var(--text-main)]">
                  Show Seek Bar Overlay
                </label>
              </div>

              {/* Particles Overlay */}
              <div className="space-y-4 p-4 border-4 border-black bg-[var(--bg-panel-muted)]">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="particles-toggle"
                    className="w-5 h-5 accent-[var(--accent)] border-2 border-black"
                    checked={showParticles}
                    onChange={(e) => setShowParticles(e.target.checked)}
                  />
                  <label htmlFor="particles-toggle" className="font-black uppercase tracking-widest cursor-pointer text-[var(--text-main)]">
                    Floating Particles
                  </label>
                </div>

                {showParticles && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                        <span>Density</span>
                        <span className="text-[var(--text-main)]">{particleDensity}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="10"
                        value={particleDensity}
                        onChange={(e) => setParticleDensity(Number(e.target.value))}
                        className="w-full vis-range"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                        <span>Speed</span>
                        <span className="text-[var(--text-main)]">{particleSpeed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={particleSpeed}
                        onChange={(e) => setParticleSpeed(Number(e.target.value))}
                        className="w-full vis-range"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                        <span>Size</span>
                        <span className="text-[var(--text-main)]">{particleSize.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="4.0"
                        step="0.1"
                        value={particleSize}
                        onChange={(e) => setParticleSize(Number(e.target.value))}
                        className="w-full vis-range"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ASPECT_RATIOS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAspect(a.id)}
                      className={`border-4 border-black p-3 font-black uppercase transition-all shadow-[4px_4px_0_0_#000] text-sm ${aspect === a.id
                        ? "bg-accent text-black translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_0_#000]"
                        : "bg-white text-black"
                        }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Panel 3: Visualization ─── */}
            <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-5">
              <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
                3. Visualization
              </h3>

              {/* Style selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Visualizer Style
                </label>
                <select
                  value={visStyle}
                  onChange={(e) => setVisStyle(e.target.value)}
                  className="w-full bg-[var(--bg-panel)] border-4 border-black p-3 text-sm font-black uppercase focus:outline-none cursor-pointer text-[var(--text-main)]"
                >
                  {VIS_STYLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme color */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Theme Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setVisColor(c.hex)}
                      className={`w-9 h-9 border-4 border-black transition-all ${visColor === c.hex
                        ? "scale-110 shadow-[2px_2px_0_0_#000]"
                        : "opacity-60 hover:opacity-100"
                        }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Reactivity */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Reactivity ({reactivity.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={reactivity}
                  onChange={(e) => setReactivity(Number(e.target.value))}
                  className="w-full vis-range"
                />
              </div>

              {/* Glow Level */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Glow Intensity
                </label>
                <div className="flex gap-2">
                  {GLOW_LEVELS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGlowLevel(g.value)}
                      className={`flex-1 border-4 border-black p-2 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] transition-all ${glowLevel === g.value
                        ? "bg-accent text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0_0_#000]"
                        : "bg-white text-black"
                        }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-rotate */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rotate-toggle"
                  className="w-5 h-5 accent-[var(--accent)] border-2 border-black"
                  checked={rotating}
                  onChange={(e) => setRotating(e.target.checked)}
                />
                <label htmlFor="rotate-toggle" className="font-black uppercase tracking-widest cursor-pointer text-[var(--text-main)]">
                  Auto-Rotate Visualization
                </label>
              </div>
            </div>

            {/* ─── Panel 4: Audio Effects ─── */}
            <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-5">
              <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
                4. Audio Effects
              </h3>

              {/* Preset selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-[var(--text-soft)]">
                  Effect Preset
                </label>
                <select
                  value={audioEffect}
                  onChange={(e) => setAudioEffect(e.target.value)}
                  className="w-full bg-[var(--bg-panel)] border-4 border-black p-3 text-sm font-black uppercase focus:outline-none cursor-pointer text-[var(--text-main)]"
                >
                  {AUDIO_EFFECTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preserve pitch (Nightcore & Custom) */}
              {(audioEffect === "nightcore" || audioEffect === "custom") && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="preserve-pitch"
                    className="w-5 h-5 accent-[var(--accent)] border-2 border-black"
                    checked={preservePitch}
                    onChange={(e) => setPreservePitch(e.target.checked)}
                  />
                  <label htmlFor="preserve-pitch" className="font-black uppercase tracking-widest cursor-pointer text-[var(--text-main)]">
                    Preserve Pitch
                  </label>
                </div>
              )}

              {/* Custom controls */}
              {audioEffect === "custom" && (
                <div className="space-y-4 p-4 border-4 border-black bg-[var(--bg-panel-muted)]">
                  {/* Speed */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Speed</span>
                      <span className="text-[var(--text-main)]">{customSpeed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="2.0"
                      step="0.05"
                      value={customSpeed}
                      onChange={(e) => setCustomSpeed(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Bass Boost */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Bass Boost</span>
                      <span className="text-[var(--text-main)]">{customBassGain > 0 ? "+" : ""}{customBassGain} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="24"
                      step="1"
                      value={customBassGain}
                      onChange={(e) => setCustomBassGain(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Reverb */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Reverb</span>
                      <span className="text-[var(--text-main)]">{Math.round(customReverbMix * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={customReverbMix}
                      onChange={(e) => setCustomReverbMix(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Effective pitch */}
                  <div className="p-3 border-2 border-black bg-[var(--bg-panel)] flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">Effective Pitch</span>
                    <span className="font-black text-lg text-[var(--text-main)]">
                      {semitoneShift > 0 ? "+" : ""}
                      {semitoneShift} <span className="text-xs">semitones</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Pitch info for Nightcore */}
              {audioEffect === "nightcore" && (
                <div className="p-3 border-4 border-black bg-[var(--bg-panel-muted)] text-xs uppercase font-black tracking-widest text-[var(--text-soft)]">
                  Speed: 1.25x &middot; Pitch: {effectivePreservePitch ? "±0" : "+3.9"} semitones
                </div>
              )}

              {/* Info for Slowed+Reverb */}
              {audioEffect === "slowed_reverb" && (
                <div className="p-3 border-4 border-black bg-[var(--bg-panel-muted)] text-xs uppercase font-black tracking-widest text-[var(--text-soft)]">
                  Speed: 0.85x &middot; Pitch: -2.8 semitones &middot; Reverb: 40%
                </div>
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
             EXPORT PANEL
             ────────────────────────────────────────────────────────── */}
          <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-4">
            <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
              5. Export Video
            </h3>

            {errorMsg && (
              <div className="bg-red-100 border-l-8 border-red-500 p-4 text-xs font-black text-red-600 uppercase dark:bg-red-900/20 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Preview start slider */}
            {engine.duration > 10 && (
              <div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                  <span>Preview Start</span>
                  <span className="text-[var(--text-main)]">
                    {fmtTime(previewStart)} / {fmtTime(engine.duration)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, engine.duration - 10)}
                  step="1"
                  value={previewStart}
                  onChange={(e) => setPreviewStart(Number(e.target.value))}
                  className="w-full vis-range"
                  disabled={isExporting}
                />
              </div>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-1 text-[var(--text-main)]">
                <span>
                  {isRemuxing
                    ? "Encoding MP4..."
                    : isExporting
                      ? `Rendering frames${isPreviewMode ? " (Preview)" : ""}...`
                      : "Ready"}
                </span>
                <span>{exportProgress}%</span>
              </div>
              <div className="h-6 bg-[var(--bg-panel-muted)] border-4 border-black relative">
                <div
                  className={`h-full bg-accent transition-all duration-300 ${isRemuxing ? "animate-pulse" : ""}`}
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              {isExporting && !isRemuxing && (
                <p className="text-xs text-[var(--text-soft)] mt-1">
                  Rendering offline — no audio plays during export. This is faster than real-time.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Preview 10s */}
              <button
                onClick={isExporting && isPreviewMode ? handleCancelExport : handlePreview}
                disabled={!engine.isReady || (isExporting && !isPreviewMode)}
                className={`w-full border-4 border-black py-4 text-lg font-black uppercase shadow-[6px_6px_0_0_#000] transition-all ${
                  isExporting && isPreviewMode
                    ? "bg-red-500 text-white hover:bg-red-600 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000]"
                    : "bg-[var(--bg-panel-muted)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] disabled:opacity-40"
                }`}
              >
                {isExporting && isPreviewMode ? "Cancel" : "Preview 10s"}
              </button>

              {/* Export Full */}
              <button
                onClick={isExporting && !isPreviewMode ? handleCancelExport : handleExport}
                disabled={!engine.isReady || (isExporting && isPreviewMode)}
                className={`w-full border-4 border-black py-4 text-lg font-black uppercase shadow-[6px_6px_0_0_#000] transition-all ${
                  isExporting && !isPreviewMode
                    ? "bg-red-500 text-white hover:bg-red-600 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000]"
                    : "bg-accent text-black hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] disabled:opacity-40"
                }`}
              >
                {isExporting && !isPreviewMode
                  ? isRemuxing ? "Encoding..." : "Cancel Export"
                  : "Export Full Video"}
              </button>

              {/* Download */}
              {exportUrl && (
                <a
                  href={exportUrl}
                  download={`visualizer_export.${downloadExt}`}
                  className="block w-full text-center border-4 border-black bg-emerald-500 text-white py-4 text-lg font-black uppercase shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] transition-all"
                >
                  Download {downloadExt.toUpperCase()}
                </a>
              )}
            </div>

            {/* Inline preview player */}
            {previewUrl && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                  Preview ({fmtTime(previewStart)} – {fmtTime(Math.min(previewStart + 10, engine.duration))})
                </h4>
                <div className="border-4 border-black bg-black">
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    className="w-full"
                    style={{
                      maxHeight: "50vh",
                      aspectRatio: `${aspectCfg.w}/${aspectCfg.h}`,
                      margin: "0 auto",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
