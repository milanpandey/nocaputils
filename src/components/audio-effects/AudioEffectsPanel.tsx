"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useAudioEffectsEngine,
  renderAudioOffline,
  audioBufferToWav,
  type OfflineAudioEffects,
} from "./useAudioEffectsEngine";

/* ======================================================================
   Constants & preset definitions
   ====================================================================== */

const PRESETS = [
  { id: "none",          label: "Original",      icon: "🎵" },
  { id: "bass_boost",    label: "Bass Boost",    icon: "🔊" },
  { id: "slowed_reverb", label: "Slowed + Reverb",icon: "🌊" },
  { id: "nightcore",     label: "Nightcore",     icon: "⚡" },
  { id: "lofi",          label: "Lo-Fi",         icon: "📻" },
  { id: "telephone",     label: "Telephone",     icon: "📞" },
  { id: "chipmunk",      label: "Chipmunk",      icon: "🐿️" },
  { id: "deep_voice",    label: "Deep Voice",    icon: "🎸" },
  { id: "vaporwave",     label: "Vaporwave",     icon: "🌴" },
  { id: "underwater",    label: "Underwater",    icon: "💧" },
  { id: "echo_space",    label: "Echo Space",    icon: "🌌" },
  { id: "custom",        label: "Custom",        icon: "🎛️" },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

/** Resolve a preset ID into concrete OfflineAudioEffects params */
function resolvePreset(
  id: PresetId,
  custom: { speed: number; pitch: number; bass: number; treble: number; lowpass: number; reverb: number; delayTime: number; delayFeedback: number; delayMix: number; gain: number }
): OfflineAudioEffects {
  const defaults = { speed: 1, bassGain: 0, trebleGain: 0, lowpassFreq: 20000, reverbMix: 0, delayTime: 0, delayFeedback: 0, delayMix: 0, preservePitch: true, gain: 0 };
  switch (id) {
    case "bass_boost":
      return { ...defaults, bassGain: 14 };
    case "slowed_reverb":
      return { ...defaults, speed: 0.85, bassGain: 3, reverbMix: 0.4, preservePitch: false };
    case "nightcore":
      return { ...defaults, speed: 1.25, preservePitch: false };
    case "lofi":
      return { ...defaults, speed: 0.92, bassGain: -4, trebleGain: -6, lowpassFreq: 4000, reverbMix: 0.3, gain: -2 };
    case "telephone":
      return { ...defaults, bassGain: -24, trebleGain: -12, lowpassFreq: 3500, gain: 6 };
    case "chipmunk":
      return { ...defaults, speed: 1.6, preservePitch: false };
    case "deep_voice":
      return { ...defaults, speed: 0.7, bassGain: 8, reverbMix: 0.15, preservePitch: false };
    case "vaporwave":
      return { ...defaults, speed: 0.78, bassGain: 2, reverbMix: 0.55, preservePitch: false, gain: -1 };
    case "underwater":
      return { ...defaults, lowpassFreq: 800, reverbMix: 0.6, bassGain: 6 };
    case "echo_space":
      return { ...defaults, delayTime: 0.5, delayFeedback: 0.4, delayMix: 0.6, reverbMix: 0.3 };
    case "custom": {
      const pitchFactor = Math.pow(2, custom.pitch / 12);
      return {
        speed: custom.speed * pitchFactor,
        bassGain: custom.bass,
        trebleGain: custom.treble,
        lowpassFreq: custom.lowpass,
        reverbMix: custom.reverb,
        delayTime: custom.delayTime,
        delayFeedback: custom.delayFeedback,
        delayMix: custom.delayMix,
        preservePitch: custom.pitch === 0,
        gain: custom.gain,
      };
    }
    default: // "none"
      return defaults;
  }
}

/** Format seconds as mm:ss */
function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ======================================================================
   Component
   ====================================================================== */

export default function AudioEffectsPanel() {
  // ── File ──
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  // ── Preset ──
  const [preset, setPreset] = useState<PresetId>("none");

  // ── Custom controls ──
  const [customSpeed, setCustomSpeed] = useState(1.0);
  const [customPitch, setCustomPitch] = useState(0);
  const [customBass, setCustomBass] = useState(0);
  const [customTreble, setCustomTreble] = useState(0);
  const [customLowpass, setCustomLowpass] = useState(20000);
  const [customReverb, setCustomReverb] = useState(0);
  const [customDelayTime, setCustomDelayTime] = useState(0);
  const [customDelayFeedback, setCustomDelayFeedback] = useState(0);
  const [customDelayMix, setCustomDelayMix] = useState(0);
  const [customGain, setCustomGain] = useState(0);

  // ── Export ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Waveform ──
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  // ── Audio engine for live preview ──
  const engine = useAudioEffectsEngine();

  // ── Init engine on file change ──
  useEffect(() => {
    if (audioFile) {
      setFileName(audioFile.name);
      setDownloadUrl("");
      setErrorMsg("");
      engine.init(audioFile).catch((e) => setErrorMsg(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile]);

  // ── Apply preset to live engine ──
  useEffect(() => {
    if (!engine.isReady) return;

    const fx = resolvePreset(preset, {
      speed: customSpeed,
      pitch: customPitch,
      bass: customBass,
      treble: customTreble,
      lowpass: customLowpass,
      reverb: customReverb,
      delayTime: customDelayTime,
      delayFeedback: customDelayFeedback,
      delayMix: customDelayMix,
      gain: customGain,
    });

    engine.setSpeed(fx.speed);
    engine.setBassGain(fx.bassGain);
    engine.setTrebleGain(fx.trebleGain);
    engine.setLowpassFreq(fx.lowpassFreq);
    engine.setReverbMix(fx.reverbMix);
    engine.setDelay(fx.delayTime, fx.delayFeedback, fx.delayMix);
    engine.setPreservePitch(fx.preservePitch);
    engine.setMasterGain(fx.gain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customSpeed, customPitch, customBass, customTreble, customLowpass, customReverb, customDelayTime, customDelayFeedback, customDelayMix, customGain, engine.isReady]);

  // ── Waveform visualiser ──
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-panel-muted")
        .trim() || "#1f2937";
      ctx.fillRect(0, 0, W, H);

      if (!engine.isPlaying) return;

      const freq = engine.getFrequencyData();
      const barCount = Math.min(freq.length, 128);
      const barW = W / barCount;
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#f2ef13";

      for (let i = 0; i < barCount; i++) {
        const v = freq[i] / 255;
        const barH = v * H * 0.85;
        ctx.fillStyle = accent;
        ctx.fillRect(i * barW, H - barH, barW - 1, barH);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [engine.isPlaying, engine]);

  // ── File drop ──
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("audio/")) {
      setErrorMsg("Please upload an audio file (MP3, WAV, OGG, FLAC, etc.)");
      return;
    }
    setAudioFile(file);
    setPreset("none");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Export processed audio as WAV ──
  const handleExport = useCallback(async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMsg("");
    setDownloadUrl("");

    try {
      setProgress(10);

      // Decode raw audio
      const arrayBuf = await audioFile.arrayBuffer();
      const ctx = new AudioContext();
      const rawBuffer = await ctx.decodeAudioData(arrayBuf);
      ctx.close();
      setProgress(30);

      // Resolve effects
      const fx = resolvePreset(preset, {
        speed: customSpeed,
        pitch: customPitch,
        bass: customBass,
        treble: customTreble,
        lowpass: customLowpass,
        reverb: customReverb,
        delayTime: customDelayTime,
        delayFeedback: customDelayFeedback,
        delayMix: customDelayMix,
        gain: customGain,
      });

      // Process offline
      const processed = await renderAudioOffline(rawBuffer, fx);
      setProgress(80);

      // Encode to WAV
      const wavData = audioBufferToWav(processed);
      const blob = new Blob([wavData as any], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(100);
    } catch (err: any) {
      console.error("Export failed:", err);
      setErrorMsg(err.message || "Export failed.");
    } finally {
      setIsProcessing(false);
    }
  }, [audioFile, preset, customSpeed, customPitch, customBass, customTreble, customLowpass, customReverb, customDelayTime, customDelayFeedback, customDelayMix, customGain]);

  // ── Derived values ──
  const fx = resolvePreset(preset, {
    speed: customSpeed,
    pitch: customPitch,
    bass: customBass,
    treble: customTreble,
    lowpass: customLowpass,
    reverb: customReverb,
    delayTime: customDelayTime,
    delayFeedback: customDelayFeedback,
    delayMix: customDelayMix,
    gain: customGain,
  });

  const effectiveSemitones = fx.preservePitch
    ? 0
    : +(12 * Math.log2(fx.speed || 1)).toFixed(1);

  const processedDuration = engine.duration / (fx.speed || 1);

  const presetInfo: Record<string, string> = {
    bass_boost: "Heavy sub-bass boost at 110Hz (+14 dB). Perfect for car speakers and bass drops.",
    slowed_reverb: "Speed 0.85x · Pitch -2.8st · Reverb 40%. The viral TikTok sound.",
    nightcore: "Speed 1.25x · Pitch +3.9st. High-energy anime remix style.",
    lofi: "Slightly slowed · Cut highs · Warm reverb. Chill study beats aesthetic.",
    telephone: "Deep bass cut (-24 dB) · Boosted mids (+6 dB). Old phone line simulation.",
    chipmunk: "Speed 1.6x · Pitch +8.1st. Fun squeaky voice effect.",
    deep_voice: "Speed 0.7x · Bass +8 dB · Light reverb. Deep narrator / villain voice.",
    vaporwave: "Speed 0.78x · Reverb 55% · Pitched down. A E S T H E T I C.",
    underwater: "Muffled highs (800Hz lowpass) · Reverb 60% · Bass +6 dB.",
    echo_space: "0.5s Delay with feedback · Reverb 30%. Cavernous echoing effect.",
  };

  /* ────────────────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="w-full space-y-8">
      {/* ─── File Upload ─── */}
      <div
        className="neo-panel bg-[var(--bg-panel)] p-8"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!audioFile ? (
          <label className="flex flex-col items-center gap-4 cursor-pointer py-12">
            <div className="text-6xl">🎧</div>
            <p className="text-xl font-black uppercase tracking-widest text-[var(--text-main)]">
              Drop your audio file here
            </p>
            <p className="text-sm text-[var(--text-soft)] uppercase tracking-wider font-bold">
              MP3 · WAV · OGG · FLAC · M4A
            </p>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <span className="neo-button bg-[var(--accent)] px-6 py-3 text-sm font-black uppercase tracking-widest text-black mt-2">
              Browse Files
            </span>
          </label>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black uppercase tracking-wide text-[var(--text-main)] truncate max-w-md">
                  {fileName}
                </p>
                <p className="text-xs text-[var(--text-soft)] uppercase tracking-widest font-bold mt-1">
                  {fmtTime(engine.duration)} · {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                  {fx.speed !== 1 && (
                    <span className="ml-3">→ {fmtTime(processedDuration)} after effects</span>
                  )}
                </p>
              </div>
              <button
                className="neo-button bg-[var(--bg-panel-muted)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--text-main)]"
                onClick={() => {
                  engine.pause();
                  setAudioFile(null);
                  setFileName("");
                  setDownloadUrl("");
                }}
              >
                Change
              </button>
            </div>

            {/* Waveform */}
            <div className="border-4 border-black overflow-hidden">
              <canvas
                ref={waveformRef}
                width={800}
                height={120}
                className="w-full h-[120px]"
              />
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-4">
              <button
                className="neo-button bg-[var(--accent)] px-6 py-3 text-sm font-black uppercase tracking-widest text-black"
                onClick={() => (engine.isPlaying ? engine.pause() : engine.play())}
                disabled={!engine.isReady}
              >
                {engine.isPlaying ? "⏸ Pause" : "▶ Preview"}
              </button>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs font-black text-[var(--text-soft)] tabular-nums w-12 text-right">
                  {fmtTime(engine.currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={engine.duration || 1}
                  step={0.1}
                  value={engine.currentTime}
                  onChange={(e) => engine.seek(Number(e.target.value))}
                  className="flex-1 vis-range"
                />
                <span className="text-xs font-black text-[var(--text-soft)] tabular-nums w-12">
                  {fmtTime(engine.duration)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Effects Panel (only when file loaded) ─── */}
      {audioFile && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          {/* Left: Presets */}
          <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-5">
            <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
              Effect Presets
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`neo-button p-3 text-left transition-colors ${
                    preset === p.id
                      ? "bg-[var(--accent)] text-black"
                      : "bg-[var(--bg-panel-muted)] text-[var(--text-main)]"
                  }`}
                >
                  <span className="text-xl block mb-1">{p.icon}</span>
                  <span className="text-xs font-black uppercase tracking-wider block">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Preset description */}
            {preset !== "none" && preset !== "custom" && presetInfo[preset] && (
              <div className="p-3 border-4 border-black bg-[var(--bg-panel-muted)] text-xs font-bold tracking-wider text-[var(--text-soft)] uppercase">
                {presetInfo[preset]}
              </div>
            )}

            {/* Effect summary */}
            <div className="p-4 border-4 border-black bg-[var(--bg-panel-muted)] space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)] mb-2">
                Active Settings
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider">
                <div className="flex justify-between text-[var(--text-soft)]">
                  <span>Speed</span>
                  <span className="text-[var(--text-main)]">{fx.speed.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-[var(--text-soft)]">
                  <span>Pitch</span>
                  <span className="text-[var(--text-main)]">
                    {effectiveSemitones > 0 ? "+" : ""}{effectiveSemitones} st
                  </span>
                </div>
                <div className="flex justify-between text-[var(--text-soft)]">
                  <span>Bass</span>
                  <span className="text-[var(--text-main)]">
                    {fx.bassGain > 0 ? "+" : ""}{fx.bassGain} dB
                  </span>
                </div>
                <div className="flex justify-between text-[var(--text-soft)]">
                  <span>Reverb</span>
                  <span className="text-[var(--text-main)]">{Math.round(fx.reverbMix * 100)}%</span>
                </div>
                <div className="flex justify-between text-[var(--text-soft)]">
                  <span>Volume</span>
                  <span className="text-[var(--text-main)]">
                    {fx.gain > 0 ? "+" : ""}{fx.gain} dB
                  </span>
                </div>
                <div className="flex justify-between text-[var(--text-soft)]">
                  <span>Duration</span>
                  <span className="text-[var(--text-main)]">{fmtTime(processedDuration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Custom controls + Export */}
          <div className="space-y-8">
            {/* Custom sliders */}
            {preset === "custom" && (
              <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-5">
                <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
                  Custom Controls
                </h3>

                <div className="space-y-4 p-4 border-4 border-black bg-[var(--bg-panel-muted)]">
                  {/* Speed */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Speed</span>
                      <span className="text-[var(--text-main)]">{customSpeed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range" min="0.25" max="2.0" step="0.05"
                      value={customSpeed}
                      onChange={(e) => setCustomSpeed(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Pitch */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Pitch Shift</span>
                      <span className="text-[var(--text-main)]">
                        {customPitch > 0 ? "+" : ""}{customPitch} st
                      </span>
                    </div>
                    <input
                      type="range" min="-12" max="12" step="0.5"
                      value={customPitch}
                      onChange={(e) => setCustomPitch(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-soft)] mt-1">
                      <span>-1 Oct</span><span>0</span><span>+1 Oct</span>
                    </div>
                  </div>

                  {/* Bass */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Bass Boost</span>
                      <span className="text-[var(--text-main)]">
                        {customBass > 0 ? "+" : ""}{customBass} dB
                      </span>
                    </div>
                    <input
                      type="range" min="-24" max="24" step="1"
                      value={customBass}
                      onChange={(e) => setCustomBass(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Treble */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Treble</span>
                      <span className="text-[var(--text-main)]">
                        {customTreble > 0 ? "+" : ""}{customTreble} dB
                      </span>
                    </div>
                    <input
                      type="range" min="-24" max="24" step="1"
                      value={customTreble}
                      onChange={(e) => setCustomTreble(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Lowpass */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Lowpass Filter (Hz)</span>
                      <span className="text-[var(--text-main)]">
                        {customLowpass >= 20000 ? "Off" : customLowpass}
                      </span>
                    </div>
                    <input
                      type="range" min="200" max="20000" step="100"
                      value={customLowpass}
                      onChange={(e) => setCustomLowpass(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Delay */}
                  <div className="space-y-3">
                    <div className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                      Delay
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px] text-[var(--text-soft)] uppercase font-bold mb-1">Time (s)</div>
                        <input type="range" min="0" max="2" step="0.1" value={customDelayTime} onChange={(e) => setCustomDelayTime(Number(e.target.value))} className="w-full vis-range" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-soft)] uppercase font-bold mb-1">Feedback</div>
                        <input type="range" min="0" max="0.9" step="0.05" value={customDelayFeedback} onChange={(e) => setCustomDelayFeedback(Number(e.target.value))} className="w-full vis-range" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-soft)] uppercase font-bold mb-1">Mix</div>
                        <input type="range" min="0" max="1" step="0.05" value={customDelayMix} onChange={(e) => setCustomDelayMix(Number(e.target.value))} className="w-full vis-range" />
                      </div>
                    </div>
                  </div>

                  {/* Reverb */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Reverb</span>
                      <span className="text-[var(--text-main)]">{Math.round(customReverb * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="0.8" step="0.05"
                      value={customReverb}
                      onChange={(e) => setCustomReverb(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1 text-[var(--text-soft)]">
                      <span>Volume</span>
                      <span className="text-[var(--text-main)]">
                        {customGain > 0 ? "+" : ""}{customGain} dB
                      </span>
                    </div>
                    <input
                      type="range" min="-12" max="12" step="1"
                      value={customGain}
                      onChange={(e) => setCustomGain(Number(e.target.value))}
                      className="w-full vis-range"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            <div className="neo-panel bg-[var(--bg-panel)] p-6 space-y-4">
              <h3 className="text-2xl font-black uppercase italic text-[var(--text-main)]">
                Export Audio
              </h3>

              {errorMsg && (
                <div className="bg-red-100 border-l-8 border-red-500 p-4 text-xs font-black text-red-600 uppercase dark:bg-red-900/20 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                    <span>Processing…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-4 border-4 border-black bg-[var(--bg-panel-muted)]">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  className="neo-button bg-[var(--accent)] px-6 py-3 text-sm font-black uppercase tracking-widest text-black flex-1 min-w-[200px]"
                  onClick={handleExport}
                  disabled={isProcessing || !engine.isReady}
                >
                  {isProcessing ? "Processing…" : "🎧 Export as WAV"}
                </button>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`${fileName.replace(/\.[^.]+$/, "")}_fx.wav`}
                    className="neo-button bg-[var(--success)] px-6 py-3 text-sm font-black uppercase tracking-widest text-black flex-1 min-w-[200px] text-center"
                  >
                    ⬇ Download
                  </a>
                )}
              </div>

              {downloadUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                    Preview exported audio
                  </p>
                  <audio controls src={downloadUrl} className="w-full" />
                </div>
              )}

              <p className="text-[10px] text-[var(--text-soft)] uppercase tracking-wider font-bold">
                All processing happens locally in your browser. Your audio never leaves your device.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
