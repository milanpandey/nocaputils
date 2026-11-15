"use client";

import { memo } from "react";
import type { ToolId } from "./EditorToolbar";
import type { CropMode, CropPreset, FilterPreset } from "./useUndoHistory";

const TEXT_COLOR_SWATCHES = [
  { label: "White", value: "#ffffff" },
  { label: "Yellow", value: "#f2ef13" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#ff4444" },
  { label: "Cyan", value: "#00ffff" },
] as const;

const FILTER_PRESETS: FilterPreset[] = [
  "none",
  "grayscale",
  "sepia",
  "vintage",
  "warm",
  "cool",
  "dramatic",
];

type ToolPanelProps = {
  activeTab: ToolId;
  // Trim
  selectedClipInfo: {
    track: string;
    timelineStart: string;
    timelineEnd: string;
    sourceStart: string;
    sourceEnd: string;
  } | null;
  onSplit: () => void;
  onTrimStartToPlayhead: () => void;
  onTrimEndToPlayhead: () => void;
  onDeleteSelected: () => void;
  canTrimStart: boolean;
  canTrimEnd: boolean;
  // Crop & Transform
  cropPreset: CropPreset;
  onCropPreset: (p: CropPreset) => void;
  cropMode: CropMode;
  onCropMode: (m: CropMode) => void;
  onRotate: (deg: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onResetTransform: () => void;
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
  keepOriginalAudio: boolean;
  onToggleKeepOriginalAudio: () => void;
  audioFadeIn: number;
  onAudioFadeIn: (v: number) => void;
  audioFadeOut: number;
  onAudioFadeOut: (v: number) => void;
  onResetAudio: () => void;
  // Filters
  filterPreset: FilterPreset;
  onFilterPreset: (f: FilterPreset) => void;
  brightness: number;
  onBrightness: (v: number) => void;
  contrast: number;
  onContrast: (v: number) => void;
  saturation: number;
  onSaturation: (v: number) => void;
  onResetFilters: () => void;
  // Text
  textOverlay: string;
  onTextOverlay: (v: string) => void;
  textSize: number;
  onTextSize: (v: number) => void;
  textX: number;
  onTextX: (v: number) => void;
  textY: number;
  onTextY: (v: number) => void;
  textColor: string;
  onTextColor: (c: string) => void;
  textBg: boolean;
  onToggleTextBg: () => void;
  onClearText: () => void;
};

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  displayMultiplier = 1,
  decimals,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
  displayMultiplier?: number;
  decimals?: number;
}) {
  const shown = value * displayMultiplier;
  const formatted =
    decimals !== undefined
      ? shown.toFixed(decimals)
      : suffix
        ? `${Math.round(shown)}`
        : shown.toFixed(2);

  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
        <span>{label}</span>
        <span className="font-mono font-black text-[var(--text-main)]">
          {formatted}
          {suffix ?? ""}
        </span>
      </div>
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

function SmallButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`border-3 border-[var(--border-main)] px-2 py-2 text-[11px] font-black uppercase tracking-wide shadow-[2px_2px_0_0_var(--border-main)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--border-main)] disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-[var(--accent)] text-black" : "bg-[var(--bg-panel)]"
      }`}
    >
      {children}
    </button>
  );
}

