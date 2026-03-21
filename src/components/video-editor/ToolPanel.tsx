"use client";

import type { ToolId } from "./EditorToolbar";

type CropPreset = "free" | "16:9" | "1:1" | "9:16";
type FilterPreset = "none" | "grayscale" | "sepia" | "vintage";

type ToolPanelProps = {
  activeTab: ToolId;
  // Crop
  cropPreset: CropPreset;
  onCropPreset: (p: CropPreset) => void;
  onRotate: (deg: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  // Audio
  audioSrc: string;
  onUploadAudio: () => void;
  onClearAudio: () => void;
  playbackRate: number;
  onPlaybackRate: (v: number) => void;
  volume: number;
  onVolume: (v: number) => void;
  muted: boolean;
  onToggleMute: () => void;
  // Filters
  filterPreset: FilterPreset;
  onFilterPreset: (f: FilterPreset) => void;
  brightness: number;
  onBrightness: (v: number) => void;
  contrast: number;
  onContrast: (v: number) => void;
  saturation: number;
  onSaturation: (v: number) => void;
  // Text
  textOverlay: string;
  onTextOverlay: (v: string) => void;
  textSize: number;
  onTextSize: (v: number) => void;
  textY: number;
  onTextY: (v: number) => void;
  // Selection info (Trim tab)
  selectedClipInfo: {
    track: string;
    timelineStart: string;
    timelineEnd: string;
    sourceStart: string;
    sourceEnd: string;
  } | null;
};

function SliderRow({ label, value, min, max, step, onChange, suffix }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">
        {label}: {suffix ? `${Math.round(value)}${suffix}` : value.toFixed(2)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full accent-[var(--accent)]"
      />
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
      {children}
    </p>
  );
}

function SmallButton({ active, onClick, children }: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-3 border-[var(--border-main)] px-3 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)] ${
        active ? "bg-[var(--accent)]" : "bg-[var(--bg-panel)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function ToolPanel(props: ToolPanelProps) {
  const {
    activeTab,
    cropPreset, onCropPreset, onRotate, onFlipH, onFlipV,
    audioSrc, onUploadAudio, onClearAudio,
    playbackRate, onPlaybackRate,
    volume, onVolume,
    muted, onToggleMute,
    filterPreset, onFilterPreset,
    brightness, onBrightness,
    contrast, onContrast,
    saturation, onSaturation,
    textOverlay, onTextOverlay,
    textSize, onTextSize,
    textY, onTextY,
    selectedClipInfo,
  } = props;

  return (
    <div className="min-w-0 space-y-4">
      {activeTab === "Trim" && (
        <>
          <SectionTitle>Segment Info</SectionTitle>
          {selectedClipInfo ? (
            <div className="space-y-1 text-sm leading-6 text-[var(--text-soft)]">
              <p>
                <span className="font-black text-[var(--text-main)]">{selectedClipInfo.track}</span> clip
              </p>
              <p>
                Timeline: <span className="font-bold text-[var(--text-main)]">{selectedClipInfo.timelineStart}</span>{" "}
                → <span className="font-bold text-[var(--text-main)]">{selectedClipInfo.timelineEnd}</span>
              </p>
              <p>
                Source: <span className="font-bold text-[var(--text-main)]">{selectedClipInfo.sourceStart}</span>{" "}
                → <span className="font-bold text-[var(--text-main)]">{selectedClipInfo.sourceEnd}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Click a clip on the timeline to select it. Drag edges to trim, drag body to move.
            </p>
          )}
        </>
      )}

      {activeTab === "Crop" && (
        <>
          <SectionTitle>Aspect Ratio</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {(["free", "16:9", "1:1", "9:16"] as CropPreset[]).map((p) => (
              <SmallButton key={p} active={cropPreset === p} onClick={() => onCropPreset(p)}>
                {p}
              </SmallButton>
            ))}
          </div>
          <SectionTitle>Transform</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <SmallButton onClick={() => onRotate(-90)}>↺ -90°</SmallButton>
            <SmallButton onClick={() => onRotate(90)}>↻ +90°</SmallButton>
            <SmallButton onClick={onFlipH}>↔ Flip X</SmallButton>
            <SmallButton onClick={onFlipV}>↕ Flip Y</SmallButton>
          </div>
        </>
      )}

      {activeTab === "Audio" && (
        <>
          <SectionTitle>Audio Layer</SectionTitle>
          <button
            type="button"
            onClick={onUploadAudio}
            className="neo-button w-full bg-[var(--accent)] px-3 py-2.5 text-xs font-black uppercase tracking-wider"
          >
            {audioSrc ? "Replace Audio" : "Upload Audio"}
          </button>
          {audioSrc && (
            <button
              type="button"
              onClick={onClearAudio}
              className="neo-button w-full bg-[var(--bg-panel)] px-3 py-2.5 text-xs font-black uppercase tracking-wider"
            >
              Remove Audio
            </button>
          )}
          <SliderRow label="Speed" value={playbackRate} min={0.25} max={2} step={0.05} onChange={onPlaybackRate} suffix="x" />
          <SliderRow label="Volume" value={volume} min={0} max={1} step={0.01} onChange={onVolume} suffix="%" />
          <button
            type="button"
            onClick={onToggleMute}
            className="neo-button w-full bg-[var(--bg-panel)] px-3 py-2.5 text-xs font-black uppercase tracking-wider"
          >
            {muted ? "🔇 Unmute" : "🔊 Mute"}
          </button>
        </>
      )}

      {activeTab === "Filters" && (
        <>
          <SectionTitle>Presets</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {(["none", "grayscale", "sepia", "vintage"] as FilterPreset[]).map((f) => (
              <SmallButton key={f} active={filterPreset === f} onClick={() => onFilterPreset(f)}>
                {f}
              </SmallButton>
            ))}
          </div>
          <SliderRow label="Brightness" value={brightness} min={50} max={150} step={1} onChange={onBrightness} suffix="%" />
          <SliderRow label="Contrast" value={contrast} min={50} max={150} step={1} onChange={onContrast} suffix="%" />
          <SliderRow label="Saturation" value={saturation} min={0} max={200} step={1} onChange={onSaturation} suffix="%" />
        </>
      )}

      {activeTab === "Text" && (
        <>
          <SectionTitle>Text Overlay</SectionTitle>
          <textarea
            value={textOverlay}
            onChange={(e) => onTextOverlay(e.target.value)}
            rows={2}
            className="w-full border-3 border-[var(--border-main)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-bold outline-none shadow-[2px_2px_0_0_var(--border-main)]"
            placeholder="Enter text…"
          />
          <SliderRow label="Size" value={textSize} min={16} max={64} step={1} onChange={onTextSize} suffix="px" />
          <SliderRow label="Position" value={textY} min={0} max={80} step={1} onChange={onTextY} suffix="%" />
        </>
      )}
    </div>
  );
}