const ToolPanel = memo(function ToolPanel(props: ToolPanelProps) {
  const {
    activeTab,
    selectedClipInfo,
    onSplit,
    onTrimStartToPlayhead,
    onTrimEndToPlayhead,
    onDeleteSelected,
    canTrimStart,
    canTrimEnd,
    cropPreset,
    onCropPreset,
    cropMode,
    onCropMode,
    onRotate,
    onFlipH,
    onFlipV,
    onResetTransform,
    audioSrc,
    onUploadAudio,
    onClearAudio,
    playbackRate,
    onPlaybackRate,
    volume,
    onVolume,
    muted,
    onToggleMute,
    keepOriginalAudio,
    onToggleKeepOriginalAudio,
    audioFadeIn,
    onAudioFadeIn,
    audioFadeOut,
    onAudioFadeOut,
    onResetAudio,
    filterPreset,
    onFilterPreset,
    brightness,
    onBrightness,
    contrast,
    onContrast,
    saturation,
    onSaturation,
    onResetFilters,
    textOverlay,
    onTextOverlay,
    textSize,
    onTextSize,
    textX,
    onTextX,
    textY,
    onTextY,
    textColor,
    onTextColor,
    textBg,
    onToggleTextBg,
    onClearText,
  } = props;

  return (
    <div className="min-w-0 space-y-4">
      {activeTab === "Trim" && (
        <>
          <SectionTitle>Segment Info</SectionTitle>
          {selectedClipInfo ? (
            <div className="space-y-1.5 border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-3 text-xs leading-5 text-[var(--text-soft)]">
              <p className="uppercase">
                Track:{" "}
                <span className="font-black text-[var(--text-main)]">
                  {selectedClipInfo.track}
                </span>
              </p>
              <p>
                Timeline:{" "}
                <span className="font-mono font-bold text-[var(--text-main)]">
                  {selectedClipInfo.timelineStart} → {selectedClipInfo.timelineEnd}
                </span>
              </p>
              <p>
                Source:{" "}
                <span className="font-mono font-bold text-[var(--text-main)]">
                  {selectedClipInfo.sourceStart} → {selectedClipInfo.sourceEnd}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs leading-5 text-[var(--text-soft)]">
              Click a clip on the timeline to select it. Drag edges to trim, or position the playhead and use quick cut actions below.
            </p>
          )}

          <SectionTitle>Quick Actions</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <SmallButton
              active={Boolean(selectedClipInfo)}
              disabled={!selectedClipInfo}
              onClick={onSplit}
              title="Split selected clip at playhead (S)"
            >
              ✂ Split at Playhead (S)
            </SmallButton>
            <div className="grid grid-cols-2 gap-2">
              <SmallButton
                disabled={!canTrimStart}
                onClick={onTrimStartToPlayhead}
                title="Trim clip start to current playhead ([)"
              >
                [ Trim In
              </SmallButton>
              <SmallButton
                disabled={!canTrimEnd}
                onClick={onTrimEndToPlayhead}
                title="Trim clip end to current playhead (])"
              >
                ] Trim Out
              </SmallButton>
            </div>
            <SmallButton
              disabled={!selectedClipInfo}
              onClick={onDeleteSelected}
              title="Delete selected clip (Delete)"
            >
              🗑 Delete Clip (Del)
            </SmallButton>
          </div>
        </>
      )}

      {activeTab === "Tools" && (
        <>
          <SectionTitle>Mode</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <SmallButton
              active={cropMode === "letterbox"}
              onClick={() => onCropMode("letterbox")}
            >
              Letterbox
            </SmallButton>
            <SmallButton
              active={cropMode === "crop"}
              onClick={() => onCropMode("crop")}
            >
              Crop
            </SmallButton>
          </div>
          <p className="text-[10px] leading-4 text-[var(--text-soft)]">
            {cropMode === "letterbox"
              ? "Adds black bars to fit the aspect ratio. No content is cut."
              : "Fills the aspect frame cleanly. Edges outside the ratio are cropped."}
          </p>
          <SectionTitle>Aspect Ratio</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {(["free", "16:9", "1:1", "9:16"] as CropPreset[]).map((p) => (
              <SmallButton
                key={p}
                active={cropPreset === p}
                onClick={() => onCropPreset(p)}
              >
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
          <button
            type="button"
            onClick={onResetTransform}
            className="w-full border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2 py-1.5 text-[11px] font-black uppercase tracking-wider hover:bg-[var(--accent)] hover:text-black"
          >
            ↺ Reset Transform
          </button>
        </>
      )}

      {activeTab === "Audio" && (
        <>
          <SectionTitle>Audio Layer</SectionTitle>
          <button
            type="button"
            onClick={onUploadAudio}
            className="neo-button w-full bg-[var(--accent)] px-3 py-2 text-xs font-black uppercase tracking-wider text-black"
          >
            {audioSrc ? "Replace Audio" : "Upload Audio"}
          </button>
          {audioSrc && (
            <>
              <button
                type="button"
                onClick={onClearAudio}
                className="neo-button w-full bg-[var(--bg-panel)] px-3 py-2 text-xs font-black uppercase tracking-wider"
              >
                Remove Audio
              </button>
              <label className="flex cursor-pointer items-center justify-between gap-2 border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2.5 py-2 text-[11px] font-black uppercase">
                <span>Keep Video Audio</span>
                <input
                  type="checkbox"
                  checked={keepOriginalAudio}
                  onChange={onToggleKeepOriginalAudio}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>
            </>
          )}
          <SliderRow
            label="Speed"
            value={playbackRate}
            min={0.25}
            max={2}
            step={0.05}
            onChange={onPlaybackRate}
            decimals={2}
            suffix="x"
          />
          <SliderRow
            label="Volume"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={onVolume}
            displayMultiplier={100}
            suffix="%"
          />
          <div className="grid grid-cols-2 gap-2">
            <SliderRow
              label="Fade In"
              value={audioFadeIn}
              min={0}
              max={5}
              step={0.5}
              onChange={onAudioFadeIn}
              decimals={1}
              suffix="s"
            />
            <SliderRow
              label="Fade Out"
              value={audioFadeOut}
              min={0}
              max={5}
              step={0.5}
              onChange={onAudioFadeOut}
              decimals={1}
              suffix="s"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SmallButton active={muted} onClick={onToggleMute}>
              {muted ? "🔇 Unmute" : "🔊 Mute"}
            </SmallButton>
            <SmallButton onClick={onResetAudio}>↺ Reset</SmallButton>
          </div>
        </>
      )}

      {activeTab === "Filters" && (
        <>
          <SectionTitle>Presets</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {FILTER_PRESETS.map((f) => (
              <SmallButton
                key={f}
                active={filterPreset === f}
                onClick={() => onFilterPreset(f)}
              >
                {f}
              </SmallButton>
            ))}
          </div>
          <SliderRow
            label="Brightness"
            value={brightness}
            min={50}
            max={150}
            step={1}
            onChange={onBrightness}
            suffix="%"
          />
          <SliderRow
            label="Contrast"
            value={contrast}
            min={50}
            max={150}
            step={1}
            onChange={onContrast}
            suffix="%"
          />
          <SliderRow
            label="Saturation"
            value={saturation}
            min={0}
            max={200}
            step={1}
            onChange={onSaturation}
            suffix="%"
          />
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2 py-1.5 text-[11px] font-black uppercase tracking-wider hover:bg-[var(--accent)] hover:text-black"
          >
            ↺ Reset Filters
          </button>
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
          <SliderRow
            label="Size"
            value={textSize}
            min={16}
            max={64}
            step={1}
            onChange={onTextSize}
            suffix="px"
          />
          <div className="grid grid-cols-2 gap-2">
            <SliderRow
              label="Pos X"
              value={textX}
              min={10}
              max={90}
              step={1}
              onChange={onTextX}
              suffix="%"
            />
            <SliderRow
              label="Pos Y"
              value={textY}
              min={10}
              max={90}
              step={1}
              onChange={onTextY}
              suffix="%"
            />
          </div>
          <p className="text-[10px] leading-4 text-[var(--text-soft)]">
            Tip: Drag the text directly on the video preview to position it.
          </p>
          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
              Text Color
            </span>
            <div className="flex items-center gap-2">
              {TEXT_COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => onTextColor(swatch.value)}
                  aria-label={`Set text color to ${swatch.label}`}
                  title={swatch.label}
                  className={`h-7 w-7 border-3 border-[var(--border-main)] transition-transform ${
                    textColor === swatch.value
                      ? "scale-110 ring-2 ring-[var(--accent)]"
                      : "opacity-85 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: swatch.value }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SmallButton active={textBg} onClick={onToggleTextBg}>
              {textBg ? "■ Bg Box On" : "□ Bg Box Off"}
            </SmallButton>
            <SmallButton disabled={!textOverlay} onClick={onClearText}>
              ✕ Clear
            </SmallButton>
          </div>
        </>
      )}
    </div>
  );
});

export default ToolPanel;
